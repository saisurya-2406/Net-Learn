import { AccessListRule, NetworkDevice, NetworkLink, PacketHeaders, SimulationProtocol, SimulationStep } from '../types/network';
import { ipToNumber } from './networkingMath';
import { calculateRoutingTables } from './routingEngine';
import { ApplicationProtocol, APPLICATION_PROTOCOLS, getApplicationProtocol } from './protocolCatalog';

function aclAddressMatches(address: string, ruleAddress: string): boolean {
  if (ruleAddress === 'any') return true;
  const [network, prefixText] = ruleAddress.split('/');
  const addressNumber = parseIpv4(address), networkNumber = parseIpv4(network);
  const prefix = Number(prefixText);
  if (addressNumber === null || networkNumber === null || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) return false;
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return ((addressNumber & mask) >>> 0) === ((networkNumber & mask) >>> 0);
}

function aclPermits(router: NetworkDevice, interfaceId: string, direction: 'in' | 'out', source: string, destination: string, protocol: SimulationProtocol, port?: number): boolean {
  const iface = router.interfaces.find(item => item.id === interfaceId);
  const aclId = direction === 'in' ? iface?.aclInbound : iface?.aclOutbound;
  if (!aclId) return true;
  const rules = (router.accessLists || []).filter(rule => rule.number === aclId);
  if (!rules.length) return false;
  const transport = protocol === 'HTTP' || protocol === 'FTP' || protocol === 'SMTP' || protocol === 'POP3' || protocol === 'TELNET' || protocol === 'SSH' || protocol === 'AAA' || protocol === 'TCP'
    ? 'tcp'
    : protocol === 'DNS' || protocol === 'DHCP' || protocol === 'NTP' || protocol === 'SNMP' || protocol === 'TFTP' || protocol === 'RTP' || protocol === 'UDP' ? 'udp' : 'icmp';
  const match = (rule: AccessListRule) => (rule.protocol === 'ip' || rule.protocol === transport) &&
    aclAddressMatches(source, rule.source) && aclAddressMatches(destination, rule.destination) &&
    (rule.destinationPort === undefined || rule.destinationPort === port);
  return rules.find(match)?.action === 'permit';
}

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
  const linksById = new Map(links.map(link => [link.id, link]));
  // Deterministic spanning forest for switch-to-switch links prevents Layer 2 loops.
  const switchParent = new Map(devices.filter(device => device.type === 'switch').map(device => [device.id, device.id]));
  const findRoot = (id: string): string => {
    const parent = switchParent.get(id);
    if (!parent || parent === id) return id;
    const root = findRoot(parent);
    switchParent.set(id, root);
    return root;
  };
  const stpBlockedLinks = new Set<string>();
  const portChannels = new Set<string>();
  [...links].sort((left, right) => left.id.localeCompare(right.id)).forEach(link => {
    const left = devicesById.get(link.sourceDeviceId), right = devicesById.get(link.targetDeviceId);
    if (link.status !== 'up' || link.cableType === 'console' || left?.type !== 'switch' || right?.type !== 'switch' ||
        left.spanningTreeMode === 'off' || right.spanningTreeMode === 'off') return;
    const leftPort = left.interfaces.find(iface => iface.id === link.sourcePortId), rightPort = right.interfaces.find(iface => iface.id === link.targetPortId);
    const bundleKey = left.id < right.id ? `${left.id}:${right.id}:${leftPort?.channelGroup}:${leftPort?.channelProtocol}` : `${right.id}:${left.id}:${rightPort?.channelGroup}:${rightPort?.channelProtocol}`;
    if (leftPort?.channelGroup && rightPort?.channelGroup && leftPort.channelGroup === rightPort.channelGroup && leftPort.channelProtocol && leftPort.channelProtocol === rightPort.channelProtocol) {
      if (portChannels.has(bundleKey)) return;
      portChannels.add(bundleKey);
    }
    const leftRoot = findRoot(left.id), rightRoot = findRoot(right.id);
    if (leftRoot === rightRoot) stpBlockedLinks.add(link.id);
    else switchParent.set(leftRoot, rightRoot);
  });
  const isOperationalEndpoint = (deviceId: string, interfaceId: string) => {
    const device = devicesById.get(deviceId);
    const networkInterface = device?.interfaces.find((item) => item.id === interfaceId);
    return device?.powerState === 'on' &&
      networkInterface?.status === 'up' &&
      !networkInterface.isConsole;
  };
  const wirelessCompatible = (link: NetworkLink) => {
    if (link.cableType !== 'wireless') return true;
    const leftDevice = devicesById.get(link.sourceDeviceId), rightDevice = devicesById.get(link.targetDeviceId);
    if (!leftDevice || !rightDevice) return false;
    const ap = leftDevice.type === 'access_point' ? leftDevice : rightDevice.type === 'access_point' ? rightDevice : undefined;
    const client = ap === leftDevice ? rightDevice : leftDevice;
    const apConfig = ap?.wirelessConfig, clientConfig = client.wirelessConfig;
    return Boolean(ap && ['pc', 'laptop', 'ip_phone'].includes(client.type) && apConfig && clientConfig &&
      apConfig.ssid === clientConfig.ssid && apConfig.ssid.length <= 32 && apConfig.security === clientConfig.security &&
      (apConfig.security === 'open' || Boolean(apConfig.passphrase && apConfig.passphrase.length >= 8 && apConfig.passphrase.length <= 63 && apConfig.passphrase === clientConfig.passphrase)));
  };
  const channelCompatible = (link: NetworkLink) => {
    const leftDevice = devicesById.get(link.sourceDeviceId), rightDevice = devicesById.get(link.targetDeviceId);
    const left = leftDevice?.interfaces.find(item => item.id === link.sourcePortId), right = rightDevice?.interfaces.find(item => item.id === link.targetPortId);
    if (!left || !right) return false;
    if (left.channelGroup || right.channelGroup) return Boolean(leftDevice?.type === 'switch' && rightDevice?.type === 'switch' && left.channelGroup && right.channelGroup && left.channelGroup === right.channelGroup && left.channelProtocol && left.channelProtocol === right.channelProtocol);
    return true;
  };
  const wanCompatible = (link: NetworkLink) => {
    const left = devicesById.get(link.sourceDeviceId)?.interfaces.find(item => item.id === link.sourcePortId);
    const right = devicesById.get(link.targetDeviceId)?.interfaces.find(item => item.id === link.targetPortId);
    if (!left || !right) return false;
    const serial = link.cableType === 'serial' || /serial/i.test(left.name) || /serial/i.test(right.name);
    if (!serial && [left.encapsulation, right.encapsulation].some(value => value === 'hdlc' || value === 'ppp' || value === 'frame-relay')) return false;
    const leftEncap = left.encapsulation || (serial ? 'hdlc' : undefined);
    const rightEncap = right.encapsulation || (serial ? 'hdlc' : undefined);
    if (serial && (!leftEncap || !rightEncap || leftEncap !== rightEncap || leftEncap === 'pppoe')) return false;
    if ((leftEncap === 'pppoe' || rightEncap === 'pppoe') && leftEncap !== rightEncap) return false;
    if ((leftEncap === 'frame-relay' || rightEncap === 'frame-relay') &&
      (leftEncap !== 'frame-relay' || rightEncap !== 'frame-relay' || !left.frameRelayDlci || !right.frameRelayDlci)) return false;
    return true;
  };
  const negotiatedTrunk = (local: NetworkDevice['interfaces'][number], peer?: NetworkDevice['interfaces'][number]) => {
    if (local.mode === 'trunk') return true;
    if (local.mode === 'access' || !peer) return false;
    if (local.mode === 'dynamic-desirable') return peer.mode !== 'access';
    return peer.mode === 'trunk' || peer.mode === 'dynamic-desirable';
  };
  const portOnLink = (link: NetworkLink, deviceId: string) => {
    const portId = link.sourceDeviceId === deviceId ? link.sourcePortId : link.targetPortId;
    return devicesById.get(deviceId)?.interfaces.find(item => item.id === portId);
  };

  if (!devicesById.has(startId) || !devicesById.has(endId)) return null;

  const queue: Array<{ current: string; incomingPort: string | null; frameVlan: number | null; path: string[]; linkIds: string[] }> = [
    { current: startId, incomingPort: null, frameVlan: null, path: [startId], linkIds: [] },
  ];

  while (queue.length > 0) {
    const { current, incomingPort, frameVlan, path, linkIds } = queue.shift()!;
    if (current === endId) {
      return { path, linkIds };
    }

    // Find all links connected to current where status is UP
    const connectedLinks = links.filter(
      (l) =>
        l.status === 'up' &&
        wanCompatible(l) &&
        wirelessCompatible(l) &&
        channelCompatible(l) &&
        l.cableType !== 'console' &&
        !stpBlockedLinks.has(l.id) &&
        isOperationalEndpoint(l.sourceDeviceId, l.sourcePortId) &&
        isOperationalEndpoint(l.targetDeviceId, l.targetPortId) &&
        (l.sourceDeviceId === current || l.targetDeviceId === current)
    );

    for (const link of connectedLinks) {
      const neighborId =
        link.sourceDeviceId === current ? link.targetDeviceId : link.sourceDeviceId;
      if (path.includes(neighborId)) continue;
      const outgoingPort = link.sourceDeviceId === current ? link.sourcePortId : link.targetPortId;
      const currentDevice = devicesById.get(current)!;
      let nextFrameVlan = frameVlan;
      if (currentDevice.type === 'switch' && incomingPort) {
        const ingress = currentDevice.interfaces.find(item => item.id === incomingPort);
        const egress = currentDevice.interfaces.find(item => item.id === outgoingPort);
        if (!ingress || !egress) continue;
        const ingressLink = incomingPort ? links.find(item => (item.sourceDeviceId === current && item.sourcePortId === incomingPort) || (item.targetDeviceId === current && item.targetPortId === incomingPort)) : undefined;
        const ingressPeer = ingressLink && portOnLink(ingressLink, ingressLink.sourceDeviceId === current ? ingressLink.targetDeviceId : ingressLink.sourceDeviceId);
        const egressLink = linksById.get(link.id);
        const egressPeer = egressLink && portOnLink(egressLink, neighborId);
        const ingressMode = negotiatedTrunk(ingress, ingressPeer) ? 'trunk' : 'access';
        const egressMode = negotiatedTrunk(egress, egressPeer) ? 'trunk' : 'access';
        const vlan = ingressMode === 'access' ? ingress.vlan || 1 : frameVlan || 1;
        nextFrameVlan = vlan;
        if (egressMode === 'access' && (egress.vlan || 1) !== vlan) continue;
        if (egressMode === 'trunk' && egress.allowedVlans && !egress.allowedVlans.includes(vlan)) continue;
        if (ingressMode === 'trunk' && ingress.allowedVlans && !ingress.allowedVlans.includes(vlan)) continue;
      }
      const neighbor = devicesById.get(neighborId);
      if (neighbor?.type === 'switch') {
        const neighborPortId = linksById.get(link.id)?.sourceDeviceId === neighborId ? link.sourcePortId : link.targetPortId;
        const neighborPort = neighbor.interfaces.find(item => item.id === neighborPortId);
        if (!neighborPort) continue;
        nextFrameVlan = negotiatedTrunk(neighborPort, portOnLink(link, current)) ? nextFrameVlan || 1 : neighborPort.vlan || 1;
      }
      queue.push({
        current: neighborId,
        incomingPort: linksById.get(link.id)?.sourceDeviceId === neighborId ? link.sourcePortId : link.targetPortId,
        frameVlan: nextFrameVlan,
        path: [...path, neighborId],
        linkIds: [...linkIds, link.id],
      });
    }
  }

  return null;
}

