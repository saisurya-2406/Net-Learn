import assert from 'node:assert/strict';
import test from 'node:test';

import { findDevicePath, generateSimulationTrace, learnSwitchMacAddresses } from '../src/utils/simulationEngine.ts';

function makeTopology({
  sourcePower = 'on',
  sourceInterfaceStatus = 'up',
  targetInterfaceStatus = 'up',
  cableType = 'straight',
} = {}) {
  const devices = [
    {
      id: 'pc-1',
      name: 'PC-1',
      type: 'pc',
      powerState: sourcePower,
      interfaces: [{
        id: 'pc-1-eth0',
        name: 'Ethernet0',
        ip: '192.168.1.10',
        subnetMask: '255.255.255.0',
        mac: '00:00:00:00:00:01',
        status: sourceInterfaceStatus,
      }],
    },
    {
      id: 'server-1',
      name: 'Server-1',
      type: 'server',
      powerState: 'on',
      interfaces: [{
        id: 'server-1-eth0',
        name: 'Ethernet0',
        ip: '192.168.1.20',
        subnetMask: '255.255.255.0',
        mac: '00:00:00:00:00:02',
        status: targetInterfaceStatus,
      }],
    },
  ];
  const links = [{
    id: 'link-1',
    sourceDeviceId: 'pc-1',
    sourcePortId: 'pc-1-eth0',
    targetDeviceId: 'server-1',
    targetPortId: 'server-1-eth0',
    cableType,
    status: 'up',
  }];

  return { devices, links };
}

function makeRoutedTopology() {
  const devices = [
    {
      id: 'pc-1',
      name: 'PC-1',
      type: 'pc',
      powerState: 'on',
      defaultGateway: '10.0.0.1',
      interfaces: [{
        id: 'pc-1-eth0',
        name: 'Ethernet0',
        ip: '10.0.0.2',
        subnetMask: '255.255.255.0',
        mac: '00:00:00:00:00:01',
        status: 'up',
      }],
    },
    {
      id: 'router-1',
      name: 'Router-1',
      type: 'router',
      powerState: 'on',
      interfaces: [
        {
          id: 'router-1-gi0',
          name: 'GigabitEthernet0/0',
          ip: '10.0.0.1',
          subnetMask: '255.255.255.0',
          mac: '00:00:00:00:00:11',
          status: 'up',
        },
        {
          id: 'router-1-gi1',
          name: 'GigabitEthernet0/1',
          ip: '10.0.1.1',
          subnetMask: '255.255.255.0',
          mac: '00:00:00:00:00:12',
          status: 'up',
        },
      ],
      routingTable: [
        {
          id: 'route-source',
          destinationNetwork: '10.0.0.0',
          subnetMask: '255.255.255.0',
          nextHop: 'Directly Connected',
          interfaceName: 'GigabitEthernet0/0',
        },
        {
          id: 'route-destination',
          destinationNetwork: '10.0.1.0',
          subnetMask: '255.255.255.0',
          nextHop: 'Directly Connected',
          interfaceName: 'GigabitEthernet0/1',
        },
      ],
    },
    {
      id: 'server-1',
      name: 'Server-1',
      type: 'server',
      powerState: 'on',
      defaultGateway: '10.0.1.1',
      interfaces: [{
        id: 'server-1-eth0',
        name: 'Ethernet0',
        ip: '10.0.1.20',
        subnetMask: '255.255.255.0',
        mac: '00:00:00:00:00:02',
        status: 'up',
      }],
    },
  ];
  const links = [
    {
      id: 'link-source-router',
      sourceDeviceId: 'pc-1',
      sourcePortId: 'pc-1-eth0',
      targetDeviceId: 'router-1',
      targetPortId: 'router-1-gi0',
      cableType: 'straight',
      status: 'up',
    },
    {
      id: 'link-router-destination',
      sourceDeviceId: 'router-1',
      sourcePortId: 'router-1-gi1',
      targetDeviceId: 'server-1',
      targetPortId: 'server-1-eth0',
      cableType: 'straight',
      status: 'up',
    },
  ];

  return { devices, links };
}

