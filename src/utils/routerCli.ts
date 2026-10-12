import { AccessListRule, Ipv6RouteEntry, NetworkDevice, RouteEntry } from '../types/network';

export type CliMode = 'user' | 'priv' | 'config' | 'config-if' | 'config-router' | 'config-vlan' | 'config-line';
export interface CliSession { mode: CliMode; selectedInterface: string; selectedVlan?: number; lineKind?: 'console' | 'vty'; protocol?: 'rip' | 'ripng' | 'ospf' | 'eigrp' | 'bgp'; cdpNeighbors?: Array<{ deviceName: string; localInterface: string; remoteInterface: string; capability: string }>; }
export interface CliResult { device: NetworkDevice; session: CliSession; output: string[]; }

const ipv4Number = (value: string): number | null => {
  const octets = value.split('.');
  if (octets.length !== 4 || octets.some(part => !/^\d{1,3}$/.test(part) || Number(part) > 255)) return null;
  return octets.reduce((number, part) => ((number << 8) | Number(part)) >>> 0, 0);
};
const ipv6Number = (value: string): bigint | null => {
  const halves = value.toLowerCase().split('::');
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(':') : [];
  const right = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  const missing = 8 - left.length - right.length;
  if ((halves.length === 1 && missing !== 0) || (halves.length === 2 && missing < 1)) return null;
  const groups = [...left, ...Array(missing).fill('0'), ...right];
  if (groups.length !== 8 || groups.some(group => !/^[0-9a-f]{1,4}$/.test(group))) return null;
  return groups.reduce((result, group) => (result << 16n) | BigInt(`0x${group}`), 0n);
};
const ipv6InPrefix = (address: string, prefix: string) => {
  const [network, lengthText] = prefix.split('/');
  const addr = ipv6Number(address), base = ipv6Number(network), length = Number(lengthText);
  if (addr === null || base === null || !Number.isInteger(length) || length < 0 || length > 128) return false;
  const shift = BigInt(128 - length);
  return (addr >> shift) === (base >> shift);
};
const ipv6AddressCommand = (iface: NetworkDevice['interfaces'][number]) =>
  iface.ipv6?.includes('/') ? iface.ipv6 : `${iface.ipv6}/${iface.ipv6Prefix ?? 64}`;
const switchportModeCommand = (mode: NonNullable<NetworkDevice['interfaces'][number]['mode']>) => mode.startsWith('dynamic-') ? `switchport mode dynamic ${mode.slice(8)}` : `switchport mode ${mode}`;
const parseAclAddress = (parts: string[], start: number): { value: string; next: number } | null => {
  if (parts[start] === 'any') return { value: 'any', next: start + 1 };
  if (parts[start] === 'host' && ipv4Number(parts[start + 1] || '') !== null) return { value: `${parts[start + 1]}/32`, next: start + 2 };
  const value = parts[start] || '';
  if (ipv4Number(value) !== null && ipv4Number(parts[start + 1] || '') !== null) {
    const wildcard = ipv4Number(parts[start + 1])!;
    const mask = (~wildcard) >>> 0;
    if ((wildcard & (wildcard + 1)) === 0) return { value: `${value}/${mask.toString(2).replace(/0/g, '').length}`, next: start + 2 };
  }
  const [address, lengthText] = value.split('/');
  const length = Number(lengthText);
  if (ipv4Number(address) !== null && value.includes('/') && Number.isInteger(length) && length >= 0 && length <= 32) return { value, next: start + 1 };
  return null;
};
const aclRuleCommand = (rule: AccessListRule) => {
  const addressText = (value: string) => value === 'any' ? 'any' : value.endsWith('/32') ? `host ${value.slice(0, -3)}` : value;
  return `access-list ${rule.number} ${rule.action} ${rule.protocol} ${addressText(rule.source)} ${addressText(rule.destination)}${rule.destinationPort ? ` eq ${rule.destinationPort}` : ''}`;
};
const validMask = (mask: string) => {
  const value = ipv4Number(mask);
  if (value === null) return false;
  const inverse = (~value) >>> 0;
  return (inverse & (inverse + 1)) === 0;
};
const prefix = (mask: string) => ipv4Number(mask)!.toString(2).replace(/0/g, '').length;
const normalize = (name: string) => name.toLowerCase().replace(/[^a-z0-9/]/g, '')
  .replace(/^gigabitethernet/, 'gi').replace(/^fastethernet/, 'fa').replace(/^tengigabitethernet/, 'te').replace(/^serial/, 'se');
const matchInterface = (device: NetworkDevice, requested: string) => {
  const key = normalize(requested);
  const matches = device.interfaces.filter(item => normalize(item.name) === key);
  return matches.length === 1 ? matches[0] : undefined;
};
const networkOf = (ip: string, mask: string) => ((ipv4Number(ip)! & ipv4Number(mask)!) >>> 0);

