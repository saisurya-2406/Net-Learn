import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateRoutingTables } from '../src/utils/routingEngine.ts';

const iface = (id, name, ip, mask) => ({ id, name, ip, subnetMask: mask, status: 'up', mac: `00:00:00:00:00:${id}` });
const topology = (protocol, enabled = true) => {
  const r1 = { id: 'r1', name: 'R1', type: 'router', x: 0, y: 0, powerState: 'on', interfaces: [iface('r1lan', 'Gi0/0', '192.168.1.1', '255.255.255.0'), iface('r1wan', 'Gi0/1', '10.0.12.1', '255.255.255.252')] };
  const r2 = { id: 'r2', name: 'R2', type: 'router', x: 1, y: 0, powerState: 'on', interfaces: [iface('r2lan', 'Gi0/0', '192.168.2.1', '255.255.255.0'), iface('r2wan', 'Gi0/1', '10.0.12.2', '255.255.255.252')] };
  if (protocol === 'rip') {
    r1.ripConfig = { enabled, version: 2, networks: ['192.168.1.0', '10.0.12.0'], noAutoSummary: true };
    r2.ripConfig = { enabled, version: 2, networks: ['192.168.2.0', '10.0.12.0'], noAutoSummary: true };
  } else if (protocol === 'ospf') {
    r1.ospfConfig = { enabled, processId: 1, networks: [{ network: '192.168.1.0', wildcard: '0.0.0.255', area: 0 }, { network: '10.0.12.0', wildcard: '0.0.0.3', area: 0 }] };
    r2.ospfConfig = { enabled, processId: 1, networks: [{ network: '192.168.2.0', wildcard: '0.0.0.255', area: 0 }, { network: '10.0.12.0', wildcard: '0.0.0.3', area: 0 }] };
  } else if (protocol === 'eigrp') {
    r1.eigrpConfig = { enabled, asNumber: 10, networks: ['192.168.1.0', '10.0.12.0'] };
    r2.eigrpConfig = { enabled, asNumber: 10, networks: ['192.168.2.0', '10.0.12.0'] };
  } else {
    r1.bgpConfig = { enabled, asNumber: 65001, neighbors: [{ ip: '10.0.12.2', remoteAs: 65002 }], networks: ['192.168.1.0/24'] };
    r2.bgpConfig = { enabled, asNumber: 65002, neighbors: [{ ip: '10.0.12.1', remoteAs: 65001 }], networks: ['192.168.2.0/24'] };
  }
  return { devices: [r1, r2], links: [{ id: 'wan', sourceDeviceId: 'r1', sourcePortId: 'r1wan', targetDeviceId: 'r2', targetPortId: 'r2wan', cableType: 'straight', status: 'up' }] };
};

for (const protocol of ['rip', 'ospf', 'eigrp', 'bgp']) {
  test(`${protocol.toUpperCase()} learns remote connected LAN routes and reacts to a disabled WAN`, () => {
    const { devices, links } = topology(protocol);
    const learned = calculateRoutingTables(devices, links);
    const type = { rip: 'R', ospf: 'O', eigrp: 'D', bgp: 'B' }[protocol];
    assert.ok(learned[0].routingTable.some(route => route.destinationNetwork === '192.168.2.0' && route.type === type));
    const failed = calculateRoutingTables(devices, [{ ...links[0], status: 'down' }]);
    assert.ok(!failed[0].routingTable?.some(route => route.destinationNetwork === '192.168.2.0' && route.type === type));
  });
}

test('RIPng exchanges IPv6 prefixes over enabled interfaces and removes learned routes when the link fails', () => {
  const r1 = { id: 'v6r1', type: 'router', powerState: 'on', interfaces: [
    { ...iface('v6lan1', 'Gi0/0', '192.0.2.1', '255.255.255.0'), ipv6: '2001:db8:1::1', ipv6Prefix: 64 },
    { ...iface('v6wan1', 'Gi0/1', '198.51.100.1', '255.255.255.252'), ipv6: '2001:db8:12::1', ipv6Prefix: 64 },
  ], ripngConfig: { enabled: true, processName: 'LAB', interfaces: ['v6lan1', 'v6wan1'] } };
  const r2 = { id: 'v6r2', type: 'router', powerState: 'on', interfaces: [
    { ...iface('v6lan2', 'Gi0/0', '203.0.113.1', '255.255.255.0'), ipv6: '2001:db8:2::1', ipv6Prefix: 64 },
    { ...iface('v6wan2', 'Gi0/1', '198.51.100.2', '255.255.255.252'), ipv6: '2001:db8:12::2', ipv6Prefix: 64 },
  ], ripngConfig: { enabled: true, processName: 'LAB', interfaces: ['v6lan2', 'v6wan2'] } };
  const link = { id: 'v6wan', sourceDeviceId: r1.id, sourcePortId: 'v6wan1', targetDeviceId: r2.id, targetPortId: 'v6wan2', cableType: 'straight', status: 'up' };
  const learned = calculateRoutingTables([r1, r2], [link]);
  assert.ok(learned[0].ipv6Routes.some(route => route.prefix === '2001:db8:2:0:0:0:0:0/64' && route.protocol === 'RIPng' && route.metric === 1));
  const failed = calculateRoutingTables([r1, r2], [{ ...link, status: 'down' }]);
  assert.ok(!failed[0].ipv6Routes?.some(route => route.protocol === 'RIPng'));
});