test('finds a path when devices, interfaces, and link are operational', () => {
  const { devices, links } = makeTopology();

  assert.deepEqual(findDevicePath(devices, links, 'pc-1', 'server-1'), {
    path: ['pc-1', 'server-1'],
    linkIds: ['link-1'],
  });
});

test('does not find a path when either endpoint interface is disabled', () => {
  const { devices, links } = makeTopology({ targetInterfaceStatus: 'down' });

  assert.equal(findDevicePath(devices, links, 'pc-1', 'server-1'), null);
});

test('does not find a path through a powered-off device', () => {
  const { devices, links } = makeTopology({ sourcePower: 'off' });

  assert.equal(findDevicePath(devices, links, 'pc-1', 'server-1'), null);
});

test('does not treat console cables as packet-carrying links', () => {
  const { devices, links } = makeTopology({ cableType: 'console' });

  assert.equal(findDevicePath(devices, links, 'pc-1', 'server-1'), null);
});

test('serial WAN links check encapsulation and Frame Relay DLCI provisioning', () => {
  const { devices, links } = makeTopology({ cableType: 'serial' });
  const [source, destination] = devices;
  source.interfaces[0].name = 'Serial0/0/0';
  destination.interfaces[0].name = 'Serial0/0/0';
  assert.ok(findDevicePath(devices, links, 'pc-1', 'server-1'), 'serial defaults to HDLC');
  source.interfaces[0].encapsulation = 'ppp';
  assert.equal(findDevicePath(devices, links, 'pc-1', 'server-1'), null);
  destination.interfaces[0].encapsulation = 'ppp';
  assert.ok(findDevicePath(devices, links, 'pc-1', 'server-1'));
  source.interfaces[0].encapsulation = 'frame-relay';
  destination.interfaces[0].encapsulation = 'frame-relay';
  assert.equal(findDevicePath(devices, links, 'pc-1', 'server-1'), null);
  source.interfaces[0].frameRelayDlci = 101;
  destination.interfaces[0].frameRelayDlci = 202;
  assert.ok(findDevicePath(devices, links, 'pc-1', 'server-1'));
});

test('wireless links require matching SSID, security mode, and secured passphrase', () => {
  const { devices, links } = makeTopology({ cableType: 'wireless' });
  devices[1].type = 'access_point';
  devices[1].wirelessConfig = { ssid: 'Campus', security: 'wpa2-psk', passphrase: 'secret123' };
  devices[0].wirelessConfig = { ssid: 'Campus', security: 'wpa2-psk', passphrase: 'secret123' };
  assert.ok(findDevicePath(devices, links, 'pc-1', 'server-1'));
  devices[0].wirelessConfig.passphrase = 'wrongpass';
  assert.equal(findDevicePath(devices, links, 'pc-1', 'server-1'), null);
});

test('EtherChannel member links require matching switch group and protocol', () => {
  const devices = ['sw1', 'sw2'].map(id => ({ id, name: id, type: 'switch', powerState: 'on', interfaces: [
    { id: `${id}-p`, name: 'GigabitEthernet0/1', mac: `${id}:01`, status: 'up' },
  ] }));
  const links = [{ id: 'bundle-member', sourceDeviceId: 'sw1', sourcePortId: 'sw1-p', targetDeviceId: 'sw2', targetPortId: 'sw2-p', cableType: 'fiber', status: 'up' }];
  devices[0].interfaces[0].channelGroup = 1;
  devices[0].interfaces[0].channelProtocol = 'lacp';
  assert.equal(findDevicePath(devices, links, 'sw1', 'sw2'), null);
  devices[1].interfaces[0].channelGroup = 1;
  devices[1].interfaces[0].channelProtocol = 'pagp';
  assert.equal(findDevicePath(devices, links, 'sw1', 'sw2'), null);
  devices[1].interfaces[0].channelProtocol = 'lacp';
  assert.ok(findDevicePath(devices, links, 'sw1', 'sw2'));
});