/** Learn source MAC addresses on switch ingress ports along a simulated request/reply path. */
export function learnSwitchMacAddresses(
  devices: NetworkDevice[],
  links: NetworkLink[],
  sourceDeviceId: string,
  destinationDeviceId: string,
): NetworkDevice[] {
  const pathResult = findDevicePath(devices, links, sourceDeviceId, destinationDeviceId);
  if (!pathResult || pathResult.path.length < 3) return devices;
  const linkById = new Map(links.map(link => [link.id, link]));
  const deviceById = new Map(devices.map(device => [device.id, device]));
  const updates = new Map<string, NetworkDevice>();
  const learnDirection = (path: string[], linkIds: string[], sourceId: string) => {
    const source = deviceById.get(sourceId);
    const endpointMac = source?.interfaces.find(item => !item.isConsole)?.mac;
    if (!endpointMac) return;
    for (let index = 1; index < path.length - 1; index++) {
      const switchId = path[index];
      const currentSwitch = updates.get(switchId) || deviceById.get(switchId);
      if (currentSwitch?.type !== 'switch') continue;
      const previousRouterIndex = path.slice(0, index).map((id, pathIndex) => deviceById.get(id)?.type === 'router' ? pathIndex : -1).filter(pathIndex => pathIndex >= 0).at(-1);
      let sourceMac = endpointMac;
      if (previousRouterIndex !== undefined) {
        const router = deviceById.get(path[previousRouterIndex]);
        const routerEgressLink = linkById.get(linkIds[previousRouterIndex]);
        if (router && routerEgressLink) {
          const routerPortId = routerEgressLink.sourceDeviceId === router.id ? routerEgressLink.sourcePortId : routerEgressLink.targetPortId;
          sourceMac = router.interfaces.find(item => item.id === routerPortId)?.mac || endpointMac;
        }
      }
      const ingressLink = linkById.get(linkIds[index - 1]);
      if (!ingressLink) continue;
      const ingressPortId = ingressLink.sourceDeviceId === switchId ? ingressLink.sourcePortId : ingressLink.targetPortId;
      const ingress = currentSwitch.interfaces.find(item => item.id === ingressPortId);
      if (!ingress) continue;
      const vlan = ingress.vlan || 1;
      const table = (currentSwitch.macTable || []).filter(entry => !(entry.mac.toLowerCase() === sourceMac.toLowerCase() && entry.vlan === vlan));
      table.push({ mac: sourceMac, port: ingress.name, vlan, type: 'DYNAMIC' });
      updates.set(switchId, { ...currentSwitch, macTable: table });
    }
  };
  learnDirection(pathResult.path, pathResult.linkIds, sourceDeviceId);
  learnDirection([...pathResult.path].reverse(), [...pathResult.linkIds].reverse(), destinationDeviceId);
  return devices.map(device => updates.get(device.id) || device);
}

