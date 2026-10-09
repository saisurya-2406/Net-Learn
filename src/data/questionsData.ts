export interface QuestionOption {
  id: string;
  text: string;
}

export interface ExamQuestion {
  id: string;
  category: 'Fundamentals' | 'Data Link' | 'Network' | 'Transport' | 'Application' | 'Security';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  question: string;
  options: QuestionOption[];
  correctOptionId: string;
  explanation: string;
  keyRule: string;
}

export interface VivaQuestion {
  id: string;
  category: string;
  question: string;
  difficulty: 'Beginner' | 'College' | 'Advanced';
  expectedConcepts: string[];
  modelAnswer: string;
  rubricCriteria: string[];
  followUp: string;
}

export const EXAM_QUESTIONS: ExamQuestion[] = [
  {
    id: 'q-1',
    category: 'Network',
    difficulty: 'Easy',
    question: 'How many usable host IP addresses are available in a subnet with a /28 prefix length?',
    options: [
      { id: 'a', text: '16' },
      { id: 'b', text: '14' },
      { id: 'c', text: '30' },
      { id: 'd', text: '12' }
    ],
    correctOptionId: 'b',
    explanation: 'A /28 prefix leaves 32 - 28 = 4 host bits. Total IP addresses = 2^4 = 16. Usable host addresses = 2^4 - 2 = 14 (subtracting Network ID and Broadcast Address).',
    keyRule: 'Formula: Usable Hosts = 2^(32 - prefix) - 2'
  },
  {
    id: 'q-2',
    category: 'Transport',
    difficulty: 'Medium',
    question: 'During the TCP 3-way handshake, if the client sends SYN with sequence number 500, what will be the ACK number in the server\'s SYN-ACK response?',
    options: [
      { id: 'a', text: '500' },
      { id: 'b', text: '501' },
      { id: 'c', text: '0' },
      { id: 'd', text: '1000' }
    ],
    correctOptionId: 'b',
    explanation: 'A TCP SYN packet consumes exactly 1 sequence number space even though it contains no user payload. The receiving server acknowledges receipt by setting ACK = Sequence_Number + 1 (500 + 1 = 501).',
    keyRule: 'TCP Rule: SYN and FIN flags consume 1 sequence number.'
  },
  {
    id: 'q-3',
    category: 'Data Link',
    difficulty: 'Medium',
    question: 'What is the minimum payload size and minimum total frame size for an IEEE 802.3 Ethernet frame?',
    options: [
      { id: 'a', text: '46 bytes payload, 64 bytes total' },
      { id: 'b', text: '64 bytes payload, 128 bytes total' },
      { id: 'c', text: '0 bytes payload, 32 bytes total' },
      { id: 'd', text: '20 bytes payload, 40 bytes total' }
    ],
    correctOptionId: 'a',
    explanation: 'An Ethernet II frame has 18 bytes of overhead (6B Dest MAC + 6B Src MAC + 2B EtherType + 4B FCS). To ensure collision detection in CSMA/CD over maximum cable lengths (slot time = 512 bit times), the minimum frame size is 64 bytes. Thus, minimum payload = 64 - 18 = 46 bytes.',
    keyRule: 'Ethernet Minimum: 64 bytes total, padded to 46 bytes payload minimum.'
  },
  {
    id: 'q-4',
    category: 'Network',
    difficulty: 'Hard',
    question: 'A router receives a packet with destination IP 192.168.1.130. Its routing table contains: 1) 192.168.1.0/24 via Gi0/0; 2) 192.168.1.128/26 via Gi0/1; 3) 0.0.0.0/0 via Gi0/2. Which route will be selected?',
    options: [
      { id: 'a', text: 'Gi0/0 because it is the standard Class C network' },
      { id: 'b', text: 'Gi0/1 due to the Longest Prefix Match (LPM) rule (/26 > /24)' },
      { id: 'c', text: 'Gi0/2 because it is the default route' },
      { id: 'd', text: 'The packet will be dropped due to overlapping routes' }
    ],
    correctOptionId: 'b',
    explanation: 'Routers forward packets using the Longest Prefix Match (LPM) principle. Both /24 and /26 match 192.168.1.130, but /26 has 26 matching network bits versus 24 bits. The more specific route (/26 via Gi0/1) always wins.',
    keyRule: 'Routing Axiom: Longest Prefix Match (LPM) dictates route selection.'
  },
  {
    id: 'q-5',
    category: 'Fundamentals',
    difficulty: 'Easy',
    question: 'At which OSI layer does the Address Resolution Protocol (ARP) primarily operate, and what addresses does it translate?',
    options: [
      { id: 'a', text: 'Layer 3, translates Domain Names to IPv4' },
      { id: 'b', text: 'Layer 2/3 boundary, translates IPv4 to MAC addresses' },
      { id: 'c', text: 'Layer 4, translates Port Numbers to Sockets' },
      { id: 'd', text: 'Layer 1, translates Optical Signals to Copper Voltages' }
    ],
    correctOptionId: 'b',
    explanation: 'ARP operates at the boundary of Data Link (Layer 2) and Network (Layer 3). It maps an already-known 32-bit logical IPv4 address to its corresponding 48-bit physical MAC address on a local broadcast domain.',
    keyRule: 'ARP: IPv4 Address -> Physical MAC Address.'
  },
  {
    id: 'q-6',
    category: 'Application',
    difficulty: 'Medium',
    question: 'Which of the following describes the correct chronological sequence of packets in the DHCP DORA process?',
    options: [
      { id: 'a', text: 'Discover -> Request -> Offer -> Acknowledge' },
      { id: 'b', text: 'Discover -> Offer -> Request -> Acknowledge' },
      { id: 'c', text: 'Demand -> Offer -> Receive -> Accept' },
      { id: 'd', text: 'Detect -> Option -> Register -> Assign' }
    ],
    correctOptionId: 'b',
    explanation: 'DHCP follows the 4-step DORA acronym: Discover (client broadcast looking for servers), Offer (server offers IP configuration), Request (client requests the offered IP), Acknowledge (server confirms lease).',
    keyRule: 'DORA: Discover -> Offer -> Request -> Acknowledge.'
  },
  {
    id: 'q-7', category: 'Network', difficulty: 'Easy',
    question: 'Which IPv4 address is in the private 192.168.0.0/16 range?',
    options: [{ id: 'a', text: '192.169.1.10' }, { id: 'b', text: '192.168.20.5' }, { id: 'c', text: '172.40.1.1' }, { id: 'd', text: '11.0.0.8' }],
    correctOptionId: 'b', explanation: 'The private range is 192.168.0.0 through 192.168.255.255, represented by 192.168.0.0/16.', keyRule: 'RFC 1918 private IPv4 ranges include 192.168.0.0/16.'
  },
  {
    id: 'q-8', category: 'Network', difficulty: 'Medium',
    question: 'What is the network address of 10.1.4.77/26?',
    options: [{ id: 'a', text: '10.1.4.0' }, { id: 'b', text: '10.1.4.64' }, { id: 'c', text: '10.1.4.77' }, { id: 'd', text: '10.1.4.128' }],
    correctOptionId: 'b', explanation: 'A /26 subnet has blocks of 64 addresses in the last octet. Address 77 is in the 64–127 block, whose network address is 10.1.4.64.', keyRule: 'For /26, subnet boundaries advance by 64 addresses.'
  },
  {
    id: 'q-9', category: 'Network', difficulty: 'Easy',
    question: 'Which protocol maps an IPv4 address to a MAC address on a local network?',
    options: [{ id: 'a', text: 'DNS' }, { id: 'b', text: 'ARP' }, { id: 'c', text: 'DHCP' }, { id: 'd', text: 'NTP' }],
    correctOptionId: 'b', explanation: 'ARP resolves a known IPv4 address to the link-layer MAC address needed for local Ethernet delivery.', keyRule: 'ARP resolves IPv4 addresses to MAC addresses on a local link.'
  },
  {
    id: 'q-10', category: 'Transport', difficulty: 'Easy',
    question: 'Which transport protocol provides reliable, ordered byte-stream delivery?',
    options: [{ id: 'a', text: 'UDP' }, { id: 'b', text: 'IP' }, { id: 'c', text: 'TCP' }, { id: 'd', text: 'ARP' }],
    correctOptionId: 'c', explanation: 'TCP uses sequence numbers, acknowledgements, retransmission, and flow control to provide reliable ordered delivery.', keyRule: 'TCP provides a reliable, ordered byte stream.'
  },
  {
    id: 'q-11', category: 'Transport', difficulty: 'Easy',
    question: 'Which transport protocol has no built-in connection setup or delivery guarantee?',
    options: [{ id: 'a', text: 'TCP' }, { id: 'b', text: 'UDP' }, { id: 'c', text: 'TLS' }, { id: 'd', text: 'HTTP' }],
    correctOptionId: 'b', explanation: 'UDP sends independent datagrams without a connection handshake, retransmission, or ordering guarantee.', keyRule: 'UDP is connectionless and does not guarantee delivery.'
  },
  {
    id: 'q-12', category: 'Transport', difficulty: 'Medium',
    question: 'What does a TCP receiver advertise to help prevent the sender from overrunning its buffer?',
    options: [{ id: 'a', text: 'Receive window' }, { id: 'b', text: 'TTL' }, { id: 'c', text: 'Subnet mask' }, { id: 'd', text: 'Sequence checksum' }],
    correctOptionId: 'a', explanation: 'TCP flow control uses the advertised receive window to tell the sender how much data the receiver can accept.', keyRule: 'TCP receive window communicates available buffer capacity.'
  },
  {
    id: 'q-13', category: 'Data Link', difficulty: 'Easy',
    question: 'Which device normally forwards Ethernet frames using destination MAC addresses?',
    options: [{ id: 'a', text: 'Router' }, { id: 'b', text: 'Switch' }, { id: 'c', text: 'Repeater' }, { id: 'd', text: 'Modem only' }],
    correctOptionId: 'b', explanation: 'A Layer 2 switch learns source MAC addresses and forwards frames based on the destination MAC table.', keyRule: 'A Layer 2 switch forwards frames using MAC addresses.'
  },
  {
    id: 'q-14', category: 'Data Link', difficulty: 'Medium',
    question: 'What is the main purpose of Spanning Tree Protocol in a switched Ethernet network?',
    options: [{ id: 'a', text: 'Encrypt Ethernet frames' }, { id: 'b', text: 'Prevent Layer 2 switching loops' }, { id: 'c', text: 'Assign host IP addresses' }, { id: 'd', text: 'Choose a DNS server' }],
    correctOptionId: 'b', explanation: 'STP blocks redundant paths as needed to create a loop-free logical topology while preserving backup links.', keyRule: 'STP prevents Layer 2 loops by blocking redundant paths.'
  },
  {
    id: 'q-15', category: 'Data Link', difficulty: 'Easy',
    question: 'How many bits are in a standard Ethernet MAC address?',
    options: [{ id: 'a', text: '32' }, { id: 'b', text: '48' }, { id: 'c', text: '64' }, { id: 'd', text: '128' }],
    correctOptionId: 'b', explanation: 'A standard MAC address is 48 bits, commonly written as six hexadecimal octets.', keyRule: 'Ethernet MAC addresses are 48 bits long.'
  },
  {
    id: 'q-16', category: 'Fundamentals', difficulty: 'Easy',
    question: 'How many layers are in the OSI reference model?',
    options: [{ id: 'a', text: '4' }, { id: 'b', text: '5' }, { id: 'c', text: '7' }, { id: 'd', text: '8' }],
    correctOptionId: 'c', explanation: 'The OSI model has seven layers, from Physical through Application.', keyRule: 'OSI has seven layers.'
  },
  {
    id: 'q-17', category: 'Fundamentals', difficulty: 'Medium',
    question: 'Which OSI layer is primarily responsible for routing packets between networks?',
    options: [{ id: 'a', text: 'Physical' }, { id: 'b', text: 'Data Link' }, { id: 'c', text: 'Network' }, { id: 'd', text: 'Presentation' }],
    correctOptionId: 'c', explanation: 'The Network layer provides logical addressing and path selection between networks; IP is its principal protocol.', keyRule: 'Routing between IP networks is a Network layer function.'
  },
  {
    id: 'q-18', category: 'Application', difficulty: 'Easy',
    question: 'Which protocol translates human-readable domain names into IP addresses?',
    options: [{ id: 'a', text: 'DNS' }, { id: 'b', text: 'DHCP' }, { id: 'c', text: 'SSH' }, { id: 'd', text: 'SNMP' }],
    correctOptionId: 'a', explanation: 'DNS resolves names such as example.com to records that can include IP addresses.', keyRule: 'DNS provides name resolution.'
  },
  {
    id: 'q-19', category: 'Application', difficulty: 'Easy',
    question: 'Which protocol commonly assigns IP configuration to a host automatically?',
    options: [{ id: 'a', text: 'DHCP' }, { id: 'b', text: 'FTP' }, { id: 'c', text: 'ICMP' }, { id: 'd', text: 'SSH' }],
    correctOptionId: 'a', explanation: 'DHCP can lease an IP address and provide settings such as the subnet mask, default gateway, and DNS servers.', keyRule: 'DHCP provides dynamic host configuration.'
  },
  {
    id: 'q-20', category: 'Application', difficulty: 'Medium',
    question: 'Which application protocol is used to securely access a remote command-line shell?',
    options: [{ id: 'a', text: 'Telnet' }, { id: 'b', text: 'SSH' }, { id: 'c', text: 'TFTP' }, { id: 'd', text: 'HTTP' }],
    correctOptionId: 'b', explanation: 'SSH provides encrypted remote login and command execution. Telnet does not encrypt its session by default.', keyRule: 'Use SSH for encrypted remote shell access.'
  },
  {
    id: 'q-21', category: 'Security', difficulty: 'Medium',
    question: 'What security property does encryption primarily provide for data in transit?',
    options: [{ id: 'a', text: 'Confidentiality' }, { id: 'b', text: 'Availability' }, { id: 'c', text: 'Address assignment' }, { id: 'd', text: 'Route convergence' }],
    correctOptionId: 'a', explanation: 'Encryption makes intercepted data unreadable without the required key, protecting confidentiality.', keyRule: 'Encryption protects confidentiality.'
  },
  {
    id: 'q-22', category: 'Network', difficulty: 'Medium',
    question: 'Which IPv4 header field is reduced by routers to prevent packets circulating forever?',
    options: [{ id: 'a', text: 'Protocol' }, { id: 'b', text: 'TTL' }, { id: 'c', text: 'Source port' }, { id: 'd', text: 'Window size' }],
    correctOptionId: 'b', explanation: 'Each router decrements the Time to Live value; a packet is discarded when it reaches zero.', keyRule: 'IPv4 TTL limits packet lifetime in hops.'
  },
  {
    id: 'q-23', category: 'Network', difficulty: 'Easy',
    question: 'What is the usual role of a default gateway on a host?',
    options: [{ id: 'a', text: 'Forward traffic to destinations outside the local subnet' }, { id: 'b', text: 'Resolve hostnames to MAC addresses' }, { id: 'c', text: 'Encrypt local files' }, { id: 'd', text: 'Assign Ethernet frame checksums' }],
    correctOptionId: 'a', explanation: 'A host sends packets for off-subnet destinations to its configured router, the default gateway.', keyRule: 'Off-subnet traffic is sent to the default gateway.'
  },
  {
    id: 'q-24', category: 'Transport', difficulty: 'Medium',
    question: 'Which TCP mechanism detects missing data and supports retransmission?',
    options: [{ id: 'a', text: 'Acknowledgements and sequence numbers' }, { id: 'b', text: 'DNS records' }, { id: 'c', text: 'Ethernet padding' }, { id: 'd', text: 'ARP broadcasts' }],
    correctOptionId: 'a', explanation: 'TCP sequence numbers identify bytes and acknowledgements report received data, allowing missing data to be retransmitted.', keyRule: 'TCP reliability uses sequence numbers and acknowledgements.'
  },
  {
    id: 'q-25', category: 'Application', difficulty: 'Easy',
    question: 'Which protocol is commonly used to synchronize clocks across IP networks?',
    options: [{ id: 'a', text: 'NTP' }, { id: 'b', text: 'ARP' }, { id: 'c', text: 'STP' }, { id: 'd', text: 'ICMP' }],
    correctOptionId: 'a', explanation: 'Network Time Protocol synchronizes clocks between networked systems.', keyRule: 'NTP synchronizes network clocks.'
  },
  {
    id: 'q-26', category: 'Data Link', difficulty: 'Medium',
    question: 'What does a VLAN primarily create on a managed Layer 2 switch?',
    options: [{ id: 'a', text: 'A separate broadcast domain' }, { id: 'b', text: 'A new physical cable type' }, { id: 'c', text: 'A public IP address' }, { id: 'd', text: 'An encrypted TCP connection' }],
    correctOptionId: 'a', explanation: 'Each VLAN forms a distinct Layer 2 broadcast domain; communication between VLANs requires Layer 3 routing.', keyRule: 'VLANs partition Layer 2 broadcast domains.'
  }
];

