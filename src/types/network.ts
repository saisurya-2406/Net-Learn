/**
 * NetLearn Cisco Packet Tracer Modeling Types & Definitions
 */

export type DeviceType = 
  | 'pc'
  | 'laptop'
  | 'switch'
  | 'router'
  | 'server'
  | 'printer'
  | 'ip_phone'
  | 'hub'
  | 'access_point'
  | 'firewall';

export type CableType = 
  | 'auto'
  | 'straight' 
  | 'crossover' 
  | 'fiber' 
  | 'serial'
  | 'console'
  | 'wireless';

export type SimulationProtocol =
  | 'ICMP' | 'ICMPv6' | 'ARP' | 'HTTP' | 'FTP' | 'TFTP' | 'SMTP' | 'POP3' | 'DNS'
  | 'DHCP' | 'NTP' | 'SNMP' | 'TELNET' | 'SSH' | 'AAA' | 'RTP' | 'TCP' | 'UDP'
  | 'RIP' | 'OSPF' | 'EIGRP' | 'BGP';

export interface NetworkInterface {
  id: string;
  name: string; // e.g. 'FastEthernet0', 'FastEthernet0/1', 'GigabitEthernet0/0', 'Serial0/0/0', 'Console'
  description?: string;
  ip?: string;
  subnetMask?: string;
  ipv6?: string;
  ipv6Prefix?: number;
  mac: string;
  status: 'up' | 'down';
  vlan?: number; // default 1
  mode?: 'access' | 'trunk' | 'dynamic-auto' | 'dynamic-desirable';
  allowedVlans?: number[];
  aclInbound?: string;
  aclOutbound?: string;
  natRole?: 'inside' | 'outside';
  duplex?: 'auto' | 'full' | 'half';
  speed?: 'auto' | '10' | '100' | '1000';
  isConsole?: boolean;
  clockRate?: number; // for Serial DCE interfaces e.g. 64000
  encapsulation?: 'hdlc' | 'ppp' | 'pppoe' | 'frame-relay';
  frameRelayDlci?: number;
  qos?: { priority: 'low' | 'normal' | 'high' | 'voice'; dscp?: number };
  channelGroup?: number;
  channelProtocol?: 'lacp' | 'pagp';
  pppAuthentication?: 'chap' | 'pap';
}

export type RouteProtocolType = 'C' | 'S' | 'S*' | 'R' | 'O' | 'D' | 'B';

export interface RouteEntry {
  id: string;
  destinationNetwork: string; // e.g. '192.168.2.0'
  subnetMask: string;         // e.g. '255.255.255.0'
  nextHop: string;            // e.g. '10.0.0.2' or 'Directly Connected'
  interfaceName: string;      // e.g. 'Gi0/1' or 'Se0/0/0'
  metric?: number;
  type?: RouteProtocolType;   // C=Connected, S=Static, S*=Default Static, R=RIP, O=OSPF, D=EIGRP, B=BGP
  adminDistance?: number;
}

export interface Ipv6RouteEntry {
  id: string;
  prefix: string; // e.g. '2001:db8:2::/64'
  nextHop: string;
  interfaceName: string;
  protocol?: 'Static' | 'RIPng';
  metric?: number;
}

export interface AccessListRule {
  id: string;
  number: string;
  action: 'permit' | 'deny';
  protocol: 'ip' | 'tcp' | 'udp' | 'icmp';
  source: string;
  destination: string;
  destinationPort?: number;
}

export interface MacTableEntry {
  mac: string;
  port: string;
  vlan: number;
  type: 'DYNAMIC' | 'STATIC';
}

export interface VlanConfig {
  id: number;
  name: string;
  status: 'active' | 'suspended';
}

export interface DnsRecord {
  domain: string;
  ip: string;
  type?: 'A' | 'CNAME' | 'AAAA';
}

export interface DhcpLease {
  mac: string;
  ip: string;
  leaseTime: string;
}

export interface ServerServices {
  httpEnabled: boolean;
  httpContent: string;
  dnsEnabled: boolean;
  dnsRecords: DnsRecord[];
  dhcpEnabled: boolean;
  dhcpPool: {
    poolName?: string;
    startIp: string;
    endIp: string;
    subnetMask: string;
    gateway: string;
    dnsServer: string;
    maxUsers?: number;
  };
  dhcpLeases?: DhcpLease[];
  snmp?: { enabled: boolean; version: 'v2c' | 'v3'; community: string };
  aaa?: { enabled: boolean; protocol: 'radius' | 'tacacs+'; users: Array<{ username: string; password: string; privilege: 1 | 15 }> };
}

