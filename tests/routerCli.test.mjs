import test from 'node:test';
import assert from 'node:assert/strict';
import { cliPrompt, runRouterCommand } from '../src/utils/routerCli.ts';

const router = () => ({
  id: 'r1', name: 'R1', type: 'router', x: 0, y: 0, powerState: 'on',
  interfaces: [
    { id: 'gi0', name: 'GigabitEthernet0/0', ip: '10.0.12.1', subnetMask: '255.255.255.252', mac: '00:00:00:00:00:01', status: 'up' },
    { id: 'gi1', name: 'GigabitEthernet0/1', mac: '00:00:00:00:00:02', status: 'down' },
  ], routingTable: [],
});
const run = (device, command, mode = 'priv', selectedInterface = '', protocol) =>
  runRouterCommand(device, { mode, selectedInterface, protocol }, command);

test('CLI mode transitions and interface commands update only the selected interface', () => {
  const first = run(router(), 'conf t');
  assert.equal(first.session.mode, 'config');
  const selected = run(first.device, 'int gi0/1', first.session.mode);
  assert.equal(selected.session.mode, 'config-if');
  const addressed = run(selected.device, 'ip address 192.168.4.1 255.255.255.0', selected.session.mode, selected.session.selectedInterface);
  assert.equal(addressed.device.interfaces[0].ip, '10.0.12.1');
  assert.equal(addressed.device.interfaces[1].ip, '192.168.4.1');
  const enabled = run(addressed.device, 'no shutdown', addressed.session.mode, addressed.session.selectedInterface);
  assert.equal(enabled.device.interfaces[1].status, 'up');
});

test('CLI configures WAN encapsulation and persists valid Frame Relay DLCIs', () => {
  const device = { ...router(), interfaces: [...router().interfaces, { id: 'serial', name: 'Serial0/0/0', mac: '00:00:00:00:00:03', status: 'up' }] };
  let configured = run(device, 'encapsulation frame-relay', 'config-if', 'serial');
  assert.equal(configured.device.interfaces[2].encapsulation, 'frame-relay');
  assert.match(run(configured.device, 'frame-relay interface-dlci 15', 'config-if', 'serial').output.join(' '), /DLCI must be/);
  configured = run(configured.device, 'frame-relay interface-dlci 101', 'config-if', 'serial');
  assert.equal(configured.device.interfaces[2].frameRelayDlci, 101);
  const saved = run(configured.device, 'write memory');
  assert.match(saved.device.startupConfig, /encapsulation frame-relay/);
  assert.match(saved.device.startupConfig, /frame-relay interface-dlci 101/);
});

test('CLI rejects invalid masks, missing interfaces, and unreachable static next hops', () => {
  const badMask = run(router(), 'ip address 10.0.0.1 255.0.255.0', 'config-if', 'gi0');
  assert.match(badMask.output.join(' '), /Invalid IPv4 address/);
  const missing = run(router(), 'interface gi0/9', 'config');
  assert.match(missing.output.join(' '), /Invalid or ambiguous interface/);
  const noRoute = run(router(), 'ip route 192.168.2.0 255.255.255.0 172.16.0.2', 'config');
  assert.match(noRoute.output.join(' '), /Next hop is not reachable/);
  assert.equal(noRoute.device.routingTable.length, 0);
});

test('CLI installs and removes valid routes and derives connected prefixes from masks', () => {
  const device = router();
  const installed = run(device, 'ip route 192.168.2.0 255.255.255.0 10.0.12.2', 'config');
  assert.equal(installed.device.routingTable[0].interfaceName, 'GigabitEthernet0/0');
  const table = run(installed.device, 'show ip route');
  assert.match(table.output.join('\n'), /C\s+10\.0\.12\.0\/30/);
  assert.match(table.output.join('\n'), /S\s+192\.168\.2\.0\/24/);
  const removed = run(installed.device, 'no ip route 192.168.2.0 255.255.255.0', 'config');
  assert.equal(removed.device.routingTable.length, 0);
});