function ipv6Number(value: string): bigint | null {
  const address = value.split('/')[0].toLowerCase();
  if (!address || address.includes('.')) return null;
  const halves = address.split('::');
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(':') : [];
  const right = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  const missing = 8 - left.length - right.length;
  if ((halves.length === 1 && missing !== 0) || (halves.length === 2 && missing < 1)) return null;
  const groups = [...left, ...Array(missing).fill('0'), ...right];
  if (groups.length !== 8 || groups.some(group => !/^[0-9a-f]{1,4}$/.test(group))) return null;
  return groups.reduce((result, group) => (result << 16n) | BigInt(`0x${group}`), 0n);
}

function ipv6PrefixOf(iface: NetworkDevice['interfaces'][number]): number | null {
  const inline = iface.ipv6?.split('/')[1];
  const value = inline === undefined ? iface.ipv6Prefix : Number(inline);
  return Number.isInteger(value) && value! >= 0 && value! <= 128 ? value! : null;
}

function ipv6Matches(address: string, prefixText: string): boolean {
  const [network, prefixRaw] = prefixText.split('/');
  const addressValue = ipv6Number(address), networkValue = ipv6Number(network);
  const prefix = Number(prefixRaw);
  if (addressValue === null || networkValue === null || !Number.isInteger(prefix) || prefix < 0 || prefix > 128) return false;
  const shift = BigInt(128 - prefix);
  return (addressValue >> shift) === (networkValue >> shift);
}

