import assert from 'node:assert/strict';
import test from 'node:test';

import { findDevicePath, generateSimulationTrace } from '../src/utils/simulationEngine.ts';

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
