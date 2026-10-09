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
  'auto', 'straight', 'crossover', 'fiber', 'serial', 'console',
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
      interfaceIds.add(networkInterface.id);
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
