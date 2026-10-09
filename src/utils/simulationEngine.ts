import { NetworkDevice, NetworkLink, PacketHeaders, SimulationStep } from '../types/network';
import { ipToNumber } from './networkingMath';

function parseIpv4(ip: string): number | null {
  const octets = ip.split('.');
  if (octets.length !== 4 || octets.some((octet) => !/^\d{1,3}$/.test(octet))) {
    return null;
  }

  const values = octets.map(Number);
  if (values.some((octet) => octet < 0 || octet > 255)) return null;

  return values.reduce((value, octet) => ((value << 8) | octet) >>> 0, 0);
}

function isValidSubnetMask(mask: string): boolean {
  const value = parseIpv4(mask);
  if (value === null) return false;

  const inverted = (~value) >>> 0;
  return (inverted & (inverted + 1)) === 0;
}

function prefixLength(mask: string): number {
  const value = parseIpv4(mask);
  return value === null ? -1 : value.toString(2).replace(/0/g, '').length;
}

function normalizedInterfaceName(name: string): string {
  const normalized = name.toLowerCase().replace(/[^a-z0-9/]/g, '');
  return normalized
    .replace(/^gigabitethernet/, 'gi')
    .replace(/^fastethernet/, 'fa')
    .replace(/^tengigabitethernet/, 'te')
    .replace(/^serial/, 'se');
}

function getDevicePortOnLink(link: NetworkLink, deviceId: string): string | null {
  if (link.sourceDeviceId === deviceId) return link.sourcePortId;
  if (link.targetDeviceId === deviceId) return link.targetPortId;
  return null;
}

function hasGatewayOnPath(
  devices: NetworkDevice[],
  path: string[],
  gateway: string | undefined,
  hostIp: string,
  subnetMask: string,
): boolean {
  if (!gateway || parseIpv4(gateway) === null) return false;
  return path.some((deviceId) => {
    const device = devices.find((item) => item.id === deviceId);
    return device?.type === 'router' &&
      device.powerState === 'on' &&
      device.interfaces.some((networkInterface) =>
        networkInterface.status === 'up' &&
        networkInterface.ip === gateway &&
        isSameSubnet(hostIp, networkInterface.ip, subnetMask)
      );
  });
}

function hasForwardingRoute(
  router: NetworkDevice,
  egressInterfaceId: string,
  destinationIp: string,
): boolean {
  const egressInterface = router.interfaces.find((networkInterface) =>
    networkInterface.id === egressInterfaceId && networkInterface.status === 'up'
  );
  if (!egressInterface) return false;

  const destination = parseIpv4(destinationIp);
  if (destination === null) return false;

  const routes: Array<{ mask: number; network: number; prefix: number; interfaceId: string }> = [];
  for (const networkInterface of router.interfaces) {
    if (networkInterface.status !== 'up' || !networkInterface.ip ||
        !networkInterface.subnetMask || !isValidSubnetMask(networkInterface.subnetMask)) {
      continue;
    }

    const address = parseIpv4(networkInterface.ip);
    const mask = parseIpv4(networkInterface.subnetMask);
    if (address !== null && mask !== null) {
      routes.push({
        mask,
        network: (address & mask) >>> 0,
        prefix: prefixLength(networkInterface.subnetMask),
        interfaceId: networkInterface.id,
      });
    }
  }

  for (const route of router.routingTable || []) {
    const network = parseIpv4(route.destinationNetwork);
    const mask = parseIpv4(route.subnetMask);
    const networkInterface = router.interfaces.find((item) =>
      normalizedInterfaceName(item.name) === normalizedInterfaceName(route.interfaceName)
    );
    if (network !== null && mask !== null && networkInterface?.status === 'up' &&
        isValidSubnetMask(route.subnetMask)) {
      routes.push({
        mask,
        network: (network & mask) >>> 0,
        prefix: prefixLength(route.subnetMask),
        interfaceId: networkInterface.id,
      });
    }
  }

  const matchingRoutes = routes
    .filter((route) => (destination & route.mask) >>> 0 === route.network)
    .sort((left, right) => right.prefix - left.prefix);
  return matchingRoutes[0]?.interfaceId === egressInterface.id;
}

