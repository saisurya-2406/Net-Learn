import { UnitSection } from '../../types/syllabus';

export const UNIT_3_DATA: UnitSection = {
  id: 'unit-3',
  unitNumber: 3,
  title: 'Unit 3: Routing',
  subtitle: 'Forwarding of IP Packets, Static & Default Routing, Unicast Routing Algorithms (Distance Vector, Link State, Path Vector), Protocols (RIP V1, RIP V2, OSPF, BGP, EIGRP), Multicasting & IPv6',
  iconName: 'Compass',
  topics: [
    {
      id: 'u3-t1',
      title: 'Forwarding of IP Packets, Static and Default Routing',
      description: 'Host-to-host packet delivery mechanics, data plane lookups, manual route configuration, and gateway of last resort.',
      keyPoints: [
        'Forwarding Process: Hop-by-hop packet switching where the router examines destination IP, performs longest-prefix match in the Forwarding Information Base (FIB/TCAM), decrements TTL by 1, updates IP checksum, rewrites Layer 2 MAC addresses, and transmits out the exit interface.',
        'Static Routing: Manually configured routes in the router table. Total administrative control, zero CPU overhead, no bandwidth consumed by update advertisements. Syntax: `ip route <network> <mask> <next-hop-ip | exit-interface>`. Administrative Distance = 1.',
        'Default Routing (Gateway of Last Resort): Special static route `0.0.0.0 0.0.0.0 <next-hop-ip>` matching all packets for which no specific route exists in the routing table (e.g., routing traffic towards the ISP).',
        'Administrative Distance (AD) Ranking: Directly Connected: 0 | Static: 1 | EBGP: 20 | EIGRP: 90 | OSPF: 110 | RIP: 120 | IBGP: 200.',
        'Associated Lab: Lab 5 (Static and Default Routing).'
      ],
      examTips: 'Cisco CLI Syntax in Exams: Static Route: `Router(config)# ip route 192.168.2.0 255.255.255.0 10.0.0.2`. Default Route: `Router(config)# ip route 0.0.0.0 0.0.0.0 10.0.0.2`. Verify: `show ip route`.',
      diagramOrSnippet: `STATIC vs DEFAULT ROUTING:
[ LAN 1: 192.168.1.0/24 ] ──► [ Router 1 ] ═══(WAN: 10.0.0.0/30)═══► [ Router 2 ] ──► [ LAN 2: 192.168.2.0/24 ]
R1 Static Route: ip route 192.168.2.0 255.255.255.0 10.0.0.2
R1 Default Route to Internet: ip route 0.0.0.0 0.0.0.0 10.0.0.2`,
      vivaQuestions: [
        { q: 'What is Administrative Distance in Cisco IOS?', a: 'A rating of route trustworthiness from 0 to 255; when multiple protocols learn the same route, the one with the lowest AD is installed in the routing table.' },
        { q: 'What destination IP and mask represent a default route in IPv4?', a: '0.0.0.0 with mask 0.0.0.0 (quad-zero).' }
      ]
    },
    {
      id: 'u3-t2',
      title: 'Unicast Routing Algorithms: Distance Vector, Link State & Path Vector',
      description: 'The three foundational mathematical graph pathfinding paradigms for dynamic routing.',
      keyPoints: [
        '1. Distance Vector Routing (Bellman-Ford Algorithm):',
        '• Routers periodically share their entire routing table only with directly connected neighbors (e.g., RIP every 30s).',
        '• Metric: Hop count. Bellman-Ford equation: D_x(y) = min_v { c(x,v) + D_v(y) }.',
        '• Routing by rumor: Routers do not possess a map of the entire network topology.',
        '• Count-to-Infinity Problem: Caused by slow propagation of link failures. Solved via: Split Horizon (do not advertise a route back out the interface it was learned from), Poison Reverse (advertise dead route with metric 16 / infinity), and Holddown Timers.',
        '2. Link State Routing (Dijkstra’s SPF Algorithm):',
        '• Routers flood Link-State Advertisements (LSAs) containing the state/cost of local links to ALL routers in the area.',
        '• Every router constructs an identical Link-State Database (LSDB) representing the complete network topological graph.',
        '• Each router independently executes Dijkstra\'s algorithm to compute the Shortest Path Tree with itself as the root.',
        '• Fast convergence, zero loops, supports hierarchical areas (OSPF). Higher CPU/memory overhead.',
        '3. Path Vector Routing (BGP):',
        '• Advertises complete AS-Path (sequence of Autonomous System numbers traversed).',
        '• Eliminates inter-domain loops: If a router receives an update containing its own AS number, it drops the route immediately.'
      ],
      examTips: 'Exam Comparison Table: Distance Vector vs Link State vs Path Vector on: 1. Algorithm (Bellman-Ford vs Dijkstra vs BGP Path Vector) 2. Network view (Neighbor rumors vs Full LSDB topology map vs AS sequence) 3. Convergence time 4. Loop prevention 5. Protocol examples (RIP vs OSPF vs BGP).',
      diagramOrSnippet: `ALGORITHM PARADIGMS:
Distance Vector: [R1] ──"My routing table"──► [R2] (Neighbor to neighbor only)
Link State:      [R1] ════(LSA Flooding to ALL routers)════► [Every Router has full map]
Path Vector:     [AS 100] ──[AS-Path: 100, 200, 300]──► [AS 400] (Loop-free AS trail)`,
      vivaQuestions: [
        { q: 'What causes the Count-to-Infinity problem in distance-vector routing?', a: 'Slow propagation of link failure information leading to mutual routing loops where neighboring routers increment hop counts to infinity.' },
        { q: 'Which algorithm is executed by OSPF to compute the shortest path tree?', a: 'Dijkstra’s Shortest Path First (SPF) algorithm.' }
      ],
      references: [
        { title: 'GeeksforGeeks - Routing Algorithms', url: 'https://www.geeksforgeeks.org/what-is-routing/', type: 'Guide', source: 'GeeksforGeeks' },
        { title: 'GeeksforGeeks - What is Routing?', url: 'https://www.geeksforgeeks.org/what-is-routing/', type: 'Guide', source: 'GeeksforGeeks' }
      ]
    },
    {
      id: 'u3-t3',
      title: 'Routing Protocols: RIP V1, RIP V2, OSPF, BGP & EIGRP',
      description: 'Standard dynamic interior and exterior gateway routing protocol implementations, metrics, and CLI configurations.',
      keyPoints: [
        'RIP Version 1 (RFC 1058): Distance-vector IGP. Classful (does NOT carry subnet masks in updates; no VLSM). Broadcasts updates to 255.255.255.255 every 30s. Metric: Hop count (Max 15; 16 = infinity). No authentication.',
        'RIP Version 2 (RFC 2453): Classless distance-vector IGP (carries subnet masks, supports CIDR & VLSM). Multicasts updates to 224.0.0.9. Supports plaintext and MD5 authentication. Disables auto-summary with `no auto-summary`.',
        'OSPF (Open Shortest Path First - RFC 2328): Link-state IGP using Dijkstra. Metric: Cost = 10^8 / Bandwidth in bps. 2-Level Area hierarchy: Area 0 (Backbone Area). DR/BDR election on broadcast networks (224.0.0.5 and 224.0.0.6). Wildcard masks in network statements.',
        'EIGRP (Enhanced Interior Gateway Routing Protocol): Cisco advanced distance-vector protocol using DUAL finite state machine. Guaranteed 100% loop-free. Metric based on Bandwidth and Delay. Feasibility Condition: Reported Distance (RD) < Feasible Distance (FD). AD: 90.',
        'BGP (Border Gateway Protocol - BGP-4 RFC 4271): De facto Path-Vector exterior protocol routing the global Internet between Autonomous Systems. Peering over TCP Port 179.',
        'Associated Labs: Lab 7 (RIP v1), Lab 8 (RIP v2), Lab 9 (Single Area OSPF), Lab 10 (Multi Area OSPF), Lab 13 (BGP), Lab 14 (EIGRP).'
      ],
      examTips: 'Cisco CLI Syntax in Exams:',
      diagramOrSnippet: `CISCO IOS ROUTING PROTOCOL COMMAND CHEAT SHEET:
RIPv2:   Router(config)# router rip
         Router(config-router)# version 2
         Router(config-router)# no auto-summary
         Router(config-router)# network 192.168.1.0

OSPF:    Router(config)# router ospf 1
         Router(config-router)# network 192.168.1.0 0.0.0.255 area 0 (Wildcard mask!)

EIGRP:   Router(config)# router eigrp 100
         Router(config-router)# no auto-summary
         Router(config-router)# network 192.168.1.0 0.0.0.255`,
      vivaQuestions: [
        { q: 'What is the fundamental difference between RIPv1 and RIPv2?', a: 'RIPv1 is classful and broadcasts without subnet masks; RIPv2 is classless, supports VLSM/CIDR, and multicasts to 224.0.0.9.' },
        { q: 'What wildcard mask corresponds to subnet mask 255.255.255.240 in OSPF?', a: '0.0.0.15 (obtained by subtracting 255.255.255.255 - 255.255.255.240).' }
      ]
    },
    {
      id: 'u3-t4',
      title: 'Multicasting Basics & IPv6 Addressing Basics',
      description: 'One-to-many communication principles and the 128-bit next-generation Internet Protocol.',
      keyPoints: [
        'Multicasting Basics:',
        '• One-to-many delivery where packets are sent once from source and duplicated by routers only at branch points.',
        '• Multicast IP Range: Class D `224.0.0.0 to 239.255.255.255`.',
        '• Protocols: IGMP (Internet Group Management Protocol) between hosts and local router; PIM (Protocol Independent Multicast) between routers.',
        'IPv6 Addressing Basics (RFC 8200):',
        '• 128 bits represented as 8 hexadecimal groups of 16 bits separated by colons (e.g., 2001:0db8:85a3:0000:0000:8a2e:0370:7334).',
        '• Zero Compression Rules: 1. Omit leading zeros in any 16-bit block (0042 -> 42, 0000 -> 0). 2. Double Colon `::` replaces one contiguous sequence of all-zero blocks (used only once per address).',
        '• Address Types: Global Unicast (`2000::/3`), Link-Local (`FE80::/10`), Loopback (`::1/128`), Multicast (`FF00::/8`). NO broadcast in IPv6!'
      ],
      examTips: 'Exam Compression Question: Compress `2001:0db8:0000:0000:0000:0000:1428:57ab`. Step 1: Remove leading zeros: `2001:db8:0:0:0:0:1428:57ab`. Step 2: Apply double colon: `2001:db8::1428:57ab`.',
      diagramOrSnippet: `IPv6 128-BIT GLOBAL UNICAST STRUCTURE:
[ 48 bits Global Routing Prefix ] [ 16 bits Subnet ID ] [ 64 bits Interface ID (Host) ]
                                 └─ Total 64-bit Net ─┘ └─ EUI-64 / MAC Derived ──┘`,
      vivaQuestions: [
        { q: 'Why are broadcast addresses absent in IPv6?', a: 'IPv6 replaces broadcast with Solicited-Node Multicast and Anycast to avoid waking up every NIC on the LAN segment.' },
        { q: 'What is the prefix for IPv6 Link-Local addresses?', a: 'FE80::/10.' }
      ]
    }
  ]
};
