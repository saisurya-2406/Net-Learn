/**
 * NetLearn Comprehensive Computer Networks Curriculum Database
 */

export interface CurriculumTopic {
  id: string;
  moduleId: string;
  title: string;
  category: string;
  durationMin: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  summary: string;
  keyConcepts: string[];
  whatIsIt: string;
  howItWorks: string;
  whyItMatters: string;
  protocolDetails?: {
    layer: string;
    pdu: string;
    headers?: string[];
    ports?: string;
  };
  cliOrPacketExample?: {
    title: string;
    content: string;
  };
  commonMistakes: string[];
  examQuestions: string[];
  visualizerLink?: string;
  labId?: string;
  references: Array<{ title: string; type: 'RFC' | 'Doc' | 'Guide'; url?: string }>;
}

export interface CurriculumModule {
  id: string;
  number: number;
  title: string;
  description: string;
  iconName: string;
  topics: CurriculumTopic[];
}

export const CURRICULUM_MODULES: CurriculumModule[] = [
  {
    id: 'mod-1',
    number: 1,
    title: 'Network Fundamentals & Topologies',
    description: 'Core architectures, network types (LAN/WAN/MAN), topologies (Star/Mesh/Bus), and client-server vs P2P models.',
    iconName: 'Network',
    topics: [
      {
        id: 'top-1-1',
        moduleId: 'mod-1',
        title: 'Network Architecture & Client-Server vs P2P',
        category: 'Architecture',
        durationMin: 15,
        level: 'Beginner',
        summary: 'Understand nodes, hosts, clients, servers, and the architectural differences between centralized and decentralized networks.',
        keyConcepts: ['Client-Server Model', 'Peer-to-Peer (P2P)', 'Nodes vs Hosts', 'Scalability & Single Point of Failure'],
        whatIsIt: 'A computer network is an interconnected collection of autonomous computers capable of exchanging data. In Client-Server networks, dedicated servers provide centralized resources (files, web pages, databases) to clients. In Peer-to-Peer networks, every node functions simultaneously as both client and server.',
        howItWorks: 'Clients initiate requests to well-known IP addresses and listening port numbers on servers. Servers process requests concurrently and return responses. In P2P (e.g. BitTorrent), nodes maintain direct overlay connections and share segments collaboratively.',
        whyItMatters: 'Determines system reliability, security boundaries, and operational cost. Enterprise networks rely on client-server for centralized identity and access management.',
        commonMistakes: [
          'Confusing a physical node (any connected device like a switch) with a host (an end device with an assigned IP address like a PC or server).',
          'Assuming P2P has no protocol standards; P2P uses structured protocols like DHT (Distributed Hash Tables).'
        ],
        examQuestions: [
          'Differentiate between client-server and peer-to-peer architecture with 4 technical comparison points.',
          'Explain why client-server architectures face scalability bottlenecks and how load balancers mitigate them.'
        ],
        visualizerLink: 'osi',
        references: [
          { title: 'RFC 2616 - HTTP/1.1 Specification (Client/Server)', type: 'RFC' },
          { title: 'Kurose & Ross - Computer Networking: A Top-Down Approach Ch 1', type: 'Guide' }
        ]
      },
      {
        id: 'top-1-2',
        moduleId: 'mod-1',
        title: 'Network Topologies: Physical vs Logical',
        category: 'Topologies',
        durationMin: 20,
        level: 'Beginner',
        summary: 'Deep dive into Star, Mesh, Bus, Ring, Tree, and Hybrid topologies with cable fault tolerance and cost trade-offs.',
        keyConcepts: ['Star Topology', 'Full vs Partial Mesh', 'Bus & Ring Legacy', 'Formula for Mesh Links: n(n-1)/2'],
        whatIsIt: 'Network topology defines how network nodes and links are arranged. Physical topology refers to physical cable layouts; logical topology refers to how data frames actually circulate across the transmission media.',
        howItWorks: 'In a Star topology, all nodes connect to a central switch. In a Full Mesh, every node has a dedicated point-to-point link to every other node, requiring n*(n-1)/2 links for n devices.',
        whyItMatters: 'Critical for fault-tolerance in data centers and internet backbones. While modern enterprise LANs are physically star-wired to switches, backbone backplanes are high-density meshes.',
        cliOrPacketExample: {
          title: 'Full Mesh Link Calculation Formula',
          content: `For 8 core routers in a data center spine:
Number of links = n * (n - 1) / 2
Number of links = 8 * 7 / 2 = 28 redundant physical interfaces.`
        },
        commonMistakes: [
          'Confusing physical star with logical bus (a legacy Hub is physically a star, but logically a shared bus where all nodes share 1 collision domain).',
          'Forgetting that full mesh cable count grows quadratically O(n²).'
        ],
        examQuestions: [
          'Calculate the number of duplex physical lines required to connect 12 routers in a full mesh topology.',
          'Compare Star and Mesh topologies in terms of fault tolerance, cable complexity, and installation cost.'
        ],
        labId: 'lab-1',
        references: [
          { title: 'IEEE 802.3 Ethernet Topology Guidelines', type: 'Doc' }
        ]
      }
    ]
  },
  {
    id: 'mod-2',
    number: 2,
    title: 'Physical Layer & Transmission',
    description: 'Signals, bit rate, baud, transmission media (Twisted pair, Fiber), simplex/duplex, multiplexing (FDM/TDM), and switching modes.',
    iconName: 'Cpu',
    topics: [
      {
        id: 'top-2-1',
        moduleId: 'mod-2',
        title: 'Transmission Media: Copper Twisted Pair vs Fiber Optics',
        category: 'Media',
        durationMin: 20,
        level: 'Beginner',
        summary: 'Learn Cat5e/Cat6 UTP vs STP, Single-Mode vs Multi-Mode Fiber, attenuation, and electromagnetic interference (EMI).',
        keyConcepts: ['Cat6 UTP vs STP', 'Single-Mode Fiber (SMF)', 'Multi-Mode Fiber (MMF)', 'Total Internal Reflection'],
        whatIsIt: 'Transmission media provide the physical pathway across which electromagnetic waves or optical light pulses travel between networking interfaces.',
        howItWorks: 'Twisted pair copper uses differential signaling across twisted pairs to cancel out electromagnetic cross-talk. Fiber optics uses silica glass cores where laser or LED pulses undergo total internal reflection with near-zero EMI.',
        whyItMatters: 'Copper is limited to 100 meters per run due to signal attenuation. Fiber optics can span 10km to 100km per link for campus and undersea trunks.',
        commonMistakes: [
          'Using Straight-Through cables when connecting two PCs directly without Auto-MDIX (requires crossover or Auto-MDIX).',
          'Confusing Multi-Mode fiber (larger core, 850nm LED, short distance) with Single-Mode (9µm core, 1310/1550nm laser, long reach).'
        ],
        examQuestions: [
          'Why are wire pairs twisted together inside Cat6 cables? Explain the noise cancellation phenomenon.',
          'Compare Single-Mode and Multi-Mode optical fibers in terms of core diameter, dispersion, and maximum link distance.'
        ],
        references: [
          { title: 'TIA/EIA-568-C Commercial Building Telecommunications Cabling', type: 'Doc' }
        ]
      },
      {
        id: 'top-2-2',
        moduleId: 'mod-2',
        title: 'Bandwidth, Latency & Delay Math (Nodal Delay)',
        category: 'Performance',
        durationMin: 25,
        level: 'Intermediate',
        summary: 'Master the four components of packet delay: Transmission, Propagation, Processing, and Queuing delays.',
        keyConcepts: ['d_trans = L / R', 'd_prop = d / s', 'Bandwidth-Delay Product (BDP)', 'Queuing Jitter'],
        whatIsIt: 'Nodal delay is the total elapsed time required for a packet to travel from a sending node to an adjacent receiving node across a link.',
        howItWorks: 'Total Delay = d_proc + d_queue + d_trans + d_prop. Transmission delay is the time to push L bits onto a wire with rate R bps. Propagation delay is the physical time for one bit to travel distance d at light velocity s (~2x10⁸ m/s).',
        whyItMatters: 'Crucial for network dimensioning, voice-over-IP (VoIP) quality, financial algorithmic trading, and game networking.',
        cliOrPacketExample: {
          title: 'Transmission vs Propagation Delay Calculation',
          content: `Given:
Packet length L = 1500 bytes = 12,000 bits
Link Bandwidth R = 100 Mbps = 100,000,000 bps
Distance d = 2,000 km = 2,000,000 meters
Propagation speed s = 2 * 10^8 m/s

d_trans = L / R = 12,000 / 100,000,000 = 0.00012 s = 0.12 ms
d_prop = d / s = 2,000,000 / (2 * 10^8) = 0.010 s = 10.0 ms
Total Link Delay = 10.12 ms.`
        },
        commonMistakes: [
          'Thinking higher bandwidth makes bits travel physically faster across the country. Higher bandwidth only reduces transmission time L/R!',
          'Forgetting to multiply bytes by 8 to convert to bits before dividing by bps.'
        ],
        examQuestions: [
          'A packet of 1000 bytes is sent over a 10 Mbps link of length 1000 km. Find total transmission plus propagation delay.',
          'Define Bandwidth-Delay Product (BDP) and explain its significance for TCP buffer tuning.'
        ],
        references: [
          { title: 'RFC 6349 - Framework for TCP Throughput Testing', type: 'RFC' }
        ]
      }
    ]
  },
  {
    id: 'mod-3',
    number: 3,
    title: 'Data Link Layer, Switching & MAC',
    description: 'Framing, MAC addressing, switch MAC learning table, collision vs broadcast domains, VLANs (802.1Q), and Spanning Tree Protocol (STP).',
    iconName: 'Layers',
    topics: [
      {
        id: 'top-3-1',
        moduleId: 'mod-3',
        title: 'Ethernet Framing & 48-bit MAC Addressing',
        category: 'Data Link',
        durationMin: 20,
        level: 'Beginner',
        summary: 'Deconstruct the standard Ethernet II frame: Preamble, SFD, Destination MAC, Source MAC, EtherType, Payload, and 32-bit CRC FCS.',
        keyConcepts: ['48-bit MAC (OUI + NIC)', 'Ethernet II Frame Format', 'FCS / CRC Checksum', 'Broadcast vs Unicast MAC'],
        whatIsIt: 'The Data Link layer encapsulates Layer 3 packets into Layer 2 frames for hop-by-hop delivery across a local physical link using 48-bit Media Access Control (MAC) addresses.',
        howItWorks: 'A MAC address consists of 6 octets (e.g. 00:1A:2B:3C:4D:5E). The first 24 bits represent the Organizationally Unique Identifier (OUI) assigned to the manufacturer by IEEE; the last 24 bits are assigned by the vendor.',
        whyItMatters: 'Switches inspect destination MAC addresses in hardware (ASICs) at wire speed to deliver frames directly to the intended port.',
        protocolDetails: {
          layer: 'Layer 2 - Data Link',
          pdu: 'Frame',
          headers: ['Preamble (7B)', 'SFD (1B)', 'Dest MAC (6B)', 'Src MAC (6B)', 'Type (2B)', 'Payload (46-1500B)', 'FCS (4B)']
        },
        commonMistakes: [
          'Thinking MAC addresses are routed across the Internet. MAC addresses are stripped and rewritten at every router hop!',
          'Believing FF:FF:FF:FF:FF:FF will leave the local subnet; routers drop Layer 2 broadcasts by design.'
        ],
        examQuestions: [
          'Draw the complete Ethernet II frame format with field byte sizes and explain the function of the Preamble and FCS.',
          'What is the minimum frame size for IEEE 802.3 Ethernet and why was it chosen in relation to CSMA/CD?'
        ],
        visualizerLink: 'osi',
        references: [
          { title: 'IEEE 802.3 Standard for Ethernet', type: 'Doc' }
        ]
      },
      {
        id: 'top-3-2',
        moduleId: 'mod-3',
        title: 'Switch MAC Address Learning & Frame Forwarding',
        category: 'Switching',
        durationMin: 25,
        level: 'Intermediate',
        summary: 'How Layer 2 switches inspect Source MAC to learn and Destination MAC to forward, filter, or flood unknown unicasts.',
        keyConcepts: ['MAC Address Table (CAM)', 'Unicast Forwarding', 'Flooding Unknown Unicasts', 'Aging Timer (300s)'],
        whatIsIt: 'A switch is an intelligent multiport bridge that partitions collision domains. It builds a Content Addressable Memory (CAM) table dynamically by observing incoming frames.',
        howItWorks: '1. Frame arrives at Port X. Switch records: [Source MAC -> Port X]. 2. Switch checks Destination MAC: If present in CAM table, forward out that single port. If absent or Broadcast (FF:FF:FF:FF:FF:FF), flood frame out all ports except the receiving port.',
        whyItMatters: 'Unlike dumb hubs that broadcast all electrical signals, switches provide dedicated full-duplex bandwidth per port without collisions.',
        cliOrPacketExample: {
          title: 'Cisco IOS MAC Address Table Inspection',
          content: `Switch# show mac address-table
          Mac Address Table
-------------------------------------------
Vlan    Mac Address       Type        Ports
----    -----------       --------    -----
   1    001a.2b3c.4d5e    DYNAMIC     Fa0/1
   1    001a.2b3c.4d88    DYNAMIC     Fa0/2
Total Mac Addresses for this criterion: 2`
        },
        commonMistakes: [
          'Thinking a switch modifies the IP or MAC headers of passing frames. Standard Layer 2 switches forward frames unmodified.',
          'Confusing a collision domain (1 port on a switch) with a broadcast domain (all ports on the same VLAN).'
        ],
        examQuestions: [
          'Describe the three core functions of a transparent Ethernet switch: Learning, Forwarding/Filtering, and Loop Prevention.',
          'What happens when a switch receives a frame with an unknown destination unicast MAC address?'
        ],
        labId: 'lab-2',
        references: [
          { title: 'Cisco Catalyst Switch Architecture Guide', type: 'Doc' }
        ]
      },
      {
        id: 'top-3-3',
        moduleId: 'mod-3',
        title: 'Virtual LANs (VLANs) & 802.1Q Trunking',
        category: 'Switching',
        durationMin: 30,
        level: 'Intermediate',
        summary: 'Segment broadcast domains logically using VLANs, Access ports, and 802.1Q trunking tags (VID & Priority).',
        keyConcepts: ['VLAN Segmentation', 'IEEE 802.1Q 4-byte Tag', 'Access vs Trunk Ports', 'Inter-VLAN Routing'],
        whatIsIt: 'A Virtual LAN is a logical partition of a physical switch into distinct broadcast domains. Devices in different VLANs cannot communicate at Layer 2 even if connected to the same switch.',
        howItWorks: 'Access ports belong to a single VLAN and deliver untagged frames to end devices. Trunk links carry traffic for multiple VLANs by prepending an IEEE 802.1Q 4-byte tag containing the 12-bit VLAN ID (VID).',
        whyItMatters: 'Enhances network security, contains broadcast storms, and aligns network subnets with organizational departments (e.g. Sales, HR, Engineering).',
        cliOrPacketExample: {
          title: 'Configuring VLAN 10 and Access Port in CLI',
          content: `Switch(config)# vlan 10
Switch(config-vlan)# name Engineering
Switch(config-vlan)# exit
Switch(config)# interface FastEthernet 0/1
Switch(config-if)# switchport mode access
Switch(config-if)# switchport access vlan 10
Switch(config-if)# no shutdown`
        },
        commonMistakes: [
          'Forgetting that communication between two different VLANs requires a Layer 3 router or multilayer switch.',
          'Assigning the same IP subnet to two different VLANs, causing routing ambiguities.'
        ],
        examQuestions: [
          'Explain the format of an IEEE 802.1Q tag. What is the role of the 12-bit VID field?',
          'What is a "Router-on-a-Stick" and how does it enable Inter-VLAN communication using subinterfaces?'
        ],
        labId: 'lab-5',
        references: [
          { title: 'IEEE 802.1Q Standard for Virtual Bridged Local Area Networks', type: 'Doc' }
        ]
      }
    ]
  },
  {
    id: 'mod-4',
    number: 4,
    title: 'Network Layer, IPv4/IPv6, Subnetting & Routing',
    description: 'IPv4 structure, Subnetting (FLSM & VLSM), CIDR aggregation, IPv6, ARP, ICMP Ping, NAT, and Routing algorithms.',
    iconName: 'Compass',
    topics: [
      {
        id: 'top-4-1',
        moduleId: 'mod-4',
        title: 'IPv4 Addressing, Classes & Subnet Masks',
        category: 'Addressing',
        durationMin: 25,
        level: 'Beginner',
        summary: '32-bit dotted-decimal structure, Class A/B/C/D/E legacy rules, RFC 1918 private ranges, and subnet masks.',
        keyConcepts: ['32-bit Address Space', 'Network vs Host Portions', 'Subnet Mask Bitwise AND', 'RFC 1918 Private Ranges'],
        whatIsIt: 'IPv4 provides unique logical 32-bit addresses for end-to-end routing across the global Internet. A subnet mask tells routers which bits identify the network and which identify the individual host.',
        howItWorks: 'A host performs a bitwise AND between its IP address and subnet mask. If (Dest IP & Mask) == (Source IP & Mask), the target is local (send ARP directly). If not, the target is remote (send to Default Gateway).',
        whyItMatters: 'Foundational for all Internet routing and enterprise address space design.',
        cliOrPacketExample: {
          title: 'Bitwise Subnetting AND Operation',
          content: `Host IP:      192.168.1.50   -> 11000000.10101000.00000001.00110010
Subnet Mask:  255.255.255.0  -> 11111111.11111111.11111111.00000000
---------------------------------------------------------------------
Network ID:   192.168.1.0    -> 11000000.10101000.00000001.00000000`
        },
        commonMistakes: [
          'Assigning the Network Address (all host bits 0) or Directed Broadcast Address (all host bits 1) to a PC.',
          'Using public IP addresses inside a private LAN without NAT.'
        ],
        examQuestions: [
          'List the RFC 1918 private IP address ranges for Class A, B, and C networks and explain why they are not routable on the public Internet.',
          'Given IP 172.16.45.10 with mask 255.255.240.0, find the Network ID, Broadcast Address, and number of usable host addresses.'
        ],
        visualizerLink: 'subnet',
        references: [
          { title: 'RFC 791 - Internet Protocol Specification', type: 'RFC' },
          { title: 'RFC 1918 - Address Allocation for Private Internets', type: 'RFC' }
        ]
      },
      {
        id: 'top-4-2',
        moduleId: 'mod-4',
        title: 'FLSM vs VLSM Subnetting Mastery',
        category: 'Subnetting',
        durationMin: 35,
        level: 'Intermediate',
        summary: 'Master Variable Length Subnet Masking (VLSM) to allocate customized prefixes without wasting precious IP space.',
        keyConcepts: ['Fixed Length Subnet Masking (FLSM)', 'Variable Length Subnet Masking (VLSM)', 'Power of 2 Host Math (2^h - 2)', 'Optimal Subnet Ordering'],
        whatIsIt: 'VLSM allows a network engineer to break a single subnet into sub-subnets of varying prefix lengths (/26, /27, /29, /30) matching exact departmental host counts.',
        howItWorks: '1. Sort host requirements from largest to smallest. 2. For each requirement, find minimal h such that 2^h - 2 >= hosts. 3. New prefix = 32 - h. 4. Block size = 2^h. 5. Allocate contiguous address blocks.',
        whyItMatters: 'Essential for conserving IPv4 addresses and required for all enterprise network design and CCNA certifications.',
        cliOrPacketExample: {
          title: 'VLSM Allocation Table Example for 192.168.1.0/24',
          content: `1. Dept A (100 hosts): Needs 2^7-2 = 126 hosts -> /25 (192.168.1.0/25). Range: .1 to .126.
2. Dept B (50 hosts):  Needs 2^6-2 = 62 hosts  -> /26 (192.168.1.128/26). Range: .129 to .190.
3. Dept C (20 hosts):  Needs 2^5-2 = 30 hosts  -> /27 (192.168.1.192/27). Range: .193 to .222.
4. WAN Link (2 hosts): Needs 2^2-2 = 2 hosts   -> /30 (192.168.1.224/30). Range: .225 to .226.`
        },
        commonMistakes: [
          'Allocating smaller subnets before larger subnets, resulting in fragmented address space that cannot accommodate larger blocks.',
          'Using a /31 subnet for point-to-point links on legacy routers without RFC 3021 support.'
        ],
        examQuestions: [
          'Given base network 200.100.50.0/24, design a VLSM scheme for subnets needing 60, 25, 12, and 2 hosts. List Network IDs, Subnet Masks, and Usable Ranges.',
          'Why does VLSM require classless routing protocols like OSPF or RIPv2 instead of RIPv1?'
        ],
        visualizerLink: 'subnet',
        references: [
          { title: 'RFC 1878 - Variable Length Subnet Table For IPv4', type: 'RFC' }
        ]
      },
      {
        id: 'top-4-3',
        moduleId: 'mod-4',
        title: 'Address Resolution Protocol (ARP) & ARP Cache',
        category: 'Routing',
        durationMin: 20,
        level: 'Intermediate',
        summary: 'How IPv4 dynamically discovers MAC addresses on the local link using broadcast requests and unicast replies.',
        keyConcepts: ['ARP Request (Broadcast)', 'ARP Reply (Unicast)', 'ARP Table / Cache', 'Gratuitous ARP & ARP Spoofing'],
        whatIsIt: 'ARP bridges Layer 3 (logical IPv4) and Layer 2 (physical MAC). Before sending an IP packet across an Ethernet link, the host must resolve the destination IP to its physical MAC address.',
        howItWorks: 'If the target MAC is not in the local ARP table, the host sends an ARP Request frame to destination FF:FF:FF:FF:FF:FF. The machine with that IP unicasts an ARP Reply back with its MAC. Both hosts cache the result.',
        whyItMatters: 'Without ARP, no device on an Ethernet LAN can transmit an IP packet because the Layer 2 header cannot be populated.',
        cliOrPacketExample: {
          title: 'Viewing the ARP Cache in Windows / Linux / Cisco',
          content: `C:\\> arp -a
Interface: 192.168.1.10 --- 0x2
  Internet Address      Physical Address      Type
  192.168.1.1           00-1a-2b-3c-4d-01     dynamic
  192.168.1.25          00-1a-2b-3c-4d-25     dynamic
  192.168.1.255         ff-ff-ff-ff-ff-ff     static`
        },
        commonMistakes: [
          'Expecting an ARP request to resolve an IP address located outside the local subnet. For remote IPs, a host ARPs for its Default Gateway!',
          'Overlooking ARP poisoning security vulnerabilities where malicious actors send fake gratuitous ARP replies.'
        ],
        examQuestions: [
          'Trace the step-by-step ARP resolution process when PC1 (192.168.1.10) sends a packet to PC2 (192.168.1.20) for the very first time.',
          'What is Proxy ARP and what security or architectural risks does it introduce?'
        ],
        visualizerLink: 'arp',
        labId: 'lab-2',
        references: [
          { title: 'RFC 826 - An Ethernet Address Resolution Protocol', type: 'RFC' }
        ]
      }
    ]
  },
  {
    id: 'mod-5',
    number: 5,
    title: 'Transport Layer & Reliability',
    description: 'TCP 3-way handshake, 4-way teardown, sliding window, flow control, congestion control, UDP datagrams, and port multiplexing.',
    iconName: 'Zap',
    topics: [
      {
        id: 'top-5-1',
        moduleId: 'mod-5',
        title: 'TCP 3-Way Handshake & Connection Teardown',
        category: 'Transport',
        durationMin: 25,
        level: 'Intermediate',
        summary: 'Master the SYN, SYN-ACK, ACK sequence number synchronization and FIN/ACK graceful connection closing states.',
        keyConcepts: ['Initial Sequence Numbers (ISNs)', 'SYN, ACK, FIN Flags', 'TCP State Machine', 'TIME_WAIT & 2MSL Timer'],
        whatIsIt: 'Transmission Control Protocol (TCP) provides reliable, ordered, error-checked, connection-oriented byte streams. The 3-way handshake initializes sequence numbers and negotiated options before data flows.',
        howItWorks: '1. Client sends SYN (Seq=X). State: SYN_SENT. 2. Server sends SYN-ACK (Seq=Y, Ack=X+1). State: SYN_RCVD. 3. Client sends ACK (Seq=X+1, Ack=Y+1). State: ESTABLISHED. For termination, either endpoint initiates FIN.',
        whyItMatters: 'Forms the backbone of the World Wide Web (HTTP/1.1, HTTP/2), email (SMTP/IMAP), file transfers, and remote management (SSH).',
        protocolDetails: {
          layer: 'Layer 4 - Transport',
          pdu: 'Segment',
          headers: ['Source Port (16b)', 'Dest Port (16b)', 'Sequence Number (32b)', 'Ack Number (32b)', 'Data Offset', 'Flags (URG,ACK,PSH,RST,SYN,FIN)', 'Window Size (16b)', 'Checksum', 'Urgent Pointer']
        },
        commonMistakes: [
          'Forgetting that SYN and FIN control flags consume 1 sequence number space even if payload length is 0.',
          'Not understanding why TIME_WAIT state exists (prevents delayed duplicate packets from a previous connection corrupting a new one).'
        ],
        examQuestions: [
          'Illustrate the TCP 3-way handshake with exact Sequence and Acknowledgement values where Client ISN = 400 and Server ISN = 900.',
          'Why does TCP connection termination require a 4-step exchange (FIN, ACK, FIN, ACK) instead of 3 steps?'
        ],
        visualizerLink: 'tcp',
        references: [
          { title: 'RFC 9293 - Transmission Control Protocol (TCP) Standard', type: 'RFC' }
        ]
      },
      {
        id: 'top-5-2',
        moduleId: 'mod-5',
        title: 'Flow Control & ARQ Protocols (Stop-and-Wait, GBN, SR)',
        category: 'Transport',
        durationMin: 30,
        level: 'Advanced',
        summary: 'Explore sliding window flow control, Go-Back-N cumulative acknowledgements, and Selective Repeat individual retransmissions.',
        keyConcepts: ['Stop-and-Wait ARQ', 'Go-Back-N (GBN)', 'Selective Repeat (SR)', 'Window Size Math: Ws + Wr <= 2^m'],
        whatIsIt: 'Automatic Repeat reQuest (ARQ) error and flow control protocols ensure data is delivered reliably across noisy channels without overwhelming the receiver buffer.',
        howItWorks: 'In Go-Back-N, the sender can transmit up to N unacknowledged frames. If a timeout occurs for frame k, the sender retransmits ALL frames from k up to the current window. In Selective Repeat, the receiver has a buffer and only the lost frame is retransmitted.',
        whyItMatters: 'Maximizes link utilization while preventing buffer overflow on mobile and low-power devices.',
        commonMistakes: [
          'Confusing Flow Control (protecting the receiver from being overwhelmed via advertised window) with Congestion Control (protecting the network from bottleneck collapse).',
          'Setting window size in GBN equal to 2^m instead of 2^m - 1, causing ambiguous acknowledgements.'
        ],
        examQuestions: [
          'For a 3-bit sequence number space (m=3), determine the maximum sender window size for Go-Back-N and Selective Repeat.',
          'Compare the efficiency of Stop-and-Wait ARQ vs Sliding Window protocol in high Bandwidth-Delay Product (BDP) satellite links.'
        ],
        visualizerLink: 'flow-control',
        references: [
          { title: 'Kurose & Ross - Computer Networking Ch 3 Transport Layer Flow Control', type: 'Guide' }
        ]
      }
    ]
  },
  {
    id: 'mod-6',
    number: 6,
    title: 'Application Layer & Key Protocols',
    description: 'HTTP/HTTPS, DNS resolution, DHCP DORA exchange, FTP, SMTP, SSH, Telnet, and SNMP.',
    iconName: 'Globe',
    topics: [
      {
        id: 'top-6-1',
        moduleId: 'mod-6',
        title: 'Domain Name System (DNS) & Recursive Resolution',
        category: 'Application',
        durationMin: 25,
        level: 'Beginner',
        summary: 'How domain names (e.g. www.example.com) are converted into IP addresses across Root, TLD, and Authoritative nameservers.',
        keyConcepts: ['Root Nameservers (.)', 'Top-Level Domain (TLD) Servers', 'Authoritative Nameservers', 'DNS Record Types (A, AAAA, CNAME, MX)'],
        whatIsIt: 'DNS is the distributed hierarchical database of the Internet that maps human-readable domain names to machine-routable IP addresses.',
        howItWorks: '1. Client queries Local Recursive Resolver. 2. Resolver checks local cache. 3. If cache miss: Resolver queries Root Server (.) -> returns .com TLD server. 4. Queries .com TLD -> returns Authoritative Server. 5. Queries Authoritative -> returns IP (A record). 6. Resolver caches and returns IP to client.',
        whyItMatters: 'Every modern Internet transaction begins with a DNS lookup. DNS latency directly impacts user perceived page load speed.',
        protocolDetails: {
          layer: 'Layer 7 - Application',
          pdu: 'Message',
          ports: 'UDP 53 (Queries), TCP 53 (Zone Transfers >512B)'
        },
        commonMistakes: [
          'Believing DNS only runs over UDP. Zone transfers and responses exceeding 512 bytes (or EDNS0 limits) use TCP port 53.',
          'Forgetting that DNS cache TTL (Time To Live) dictates how long stale records remain cached across resolvers.'
        ],
        examQuestions: [
          'Trace the complete step-by-step resolution process when a user types "www.google.com" with a cold DNS cache.',
          'Explain the difference between recursive and iterative DNS queries with a clear message sequence diagram.'
        ],
        visualizerLink: 'dhcp-dns',
        labId: 'lab-4',
        references: [
          { title: 'RFC 1034 - Domain Names - Concepts and Facilities', type: 'RFC' },
          { title: 'RFC 1035 - Domain Names - Implementation and Specification', type: 'RFC' }
        ]
      },
      {
        id: 'top-6-2',
        moduleId: 'mod-6',
        title: 'Dynamic Host Configuration Protocol (DHCP) & DORA Process',
        category: 'Application',
        durationMin: 20,
        level: 'Intermediate',
        summary: 'Automatic IP address assignment via the 4-step DORA handshake: Discover, Offer, Request, and Acknowledgment.',
        keyConcepts: ['DHCP Discover (Broadcast)', 'DHCP Offer (Unicast/Broadcast)', 'DHCP Request', 'DHCP ACK & Lease Timers'],
        whatIsIt: 'DHCP automates network configuration for devices by leasing IP addresses, subnet masks, default gateways, and DNS server IPs dynamically.',
        howItWorks: '1. DISCOVER: Client has no IP (0.0.0.0), broadcasts to 255.255.255.255 on UDP 67. 2. OFFER: DHCP server proposes an IP configuration. 3. REQUEST: Client formally requests that offered IP. 4. ACK: Server confirms lease and timers (T1=50%, T2=87.5%).',
        whyItMatters: 'Eliminates manual IP configuration errors and IP address conflicts in large corporate offices, universities, and public Wi-Fi.',
        protocolDetails: {
          layer: 'Layer 7 - Application',
          pdu: 'Message',
          ports: 'UDP 67 (Server), UDP 68 (Client)'
        },
        commonMistakes: [
          'Assuming a PC with DHCP enabled will retain its IP forever. If lease renewal fails at T1 and T2, the IP is released.',
          'Overlooking Rogue DHCP servers that distribute incorrect gateways for Man-In-The-Middle attacks.'
        ],
        examQuestions: [
          'Illustrate the 4-way DHCP DORA exchange specifying source/destination IP and port numbers for each packet.',
          'What is APIPA (Automatic Private IP Addressing, 169.254.x.x) and what does it indicate when seen on a workstation?'
        ],
        visualizerLink: 'dhcp-dns',
        labId: 'lab-4',
        references: [
          { title: 'RFC 2131 - Dynamic Host Configuration Protocol', type: 'RFC' }
        ]
      }
    ]
  },
  {
    id: 'mod-7',
    number: 7,
    title: 'Network Security & Firewalls',
    description: 'Packet filtering, Access Control Lists (ACLs), Stateful vs Stateless firewalls, Network Address Translation (NAT), and common attacks.',
    iconName: 'Shield',
    topics: [
      {
        id: 'top-7-1',
        moduleId: 'mod-7',
        title: 'Access Control Lists (ACLs) & Packet Filtering',
        category: 'Security',
        durationMin: 25,
        level: 'Intermediate',
        summary: 'Standard vs Extended ACLs, wildcard masks, packet inspection, and implicit deny all rules.',
        keyConcepts: ['Standard ACL (1-99) Source Only', 'Extended ACL (100-199) Source/Dest/Port', 'Wildcard Mask Bit Inversion', 'Implicit Deny All'],
        whatIsIt: 'An Access Control List (ACL) is a sequential collection of permit or deny statements applied to router interfaces to filter inbound or outbound traffic.',
        howItWorks: 'Routers evaluate packets top-to-bottom against each line. As soon as a match is found, the action (permit/deny) is executed and evaluation terminates. If no rule matches, the packet hits the invisible "implicit deny all" at the bottom.',
        whyItMatters: 'First line of defense in perimeter routers to block unauthorized subnets and protect internal enterprise servers.',
        cliOrPacketExample: {
          title: 'Configuring Extended ACL to Block Telnet but Allow HTTP',
          content: `Router(config)# access-list 101 deny tcp any host 192.168.1.10 eq 23
Router(config)# access-list 101 permit tcp any host 192.168.1.10 eq 80
Router(config)# access-list 101 permit ip any any
Router(config)# interface GigabitEthernet 0/1
Router(config-if)# ip access-group 101 in`
        },
        commonMistakes: [
          'Forgetting the "implicit deny any" at the end of every ACL, accidentally blocking all other legitimate traffic.',
          'Applying Standard ACLs close to the source (which blocks the host from reaching everywhere) instead of close to the destination.'
        ],
        examQuestions: [
          'Explain the difference between Standard and Extended IPv4 Access Control Lists with Cisco syntax examples.',
          'Calculate the wildcard mask for subnet 192.168.16.0/20 and show how it matches packets.'
        ],
        references: [
          { title: 'Cisco IOS Security Configuration Guide: Access Control Lists', type: 'Doc' }
        ]
      }
    ]
  }
];