test('OSPF carries routes across an area border with a next hop on the receiver-facing link', () => {
  const r1 = { id: 'ma1', type: 'router', powerState: 'on', interfaces: [iface('ma1lan', 'Gi0/0', '192.168.1.1', '255.255.255.0'), iface('ma1ab', 'Gi0/1', '10.0.12.1', '255.255.255.252')], ospfConfig: { enabled: true, processId: 1, networks: [{ network: '192.168.1.0', wildcard: '0.0.0.255', area: 1 }, { network: '10.0.12.0', wildcard: '0.0.0.3', area: 1 }] } };
  const abr = { id: 'mabr', type: 'router', powerState: 'on', interfaces: [iface('mabrl', 'Gi0/0', '10.0.12.2', '255.255.255.252'), iface('mabrc', 'Gi0/1', '10.0.23.1', '255.255.255.252')], ospfConfig: { enabled: true, processId: 1, networks: [{ network: '10.0.12.0', wildcard: '0.0.0.3', area: 1 }, { network: '10.0.23.0', wildcard: '0.0.0.3', area: 0 }] } };
  const r3 = { id: 'ma3', type: 'router', powerState: 'on', interfaces: [iface('ma3abr', 'Gi0/0', '10.0.23.2', '255.255.255.252'), iface('ma3lan', 'Gi0/1', '192.168.3.1', '255.255.255.0')], ospfConfig: { enabled: true, processId: 1, networks: [{ network: '10.0.23.0', wildcard: '0.0.0.3', area: 0 }, { network: '192.168.3.0', wildcard: '0.0.0.255', area: 0 }] } };
  const links = [
    { id: 'ma12', sourceDeviceId: r1.id, sourcePortId: 'ma1ab', targetDeviceId: abr.id, targetPortId: 'mabrl', cableType: 'straight', status: 'up' },
    { id: 'ma23', sourceDeviceId: abr.id, sourcePortId: 'mabrc', targetDeviceId: r3.id, targetPortId: 'ma3abr', cableType: 'straight', status: 'up' },
  ];
  const learned = calculateRoutingTables([r1, abr, r3], links)[2].routingTable;
  const route = learned.find(item => item.destinationNetwork === '192.168.1.0' && item.type === 'O');
  assert.equal(route.nextHop, '10.0.23.1');
  assert.equal(route.interfaceName, 'Gi0/0');
});

test('OSPF can advertise a configured static route when static redistribution is enabled', () => {
  const { devices, links } = topology('ospf');
  devices[0].routingTable = [{ id: 'static-external', destinationNetwork: '172.16.4.0', subnetMask: '255.255.255.0', nextHop: '10.0.12.2', interfaceName: 'Gi0/1', type: 'S' }];
  devices[0].ospfConfig.redistributeStatic = true;
  const routes = calculateRoutingTables(devices, links)[1].routingTable;
  assert.ok(routes.some(route => route.destinationNetwork === '172.16.4.0' && route.type === 'O'));
});

test('VTP propagates a matching server VLAN database to client switches but not transparent switches', () => {
  const sw = (id, port, vtpConfig) => ({ id, name: id, type: 'switch', powerState: 'on', interfaces: [{ id: port, name: 'Gi0/1', mac: `00:00:00:00:00:0${port}`, status: 'up' }], vtpConfig });
  const server = sw('vtp-server', 'v1', { mode: 'server', domain: 'CAMPUS', version: 2 });
  server.vlans = [{ id: 1, name: 'default', status: 'active' }, { id: 30, name: 'VOICE', status: 'active' }];
  const client = sw('vtp-client', 'v2', { mode: 'client', domain: 'CAMPUS', version: 2 });
  const transparent = sw('vtp-transparent', 'v3', { mode: 'transparent', domain: 'CAMPUS', version: 2 });
  const link = { id: 'vtp-link', sourceDeviceId: server.id, sourcePortId: 'v1', targetDeviceId: client.id, targetPortId: 'v2', cableType: 'straight', status: 'up' };
  const learned = calculateRoutingTables([server, client], [link]);
  assert.ok(learned[1].vlans.some(vlan => vlan.id === 30 && vlan.name === 'VOICE'));
  const isolated = calculateRoutingTables([server, transparent], [{ ...link, targetDeviceId: transparent.id, targetPortId: 'v3' }]);
  assert.ok(!isolated[1].vlans?.some(vlan => vlan.id === 30));
});