test('firewall denies a new flow by default and permits an explicit protocol rule', () => {
  const { devices } = makeTopology();
  const pc = devices[0], server = devices[1];
  const fw = { id: 'fw', name: 'FW', type: 'firewall', powerState: 'on', interfaces: [
    { id: 'fw1', name: 'Ethernet0', ip: '192.168.1.11', subnetMask: '255.255.255.0', mac: '00:00:00:00:00:03', status: 'up' },
    { id: 'fw2', name: 'Ethernet1', ip: '192.168.1.12', subnetMask: '255.255.255.0', mac: '00:00:00:00:00:04', status: 'up' },
  ], firewallConfig: { enabled: true, defaultAction: 'deny', rules: [] } };
  const links = [
    { id: 'a', sourceDeviceId: pc.id, sourcePortId: 'pc-1-eth0', targetDeviceId: fw.id, targetPortId: 'fw1', cableType: 'straight', status: 'up' },
    { id: 'b', sourceDeviceId: fw.id, sourcePortId: 'fw2', targetDeviceId: server.id, targetPortId: 'server-1-eth0', cableType: 'straight', status: 'up' },
  ];
  assert.equal(generateSimulationTrace([pc, fw, server], links, pc.id, server.id, 'ICMP')[0].explanation.title, 'Firewall Policy Denied');
  fw.firewallConfig.rules.push({ action: 'allow', protocol: 'icmp' });
  assert.notEqual(generateSimulationTrace([pc, fw, server], links, pc.id, server.id, 'ICMP')[0].explanation.title, 'Firewall Policy Denied');
});

test('configured SNMP and AAA services validate management credentials', () => {
  const { devices, links } = makeTopology();
  const server = devices[1];
  server.serverServices = {
    httpEnabled: true, httpContent: '', dnsEnabled: false, dnsRecords: [], dhcpEnabled: false,
    dhcpPool: { startIp: '', endIp: '', subnetMask: '', gateway: '', dnsServer: '' },
    snmp: { enabled: true, version: 'v2c', community: 'readonly' },
    aaa: { enabled: true, protocol: 'radius', users: [{ username: 'netadmin', password: 's3cure', privilege: 15 }] },
  };
  assert.equal(generateSimulationTrace(devices, links, 'pc-1', 'server-1', 'SNMP', 'community=wrong')[0].explanation.title, 'SNMP Community Rejected');
  assert.notEqual(generateSimulationTrace(devices, links, 'pc-1', 'server-1', 'SNMP', 'community=readonly')[0].explanation.title, 'SNMP Community Rejected');
  assert.equal(generateSimulationTrace(devices, links, 'pc-1', 'server-1', 'AAA', 'netadmin:bad')[0].explanation.title, 'AAA Authentication Rejected');
  assert.notEqual(generateSimulationTrace(devices, links, 'pc-1', 'server-1', 'AAA', 'netadmin:s3cure')[0].explanation.title, 'AAA Authentication Rejected');
});

test('spanning-tree loop prevention blocks a redundant switch link deterministically', () => {
  const devices = ['sw1', 'sw2', 'sw3'].map((id, index) => ({
    id, name: id.toUpperCase(), type: 'switch', powerState: 'on', x: index * 100, y: 0,
    interfaces: ['a', 'b'].map((port, portIndex) => ({ id: `${id}-${port}`, name: `FastEthernet0/${portIndex + 1}`, mac: `00:00:00:00:0${index}:${portIndex}`, status: 'up' })),
  }));
  const links = [
    { id: 'link-1', sourceDeviceId: 'sw1', sourcePortId: 'sw1-a', targetDeviceId: 'sw2', targetPortId: 'sw2-a', cableType: 'straight', status: 'up' },
    { id: 'link-2', sourceDeviceId: 'sw2', sourcePortId: 'sw2-b', targetDeviceId: 'sw3', targetPortId: 'sw3-a', cableType: 'straight', status: 'up' },
    { id: 'link-3', sourceDeviceId: 'sw3', sourcePortId: 'sw3-b', targetDeviceId: 'sw1', targetPortId: 'sw1-b', cableType: 'straight', status: 'up' },
  ];
  assert.deepEqual(findDevicePath(devices, links, 'sw1', 'sw3'), { path: ['sw1', 'sw2', 'sw3'], linkIds: ['link-1', 'link-2'] });
  devices[0].spanningTreeMode = 'off';
  assert.deepEqual(findDevicePath(devices, links, 'sw1', 'sw3'), { path: ['sw1', 'sw3'], linkIds: ['link-3'] });
});