type AdditionalExamQuestion = [
  category: ExamQuestion['category'], difficulty: ExamQuestion['difficulty'], question: string,
  answer: string, distractor1: string, distractor2: string, distractor3: string,
  explanation: string, keyRule: string,
];

// Keep the multiple-choice quiz substantial while retaining authored answers and explanations.
const ADDITIONAL_EXAM_QUESTIONS: AdditionalExamQuestion[] = [
  ['Network', 'Easy', 'How many bits are in an IPv4 address?', '32', '16', '48', '128', 'IPv4 addresses contain four 8-bit octets, for 32 bits total.', 'IPv4 = 32 bits.'],
  ['Network', 'Easy', 'How many bits are in an IPv6 address?', '128', '32', '64', '256', 'IPv6 uses 128-bit addresses.', 'IPv6 = 128 bits.'],
  ['Network', 'Medium', 'Which prefix length corresponds to subnet mask 255.255.255.0?', '/24', '/16', '/25', '/8', 'The first 24 mask bits are set to one, so the prefix is /24.', 'Count the contiguous one bits in the subnet mask.'],
  ['Network', 'Medium', 'How many total addresses are in a /27 IPv4 subnet?', '32', '30', '64', '16', 'A /27 leaves 5 host bits, giving 2^5 = 32 total addresses.', 'Total addresses = 2^(32 − prefix).'],
  ['Network', 'Medium', 'How many usable host addresses are in a conventional /27 IPv4 subnet?', '30', '32', '28', '62', 'A /27 has 32 total addresses; subtract network and broadcast addresses to get 30 usable hosts.', 'Usable hosts = 2^(host bits) − 2 for ordinary IPv4 subnets.'],
  ['Network', 'Easy', 'Which address is the IPv4 loopback address commonly used by a host?', '127.0.0.1', '0.0.0.0', '255.255.255.255', '169.254.0.1', '127.0.0.1 is the commonly used IPv4 loopback address.', '127.0.0.0/8 is reserved for loopback.'],
  ['Network', 'Easy', 'What does the IPv4 address 169.254.10.20 commonly indicate on a host?', 'A link-local address', 'A public multicast address', 'The IPv4 loopback address', 'A default route', 'The 169.254.0.0/16 range is used for IPv4 link-local addressing.', '169.254.0.0/16 is IPv4 link-local.'],
  ['Network', 'Medium', 'Which routing principle selects the matching route with the longest prefix?', 'Longest prefix match', 'Round-robin routing', 'Shortest Ethernet frame', 'First in, first out', 'Routers prefer the most specific matching route, which has the longest prefix.', 'Longest prefix match selects the most specific route.'],
  ['Network', 'Medium', 'What does a router normally do to the IPv4 TTL when forwarding a packet?', 'Decrements it by at least one', 'Increments it by one', 'Replaces it with the TCP port', 'Copies the Ethernet FCS into it', 'A router decrements TTL; it discards the packet if TTL expires.', 'IPv4 TTL decreases at each router hop.'],
  ['Network', 'Easy', 'Which protocol reports network-layer errors and supports tools such as ping?', 'ICMP', 'FTP', 'ARP', 'SMTP', 'ICMP carries control and error messages; ping commonly uses ICMP Echo messages.', 'ICMP supports IP control and diagnostics.'],
  ['Network', 'Medium', 'What does a successful ping reply establish most directly?', 'That ICMP echo traffic reached the destination and returned', 'That every application port is open', 'That DNSSEC validation succeeded', 'That the path has zero packet loss', 'A reply demonstrates an ICMP round trip at that time, not that every service is reachable.', 'Ping tests ICMP reachability, not all application services.'],
  ['Network', 'Easy', 'Which address is the IPv4 limited broadcast address?', '255.255.255.255', '127.0.0.1', '0.0.0.0', '224.0.0.1', '255.255.255.255 is the limited broadcast address for the local network.', 'IPv4 limited broadcast = 255.255.255.255.'],
  ['Network', 'Medium', 'What is the main purpose of a subnet mask?', 'To identify the network and host portions of an IPv4 address', 'To encrypt the IP packet', 'To select a TCP application', 'To detect Ethernet collisions', 'The mask marks which address bits belong to the network prefix and which to the host portion.', 'The subnet mask defines the IPv4 prefix.'],
  ['Network', 'Medium', 'A host compares a destination address with its own subnet and finds it remote. Where does it send the packet?', 'To its default gateway', 'To the DNS server as an Ethernet frame', 'To the DHCP server only', 'To the broadcast MAC address in all cases', 'The host forwards off-subnet traffic to its configured default gateway.', 'Remote destinations are sent to the default gateway.'],
  ['Network', 'Hard', 'Which route is more specific: 10.0.0.0/8 or 10.1.0.0/16?', '10.1.0.0/16', '10.0.0.0/8', 'They are equally specific', 'Neither can be a route', 'A /16 matches more leading bits than a /8 and is therefore more specific.', 'A longer prefix is more specific.'],
  ['Network', 'Medium', 'What does NAT commonly allow a private IPv4 network to do?', 'Share public IPv4 address space when communicating externally', 'Avoid using IP addresses internally', 'Replace Ethernet switching', 'Guarantee end-to-end encryption', 'Network Address Translation rewrites address information, often allowing many private hosts to share public addressing.', 'NAT translates address information between networks.'],
  ['Network', 'Medium', 'What is the purpose of a routing table?', 'To choose how packets are forwarded toward destination networks', 'To store users’ passwords', 'To map every domain name to a MAC address', 'To calculate Ethernet frame padding', 'A router consults its routing table to select a next hop or outgoing interface.', 'Routing tables guide packet forwarding.'],
  ['Network', 'Easy', 'Which device primarily connects different IP networks and forwards packets between them?', 'Router', 'Hub', 'Repeater', 'Patch panel', 'Routers forward packets between networks using network-layer addresses.', 'Routers connect and route between networks.'],
  ['Network', 'Medium', 'What does a routing protocol help routers do?', 'Exchange information used to learn network routes', 'Encrypt all user traffic', 'Assign MAC addresses to hosts', 'Replace IP with DNS names', 'Routing protocols exchange reachability information so routers can build routing tables.', 'Routing protocols distribute route information.'],
  ['Network', 'Hard', 'Which statement about a directly connected route is generally correct?', 'It represents a network attached to an active router interface', 'It is always the Internet default route', 'It is learned only from DNS', 'It can exist only when using IPv6', 'Routers install connected routes for networks on configured, operational interfaces.', 'An active interface creates a directly connected route.'],
  ['Transport', 'Easy', 'Which protocol and port are commonly used by HTTPS?', 'TCP port 443', 'UDP port 53', 'TCP port 25', 'UDP port 67', 'HTTPS conventionally uses TCP port 443, with modern HTTP/3 using QUIC over UDP.', 'HTTPS commonly uses TCP 443; HTTP/3 uses QUIC.'],
  ['Transport', 'Easy', 'Which well-known port is commonly used by DNS queries?', '53', '22', '80', '443', 'DNS commonly uses port 53 over UDP or TCP, depending on the exchange.', 'DNS uses port 53.'],
  ['Transport', 'Easy', 'Which port is the default for SSH?', '22', '21', '23', '25', 'SSH uses TCP port 22 by default.', 'SSH default port = TCP 22.'],
  ['Transport', 'Easy', 'Which port is the default for HTTP?', '80', '25', '110', '443', 'HTTP conventionally uses TCP port 80.', 'HTTP default port = TCP 80.'],
  ['Transport', 'Medium', 'What does a transport-layer port number identify?', 'An application endpoint on a host', 'A physical switch port', 'An IPv4 subnet boundary', 'An Ethernet frame checksum', 'Port numbers let a host deliver transport data to the appropriate application endpoint.', 'Ports identify transport-layer application endpoints.'],
  ['Transport', 'Medium', 'What is the TCP three-way handshake sequence?', 'SYN, SYN-ACK, ACK', 'ACK, FIN, SYN', 'Discover, Offer, Request', 'SYN, FIN, RST', 'TCP normally establishes a connection with SYN, SYN-ACK, and ACK.', 'TCP setup = SYN → SYN-ACK → ACK.'],
  ['Transport', 'Medium', 'What does a TCP acknowledgment number usually indicate?', 'The next sequence number the receiver expects', 'The number of routers remaining', 'The sender’s UDP port', 'The Ethernet frame length', 'A cumulative TCP ACK acknowledges received bytes and indicates the next expected sequence number.', 'TCP ACK number indicates the next expected byte.'],
  ['Transport', 'Medium', 'Which TCP feature adjusts the sending rate in response to network congestion?', 'Congestion control', 'ARP resolution', 'DNS recursion', 'Ethernet auto-negotiation', 'TCP congestion control adjusts transmission behavior in response to congestion signals.', 'TCP congestion control responds to network congestion.'],
  ['Transport', 'Easy', 'Which TCP flag is used to initiate a connection?', 'SYN', 'FCS', 'VLAN', 'ARP', 'A client initiates a TCP connection by sending a segment with the SYN flag set.', 'SYN begins TCP connection establishment.'],
  ['Transport', 'Medium', 'Which TCP flag is commonly used to begin an orderly connection close?', 'FIN', 'SYN', 'PSH only', 'URG only', 'FIN indicates that a sender has finished sending data on that direction of the connection.', 'FIN signals an orderly TCP shutdown.'],
  ['Transport', 'Medium', 'What is the main difference between flow control and congestion control?', 'Flow control protects the receiver; congestion control protects the network', 'Flow control encrypts packets; congestion control resolves names', 'They are two names for DNS', 'Flow control applies only to Ethernet', 'TCP flow control limits data to receiver capacity, while congestion control responds to network capacity.', 'Flow control protects receiver capacity; congestion control protects the network.'],
  ['Transport', 'Easy', 'Which transport protocol is often preferred for real-time traffic that can tolerate some loss?', 'UDP', 'TCP', 'ARP', 'ICMP', 'UDP avoids TCP connection and retransmission behavior, which can suit latency-sensitive applications.', 'UDP can suit time-sensitive traffic that handles loss itself.'],
  ['Transport', 'Medium', 'What does a TCP retransmission timer help the sender do?', 'Resend data when an acknowledgment does not arrive in time', 'Refresh the host subnet mask', 'Rotate DNS records', 'Change the Ethernet source address', 'If expected acknowledgments do not arrive before the timer expires, TCP can retransmit data.', 'TCP retransmits unacknowledged data after timeout.'],
  ['Transport', 'Hard', 'What is a TCP socket commonly identified by?', 'Source and destination IP addresses and port numbers', 'Only the Ethernet FCS', 'The DNS query name alone', 'A VLAN number and subnet mask only', 'A TCP connection is distinguished by the endpoint address and port pair at both ends.', 'TCP connection identity uses the two endpoint address/port pairs.'],
  ['Transport', 'Medium', 'Which protocol is connection-oriented at the transport layer?', 'TCP', 'UDP', 'IP', 'ARP', 'TCP establishes a logical connection before carrying application data.', 'TCP is connection-oriented.'],
  ['Data Link', 'Easy', 'Which address is used for delivery on a local Ethernet link?', 'MAC address', 'TCP port', 'DNS name', 'Subnet prefix', 'Ethernet frames use source and destination MAC addresses for local-link delivery.', 'MAC addresses support local-link delivery.'],
  ['Data Link', 'Medium', 'What does a switch learn from the source MAC address of an incoming frame?', 'The MAC address and the port on which it was received', 'The destination IP route to the Internet', 'The TCP window size', 'The DNS server address', 'A switch records the source MAC and ingress port in its forwarding table.', 'Switches learn source MAC addresses on ingress.'],
  ['Data Link', 'Medium', 'What does a switch normally do with an unknown unicast frame?', 'Flood it within the VLAN except out the ingress port', 'Send it to every router on the Internet', 'Discard it in all cases', 'Convert it into a DNS query', 'Without a destination MAC table entry, the switch floods the frame within that VLAN, excluding the incoming port.', 'Unknown unicasts are flooded within the VLAN.'],
  ['Data Link', 'Easy', 'What is the Ethernet broadcast MAC address?', 'FF:FF:FF:FF:FF:FF', '00:00:00:00:00:00', '01:00:5E:00:00:00', '7F:00:00:01', 'All bits set in the 48-bit destination address identify the Ethernet broadcast.', 'Ethernet broadcast = FF:FF:FF:FF:FF:FF.'],
  ['Data Link', 'Medium', 'What does an Ethernet FCS help a receiver detect?', 'Frame corruption using a CRC check', 'The sender’s IP subnet', 'The application username', 'A routing loop', 'The Frame Check Sequence carries a CRC used to detect many transmission errors.', 'Ethernet FCS detects frame errors; it does not correct them.'],
  ['Data Link', 'Medium', 'What does full-duplex Ethernet allow on a link?', 'Simultaneous transmission and reception', 'Transmission in one direction only', 'Multiple hosts to share one collision domain by collision', 'Frames to omit source addresses', 'Full-duplex links can send and receive simultaneously and do not use collision detection.', 'Full duplex supports simultaneous send and receive.'],
  ['Data Link', 'Easy', 'Which technology separates one physical switch into multiple logical broadcast domains?', 'VLAN', 'NAT', 'DNS', 'TCP', 'Virtual LANs partition a switched network into separate logical Layer 2 broadcast domains.', 'A VLAN defines a logical Layer 2 broadcast domain.'],
  ['Data Link', 'Medium', 'What is the purpose of an IEEE 802.1Q tag on an Ethernet frame?', 'Identify the VLAN across a trunk link', 'Encrypt the frame payload', 'Store the IPv4 TTL', 'Identify the TCP application', '802.1Q inserts VLAN identification information so multiple VLANs can traverse a trunk.', '802.1Q tags carry VLAN information on trunks.'],
  ['Data Link', 'Medium', 'What does a switch trunk link normally carry?', 'Traffic for multiple VLANs', 'Only one host’s TCP session', 'Only IPv6 multicast', 'Only untagged management traffic', 'A trunk transports traffic for multiple VLANs, typically using tags to distinguish them.', 'Trunks carry multiple VLANs.'],
  ['Data Link', 'Easy', 'Which device repeats incoming bits to all its other ports without learning MAC addresses?', 'Hub', 'Layer 3 router', 'Managed switch', 'Firewall', 'A hub is a physical-layer repeater and does not maintain a MAC forwarding table.', 'A hub repeats signals and does not learn MAC addresses.'],
  ['Data Link', 'Medium', 'Which protocol prevents Layer 2 loops by placing redundant switch paths into a blocked state?', 'STP', 'DHCP', 'DNS', 'SMTP', 'Spanning Tree Protocol builds a loop-free active topology by blocking redundant paths.', 'STP blocks redundant paths to prevent loops.'],
  ['Data Link', 'Hard', 'In a standard Ethernet switch, what does a switch do when it receives a frame with its own ingress port as the learned destination port?', 'Filters the frame instead of forwarding it back out that port', 'Routes it to the default gateway automatically', 'Rewrites the destination MAC to broadcast', 'Sends it to the DNS server', 'A switch does not need to send a known unicast back out the same port it arrived on.', 'Known unicast frames are forwarded only toward the learned destination port.'],
  ['Fundamentals', 'Easy', 'What is the correct order of the first four OSI layers from bottom to top?', 'Physical, Data Link, Network, Transport', 'Application, Transport, Network, Physical', 'Network, Physical, Session, Data Link', 'Transport, Network, Data Link, Physical', 'The OSI model begins with Physical, Data Link, Network, and Transport layers.', 'OSI layers 1–4: Physical, Data Link, Network, Transport.'],
  ['Fundamentals', 'Medium', 'What is encapsulation in a layered network protocol stack?', 'Adding layer-specific control information as data moves down the stack', 'Removing all headers before transmission', 'Converting every packet into a DNS record', 'Assigning the same address to every host', 'Each layer adds its own control information around the payload as it prepares data for transmission.', 'Encapsulation adds headers as data moves down the stack.'],
  ['Fundamentals', 'Easy', 'Which unit is commonly used to measure link data rate?', 'Bits per second', 'Frames per kilometer', 'Hosts per subnet mask', 'Hertz per packet', 'Network link capacity and throughput are commonly expressed in bits per second.', 'Data rate is measured in bits per second.'],
  ['Fundamentals', 'Medium', 'What is propagation delay?', 'Time for a signal to travel across a medium', 'Time to serialize all application files', 'Time a switch stores its MAC table', 'Time for DNS to assign an IP address', 'Propagation delay depends on the distance and signal speed in the medium.', 'Propagation delay is signal travel time.'],
  ['Fundamentals', 'Medium', 'What is transmission delay for a packet primarily determined by?', 'Packet size and link data rate', 'DNS record lifetime only', 'Number of VLANs only', 'The destination MAC address', 'Transmission delay is the time required to put the packet’s bits onto the link.', 'Transmission delay = packet bits / link rate.'],
  ['Fundamentals', 'Easy', 'What does bandwidth describe in a networking context?', 'The capacity or frequency range of a link, depending on context', 'The number of users with administrator access', 'The physical length of an IP address', 'The number of Ethernet switches in a rack', 'Bandwidth is commonly used for link capacity, though it can also refer to a frequency range.', 'Bandwidth describes capacity in bits per second for a digital link.'],
  ['Fundamentals', 'Medium', 'What is goodput?', 'Useful application data delivered per unit time', 'The raw physical signaling frequency', 'The count of all transmitted header bytes', 'The number of routers in a route', 'Goodput measures useful delivered application payload and excludes protocol overhead and retransmitted data.', 'Goodput counts useful delivered application data.'],
  ['Fundamentals', 'Easy', 'What does a communication protocol define?', 'Rules for message formats and communication behavior', 'The color of network cables', 'Only the physical location of servers', 'The number of CPU cores in a router', 'Protocols specify how systems format, exchange, and interpret messages.', 'Protocols define communication rules.'],
  ['Fundamentals', 'Medium', 'What is the main role of a network interface card?', 'Connect a device to a network link and send or receive frames', 'Resolve domain names globally', 'Choose an Internet routing protocol', 'Lease IP addresses to every network', 'A network interface provides the device’s connection to a wired or wireless network.', 'A NIC provides network connectivity at the link layer.'],
  ['Fundamentals', 'Easy', 'Which topology connects each end device to a central switch?', 'Star', 'Bus', 'Ring', 'Full mesh', 'In a star topology, end devices connect to a central device such as a switch.', 'Star topology uses a central connection point.'],
  ['Fundamentals', 'Medium', 'What is a key benefit of packet switching?', 'Links can be shared dynamically by many data flows', 'Each host receives a dedicated physical path at all times', 'It eliminates all queuing delay', 'It guarantees every packet follows the same route', 'Packet switching statistically multiplexes traffic so link capacity is shared among active flows.', 'Packet switching shares link capacity among flows.'],
  ['Fundamentals', 'Medium', 'What does latency measure?', 'The time taken for data to travel between points', 'The total number of addresses in a subnet', 'The number of bits in a MAC address', 'The maximum size of a VLAN', 'Latency describes delay, often measured as one-way or round-trip time.', 'Latency is network delay.'],
  ['Application', 'Easy', 'Which protocol is commonly used to transfer web pages?', 'HTTP', 'ARP', 'STP', 'DHCP', 'HTTP is the application protocol used to transfer web resources.', 'HTTP transfers web resources.'],
  ['Application', 'Easy', 'Which protocol securely protects web traffic with TLS?', 'HTTPS', 'TFTP', 'Telnet', 'SNMP', 'HTTPS is HTTP protected with TLS for confidentiality and integrity in transit.', 'HTTPS = HTTP over TLS.'],
  ['Application', 'Medium', 'Which DNS record type maps a hostname to an IPv4 address?', 'A', 'AAAA', 'MX', 'PTR', 'An A record contains an IPv4 address for a DNS name.', 'DNS A records map names to IPv4 addresses.'],
  ['Application', 'Medium', 'Which DNS record type maps a hostname to an IPv6 address?', 'AAAA', 'A', 'MX', 'CNAME', 'An AAAA record contains an IPv6 address for a DNS name.', 'DNS AAAA records map names to IPv6 addresses.'],
  ['Application', 'Medium', 'Which DNS record identifies mail exchangers for a domain?', 'MX', 'A', 'PTR', 'TXT only', 'MX records identify mail servers responsible for receiving mail for a domain.', 'DNS MX records specify mail exchangers.'],
  ['Application', 'Easy', 'Which protocol is commonly used to send email between mail servers?', 'SMTP', 'POP3', 'ARP', 'ICMP', 'SMTP is used to submit and relay email between mail systems.', 'SMTP sends and relays email.'],
  ['Application', 'Medium', 'Which protocol lets a client retrieve and manage email while keeping folders synchronized on the server?', 'IMAP', 'TFTP', 'NTP', 'RARP', 'IMAP supports server-side mail folders and synchronization across clients.', 'IMAP synchronizes mail with the server.'],
  ['Application', 'Easy', 'Which protocol is designed for secure file transfer over an SSH connection?', 'SFTP', 'TFTP', 'HTTP', 'SNMP', 'SFTP provides file transfer over SSH; it is distinct from FTP secured with TLS.', 'SFTP runs over SSH.'],
  ['Application', 'Medium', 'What does a DHCP lease represent?', 'A time-limited assignment of configuration to a client', 'A permanent DNS delegation', 'A guaranteed TCP connection', 'A VLAN trunk reservation', 'DHCP leases grant an address and related configuration for a defined period.', 'DHCP configuration is leased for a duration.'],
  ['Application', 'Medium', 'What does a recursive DNS resolver do for a client?', 'Finds an answer by querying DNS on the client’s behalf', 'Assigns a MAC address to the client', 'Encrypts Ethernet frames', 'Selects the client’s default gateway', 'A recursive resolver obtains or returns the requested DNS result, using cache or further queries.', 'A recursive resolver performs DNS lookups for clients.'],
  ['Application', 'Easy', 'Which protocol is commonly used to monitor and manage network devices?', 'SNMP', 'ARP', 'PPP', 'CSMA/CD', 'SNMP supports monitoring and management of network devices.', 'SNMP is used for network monitoring and management.'],
  ['Security', 'Easy', 'What does a firewall commonly control?', 'Network traffic according to security rules', 'The optical wavelength of fiber', 'The number of bits in an IP address', 'The DHCP lease duration only', 'Firewalls allow or block traffic based on configured policy and connection state.', 'Firewalls enforce traffic policy.'],
  ['Security', 'Medium', 'What does authentication verify?', 'The identity of a user or system', 'Whether a packet has the shortest route', 'How many hosts fit in a subnet', 'Whether a frame has padding', 'Authentication checks that an entity is who it claims to be.', 'Authentication verifies identity.'],
  ['Security', 'Medium', 'What does authorization determine?', 'Which actions an authenticated identity is allowed to perform', 'Whether a cable is connected', 'Which DNS server is authoritative', 'The propagation speed of a signal', 'Authorization evaluates permissions after an identity has been established.', 'Authorization determines permitted actions.'],
  ['Security', 'Medium', 'What security property does a cryptographic hash help verify?', 'Data integrity', 'IP address assignment', 'Route selection', 'Signal strength', 'A secure hash can help detect changes by comparing digest values.', 'Hashes can support integrity checks.'],
  ['Security', 'Medium', 'What is the purpose of a digital certificate in TLS?', 'Bind an identity to a public key, supported by a certificate authority signature', 'Assign a private IP address', 'Replace the TCP handshake', 'Store a router’s forwarding table', 'A certificate presents an identity and public key with a trust chain that clients can validate.', 'TLS certificates bind identities to public keys.'],
  ['Security', 'Easy', 'Which practice best protects a network device’s administrative access?', 'Use unique strong credentials and encrypted management protocols', 'Use the same public password everywhere', 'Enable Telnet from any network', 'Disable account authentication', 'Unique strong credentials and encrypted management reduce unauthorized access and credential exposure.', 'Secure management with strong credentials and encryption.'],
  ['Security', 'Medium', 'What is phishing?', 'A deceptive attempt to trick users into revealing information or performing an unsafe action', 'A method for assigning IPv6 addresses', 'A type of Ethernet frame checksum', 'A routing protocol convergence timer', 'Phishing uses deceptive messages or sites to manipulate users into unsafe actions.', 'Phishing is social engineering through deceptive communication.'],
  ['Security', 'Medium', 'What does a VPN commonly provide across an untrusted network?', 'An encrypted tunnel between endpoints', 'A replacement for all IP routing', 'A new Ethernet broadcast address', 'A guarantee that endpoints contain no malware', 'A VPN commonly encapsulates traffic in a protected tunnel, though it does not by itself guarantee endpoint security.', 'A VPN can protect traffic across an untrusted path.'],
  ['Security', 'Hard', 'What is the principle of least privilege?', 'Give each identity only the access needed for its tasks', 'Give all users administrator access', 'Disable all network logging', 'Use one password for every service', 'Least privilege limits permissions to what is necessary, reducing the impact of mistakes or compromise.', 'Grant only the permissions required.'],
  ['Security', 'Medium', 'What is the main purpose of network segmentation?', 'Limit communication paths and contain threats or faults', 'Increase every subnet’s broadcast traffic', 'Remove the need for routing', 'Make all hosts share one password', 'Segmentation separates systems or traffic to reduce exposure and constrain lateral movement.', 'Segmentation limits unnecessary reachability.'],
  ['Security', 'Medium', 'What does multi-factor authentication require?', 'Proof from at least two different factor categories', 'Two passwords of the same type', 'A username and an IP address only', 'Two DNS lookups', 'MFA combines distinct factor types, such as something known and something possessed.', 'MFA combines different authentication factors.'],
  ['Network', 'Medium', 'Which IPv6 address type is intended for communication only on the local link?', 'Link-local', 'Global unicast', 'Unique local', 'Anycast only', 'IPv6 link-local addresses are used on a single link and are not routed by routers.', 'IPv6 link-local addresses stay on the local link.'],
  ['Network', 'Easy', 'Which IPv6 prefix is reserved for link-local addresses?', 'FE80::/10', 'FF00::/8', '2000::/3', 'FC00::/7', 'IPv6 link-local unicast addresses use the FE80::/10 prefix.', 'IPv6 link-local prefix = FE80::/10.'],
  ['Network', 'Medium', 'Which IPv6 address type delivers a packet to the nearest member of a configured group?', 'Anycast', 'Broadcast', 'Loopback', 'Unspecified', 'Anycast uses the same address on multiple interfaces and routes traffic to a nearest instance.', 'Anycast routes to a nearest member.'],
  ['Network', 'Medium', 'Does IPv6 use broadcast addresses?', 'No; IPv6 uses multicast for comparable group delivery', 'Yes, FF:FF:FF:FF:FF:FF', 'Yes, 255.255.255.255', 'Only on global unicast links', 'IPv6 does not use broadcast; multicast is used for group communication.', 'IPv6 has no broadcast; multicast serves group delivery.'],
  ['Network', 'Medium', 'Which protocol allows an IPv6 host to discover routers on its local link?', 'Neighbor Discovery Protocol', 'RIP version 1', 'ARP', 'FTP', 'IPv6 Neighbor Discovery uses ICMPv6 messages, including Router Solicitation and Advertisement.', 'IPv6 uses NDP for local neighbor and router discovery.'],
  ['Network', 'Medium', 'What is the usual prefix length of an IPv6 LAN subnet?', '/64', '/24', '/48 only', '/128', 'Most IPv6 LANs use a /64 subnet, which supports standard address autoconfiguration behavior.', 'A typical IPv6 LAN uses /64.'],
  ['Network', 'Medium', 'Which IPv6 mechanism can configure an address without a DHCPv6 server?', 'SLAAC', 'ARP', 'NAT overload', 'STP', 'Stateless Address Autoconfiguration uses router advertisements to help hosts configure IPv6 addresses.', 'SLAAC configures addresses using router advertisements.'],
  ['Network', 'Hard', 'What is the IPv6 loopback address?', '::1', '::', 'FE80::1', 'FF02::1', 'The compressed IPv6 loopback address is ::1.', 'IPv6 loopback = ::1.'],
  ['Network', 'Medium', 'What does the IPv6 prefix 2000::/3 identify?', 'Global unicast address space', 'Link-local addresses', 'Multicast addresses', 'Loopback addresses', '2000::/3 is allocated for global unicast IPv6 addressing.', '2000::/3 is global unicast.'],
  ['Network', 'Medium', 'Which IPv6 address begins with FF00::/8?', 'Multicast', 'Link-local unicast', 'Global unicast', 'Unique local unicast', 'IPv6 multicast addresses use the FF00::/8 prefix.', 'IPv6 multicast prefix = FF00::/8.'],
  ['Transport', 'Medium', 'What does QUIC use as its underlying transport?', 'UDP', 'TCP', 'ARP', 'ICMP', 'QUIC is implemented over UDP and provides transport features used by HTTP/3.', 'QUIC runs over UDP.'],
  ['Transport', 'Medium', 'Which protocol is used by HTTP/3?', 'QUIC', 'FTP', 'SMTP', 'RTP only', 'HTTP/3 maps HTTP semantics onto QUIC streams.', 'HTTP/3 uses QUIC.'],
  ['Transport', 'Hard', 'What does head-of-line blocking mean in ordered transport delivery?', 'Later data waits behind earlier missing data in the same ordered stream', 'A switch blocks all broadcast frames forever', 'DNS waits for an IP subnet mask', 'A router sends packets only at night', 'In a single ordered byte stream, missing earlier bytes can delay delivery of later bytes to the application.', 'Ordered stream delivery can cause head-of-line blocking.'],
  ['Transport', 'Medium', 'Which protocol provides best-effort delivery of IP packets without transport-layer reliability?', 'IP', 'TCP', 'TLS', 'SSH', 'IP forwards datagrams on a best-effort basis; reliability is generally provided by higher layers when needed.', 'IP itself does not guarantee delivery.'],
  ['Transport', 'Medium', 'What is multiplexing at the transport layer?', 'Using port numbers to support multiple application conversations', 'Combining multiple fiber cables into one', 'Changing a MAC address into an IP address', 'Adding VLAN IDs to DNS responses', 'Transport port numbers let multiple application processes share network communication.', 'Ports multiplex application traffic.'],
  ['Transport', 'Medium', 'What does a TCP advertised window describe?', 'How much additional data the receiver is currently prepared to accept', 'The physical size of an Ethernet frame', 'The number of available DNS servers', 'The width of an IPv6 prefix', 'The advertised window communicates receiver buffer availability for flow control.', 'TCP window advertises receiver capacity.'],
  ['Application', 'Medium', 'What is a URL?', 'A structured identifier for a resource and how to access it', 'A type of Ethernet address', 'A TCP acknowledgment number', 'A routing metric', 'A URL identifies a resource and can include its scheme, host, path, and other components.', 'URL identifies a resource and access scheme.'],
  ['Application', 'Medium', 'What does an HTTP status code in the 2xx range generally indicate?', 'The request was successful', 'The client must authenticate', 'The server encountered an error', 'The resource moved permanently', 'HTTP 2xx status codes indicate successful handling of a request.', '2xx indicates success.'],
  ['Application', 'Easy', 'Which HTTP method is normally used to retrieve a representation of a resource?', 'GET', 'DELETE', 'CONNECT only', 'TRACE only', 'GET requests a representation of the specified resource.', 'GET retrieves a resource representation.'],
  ['Application', 'Medium', 'Which HTTP method is commonly used to submit data that creates a resource?', 'POST', 'GET', 'HEAD', 'OPTIONS', 'POST asks the target resource to process the enclosed representation, commonly creating a subordinate resource.', 'POST commonly submits data for processing or creation.'],
  ['Application', 'Medium', 'What is the purpose of an HTTP cookie?', 'Store small client-side state that can be sent with later requests', 'Route an IP packet between networks', 'Detect bit errors in an Ethernet frame', 'Replace a TLS certificate', 'Cookies allow a server to associate subsequent requests with stored state or preferences.', 'Cookies carry client state between HTTP requests.'],
  ['Application', 'Medium', 'What does a proxy server commonly do?', 'Acts as an intermediary for client requests to other servers', 'Assigns a MAC address to a router', 'Terminates every Ethernet broadcast domain', 'Replaces all application protocols', 'A proxy forwards requests on behalf of clients and can apply caching or policy.', 'A proxy intermediates client requests.'],
  ['Application', 'Medium', 'What does caching a DNS response help reduce?', 'Repeated lookup delay and upstream query load', 'The number of bits in an IPv4 address', 'Ethernet frame size', 'TCP sequence number length', 'A resolver can reuse a cached record until its TTL expires, reducing repeat lookup work.', 'DNS caching reuses records until their TTL expires.'],
  ['Application', 'Easy', 'Which protocol is commonly used to automatically assign network settings to clients?', 'DHCP', 'SNMP', 'SSH', 'NTP', 'DHCP provides clients with leased IP configuration such as address and gateway.', 'DHCP automates host configuration.'],
  ['Application', 'Medium', 'Which protocol is designed for transferring files with minimal features and commonly uses UDP?', 'TFTP', 'SFTP', 'HTTPS', 'IMAP', 'TFTP is a simple file transfer protocol commonly carried over UDP.', 'TFTP commonly uses UDP.'],
  ['Security', 'Medium', 'What does TLS primarily provide to an application connection?', 'Encryption and integrity, with authenticated peers when certificates are validated', 'Dynamic IP address assignment', 'Ethernet loop prevention', 'IP route aggregation', 'TLS protects application traffic with encryption and integrity and can authenticate a server using certificates.', 'TLS protects application data in transit.'],
  ['Security', 'Medium', 'What is a denial-of-service attack intended to do?', 'Make a service unavailable by exhausting or disrupting its resources', 'Improve route convergence', 'Translate hostnames to IP addresses', 'Issue a DHCP lease', 'A denial-of-service attack overwhelms or disrupts resources so legitimate users cannot access a service.', 'DoS attacks target service availability.'],
  ['Security', 'Medium', 'Why should network device firmware be updated?', 'To receive security fixes and reliability improvements', 'To increase the number of OSI layers', 'To make passwords unnecessary', 'To disable packet forwarding', 'Updates often address vulnerabilities and defects that could affect device security and stability.', 'Keep device software patched.'],
  ['Security', 'Medium', 'What is a security benefit of logging network events?', 'It supports investigation and detection of suspicious activity', 'It prevents every attack automatically', 'It replaces access control', 'It assigns IPv6 prefixes', 'Logs provide evidence for monitoring and incident investigation, though they do not prevent attacks by themselves.', 'Logging supports monitoring and investigation.'],
  ['Security', 'Hard', 'What is the purpose of an intrusion detection system?', 'Identify suspicious activity and alert or record it', 'Assign IP addresses to hosts', 'Forward Ethernet frames based on MAC addresses', 'Encrypt every disk automatically', 'An IDS monitors events or traffic for suspicious patterns and raises alerts.', 'An IDS detects and reports suspicious activity.'],
  ['Security', 'Hard', 'How does an intrusion prevention system differ from an intrusion detection system?', 'An IPS can actively block detected traffic inline', 'An IPS only assigns DNS names', 'An IDS always encrypts traffic', 'An IPS is a subnetting method', 'An inline IPS can take action to block traffic; an IDS primarily detects and alerts.', 'IPS can prevent; IDS primarily detects.'],
  ['Security', 'Medium', 'Why is network access control useful?', 'It can restrict access based on identity or device policy', 'It guarantees zero latency', 'It replaces all routing tables', 'It increases broadcast domains automatically', 'Network access control applies policy to determine which users or devices may connect.', 'Access control limits network access by policy.'],
  ['Security', 'Medium', 'What is the main purpose of a security patch?', 'Fix a known vulnerability or defect in software', 'Change an IP address into a MAC address', 'Increase the Ethernet MTU in every case', 'Create a new VLAN automatically', 'A security patch updates software to correct a vulnerability or related security issue.', 'Apply patches to remediate known vulnerabilities.'],
  ['Security', 'Medium', 'Which backup practice helps protect against ransomware that can reach network shares?', 'Keep tested offline or immutable backups', 'Store the only backup on the same writable share', 'Disable restore testing', 'Use identical administrator passwords', 'Offline or immutable backups are harder for compromised systems to alter; recovery tests confirm they work.', 'Keep isolated backups and test recovery.'],
  ['Network', 'Medium', 'What does a traceroute-style tool help reveal?', 'The sequence of responding router hops toward a destination', 'The destination user’s password', 'The full contents of encrypted traffic', 'The physical MAC address of every remote host', 'Traceroute uses probe packets and hop-limit behavior to infer routers along a path.', 'Traceroute helps inspect the routed path.'],
  ['Network', 'Medium', 'What is a routing metric used for?', 'Compare candidate paths within a routing protocol', 'Identify an Ethernet vendor from a MAC address', 'Measure application payload length', 'Assign a DHCP lease', 'Routing protocols use metrics such as cost or hop count to compare routes.', 'Metrics compare candidate routes.'],
  ['Network', 'Medium', 'What does route summarization do?', 'Advertises a larger aggregate prefix for multiple more-specific routes', 'Adds a separate route for every host', 'Encrypts routing updates', 'Converts TCP to UDP', 'Summarization combines contiguous networks into an aggregate route when appropriate.', 'Route summarization reduces routing table entries.'],
  ['Network', 'Medium', 'What does a static route require compared with a dynamic route?', 'Manual configuration by an administrator', 'A DNS query for every packet', 'A VLAN tag on each IP header', 'An automatic DHCP lease', 'A static route is entered manually; dynamic routes are learned through routing protocols.', 'Static routes are manually configured.'],
  ['Network', 'Medium', 'Which protocol is a link-state interior gateway routing protocol?', 'OSPF', 'FTP', 'SMTP', 'ARP', 'OSPF is a link-state routing protocol used within an autonomous system.', 'OSPF is a link-state IGP.'],
  ['Network', 'Medium', 'Which protocol is commonly used to exchange routes between autonomous systems on the Internet?', 'BGP', 'STP', 'DHCP', 'NTP', 'BGP is the interdomain routing protocol used to exchange reachability between autonomous systems.', 'BGP exchanges interdomain routes.'],
  ['Network', 'Medium', 'What does the default route prefix 0.0.0.0/0 match?', 'Any IPv4 destination not matched by a more specific route', 'Only the loopback network', 'Only private IPv4 destinations', 'No destination addresses', 'A /0 prefix has no fixed network bits and is a fallback for any IPv4 destination.', '0.0.0.0/0 is the IPv4 default route.'],
  ['Network', 'Medium', 'What is the IPv4 multicast range?', '224.0.0.0 through 239.255.255.255', '127.0.0.0 through 127.255.255.255', '192.168.0.0 through 192.168.255.255', '240.0.0.0 through 255.255.255.255 only', 'IPv4 multicast addresses are in Class D, 224.0.0.0/4.', 'IPv4 multicast = 224.0.0.0/4.'],
  ['Network', 'Hard', 'What is the directed broadcast address for subnet 192.168.1.0/24?', '192.168.1.255', '192.168.1.0', '192.168.1.1', '192.168.0.255', 'For a /24, the last address in the range has all host bits set: 192.168.1.255.', 'Directed broadcast sets all host bits to one.'],
  ['Data Link', 'Medium', 'What does a bridge do in an Ethernet network?', 'Forwards frames between LAN segments using MAC addresses', 'Resolves DNS names', 'Assigns TCP ports', 'Encrypts IP packets by default', 'A bridge learns MAC locations and forwards frames between Layer 2 segments.', 'Bridges forward at Layer 2 using MAC addresses.'],
  ['Data Link', 'Medium', 'What is the purpose of an Ethernet preamble?', 'Help the receiver synchronize to the incoming signal', 'Identify the destination IP network', 'Carry the DNS question', 'Store the TCP receive window', 'The preamble provides a bit pattern that helps receiver synchronization before frame data.', 'Ethernet preamble supports synchronization.'],
  ['Data Link', 'Medium', 'What is a switch CAM table used for?', 'Map learned MAC addresses to switch ports and VLANs', 'Store application passwords', 'Map domain names to public IPs', 'Hold router CPU instructions', 'The Content Addressable Memory table stores MAC forwarding information.', 'CAM tables support MAC address forwarding.'],
  ['Data Link', 'Hard', 'What does a switch do when it receives a frame with a destination MAC learned on another port in the same VLAN?', 'Forwards the frame out the learned destination port', 'Floods it out every port including ingress', 'Routes it based only on the source IP', 'Drops it because the destination is known', 'A known unicast is sent toward the port associated with its destination MAC address.', 'Known unicast frames use the learned egress port.'],
  ['Fundamentals', 'Medium', 'Which delay component is caused by waiting in a queue at a router?', 'Queuing delay', 'Propagation delay', 'Transmission delay', 'Serialization checksum', 'Queuing delay is time spent waiting for a packet to be processed or transmitted.', 'Queueing adds delay under contention.'],
  ['Fundamentals', 'Medium', 'What is packet loss?', 'Failure of packets to reach their intended destination', 'A change in Ethernet cable color', 'A successful DNS lookup', 'An increase in subnet prefix length', 'Packets can be dropped due to congestion, errors, or policy, resulting in loss.', 'Packet loss means packets fail to arrive.'],
  ['Fundamentals', 'Medium', 'What does jitter describe for packet traffic?', 'Variation in packet delay over time', 'The number of MAC addresses per VLAN', 'The fixed size of an IPv6 address', 'A router’s administrative distance only', 'Jitter is variation in delay and can affect real-time media quality.', 'Jitter is delay variation.'],
  ['Fundamentals', 'Easy', 'What is a client in a client-server model?', 'A system that requests a service from a server', 'A network cable connector', 'A protocol data unit at Layer 2', 'A route with no next hop', 'A client initiates requests to use a service provided by a server.', 'Clients request services; servers provide them.'],
  ['Fundamentals', 'Easy', 'What is a server in a client-server model?', 'A system that provides a service to clients', 'A device that only repeats electrical signals', 'A subnet broadcast address', 'A type of TCP acknowledgment', 'A server listens for and responds to client requests for a service.', 'Servers provide services to clients.'],
  ['Application', 'Medium', 'What does a DNS TTL control for a cached resource record?', 'How long the record may be cached', 'The number of TCP retransmissions', 'The IP packet hop limit', 'The size of the Ethernet payload', 'The DNS time-to-live indicates how long resolvers may cache a record.', 'DNS TTL controls cache duration.'],
  ['Application', 'Medium', 'What does an authoritative DNS server provide?', 'The definitive DNS data for zones it serves', 'A default gateway for clients', 'An Ethernet switching table', 'A transport-layer congestion window', 'Authoritative servers publish DNS records for their zones.', 'Authoritative servers answer for their DNS zones.'],
  ['Application', 'Easy', 'Which protocol is used to transfer files between systems and can operate without encryption by default?', 'FTP', 'SSH', 'TLS', 'DNSSEC', 'Traditional FTP does not encrypt credentials or data by default.', 'FTP is not encrypted by default.'],
  ['Application', 'Medium', 'What does a mail user agent do?', 'Lets a user compose, read, and manage email', 'Routes IP packets between subnets', 'Learns Ethernet MAC addresses', 'Assigns subnet masks with ICMP', 'A mail user agent is email client software used to access mail.', 'MUA means mail user agent.'],
  ['Application', 'Medium', 'What is the purpose of a REST API?', 'Expose resources and operations through web conventions', 'Prevent all routing loops', 'Replace IPv4 with MAC addresses', 'Synchronize link clocks', 'REST APIs commonly expose resources using HTTP methods and representations.', 'REST commonly uses HTTP to interact with resources.'],
  ['Security', 'Medium', 'What does nonrepudiation aim to provide?', 'Evidence that makes it difficult for a party to deny an action or message', 'A way to avoid all encryption', 'An automatic subnet calculation', 'A replacement for backups', 'Digital signatures can provide evidence of origin and integrity that supports nonrepudiation.', 'Digital signatures can support nonrepudiation.'],
  ['Security', 'Medium', 'What is a digital signature used to verify?', 'Message integrity and the signer’s private-key possession', 'A device’s DHCP lease duration', 'The path MTU on a router', 'A wireless channel’s frequency', 'A signature verified with the corresponding public key supports integrity and signer authentication.', 'Digital signatures provide integrity and origin evidence.'],
  ['Security', 'Medium', 'Why should default passwords on network equipment be changed?', 'They are widely known and can enable unauthorized access', 'They increase Ethernet collisions', 'They disable IPv6 by design', 'They prevent firmware updates', 'Default credentials are often documented or reused and are a common attack path.', 'Replace default credentials before deployment.'],
  ['Security', 'Medium', 'What is the goal of security awareness training?', 'Help users recognize and respond safely to threats', 'Teach users to share passwords', 'Disable all network protocols', 'Replace firewalls with switches', 'Training helps users identify social engineering and follow safer security practices.', 'Users are part of the security boundary.'],
  ['Security', 'Medium', 'What is an access control list commonly used for on a router?', 'Permit or deny traffic according to configured rules', 'Translate every domain name', 'Assign Ethernet MAC addresses', 'Discover neighboring switches only', 'ACLs match traffic against rules and permit or deny it.', 'ACLs filter traffic by policy.'],
  ['Security', 'Hard', 'Why is encrypting data at rest useful?', 'It can limit exposure if storage media is accessed without authorization', 'It prevents all phishing emails', 'It guarantees a server remains available', 'It assigns clients a private address', 'Encryption at rest protects stored data when an attacker gains access to the storage medium.', 'Encrypt sensitive stored data.'],
  ['Network', 'Medium', 'Which IPv4 subnet mask corresponds to a /30 prefix?', '255.255.255.252', '255.255.255.0', '255.255.255.248', '255.255.0.0', 'A /30 has 30 leading one bits, which is 255.255.255.252.', '/30 = 255.255.255.252.'],
  ['Network', 'Medium', 'How many total IPv4 addresses are in a /30 subnet?', '4', '2', '8', '16', 'A /30 leaves two host bits, so it contains 2^2 = 4 total addresses.', 'A /30 contains four addresses.'],
  ['Network', 'Medium', 'What is the purpose of VLSM?', 'Use different subnet sizes to fit different host requirements', 'Use one identical mask on every subnet', 'Encrypt routing updates', 'Replace all default gateways', 'Variable Length Subnet Masking allocates prefixes of different sizes to reduce address waste.', 'VLSM fits subnet sizes to host needs.'],
  ['Network', 'Medium', 'What is route convergence?', 'The process by which routers reach a consistent view of network routes', 'The conversion of a MAC address to a URL', 'The assignment of an Ethernet FCS', 'The process of encrypting a DHCP lease', 'After a topology change, routing protocols exchange updates until routers have stable route information.', 'Convergence follows routing changes.'],
  ['Network', 'Hard', 'What is an autonomous system in Internet routing?', 'A network or group of networks under a common routing administration', 'A single Ethernet collision domain', 'A DNS record type', 'A TCP port range', 'An autonomous system is a set of networks managed under a common routing policy.', 'An AS shares a routing administration and policy.'],
  ['Network', 'Medium', 'Which device separates broadcast domains by default?', 'Router', 'Hub', 'Unmanaged repeater', 'Patch panel', 'Routers do not forward Layer 2 broadcasts between interfaces by default, separating broadcast domains.', 'Routers separate broadcast domains.'],
  ['Network', 'Medium', 'What does a proxy ARP router do?', 'Replies to ARP requests on behalf of another host or network', 'Assigns DNS records to clients', 'Encrypts all ARP packets', 'Replaces the default route with a VLAN', 'Proxy ARP allows a router to answer an ARP request for a target reachable through another interface.', 'Proxy ARP answers ARP on another host’s behalf.'],
  ['Network', 'Medium', 'What is the main role of an access point in a Wi-Fi network?', 'Bridge wireless clients onto a wired network', 'Route between autonomous systems', 'Assign TCP sequence numbers', 'Resolve all public DNS records', 'An access point provides wireless connectivity and typically bridges client traffic to a LAN.', 'An AP bridges wireless clients to the LAN.'],
  ['Data Link', 'Medium', 'What does CSMA/CA attempt to do on a wireless LAN?', 'Reduce the chance of collisions by coordinating access to the medium', 'Detect collisions after every transmission', 'Assign IP addresses to access points', 'Encrypt the DNS hierarchy', 'Wireless stations use collision avoidance mechanisms because detecting collisions while transmitting is difficult.', 'Wi-Fi uses collision avoidance.'],
  ['Data Link', 'Medium', 'What does an SSID identify?', 'A wireless network name', 'A router’s public IPv4 address', 'A TCP session', 'A DNS root server', 'The SSID is the name associated with a Wi-Fi network.', 'SSID identifies a wireless network.'],
  ['Data Link', 'Medium', 'What does WPA3 provide for Wi-Fi networks?', 'Security mechanisms for authenticating and protecting wireless communication', 'A replacement for IP routing', 'A way to extend Ethernet FCS', 'Dynamic DNS registration', 'WPA3 is a Wi-Fi security certification with authentication and encryption protections.', 'Use current Wi-Fi security such as WPA3 where supported.'],
  ['Fundamentals', 'Medium', 'What is the difference between throughput and goodput?', 'Throughput counts delivered data rate; goodput counts useful application payload', 'Goodput includes only Ethernet headers', 'Throughput measures propagation distance', 'They always have identical values', 'Goodput excludes overhead and retransmissions, so it is usually lower than throughput.', 'Goodput is useful payload rate.'],
  ['Fundamentals', 'Easy', 'What is a LAN?', 'A network covering a limited local area', 'A global routing protocol', 'A type of IPv6 address', 'A transport-layer port', 'A Local Area Network connects devices in a limited area such as a home, office, or campus building.', 'LAN = Local Area Network.'],
  ['Fundamentals', 'Easy', 'What is a WAN?', 'A network spanning a large geographic area or connecting distant LANs', 'A single Ethernet frame', 'A host-only loopback interface', 'A 48-bit MAC address', 'A Wide Area Network connects networks over broader geographic distances.', 'WAN = Wide Area Network.'],
  ['Fundamentals', 'Medium', 'What does interoperability mean in networking?', 'Different systems can communicate by following shared standards', 'Every device uses the same internal hardware', 'All traffic uses one IP address', 'Routers never need configuration', 'Standards and protocols allow independently implemented systems to exchange data.', 'Standards enable interoperability.'],
  ['Fundamentals', 'Medium', 'What is redundancy in network design?', 'Providing alternate components or paths to improve resilience', 'Removing every backup link', 'Using only one power supply', 'Disabling routing protocols', 'Redundant links and devices can preserve connectivity after a failure.', 'Redundancy improves resilience.'],
  ['Fundamentals', 'Medium', 'What is scalability in a network?', 'The ability to grow while continuing to meet performance and management needs', 'The ability to use only one host', 'A checksum field in a packet', 'A wireless encryption key', 'A scalable design can accommodate more users, devices, or traffic without requiring a complete redesign.', 'Design for growth in users and traffic.'],
  ['Application', 'Medium', 'What is the purpose of a URI scheme such as https in a URL?', 'Identify the access protocol or resource scheme', 'Identify the Ethernet switch port', 'Specify the IPv4 subnet mask', 'Set the TCP acknowledgment number', 'The scheme tells a client how to interpret and access the resource.', 'The URL scheme identifies the access method.'],
  ['Application', 'Medium', 'What does an HTTP 404 response mean?', 'The requested resource was not found', 'The request succeeded', 'The server requires a new IP address', 'The connection is encrypted', 'HTTP 404 indicates the server could not find the requested resource.', 'HTTP 404 = Not Found.'],
  ['Application', 'Medium', 'What does an HTTP 301 response indicate?', 'The resource has moved permanently to another URL', 'The request succeeded with no content', 'The server is unavailable temporarily', 'The client must use UDP', 'HTTP 301 is a permanent redirect response.', 'HTTP 301 = Moved Permanently.'],
  ['Application', 'Easy', 'Which protocol provides a command-line tool commonly used to query DNS records?', 'DNS protocol', 'STP', 'PPP', 'Ethernet', 'Tools such as dig and nslookup send DNS queries to resolvers or authoritative servers.', 'DNS tools query DNS servers.'],
  ['Application', 'Medium', 'What is the purpose of a content delivery network?', 'Serve content from distributed locations closer to users', 'Assign private addresses to routers', 'Replace TLS certificates', 'Prevent all packet loss on the Internet', 'CDNs distribute cached content across locations to reduce latency and origin load.', 'CDNs place content closer to users.'],
  ['Application', 'Medium', 'What is an API endpoint?', 'A specific address where a service exposes an operation or resource', 'A physical end of an Ethernet cable only', 'A broadcast MAC address', 'A TCP congestion event', 'An endpoint identifies a network-accessible API resource or operation.', 'API endpoints expose service resources or operations.'],
  ['Security', 'Medium', 'What is a vulnerability?', 'A weakness that could be exploited to affect a system', 'A successful backup restore', 'A network performance metric', 'A valid DNS response', 'A vulnerability is a weakness in software, configuration, or process that may be exploited.', 'Find and remediate exploitable weaknesses.'],
  ['Security', 'Medium', 'What is a security risk?', 'The potential for a threat to exploit a vulnerability and cause harm', 'A guaranteed successful route lookup', 'A checksum mismatch only', 'A type of IPv6 prefix', 'Risk considers the likelihood and impact of a threat exploiting a weakness.', 'Risk combines likelihood and impact.'],
  ['Security', 'Medium', 'Why is regular configuration backup important for network devices?', 'It supports restoration after failure or configuration error', 'It automatically blocks all attacks', 'It replaces firmware updates', 'It prevents IP address exhaustion', 'A current backup helps restore known-good configuration after an outage or mistake.', 'Back up configurations and verify restoration.'],
  ['Security', 'Hard', 'What is defense in depth?', 'Using multiple complementary security controls', 'Using one password for every device', 'Disabling all monitoring', 'Sending every packet to one host', 'Layered controls reduce reliance on any single security measure.', 'Use multiple complementary security layers.'],
  ['Security', 'Medium', 'What does a secure password manager help users do?', 'Create and store unique strong passwords', 'Share one password with all coworkers', 'Disable multi-factor authentication', 'Make phishing impossible', 'A password manager helps generate and store distinct credentials for different services.', 'Use unique passwords for every service.'],
];