function createDropStep(
  device: NetworkDevice,
  protocol: SimulationStep['protocol'],
  title: string,
  reason: string,
  sourceIp?: string,
  destinationIp?: string,
): SimulationStep {
  const sourceMac = device.interfaces[0]?.mac || '00:00:00:00:00:01';
  const ethernetType = protocol === 'ARP' ? '0x0806 (ARP)' : '0x0800 (IPv4)';

  return {
    stepIndex: 1,
    totalSteps: 1,
    fromDeviceId: device.id,
    toDeviceId: device.id,
    linkId: '',
    protocol,
    packetName: `${protocol} Drop Error`,
    headers: {
      ethernet: {
        preamble: '1010101010101011',
        sourceMac,
        destMac: '00:00:00:00:00:00',
        type: ethernetType,
        fcs: '0x00000000',
      },
      ...(protocol !== 'ARP' && sourceIp && destinationIp && {
        ip: {
          version: 4,
          ihl: 5,
          dscp: '0x00',
          totalLength: 60,
          identification: '0x0000',
          flags: '0x02 (DF set)',
          fragmentOffset: 0,
          ttl: 64,
          protocol: protocol === 'HTTP' ? 'TCP (6)' : protocol === 'DNS' ? 'UDP (17)' : 'ICMP (1)',
          headerChecksum: 'not calculated',
          sourceIp,
          destIp: destinationIp,
        },
      }),
      payload: reason,
    },
    explanation: {
      title,
      whatHappened: reason,
      decisionReason: reason,
      layerMechanism: 'IPv4 configuration validation',
      rulesApplied: [reason],
    },
  };
}

// Check if two IPv4 addresses are in the same subnet
export function isSameSubnet(ip1: string, ip2: string, mask: string): boolean {
  if (!ip1 || !ip2 || !mask) return false;
  try {
    const num1 = ipToNumber(ip1);
    const num2 = ipToNumber(ip2);
    const maskNum = ipToNumber(mask);
    return (num1 & maskNum) === (num2 & maskNum);
  } catch {
    return false;
  }
}

// Find path through network graph
export function findDevicePath(
  devices: NetworkDevice[],
  links: NetworkLink[],
  startId: string,
  endId: string
): { path: string[]; linkIds: string[] } | null {
  const devicesById = new Map(devices.map((device) => [device.id, device]));
  const isOperationalEndpoint = (deviceId: string, interfaceId: string) => {
    const device = devicesById.get(deviceId);
    const networkInterface = device?.interfaces.find((item) => item.id === interfaceId);
    return device?.powerState === 'on' &&
      networkInterface?.status === 'up' &&
      !networkInterface.isConsole;
  };

  if (!devicesById.has(startId) || !devicesById.has(endId)) return null;

  const queue: Array<{ current: string; path: string[]; linkIds: string[] }> = [
    { current: startId, path: [startId], linkIds: [] },
  ];
  const visited = new Set<string>([startId]);

  while (queue.length > 0) {
    const { current, path, linkIds } = queue.shift()!;
    if (current === endId) {
      return { path, linkIds };
    }

    // Find all links connected to current where status is UP
    const connectedLinks = links.filter(
      (l) =>
        l.status === 'up' &&
        l.cableType !== 'console' &&
        isOperationalEndpoint(l.sourceDeviceId, l.sourcePortId) &&
        isOperationalEndpoint(l.targetDeviceId, l.targetPortId) &&
        (l.sourceDeviceId === current || l.targetDeviceId === current)
    );

    for (const link of connectedLinks) {
      const neighborId =
        link.sourceDeviceId === current ? link.targetDeviceId : link.sourceDeviceId;
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        queue.push({
          current: neighborId,
          path: [...path, neighborId],
          linkIds: [...linkIds, link.id],
        });
      }
    }
  }

  return null;
}