test('blocks access-port forwarding between different VLANs', () => {
  const pc1 = { id: 'p1', name: 'PC-1', type: 'pc', powerState: 'on', interfaces: [{ id: 'p1e', name: 'Fa0', ip: '10.0.1.1', subnetMask: '255.255.255.0', mac: '00:00:00:00:01:01', status: 'up' }] };
  const sw = { id: 'sw', name: 'Switch', type: 'switch', powerState: 'on', interfaces: [
    { id: 'sw1', name: 'Fa0/1', mac: '00:00:00:00:02:01', status: 'up', vlan: 10 },
    { id: 'sw2', name: 'Fa0/2', mac: '00:00:00:00:02:02', status: 'up', vlan: 20 },
  ] };
  const pc2 = { id: 'p2', name: 'PC-2', type: 'pc', powerState: 'on', interfaces: [{ id: 'p2e', name: 'Fa0', ip: '10.0.1.2', subnetMask: '255.255.255.0', mac: '00:00:00:00:03:01', status: 'up' }] };
  const links = [
    { id: 'a', sourceDeviceId: pc1.id, sourcePortId: 'p1e', targetDeviceId: sw.id, targetPortId: 'sw1', cableType: 'straight', status: 'up' },
    { id: 'b', sourceDeviceId: sw.id, sourcePortId: 'sw2', targetDeviceId: pc2.id, targetPortId: 'p2e', cableType: 'straight', status: 'up' },
  ];
  assert.equal(findDevicePath([pc1, sw, pc2], links, pc1.id, pc2.id), null);
});

test('switch learns source MAC addresses on the correct access ports in both directions', () => {
  const pc1 = { id: 'p1', name: 'PC-1', type: 'pc', powerState: 'on', interfaces: [{ id: 'p1e', name: 'Fa0', mac: '00:00:00:00:01:01', status: 'up' }] };
  const sw = { id: 'sw', name: 'Switch', type: 'switch', powerState: 'on', interfaces: [
    { id: 'sw1', name: 'Fa0/1', mac: '00:00:00:00:02:01', status: 'up', vlan: 10 },
    { id: 'sw2', name: 'Fa0/2', mac: '00:00:00:00:02:02', status: 'up', vlan: 10 },
  ] };
  const pc2 = { id: 'p2', name: 'PC-2', type: 'pc', powerState: 'on', interfaces: [{ id: 'p2e', name: 'Fa0', mac: '00:00:00:00:03:01', status: 'up' }] };
  const links = [
    { id: 'a', sourceDeviceId: 'p1', sourcePortId: 'p1e', targetDeviceId: 'sw', targetPortId: 'sw1', cableType: 'straight', status: 'up' },
    { id: 'b', sourceDeviceId: 'sw', sourcePortId: 'sw2', targetDeviceId: 'p2', targetPortId: 'p2e', cableType: 'straight', status: 'up' },
  ];
  const learned = learnSwitchMacAddresses([pc1, sw, pc2], links, 'p1', 'p2')[1].macTable;
  assert.deepEqual(learned.map(entry => [entry.mac, entry.port, entry.vlan]).sort(), [
    ['00:00:00:00:01:01', 'Fa0/1', 10],
    ['00:00:00:00:03:01', 'Fa0/2', 10],
  ]);
});