test('CLI configures IPv6 addresses, forwarding, static routes, and route display', () => {
  let selected = run(router(), 'interface gi0/0', 'config');
  let addressed = run(selected.device, 'ipv6 address 2001:db8:12::1/64', selected.session.mode, selected.session.selectedInterface);
  assert.equal(addressed.device.interfaces[0].ipv6, '2001:db8:12::1');
  assert.equal(addressed.device.interfaces[0].ipv6Prefix, 64);
  assert.match(run(router(), 'ipv6 address nope/999', 'config-if', 'gi0').output.join(' '), /Usage/);

  const nextHopConfigured = {
    ...addressed.device,
    interfaces: addressed.device.interfaces.map((iface, index) => index === 0 ? iface : { ...iface, ipv6: '2001:db8:12::2', ipv6Prefix: 64, status: 'up' }),
  };
  const route = run(nextHopConfigured, 'ipv6 route 2001:db8:99::/64 2001:db8:12::2', 'config');
  assert.equal(route.device.ipv6Routes[0].interfaceName, 'GigabitEthernet0/0');
  const enabled = run(route.device, 'ipv6 unicast-routing', 'config');
  assert.equal(enabled.device.ipv6RoutingEnabled, true);
  assert.match(run(enabled.device, 'show ipv6 route').output.join('\n'), /2001:db8:99::\/64/);
});

test('CLI enables RIPng per interface and saves it in startup configuration', () => {
  let configured = run(router(), 'ipv6 router rip LAB', 'config');
  configured = run(configured.device, 'exit', configured.session.mode);
  let selected = run(configured.device, 'interface gi0/0', 'config');
  configured = run(selected.device, 'ipv6 rip LAB enable', selected.session.mode, selected.session.selectedInterface);
  assert.deepEqual(configured.device.ripngConfig, { enabled: true, processName: 'LAB', interfaces: ['gi0'] });
  const saved = run(configured.device, 'write memory');
  const restored = run({ ...router(), startupConfig: saved.device.startupConfig }, 'copy startup-config running-config');
  assert.deepEqual(restored.device.ripngConfig, configured.device.ripngConfig);
});

test('CLI saves and displays startup configuration and never fabricates ping success', () => {
  let configured = run(router(), 'ip address 10.0.12.10 255.255.255.252', 'config-if', 'gi0');
  const saved = run(configured.device, 'write memory');
  assert.match(saved.device.startupConfig, /hostname R1/);
  const startup = run(saved.device, 'show startup-config');
  assert.match(startup.output.join('\n'), /interface GigabitEthernet0\/0/);
  configured = run(saved.device, 'ip address 10.0.12.11 255.255.255.252', 'config-if', 'gi0');
  const restored = run(configured.device, 'copy startup-config running-config');
  assert.equal(restored.device.interfaces[0].ip, '10.0.12.10');
  assert.match(restored.output.join(' '), /restored/);
  const ping = run(saved.device, 'ping 192.168.1.1');
  assert.match(ping.output.join(' '), /Send Message/);
  assert.doesNotMatch(ping.output.join(' '), /Success rate is 100 percent/);
  assert.equal(cliPrompt(saved.device, 'config-if'), 'R1(config-if)#');
});

test('CLI accepts RIP v2 and OSPF single-area configuration as real device state', () => {
  let result = run(router(), 'router rip', 'config');
  assert.equal(result.session.mode, 'config-router');
  result = run(result.device, 'version 2', result.session.mode, '', result.session.protocol);
  result = run(result.device, 'network 10.0.12.0', result.session.mode, '', result.session.protocol);
  assert.equal(result.device.ripConfig.enabled, true);
  assert.deepEqual(result.device.ripConfig.networks, ['10.0.12.0']);
  const ospf = run(router(), 'router ospf 10', 'config');
  const network = run(ospf.device, 'network 10.0.12.0 0.0.0.3 area 0', ospf.session.mode, '', ospf.session.protocol);
  assert.deepEqual(network.device.ospfConfig.networks, [{ network: '10.0.12.0', wildcard: '0.0.0.3', area: 0 }]);
});