export interface NetworkDevice {
  id: string;
  name: string;
  type: DeviceType;
  model?: string; // e.g. 'PC-PT', 'Laptop-PT', '2960-24TT', '2911', 'Server-PT'
  x: number;
  y: number;
  powerState: 'on' | 'off';
  interfaces: NetworkInterface[];
  defaultGateway?: string;
  defaultGatewayV6?: string;
  dnsServer?: string;
  routingTable?: RouteEntry[];
  ipv6Routes?: Ipv6RouteEntry[];
  macTable?: MacTableEntry[];
  vlans?: VlanConfig[];
  vtpConfig?: { mode: 'server' | 'client' | 'transparent'; domain: string; version: 1 | 2 | 3 };
  arpCache?: { [ip: string]: string }; // IP -> MAC
  serverServices?: ServerServices;
  configMode?: 'static' | 'dhcp';
  cliHistory?: string[];
  startupConfig?: string;
  notes?: string;
  enableSecret?: string;
  localUsers?: Array<{ username: string; password: string }>;
  lineConfig?: { console?: { password?: string; login?: boolean }; vty?: { start: number; end: number; password?: string; login?: boolean; transport?: 'telnet' | 'ssh' | 'all' } };
  
  // Routing Protocol Configurations
  ripConfig?: {
    enabled: boolean;
    version: 1 | 2;
    networks: string[];
    noAutoSummary?: boolean;
  };
  ospfConfig?: {
    enabled: boolean;
    processId: number;
    networks: { network: string; wildcard: string; area: number }[];
    redistributeStatic?: boolean;
    redistributeConnected?: boolean;
  };
  eigrpConfig?: {
    enabled: boolean;
    asNumber: number;
    networks: string[];
    noAutoSummary?: boolean;
  };
  bgpConfig?: {
    enabled: boolean;
    asNumber: number;
    neighbors: { ip: string; remoteAs: number }[];
    networks: string[];
  };
  ripngConfig?: { enabled: boolean; processName: string; interfaces: string[] };
  ipv6RoutingEnabled?: boolean;
  spanningTreeMode?: 'pvst' | 'rapid-pvst' | 'off';
  cdpEnabled?: boolean;
  accessLists?: AccessListRule[];
  natOverload?: { aclNumber: string; outsideInterface: string };
  wirelessConfig?: { ssid: string; security: 'open' | 'wpa2-psk' | 'wpa3-sae'; passphrase?: string };
  firewallConfig?: { enabled: boolean; defaultAction: 'allow' | 'deny'; rules: Array<{ action: 'allow' | 'deny'; protocol: 'any' | 'tcp' | 'udp' | 'icmp'; destinationPort?: number }> };
}

export interface NetworkLink {
  id: string;
  sourceDeviceId: string;
  sourcePortId: string;
  targetDeviceId: string;
  targetPortId: string;
  cableType: CableType;
  status: 'up' | 'down' | 'negotiating';
}

export interface PacketHeaders {
  // Layer 2 - Ethernet II Frame
  ethernet: {
    preamble: string;
    sourceMac: string;
    destMac: string;
    type: '0x0800 (IPv4)' | '0x0806 (ARP)' | '0x86DD (IPv6)';
    fcs: string;
  };
  // Layer 3 - IPv4 Packet (if applicable)
  ip?: {
    version: number;
    ihl: number;
    dscp: string;
    totalLength: number;
    identification: string;
    flags: string;
    fragmentOffset: number;
    ttl: number;
    protocol: string; // 'ICMP (1)', 'TCP (6)', 'UDP (17)', 'OSPF (89)', 'EIGRP (88)'
    headerChecksum: string;
    sourceIp: string;
    destIp: string;
  };
  // Layer 3 - IPv6 Packet (if applicable)
  ipv6?: {
    version: number;
    trafficClass: string;
    flowLabel: string;
    payloadLength: number;
    nextHeader: string;
    hopLimit: number;
    sourceIpv6: string;
    destIpv6: string;
  };
  // Layer 4 - Transport Segment (if applicable)
  transport?: {
    protocol: 'TCP' | 'UDP' | 'ICMP' | 'OSPF' | 'EIGRP' | 'BGP';
    sourcePort?: number;
    destPort?: number;
    seqNum?: number;
    ackNum?: number;
    flags?: string[]; // ['SYN', 'ACK'], etc.
    windowSize?: number;
    icmpType?: string; // 'Echo Request (8)', 'Echo Reply (0)'
  };
  // Layer 7 - Application / Payload
  payload: string;
}

export interface SimulationStep {
  stepIndex: number;
  totalSteps: number;
  fromDeviceId: string;
  toDeviceId: string;
  linkId: string;
  protocol: SimulationProtocol;
  packetName: string;
  headers: PacketHeaders;
  explanation: {
    title: string;
    decisionReason: string;
    layerMechanism: string;
    rulesApplied: string[];
    whatHappened: string;
  };
  isReturnTrip?: boolean;
}

export interface TopologyData {
  id: string;
  name: string;
  description: string;
  devices: NetworkDevice[];
  links: NetworkLink[];
  updatedAt: string;
}