const ADDITIONAL_EXAM_QUESTIONS_TYPED: ExamQuestion[] = ADDITIONAL_EXAM_QUESTIONS.map((item, index) => {
  const [category, difficulty, question, answer, ...rest] = item;
  const [distractor1, distractor2, distractor3, explanation, keyRule] = rest;
  const options = [answer, distractor1, distractor2, distractor3];
  const correctIndex = index % options.length;
  const rotatedOptions = options.map((_, optionIndex) => options[(optionIndex - correctIndex + options.length) % options.length]);
  return {
    id: `q-${index + 27}`,
    category,
    difficulty,
    question,
    options: rotatedOptions.map((text, optionIndex) => ({ id: String.fromCharCode(97 + optionIndex), text })),
    correctOptionId: String.fromCharCode(97 + correctIndex),
    explanation: `${explanation} Therefore, the correct answer is "${answer}".`,
    keyRule,
  };
});

EXAM_QUESTIONS.push(...ADDITIONAL_EXAM_QUESTIONS_TYPED);

export const VIVA_QUESTIONS: VivaQuestion[] = [
  {
    id: 'v-1',
    category: 'Transport Layer',
    question: 'Why does TCP require a 3-way handshake to establish a connection, and why cannot it be done in 2 steps?',
    difficulty: 'College',
    expectedConcepts: ['Sequence Numbers', 'Full-Duplex Synchronization', 'Delayed Duplicate SYN Packets', 'Initial Sequence Number (ISN)'],
    modelAnswer: 'TCP provides a full-duplex reliable connection where both client and server maintain independent Initial Sequence Numbers (ISNs). Step 1 (SYN) synchronizes the client ISN. Step 2 (SYN-ACK) acknowledges the client ISN and synchronizes the server ISN. Step 3 (ACK) allows the client to confirm receipt of the server ISN. A 2-way handshake would leave the server uncertain whether its SYN reached the client, creating phantom half-open connections caused by delayed duplicate packets from old sessions.',
    rubricCriteria: [
      'Mention that TCP is full-duplex with two distinct sequence number streams.',
      'Explain that both sides must acknowledge the other\'s Initial Sequence Number.',
      'Address the prevention of delayed duplicate SYN packet anomalies.'
    ],
    followUp: 'What timer prevents delayed duplicate packets from corrupting subsequent connections after teardown? (Answer: TIME_WAIT / 2MSL timer).'
  },
  {
    id: 'v-2',
    category: 'Network Layer',
    question: 'Explain the difference between a Collision Domain and a Broadcast Domain, and state how Hubs, Switches, and Routers affect them.',
    difficulty: 'Beginner',
    expectedConcepts: ['CSMA/CD', 'Hub Single Collision Domain', 'Switch Microsegmentation', 'Router Drops Broadcasts', 'VLANs'],
    modelAnswer: 'A Collision Domain is a physical network segment where data packets can collide with one another if transmitted simultaneously (e.g. half-duplex CSMA/CD). A Broadcast Domain consists of all devices that receive a broadcast frame (FF:FF:FF:FF:FF:FF). A Hub creates 1 single collision domain and 1 broadcast domain. A Switch breaks collision domains so each port is its own collision domain, but maintains 1 broadcast domain (per VLAN). A Router breaks BOTH collision domains and broadcast domains, stopping broadcasts by default.',
    rubricCriteria: [
      'Define collision domain and broadcast domain clearly.',
      'State that each switch port is an independent collision domain.',
      'State that routers partition broadcast domains.'
    ],
    followUp: 'How can you divide broadcast domains on a Layer 2 switch without buying a router? (Answer: By configuring VLANs).'
  },
  {
    id: 'v-3',
    category: 'Subnetting & Addressing',
    question: 'What is Variable Length Subnet Masking (VLSM) and why is it preferred over Fixed Length Subnet Masking (FLSM)?',
    difficulty: 'College',
    expectedConcepts: ['Address Wastage', 'Custom Prefix Lengths', 'Point-to-Point /30 links', 'Classless Routing Protocols (OSPF/EIGRP)'],
    modelAnswer: 'FLSM assigns the same fixed subnet mask and equal number of host addresses to every subnet, regardless of how few hosts each department needs, resulting in severe IPv4 address wastage. VLSM allows network architects to subnet subnets hierarchically using different prefix lengths (/26 for 60 hosts, /29 for 6 hosts, /30 for 2-host WAN links). This conserves address space and enables efficient route aggregation.',
    rubricCriteria: [
      'Highlight the contrast between equal-size subnets and variable-size subnets.',
      'Mention IP address conservation and point-to-point /30 links.',
      'Identify that classless routing protocols (like OSPF, RIPv2) are required.'
    ],
    followUp: 'Why does VLSM require classless routing protocols instead of classful ones like RIPv1? (Answer: Classful protocols do not advertise subnet masks in routing updates).'
  },
  {
    id: 'v-4',
    category: 'Data Link Layer',
    question: 'Explain how a transparent Layer 2 switch learns MAC addresses and avoids forwarding loops.',
    difficulty: 'Advanced',
    expectedConcepts: ['Source MAC Learning', 'CAM Table Lookup', 'Flooding Unknown Unicasts', 'Spanning Tree Protocol (STP)', 'BPDU'],
    modelAnswer: 'A switch learns dynamically by examining the Source MAC address of incoming frames on each ingress port and recording [MAC -> Port -> VLAN] in its CAM table with an aging timer. When forwarding, it inspects the Destination MAC: if present in the CAM table, it transmits out that designated port; if absent or broadcast, it floods out all ports except the arrival port. To prevent catastrophic broadcast storms caused by redundant physical links, switches run the Spanning Tree Protocol (STP, 802.1D) to elect a Root Bridge and block redundant loop ports.',
    rubricCriteria: [
      'Distinguish Source MAC learning from Destination MAC forwarding.',
      'Explain the flooding behavior for unknown unicast frames.',
      'Name Spanning Tree Protocol (STP) as the loop prevention mechanism.'
    ],
    followUp: 'What are the four states of an IEEE 802.1D STP port during convergence? (Answer: Blocking, Listening, Learning, Forwarding).'
  }
];