test('trunk links carry only VLANs explicitly allowed end to end', () => {
  const pc = { id: 'pc', name: 'PC', type: 'pc', powerState: 'on', interfaces: [{ id: 'pc0', name: 'Fa0', mac: '00:00:00:00:00:01', status: 'up' }] };
  const sw1 = { id: 'sw1', name: 'SW1', type: 'switch', powerState: 'on', interfaces: [
    { id: 'a1', name: 'Fa0/1', mac: '00:00:00:00:01:01', status: 'up', vlan: 10 },
    { id: 't1', name: 'Gi0/1', mac: '00:00:00:00:01:02', status: 'up', mode: 'trunk', allowedVlans: [10] },
  ] };
  const sw2 = { id: 'sw2', name: 'SW2', type: 'switch', powerState: 'on', interfaces: [
    { id: 't2', name: 'Gi0/1', mac: '00:00:00:00:02:01', status: 'up', mode: 'trunk', allowedVlans: [10] },
    { id: 'a2', name: 'Fa0/1', mac: '00:00:00:00:02:02', status: 'up', vlan: 10 },
  ] };
  const server = { id: 'srv', name: 'Server', type: 'server', powerState: 'on', interfaces: [{ id: 'srv0', name: 'Fa0', mac: '00:00:00:00:00:02', status: 'up' }] };
  const links = [
    { id: 'l1', sourceDeviceId: 'pc', sourcePortId: 'pc0', targetDeviceId: 'sw1', targetPortId: 'a1', cableType: 'straight', status: 'up' },
    { id: 'l2', sourceDeviceId: 'sw1', sourcePortId: 't1', targetDeviceId: 'sw2', targetPortId: 't2', cableType: 'straight', status: 'up' },
    { id: 'l3', sourceDeviceId: 'sw2', sourcePortId: 'a2', targetDeviceId: 'srv', targetPortId: 'srv0', cableType: 'straight', status: 'up' },
  ];
  assert.ok(findDevicePath([pc, sw1, sw2, server], links, 'pc', 'srv'));
  sw2.interfaces[0].allowedVlans = [20];
  assert.equal(findDevicePath([pc, sw1, sw2, server], links, 'pc', 'srv'), null);
});

test('DTP dynamic desirable negotiates a trunk with auto while auto-to-auto stays access', () => {
  const pc = { id: 'dtp-pc', name: 'PC', type: 'pc', powerState: 'on', interfaces: [{ id: 'dtp-pc0', name: 'Fa0', mac: '00:00:00:00:00:01', status: 'up' }] };
  const sw1 = { id: 'dtp-sw1', name: 'SW1', type: 'switch', powerState: 'on', interfaces: [
    { id: 'dtp-a1', name: 'Fa0/1', mac: '00:00:00:00:01:01', status: 'up', vlan: 10 },
    { id: 'dtp-t1', name: 'Gi0/1', mac: '00:00:00:00:01:02', status: 'up', mode: 'dynamic-desirable', vlan: 1 },
  ] };
  const sw2 = { id: 'dtp-sw2', name: 'SW2', type: 'switch', powerState: 'on', interfaces: [
    { id: 'dtp-t2', name: 'Gi0/1', mac: '00:00:00:00:02:01', status: 'up', mode: 'dynamic-auto', vlan: 20 },
    { id: 'dtp-a2', name: 'Fa0/1', mac: '00:00:00:00:02:02', status: 'up', vlan: 10 },
  ] };
  const server = { id: 'dtp-srv', name: 'Server', type: 'server', powerState: 'on', interfaces: [{ id: 'dtp-srv0', name: 'Fa0', mac: '00:00:00:00:00:02', status: 'up' }] };
  const links = [
    { id: 'dtp-l1', sourceDeviceId: pc.id, sourcePortId: 'dtp-pc0', targetDeviceId: sw1.id, targetPortId: 'dtp-a1', cableType: 'straight', status: 'up' },
    { id: 'dtp-l2', sourceDeviceId: sw1.id, sourcePortId: 'dtp-t1', targetDeviceId: sw2.id, targetPortId: 'dtp-t2', cableType: 'straight', status: 'up' },
    { id: 'dtp-l3', sourceDeviceId: sw2.id, sourcePortId: 'dtp-a2', targetDeviceId: server.id, targetPortId: 'dtp-srv0', cableType: 'straight', status: 'up' },
  ];
  assert.ok(findDevicePath([pc, sw1, sw2, server], links, pc.id, server.id));
  sw1.interfaces[1].mode = 'dynamic-auto';
  assert.equal(findDevicePath([pc, sw1, sw2, server], links, pc.id, server.id), null);
});

test('ignores links whose endpoint interface does not exist', () => {
  const { devices, links } = makeTopology();
  links[0].targetPortId = 'missing-interface';

  assert.equal(findDevicePath(devices, links, 'pc-1', 'server-1'), null);
});

test('reports a physical-path drop instead of traversing a disabled interface', () => {
  const { devices, links } = makeTopology({ sourceInterfaceStatus: 'down' });
  const trace = generateSimulationTrace(devices, links, 'pc-1', 'server-1');

  assert.equal(trace.length, 1);
  assert.match(trace[0].packetName, /Drop Error/);
  assert.match(trace[0].headers.payload, /no operational physical path/i);
});

