import { UnitSection } from '../../types/syllabus';

export const UNIT_1_DATA: UnitSection = {
  id: 'unit-1',
  unitNumber: 1,
  title: 'Unit 1: Introduction to Networks',
  subtitle: 'Network Types (LAN/MAN/PAN/WAN), Topologies (Bus, Star, Ring, Mesh, Hybrid), Switching, OSI & TCP/IP Models, Physical Layer Overview, Delay Metrics, Guided & Unguided Media',
  iconName: 'Network',
  topics: [
    {
      id: 'u1-t1',
      title: 'Network Types: LAN, MAN, PAN, WAN',
      description: 'Classification of computer networks according to geographic scale, ownership, data rate, and latency characteristics.',
      keyPoints: [
        'PAN (Personal Area Network): Covers a personal workspace radius of ~1 to 10 meters. Uses Bluetooth (IEEE 802.15.1), Zigbee, or USB. Data rates: 1 to 3 Mbps. Low power, personal device interconnection.',
        'LAN (Local Area Network): Spans a room, office floor, or university building (up to 1-2 km). Privately owned, high data rate (100 Mbps to 10 Gbps Ethernet IEEE 802.3, Wi-Fi IEEE 802.11ax), very low latency and low bit-error rate.',
        'MAN (Metropolitan Area Network): Spans an entire city or large municipal zone (up to 50 km). Examples: Cable TV broadband distributions, citywide WiMAX (IEEE 802.16), and municipal optical backbones.',
        'WAN (Wide Area Network): Interconnects nations, continents, or the entire globe. Employs telecom carrier leased lines, fiber backbones, and satellite relays. High latency, lower data rate relative to distance. The Internet is the premier public WAN.',
        'Associated Lab: Lab 1 (Introduction to Packet Tracer, Peer to Peer communication, study of cables and its colour codes).'
      ],
      examTips: 'Exam Comparison: Tabulate PAN, LAN, MAN, WAN based on: 1. Geographic span 2. Speed/Bandwidth 3. Bit error rate 4. Ownership (Private vs Telecom carrier) 5. Typical technologies.',
      diagramOrSnippet: `NETWORK SCOPE HIERARCHY:
[ PAN: ~10m ] ──► [ LAN: ~1km ] ──► [ MAN: ~50km ] ──► [ WAN: Global ]
(Bluetooth/USB)    (Ethernet/Wi-Fi)   (Cable TV/WiMAX)   (The Internet)`,
      vivaQuestions: [
        { q: 'What is the largest real-world example of a Wide Area Network (WAN)?', a: 'The global Internet, which interconnects millions of disparate networks worldwide.' },
        { q: 'Which network type provides the lowest latency and bit-error rate?', a: 'Local Area Network (LAN), due to short physical copper/fiber spans and structured cabling.' }
      ],
      references: [
        { title: 'GeeksforGeeks - Computer Network Tutorial', url: 'https://www.geeksforgeeks.org/computer-network-tutorial/', type: 'Guide', source: 'GeeksforGeeks' },
        { title: 'YouTube - Neso Academy Computer Networks', url: 'https://www.youtube.com/playlist?list=PLBlnK6fEyqRgMCUAG0XRw78UA8qnv6jEx', type: 'Video', source: 'YouTube' }
      ]
    },
    {
      id: 'u1-t2',
      title: 'Network Topology: BUS, STAR, RING, MESH, HYBRID',
      description: 'Physical and logical layout configurations connecting computers, switches, and transmission links.',
      keyPoints: [
        'Mesh Topology: Every node has a dedicated point-to-point physical connection to every other node. Total links = n(n - 1) / 2 for n nodes. Total I/O ports per device = n - 1. Pros: Maximum redundancy, dedicated bandwidth, no traffic contention. Cons: High cabling cost, difficult installation.',
        'Star Topology: All devices connect to a central controller (Hub or Switch). Total physical links = n. Pros: Inexpensive, easy to install and reconfigure, single link failure does not affect the rest. Cons: Central switch is a Single Point of Failure (SPOF).',
        'Bus Topology: All devices tap into a single shared backbone cable terminated at both ends with 50-ohm terminators to prevent signal reflection. Cons: Backbone cable break collapses entire network; difficult fault isolation.',
        'Ring Topology: Each device is connected directly to its two immediate neighbors in an unbroken circular loop. Data circulates unidirectionally via circulating tokens (IEEE 802.5). A single link break stops transmission unless dual counter-rotating rings are utilized.',
        'Hybrid Topology: Combination of two or more distinct topologies (e.g., Star-Bus or Star-Ring) used in modern enterprise building and campus backbones.',
        'Associated Lab: Lab 2 (Implementation of Network Topologies in Cisco Packet Tracer).'
      ],
      examTips: 'Full Marks Calculation: For Mesh topology with n devices: Links = n(n-1)/2. For n=8 devices: 8(7)/2 = 28 cables and 7 ports per device. For Star: n links.',
      diagramOrSnippet: `MESH (n=4): Links = 4(3)/2 = 6       STAR (Central Switch): Links = 4
     [A]───────[B]                         [A]     [B]
      │ ╲     ╱ │                            ╲   ╱
      │   ╲ ╱   │                          [ SWITCH ]
      │   ╱ ╲   │                            ╱   ╲
     [D]───────[C]                         [D]     [C]`,
      vivaQuestions: [
        { q: 'How many physical cables are required to connect 10 computers in a full mesh?', a: 'Using n(n-1)/2 = 10(9)/2 = 45 cables.' },
        { q: 'Why are bus terminators required at the cable ends in Bus topology?', a: 'To absorb electrical signal energy and eliminate signal reflection waves that cause frame collisions.' }
      ],
      references: [
        { title: 'GeeksforGeeks - Types of Network Topology', url: 'https://www.geeksforgeeks.org/types-of-network-topology/', type: 'Guide', source: 'GeeksforGeeks' },
        { title: 'GeeksforGeeks - Network Devices (Hub, Switch, Router & Gateway)', url: 'https://www.geeksforgeeks.org/network-devices-hub-switch-router-gateway/', type: 'Guide', source: 'GeeksforGeeks' }
      ]
    },
    {
      id: 'u1-t3',
      title: 'Switching: Circuit Switching vs Packet Switching',
      description: 'Methods for transporting data through intermediate nodes across large interconnected networks.',
      keyPoints: [
        'Circuit Switching: Dedicated physical end-to-end communication channel established before transmission begins (3 phases: Connection Setup -> Data Transfer -> Circuit Teardown). Bandwidth is reserved and guaranteed. E.g., Traditional PSTN telephone networks. Drawback: Idle periods waste allocated channel capacity.',
        'Packet Switching: Data stream is divided into discrete packets containing payload and headers. Dynamic routing switches forward packets hop-by-hop without reserving dedicated lines.',
        '1. Datagram Approach (Connectionless): Each packet is treated independently; packets may traverse different routes and arrive out-of-order (Internet IP routing).',
        '2. Virtual Circuit Approach (Connection-Oriented): Pre-plans a logical path (VCI) before data transfer; all packets follow the same route sequentially without dedicated hardware reservation (ATM, MPLS).'
      ],
      examTips: 'Exam Comparison Table: Tabulate Circuit Switching vs Packet Switching on: 1. Bandwidth reservation (Dedicated vs Statistical multiplexing) 2. Setup delay 3. Resource utilization 4. Failure resilience 5. Store-and-forward delay.',
      diagramOrSnippet: `CIRCUIT vs PACKET SWITCHING:
Circuit: [Sender] ═══════(Dedicated Reserved Circuit)═══════► [Receiver]
Packet:  [Sender] ──► [Pkt 1 via Path A] ──► [Packet Switches] ──► [Receiver]
                  ──► [Pkt 2 via Path B] ──► (Dynamic statistical multiplexing)`,
      vivaQuestions: [
        { q: 'What is statistical multiplexing in packet switching?', a: 'Dynamic on-demand allocation of channel bandwidth only when packets are actively being transmitted.' },
        { q: 'Why is packet switching superior for computer data traffic?', a: 'Computer data is bursty; packet switching maximizes channel utilization by dynamically sharing links.' }
      ]
    },
    {
      id: 'u1-t4',
      title: 'OSI Layered Architecture & TCP/IP Model',
      description: 'Layered reference models standardizing network communication functions through hierarchical abstraction.',
      keyPoints: [
        'OSI 7 Layers (Bottom to Top):',
        '1. Physical: Raw bit transmission, electrical voltages, line coding, bit sync. PDU: Bits.',
        '2. Data Link: Hop-to-hop physical delivery, MAC addressing, framing, error detection (CRC). PDU: Frame.',
        '3. Network: Host-to-host delivery, logical addressing (IPv4/IPv6), path routing. PDU: Packet.',
        '4. Transport: End-to-end process-to-process delivery, port addressing, segmentation, flow/congestion control. PDU: Segment / Datagram.',
        '5. Session: Dialog management, checkpointing, session synchronization. PDU: Data.',
        '6. Presentation: Data syntax translation, compression, encryption/decryption (SSL/TLS). PDU: Formatted Data.',
        '7. Application: User network interface, protocols HTTP, DNS, DHCP, FTP, SMTP. PDU: Message.',
        'TCP/IP 5-Layer Suite: Practical operational model: Application (combines OSI 5, 6, 7), Transport (TCP/UDP), Internet (IP, ICMP, ARP), Data Link, Physical.'
      ],
      examTips: 'Mnemonic: "Please Do Not Throw Sausage Pizza Away" (Physical, Data Link, Network, Transport, Session, Presentation, Application). State exact PDU for each layer.',
      diagramOrSnippet: `OSI 7 LAYERS                         TCP/IP 5 LAYERS
[7. Application ] ──┐
[6. Presentation] ──┼───────────────► [ Application Layer  ] (HTTP, DNS)
[5. Session     ] ──┘
[4. Transport   ] ──────────────────► [ Transport Layer    ] (TCP, UDP)
[3. Network     ] ──────────────────► [ Internet / Network ] (IPv4, IPv6)
[2. Data Link   ] ──────────────────► [ Data Link Layer    ] (Ethernet)
[1. Physical    ] ──────────────────► [ Physical Layer     ] (Bits/Signals)`,
      vivaQuestions: [
        { q: 'Which layer is responsible for process-to-process communication?', a: 'Transport Layer (Layer 4), using TCP/UDP port numbers.' },
        { q: 'What is the PDU of Layer 2 and Layer 3?', a: 'Layer 2 PDU is Frame; Layer 3 PDU is Packet.' }
      ]
    },
    {
      id: 'u1-t5',
      title: 'Physical Layer Overview: Latency, Bandwidth & Delay Metrics',
      description: 'Physical transmission constraints, bandwidth capacity, propagation delay, transmission delay, and queuing.',
      keyPoints: [
        'Bandwidth: Maximum transmission capacity of a channel measured in bits per second (bps, Mbps, Gbps).',
        'Latency (Total Delay): Sum of four constituent delays: Total Delay = T_trans + T_prop + T_queue + T_proc.',
        '1. Transmission Delay (T_trans): Time required to push all packet bits onto the physical medium: T_trans = L / R (L = packet length in bits, R = transmission rate in bps).',
        '2. Propagation Delay (T_prop): Time taken for one bit to travel physically across the distance: T_prop = d / s (d = distance in meters, s = signal velocity, ~2 * 10^8 m/s in copper/fiber).',
        '3. Queuing Delay (T_queue): Time spent waiting in intermediate router input/output queues before processing.',
        '4. Processing Delay (T_proc): Time needed by router CPU to inspect packet header, calculate checksum, and lookup routing table.',
        'Bandwidth-Delay Product (BDP): BDP = Bandwidth * Round-Trip Time (RTT). Represents maximum volume of unacknowledged bits in flight.'
      ],
      examTips: 'Numerical: Packet L = 1000 Bytes (8000 bits), Bandwidth R = 10 Mbps (10^7 bps), Distance d = 1000 km, Speed s = 2 * 10^8 m/s. T_trans = 8000 / 10^7 = 0.8 ms. T_prop = 10^6 / (2 * 10^8) = 5 ms.',
      diagramOrSnippet: `DELAY COMPONENTS BREAKDOWN:
[Host A] ──(T_trans = L/R)──► [Wire] ──(T_prop = d/s)──► [Router Buffer]
                                                         (T_queue + T_proc)`,
      vivaQuestions: [
        { q: 'What is the difference between transmission delay and propagation delay?', a: 'Transmission delay depends on packet length and bandwidth (L/R); propagation delay depends on distance and wave velocity (d/s).' },
        { q: 'What does Bandwidth-Delay Product (BDP) measure?', a: 'The maximum capacity of bits that can fill the transmission pipe in transit simultaneously.' }
      ]
    },
    {
      id: 'u1-t6',
      title: 'Guided Media: Twisted Pair, Coaxial Cable & Fiber Optic Cable',
      description: 'Solid transmission media that guide electromagnetic signals through physical conduits.',
      keyPoints: [
        'Twisted Pair: Pairs of insulated copper conductors twisted in a helical spiral to cancel electromagnetic interference (EMI) and crosstalk.',
        '• UTP (Unshielded Twisted Pair): Cat5e (1 Gbps), Cat6 (10 Gbps up to 55m), Cat6a (10 Gbps up to 100m). Max segment = 100m. Terminated by RJ-45.',
        '• STP (Shielded Twisted Pair): Individual foil shielding per pair plus outer braided shield for high-noise industrial facilities.',
        'Coaxial Cable: Central copper core, insulating dielectric, braided metal shield, and outer protective jacket. High bandwidth and noise resistance. Types: 50Ω Thinnet (10BASE2, RG-58) and Thicknet (10BASE5); 75Ω (RG-6 for Cable TV/Broadband). BNC connectors.',
        'Fiber Optic Cable: Guides pulses of light through an ultra-pure glass or plastic core using Total Internal Reflection (TIR). 100% immune to EMI, non-conductive, supports 100+ Gbps over tens of kilometers.',
        '• Single-Mode Fiber (SMF): Narrow core (8-10 µm), laser light source, single straight beam, minimal modal dispersion, long-haul WAN (>10-80 km).',
        '• Multi-Mode Fiber (MMF): Wider core (50-62.5 µm), LED source, light rays bounce at varying angles, campus LAN backbone (up to 550m).',
        'Associated Labs: Lab 1 (Cables and colour codes: T568A and T568B pinouts) and Lab 3 (Router Configuration: Creating Passwords, Configuring Interfaces).'
      ],
      examTips: 'Exam Comparison Table: Compare Twisted Pair, Coaxial, and Fiber Optic on: 1. Core material (Copper vs Glass) 2. Signal form (Electrical vs Optical) 3. Maximum segment reach 4. EMI noise immunity 5. Cost & installation ease.',
      diagramOrSnippet: `FIBER OPTIC TOTAL INTERNAL REFLECTION (TIR):
       Cladding (Lower Refractive Index n2)
────────────────────────────────────────────────────
   Core (Higher Refractive Index n1)   ╱╲    ╱╲  (Light pulse bounces)
══════════════════════════════════════╱══╲══╱══╲════
────────────────────────────────────────────────────
       Cladding (n2)   [Condition: Angle > Critical Angle]`,
      vivaQuestions: [
        { q: 'Why are wire pairs twisted around each other in UTP cables?', a: 'To cancel out electromagnetic interference (EMI) and crosstalk from adjacent wire pairs.' },
        { q: 'What is the color code standard used for standard straight-through Ethernet cables?', a: 'EIA/TIA 568B: White-Orange, Orange, White-Green, Blue, White-Blue, Green, White-Brown, Brown.' }
      ]
    },
    {
      id: 'u1-t7',
      title: 'Unguided Media: Radio Waves, Microwaves & Infrared',
      description: 'Wireless electromagnetic signal propagation through air, vacuum, or water without physical conductors.',
      keyPoints: [
        'Radio Waves (3 kHz to 1 GHz):',
        '• Omnidirectional propagation: Emitted in all directions from the transmitter antenna; receiver does not require line-of-sight alignment.',
        '• Modes: Ground-wave propagation (< 2 MHz, follows earth curvature), Sky-wave propagation (2-30 MHz, reflects off ionosphere for shortwave radio).',
        '• Applications: AM/FM radio, broadcast television, cordless phones, cellular networks. Susceptible to interference.',
        'Microwaves (1 GHz to 300 GHz):',
        '• Directional propagation: Requires line-of-sight (LOS) parabolic dish antennas focused directly at each other.',
        '• Terrestrial Microwave: Tower-to-tower relays placed 30-50 km apart to accommodate Earth curvature.',
        '• Satellite Microwave: Relays signals between Earth ground stations and geostationary (GEO at 35,786 km), MEO, or LEO constellations.',
        '• Applications: Wi-Fi (2.4/5/6 GHz), 4G/5G mobile, radar, satellite backbones.',
        'Infrared Waves (300 GHz to 400 THz):',
        '• Short-range, line-of-sight communication. Cannot penetrate solid walls, ensuring high physical privacy and preventing eavesdropping.',
        '• Applications: TV remote controls, IrDA device synchronizers, wireless peripherals. Blocked by outdoor sunlight.'
      ],
      examTips: 'Write distinct sections for Radio Waves (Omnidirectional), Microwaves (Directional Line-of-sight), and Infrared (Short-range, cannot pass through walls).',
      diagramOrSnippet: `ELECTROMAGNETIC SPECTRUM:
3 kHz                1 GHz               300 GHz              400 THz
  ├── Radio Waves ─────┼─── Microwaves ────┼──── Infrared ──────┤
  (Omnidirectional)    (Directional LOS)   (Short-range, no walls)`,
      vivaQuestions: [
        { q: 'Why cannot infrared signals be used for outdoor WAN communications?', a: 'Infrared signals are absorbed by atmospheric moisture and completely blinded by outdoor sunlight.' },
        { q: 'Why are terrestrial microwave relay towers positioned approximately 40 to 50 km apart?', a: 'Due to the curvature of the Earth blocking the direct line-of-sight propagation path.' }
      ]
    }
  ]
};
