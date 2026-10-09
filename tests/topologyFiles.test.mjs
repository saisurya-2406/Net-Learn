import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MAX_TOPOLOGY_FILE_BYTES,
  createTopologyFile,
  parseTopologyFile,
  readSavedTopologies,
  writeSavedTopologies,
} from '../src/utils/topologyFiles.ts';

const devices = [
  {
    id: 'pc-1',
    name: 'PC-1',
    type: 'pc',
    x: 100,
    y: 100,
    powerState: 'on',
    interfaces: [{
      id: 'pc-1-eth0',
      name: 'Ethernet0',
      mac: '00:00:00:00:00:01',
      status: 'up',
    }],
  },
  {
    id: 'switch-1',
    name: 'Switch-1',
    type: 'switch',
    x: 250,
    y: 100,
    powerState: 'on',
    interfaces: [{
      id: 'switch-1-eth0',
      name: 'FastEthernet0/1',
      mac: '00:SW:01:00:00:01',
      status: 'up',
    }],
  },
];

const links = [{
  id: 'link-1',
  sourceDeviceId: 'pc-1',
  sourcePortId: 'pc-1-eth0',
  targetDeviceId: 'switch-1',
  targetPortId: 'switch-1-eth0',
  cableType: 'straight',
  status: 'up',
}];

class MemoryStorage {
  values = new Map();

  getItem(key) {
    return this.values.get(key) ?? null;
  }

  setItem(key, value) {
    this.values.set(key, value);
  }
}

test('exports and parses the documented NetLearn topology format', () => {
  const exported = createTopologyFile('LAN lab', devices, links, new Date('2026-01-01T00:00:00Z'));
  const imported = parseTopologyFile(JSON.stringify(exported));

  assert.equal(imported.format, 'netlearn-topology');
  assert.equal(imported.schemaVersion, 1);
  assert.equal(imported.name, 'LAN lab');
  assert.deepEqual(imported.devices, devices);
  assert.deepEqual(imported.links, links);
});

test('continues to import the existing legacy devices/links file shape', () => {
  const imported = parseTopologyFile(JSON.stringify({ devices, links, version: 'Cisco-PT-8.2' }));

  assert.equal(imported.name, 'Imported topology');
  assert.deepEqual(imported.devices, devices);
});

test('rejects unsupported future or foreign topology formats', () => {
  assert.throws(
    () => parseTopologyFile(JSON.stringify({
      format: 'other-format', schemaVersion: 1, devices, links,
    })),
    /Unsupported topology format/,
  );
});

test('rejects links that point at missing devices or interfaces', () => {
  const invalidLinks = [{ ...links[0], targetPortId: 'missing-port' }];

  assert.throws(
    () => createTopologyFile('Broken', devices, invalidLinks),
    /refers to an interface that does not exist/,
  );
});

test('rejects malformed addresses, IDs, and duplicate device identifiers', () => {
  assert.throws(
    () => createTopologyFile('Broken', [{ ...devices[0], x: Number.NaN }], []),
    /Device 1 is malformed/,
  );
  assert.throws(
    () => createTopologyFile('Broken', [devices[0], { ...devices[0] }], []),
    /Duplicate device ID/,
  );
});

test('rejects oversized topology files before parsing their contents', () => {
  const oversized = ' '.repeat(MAX_TOPOLOGY_FILE_BYTES + 1);

  assert.throws(() => parseTopologyFile(oversized), /maximum file size is 5 MB/);
});

test('saves and reloads topology snapshots through browser storage', () => {
  const storage = new MemoryStorage();
  const snapshot = {
    id: 'saved-1',
    name: 'My LAN',
    savedAt: '2026-01-01T00:00:00Z',
    devices,
    links,
  };
  writeSavedTopologies(storage, [snapshot]);

  assert.deepEqual(readSavedTopologies(storage), [snapshot]);
});

test('surfaces corrupted saved browser data instead of silently discarding it', () => {
  const storage = new MemoryStorage();
  storage.setItem('netlearn.saved-topologies.v1', '{broken json');

  assert.throws(() => readSavedTopologies(storage), /Saved topology data is corrupted/);
});
