import { NetworkDevice, NetworkLink, SimulationStep, PacketHeaders } from '../types/network';
import { ipToNumber, prefixToNumber } from './networkingMath';

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
  protocol: 'ICMP' | 'HTTP' | 'DNS' | 'ARP' = 'ICMP'
): SimulationStep[] {
  const srcDevice = devices.find((d) => d.id === srcDeviceId);
  const dstDevice = devices.find((d) => d.id === dstDeviceId);

  if (!srcDevice || !dstDevice) return [];

  const srcIface = srcDevice.interfaces[0];
  const dstIface = dstDevice.interfaces[0];

  const srcIp = srcIface?.ip || '0.0.0.0';
  const dstIp = dstIface?.ip || '0.0.0.0';
  const srcMask = srcIface?.subnetMask || '255.255.255.0';
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
          type: '0x0800 (IPv4)',
          fcs: '0x00000000',
        },
        payload: 'Packet dropped at NIC: No physical link or path exists to reach destination.',
      },
      explanation: {
        title: 'Transmission Failed: No Physical Layer 1 Link',
        whatHappened: `Device ${srcDevice.name} attempted to transmit, but no active cable link connects it toward ${dstDevice.name}.`,
        decisionReason: 'Physical layer interfaces must be cabled with status "up" to form an electrical or optical circuit.',
        layerMechanism: 'Layer 1 Physical Signaling Failure',
        rulesApplied: [
          'Packets cannot traverse disconnected physical ports.',
          'Verify cable links in the canvas and ensure interface status is set to UP.',
        ],
      },
    });
    return steps;
  }

  const { path, linkIds } = pathResult;
  const isLocal = isSameSubnet(srcIp, dstIp, srcMask);

  // Check default gateway if remote
  if (!isLocal && !srcDevice.defaultGateway) {
    steps.push({
      stepIndex: 1,
      totalSteps: 1,
      fromDeviceId: srcDeviceId,
      toDeviceId: srcDeviceId,
      linkId: '',
      protocol,
      packetName: 'Destination Host Unreachable',
      headers: {
        ethernet: {
          preamble: '1010101010101011',
          sourceMac: srcMac,
          destMac: '00:00:00:00:00:00',
          type: '0x0800 (IPv4)',
          fcs: '0x00000000',
        },
        ip: {
          version: 4,
          ihl: 5,
          dscp: '0x00',
          totalLength: 60,
          identification: '0x1A2B',
          flags: '0x02 (Don\'t Fragment)',
          fragmentOffset: 0,
          ttl: 64,
          protocol: 'ICMP (1)',
          headerChecksum: '0x4F12',
          sourceIp: srcIp,
          destIp: dstIp,
        },
        payload: 'ICMP Destination Host Unreachable: No Default Gateway configured on sender.',
      },
      explanation: {
        title: 'Missing Default Gateway Error',
        whatHappened: `${srcDevice.name} realized that destination IP ${dstIp} is outside its local subnet (${srcMask}). Because no Default Gateway is configured, ${srcDevice.name} has no router to forward the packet to.`,
        decisionReason: 'A host performs a bitwise AND between destination IP and its subnet mask. If they differ, the packet MUST be forwarded to the Default Gateway.',
        layerMechanism: 'Layer 3 Subnet Boundary Routing Rule',
        rulesApplied: [
          'Remote subnets cannot be reached without an IP Default Gateway.',
          'Open Device Configuration and configure the Default Gateway to match the local router interface IP.',
        ],
      },
    });
    return steps;
  }

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
        totalLength: protocol === 'HTTP' ? 240 : 64,
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
          ? 'GET /index.html HTTP/1.1\r\nHost: ' + dstIp
          : protocol === 'DNS'
          ? 'Standard Query: A record for www.netlearn.internal'
          : 'abcdefghijklmnopqrstuvwabcdefghi (32 Bytes ICMP Echo Data)',
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

  // Return trip (Echo Reply / Response)
  const returnPath = [...path].reverse();
  const returnLinkIds = [...linkIds].reverse();

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
          ? 'HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n<h1>Welcome to NetLearn</h1>'
          : protocol === 'DNS'
          ? 'Standard Query Response: 192.168.10.100'
          : 'abcdefghijklmnopqrstuvwabcdefghi (32 Bytes Echo Reply Payload)',
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