export function runRouterCommand(device: NetworkDevice, session: CliSession, raw: string): CliResult {
  let nextDevice = device;
  let nextSession = { ...session };
  const output: string[] = [];
  const command = raw.trim().replace(/^[^\r\n]*[>#]\s*/, '');
  const parts = command.split(/\s+/).filter(Boolean);
  const [first = '', second = '', third = '', fourth = '', fifth = ''] = parts.map(part => part.toLowerCase());
  const hostname = device.name || 'Router';
  const failMode = () => output.push('% Command is unavailable in this mode.');
  const finish = () => ({ device: nextDevice, session: nextSession, output });
  if (!parts.length) return finish();
  if (raw.trim() === '?' || first === 'help') {
    output.push('enable, disable, configure terminal, exit, end', 'show running-config, show startup-config, show interfaces [name], show interfaces status, show ip interface brief, show ip route [rip|ospf|eigrp|bgp], show ipv6 route, show access-lists, show spanning-tree, show ip protocols, show ip ospf neighbor, show ip eigrp neighbors|topology, show ip bgp summary, show ip nat translations', 'interface <name>, line console 0|vty 0 4, enable secret <password>, username <name> password <password>, ip address <ip> <mask>, clock rate <bps>, encapsulation, ppp authentication chap|pap, password/login/transport input, ip route, router rip|ospf|eigrp|bgp, copy running-config startup-config');
    return finish();
  }
  if ((first === 'enable' || first === 'en') && session.mode === 'user') nextSession.mode = 'priv';
  else if (first === 'disable' && session.mode === 'priv') nextSession.mode = 'user';
  else if ((first === 'configure' && ['terminal', 't'].includes(second) || first === 'conf' && second === 't') && session.mode === 'priv') nextSession.mode = 'config';
  else if (first === 'exit') nextSession.mode = session.mode === 'config-if' || session.mode === 'config-router' || session.mode === 'config-vlan' || session.mode === 'config-line' ? 'config' : session.mode === 'config' ? 'priv' : 'user';
  else if (first === 'end' && session.mode !== 'user') nextSession.mode = 'priv';
  else if ((first === 'interface' || first === 'int') && session.mode === 'config') {
    const iface = matchInterface(device, parts.slice(1).join(''));
    if (!iface) output.push(`% Invalid or ambiguous interface: ${parts.slice(1).join(' ') || '(missing)'}.`);
    else { nextSession.mode = 'config-if'; nextSession.selectedInterface = iface.id; }
  } else if (first === 'hostname' && session.mode === 'config') {
    if (!parts[1] || parts[1].length > 32) output.push('% Usage: hostname <1-32 characters>');
    else nextDevice = { ...device, name: parts[1] };
  } else if (first === 'enable' && second === 'secret' && session.mode === 'config') {
    if (!parts[2] || parts[2].length < 4) output.push('% Enable secret must be at least 4 characters.');
    else nextDevice = { ...device, enableSecret: parts[2] };
  } else if (first === 'username' && session.mode === 'config' && third === 'password' && second && parts[3]) {
    nextDevice = { ...device, localUsers: [...(device.localUsers || []).filter(user => user.username !== parts[1]), { username: parts[1], password: parts[3] }] };
  } else if (first === 'line' && session.mode === 'config' && second === 'console' && third === '0') {
    nextSession.mode = 'config-line'; nextSession.lineKind = 'console';
    nextDevice = { ...device, lineConfig: { ...device.lineConfig, console: device.lineConfig?.console || {} } };
  } else if (first === 'line' && session.mode === 'config' && second === 'vty' && /^\d+$/.test(third) && /^\d+$/.test(fourth) && Number(third) <= Number(fourth) && Number(fourth) <= 15) {
    nextSession.mode = 'config-line'; nextSession.lineKind = 'vty';
    nextDevice = { ...device, lineConfig: { ...device.lineConfig, vty: { start: Number(third), end: Number(fourth), ...(device.lineConfig?.vty || {}) } } };
  } else if (first === 'password' && session.mode === 'config-line') {
    if (!second) output.push('% Usage: password <line-password>.');
    else if (session.lineKind === 'console') nextDevice = { ...device, lineConfig: { ...device.lineConfig, console: { ...device.lineConfig?.console, password: second } } };
    else if (session.lineKind === 'vty') nextDevice = { ...device, lineConfig: { ...device.lineConfig, vty: { ...(device.lineConfig?.vty || { start: 0, end: 4 }), password: second } } };
  } else if (first === 'login' && session.mode === 'config-line') {
    if (session.lineKind === 'console') nextDevice = { ...device, lineConfig: { ...device.lineConfig, console: { ...device.lineConfig?.console, login: true } } };
    else if (session.lineKind === 'vty') nextDevice = { ...device, lineConfig: { ...device.lineConfig, vty: { ...(device.lineConfig?.vty || { start: 0, end: 4 }), login: true } } };
  } else if (first === 'transport' && second === 'input' && session.mode === 'config-line' && session.lineKind === 'vty' && ['telnet', 'ssh', 'all'].includes(third)) {
    nextDevice = { ...device, lineConfig: { ...device.lineConfig, vty: { ...(device.lineConfig?.vty || { start: 0, end: 4 }), transport: third as 'telnet' | 'ssh' | 'all' } } };
  } else if (first === 'access-list' && session.mode === 'config') {
    const number = second, action = third, protocol = fourth as AccessListRule['protocol'];
    const extended = Number(number) >= 100 && Number(number) <= 199;
    const standard = Number(number) >= 1 && Number(number) <= 99;
    const effectiveProtocol: AccessListRule['protocol'] = standard ? 'ip' : protocol;
    const sourceIndex = standard ? (protocol === 'ip' ? 4 : 3) : 4;
    const source = parseAclAddress(parts, sourceIndex);
    const destination = extended && source ? parseAclAddress(parts, source.next) : null;
    const portIndex = destination?.next ?? parts.length;
    const port = parts[portIndex] === 'eq' ? Number(parts[portIndex + 1]) : undefined;
    if (!/^\d+$/.test(number) || Number(number) < 1 || Number(number) > 199 || !['permit', 'deny'].includes(action) || (!standard && !['ip', 'tcp', 'udp', 'icmp'].includes(protocol)) || !source || (extended && !destination) || (parts[portIndex] === 'eq' && (!Number.isInteger(port) || port! < 1 || port! > 65535))) output.push('% Usage: access-list <1-99> permit|deny <source> <wildcard> or access-list <100-199> permit|deny <protocol> <source> <destination> [eq port].');
    else {
      const rule: AccessListRule = { id: `acl-${number}-${Date.now()}-${(device.accessLists || []).length + 1}`, number, action: action as 'permit' | 'deny', protocol: effectiveProtocol, source: source.value, destination: destination?.value || 'any', ...(port ? { destinationPort: port } : {}) };
      nextDevice = { ...device, accessLists: [...(device.accessLists || []), rule] };
    }
  } else if (first === 'no' && second === 'access-list' && session.mode === 'config') {
    nextDevice = { ...device, accessLists: (device.accessLists || []).filter(rule => rule.number !== third) };
  } else if (first === 'ip' && second === 'nat' && third === 'inside' && fourth === 'source' && session.mode === 'config') {
    const aclNumber = parts[5] || '', interfaceName = parts[7] || '';
    const outside = device.interfaces.find(iface => normalize(iface.name) === normalize(interfaceName));
    if (parts[4] !== 'list' || !device.accessLists?.some(rule => rule.number === aclNumber) || parts[6] !== 'interface' || !outside || parts[8] !== 'overload') output.push('% Usage: ip nat inside source list <existing ACL> interface <outside-interface> overload.');
    else nextDevice = { ...device, natOverload: { aclNumber, outsideInterface: outside.name } };
  } else if (first === 'no' && second === 'ip' && third === 'nat' && session.mode === 'config') {
    nextDevice = { ...device, natOverload: undefined };
  } else if (first === 'vlan' && session.mode === 'config') {
    const vlanId = Number(second);
    if (device.type !== 'switch') output.push('% VLAN configuration is supported on switches only.');
    else if (!Number.isInteger(vlanId) || vlanId < 1 || vlanId > 4094) output.push('% VLAN ID must be between 1 and 4094.');
    else {
      nextDevice = { ...device, vlans: [...(device.vlans || [{ id: 1, name: 'default', status: 'active' as const }]).filter(item => item.id !== vlanId), { id: vlanId, name: `VLAN${vlanId}`, status: 'active' }] };
      nextSession.mode = 'config-vlan'; nextSession.selectedVlan = vlanId;
    }
  } else if (first === 'spanning-tree' && second === 'mode' && session.mode === 'config') {
    if (device.type !== 'switch') output.push('% Spanning-tree mode is supported on switches only.');
    else if (!['pvst', 'rapid-pvst', 'off'].includes(third)) output.push('% Usage: spanning-tree mode pvst|rapid-pvst|off.');
    else nextDevice = { ...device, spanningTreeMode: third as 'pvst' | 'rapid-pvst' | 'off' };
  } else if (first === 'vtp' && session.mode === 'config') {
    if (device.type !== 'switch') output.push('% VTP is supported on switches only.');
    else if (second === 'domain' && parts[2] && parts[2].length <= 32) nextDevice = { ...device, vtpConfig: { mode: device.vtpConfig?.mode || 'server', domain: parts[2], version: device.vtpConfig?.version || 1 } };
    else if (second === 'mode' && ['server', 'client', 'transparent'].includes(third)) nextDevice = { ...device, vtpConfig: { mode: third as 'server' | 'client' | 'transparent', domain: device.vtpConfig?.domain || 'NETLEARN', version: device.vtpConfig?.version || 1 } };
    else if (second === 'version' && ['1', '2', '3'].includes(third)) nextDevice = { ...device, vtpConfig: { mode: device.vtpConfig?.mode || 'server', domain: device.vtpConfig?.domain || 'NETLEARN', version: Number(third) as 1 | 2 | 3 } };
    else output.push('% Usage: vtp domain <name>, vtp mode server|client|transparent, vtp version 1|2|3.');
  } else if (first === 'no' && second === 'cdp' && third === 'run' && session.mode === 'config') {
    nextDevice = { ...device, cdpEnabled: false };
  } else if (first === 'cdp' && second === 'run' && session.mode === 'config') {
    nextDevice = { ...device, cdpEnabled: true };
  } else if (first === 'no' && second === 'vlan' && session.mode === 'config') {
    const vlanId = Number(third);
    if (device.type !== 'switch') output.push('% VLAN configuration is supported on switches only.');
    else if (!Number.isInteger(vlanId) || vlanId <= 1 || vlanId > 4094) output.push('% Only VLAN IDs 2-4094 can be deleted.');
    else nextDevice = { ...device, vlans: (device.vlans || []).filter(item => item.id !== vlanId), interfaces: device.interfaces.map(iface => iface.vlan === vlanId ? { ...iface, vlan: 1 } : iface) };
  } else if (first === 'name' && session.mode === 'config-vlan') {
    const vlanName = parts.slice(1).join(' ');
    if (!vlanName || vlanName.length > 32) output.push('% VLAN name must contain 1-32 characters.');
    else nextDevice = { ...device, vlans: (device.vlans || []).map(item => item.id === session.selectedVlan ? { ...item, name: vlanName } : item) };
  } else if (first === 'router' && session.mode === 'config' && second === 'rip') {
    nextSession.mode = 'config-router'; nextSession.protocol = 'rip';
    nextDevice = { ...device, ripConfig: { enabled: true, version: device.ripConfig?.version || 2, networks: device.ripConfig?.networks || [], noAutoSummary: device.ripConfig?.noAutoSummary || false } };
  } else if (first === 'router' && session.mode === 'config' && second === 'ospf' && Number.isInteger(Number(third)) && Number(third) > 0) {
    nextSession.mode = 'config-router'; nextSession.protocol = 'ospf';
    nextDevice = { ...device, ospfConfig: { enabled: true, processId: Number(third), networks: device.ospfConfig?.networks || [] } };
  } else if (first === 'router' && session.mode === 'config' && second === 'eigrp' && Number.isInteger(Number(third)) && Number(third) > 0) {
    nextSession.mode = 'config-router'; nextSession.protocol = 'eigrp';
    nextDevice = { ...device, eigrpConfig: { enabled: true, asNumber: Number(third), networks: device.eigrpConfig?.networks || [], noAutoSummary: device.eigrpConfig?.noAutoSummary || false } };
  } else if (first === 'router' && session.mode === 'config' && second === 'bgp' && Number.isInteger(Number(third)) && Number(third) > 0) {
    nextSession.mode = 'config-router'; nextSession.protocol = 'bgp';
    nextDevice = { ...device, bgpConfig: { enabled: true, asNumber: Number(third), neighbors: device.bgpConfig?.neighbors || [], networks: device.bgpConfig?.networks || [] } };
  } else if (session.mode === 'config-router' && session.protocol === 'rip' && first === 'version' && ['1', '2'].includes(second)) {
    nextDevice = { ...device, ripConfig: { enabled: true, version: Number(second) as 1 | 2, networks: device.ripConfig?.networks || [], noAutoSummary: device.ripConfig?.noAutoSummary || false } };
  } else if (session.mode === 'config-router' && session.protocol === 'rip' && first === 'network' && ipv4Number(parts[1] || '') !== null) {
    nextDevice = { ...device, ripConfig: { enabled: true, version: device.ripConfig?.version || 2, networks: [...new Set([...(device.ripConfig?.networks || []), parts[1]])], noAutoSummary: device.ripConfig?.noAutoSummary || false } };
  } else if (session.mode === 'config-router' && session.protocol === 'rip' && first === 'no' && second === 'auto-summary') {
    nextDevice = { ...device, ripConfig: { enabled: true, version: device.ripConfig?.version || 2, networks: device.ripConfig?.networks || [], noAutoSummary: true } };
  } else if (session.mode === 'config-router' && session.protocol === 'ospf' && first === 'network' && parts.length >= 5 && fourth === 'area') {
    const network = parts[1], wildcard = parts[2], area = Number(parts[4]);
    if (ipv4Number(network) === null || ipv4Number(wildcard) === null || !Number.isInteger(area) || area < 0) output.push('% Usage: network <address> <wildcard-mask> area <area-id>');
    else nextDevice = { ...device, ospfConfig: { enabled: true, processId: device.ospfConfig?.processId || 1, networks: [...(device.ospfConfig?.networks || []).filter(item => item.network !== network || item.wildcard !== wildcard), { network, wildcard, area }] } };
  } else if (session.mode === 'config-router' && session.protocol === 'ospf' && first === 'redistribute' && second === 'static') {
    nextDevice = { ...device, ospfConfig: { enabled: true, processId: device.ospfConfig?.processId || 1, networks: device.ospfConfig?.networks || [], redistributeStatic: true } };
  } else if (session.mode === 'config-router' && session.protocol === 'ospf' && first === 'redistribute' && second === 'connected') {
    nextDevice = { ...device, ospfConfig: { enabled: true, processId: device.ospfConfig?.processId || 1, networks: device.ospfConfig?.networks || [], redistributeStatic: device.ospfConfig?.redistributeStatic, redistributeConnected: true } };
  } else if (session.mode === 'config-router' && session.protocol === 'ospf' && first === 'no' && second === 'redistribute' && third === 'connected') {
    nextDevice = { ...device, ospfConfig: { ...device.ospfConfig!, redistributeConnected: false } };
  } else if (session.mode === 'config-router' && session.protocol === 'ospf' && first === 'no' && second === 'redistribute' && third === 'static') {
    if (device.ospfConfig) nextDevice = { ...device, ospfConfig: { ...device.ospfConfig, redistributeStatic: false } };
  } else if (session.mode === 'config-router' && session.protocol === 'eigrp' && first === 'network' && ipv4Number(parts[1] || '') !== null) {
    nextDevice = { ...device, eigrpConfig: { enabled: true, asNumber: device.eigrpConfig?.asNumber || 1, networks: [...new Set([...(device.eigrpConfig?.networks || []), parts[1]])], noAutoSummary: device.eigrpConfig?.noAutoSummary || false } };
  } else if (session.mode === 'config-router' && session.protocol === 'eigrp' && first === 'no' && second === 'auto-summary') {
    nextDevice = { ...device, eigrpConfig: { enabled: true, asNumber: device.eigrpConfig?.asNumber || 1, networks: device.eigrpConfig?.networks || [], noAutoSummary: true } };
  } else if (session.mode === 'config-router' && session.protocol === 'bgp' && first === 'network') {
    const [network, prefixPart] = (parts[1] || '').split('/');
    const mask = prefixPart && /^\d+$/.test(prefixPart) && Number(prefixPart) <= 32
      ? (Number(prefixPart) === 0 ? 0 : (0xffffffff << (32 - Number(prefixPart))) >>> 0).toString(2).padStart(32, '0').match(/.{8}/g)!.map(byte => parseInt(byte, 2)).join('.')
      : parts[2] === 'mask' ? parts[3] || '' : parts[2] || '';
    if (ipv4Number(network || '') === null || !validMask(mask)) output.push('% Usage: network <network>/<prefix> or network <network> <mask>');
    else nextDevice = { ...device, bgpConfig: { enabled: true, asNumber: device.bgpConfig?.asNumber || 1, neighbors: device.bgpConfig?.neighbors || [], networks: [...new Set([...(device.bgpConfig?.networks || []), `${network}/${prefix(mask)}`])] } };
  } else if (session.mode === 'config-router' && session.protocol === 'bgp' && first === 'neighbor' && second && ipv4Number(second) !== null && third === 'remote-as' && Number.isInteger(Number(fourth)) && Number(fourth) > 0) {
    const neighbor = { ip: second, remoteAs: Number(fourth) };
    nextDevice = { ...device, bgpConfig: { enabled: true, asNumber: device.bgpConfig?.asNumber || 1, neighbors: [...(device.bgpConfig?.neighbors || []).filter(item => item.ip !== second), neighbor], networks: device.bgpConfig?.networks || [] } };
  } else if (session.mode === 'config-router' && first === 'no' && second === 'router') {
    if (session.protocol === 'rip' && device.ripConfig) nextDevice = { ...device, ripConfig: { ...device.ripConfig, enabled: false } };
    if (session.protocol === 'ospf' && device.ospfConfig) nextDevice = { ...device, ospfConfig: { ...device.ospfConfig, enabled: false } };
  } else if (first === 'ip' && second === 'address' && session.mode === 'config-if') {
    const address = ipv4Number(parts[2] || ''), mask = parts[3] || '';
    const iface = device.interfaces.find(item => item.id === session.selectedInterface);
    if (!iface) output.push('% Selected interface no longer exists.');
    else if (address === null || !validMask(mask)) output.push('% Invalid IPv4 address or non-contiguous subnet mask.');
    else if (device.interfaces.some(item => item.id !== iface.id && item.ip === parts[2])) output.push('% Duplicate IPv4 address on this device.');
    else nextDevice = { ...device, interfaces: device.interfaces.map(item => item.id === iface.id ? { ...item, ip: parts[2], subnetMask: mask } : item) };
  } else if (first === 'ipv6' && second === 'address' && session.mode === 'config-if') {
    const [address, prefixText] = (parts[2] || '').split('/');
    const length = Number(prefixText);
    const iface = device.interfaces.find(item => item.id === session.selectedInterface);
    if (!iface) output.push('% Selected interface no longer exists.');
    else if (ipv6Number(address || '') === null || !Number.isInteger(length) || length < 0 || length > 128) output.push('% Usage: ipv6 address <IPv6-address>/<0-128>.');
    else if (device.interfaces.some(item => item.id !== iface.id && item.ipv6?.split('/')[0].toLowerCase() === address.toLowerCase())) output.push('% Duplicate IPv6 address on this device.');
    else nextDevice = { ...device, interfaces: device.interfaces.map(item => item.id === iface.id ? { ...item, ipv6: address, ipv6Prefix: length } : item) };
  } else if (first === 'ip' && second === 'access-group' && session.mode === 'config-if') {
    const iface = device.interfaces.find(item => item.id === session.selectedInterface);
    if (!iface) output.push('% Selected interface no longer exists.');
    else if (!device.accessLists?.some(rule => rule.number === third) || !['in', 'out'].includes(fourth)) output.push('% ACL must exist first. Usage: ip access-group <number> in|out.');
    else nextDevice = { ...device, interfaces: device.interfaces.map(item => item.id === iface.id ? { ...item, ...(fourth === 'in' ? { aclInbound: third } : { aclOutbound: third }) } : item) };
  } else if (first === 'ip' && second === 'nat' && session.mode === 'config-if') {
    const iface = device.interfaces.find(item => item.id === session.selectedInterface);
    if (!iface) output.push('% Selected interface no longer exists.');
    else if (!['inside', 'outside'].includes(third)) output.push('% Usage: ip nat inside|outside.');
    else nextDevice = { ...device, interfaces: device.interfaces.map(item => item.id === iface.id ? { ...item, natRole: third as 'inside' | 'outside' } : item) };
  } else if (first === 'no' && second === 'ip' && third === 'access-group' && session.mode === 'config-if') {
    const iface = device.interfaces.find(item => item.id === session.selectedInterface);
    if (iface) nextDevice = { ...device, interfaces: device.interfaces.map(item => item.id === iface.id ? { ...item, ...(fifth === 'in' ? { aclInbound: undefined } : { aclOutbound: undefined }) } : item) };
  } else if (first === 'description' && session.mode === 'config-if') {
    const iface = device.interfaces.find(item => item.id === session.selectedInterface);
    if (!iface) output.push('% Selected interface no longer exists.');
    else nextDevice = { ...device, interfaces: device.interfaces.map(item => item.id === iface.id ? { ...item, description: parts.slice(1).join(' ') } : item) };
  } else if (first === 'encapsulation' && session.mode === 'config-if') {
    const iface = device.interfaces.find(item => item.id === session.selectedInterface);
    const allowed = ['hdlc', 'ppp', 'pppoe', 'frame-relay'];
    if (!iface) output.push('% Selected interface no longer exists.');
    else if (!allowed.includes(second)) output.push('% Usage: encapsulation hdlc|ppp|pppoe|frame-relay.');
    else if ((second === 'hdlc' || second === 'ppp' || second === 'frame-relay') && !/serial/i.test(iface.name)) output.push('% HDLC, PPP, and Frame Relay require a serial interface.');
    else if (second === 'pppoe' && /serial/i.test(iface.name)) output.push('% PPPoE requires an Ethernet interface.');
    else nextDevice = { ...device, interfaces: device.interfaces.map(item => item.id === iface.id ? { ...item, encapsulation: second as NonNullable<typeof item.encapsulation>, ...(second === 'frame-relay' ? {} : { frameRelayDlci: undefined }) } : item) };
  } else if (first === 'frame-relay' && second === 'interface-dlci' && session.mode === 'config-if') {
    const iface = device.interfaces.find(item => item.id === session.selectedInterface), dlci = Number(third);
    if (!iface || iface.encapsulation !== 'frame-relay') output.push('% Configure encapsulation frame-relay first.');
    else if (!Number.isInteger(dlci) || dlci < 16 || dlci > 1007) output.push('% DLCI must be an integer from 16 to 1007.');
    else nextDevice = { ...device, interfaces: device.interfaces.map(item => item.id === iface.id ? { ...item, frameRelayDlci: dlci } : item) };
  } else if (first === 'clock' && second === 'rate' && session.mode === 'config-if') {
    const iface = device.interfaces.find(item => item.id === session.selectedInterface), rate = Number(third);
    if (!iface || !/serial/i.test(iface.name)) output.push('% Clock rate is supported on serial interfaces only.');
    else if (!Number.isInteger(rate) || rate < 1200 || rate > 8000000) output.push('% Clock rate must be an integer from 1200 to 8000000 bps.');
    else nextDevice = { ...device, interfaces: device.interfaces.map(item => item.id === iface.id ? { ...item, clockRate: rate } : item) };
  } else if (first === 'ppp' && second === 'authentication' && session.mode === 'config-if' && ['chap', 'pap'].includes(third)) {
    const iface = device.interfaces.find(item => item.id === session.selectedInterface);
    if (!iface || iface.encapsulation !== 'ppp') output.push('% Configure encapsulation ppp before PPP authentication.');
    else nextDevice = { ...device, interfaces: device.interfaces.map(item => item.id === iface.id ? { ...item, pppAuthentication: third as 'chap' | 'pap' } : item) };
  } else if (first === 'switchport' && session.mode === 'config-if') {
    const iface = device.interfaces.find(item => item.id === session.selectedInterface);
    if (device.type !== 'switch') output.push('% Switchport commands are supported on switches only.');
    else if (!iface) output.push('% Selected interface no longer exists.');
    else if (second === 'mode' && ['access', 'trunk'].includes(third)) nextDevice = { ...device, interfaces: device.interfaces.map(item => item.id === iface.id ? { ...item, mode: third as 'access' | 'trunk', ...(third === 'access' ? { allowedVlans: undefined } : {}) } : item) };
    else if (second === 'mode' && third === 'dynamic' && ['auto', 'desirable'].includes(fourth)) nextDevice = { ...device, interfaces: device.interfaces.map(item => item.id === iface.id ? { ...item, mode: `dynamic-${fourth}` as 'dynamic-auto' | 'dynamic-desirable' } : item) };
    else if (second === 'access' && third === 'vlan' && /^\d+$/.test(fourth) && Number(fourth) >= 1 && Number(fourth) <= 4094) nextDevice = { ...device, interfaces: device.interfaces.map(item => item.id === iface.id ? { ...item, vlan: Number(fourth), mode: 'access' } : item) };
    else if (second === 'trunk' && third === 'allowed' && fourth === 'vlan') {
      const vlans = (parts[4] || '').split(',').map(Number);
      if (!vlans.length || vlans.some(vlan => !Number.isInteger(vlan) || vlan < 1 || vlan > 4094)) output.push('% VLAN IDs must be between 1 and 4094.');
      else nextDevice = { ...device, interfaces: device.interfaces.map(item => item.id === iface.id ? { ...item, mode: 'trunk', allowedVlans: vlans } : item) };
    } else output.push('% Supported: switchport mode access|trunk|dynamic auto|dynamic desirable, switchport access vlan <1-4094>, switchport trunk allowed vlan <list>.');
  } else if ((first === 'shutdown' || first === 'shut' || first === 'no' && ['shutdown', 'shut'].includes(second)) && session.mode === 'config-if') {
    const iface = device.interfaces.find(item => item.id === session.selectedInterface);
    if (!iface) output.push('% Selected interface no longer exists.');
    else nextDevice = { ...device, interfaces: device.interfaces.map(item => item.id === iface.id ? { ...item, status: first === 'no' ? 'up' : 'down' } : item) };
  } else if (first === 'ip' && second === 'route' && session.mode === 'config') {
    const dest = parts[2] || '', mask = parts[3] || '', nextHop = parts[4] || '';
    const destNumber = ipv4Number(dest), hopNumber = ipv4Number(nextHop);
    const maskNumber = ipv4Number(mask);
    const egress = device.interfaces.find(item => item.status === 'up' && item.ip && item.subnetMask && validMask(item.subnetMask) && hopNumber !== null && networkOf(item.ip, item.subnetMask) === networkOf(nextHop, item.subnetMask));
    if (destNumber === null || maskNumber === null || !validMask(mask) || hopNumber === null) output.push('% Invalid route. Usage: ip route <network> <mask> <next-hop>');
    else if ((destNumber & maskNumber) >>> 0 !== destNumber) output.push('% Destination must be a network address for the supplied mask.');
    else if (!egress) output.push('% Next hop is not reachable through an active, addressed interface.');
    else {
      const route: RouteEntry = { id: `static-${dest}-${mask}`, destinationNetwork: dest, subnetMask: mask, nextHop, interfaceName: egress.name, type: 'S', adminDistance: 1, metric: 0 };
      nextDevice = { ...device, routingTable: [...(device.routingTable || []).filter(item => !(item.type === 'S' && item.destinationNetwork === dest && item.subnetMask === mask)), route] };
    }
  } else if (first === 'ipv6' && second === 'unicast-routing' && session.mode === 'config') {
    nextDevice = { ...device, ipv6RoutingEnabled: true };
  } else if (first === 'ipv6' && second === 'router' && third === 'rip' && session.mode === 'config' && parts[3]) {
    const processName = device.ripngConfig && device.ripngConfig.processName.toLowerCase() === parts[3].toLowerCase() ? device.ripngConfig.processName : parts[3];
    nextSession.mode = 'config-router'; nextSession.protocol = 'ripng';
    nextDevice = { ...device, ripngConfig: { enabled: true, processName, interfaces: device.ripngConfig && device.ripngConfig.processName.toLowerCase() === parts[3].toLowerCase() ? device.ripngConfig.interfaces : [] } };
  } else if (first === 'no' && second === 'ipv6' && third === 'router' && fourth === 'rip' && session.mode === 'config') {
    if (device.ripngConfig && (!parts[4] || device.ripngConfig.processName.toLowerCase() === parts[4].toLowerCase())) nextDevice = { ...device, ripngConfig: { ...device.ripngConfig, enabled: false, interfaces: [] } };
  } else if (first === 'ipv6' && second === 'rip' && session.mode === 'config-if' && third && fourth === 'enable') {
    const iface = device.interfaces.find(item => item.id === session.selectedInterface);
    if (!iface) output.push('% Selected interface no longer exists.');
    else if (device.ripngConfig && device.ripngConfig.processName.toLowerCase() !== third.toLowerCase()) output.push(`% Interface is already assigned to RIPng process ${device.ripngConfig.processName}.`);
    else {
      const processName = device.ripngConfig && device.ripngConfig.processName.toLowerCase() === third.toLowerCase() ? device.ripngConfig.processName : third;
      nextDevice = { ...device, ripngConfig: { enabled: true, processName, interfaces: [...new Set([...(device.ripngConfig?.interfaces || []), iface.id])] } };
    }
  } else if (first === 'no' && second === 'ipv6' && third === 'rip' && session.mode === 'config-if' && fifth === 'enable') {
    const iface = device.interfaces.find(item => item.id === session.selectedInterface);
    if (iface && device.ripngConfig) nextDevice = { ...device, ripngConfig: { ...device.ripngConfig, interfaces: device.ripngConfig.interfaces.filter(id => id !== iface.id) } };
  } else if (first === 'ipv6' && second === 'default-gateway' && session.mode === 'config' && ipv6Number(third) !== null) {
    nextDevice = { ...device, defaultGatewayV6: third };
  } else if (first === 'no' && second === 'ipv6' && third === 'unicast-routing' && session.mode === 'config') {
    nextDevice = { ...device, ipv6RoutingEnabled: false };
  } else if (first === 'ipv6' && second === 'route' && session.mode === 'config') {
    const destination = parts[2] || '', nextHop = parts[3] || '';
    const hopAddress = ipv6Number(nextHop);
    const egress = device.interfaces.find(iface => iface.status === 'up' && iface.ipv6 && iface.ipv6Prefix !== undefined && hopAddress !== null && ipv6InPrefix(nextHop, `${iface.ipv6.split('/')[0]}/${iface.ipv6.includes('/') ? iface.ipv6.split('/')[1] : iface.ipv6Prefix}`));
    const routePrefix = Number(destination.split('/')[1]);
    if (ipv6Number(destination.split('/')[0] || '') === null || !Number.isInteger(routePrefix) || routePrefix < 0 || routePrefix > 128 || hopAddress === null) output.push('% Usage: ipv6 route <prefix>/<0-128> <next-hop>.');
    else if (!egress) output.push('% IPv6 next hop is not reachable through an active, addressed interface.');
    else {
      const route: Ipv6RouteEntry = { id: `ipv6-static-${destination}`, prefix: destination, nextHop, interfaceName: egress.name };
      nextDevice = { ...device, ipv6Routes: [...(device.ipv6Routes || []).filter(item => item.prefix !== destination), route] };
    }
  } else if (first === 'no' && second === 'ipv6' && third === 'route' && session.mode === 'config') {
    nextDevice = { ...device, ipv6Routes: (device.ipv6Routes || []).filter(route => route.prefix !== parts[3]) };
  } else if (first === 'no' && second === 'ip' && third === 'route' && session.mode === 'config') {
    nextDevice = { ...device, routingTable: (device.routingTable || []).filter(route => !(route.type === 'S' && route.destinationNetwork === parts[3] && route.subnetMask === parts[4])) };
  } else if (first === 'show' || first === 'sh') {
    const query = parts.slice(1).map(item => item.toLowerCase()).join(' ');
    if (session.mode === 'user') { output.push('% Privileged EXEC mode required.'); }
    else if (query === 'ip interface brief' || query === 'ip int brief') {
      output.push('Interface                  IP-Address      Status                 Protocol');
      device.interfaces.forEach(iface => output.push(`${iface.name.padEnd(27)}${(iface.ip || 'unassigned').padEnd(16)}${(iface.status === 'up' ? 'up' : 'administratively down').padEnd(23)}${iface.status === 'up' ? 'up' : 'down'}`));
    } else if (query === 'interfaces' || query === 'interface' || query.startsWith('interface ' ) || query.startsWith('interfaces ')) {
      const requested = parts.slice(2).join(' ');
      const targets = requested ? device.interfaces.filter(iface => normalize(iface.name) === normalize(requested)) : device.interfaces;
      if (!targets.length) output.push(`% Interface ${requested} not found.`);
      targets.forEach(iface => output.push(`${iface.name} is ${iface.status === 'up' ? 'up' : 'administratively down'}${iface.description ? `, ${iface.description}` : ''}, line protocol is ${iface.status === 'up' ? 'up' : 'down'}`, `  Internet address is ${iface.ip && iface.subnetMask ? `${iface.ip} ${iface.subnetMask}` : 'unassigned'}`, `  Encapsulation ${iface.encapsulation || (/serial/i.test(iface.name) ? 'HDLC' : 'ARPA')}${iface.clockRate ? `, clock rate ${iface.clockRate}` : ''}${iface.pppAuthentication ? `, PPP ${iface.pppAuthentication.toUpperCase()} authentication` : ''}`));
    } else if (query === 'interfaces status' || query === 'interface status') {
      output.push('Port                  Name               Status       Vlan  Duplex Speed Type');
      device.interfaces.filter(iface => !iface.isConsole).forEach(iface => output.push(`${iface.name.padEnd(22)}${(iface.description || '').padEnd(19)}${(iface.status === 'up' ? 'connected' : 'disabled').padEnd(13)}${String(iface.vlan || 1).padEnd(6)}${(iface.duplex || 'auto').padEnd(7)}${(iface.speed || 'auto').padEnd(6)}${iface.mode || 'access'}`));
    } else if (query === 'mac address-table' || query === 'mac-address-table') {
      output.push('Vlan    Mac Address       Type        Ports', '----    -----------       --------    -----');
      (device.macTable || []).forEach(entry => output.push(`${String(entry.vlan).padEnd(8)}${entry.mac.padEnd(18)}${entry.type.padEnd(12)}${entry.port}`));
      if (!device.macTable?.length) output.push('% MAC address table is empty. Send simulated traffic to learn source MAC addresses.');
    } else if (query === 'arp') {
      output.push('Protocol  Address          Age (min)  Hardware Addr   Type');
      Object.entries(device.arpCache || {}).forEach(([ip, mac]) => output.push(`Internet  ${ip.padEnd(17)}-          ${mac}  ARPA`));
      if (!Object.keys(device.arpCache || {}).length) output.push('% ARP cache is empty.');
    } else if (query === 'access-lists' || query === 'access-list') {
      if (!device.accessLists?.length) output.push('% No access lists configured.');
      else device.accessLists.forEach(rule => output.push(aclRuleCommand(rule)));
    } else if (query === 'ip protocols') {
      output.push(device.ripConfig?.enabled ? `Routing Protocol is "rip"\n  Version ${device.ripConfig.version}\n  Networks: ${device.ripConfig.networks.join(', ') || '(none)'}` : 'RIP is not enabled.', device.ripngConfig?.enabled ? `RIPng process ${device.ripngConfig.processName} is enabled.\n  Interfaces: ${device.ripngConfig.interfaces.map(id => device.interfaces.find(iface => iface.id === id)?.name || id).join(', ') || '(none)'}` : 'RIPng is not enabled.', device.ospfConfig?.enabled ? `OSPF process ${device.ospfConfig.processId} is enabled.\n  Networks: ${device.ospfConfig.networks.map(item => `${item.network} ${item.wildcard} area ${item.area}`).join(', ') || '(none)'}\n  Static redistribution: ${device.ospfConfig.redistributeStatic ? 'enabled' : 'disabled'}` : 'OSPF is not enabled.', device.eigrpConfig?.enabled ? `EIGRP AS ${device.eigrpConfig.asNumber} is enabled.\n  Networks: ${device.eigrpConfig.networks.join(', ') || '(none)'}` : 'EIGRP is not enabled.', device.bgpConfig?.enabled ? `BGP AS ${device.bgpConfig.asNumber} is enabled.\n  Neighbors: ${device.bgpConfig.neighbors.map(item => `${item.ip} AS ${item.remoteAs}`).join(', ') || '(none)'}` : 'BGP is not enabled.');
    } else if (query === 'ip route' || query.startsWith('ip route ')) {
      const routeFilter = query.split(' ')[2];
      output.push('Codes: C - connected, L - local, S - static', '');
      const routes: RouteEntry[] = [...(device.routingTable || []).filter(route => route.type !== 'C')];
      device.interfaces.filter(iface => iface.status === 'up' && iface.ip && iface.subnetMask && validMask(iface.subnetMask)).forEach(iface => {
        const mask = ipv4Number(iface.subnetMask!)!;
        const network = (ipv4Number(iface.ip!)! & mask) >>> 0;
        const destinationNetwork = [(network >>> 24) & 255, (network >>> 16) & 255, (network >>> 8) & 255, network & 255].join('.');
        routes.push({ id: `connected-${iface.id}`, destinationNetwork, subnetMask: iface.subnetMask!, nextHop: 'Directly Connected', interfaceName: iface.name, type: 'C' });
      });
      const matchingRoutes = routes.filter(route => !routeFilter || ({ rip: 'R', ospf: 'O', eigrp: 'D', bgp: 'B', static: 'S' } as Record<string, string>)[routeFilter] === route.type);
      matchingRoutes.sort((a, b) => prefix(b.subnetMask) - prefix(a.subnetMask)).forEach(route => output.push(`${route.type}    ${route.destinationNetwork}/${prefix(route.subnetMask)} [${route.adminDistance ?? (route.type === 'C' ? 0 : 1)}/${route.metric ?? 0}] ${route.nextHop === 'Directly Connected' ? `is directly connected, ${route.interfaceName}` : `via ${route.nextHop}, ${route.interfaceName}`}`));
      if (!matchingRoutes.length) output.push('% No matching routes.');
    } else if (query === 'ip nat translations') {
      if (!device.natOverload) output.push('% NAT overload is not configured.');
      else output.push('Pro  Inside global        Inside local         Outside local       Outside global', '--- -------------------- -------------------- ------------------- -------------------', '% No active translations. Send traffic through the simulator to create a PAT mapping.');
    } else if (query === 'ip ospf neighbor') {
      output.push('Neighbor ID     State     Address         Interface');
      const neighbors = device.ospfConfig?.enabled ? session.cdpNeighbors || [] : [];
      neighbors.forEach((neighbor, index) => output.push(`${neighbor.deviceName.padEnd(16)}FULL/-     ${index + 1}.1.1.1`.padEnd(32) + neighbor.localInterface));
      if (!neighbors.length) output.push('% No OSPF neighbors in FULL state.');
    } else if (query === 'ip eigrp neighbors') {
      output.push('IP-EIGRP neighbors for process', ...(device.eigrpConfig?.enabled ? (session.cdpNeighbors || []).map((neighbor, index) => `${neighbor.deviceName}  ${index + 1}.1.1.1  ${neighbor.localInterface}`) : []));
      if (!device.eigrpConfig?.enabled || !session.cdpNeighbors?.length) output.push('% No EIGRP neighbors.');
    } else if (query === 'ip eigrp topology') {
      const routes = (device.routingTable || []).filter(route => route.type === 'D');
      output.push('EIGRP topology table', ...routes.map(route => `P ${route.destinationNetwork}/${prefix(route.subnetMask)}, metric ${route.metric ?? 0}, via ${route.nextHop}`));
      if (!routes.length) output.push('% No learned EIGRP topology entries.');
    } else if (query === 'ip bgp summary') {
      if (!device.bgpConfig?.enabled) output.push('% BGP is not configured.');
      else { output.push(`BGP router identifier ${device.interfaces.find(iface => iface.ip)?.ip || '0.0.0.0'}, local AS number ${device.bgpConfig.asNumber}`, 'Neighbor        V    AS      State/PfxRcd'); device.bgpConfig.neighbors.forEach(neighbor => output.push(`${neighbor.ip.padEnd(16)}4    ${String(neighbor.remoteAs).padEnd(8)}Idle`)); }
    } else if (query === 'ipv6 route') {
      output.push('IPv6 Routing Table - Codes: C - Connected, S - Static, R - RIPng');
      device.interfaces.filter(iface => iface.status === 'up' && iface.ipv6).forEach(iface => output.push(`C ${iface.ipv6!.split('/')[0]}/${iface.ipv6!.split('/')[1] || iface.ipv6Prefix || 64}, directly connected, ${iface.name}`));
      (device.ipv6Routes || []).forEach(route => output.push(`${route.protocol === 'RIPng' ? 'R' : 'S'} ${route.prefix} [${route.protocol === 'RIPng' ? '120' : '1'}/${route.metric || 0}] via ${route.nextHop}, ${route.interfaceName}`));
      if (!device.interfaces.some(iface => iface.status === 'up' && iface.ipv6) && !device.ipv6Routes?.length) output.push('% No IPv6 routes.');
    } else if (query === 'spanning-tree') {
      output.push(`Spanning tree mode: ${device.spanningTreeMode || (device.type === 'switch' ? 'rapid-pvst (simulator default)' : 'not applicable')}`);
      output.push('Topology forwarding is calculated deterministically; port roles and convergence timers are not modeled.');
    } else if (query === 'vtp status') {
      if (device.type !== 'switch') output.push('% VTP status is available on switches only.');
      else output.push(`VTP Version: ${device.vtpConfig?.version || 1}`, `Configuration Revision: ${device.vtpConfig ? (device.vlans || []).length : 0}`, `Operating Mode: ${device.vtpConfig?.mode || 'server'}`, `Domain Name: ${device.vtpConfig?.domain || '(not configured)'}`, `Number of existing VLANs: ${(device.vlans || [{ id: 1 }]).length}`, 'This simulator shares VLAN databases deterministically; VTP advertisements, pruning, passwords, and revision conflict behavior are not modeled.');
    } else if (query === 'cdp neighbors' || query === 'cdp neighbors detail') {
      if (device.cdpEnabled === false) output.push('% CDP is disabled. Use cdp run in global configuration mode.');
      else if (!session.cdpNeighbors?.length) output.push('% No active CDP neighbors. Check device power, interface state, and links.');
      else if (query.endsWith('detail')) session.cdpNeighbors.forEach(neighbor => output.push(`Device ID: ${neighbor.deviceName}`, `  Local Interface: ${neighbor.localInterface}`, `  Port ID (outgoing port): ${neighbor.remoteInterface}`, `  Capabilities: ${neighbor.capability}`));
      else {
        output.push('Device ID        Local Intrfce  Holdtime  Capability  Port ID');
        session.cdpNeighbors.forEach(neighbor => output.push(`${neighbor.deviceName.padEnd(17)}${neighbor.localInterface.padEnd(15)}180       ${neighbor.capability.padEnd(12)}${neighbor.remoteInterface}`));
      }
    } else if (query === 'vlan brief') {
      output.push('VLAN Name                             Status    Ports');
      const vlans = new Map<number, string[]>();
      device.interfaces.filter(iface => !iface.isConsole && (iface.mode || 'access') === 'access').forEach(iface => {
        const vlan = iface.vlan || 1; vlans.set(vlan, [...(vlans.get(vlan) || []), iface.name]);
      });
      const configured = new Map((device.vlans || [{ id: 1, name: 'default', status: 'active' as const }]).map(item => [item.id, item]));
      for (const vlan of vlans.keys()) if (!configured.has(vlan)) configured.set(vlan, { id: vlan, name: `VLAN${vlan}`, status: 'suspended' });
      if (!configured.size) output.push('% No VLANs configured.');
      else [...configured.values()].sort((a, b) => a.id - b.id).forEach(vlan => output.push(`${String(vlan.id).padEnd(8)}${vlan.name.padEnd(33)}${vlan.status.padEnd(10)}${(vlans.get(vlan.id) || []).join(', ')}`));
    } else if (query === 'running-config') {
      output.push(`hostname ${device.name}`, '!');
      if (device.spanningTreeMode) output.push(`spanning-tree mode ${device.spanningTreeMode}`);
      if (device.vtpConfig) output.push(`vtp domain ${device.vtpConfig.domain}`, `vtp mode ${device.vtpConfig.mode}`, `vtp version ${device.vtpConfig.version}`);
      if (device.cdpEnabled === false) output.push('no cdp run');
      if (device.enableSecret) output.push(`enable secret ${device.enableSecret}`);
      (device.localUsers || []).forEach(user => output.push(`username ${user.username} password ${user.password}`));
      (device.vlans || []).filter(vlan => vlan.id !== 1).forEach(vlan => output.push(`vlan ${vlan.id}`, ` name ${vlan.name}`, 'exit'));
      device.interfaces.forEach(iface => {
        output.push(`interface ${iface.name}`);
        if (iface.description) output.push(` description ${iface.description}`);
        if (iface.encapsulation) output.push(` encapsulation ${iface.encapsulation}`);
        if (iface.clockRate) output.push(` clock rate ${iface.clockRate}`);
        if (iface.pppAuthentication) output.push(` ppp authentication ${iface.pppAuthentication}`);
        if (iface.frameRelayDlci) output.push(` frame-relay interface-dlci ${iface.frameRelayDlci}`);
        if (iface.ip && iface.subnetMask) output.push(` ip address ${iface.ip} ${iface.subnetMask}`);
        if (iface.ipv6) output.push(` ipv6 address ${iface.ipv6.includes('/') ? iface.ipv6 : `${iface.ipv6}/${iface.ipv6Prefix ?? 64}`}`);
        if (device.ripngConfig?.enabled && device.ripngConfig.interfaces.includes(iface.id)) output.push(` ipv6 rip ${device.ripngConfig.processName} enable`);
        if (iface.aclInbound) output.push(` ip access-group ${iface.aclInbound} in`);
        if (iface.aclOutbound) output.push(` ip access-group ${iface.aclOutbound} out`);
        if (iface.natRole) output.push(` ip nat ${iface.natRole}`);
        if (iface.mode) output.push(` ${switchportModeCommand(iface.mode)}`);
        if ((iface.mode || 'access') === 'access' && iface.vlan && iface.vlan !== 1) output.push(` switchport access vlan ${iface.vlan}`);
        if (iface.mode === 'trunk' && iface.allowedVlans) output.push(` switchport trunk allowed vlan ${iface.allowedVlans.join(',')}`);
        output.push(iface.status === 'up' ? ' no shutdown' : ' shutdown', '!');
      });
      (device.routingTable || []).filter(route => route.type === 'S').forEach(route => output.push(`ip route ${route.destinationNetwork} ${route.subnetMask} ${route.nextHop}`));
      (device.accessLists || []).forEach(rule => output.push(aclRuleCommand(rule)));
      if (device.natOverload) output.push(`ip nat inside source list ${device.natOverload.aclNumber} interface ${device.natOverload.outsideInterface} overload`);
      if (device.lineConfig?.console) output.push('line console 0', ...(device.lineConfig.console.password ? [` password ${device.lineConfig.console.password}`] : []), ...(device.lineConfig.console.login ? [' login'] : []), 'exit');
      if (device.lineConfig?.vty) output.push(`line vty ${device.lineConfig.vty.start} ${device.lineConfig.vty.end}`, ...(device.lineConfig.vty.password ? [` password ${device.lineConfig.vty.password}`] : []), ...(device.lineConfig.vty.login ? [' login'] : []), ...(device.lineConfig.vty.transport ? [` transport input ${device.lineConfig.vty.transport}`] : []), 'exit');
      if (device.ripngConfig?.enabled) output.push(`ipv6 router rip ${device.ripngConfig.processName}`, 'exit');
      if (device.ripConfig?.enabled) output.push('router rip', ` version ${device.ripConfig.version}`, ...device.ripConfig.networks.map(network => ` network ${network}`), ...(device.ripConfig.noAutoSummary ? [' no auto-summary'] : []), 'exit');
      if (device.ospfConfig?.enabled) output.push(`router ospf ${device.ospfConfig.processId}`, ...device.ospfConfig.networks.map(network => ` network ${network.network} ${network.wildcard} area ${network.area}`), ...(device.ospfConfig.redistributeStatic ? [' redistribute static'] : []), ...(device.ospfConfig.redistributeConnected ? [' redistribute connected'] : []), 'exit');
      if (device.eigrpConfig?.enabled) output.push(`router eigrp ${device.eigrpConfig.asNumber}`, ...device.eigrpConfig.networks.map(network => ` network ${network}`), ...(device.eigrpConfig.noAutoSummary ? [' no auto-summary'] : []), 'exit');
      if (device.bgpConfig?.enabled) output.push(`router bgp ${device.bgpConfig.asNumber}`, ...device.bgpConfig.neighbors.map(neighbor => ` neighbor ${neighbor.ip} remote-as ${neighbor.remoteAs}`), ...device.bgpConfig.networks.map(network => ` network ${network}`), 'exit');
    } else if (query === 'startup-config') output.push(...(device.startupConfig ? device.startupConfig.split('\n') : ['% Startup configuration is empty. Use copy running-config startup-config to save.']));
    else if (query === 'version') output.push('NetLearn educational router simulator', `${device.name} with ${device.interfaces.length} interfaces`);
    else output.push('% Supported: show running-config, startup-config, version, interfaces, interfaces status, ip interface brief, ip route, ipv6 route, spanning-tree, access-lists, ip protocols, arp, mac address-table, vlan brief.');
  } else if (first === 'copy' && second === 'startup-config' && third === 'running-config') {
    if (session.mode !== 'priv') failMode();
    else if (!device.startupConfig) output.push('% Startup configuration is empty.');
    else {
      let candidate = { ...device };
      let context: CliSession = { mode: 'config', selectedInterface: '' };
      const errors: string[] = [];
      for (const line of device.startupConfig.split(/\r?\n/).map(item => item.trim()).filter(item => item && item !== '!')) {
        if (line.startsWith('!')) continue;
        const result = runRouterCommand(candidate, context, line);
        candidate = result.device;
        context = result.session;
        errors.push(...result.output.filter(item => item.startsWith('%')));
      }
      if (errors.length) output.push(`% Startup configuration rejected: ${errors[0]}`);
      else { nextDevice = candidate; output.push('[OK] Startup configuration restored.'); }
    }
  } else if ((first === 'copy' && second === 'running-config' && third === 'startup-config') || first === 'write' && second === 'memory') {
    if (session.mode !== 'priv') failMode();
    else {
      const config = [
        `hostname ${device.name}`,
        ...(device.spanningTreeMode ? [`spanning-tree mode ${device.spanningTreeMode}`] : []),
        ...(device.vtpConfig ? [`vtp domain ${device.vtpConfig.domain}`, `vtp mode ${device.vtpConfig.mode}`, `vtp version ${device.vtpConfig.version}`] : []),
        ...(device.cdpEnabled === false ? ['no cdp run'] : []),
        ...(device.enableSecret ? [`enable secret ${device.enableSecret}`] : []),
        ...(device.localUsers || []).map(user => `username ${user.username} password ${user.password}`),
        ...(device.ipv6RoutingEnabled ? ['ipv6 unicast-routing'] : []),
        ...(device.defaultGatewayV6 ? [`ipv6 default-gateway ${device.defaultGatewayV6}`] : []),
        ...(device.ripngConfig?.enabled ? [`ipv6 router rip ${device.ripngConfig.processName}`, 'exit'] : []),
        ...(device.vlans || []).filter(vlan => vlan.id !== 1).flatMap(vlan => [`vlan ${vlan.id}`, ` name ${vlan.name}`, 'exit']),
        ...(device.accessLists || []).map(aclRuleCommand),
        ...device.interfaces.flatMap(iface => [
          `interface ${iface.name}`,
          ...(iface.ip && iface.subnetMask ? [` ip address ${iface.ip} ${iface.subnetMask}`] : []),
          ...(iface.ipv6 ? [` ipv6 address ${ipv6AddressCommand(iface)}`] : []),
          ...(device.ripngConfig?.enabled && device.ripngConfig.interfaces.includes(iface.id) ? [` ipv6 rip ${device.ripngConfig.processName} enable`] : []),
          ...(iface.aclInbound ? [` ip access-group ${iface.aclInbound} in`] : []),
          ...(iface.aclOutbound ? [` ip access-group ${iface.aclOutbound} out`] : []),
          ...(iface.natRole ? [` ip nat ${iface.natRole}`] : []),
          ...(iface.description ? [` description ${iface.description}`] : []),
          ...(iface.encapsulation ? [` encapsulation ${iface.encapsulation}`] : []),
          ...(iface.clockRate ? [` clock rate ${iface.clockRate}`] : []),
          ...(iface.pppAuthentication ? [` ppp authentication ${iface.pppAuthentication}`] : []),
          ...(iface.frameRelayDlci ? [` frame-relay interface-dlci ${iface.frameRelayDlci}`] : []),
          ...(iface.mode ? [` ${switchportModeCommand(iface.mode)}`] : []),
          ...((iface.mode || 'access') === 'access' && iface.vlan && iface.vlan !== 1 ? [` switchport access vlan ${iface.vlan}`] : []),
          ...(iface.mode === 'trunk' && iface.allowedVlans ? [` switchport trunk allowed vlan ${iface.allowedVlans.join(',')}`] : []),
          iface.status === 'up' ? ' no shutdown' : ' shutdown',
          'exit',
        ]),
        ...(device.natOverload ? [`ip nat inside source list ${device.natOverload.aclNumber} interface ${device.natOverload.outsideInterface} overload`] : []),
        ...(device.lineConfig?.console ? ['line console 0', ...(device.lineConfig.console.password ? [` password ${device.lineConfig.console.password}`] : []), ...(device.lineConfig.console.login ? [' login'] : []), 'exit'] : []),
        ...(device.lineConfig?.vty ? [`line vty ${device.lineConfig.vty.start} ${device.lineConfig.vty.end}`, ...(device.lineConfig.vty.password ? [` password ${device.lineConfig.vty.password}`] : []), ...(device.lineConfig.vty.login ? [' login'] : []), ...(device.lineConfig.vty.transport ? [` transport input ${device.lineConfig.vty.transport}`] : []), 'exit'] : []),
        ...(device.routingTable || []).filter(route => route.type === 'S').map(route => `ip route ${route.destinationNetwork} ${route.subnetMask} ${route.nextHop}`),
        ...(device.ipv6Routes || []).map(route => `ipv6 route ${route.prefix} ${route.nextHop}`),
        ...(device.ripConfig?.enabled ? ['router rip', ` version ${device.ripConfig.version}`, ...device.ripConfig.networks.map(network => ` network ${network}`), ...(device.ripConfig.noAutoSummary ? [' no auto-summary'] : []), 'exit'] : []),
        ...(device.ospfConfig?.enabled ? [`router ospf ${device.ospfConfig.processId}`, ...device.ospfConfig.networks.map(network => ` network ${network.network} ${network.wildcard} area ${network.area}`), ...(device.ospfConfig.redistributeStatic ? [' redistribute static'] : []), ...(device.ospfConfig.redistributeConnected ? [' redistribute connected'] : []), 'exit'] : []),
        ...(device.eigrpConfig?.enabled ? [`router eigrp ${device.eigrpConfig.asNumber}`, ...device.eigrpConfig.networks.map(network => ` network ${network}`), ...(device.eigrpConfig.noAutoSummary ? [' no auto-summary'] : []), 'exit'] : []),
        ...(device.bgpConfig?.enabled ? [`router bgp ${device.bgpConfig.asNumber}`, ...device.bgpConfig.neighbors.map(neighbor => ` neighbor ${neighbor.ip} remote-as ${neighbor.remoteAs}`), ...device.bgpConfig.networks.map(network => ` network ${network}`), 'exit'] : []),
      ];
      nextDevice = { ...device, startupConfig: config.join('\n') };
      output.push('[OK] Startup configuration saved.');
    }
  } else if (first === 'ping') output.push('% Ping requires the topology simulator. Use Send Message to run a simulated packet and inspect its path.');
  else if (first === 'traceroute' || first === 'trace') output.push('% Traceroute is not implemented by the educational simulator.');
  else if (first === 'ip' || first === 'no') failMode();
  else output.push(`% Invalid input: ${raw.trim()}`);
  return finish();
}

/** Run newline-separated lab CLI references, honoring their displayed IOS prompts. */
export function runCliScript(device: NetworkDevice, initialSession: CliSession, script: string): CliResult {
  let currentDevice = device;
  let session = { ...initialSession };
  const output: string[] = [];
  for (const line of script.split(/\r?\n/).map(item => item.trim()).filter(item => item && !item.startsWith('!'))) {
    const promptMatch = line.match(/^.*?(?:\((config(?:-[^)]+)?)\))?([>#])\s+(.*)$/);
    let command = line;
    if (promptMatch) {
      const [, modeName, marker, promptedCommand] = promptMatch;
      const mode: CliMode = modeName === 'config' ? 'config' : modeName === 'config-if' ? 'config-if' : modeName === 'config-router' ? 'config-router' : modeName === 'config-line' ? 'config-line' : marker === '>' ? 'user' : 'priv';
      session = { ...session, mode };
      command = promptedCommand;
    }
    const result = runRouterCommand(currentDevice, session, command);
    currentDevice = result.device;
    session = result.session;
    output.push(...result.output);
  }
  return { device: currentDevice, session, output };
}

export function cliPrompt(device: NetworkDevice, mode: CliMode) {
  return `${device.name}${mode === 'user' ? '>' : mode === 'priv' ? '#' : mode === 'config' ? '(config)#' : mode === 'config-if' ? '(config-if)#' : mode === 'config-router' ? '(config-router)#' : '(config-vlan)#'}`;
}