test('rejects malformed IPv4 addresses instead of generating a packet trace', () => {
  const { devices, links } = makeTopology();
  devices[0].interfaces[0].ip = '192.168.1.999';
  const trace = generateSimulationTrace(devices, links, 'pc-1', 'server-1');

  assert.equal(trace.length, 1);
  assert.equal(trace[0].explanation.title, 'Invalid IPv4 Address');
});

test('rejects non-contiguous subnet masks', () => {
  const { devices, links } = makeTopology();
  devices[1].interfaces[0].subnetMask = '255.0.255.0';
  const trace = generateSimulationTrace(devices, links, 'pc-1', 'server-1');

  assert.equal(trace.length, 1);
  assert.equal(trace[0].explanation.title, 'Invalid Subnet Mask');
});

test('rejects duplicate source and destination IPv4 addresses', () => {
  const { devices, links } = makeTopology();
  devices[1].interfaces[0].ip = devices[0].interfaces[0].ip;
  const trace = generateSimulationTrace(devices, links, 'pc-1', 'server-1');

  assert.equal(trace.length, 1);
  assert.equal(trace[0].explanation.title, 'Duplicate IPv4 Address');
});

test('detects an address conflict with a third active device on the topology', () => {
  const { devices, links } = makeTopology();
  devices.push({
    ...devices[1],
    id: 'pc-duplicate',
    name: 'PC-Duplicate',
    interfaces: [{
      ...devices[1].interfaces[0],
      id: 'pc-duplicate-eth0',
      ip: devices[0].interfaces[0].ip,
    }],
  });
  const trace = generateSimulationTrace(devices, links, 'pc-1', 'server-1');

  assert.equal(trace[0].explanation.title, 'Duplicate IPv4 Address');
  assert.match(trace[0].headers.payload, /PC-1, PC-Duplicate/);
});

test('rejects remote communication when no default gateway is configured', () => {
  const { devices, links } = makeTopology();
  devices[1].interfaces[0].ip = '192.168.2.20';
  devices[0].defaultGateway = undefined;
  const trace = generateSimulationTrace(devices, links, 'pc-1', 'server-1');

  assert.equal(trace.length, 1);
  assert.equal(trace[0].explanation.title, 'Missing Default Gateway');
});

test('rejects a configured gateway that is not an active router on the path', () => {
  const { devices, links } = makeTopology();
  devices[1].interfaces[0].ip = '192.168.2.20';
  devices[0].defaultGateway = '192.168.1.1';
  const trace = generateSimulationTrace(devices, links, 'pc-1', 'server-1');

  assert.equal(trace.length, 1);
  assert.equal(trace[0].explanation.title, 'Default Gateway Is Not Reachable');
});

test('simulates routed delivery when an active route matches the outgoing interface', () => {
  const { devices, links } = makeRoutedTopology();
  const trace = generateSimulationTrace(devices, links, 'pc-1', 'server-1');

  assert.ok(trace.length > 1);
  assert.equal(trace[0].fromDeviceId, 'pc-1');
  assert.equal(trace.at(-1).toDeviceId, 'pc-1');
});

test('drops a routed packet when the router has no route to the destination network', () => {
  const { devices, links } = makeRoutedTopology();
  devices[1].routingTable = devices[1].routingTable.filter((route) =>
    route.destinationNetwork !== '10.0.1.0'
  );
  devices[1].interfaces[1].ip = undefined;
  const trace = generateSimulationTrace(devices, links, 'pc-1', 'server-1');

  assert.equal(trace.length, 1);
  assert.equal(trace[0].explanation.title, 'No Route to Destination');
});

test('uses the longest-prefix route and drops when it points away from the path', () => {
  const { devices, links } = makeRoutedTopology();
  devices[1].interfaces.push({
    id: 'router-1-gi2',
    name: 'GigabitEthernet0/2',
    ip: '10.0.2.1',
    subnetMask: '255.255.255.0',
    mac: '00:00:00:00:00:13',
    status: 'up',
  });
  devices[1].routingTable.push({
    id: 'more-specific-wrong-egress',
    destinationNetwork: '10.0.1.20',
    subnetMask: '255.255.255.255',
    nextHop: '10.0.2.2',
    interfaceName: 'GigabitEthernet0/2',
  });
  const trace = generateSimulationTrace(devices, links, 'pc-1', 'server-1');

  assert.equal(trace.length, 1);
  assert.equal(trace[0].explanation.title, 'No Route to Destination');
});

