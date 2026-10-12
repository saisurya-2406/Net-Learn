/** Common ports and transport defaults used by the educational packet composer. */
export const APPLICATION_PROTOCOLS = {
  ICMP: { transport: 'ICMP', port: undefined, label: 'ICMP (Ping)' },
  ICMPv6: { transport: 'ICMP', port: undefined, label: 'ICMPv6 (IPv6 Ping)' },
  HTTP: { transport: 'TCP', port: 80, label: 'HTTP (Web)' },
  FTP: { transport: 'TCP', port: 21, label: 'FTP (Control)' },
  TFTP: { transport: 'UDP', port: 69, label: 'TFTP' },
  SMTP: { transport: 'TCP', port: 25, label: 'SMTP (Mail Send)' },
  POP3: { transport: 'TCP', port: 110, label: 'POP3 (Mail Receive)' },
  DNS: { transport: 'UDP', port: 53, label: 'DNS Query' },
  DHCP: { transport: 'UDP', port: 67, label: 'DHCP (Discover/Offer)' },
  NTP: { transport: 'UDP', port: 123, label: 'NTP (Time)' },
  SNMP: { transport: 'UDP', port: 161, label: 'SNMP (Management)' },
  TELNET: { transport: 'TCP', port: 23, label: 'Telnet' },
  SSH: { transport: 'TCP', port: 22, label: 'SSH' },
  AAA: { transport: 'TCP', port: 1812, label: 'AAA (RADIUS)' },
  RTP: { transport: 'UDP', port: 5004, label: 'RTP (Media)' },
  TCP: { transport: 'TCP', port: 443, label: 'TCP (Generic)' },
  UDP: { transport: 'UDP', port: 50000, label: 'UDP (Generic)' },
} as const;

export type ApplicationProtocol = keyof typeof APPLICATION_PROTOCOLS;

export function getApplicationProtocol(protocol: ApplicationProtocol) {
  return APPLICATION_PROTOCOLS[protocol];
}