test('CLI enables OSPF static redistribution and persists it in startup configuration', () => {
  let configured = run(router(), 'router ospf 7', 'config');
  configured = run(configured.device, 'redistribute static', configured.session.mode, configured.session.selectedInterface, configured.session.protocol);
  assert.equal(configured.device.ospfConfig.redistributeStatic, true);
  const saved = run(configured.device, 'write memory');
  const restored = run({ ...router(), startupConfig: saved.device.startupConfig }, 'copy startup-config running-config');
  assert.equal(restored.device.ospfConfig.redistributeStatic, true);
});

test('CLI enables and saves connected route redistribution into OSPF', () => {
  let configured = run(router(), 'router ospf 1', 'config');
  configured = { ...configured, device: { ...configured.device, ospfConfig: { enabled: true, processId: 1, networks: [] } }, session: { ...configured.session, mode: 'config-router', protocol: 'ospf' } };
  configured = run(configured.device, 'redistribute connected', configured.session.mode, '', configured.session.protocol);
  assert.equal(configured.device.ospfConfig.redistributeConnected, true);
  const saved = run(configured.device, 'write memory');
  assert.match(saved.device.startupConfig, /redistribute connected/);
});

test('CLI configures EIGRP AS and reciprocal BGP neighbors', () => {
  let eigrp = run(router(), 'router eigrp 100', 'config');
  eigrp = run(eigrp.device, 'network 10.0.12.0', eigrp.session.mode, '', eigrp.session.protocol);
  assert.equal(eigrp.device.eigrpConfig.asNumber, 100);
  assert.deepEqual(eigrp.device.eigrpConfig.networks, ['10.0.12.0']);
  let bgp = run(router(), 'router bgp 65001', 'config');
  bgp = run(bgp.device, 'neighbor 10.0.12.2 remote-as 65002', bgp.session.mode, '', bgp.session.protocol);
  bgp = run(bgp.device, 'network 10.0.12.0 255.255.255.252', bgp.session.mode, '', bgp.session.protocol);
  assert.deepEqual(bgp.device.bgpConfig.neighbors, [{ ip: '10.0.12.2', remoteAs: 65002 }]);
  assert.deepEqual(bgp.device.bgpConfig.networks, ['10.0.12.0/30']);
});

test('CLI configures spanning-tree mode on switches and reports its limits', () => {
  const sw = { ...router(), type: 'switch' };
  const configured = run(sw, 'spanning-tree mode rapid-pvst', 'config');
  assert.equal(configured.device.spanningTreeMode, 'rapid-pvst');
  assert.match(run(configured.device, 'show spanning-tree').output.join('\n'), /rapid-pvst/);
  assert.match(run(router(), 'spanning-tree mode rapid-pvst', 'config').output.join(' '), /switches only/);
});

test('CLI creates IPv4 ACL rules, binds them to an interface, and displays them', () => {
  let configured = run(router(), 'access-list 101 deny tcp any host 192.0.2.10 eq 443', 'config');
  configured = run(configured.device, 'access-list 101 permit ip any any', 'config');
  const selected = run(configured.device, 'interface gi0/0', 'config');
  const attached = run(selected.device, 'ip access-group 101 in', selected.session.mode, selected.session.selectedInterface);
  assert.equal(attached.device.interfaces[0].aclInbound, '101');
  assert.equal(attached.device.accessLists.length, 2);
  assert.match(run(attached.device, 'show access-lists').output.join('\n'), /deny tcp any host 192\.0\.2\.10 eq 443/);
});

test('CLI preserves ACL rules and interface bindings in startup configuration', () => {
  let configured = run(router(), 'access-list 101 permit ip any any', 'config');
  const selected = run(configured.device, 'interface gi0/0', 'config');
  configured = run(selected.device, 'ip access-group 101 in', selected.session.mode, selected.session.selectedInterface);
  const saved = run(configured.device, 'write memory');
  const restored = run({ ...router(), startupConfig: saved.device.startupConfig }, 'copy startup-config running-config');
  assert.equal(restored.device.interfaces[0].aclInbound, '101');
  assert.equal(restored.device.accessLists[0].action, 'permit');
});

