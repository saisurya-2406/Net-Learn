import { NetworkDevice, NetworkLink, RouteEntry } from '../types/network';

const ipNumber = (ip: string) => {
  const parts = ip.split('.');
  if (parts.length !== 4 || parts.some(part => !/^\d{1,3}$/.test(part) || Number(part) > 255)) return null;
  return parts.reduce((value, part) => ((value << 8) | Number(part)) >>> 0, 0);
};
const maskPrefix = (mask: string) => {
  const n = ipNumber(mask); if (n === null) return -1;
  const inverse = (~n) >>> 0; if ((inverse & (inverse + 1)) !== 0) return -1;
  return n.toString(2).replace(/0/g, '').length;
};
const maskFromPrefix = (prefix: number) => prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
const ipString = (value: number) => `${value >>> 24}.${(value >>> 16) & 255}.${(value >>> 8) & 255}.${value & 255}`;
const ipv6Number = (address: string): bigint | null => {
  const value = address.split('%')[0].toLowerCase();
  if (value.includes('.')) return null;
  const halves = value.split('::');
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(':') : [];
  const right = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  const missing = 8 - left.length - right.length;
  if (halves.length === 1 && missing !== 0 || halves.length === 2 && missing < 1) return null;
  const groups = [...left, ...Array(missing).fill('0'), ...right];
  if (groups.length !== 8 || groups.some(group => !/^[0-9a-f]{1,4}$/.test(group))) return null;
  return groups.reduce((result, group) => (result << 16n) | BigInt(`0x${group}`), 0n);
};
const ipv6Prefix = (iface: NetworkDevice['interfaces'][number]) => {
  const address = iface.ipv6 || '';
  const suffix = address.includes('/') ? Number(address.split('/')[1]) : iface.ipv6Prefix ?? 64;
  return Number.isInteger(suffix) && suffix >= 0 && suffix <= 128 ? suffix : -1;
};
const ipv6Match = (left: string, right: string, prefix: number) => {
  const a = ipv6Number(left), b = ipv6Number(right);
  if (a === null || b === null || prefix < 0 || prefix > 128) return false;
  const mask = prefix === 0 ? 0n : ((1n << BigInt(prefix)) - 1n) << BigInt(128 - prefix);
  return (a & mask) === (b & mask);
};
const ipv6Network = (address: string, prefix: number) => {
  const value = ipv6Number(address)!;
  const mask = prefix === 0 ? 0n : ((1n << BigInt(prefix)) - 1n) << BigInt(128 - prefix);
  const network = value & mask;
  return Array.from({ length: 8 }, (_, index) => Number((network >> BigInt((7 - index) * 16)) & 0xffffn).toString(16)).join(':');
};
const networkMatches = (ip: string, network: string) => {
  const address = ipNumber(ip), [base, length] = network.split('/'), baseAddress = ipNumber(base);
  if (address === null || baseAddress === null) return false;
  let prefix: number;
  if (length !== undefined) prefix = Number(length);
  else if ((baseAddress >>> 24) <= 127) prefix = 8;
  else if ((baseAddress >>> 24) >= 128 && (baseAddress >>> 24) <= 191) prefix = 16;
  else prefix = 24;
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) return false;
  const mask = maskFromPrefix(prefix);
  return ((address & mask) >>> 0) === ((baseAddress & mask) >>> 0);
};
const connected = (device: NetworkDevice) => device.interfaces.flatMap(iface => {
  if (iface.status !== 'up' || !iface.ip || !iface.subnetMask) return [];
  const ip = ipNumber(iface.ip), prefix = maskPrefix(iface.subnetMask);
  if (ip === null || prefix < 0) return [];
  const mask = maskFromPrefix(prefix), network = (ip & mask) >>> 0;
  return [{ network, prefix, iface, networkAddress: ipString(network), mask: iface.subnetMask }];
});
const interfaceEnabled = (device: NetworkDevice, ifaceIp: string, kind: 'rip' | 'ospf') => {
  const networks = kind === 'rip' ? (device.ripConfig?.enabled ? device.ripConfig.networks : []) :
    (device.ospfConfig?.enabled ? device.ospfConfig.networks.map(item => {
      const wildcard = ipNumber(item.wildcard);
      return `${item.network}/${wildcard === null ? '' : 32 - wildcard.toString(2).replace(/0/g, '').length}`;
    }) : []);
  return networks.some(network => networkMatches(ifaceIp, network));
};
const ospfAreaFor = (device: NetworkDevice, ifaceIp: string) => {
  const matching = device.ospfConfig?.networks.find(item => {
    const addr = ipNumber(ifaceIp), base = ipNumber(item.network), wildcard = ipNumber(item.wildcard);
    if (addr === null || base === null || wildcard === null) return false;
    const mask = (~wildcard) >>> 0;
    return (addr & mask) >>> 0 === (base & mask) >>> 0;
  });
  return device.ospfConfig?.enabled ? matching?.area : undefined;
};