function ipv6RouterForwards(router: NetworkDevice, egressId: string, destination: string): boolean {
  if (!router.ipv6RoutingEnabled) return false;
  const routes = router.interfaces.flatMap(iface => {
    const prefix = ipv6PrefixOf(iface);
    return iface.status === 'up' && iface.ipv6 && prefix !== null
      ? [{ prefix: `${iface.ipv6.split('/')[0]}/${prefix}`, interfaceName: iface.name, length: prefix }]
      : [];
  }).concat((router.ipv6Routes || []).flatMap(route => {
    const length = Number(route.prefix.split('/')[1]);
    return Number.isInteger(length) && length >= 0 && length <= 128
      ? [{ prefix: route.prefix, interfaceName: route.interfaceName, length }]
      : [];
  }));
  const matching = routes.filter(route => ipv6Matches(destination, route.prefix)).sort((a, b) => b.length - a.length);
  const egress = router.interfaces.find(iface => iface.id === egressId && iface.status === 'up');
  return Boolean(egress && matching[0]?.interfaceName === egress.name);
}

function generateIcmpv6Trace(devices: NetworkDevice[], links: NetworkLink[], sourceId: string, targetId: string, message: string): SimulationStep[] {
  const source = devices.find(device => device.id === sourceId)!;
  const target = devices.find(device => device.id === targetId)!;
  const sourceIface = source.interfaces.find(iface => iface.status === 'up' && iface.ipv6);
  const targetIface = target.interfaces.find(iface => iface.status === 'up' && iface.ipv6);
  const pathResult = findDevicePath(devices, links, sourceId, targetId);
  const src6 = sourceIface?.ipv6?.split('/')[0] || '';
  const dst6 = targetIface?.ipv6?.split('/')[0] || '';
  const sourceMac = sourceIface?.mac || '00:00:00:00:00:01';
  const targetMac = targetIface?.mac || '00:00:00:00:00:02';
  const drop = (device: NetworkDevice, explanation: string): SimulationStep[] => [{
    stepIndex: 1, totalSteps: 1, fromDeviceId: device.id, toDeviceId: device.id, linkId: '', protocol: 'ICMPv6', packetName: 'ICMPv6 Drop',
    headers: { ethernet: { preamble: '1010101010101011', sourceMac: device.interfaces[0]?.mac || sourceMac, destMac: '00:00:00:00:00:00', type: '0x86DD (IPv6)', fcs: 'not calculated' }, ipv6: { version: 6, trafficClass: '0x00', flowLabel: '0x00000', payloadLength: 8 + new TextEncoder().encode(message).length, nextHeader: '58 (ICMPv6)', hopLimit: 64, sourceIpv6: src6, destIpv6: dst6 }, payload: explanation },
    explanation: { title: 'ICMPv6 delivery failed', whatHappened: explanation, decisionReason: explanation, layerMechanism: 'IPv6 forwarding', rulesApplied: [explanation] },
  }];
  if (!pathResult) return drop(source, 'No operational physical path reaches the destination.');
  if (!ipv6Number(src6) || !ipv6Number(dst6)) return drop(source, 'Both endpoint interfaces require valid IPv6 addresses.');
  const { path, linkIds } = pathResult;
  const isLocal = ipv6Matches(dst6, `${src6}/${ipv6PrefixOf(sourceIface!) ?? 0}`);
  if (!isLocal && !source.defaultGatewayV6) return drop(source, 'The destination is outside the source prefix and no IPv6 default gateway is configured.');
  if (!isLocal && (!ipv6Matches(source.defaultGatewayV6!, `${src6}/${ipv6PrefixOf(sourceIface!) ?? 0}`) || !path.some(id => devices.find(device => device.id === id)?.interfaces.some(iface => iface.status === 'up' && iface.ipv6?.split('/')[0] === source.defaultGatewayV6)))) return drop(source, `IPv6 gateway ${source.defaultGatewayV6} is not an active on-link router interface on the selected path.`);
  for (const direction of [{ nodes: path, edgeIds: linkIds, destination: dst6 }, { nodes: [...path].reverse(), edgeIds: [...linkIds].reverse(), destination: src6 }]) {
    for (let index = 1; index < direction.nodes.length - 1; index++) {
      const router = devices.find(device => device.id === direction.nodes[index]);
      if (router?.type !== 'router') continue;
      const link = links.find(item => item.id === direction.edgeIds[index]);
      const egressId = link && getDevicePortOnLink(link, router.id);
      if (!egressId || !ipv6RouterForwards(router, egressId, direction.destination)) return drop(router, `${router.name} has no IPv6 route to ${direction.destination} through the selected egress interface.`);
    }
  }
  const makeStep = (fromId: string, toId: string, linkId: string, returnTrip: boolean, index: number): SimulationStep => {
    const from = devices.find(device => device.id === fromId)!;
    const to = devices.find(device => device.id === toId)!;
    const fromIface = from.interfaces.find(iface => !iface.isConsole);
    const toIface = to.interfaces.find(iface => !iface.isConsole);
    const routerEgress = from.type === 'router' ? links.find(item => item.id === linkId) : undefined;
    const egressId = routerEgress && getDevicePortOnLink(routerEgress, from.id);
    return {
      stepIndex: index + 1, totalSteps: (path.length - 1) * 2, fromDeviceId: fromId, toDeviceId: toId, linkId, protocol: 'ICMPv6', packetName: `ICMPv6 ${returnTrip ? 'Echo Reply' : 'Echo Request'} (${from.name} → ${to.name})`, isReturnTrip: returnTrip,
      headers: { ethernet: { preamble: '1010101010101011', sourceMac: (egressId && from.interfaces.find(iface => iface.id === egressId)?.mac) || fromIface?.mac || sourceMac, destMac: toIface?.mac || targetMac, type: '0x86DD (IPv6)', fcs: 'not calculated' }, ipv6: { version: 6, trafficClass: '0x00', flowLabel: '0x00000', payloadLength: 8 + new TextEncoder().encode(message).length, nextHeader: '58 (ICMPv6)', hopLimit: 64 - Math.floor(index / 2), sourceIpv6: returnTrip ? dst6 : src6, destIpv6: returnTrip ? src6 : dst6 }, transport: { protocol: 'ICMP', icmpType: returnTrip ? 'Echo Reply (Type 129)' : 'Echo Request (Type 128)' }, payload: message },
      explanation: { title: `${from.name} forwards an ICMPv6 ${returnTrip ? 'reply' : 'request'}`, whatHappened: `IPv6 packet traversed the link from ${from.name} to ${to.name}.`, decisionReason: 'IPv6 routers choose the longest matching prefix and decrement Hop Limit.', layerMechanism: 'IPv6 and ICMPv6 forwarding', rulesApplied: ['Ethernet IPv6 EtherType is 0x86DD.', 'ICMPv6 Echo Request is type 128; Echo Reply is type 129.', 'Routers decrement IPv6 Hop Limit.'] },
    };
  };
  const steps = [...path.slice(0, -1).map((id, index) => makeStep(id, path[index + 1], linkIds[index], false, index)), ...[...path].reverse().slice(0, -1).map((id, index) => makeStep(id, [...path].reverse()[index + 1], [...linkIds].reverse()[index], true, path.length - 1 + index))];
  return steps.map((step, index) => ({ ...step, stepIndex: index + 1, totalSteps: steps.length }));
}

