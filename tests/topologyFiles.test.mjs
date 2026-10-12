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

test('validates VLAN and switchport fields when importing topologies', () => {
  assert.throws(() => createTopologyFile('Bad VLAN', [
    devices[0], { ...devices[1], interfaces: [{ ...devices[1].interfaces[0], vlan: 4095 }] },
  ], links), /Switchport settings/);
  assert.throws(() => createTopologyFile('Bad VLAN table', [
    devices[0], { ...devices[1], vlans: [{ id: 10, name: 'Students', status: 'active' }, { id: 10, name: 'Duplicate', status: 'active' }] },
  ], links), /VLAN configuration/);
});

test('validates IPv6 interface fields and ACL rules when importing topologies', () => {
  const router = { ...devices[0], type: 'router', interfaces: [{ ...devices[0].interfaces[0], ipv6: '2001:db8::1', ipv6Prefix: 64, aclInbound: '101' }], accessLists: [{ id: 'acl-1', number: '101', action: 'permit', protocol: 'tcp', source: 'any', destination: '192.0.2.1/32', destinationPort: 443 }] };
  assert.doesNotThrow(() => createTopologyFile('IPv6 and ACL', [router, devices[1]], links));
  assert.throws(() => createTopologyFile('Bad IPv6', [{ ...router, interfaces: [{ ...router.interfaces[0], ipv6: 'not:ipv6' }] }, devices[1]], links), /IPv6 or ACL settings/);
  assert.throws(() => createTopologyFile('Bad ACL', [{ ...router, accessLists: [{ ...router.accessLists[0], destination: '999.999.999.999/32' }] }, devices[1]], links), /Access-list rule/);
  assert.throws(() => createTopologyFile('Missing ACL', [{ ...router, accessLists: [] }, devices[1]], links), /refers to an access list/);
});

test('validates NAT overload references and round-trips its interface roles', () => {
  const router = { ...devices[0], type: 'router', interfaces: [
    { ...devices[0].interfaces[0], natRole: 'inside' },
    { ...devices[0].interfaces[0], id: 'router-outside', name: 'GigabitEthernet0/1', natRole: 'outside' },
  ], accessLists: [{ id: 'pat-acl', number: '10', action: 'permit', protocol: 'ip', source: '10.0.0.0/24', destination: 'any' }], natOverload: { aclNumber: '10', outsideInterface: 'GigabitEthernet0/1' } };
  assert.doesNotThrow(() => createTopologyFile('NAT config', [router, devices[1]], links));
  assert.throws(() => createTopologyFile('Bad NAT', [{ ...router, natOverload: { ...router.natOverload, outsideInterface: 'missing' } }, devices[1]], links), /NAT overload configuration/);
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
