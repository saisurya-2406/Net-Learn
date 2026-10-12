import { NetworkDevice, NetworkLink, TopologyData } from '../types/network';

export const TOPOLOGY_FORMAT = 'netlearn-topology';
export const TOPOLOGY_SCHEMA_VERSION = 1;
export const MAX_TOPOLOGY_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_TOPOLOGY_DEVICES = 500;
export const MAX_TOPOLOGY_LINKS = 2000;

const DEVICE_TYPES = new Set([
  'pc', 'laptop', 'switch', 'router', 'server', 'printer', 'ip_phone',
  'hub', 'access_point', 'firewall',
]);
const CABLE_TYPES = new Set([
  'auto', 'straight', 'crossover', 'fiber', 'serial', 'console', 'wireless',
]);
const DEVICE_STATES = new Set(['on', 'off']);
const INTERFACE_STATES = new Set(['up', 'down']);
const LINK_STATES = new Set(['up', 'down', 'negotiating']);

export interface SavedTopology {
  id: string;
  name: string;
  savedAt: string;
  devices: NetworkDevice[];
  links: NetworkLink[];
}

export interface TopologyFile extends TopologyData {
  format: typeof TOPOLOGY_FORMAT;
  schemaVersion: typeof TOPOLOGY_SCHEMA_VERSION;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isValidIpv6(value: string): boolean {
  try { new URL(`http://[${value.split('/')[0]}]/`); return true; } catch { return false; }
}

function isValidAclAddress(value: unknown): value is string {
  if (value === 'any') return true;
  if (!isString(value)) return false;
  const [address, prefixText] = value.split('/');
  const octets = address.split('.');
  const prefix = Number(prefixText);
  return value.includes('/') && octets.length === 4 && octets.every(octet => /^\d{1,3}$/.test(octet) && Number(octet) <= 255) && Number.isInteger(prefix) && prefix >= 0 && prefix <= 32;
}

function assertTopology(devices: unknown, links: unknown): asserts devices is NetworkDevice[] {
  if (!Array.isArray(devices) || devices.length > MAX_TOPOLOGY_DEVICES) {
    throw new Error(`Topology must contain no more than ${MAX_TOPOLOGY_DEVICES} devices.`);
  }
  if (!Array.isArray(links) || links.length > MAX_TOPOLOGY_LINKS) {
    throw new Error(`Topology must contain no more than ${MAX_TOPOLOGY_LINKS} links.`);
  }

  const deviceIds = new Set<string>();
  const portIdsByDevice = new Map<string, Set<string>>();
  for (const [index, device] of devices.entries()) {
    if (!isRecord(device) || !isString(device.id) || !device.id ||
        !isString(device.name) || !device.name.trim() ||
        !DEVICE_TYPES.has(String(device.type)) ||
        !Number.isFinite(device.x) || !Number.isFinite(device.y) ||
        !DEVICE_STATES.has(String(device.powerState)) ||
        !Array.isArray(device.interfaces) || device.interfaces.length > 128) {
      throw new Error(`Device ${index + 1} is malformed.`);
    }
    if (deviceIds.has(device.id)) throw new Error(`Duplicate device ID: ${device.id}.`);
    deviceIds.add(device.id);

    const interfaceIds = new Set<string>();
    for (const [interfaceIndex, networkInterface] of device.interfaces.entries()) {
      if (!isRecord(networkInterface) ||
          !isString(networkInterface.id) || !networkInterface.id ||
          !isString(networkInterface.name) || !networkInterface.name ||
          !isString(networkInterface.mac) ||
          !INTERFACE_STATES.has(String(networkInterface.status))) {
        throw new Error(`Interface ${interfaceIndex + 1} on ${device.name} is malformed.`);
      }
      if (interfaceIds.has(networkInterface.id)) {
        throw new Error(`Duplicate interface ID on ${device.name}: ${networkInterface.id}.`);
      }
      if (networkInterface.vlan !== undefined && (!Number.isInteger(networkInterface.vlan) || Number(networkInterface.vlan) < 1 || Number(networkInterface.vlan) > 4094) ||
          networkInterface.mode !== undefined && !['access', 'trunk', 'dynamic-auto', 'dynamic-desirable'].includes(String(networkInterface.mode)) ||
          networkInterface.allowedVlans !== undefined && (!Array.isArray(networkInterface.allowedVlans) || networkInterface.allowedVlans.some(vlan => !Number.isInteger(vlan) || Number(vlan) < 1 || Number(vlan) > 4094))) {
        throw new Error(`Switchport settings on ${device.name}/${networkInterface.name} are malformed.`);
      }
      if (networkInterface.encapsulation !== undefined && !['hdlc', 'ppp', 'pppoe', 'frame-relay'].includes(String(networkInterface.encapsulation)) ||
          networkInterface.frameRelayDlci !== undefined && (!Number.isInteger(networkInterface.frameRelayDlci) || Number(networkInterface.frameRelayDlci) < 16 || Number(networkInterface.frameRelayDlci) > 1007) ||
          networkInterface.qos !== undefined && (!isRecord(networkInterface.qos) || !['low', 'normal', 'high', 'voice'].includes(String(networkInterface.qos.priority)) || networkInterface.qos.dscp !== undefined && (!Number.isInteger(networkInterface.qos.dscp) || Number(networkInterface.qos.dscp) < 0 || Number(networkInterface.qos.dscp) > 63))) {
        throw new Error(`WAN or QoS settings on ${device.name}/${networkInterface.name} are malformed.`);
      }
      if (networkInterface.channelGroup !== undefined && (!Number.isInteger(networkInterface.channelGroup) || Number(networkInterface.channelGroup) < 1 || Number(networkInterface.channelGroup) > 64) || networkInterface.channelProtocol !== undefined && !['lacp', 'pagp'].includes(String(networkInterface.channelProtocol))) throw new Error(`EtherChannel settings on ${device.name}/${networkInterface.name} are malformed.`);
      if (networkInterface.ipv6 !== undefined && (!isString(networkInterface.ipv6) || !isValidIpv6(networkInterface.ipv6)) ||
          networkInterface.ipv6Prefix !== undefined && (!Number.isInteger(networkInterface.ipv6Prefix) || Number(networkInterface.ipv6Prefix) < 0 || Number(networkInterface.ipv6Prefix) > 128) ||
          networkInterface.aclInbound !== undefined && !/^\d{1,3}$/.test(String(networkInterface.aclInbound)) ||
          networkInterface.aclOutbound !== undefined && !/^\d{1,3}$/.test(String(networkInterface.aclOutbound)) ||
          networkInterface.natRole !== undefined && !['inside', 'outside'].includes(String(networkInterface.natRole))) {
        throw new Error(`IPv6 or ACL settings on ${device.name}/${networkInterface.name} are malformed.`);
      }
      interfaceIds.add(networkInterface.id);
    }
    if (device.vlans !== undefined) {
      if (!Array.isArray(device.vlans) || device.vlans.length > 4094) throw new Error(`VLAN configuration on ${device.name} is malformed.`);
      const vlanIds = new Set<number>();
      for (const vlan of device.vlans) {
        if (!isRecord(vlan) || !Number.isInteger(vlan.id) || Number(vlan.id) < 1 || Number(vlan.id) > 4094 ||
            !isString(vlan.name) || !vlan.name.trim() || !['active', 'suspended'].includes(String(vlan.status)) || vlanIds.has(Number(vlan.id))) {
          throw new Error(`VLAN configuration on ${device.name} is malformed.`);
        }
        vlanIds.add(Number(vlan.id));
      }
    }
    if (device.spanningTreeMode !== undefined && !['pvst', 'rapid-pvst', 'off'].includes(String(device.spanningTreeMode))) throw new Error(`Spanning-tree mode on ${device.name} is malformed.`);
    if (device.wirelessConfig !== undefined && (!isRecord(device.wirelessConfig) || !isString(device.wirelessConfig.ssid) || !device.wirelessConfig.ssid.trim() || device.wirelessConfig.ssid.length > 32 || !['open', 'wpa2-psk', 'wpa3-sae'].includes(String(device.wirelessConfig.security)) || device.wirelessConfig.passphrase !== undefined && (!isString(device.wirelessConfig.passphrase) || device.wirelessConfig.passphrase.length < 8 || device.wirelessConfig.passphrase.length > 63))) throw new Error(`Wireless settings on ${device.name} are malformed.`);
    if (device.firewallConfig !== undefined && (!isRecord(device.firewallConfig) || typeof device.firewallConfig.enabled !== 'boolean' || !['allow', 'deny'].includes(String(device.firewallConfig.defaultAction)) || !Array.isArray(device.firewallConfig.rules) || device.firewallConfig.rules.some(rule => !isRecord(rule) || !['allow', 'deny'].includes(String(rule.action)) || !['any', 'tcp', 'udp', 'icmp'].includes(String(rule.protocol)) || rule.destinationPort !== undefined && (!Number.isInteger(rule.destinationPort) || Number(rule.destinationPort) < 1 || Number(rule.destinationPort) > 65535)))) throw new Error(`Firewall policy on ${device.name} is malformed.`);
    if (device.serverServices !== undefined) {
      if (!isRecord(device.serverServices)) throw new Error(`Server services on ${device.name} are malformed.`);
      const services = device.serverServices;
      if (services.snmp !== undefined && (!isRecord(services.snmp) || typeof services.snmp.enabled !== 'boolean' || !['v2c', 'v3'].includes(String(services.snmp.version)) || !isString(services.snmp.community))) throw new Error(`SNMP service settings on ${device.name} are malformed.`);
      if (services.aaa !== undefined && (!isRecord(services.aaa) || typeof services.aaa.enabled !== 'boolean' || !['radius', 'tacacs+'].includes(String(services.aaa.protocol)) || !Array.isArray(services.aaa.users) || services.aaa.users.some((item: unknown) => !isRecord(item) || !isString(item.username) || !item.username || !isString(item.password) || ![1, 15].includes(Number(item.privilege))))) throw new Error(`AAA service settings on ${device.name} are malformed.`);
    }
    if (device.cdpEnabled !== undefined && typeof device.cdpEnabled !== 'boolean') throw new Error(`CDP setting on ${device.name} is malformed.`);
    if (device.vtpConfig !== undefined && (!isRecord(device.vtpConfig) || !['server', 'client', 'transparent'].includes(String(device.vtpConfig.mode)) || !isString(device.vtpConfig.domain) || !device.vtpConfig.domain.trim() || ![1, 2, 3].includes(Number(device.vtpConfig.version)))) throw new Error(`VTP configuration on ${device.name} is malformed.`);
    if (device.accessLists !== undefined) {
      if (!Array.isArray(device.accessLists) || device.accessLists.length > 2000) throw new Error(`Access lists on ${device.name} are malformed.`);
      const aclIds = new Set<string>();
      for (const rule of device.accessLists) {
        if (!isRecord(rule) || !isString(rule.id) || !rule.id || !/^\d{1,3}$/.test(String(rule.number)) || Number(rule.number) < 1 || Number(rule.number) > 199 ||
            !['permit', 'deny'].includes(String(rule.action)) || !['ip', 'tcp', 'udp', 'icmp'].includes(String(rule.protocol)) ||
            !isValidAclAddress(rule.source) || !isValidAclAddress(rule.destination) ||
            rule.destinationPort !== undefined && (!Number.isInteger(rule.destinationPort) || Number(rule.destinationPort) < 1 || Number(rule.destinationPort) > 65535) || aclIds.has(rule.id)) {
          throw new Error(`Access-list rule on ${device.name} is malformed.`);
        }
        aclIds.add(rule.id);
      }
      const numbers = new Set(device.accessLists.map(rule => String((rule as Record<string, unknown>).number)));
      if (device.interfaces.some(iface => iface.aclInbound !== undefined && !numbers.has(String(iface.aclInbound)) || iface.aclOutbound !== undefined && !numbers.has(String(iface.aclOutbound)))) {
        throw new Error(`An interface on ${device.name} refers to an access list that does not exist.`);
      }
    } else if (device.interfaces.some(iface => iface.aclInbound !== undefined || iface.aclOutbound !== undefined)) {
      throw new Error(`An interface on ${device.name} refers to an access list that does not exist.`);
    }
    if (device.natOverload !== undefined) {
      const natOverload = device.natOverload;
      if (!isRecord(natOverload) || !/^\d{1,3}$/.test(String(natOverload.aclNumber)) ||
          !isString(natOverload.outsideInterface) || !device.interfaces.some(iface => iface.name === natOverload.outsideInterface) ||
          !device.accessLists?.some(rule => rule.number === natOverload.aclNumber)) {
        throw new Error(`NAT overload configuration on ${device.name} is malformed or references a missing interface or ACL.`);
      }
    }
    if (device.ripngConfig !== undefined) {
      const ripng = device.ripngConfig;
      if (!isRecord(ripng) || typeof ripng.enabled !== 'boolean' || !isString(ripng.processName) || !ripng.processName.trim() ||
          !Array.isArray(ripng.interfaces) || ripng.interfaces.some(id => !isString(id) || !interfaceIds.has(id)) ||
          new Set(ripng.interfaces).size !== ripng.interfaces.length) {
        throw new Error(`RIPng configuration on ${device.name} is malformed or references a missing interface.`);
      }
    }
    portIdsByDevice.set(device.id, interfaceIds);
  }

  const linkIds = new Set<string>();
  for (const [index, link] of links.entries()) {
    if (!isRecord(link) || !isString(link.id) || !link.id ||
        !isString(link.sourceDeviceId) || !isString(link.sourcePortId) ||
        !isString(link.targetDeviceId) || !isString(link.targetPortId) ||
        link.sourceDeviceId === link.targetDeviceId ||
        !CABLE_TYPES.has(String(link.cableType)) ||
        !LINK_STATES.has(String(link.status))) {
      throw new Error(`Link ${index + 1} is malformed.`);
    }
    if (linkIds.has(link.id)) throw new Error(`Duplicate link ID: ${link.id}.`);
    linkIds.add(link.id);

    if (!deviceIds.has(link.sourceDeviceId) || !deviceIds.has(link.targetDeviceId)) {
      throw new Error(`Link ${link.id} refers to a device that does not exist.`);
    }
    if (!portIdsByDevice.get(link.sourceDeviceId)?.has(link.sourcePortId) ||
        !portIdsByDevice.get(link.targetDeviceId)?.has(link.targetPortId)) {
      throw new Error(`Link ${link.id} refers to an interface that does not exist.`);
    }
  }
}

export function createTopologyFile(
  name: string,
  devices: NetworkDevice[],
  links: NetworkLink[],
  now = new Date(),
): TopologyFile {
  assertTopology(devices, links);
  const trimmedName = name.trim();
  if (!trimmedName || trimmedName.length > 100) {
    throw new Error('Topology name must contain between 1 and 100 characters.');
  }

  return {
    format: TOPOLOGY_FORMAT,
    schemaVersion: TOPOLOGY_SCHEMA_VERSION,
    id: `topology-${now.getTime()}`,
    name: trimmedName,
    description: '',
    devices,
    links,
    updatedAt: now.toISOString(),
  };
}

export function parseTopologyFile(contents: string): TopologyFile {
  if (new TextEncoder().encode(contents).byteLength > MAX_TOPOLOGY_FILE_BYTES) {
    throw new Error('Topology file is too large. The maximum file size is 5 MB.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(contents);
  } catch {
    throw new Error('This file is not valid JSON.');
  }

  if (!isRecord(parsed)) throw new Error('Topology file must be a JSON object.');
  if (parsed.format !== undefined &&
      (parsed.format !== TOPOLOGY_FORMAT || parsed.schemaVersion !== TOPOLOGY_SCHEMA_VERSION)) {
    throw new Error('Unsupported topology format or schema version.');
  }

  assertTopology(parsed.devices, parsed.links);
  return {
    format: TOPOLOGY_FORMAT,
    schemaVersion: TOPOLOGY_SCHEMA_VERSION,
    id: isString(parsed.id) ? parsed.id : `import-${Date.now()}`,
    name: isString(parsed.name) && parsed.name.trim() ? parsed.name.trim() : 'Imported topology',
    description: isString(parsed.description) ? parsed.description : '',
    devices: parsed.devices,
    links: parsed.links as NetworkLink[],
    updatedAt: isString(parsed.updatedAt) ? parsed.updatedAt : new Date().toISOString(),
  };
}

export function readSavedTopologies(storage: Pick<Storage, 'getItem'>): SavedTopology[] {
  const raw = storage.getItem('netlearn.saved-topologies.v1');
  if (raw === null) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Saved topology data is corrupted. Export a backup before clearing browser data.');
  }
  if (!Array.isArray(parsed)) {
    throw new Error('Saved topology data is corrupted. Export a backup before clearing browser data.');
  }

  return parsed.map((item, index) => {
    if (!isRecord(item) || !isString(item.id) || !isString(item.name) ||
        !isString(item.savedAt)) {
      throw new Error(`Saved topology ${index + 1} is corrupted.`);
    }
    assertTopology(item.devices, item.links);
    return {
      id: item.id,
      name: item.name,
      savedAt: item.savedAt,
      devices: item.devices,
      links: item.links as NetworkLink[],
    };
  });
}

export function writeSavedTopologies(
  storage: Pick<Storage, 'setItem'>,
  topologies: SavedTopology[],
): void {
  for (const topology of topologies) assertTopology(topology.devices, topology.links);
  storage.setItem('netlearn.saved-topologies.v1', JSON.stringify(topologies));
}
