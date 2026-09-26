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
  }
];

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