test('reports a return-path drop when the destination has no gateway', () => {
  const { devices, links } = makeRoutedTopology();
  devices[2].defaultGateway = undefined;
  const trace = generateSimulationTrace(devices, links, 'pc-1', 'server-1');

  assert.equal(trace.at(-1).explanation.title, 'No Return Gateway');
  assert.equal(trace.at(-1).fromDeviceId, 'server-1');
  assert.ok(trace.length > 1);
});

test('does not simulate ARP across subnets', () => {
  const { devices, links } = makeRoutedTopology();
  const trace = generateSimulationTrace(devices, links, 'pc-1', 'server-1', 'ARP');

  assert.equal(trace.length, 1);
  assert.equal(trace[0].explanation.title, 'ARP Cannot Cross a Router');
});

test('carries the entered ICMP message in request and echo reply packets', () => {
  const { devices, links } = makeTopology();
  const trace = generateSimulationTrace(
    devices,
    links,
    'pc-1',
    'server-1',
    'ICMP',
    'hello from the blank lab',
  );

  assert.equal(trace[0].headers.payload, 'hello from the blank lab');
  assert.equal(trace.at(-1).headers.payload, 'hello from the blank lab');
});

test('simulates an HTTP POST containing the entered message body', () => {
  const { devices, links } = makeTopology();
  const trace = generateSimulationTrace(
    devices,
    links,
    'pc-1',
    'server-1',
    'HTTP',
    'network lab test',
  );

  assert.match(trace[0].headers.payload, /POST \/message HTTP\/1\.1/);
  assert.match(trace[0].headers.payload, /network lab test/);
  assert.match(trace.at(-1).headers.payload, /network lab test/);
});

test('uses the entered hostname as the DNS query name', () => {
  const { devices, links } = makeTopology();
  const trace = generateSimulationTrace(
    devices,
    links,
    'pc-1',
    'server-1',
    'DNS',
    'server.example',
  );

  assert.match(trace[0].headers.payload, /A record for server\.example/);
});

test('composes common application protocol traces with their assigned transport and service ports', () => {
  const { devices, links } = makeTopology();
  const examples = [
    ['FTP', 'TCP', 21], ['TFTP', 'UDP', 69], ['SMTP', 'TCP', 25], ['POP3', 'TCP', 110],
    ['DNS', 'UDP', 53], ['DHCP', 'UDP', 67], ['NTP', 'UDP', 123], ['SNMP', 'UDP', 161],
    ['TELNET', 'TCP', 23], ['SSH', 'TCP', 22], ['AAA', 'TCP', 1812], ['RTP', 'UDP', 5004],
    ['TCP', 'TCP', 443], ['UDP', 'UDP', 50000],
  ];
  for (const [application, transport, port] of examples) {
    const trace = generateSimulationTrace(devices, links, 'pc-1', 'server-1', application, 'demo');
    assert.equal(trace[0].headers.ip.protocol, transport === 'TCP' ? 'TCP (6)' : 'UDP (17)', application);
    assert.equal(trace[0].headers.transport.protocol, transport, application);
    assert.equal(trace[0].headers.transport.destPort, port, application);
    assert.equal(trace[0].protocol, application);
  }
});

test('simulates ICMPv6 echo request and reply over a configured IPv6 link', () => {
  const { devices, links } = makeTopology();
  devices[0].interfaces[0].ipv6 = '2001:db8:1::10';
  devices[0].interfaces[0].ipv6Prefix = 64;
  devices[1].interfaces[0].ipv6 = '2001:db8:1::20';
  devices[1].interfaces[0].ipv6Prefix = 64;
  const trace = generateSimulationTrace(devices, links, 'pc-1', 'server-1', 'ICMPv6', 'v6 test');
  assert.equal(trace.length, 2);
  assert.equal(trace[0].headers.ethernet.type, '0x86DD (IPv6)');
  assert.equal(trace[0].headers.ipv6.nextHeader, '58 (ICMPv6)');
  assert.equal(trace[0].headers.transport.icmpType, 'Echo Request (Type 128)');
  assert.equal(trace[1].headers.transport.icmpType, 'Echo Reply (Type 129)');
});