interface Neighbor { deviceId: string; localIp: string; remoteIp: string; localInterface: string; }

/** Builds deterministic connected, RIP v2 and single-area OSPF routes from the live topology. */
export function calculateRoutingTables(devices: NetworkDevice[], links: NetworkLink[]): NetworkDevice[] {
  const routers = devices.filter(device => device.type === 'router' && device.powerState === 'on');
  const byId = new Map(routers.map(router => [router.id, router]));
  const neighbors = new Map<string, Neighbor[]>();
  for (const router of routers) neighbors.set(router.id, []);
  for (const link of links) {
    if (link.status !== 'up' || link.cableType === 'console') continue;
    const leftDevice = byId.get(link.sourceDeviceId), rightDevice = byId.get(link.targetDeviceId);
    if (!leftDevice || !rightDevice) continue;
    const left = leftDevice.interfaces.find(iface => iface.id === link.sourcePortId);
    const right = rightDevice.interfaces.find(iface => iface.id === link.targetPortId);
    if (!left || !right || left.status !== 'up' || right.status !== 'up' || !left.ip || !right.ip || !left.subnetMask || !right.subnetMask) continue;
    const leftIp = ipNumber(left.ip), rightIp = ipNumber(right.ip), leftPrefix = maskPrefix(left.subnetMask), rightPrefix = maskPrefix(right.subnetMask);
    if (leftIp === null || rightIp === null || leftPrefix !== rightPrefix || leftPrefix < 1 || (leftIp & maskFromPrefix(leftPrefix)) !== (rightIp & maskFromPrefix(rightPrefix))) continue;
    neighbors.get(leftDevice.id)!.push({ deviceId: rightDevice.id, localIp: left.ip, remoteIp: right.ip, localInterface: left.name });
    neighbors.get(rightDevice.id)!.push({ deviceId: leftDevice.id, localIp: right.ip, remoteIp: left.ip, localInterface: right.name });
  }

  const learned = new Map<string, RouteEntry[]>();
  for (const router of routers) learned.set(router.id, []);
  // RIP: deterministic Bellman-Ford exchange with hop-count limits and best-path updates.
  type RipPath = { network: string; mask: string; prefix: number; origin: string; metric: number; nextHop?: string; interfaceName?: string };
  const ripPaths = new Map<string, RipPath[]>();
  for (const router of routers) {
    ripPaths.set(router.id, connected(router).filter(item => interfaceEnabled(router, item.iface.ip!, 'rip'))
      .map(item => ({ network: item.networkAddress, mask: item.mask, prefix: item.prefix, origin: router.id, metric: 0 })));
  }
  for (let pass = 0; pass < routers.length; pass++) {
    let changed = false;
    for (const router of routers) {
      if (!router.ripConfig?.enabled) continue;
      for (const neighbor of neighbors.get(router.id) || []) {
        const peer = byId.get(neighbor.deviceId);
        if (!peer?.ripConfig?.enabled || peer.ripConfig.version !== router.ripConfig.version ||
            !interfaceEnabled(router, neighbor.localIp, 'rip') || !interfaceEnabled(peer, neighbor.remoteIp, 'rip')) continue;
        for (const route of [...(ripPaths.get(peer.id) || [])]) {
          const metric = route.metric + 1;
          if (route.origin === router.id || metric > 15 || route.prefix === 0) continue;
          const existing = ripPaths.get(router.id)!.find(item => item.network === route.network && item.prefix === route.prefix && item.origin === route.origin);
          if (existing && existing.metric <= metric) continue;
          const updated: RipPath = { ...route, metric, nextHop: neighbor.remoteIp, interfaceName: neighbor.localInterface };
          if (existing) ripPaths.set(router.id, ripPaths.get(router.id)!.map(item => item === existing ? updated : item));
          else ripPaths.get(router.id)!.push(updated);
          changed = true;
        }
      }
    }
    if (!changed) break;
  }
  for (const router of routers) {
    const localKeys = new Set((ripPaths.get(router.id) || []).filter(route => route.origin === router.id).map(route => `${route.network}/${route.prefix}`));
    for (const route of ripPaths.get(router.id) || []) {
      if (route.origin === router.id || !route.nextHop || !route.interfaceName || localKeys.has(`${route.network}/${route.prefix}`)) continue;
      const id = `R-${route.network}/${route.prefix}`;
      const existing = learned.get(router.id)!.find(item => item.id === id);
      const entry: RouteEntry = { id, destinationNetwork: route.network, subnetMask: route.mask, nextHop: route.nextHop, interfaceName: route.interfaceName, type: 'R', metric: route.metric, adminDistance: 120 };
      if (!existing) learned.get(router.id)!.push(entry);
      else if (route.metric < (existing.metric ?? Infinity)) learned.set(router.id, learned.get(router.id)!.map(item => item.id === id ? entry : item));
    }
  }

  // RIPng: deterministic IPv6 distance-vector exchange on explicitly enabled router interfaces.
  type RipngPath = { prefix: string; origin: string; metric: number; nextHop?: string; interfaceName?: string };
  const ripngNeighbors = new Map<string, Array<{ deviceId: string; localIp: string; remoteIp: string; localInterface: string }>>();
  const ripngPaths = new Map<string, RipngPath[]>();
  const ripngLearned = new Map<string, NonNullable<NetworkDevice['ipv6Routes']>>();
  for (const router of routers) {
    ripngNeighbors.set(router.id, []);
    ripngPaths.set(router.id, []);
    ripngLearned.set(router.id, []);
    for (const iface of router.interfaces) {
      if (iface.status !== 'up' || !iface.ipv6 || !router.ripngConfig?.enabled || !router.ripngConfig.interfaces.includes(iface.id)) continue;
      const prefix = ipv6Prefix(iface);
      if (prefix >= 0) ripngPaths.get(router.id)!.push({ prefix: `${ipv6Network(iface.ipv6.split('/')[0], prefix)}/${prefix}`, origin: router.id, metric: 0 });
    }
  }
  for (const link of links) {
    if (link.status !== 'up' || link.cableType === 'console') continue;
    const leftRouter = byId.get(link.sourceDeviceId), rightRouter = byId.get(link.targetDeviceId);
    if (!leftRouter || !rightRouter) continue;
    const left = leftRouter.interfaces.find(iface => iface.id === link.sourcePortId), right = rightRouter.interfaces.find(iface => iface.id === link.targetPortId);
    if (!left || !right || left.status !== 'up' || right.status !== 'up' || !left.ipv6 || !right.ipv6) continue;
    const lp = ipv6Prefix(left), rp = ipv6Prefix(right);
    if (lp !== rp || lp < 1 || !ipv6Match(left.ipv6.split('/')[0], right.ipv6.split('/')[0], lp)) continue;
    ripngNeighbors.get(leftRouter.id)!.push({ deviceId: rightRouter.id, localIp: left.ipv6.split('/')[0], remoteIp: right.ipv6.split('/')[0], localInterface: left.name });
    ripngNeighbors.get(rightRouter.id)!.push({ deviceId: leftRouter.id, localIp: right.ipv6.split('/')[0], remoteIp: left.ipv6.split('/')[0], localInterface: right.name });
  }
  for (let pass = 0; pass < routers.length * 15; pass++) {
    let changed = false;
    for (const router of routers) {
      if (!router.ripngConfig?.enabled) continue;
      for (const neighbor of ripngNeighbors.get(router.id) || []) {
        const peer = byId.get(neighbor.deviceId);
        const localIface = router.interfaces.find(iface => iface.name === neighbor.localInterface);
        const peerIface = peer?.interfaces.find(iface => iface.ipv6?.split('/')[0] === neighbor.remoteIp);
        if (!peer?.ripngConfig?.enabled || peer.ripngConfig.processName !== router.ripngConfig.processName || !localIface || !peerIface ||
            !router.ripngConfig.interfaces.includes(localIface.id) || !peer.ripngConfig.interfaces.includes(peerIface.id)) continue;
        for (const route of [...(ripngPaths.get(peer.id) || [])]) {
          const metric = route.metric + 1;
          if (route.origin === router.id || metric >= 16) continue;
          const existing = ripngPaths.get(router.id)!.find(item => item.prefix === route.prefix && item.origin === route.origin);
          if (existing && existing.metric <= metric) continue;
          const updated = { ...route, metric, nextHop: neighbor.remoteIp, interfaceName: neighbor.localInterface };
          if (existing) ripngPaths.set(router.id, ripngPaths.get(router.id)!.map(item => item === existing ? updated : item));
          else ripngPaths.get(router.id)!.push(updated);
          changed = true;
        }
      }
    }
    if (!changed) break;
  }
  for (const router of routers) {
    const local = new Set((ripngPaths.get(router.id) || []).filter(route => route.origin === router.id).map(route => route.prefix));
    for (const route of ripngPaths.get(router.id) || []) {
      if (route.origin === router.id || !route.nextHop || !route.interfaceName || local.has(route.prefix)) continue;
      ripngLearned.get(router.id)!.push({ id: `R6-${route.prefix}`, prefix: route.prefix, nextHop: route.nextHop, interfaceName: route.interfaceName, protocol: 'RIPng', metric: route.metric });
    }
  }

  // EIGRP: educational distance-vector model scoped to a matching autonomous system.
  type EigrpPath = { network: string; mask: string; prefix: number; origin: string; metric: number; nextHop?: string; interfaceName?: string };
  const eigrpPaths = new Map<string, EigrpPath[]>();
  for (const router of routers) {
    eigrpPaths.set(router.id, connected(router).filter(item => item.iface.ip && router.eigrpConfig?.enabled && router.eigrpConfig.networks.some(network => networkMatches(item.iface.ip!, network)))
      .map(item => ({ network: item.networkAddress, mask: item.mask, prefix: item.prefix, origin: router.id, metric: 0 })));
  }
  for (let pass = 0; pass < routers.length; pass++) {
    let changed = false;
    for (const router of routers) {
      if (!router.eigrpConfig?.enabled) continue;
      for (const neighbor of neighbors.get(router.id) || []) {
        const peer = byId.get(neighbor.deviceId);
        if (!peer?.eigrpConfig?.enabled || peer.eigrpConfig.asNumber !== router.eigrpConfig.asNumber ||
            !router.eigrpConfig.networks.some(network => networkMatches(neighbor.localIp, network)) || !peer.eigrpConfig.networks.some(network => networkMatches(neighbor.remoteIp, network))) continue;
        for (const route of [...(eigrpPaths.get(peer.id) || [])]) {
          const metric = route.metric + 1;
          if (route.origin === router.id) continue;
          const existing = eigrpPaths.get(router.id)!.find(item => item.network === route.network && item.prefix === route.prefix && item.origin === route.origin);
          if (existing && existing.metric <= metric) continue;
          const updated: EigrpPath = { ...route, metric, nextHop: neighbor.remoteIp, interfaceName: neighbor.localInterface };
          if (existing) eigrpPaths.set(router.id, eigrpPaths.get(router.id)!.map(item => item === existing ? updated : item));
          else eigrpPaths.get(router.id)!.push(updated);
          changed = true;
        }
      }
    }
    if (!changed) break;
  }
  for (const router of routers) {
    const local = new Set((eigrpPaths.get(router.id) || []).filter(route => route.origin === router.id).map(route => `${route.network}/${route.prefix}`));
    for (const route of eigrpPaths.get(router.id) || []) {
      const id = `D-${route.network}/${route.prefix}`;
      if (route.origin === router.id || !route.nextHop || !route.interfaceName || local.has(`${route.network}/${route.prefix}`)) continue;
      learned.get(router.id)!.push({ id, destinationNetwork: route.network, subnetMask: route.mask, nextHop: route.nextHop, interfaceName: route.interfaceName, type: 'D', metric: route.metric, adminDistance: 90 });
    }
  }

  // eBGP: establish explicitly configured, reciprocal directly connected peers and advertise configured connected prefixes.
  for (const router of routers.filter(item => item.bgpConfig?.enabled)) {
    const ownNetworks = new Set(router.bgpConfig!.networks);
    for (const neighbor of neighbors.get(router.id) || []) {
      const peer = byId.get(neighbor.deviceId);
      if (!peer?.bgpConfig?.enabled || !router.bgpConfig!.neighbors.some(item => item.ip === neighbor.remoteIp && item.remoteAs === peer.bgpConfig!.asNumber) ||
          !peer.bgpConfig.neighbors.some(item => item.ip === neighbor.localIp && item.remoteAs === router.bgpConfig!.asNumber)) continue;
      for (const route of connected(peer)) {
        const cidr = `${route.networkAddress}/${route.prefix}`;
        if (!peer.bgpConfig.networks.includes(cidr) || ownNetworks.has(cidr)) continue;
        learned.get(router.id)!.push({ id: `B-${cidr}`, destinationNetwork: route.networkAddress, subnetMask: route.mask, nextHop: neighbor.remoteIp, interfaceName: neighbor.localInterface, type: 'B', metric: 1, adminDistance: 20 });
      }
    }
  }

  // OSPF: deterministic multi-area shortest paths; area membership is checked per link.
  for (const origin of routers.filter(router => router.ospfConfig?.enabled)) {
    const ospfConnected = connected(origin).filter(item => interfaceEnabled(origin, item.iface.ip!, 'ospf'));
    const originNetworks = [
      ...ospfConnected.map(item => ({ networkAddress: item.networkAddress, prefix: item.prefix, mask: item.mask })),
      ...(origin.ospfConfig?.redistributeStatic ? (origin.routingTable || []).filter(route => route.type === 'S' || route.type === undefined).map(route => {
        const prefix = maskPrefix(route.subnetMask);
        return prefix >= 0 ? { networkAddress: route.destinationNetwork, prefix, mask: route.subnetMask } : null;
      }).filter((route): route is { networkAddress: string; prefix: number; mask: string } => route !== null) : []),
      ...(origin.ospfConfig?.redistributeConnected ? connected(origin).map(route => ({ networkAddress: route.networkAddress, prefix: route.prefix, mask: route.mask })) : []),
    ];
    if (!ospfConnected.length) continue;
    const distances = new Map<string, number>([[origin.id, 0]]);
    const previousRouter = new Map<string, string>();
    const pending = new Set(routers.map(router => router.id));
    while (pending.size) {
      let current: string | undefined;
      for (const id of pending) if (distances.has(id) && (current === undefined || distances.get(id)! < distances.get(current)!)) current = id;
      if (!current) break;
      pending.delete(current);
      for (const neighbor of neighbors.get(current) || []) {
        if (!pending.has(neighbor.deviceId)) continue;
        const peer = byId.get(neighbor.deviceId);
        if (!peer?.ospfConfig?.enabled || ospfAreaFor(byId.get(current)!, neighbor.localIp) === undefined ||
            ospfAreaFor(byId.get(current)!, neighbor.localIp) !== ospfAreaFor(peer, neighbor.remoteIp)) continue;
        const cost = distances.get(current)! + 1;
        if (cost < (distances.get(neighbor.deviceId) ?? Infinity)) {
          distances.set(neighbor.deviceId, cost);
          previousRouter.set(neighbor.deviceId, current);
        }
      }
    }
    for (const [routerId, distance] of distances) {
      if (routerId === origin.id) continue;
      const previousId = previousRouter.get(routerId);
      const hop = (neighbors.get(routerId) || []).find(item => item.deviceId === previousId);
      if (!hop) continue;
      for (const route of originNetworks) {
        const id = `O-${route.networkAddress}/${route.prefix}`;
        const existing = learned.get(routerId)!.find(item => item.id === id);
        if (!existing || distance < (existing.metric ?? Infinity)) {
          const entry: RouteEntry = { id, destinationNetwork: route.networkAddress, subnetMask: route.mask, nextHop: hop.remoteIp, interfaceName: hop.localInterface, type: 'O', metric: distance, adminDistance: 110 };
          if (existing) learned.set(routerId, learned.get(routerId)!.map(item => item.id === id ? entry : item)); else learned.get(routerId)!.push(entry);
        }
      }
    }
  }

  // VTP: deterministic VLAN database advertisement across operational switches sharing a domain.
  const switches = devices.filter(device => device.type === 'switch' && device.powerState === 'on');
  const switchById = new Map(switches.map(device => [device.id, device]));
  const switchNeighbors = new Map(switches.map(device => [device.id, [] as string[]]));
  for (const link of links) {
    if (link.status !== 'up' || link.cableType === 'console') continue;
    const left = switchById.get(link.sourceDeviceId), right = switchById.get(link.targetDeviceId);
    if (!left || !right || !left.interfaces.some(iface => iface.id === link.sourcePortId && iface.status === 'up') || !right.interfaces.some(iface => iface.id === link.targetPortId && iface.status === 'up')) continue;
    switchNeighbors.get(left.id)!.push(right.id);
    switchNeighbors.get(right.id)!.push(left.id);
  }
  const learnedVlans = new Map<string, NetworkDevice['vlans']>();
  for (const server of switches.filter(device => device.vtpConfig?.mode === 'server' && device.vtpConfig.domain)) {
    const queue = [server.id], visited = new Set<string>();
    while (queue.length) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);
      const current = switchById.get(currentId)!;
      for (const neighborId of switchNeighbors.get(currentId) || []) {
        const peer = switchById.get(neighborId)!;
        if (peer.vtpConfig?.domain !== server.vtpConfig!.domain || peer.vtpConfig.version !== server.vtpConfig!.version) continue;
        if (peer.vtpConfig.mode !== 'transparent') learnedVlans.set(peer.id, server.vlans || [{ id: 1, name: 'default', status: 'active' }]);
        if (current.vtpConfig?.mode !== 'transparent' && !visited.has(peer.id)) queue.push(peer.id);
      }
    }
  }

  return devices.map(device => {
    if (!byId.has(device.id)) return learnedVlans.has(device.id) ? { ...device, vlans: learnedVlans.get(device.id) } : device;
    const staticRoutes = (device.routingTable || []).filter(route => (route.type === 'S' || route.type === undefined) && route.nextHop !== 'Directly Connected');
    return { ...device, routingTable: [...staticRoutes, ...(learned.get(device.id) || [])], ...(byId.has(device.id) ? { ipv6Routes: [...(device.ipv6Routes || []).filter(route => route.protocol !== 'RIPng'), ...(ripngLearned.get(device.id) || [])] } : {}) };
  });
}