test('CLI configures NAT roles and PAT overload and saves them to startup configuration', () => {
  let configured = run(router(), 'access-list 10 permit ip 10.0.0.0/24', 'config');
  let selected = run(configured.device, 'interface gi0/0', 'config');
  configured = run(selected.device, 'ip nat inside', selected.session.mode, selected.session.selectedInterface);
  selected = run(configured.device, 'interface gi0/1', 'config');
  configured = run(selected.device, 'ip nat outside', selected.session.mode, selected.session.selectedInterface);
  configured = run(configured.device, 'ip nat inside source list 10 interface gi0/1 overload', 'config');
  assert.deepEqual(configured.device.interfaces.map(iface => iface.natRole), ['inside', 'outside']);
  assert.deepEqual(configured.device.natOverload, { aclNumber: '10', outsideInterface: 'GigabitEthernet0/1' });
  const saved = run(configured.device, 'write memory');
  const restored = run({ ...router(), startupConfig: saved.device.startupConfig }, 'copy startup-config running-config');
  assert.deepEqual(restored.device.interfaces.map(iface => iface.natRole), ['inside', 'outside']);
  assert.deepEqual(restored.device.natOverload, configured.device.natOverload);
});

test('CLI configures access VLANs and trunk allowed VLAN lists', () => {
  const sw = { ...router(), type: 'switch' };
  let created = run(sw, 'vlan 20', 'config');
  created = runRouterCommand(created.device, created.session, 'name STUDENTS');
  assert.equal(created.device.vlans.find(vlan => vlan.id === 20).name, 'STUDENTS');
  let result = run(created.device, 'switchport access vlan 20', 'config-if', 'gi0');
  assert.equal(result.device.interfaces[0].vlan, 20);
  assert.equal(result.device.interfaces[0].mode, 'access');
  result = run(result.device, 'switchport mode trunk', 'config-if', 'gi0');
  result = run(result.device, 'switchport trunk allowed vlan 10,20', 'config-if', 'gi0');
  assert.deepEqual(result.device.interfaces[0].allowedVlans, [10, 20]);
  const bad = run(sw, 'switchport access vlan 4095', 'config-if', 'gi0');
  assert.match(bad.output.join(' '), /unavailable|Supported/);
  const removed = run(result.device, 'no vlan 20', 'config');
  assert.equal(removed.device.interfaces[0].vlan, 1);
  const dtp = run(result.device, 'switchport mode dynamic desirable', 'config-if', 'gi0');
  assert.equal(dtp.device.interfaces[0].mode, 'dynamic-desirable');
});

test('CLI configures and persists VTP server/client domain settings', () => {
  const sw = { ...router(), type: 'switch' };
  let configured = run(sw, 'vtp domain CAMPUS', 'config');
  configured = run(configured.device, 'vtp mode client', 'config');
  configured = run(configured.device, 'vtp version 2', 'config');
  assert.deepEqual(configured.device.vtpConfig, { mode: 'client', domain: 'CAMPUS', version: 2 });
  const saved = run(configured.device, 'write memory');
  const restored = run({ ...sw, startupConfig: saved.device.startupConfig }, 'copy startup-config running-config');
  assert.deepEqual(restored.device.vtpConfig, configured.device.vtpConfig);
});

test('CDP neighbor output uses active topology neighbors and can be disabled', () => {
  const neighbors = [{ deviceName: 'SW2', localInterface: 'GigabitEthernet0/0', remoteInterface: 'GigabitEthernet0/1', capability: 'S' }];
  const shown = runRouterCommand(router(), { mode: 'priv', selectedInterface: '', cdpNeighbors: neighbors }, 'show cdp neighbors');
  assert.match(shown.output.join('\n'), /SW2/);
  assert.match(shown.output.join('\n'), /GigabitEthernet0\/1/);
  const disabled = run(router(), 'no cdp run', 'config');
  assert.equal(disabled.device.cdpEnabled, false);
});

test('show MAC and ARP commands display learned device state instead of sample output', () => {
  const device = { ...router(), macTable: [{ mac: '00:11:22:33:44:55', port: 'GigabitEthernet0/0', vlan: 10, type: 'DYNAMIC' }], arpCache: { '192.168.1.10': '00:aa:bb:cc:dd:ee' } };
  const mac = run(device, 'show mac address-table');
  assert.match(mac.output.join('\n'), /00:11:22:33:44:55/);
  const arp = run(device, 'show arp');
  assert.match(arp.output.join('\n'), /192\.168\.1\.10/);
});