test('ICMPv6 reports a missing IPv6 address instead of falling back to IPv4', () => {
  const { devices, links } = makeTopology();
  const trace = generateSimulationTrace(devices, links, 'pc-1', 'server-1', 'ICMPv6');
  assert.match(trace[0].headers.payload, /valid IPv6 addresses/);
});

test('routes ICMPv6 across a router only when IPv6 forwarding is enabled', () => {
  const { devices, links } = makeRoutedTopology();
  devices[0].defaultGatewayV6 = '2001:db8:1::1';
  devices[0].interfaces[0].ipv6 = '2001:db8:1::2';
  devices[0].interfaces[0].ipv6Prefix = 64;
  devices[1].interfaces[0].ipv6 = '2001:db8:1::1';
  devices[1].interfaces[0].ipv6Prefix = 64;
  devices[1].interfaces[1].ipv6 = '2001:db8:2::1';
  devices[1].interfaces[1].ipv6Prefix = 64;
  devices[2].defaultGatewayV6 = '2001:db8:2::1';
  devices[2].interfaces[0].ipv6 = '2001:db8:2::2';
  devices[2].interfaces[0].ipv6Prefix = 64;

  const disabled = generateSimulationTrace(devices, links, 'pc-1', 'server-1', 'ICMPv6');
  assert.match(disabled[0].headers.payload, /no IPv6 route/);
  devices[1].ipv6RoutingEnabled = true;
  const enabled = generateSimulationTrace(devices, links, 'pc-1', 'server-1', 'ICMPv6');
  assert.equal(enabled.length, 4);
  assert.equal(enabled[0].protocol, 'ICMPv6');
});

test('router interface ACLs filter matching IPv4 traffic and permit later matching services', () => {
  const { devices, links } = makeRoutedTopology();
  devices[1].interfaces[0].aclInbound = '101';
  devices[1].accessLists = [
    { id: 'deny-https', number: '101', action: 'deny', protocol: 'tcp', source: 'any', destination: '10.0.1.20/32', destinationPort: 443 },
    { id: 'permit-rest', number: '101', action: 'permit', protocol: 'ip', source: 'any', destination: 'any' },
  ];
  const denied = generateSimulationTrace(devices, links, 'pc-1', 'server-1', 'TCP');
  assert.match(denied[0].explanation.title, /Inbound ACL Denied/);
  const permitted = generateSimulationTrace(devices, links, 'pc-1', 'server-1', 'HTTP');
  assert.equal(permitted.length, 4);
  assert.equal(permitted.at(-1).isReturnTrip, true);
});

test('PAT overload translates outbound source and reverses reply destination at the NAT router', () => {
  const { devices, links } = makeRoutedTopology();
  const router = devices[1];
  router.interfaces[0].natRole = 'inside';
  router.interfaces[1].natRole = 'outside';
  router.accessLists = [{ id: 'pat-sources', number: '10', action: 'permit', protocol: 'ip', source: '10.0.0.0/24', destination: 'any' }];
  router.natOverload = { aclNumber: '10', outsideInterface: router.interfaces[1].name };

  const trace = generateSimulationTrace(devices, links, 'pc-1', 'server-1', 'HTTP');
  const outbound = trace.find(step => step.fromDeviceId === router.id && !step.isReturnTrip);
  const inboundReply = trace.find(step => step.fromDeviceId === router.id && step.isReturnTrip);
  assert.equal(outbound.headers.ip.sourceIp, '10.0.1.1');
  assert.notEqual(outbound.headers.transport.sourcePort, 52340);
  assert.match(outbound.explanation.whatHappened, /NAT overload translated source/);
  assert.equal(inboundReply.headers.ip.destIp, '10.0.0.2');
  assert.equal(inboundReply.headers.transport.destPort, 52340);
  assert.match(inboundReply.explanation.whatHappened, /translated the reply destination/);
});