// Generate complete step-by-step simulation trace
export function generateSimulationTrace(
  devices: NetworkDevice[],
  links: NetworkLink[],
  srcDeviceId: string,
  dstDeviceId: string,
  protocol: 'ICMP' | 'HTTP' | 'DNS' | 'ARP' = 'ICMP',
  messagePayload = 'Hello from NetLearn',
): SimulationStep[] {
  const srcDevice = devices.find((d) => d.id === srcDeviceId);
  const dstDevice = devices.find((d) => d.id === dstDeviceId);

  if (!srcDevice || !dstDevice) return [];

  const srcIface = srcDevice.interfaces[0];
  const dstIface = dstDevice.interfaces[0];

  const srcIp = srcIface?.ip || '0.0.0.0';
  const dstIp = dstIface?.ip || '0.0.0.0';
  const srcMask = srcIface?.subnetMask || '255.255.255.0';
  const dstMask = dstIface?.subnetMask || '255.255.255.0';
  const srcMac = srcIface?.mac || '00:00:00:00:00:01';
  const dstMac = dstIface?.mac || '00:00:00:00:00:02';

  const pathResult = findDevicePath(devices, links, srcDeviceId, dstDeviceId);
  const steps: SimulationStep[] = [];

  // If physically disconnected
  if (!pathResult) {
    steps.push({
      stepIndex: 1,
      totalSteps: 1,
      fromDeviceId: srcDeviceId,
      toDeviceId: srcDeviceId,
      linkId: '',
      protocol,
      packetName: `${protocol} Drop Error`,
      headers: {
        ethernet: {
          preamble: '1010101010101011',
          sourceMac: srcMac,
          destMac: 'FF:FF:FF:FF:FF:FF',
          type: protocol === 'ARP' ? '0x0806 (ARP)' : '0x0800 (IPv4)',
          fcs: '0x00000000',
        },
        payload: 'Packet dropped at NIC: No operational physical path reaches the destination. Check device power, interface state, and link endpoints.',
      },
      explanation: {
        title: 'Transmission Failed: No Operational Physical Path',
        whatHappened: `Device ${srcDevice.name} attempted to transmit, but no operational physical path reaches ${dstDevice.name}.`,
        decisionReason: 'A path requires powered-on devices, active network interfaces at both link endpoints, and links that are up.',
        layerMechanism: 'Layer 1 Physical Signaling Failure',
        rulesApplied: [
          'Packets cannot traverse links whose endpoint interface is disabled or whose device is powered off.',
          'Console cables are management connections and are not simulated as packet-carrying links.',
          'This reachability check models physical connectivity only; it does not prove routing or application delivery.',
        ],
      },
    });
    return steps;
  }

  const { path, linkIds } = pathResult;

  if (parseIpv4(srcIp) === null || parseIpv4(dstIp) === null) {
    return [createDropStep(
      srcDevice,
      protocol,
      'Invalid IPv4 Address',
      `A valid IPv4 address is required at both endpoints. Source: ${srcIp}; destination: ${dstIp}.`,
      srcIp,
      dstIp,
    )];
  }

  if (!srcIface?.subnetMask || !dstIface?.subnetMask ||
      !isValidSubnetMask(srcMask) || !isValidSubnetMask(dstMask)) {
    return [createDropStep(
      srcDevice,
      protocol,
      'Invalid Subnet Mask',
      `Both endpoint interfaces need valid, contiguous IPv4 subnet masks. Source: ${srcMask}; destination: ${dstMask}.`,
      srcIp,
      dstIp,
    )];
  }

  const activeAddresses = devices
    .filter((device) => device.powerState === 'on')
    .flatMap((device) => device.interfaces
      .filter((networkInterface) => networkInterface.status === 'up')
      .map((networkInterface) => ({ ip: networkInterface.ip, device: device.name })));
  const duplicateEndpointAddress = [srcIp, dstIp].find((address) =>
    activeAddresses.filter((active) => active.ip === address).length > 1
  );

  if (duplicateEndpointAddress) {
    const conflictNames = activeAddresses
      .filter((active) => active.ip === duplicateEndpointAddress)
      .map((active) => active.device);
    return [createDropStep(
      srcDevice,
      protocol,
      'Duplicate IPv4 Address',
      `IPv4 address ${duplicateEndpointAddress} is configured on multiple active interfaces (${conflictNames.join(', ')}).`,
      srcIp,
      dstIp,
    )];
  }

  const isLocal = isSameSubnet(srcIp, dstIp, srcMask);

  if (protocol === 'ARP' && !isLocal) {
    return [createDropStep(
      srcDevice,
      protocol,
      'ARP Cannot Cross a Router',
      `ARP resolves local-link IPv4 neighbors; ${dstIp} is outside ${srcDevice.name}'s subnet and ARP requests are not routed.`,
      srcIp,
      dstIp,
    )];
  }

  // Check default gateway if remote
  if (!isLocal && !srcDevice.defaultGateway) {
    return [createDropStep(
      srcDevice,
      protocol,
      'Missing Default Gateway',
      `${srcDevice.name} identified ${dstIp} as outside its local subnet but has no default gateway configured.`,
      srcIp,
      dstIp,
    )];
  }

  if (!isLocal) {
    if (!hasGatewayOnPath(devices, path, srcDevice.defaultGateway, srcIp, srcMask)) {
      return [createDropStep(
        srcDevice,
        protocol,
        'Default Gateway Is Not Reachable',
        `Configured gateway ${srcDevice.defaultGateway || '(invalid)'} is not an active router interface on the source subnet and physical path.`,
        srcIp,
        dstIp,
      )];
    }
  }

  for (let pathIndex = 1; pathIndex < path.length - 1; pathIndex++) {
    const router = devices.find((device) => device.id === path[pathIndex]);
    if (router?.type !== 'router') continue;

    const outgoingLink = links.find((link) => link.id === linkIds[pathIndex]);
    const egressInterfaceId = outgoingLink && getDevicePortOnLink(outgoingLink, router.id);
    if (!egressInterfaceId ||
        !hasForwardingRoute(router, egressInterfaceId, dstIp)) {
      return [createDropStep(
        router,
        protocol,
        'No Route to Destination',
        `${router.name} has no active longest-prefix route to ${dstIp} through the physical path's outgoing interface.`,
        srcIp,
        dstIp,
      )];
    }
  }

  const returnPath = [...path].reverse();
  const returnLinkIds = [...linkIds].reverse();

  // Build hop-by-hop forwarding steps
  let ttl = 64;
  let currentSrcMac = srcMac;

  for (let i = 0; i < path.length - 1; i++) {
    const hopFromId = path[i];
    const hopToId = path[i + 1];
    const linkId = linkIds[i];

    const hopFrom = devices.find((d) => d.id === hopFromId)!;
    const hopTo = devices.find((d) => d.id === hopToId)!;

    let targetMacForHop = dstMac;
    if (hopTo.type === 'router') {
      targetMacForHop = hopTo.interfaces[0]?.mac || '00:RR:01:00:00:01';
    } else if (hopFrom.type === 'router') {
      ttl -= 1;
      currentSrcMac = hopFrom.interfaces[1]?.mac || hopFrom.interfaces[0]?.mac;
      targetMacForHop = dstMac;
    }

    let actionTitle = '';
    let explanationText = '';
    let layerMechanism = '';
    let rules: string[] = [];

    if (hopFrom.type === 'pc' || hopFrom.type === 'laptop') {
      actionTitle = `${hopFrom.name} Formulates & Sends ${protocol} Packet`;
      explanationText = isLocal
        ? `${hopFrom.name} bitwise ANDed destination IP ${dstIp} with mask ${srcMask} and determined it is in the same local subnet. Directly addressing target MAC ${targetMacForHop}.`
        : `${hopFrom.name} determined destination IP ${dstIp} is remote. Forwarding to Default Gateway ${srcDevice.defaultGateway} with Router MAC ${targetMacForHop}.`;
      layerMechanism = 'Layer 3 Logical Addressing -> Layer 2 Frame Encapsulation';
      rules = [
        'Local host lookup: (Dest IP & Subnet Mask) == (Source IP & Subnet Mask).',
        'ARP cache provides Layer 2 MAC resolution for the next physical hop.',
      ];
    } else if (hopFrom.type === 'switch') {
      actionTitle = `${hopFrom.name} Inspects CAM Table & Forwards Frame`;
      explanationText = `${hopFrom.name} received frame on port, recorded Source MAC ${currentSrcMac} in its MAC Address Table, and looked up Destination MAC ${targetMacForHop}. Forwarding frame out dedicated port.`;
      layerMechanism = 'Layer 2 Transparent Bridging & MAC Address Learning';
      rules = [
        'Switches learn Source MACs dynamically on incoming ports.',
        'Switches forward known unicast frames directly to the mapped destination port.',
      ];
    } else if (hopFrom.type === 'router') {
      actionTitle = `${hopFrom.name} Performs Routing Table Lookup & TTL Decrement`;
      explanationText = `${hopFrom.name} inspected Destination IP ${dstIp}, verified routing table entries via Longest Prefix Match, decremented TTL from 64 to ${ttl}, recalculated the IPv4 checksum, and re-encapsulated the frame with its egress interface MAC.`;
      layerMechanism = 'Layer 3 IPv4 Forwarding & TTL Decrement';
      rules = [
        'Routers decrement TTL by 1 at every hop to prevent infinite routing loops.',
        'Routers strip Layer 2 headers and rewrite new Source & Destination MAC addresses for the next physical link.',
      ];
    }

    const headers: PacketHeaders = {
      ethernet: {
        preamble: '1010101010101011',
        sourceMac: currentSrcMac,
        destMac: targetMacForHop,
        type: '0x0800 (IPv4)',
        fcs: '0x7F2A9B1C',
      },
      ip: {
        version: 4,
        ihl: 5,
        dscp: '0x00',
        totalLength: protocol === 'HTTP' ? 40 + new TextEncoder().encode(messagePayload).length : 64,
        identification: `0x${(1000 + i).toString(16).toUpperCase()}`,
        flags: '0x02 (Don\'t Fragment)',
        fragmentOffset: 0,
        ttl,
        protocol: protocol === 'HTTP' ? 'TCP (6)' : protocol === 'DNS' ? 'UDP (17)' : 'ICMP (1)',
        headerChecksum: '0x3A21',
        sourceIp: srcIp,
        destIp: dstIp,
      },
      transport: {
        protocol: protocol === 'HTTP' ? 'TCP' : protocol === 'DNS' ? 'UDP' : 'ICMP',
        sourcePort: protocol === 'HTTP' ? 52340 : protocol === 'DNS' ? 53210 : undefined,
        destPort: protocol === 'HTTP' ? 80 : protocol === 'DNS' ? 53 : undefined,
        seqNum: protocol === 'HTTP' ? 1001 : undefined,
        ackNum: protocol === 'HTTP' ? 5001 : undefined,
        flags: protocol === 'HTTP' ? ['ACK', 'PSH'] : undefined,
        icmpType: protocol === 'ICMP' ? 'Echo Request (Type 8, Code 0)' : undefined,
      },
      payload:
        protocol === 'HTTP'
          ? `POST /message HTTP/1.1\r\nHost: ${dstIp}\r\nContent-Type: text/plain\r\nContent-Length: ${new TextEncoder().encode(messagePayload).length}\r\n\r\n${messagePayload}`
          : protocol === 'DNS'
          ? `Standard Query: A record for ${messagePayload}`
          : messagePayload,
    };

    steps.push({
      stepIndex: i + 1,
      totalSteps: (path.length - 1) * 2,
      fromDeviceId: hopFromId,
      toDeviceId: hopToId,
      linkId,
      protocol,
      packetName: `${protocol} Request (${hopFrom.name} -> ${hopTo.name})`,
      headers,
      explanation: {
        title: actionTitle,
        whatHappened: `Packet traversed link from ${hopFrom.name} to ${hopTo.name}.`,
        decisionReason: explanationText,
        layerMechanism,
        rulesApplied: rules,
      },
    });
  }

  const appendReturnDrop = (device: NetworkDevice, title: string, reason: string) => {
    const drop = createDropStep(device, protocol, title, reason, dstIp, srcIp);
    steps.push({
      ...drop,
      stepIndex: steps.length + 1,
      totalSteps: steps.length + 1,
    });
    steps.forEach((step, index) => {
      step.stepIndex = index + 1;
      step.totalSteps = steps.length;
    });
    return steps;
  };

  if (!isLocal && !hasGatewayOnPath(
    devices,
    returnPath,
    dstDevice.defaultGateway,
    dstIp,
    dstMask,
  )) {
    return appendReturnDrop(
      dstDevice,
      'No Return Gateway',
      `${dstDevice.name} received the request, but has no active default gateway on the return path to ${srcIp}.`,
    );
  }

  for (let pathIndex = 1; pathIndex < returnPath.length - 1; pathIndex++) {
    const router = devices.find((device) => device.id === returnPath[pathIndex]);
    if (router?.type !== 'router') continue;

    const outgoingLink = links.find((link) => link.id === returnLinkIds[pathIndex]);
    const egressInterfaceId = outgoingLink && getDevicePortOnLink(outgoingLink, router.id);
    if (!egressInterfaceId || !hasForwardingRoute(router, egressInterfaceId, srcIp)) {
      return appendReturnDrop(
        router,
        'No Return Route',
        `${router.name} has no active longest-prefix route to ${srcIp} through the return path's outgoing interface.`,
      );
    }
  }

  // Return trip (Echo Reply / Response)
  for (let j = 0; j < returnPath.length - 1; j++) {
    const hopFromId = returnPath[j];
    const hopToId = returnPath[j + 1];
    const linkId = returnLinkIds[j];

    const hopFrom = devices.find((d) => d.id === hopFromId)!;
    const hopTo = devices.find((d) => d.id === hopToId)!;

    const returnHeaders: PacketHeaders = {
      ethernet: {
        preamble: '1010101010101011',
        sourceMac: dstMac,
        destMac: srcMac,
        type: '0x0800 (IPv4)',
        fcs: '0x992B1C44',
      },
      ip: {
        version: 4,
        ihl: 5,
        dscp: '0x00',
        totalLength: protocol === 'HTTP' ? 512 : 64,
        identification: `0x${(2000 + j).toString(16).toUpperCase()}`,
        flags: '0x02',
        fragmentOffset: 0,
        ttl: 64 - j,
        protocol: protocol === 'HTTP' ? 'TCP (6)' : protocol === 'DNS' ? 'UDP (17)' : 'ICMP (1)',
        headerChecksum: '0x88F2',
        sourceIp: dstIp,
        destIp: srcIp,
      },
      transport: {
        protocol: protocol === 'HTTP' ? 'TCP' : protocol === 'DNS' ? 'UDP' : 'ICMP',
        sourcePort: protocol === 'HTTP' ? 80 : 53,
        destPort: protocol === 'HTTP' ? 52340 : 53210,
        seqNum: protocol === 'HTTP' ? 5001 : undefined,
        ackNum: protocol === 'HTTP' ? 1241 : undefined,
        icmpType: protocol === 'ICMP' ? 'Echo Reply (Type 0, Code 0)' : undefined,
      },
      payload:
        protocol === 'HTTP'
          ? `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\n${messagePayload}`
          : protocol === 'DNS'
          ? `Standard Query Response for ${messagePayload} (educational example)`
          : messagePayload,
    };

    steps.push({
      stepIndex: path.length - 1 + j + 1,
      totalSteps: (path.length - 1) * 2,
      fromDeviceId: hopFromId,
      toDeviceId: hopToId,
      linkId,
      protocol,
      packetName: `${protocol} Reply (${hopFrom.name} -> ${hopTo.name})`,
      headers: returnHeaders,
      isReturnTrip: true,
      explanation: {
        title: `${hopFrom.name} Returns ${protocol} Response to ${hopTo.name}`,
        whatHappened: `Target node successfully received the request and transmitted the corresponding response.`,
        decisionReason: `Destination host inverted Source and Destination IP addresses and returned the reply.`,
        layerMechanism: 'Two-Way Full-Duplex Network Protocol Exchange',
        rulesApplied: [
          'ICMP Echo Reply uses Type 0 Code 0 matching the original Sequence Identifier.',
          'TCP / HTTP transactions require bidirectional connectivity across all transit routers.',
        ],
      },
    });
  }

  return steps;
}
