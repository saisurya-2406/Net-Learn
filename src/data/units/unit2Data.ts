import { UnitSection } from '../../types/syllabus';

export const UNIT_2_DATA: UnitSection = {
  id: 'unit-2',
  unitNumber: 2,
  title: 'Unit 2: Addressing',
  subtitle: 'IPv4 Addressing, Address Space, Classful Addressing, Subnet Mask, FLSM, Classless Addressing, VLSM, NAT, Supernetting & Network Devices (Hub, Repeaters, Switch, Bridge, Router)',
  iconName: 'Compass',
  topics: [
    {
      id: 'u2-t1',
      title: 'IPv4 Addressing, Address Space & Classful Architecture',
      description: 'The 32-bit logical addressing scheme, total address space, class divisions, and default subnet masks.',
      keyPoints: [
        'IPv4 Address Space: 32 bits yielding 2^32 = 4,294,967,296 unique address identifiers written in dotted-decimal format (4 octets: e.g., 192.168.1.1).',
        'Classful Architecture (RFC 791):',
        '• Class A (1.0.0.0 to 126.255.255.255): Leading bit `0`. Default mask `/8` (255.0.0.0). 126 networks, 16,777,214 hosts per network.',
        '• Class B (128.0.0.0 to 191.255.255.255): Leading bits `10`. Default mask `/16` (255.255.0.0). 16,384 networks, 65,534 hosts per network.',
        '• Class C (192.0.0.0 to 223.255.255.255): Leading bits `110`. Default mask `/24` (255.255.255.0). 2,097,152 networks, 254 hosts per network.',
        '• Class D (224.0.0.0 to 239.255.255.255): Leading bits `1110`. Reserved for Multicast group addressing (no subnet mask).',
        '• Class E (240.0.0.0 to 255.255.255.255): Leading bits `1111`. Reserved for scientific research and experimental purposes.',
        'Special Addresses:',
        '• Loopback Diagnostic: `127.0.0.0/8` (`127.0.0.1` points to local TCP/IP stack).',
        '• RFC 1918 Private Ranges: Class A `10.0.0.0/8`, Class B `172.16.0.0/12`, Class C `192.168.0.0/16`.',
        '• APIPA (Automatic Private IP): `169.254.0.0/16` when DHCP server is unreachable.'
      ],
      examTips: 'Exam Class Identification: Check the first octet: 1-126 is Class A, 128-191 is Class B, 192-223 is Class C, 224-239 is Class D. Note 127 is reserved for loopback and is neither Class A nor B.',
      diagramOrSnippet: `IPv4 CLASS ARCHITECTURE:
Class A: [0]   [ 7-bit NetID ]  [           24-bit HostID            ] -> /8
Class B: [10]  [ 14-bit NetID ] [          16-bit HostID             ] -> /16
Class C: [110] [ 21-bit NetID ] [         8-bit HostID               ] -> /24
Class D: [1110] [              28-bit Multicast Group ID             ]`,
      vivaQuestions: [
        { q: 'Why is 127.0.0.1 not usable as a standard host IP in a LAN?', a: 'Because the entire 127.0.0.0/8 range is reserved for local host software loopback testing.' },
        { q: 'What is the private IPv4 address range for Class C under RFC 1918?', a: '192.168.0.0 to 192.168.255.255 (192.168.0.0/16).' }
      ],
      references: [
        { title: 'GeeksforGeeks - IP Addressing', url: 'https://www.geeksforgeeks.org/ip-addressing/', type: 'Guide', source: 'GeeksforGeeks' },
        { title: 'YouTube - Subnetting Mastery', url: 'https://www.youtube.com/watch?v=s_Ntt6eTn94', type: 'Video', source: 'YouTube' }
      ]
    },
    {
      id: 'u2-t2',
      title: 'Subnet Mask, FLSM & Classless Addressing (CIDR)',
      description: 'Dividing network address space by borrowing host bits into fixed-length subnet blocks.',
      keyPoints: [
        'Subnet Mask: A 32-bit sequence of contiguous 1s followed by contiguous 0s indicating the network portion versus host portion.',
        'FLSM (Fixed Length Subnet Masking): All subnets created have the identical subnet mask and provide the exact same number of usable hosts.',
        'Core Subnetting Formulas:',
        '1. Number of Subnets = 2^s (where s = borrowed subnet bits).',
        '2. Usable Hosts per Subnet = 2^h - 2 (where h = remaining host bits; subtracting 2 for Network ID and Directed Broadcast ID).',
        '3. Block Size (Magic Number) = 256 - Value of Interesting Octet in Subnet Mask.',
        'CIDR (Classless Inter-Domain Routing - RFC 1519): Replaces rigid Class A/B/C boundaries with prefix notation (e.g., /24, /27, /30) to prevent routing table explosion and address depletion.',
        'Associated Lab: Lab 4 (IP addressing and Sub netting).'
      ],
      examTips: 'Exam Step-by-Step FLSM: Subnet 192.168.1.0/27: Borrowed bits s = 27 - 24 = 3 bits. Subnets = 2^3 = 8. Host bits h = 32 - 27 = 5 bits. Usable hosts = 2^5 - 2 = 30. Mask = 255.255.255.224. Block size = 256 - 224 = 32. Subnets: 0, 32, 64, 96, 128, 160, 192, 224.',
      diagramOrSnippet: `FLSM BREAKDOWN FOR 192.168.1.0 /27:
Subnet Mask: 11111111.11111111.11111111.11100000 (255.255.255.224)
Block size = 256 - 224 = 32
Subnet 0: 192.168.1.0   Range: 192.168.1.1 - 192.168.1.30   Broadcast: 192.168.1.31
Subnet 1: 192.168.1.32  Range: 192.168.1.33 - 192.168.1.62  Broadcast: 192.168.1.63`,
      vivaQuestions: [
        { q: 'Why are two addresses subtracted when calculating usable hosts per subnet?', a: 'One address represents the Network Identification (all host bits 0) and one represents the Directed Broadcast (all host bits 1).' },
        { q: 'What is the CIDR prefix for a subnet mask of 255.255.255.240?', a: '/28, because there are 24 bits in the first three octets plus 4 bits (11110000) in the fourth octet.' }
      ]
    },
    {
      id: 'u2-t3',
      title: 'VLSM (Variable Length Subnet Masking) & Supernetting',
      description: 'Subnetting a subnet to allocate custom mask lengths matching exact host requirements and route summarization.',
      keyPoints: [
        'VLSM (Variable Length Subnet Masking): Enables assigning different subnet masks to different subnets within the same network block, completely eliminating IPv4 address wastage.',
        '• Example: Assign /26 (62 hosts) for Marketing, /27 (30 hosts) for Sales, /28 (14 hosts) for IT, and /30 (2 hosts) for inter-router point-to-point serial links.',
        '• Golden Rule of VLSM: Always sort subnet requirements in DESCENDING ORDER of required host count (largest network first, down to 2-host links) before assigning addresses to prevent overlapping subnets.',
        'Supernetting (Route Summarization / CIDR Aggregation): Combining multiple contiguous smaller classless networks into a single larger route advertisement with a shorter prefix (e.g., combining four /24 networks 192.168.0.0/24 through 192.168.3.0/24 into 192.168.0.0/22). Reduces router routing table size and memory overhead.',
        'Associated Lab: Lab 4 (IP addressing and Sub netting - VLSM) and Lab 5 (Static and Default Routing).'
      ],
      examTips: 'Exam VLSM Design: Always show: 1. Host requirement table sorted descending 2. Selected prefix length /x 3. Subnet mask 4. Network ID, Usable Range, and Broadcast ID for each department.',
      diagramOrSnippet: `VLSM HIERARCHICAL ALLOCATION (192.168.10.0 /24):
[ 192.168.10.0 /24 Base Pool ]
  ├── 192.168.10.0/26 (Dept A: 50 hosts needed -> 62 provided)
  ├── 192.168.10.64/27 (Dept B: 25 hosts needed -> 30 provided)
  ├── 192.168.10.96/28 (Dept C: 10 hosts needed -> 14 provided)
  └── 192.168.10.112/30 (WAN Serial Link: 2 hosts needed -> 2 provided)`,
      vivaQuestions: [
        { q: 'Why must subnet requirements be arranged in descending order during VLSM calculations?', a: 'To prevent overlapping address spaces and ensure seamless binary boundary alignment.' },
        { q: 'What is the purpose of Supernetting in internetwork routing?', a: 'To aggregate multiple contiguous network prefixes into a single summary route, minimizing routing table size.' }
      ]
    },
    {
      id: 'u2-t4',
      title: 'NAT (Network Address Translation): Static, Dynamic & PAT',
      description: 'Mapping private RFC 1918 IPv4 addresses to public routable IP addresses to conserve IPv4 space and enhance security.',
      keyPoints: [
        'Purpose of NAT (RFC 1631 / RFC 3022): Enables private internal LAN hosts to access the public Internet using one or few public IP addresses while hiding internal network topology.',
        'Three Types of NAT:',
        '1. Static NAT: One-to-one permanent mapping of an internal private IP to an external public IP. Used for hosting internal web/mail servers accessible from the Internet.',
        '2. Dynamic NAT: Many-to-many dynamic mapping from a pool of public IP addresses on a first-come, first-served basis. When all pool IPs are leased, subsequent requests are dropped.',
        '3. PAT (Port Address Translation / NAT Overload): Many-to-one mapping where thousands of internal private hosts share a SINGLE public IP address. Disambiguated using unique Layer 4 source port numbers (e.g., 192.168.1.10:4001 -> 203.0.113.1:54321). Most ubiquitous NAT mode.',
        'Associated Lab: Lab 6 (NAT Configuration in Cisco Packet Tracer).'
      ],
      examTips: 'Cisco IOS PAT Configuration: `access-list 1 permit 192.168.1.0 0.0.0.255` -> `ip nat inside source list 1 interface GigabitEthernet0/1 overload` -> specify `ip nat inside` and `ip nat outside` on interfaces.',
      diagramOrSnippet: `PORT ADDRESS TRANSLATION (PAT) MAPPING:
Internal LAN Host                 NAT Gateway Router             Public Internet
192.168.1.10:5000 ──► [Translates: 192.168.1.10:5000  ] ──► 203.0.113.1:60001 ──► Web Server
                      [   to 203.0.113.1:60001 in NAT Table]`,
      vivaQuestions: [
        { q: 'What distinguishes PAT (NAT Overload) from Dynamic NAT?', a: 'Dynamic NAT maps one private IP to one public IP from a pool, while PAT maps multiple private IPs to a single public IP distinguished by unique Layer 4 port numbers.' },
        { q: 'What is the Cisco IOS command keyword that enables PAT?', a: 'The "overload" keyword at the end of the "ip nat inside source" statement.' }
      ]
    },
    {
      id: 'u2-t5',
      title: 'Network Devices: Hub, Repeaters, Switch, Bridge & Router',
      description: 'Hardware internetworking components operating at different layers of the OSI model.',
      keyPoints: [
        'Repeater (Layer 1 - Physical): Regenerates and amplifies attenuated electrical/optical signals over extended cable distances. Operates on raw bits; does not examine frame headers. Single collision domain, single broadcast domain.',
        'Hub (Layer 1 - Physical): Multi-port repeater. Broadcasts incoming bits received on one port out to ALL other ports. Half-duplex only; high collision probability. Single collision domain, single broadcast domain.',
        'Bridge (Layer 2 - Data Link): Connects two network segments. Inspects MAC addresses and filters/forwards traffic based on a software lookup table. Divides collision domains; maintains single broadcast domain.',
        'Switch (Layer 2 - Data Link / Catalyst 2960): Multi-port bridge implemented with hardware ASIC switching. Builds and maintains a MAC Address Table (CAM table). Learns source MAC addresses and forwards unicast frames directly to destination port. Full-duplex per port: Each port is an isolated collision domain! Single broadcast domain unless segmented by VLANs.',
        'Router (Layer 3 - Network / Cisco 1941/2911): Interconnects logically distinct networks and subnets. Reads Layer 3 IP destination addresses and makes forwarding decisions using a Routing Table (FIB). Breaks BOTH collision domains AND broadcast domains! Blocks broadcasts from propagating across interfaces.',
        'Associated Labs: Lab 1, Lab 2, Lab 3, and Lab 5.'
      ],
      examTips: 'Exam Comparison Table: Tabulate Hub, Bridge, Switch, and Router based on: 1. OSI Operating Layer 2. Addressing used (None vs MAC vs IP) 3. Collision domains separated? 4. Broadcast domains separated? 5. Hardware forwarding mechanism.',
      diagramOrSnippet: `NETWORK DEVICE OSI LAYER MAPPING:
Layer 3 (Network):    [ ROUTER ]  ── Separates BOTH Collision & Broadcast Domains!
Layer 2 (Data Link):  [ SWITCH ]  ── Separates Collision Domains; 1 Broadcast Domain
Layer 1 (Physical):   [  HUB   ]  ── 1 Shared Collision Domain, 1 Broadcast Domain`,
      vivaQuestions: [
        { q: 'Which network device separates both collision domains and broadcast domains?', a: 'A Router (Layer 3 device).' },
        { q: 'How does a Layer 2 switch populate its MAC address (CAM) table?', a: 'By inspecting the Source MAC address of incoming frames and recording the port on which the frame arrived.' }
      ]
    }
  ]
};