// Generate complete step-by-step simulation trace
export function generateSimulationTrace(
  inputDevices: NetworkDevice[],
  links: NetworkLink[],
  srcDeviceId: string,
  dstDeviceId: string,
  protocol: SimulationProtocol = 'ICMP',
  messagePayload = 'Hello from NetLearn',
): SimulationStep[] {
  const devices = calculateRoutingTables(inputDevices, links);
  const srcDevice = devices.find((d) => d.id === srcDeviceId);
  const dstDevice = devices.find((d) => d.id === dstDeviceId);

  if (!srcDevice || !dstDevice) return [];
  if (protocol === 'ICMPv6') return generateIcmpv6Trace(devices, links, srcDeviceId, dstDeviceId, messagePayload);

  const srcIface = srcDevice.interfaces[0];
  const dstIface = dstDevice.interfaces[0];

  const srcIp = srcIface?.ip || '0.0.0.0';
  const dstIp = dstIface?.ip || '0.0.0.0';
  const srcMask = srcIface?.subnetMask || '255.255.255.0';
  const dstMask = dstIface?.subnetMask || '255.255.255.0';
  const srcMac = srcIface?.mac || '00:00:00:00:00:01';
  const dstMac = dstIface?.mac || '00:00:00:00:00:02';
  const appConfig = protocol !== 'ARP' && protocol in APPLICATION_PROTOCOLS
    ? getApplicationProtocol(protocol as ApplicationProtocol)
    : undefined;
  const transportProtocol = appConfig?.transport || 'ICMP';
  const servicePort = appConfig?.port;
  const requestPayload = protocol === 'HTTP'
    ? `POST /message HTTP/1.1\r\nHost: ${dstIp}\r\nContent-Type: text/plain\r\nContent-Length: ${new TextEncoder().encode(messagePayload).length}\r\n\r\n${messagePayload}`
    : protocol === 'DNS'
    ? `Standard Query: A record for ${messagePayload}`
    : protocol === 'SNMP'
    ? `${dstDevice.serverServices?.snmp?.version || 'SNMPv2c'} GetRequest community=${messagePayload.replace(/^community=/, '')} oid=1.3.6.1.2.1.1.5.0 (sysName.0)`
    : protocol === 'AAA'
    ? `${dstDevice.serverServices?.aaa?.protocol || 'RADIUS'} Access-Request credentials=${messagePayload}`
    : protocol === 'DHCP'
    ? 'DHCPDISCOVER xid=0x4E4C0001 options=subnet-mask,router,dns-server,lease-time'
    : protocol === 'ARP'
    ? `Who has ${dstIp}? Tell ${srcIp}`
    : protocol === 'ICMP' ? messagePayload : `${protocol} request: ${messagePayload}`;

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

  const transportKind = transportProtocol === 'TCP' ? 'tcp' : transportProtocol === 'UDP' ? 'udp' : 'icmp';
  for (const firewallId of path.slice(1, -1)) {
    const firewall = devices.find(device => device.id === firewallId);
    const policy = firewall?.type === 'firewall' ? firewall.firewallConfig : undefined;
    if (!policy?.enabled) continue;
    const matched = policy.rules.find(rule => (rule.protocol === 'any' || rule.protocol === transportKind) && (rule.destinationPort === undefined || rule.destinationPort === servicePort));
    if ((matched?.action || policy.defaultAction) === 'deny') return [createDropStep(firewall!, protocol, 'Firewall Policy Denied', `${firewall!.name} denied the new ${transportKind.toUpperCase()} flow by its ordered policy.`, srcIp, dstIp)];
  }

  const natTranslation = protocol !== 'ARP' ? path.slice(1, -1).map((routerId, offset) => {
    const router = devices.find(device => device.id === routerId);
    const index = offset + 1;
    if (router?.type !== 'router' || !router.natOverload) return null;
    const inboundLink = links.find(link => link.id === linkIds[index - 1]);
    const outboundLink = links.find(link => link.id === linkIds[index]);
    const inboundId = inboundLink && getDevicePortOnLink(inboundLink, router.id);
    const outboundId = outboundLink && getDevicePortOnLink(outboundLink, router.id);
    const inside = router.interfaces.find(iface => iface.id === inboundId && iface.natRole === 'inside');
    const outside = router.interfaces.find(iface => iface.id === outboundId && iface.natRole === 'outside' && iface.name === router.natOverload!.outsideInterface);
    const rules = (router.accessLists || []).filter(rule => rule.number === router.natOverload!.aclNumber);
    const sourceRule = rules.find(rule => aclAddressMatches(srcIp, rule.source));
    return inside && outside?.ip && sourceRule?.action === 'permit'
      ? { routerId: router.id, pathIndex: index, insideIp: srcIp, outsideIp: outside.ip, translatedPort: servicePort === undefined ? undefined : 40000 + ((parseIpv4(srcIp) || 0) % 20000) }
      : null;
  }).find(Boolean) || null : null;

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

  if (protocol === 'SNMP' && dstDevice.serverServices?.snmp) {
    const agent = dstDevice.serverServices.snmp;
    const suppliedCommunity = messagePayload.replace(/^community=/, '');
    if (!agent.enabled) return [createDropStep(dstDevice, protocol, 'SNMP Agent Disabled', `${dstDevice.name} has its SNMP agent disabled.`, srcIp, dstIp)];
    if (!agent.community || suppliedCommunity !== agent.community) return [createDropStep(dstDevice, protocol, 'SNMP Community Rejected', 'The supplied SNMP community does not match the configured read community.', srcIp, dstIp)];
  }
  if (protocol === 'AAA' && dstDevice.serverServices?.aaa) {
    const service = dstDevice.serverServices.aaa;
    if (!service.enabled) return [createDropStep(dstDevice, protocol, 'AAA Service Disabled', `${dstDevice.name} has its AAA service disabled.`, srcIp, dstIp)];
    const separator = messagePayload.indexOf(':');
    const user = service.users.find(item => item.username === messagePayload.slice(0, separator) && item.password === messagePayload.slice(separator + 1));
    if (separator < 1 || !user) return [createDropStep(dstDevice, protocol, 'AAA Authentication Rejected', 'The configured AAA service rejected the supplied username/password pair.', srcIp, dstIp)];
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
    const incomingLink = links.find(link => link.id === linkIds[pathIndex - 1]);
    const ingressInterfaceId = incomingLink && getDevicePortOnLink(incomingLink, router.id);
    if (protocol !== 'ARP' && ingressInterfaceId && !aclPermits(router, ingressInterfaceId, 'in', srcIp, dstIp, protocol, servicePort)) {
      return [createDropStep(router, protocol, 'Inbound ACL Denied', `${router.name} denied ${protocol} traffic on its inbound interface access list.`, srcIp, dstIp)];
    }
    if (protocol !== 'ARP' && egressInterfaceId && !aclPermits(router, egressInterfaceId, 'out', srcIp, dstIp, protocol, servicePort)) {
      return [createDropStep(router, protocol, 'Outbound ACL Denied', `${router.name} denied ${protocol} traffic on its outbound interface access list.`, srcIp, dstIp)];
    }
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
    const hopLink = links.find(link => link.id === linkId);
    const egressPortId = hopLink && getDevicePortOnLink(hopLink, hopFromId);
    const qosIface = hopFrom.interfaces.find(iface => iface.id === egressPortId);
    const dscp = qosIface?.qos?.dscp ?? ({ low: 8, normal: 0, high: 32, voice: 46 } as const)[qosIface?.qos?.priority || 'normal'];

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
        dscp: `0x${Math.max(0, Math.min(63, dscp)).toString(16).padStart(2, '0').toUpperCase()}`,
        totalLength: protocol === 'HTTP' ? 40 + new TextEncoder().encode(messagePayload).length : 64,
        identification: `0x${(1000 + i).toString(16).toUpperCase()}`,
        flags: '0x02 (Don\'t Fragment)',
        fragmentOffset: 0,
        ttl,
        protocol: transportProtocol === 'TCP' ? 'TCP (6)' : transportProtocol === 'UDP' ? 'UDP (17)' : 'ICMP (1)',
        headerChecksum: '0x3A21',
        sourceIp: natTranslation && i >= natTranslation.pathIndex ? natTranslation.outsideIp : srcIp,
        destIp: dstIp,
      },
      transport: {
        protocol: transportProtocol,
        sourcePort: servicePort === undefined ? undefined : natTranslation && i >= natTranslation.pathIndex ? natTranslation.translatedPort : 52340,
        destPort: servicePort,
        seqNum: transportProtocol === 'TCP' ? 1001 : undefined,
        ackNum: transportProtocol === 'TCP' ? 5001 : undefined,
        flags: transportProtocol === 'TCP' ? ['ACK', 'PSH'] : undefined,
        icmpType: protocol === 'ICMP' ? 'Echo Request (Type 8, Code 0)' : undefined,
      },
      payload: requestPayload,
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
        whatHappened: natTranslation?.routerId === hopFrom.id ? `NAT overload translated source ${natTranslation.insideIp} to ${natTranslation.outsideIp} before forwarding.` : `Packet traversed link from ${hopFrom.name} to ${hopTo.name}.`,
        decisionReason: natTranslation?.routerId === hopFrom.id ? `${explanationText} PAT overload selected the configured outside interface address ${natTranslation.outsideIp} for this inside source.` : explanationText,
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
    const incomingLink = links.find(link => link.id === returnLinkIds[pathIndex - 1]);
    const ingressInterfaceId = incomingLink && getDevicePortOnLink(incomingLink, router.id);
    const returnPort = servicePort === undefined ? undefined : 52340;
    if (protocol !== 'ARP' && ingressInterfaceId && !aclPermits(router, ingressInterfaceId, 'in', dstIp, srcIp, protocol, returnPort)) {
      return appendReturnDrop(router, 'Inbound ACL Denied', `${router.name} denied return ${protocol} traffic on its inbound interface access list.`);
    }
    if (protocol !== 'ARP' && egressInterfaceId && !aclPermits(router, egressInterfaceId, 'out', dstIp, srcIp, protocol, returnPort)) {
      return appendReturnDrop(router, 'Outbound ACL Denied', `${router.name} denied return ${protocol} traffic on its outbound interface access list.`);
    }
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
    const reverseNatIndex = natTranslation ? path.length - 1 - natTranslation.pathIndex : Infinity;

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
        protocol: transportProtocol === 'TCP' ? 'TCP (6)' : transportProtocol === 'UDP' ? 'UDP (17)' : 'ICMP (1)',
        headerChecksum: '0x88F2',
        sourceIp: dstIp,
        destIp: natTranslation && j < reverseNatIndex ? natTranslation.outsideIp : srcIp,
      },
      transport: {
        protocol: transportProtocol,
        sourcePort: servicePort,
        destPort: servicePort === undefined ? undefined : natTranslation && j < reverseNatIndex ? natTranslation.translatedPort : 52340,
        seqNum: transportProtocol === 'TCP' ? 5001 : undefined,
        ackNum: transportProtocol === 'TCP' ? 1241 : undefined,
        icmpType: protocol === 'ICMP' ? 'Echo Reply (Type 0, Code 0)' : undefined,
      },
      payload: protocol === 'HTTP'
        ? `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\n${messagePayload}`
        : protocol === 'DNS'
        ? `Standard Query Response for ${messagePayload} (educational example)`
        : protocol === 'DHCP'
        ? 'DHCPOFFER xid=0x4E4C0001; educational example options'
        : protocol === 'ICMP' ? messagePayload : `${protocol} response: ${messagePayload}`,
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
        whatHappened: natTranslation?.routerId === hopFrom.id ? `NAT overload translated the reply destination ${natTranslation.outsideIp} back to inside host ${natTranslation.insideIp}.` : `Target node successfully received the request and transmitted the corresponding response.`,
        decisionReason: natTranslation?.routerId === hopFrom.id ? `The PAT mapping reversed destination translation at ${hopFrom.name} before forwarding to the inside host.` : `Destination host inverted Source and Destination IP addresses and returned the reply.`,
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
