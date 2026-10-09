import { AcademicExperiment } from './types';

export const LABS_PART_3: AcademicExperiment[] = [
  // -------------------------------------------------------------
  // LAB 11: PPP Configuration
  // -------------------------------------------------------------
  {
    id: 'exp-11',
    number: 11,
    title: 'Lab 11: PPP Configuration',
    category: 'Serial & Protocols',
    aim: 'To configure and verify Point-to-Point Protocol (PPP) encapsulation with CHAP (Challenge Handshake Authentication Protocol) on a Cisco serial WAN link.',
    apparatus: ['2 Cisco 1941 Routers with HWIC-2T cards', 'Smart Serial DCE/DTE Cables'],
    background: 'Point-to-Point Protocol (PPP - RFC 1661) is the standard data-link protocol for serial WAN connections. Unlike HDLC, PPP supports multi-protocol encapsulation (IPCP), link quality monitoring, and robust security through PAP (2-way plaintext) or CHAP (3-way MD5 challenge). In CHAP, each router configures a shared secret matching the remote router hostname.',
    initialTopology: {
      devices: [
        {
          id: 'l11-r1',
          name: 'HQ-Router',
          type: 'router',
          model: '1941',
          x: 320,
          y: 200,
          powerState: 'on',
          interfaces: [
            { id: 'l11-r1-se0', name: 'Serial0/0/0', ip: '10.0.0.1', subnetMask: '255.255.255.252', mac: '00:SE:11:00:00:01', status: 'up', clockRate: 64000 }
          ]
        },
        {
          id: 'l11-r2',
          name: 'Branch-Router',
          type: 'router',
          model: '1941',
          x: 560,
          y: 200,
          powerState: 'on',
          interfaces: [
            { id: 'l11-r2-se0', name: 'Serial0/0/0', ip: '10.0.0.2', subnetMask: '255.255.255.252', mac: '00:SE:11:00:00:02', status: 'up' }
          ]
        }
      ],
      links: [
        { id: 'l11-l1', sourceDeviceId: 'l11-r1', sourcePortId: 'l11-r1-se0', targetDeviceId: 'l11-r2', targetPortId: 'l11-r2-se0', cableType: 'serial', status: 'up' }
      ]
    },
    procedureSteps: [
      '1. Connect HQ-Router to Branch-Router using Serial0/0/0 DCE cable. Clock rate 64000 on HQ.',
      '2. On HQ-Router: create username for remote router with password: "username Branch-Router password CiscoKey123".',
      '3. On Branch-Router: create username for HQ with matching password: "username HQ-Router password CiscoKey123".',
      '4. Configure interface Serial0/0/0 on both routers with "encapsulation ppp" and "ppp authentication chap".',
      '5. Verify link state and encapsulation using "show interface Serial0/0/0". Check that LCP is open and IPCP is open.'
    ],
    cliCommands: [
      'HQ-Router(config)# username Branch-Router password CiscoKey123',
      'HQ-Router(config)# interface Serial0/0/0',
      'HQ-Router(config-if)# ip address 10.0.0.1 255.255.255.252',
      'HQ-Router(config-if)# encapsulation ppp',
      'HQ-Router(config-if)# ppp authentication chap',
      'HQ-Router(config-if)# clock rate 64000',
      'HQ-Router(config-if)# no shutdown',
      'HQ-Router# show interface Serial0/0/0'
    ],
    verificationCheck: {
      description: 'Check that Serial0/0/0 has PPP encapsulation and line protocol is up.',
      isPassed: (devices) => {
        const r1 = devices.find(d => d.name === 'HQ-Router');
        return !!(r1 && r1.interfaces.some(i => i.status === 'up'));
      },
      hint: 'Configure "encapsulation ppp" on Serial0/0/0 and configure CHAP credentials.'
    },
    visualExplanation: {
      title: 'PPP CHAP 3-Way Authentication',
      description: 'Exchange of random challenge and MD5 hash without exposing passwords.',
      steps: [
        { step: 1, label: 'LCP Negotiation', source: 'HQ', target: 'Branch', layer: 'Data Link (L2)', detail: 'LCP negotiates MRU, compression, and CHAP authentication protocol.' },
        { step: 2, label: 'CHAP Challenge', source: 'HQ', target: 'Branch', layer: 'Data Link (L2)', detail: 'HQ transmits random challenge packet and its hostname.' },
        { step: 3, label: 'CHAP Response', source: 'Branch', target: 'HQ', layer: 'Data Link (L2)', detail: 'Branch hashes secret password + challenge using MD5 and sends result.' },
        { step: 4, label: 'CHAP Success', source: 'HQ', target: 'Branch', layer: 'Data Link (L2)', detail: 'HQ verifies hash matches locally; sends CHAP Success and opens IPCP.' }
      ]
    },
    resources: {
      referenceUrl: 'https://www.rfc-editor.org/info/rfc1661/',
      referenceTitle: 'RFC 1661: The Point-to-Point Protocol (PPP)',
      referenceSource: 'RFC Editor',
      geeksForGeeksUrl: 'https://www.geeksforgeeks.org/point-to-point-protocol-ppp/',
      geeksForGeeksTitle: 'GeeksforGeeks PPP Guide',
      youtubeUrl: 'https://www.youtube.com/watch?v=R2j90KkLqWs',
      youtubeTitle: 'PPP and CHAP Configuration in Packet Tracer',
      youtubeChannel: 'NetworkChuck'
    },
    vivaQuestions: [
      { question: 'Why is CHAP more secure than PAP in PPP authentication?', answer: 'PAP sends the password across the wire in clear plaintext, whereas CHAP uses a 3-way handshake with a one-way MD5 hash challenge.' },
      { question: 'What sub-protocol of PPP is responsible for negotiating network layer protocols such as IPv4?', answer: 'NCP (Network Control Protocol), specifically IPCP for IPv4.' }
    ]
  },

  // -------------------------------------------------------------
  // LAB 12: HDLC Configuration
  // -------------------------------------------------------------
  {
    id: 'exp-12',
    number: 12,
    title: 'Lab 12: HDLC Configuration',
    category: 'Serial & Protocols',
    aim: 'To configure and verify High-Level Data Link Control (HDLC) default synchronous serial encapsulation on Cisco point-to-point WAN links.',
    apparatus: ['2 Cisco 1941 Routers with HWIC-2T cards', 'Smart Serial DCE/DTE Cables'],
    background: 'HDLC (High-Level Data Link Control - ISO 13239) is a bit-oriented synchronous data link protocol. It is the default encapsulation on all Cisco synchronous serial interfaces. Cisco uses an enhanced proprietary version of HDLC that appends a 2-byte protocol code field, allowing multiple network-layer protocols (IPv4, IPv6) to share the same serial link.',
    initialTopology: {
      devices: [
        {
          id: 'l12-r1',
          name: 'Router0',
          type: 'router',
          model: '1941',
          x: 320,
          y: 200,
          powerState: 'on',
          interfaces: [
            { id: 'l12-r1-se0', name: 'Serial0/0/0', ip: '192.168.10.1', subnetMask: '255.255.255.252', mac: '00:SE:12:00:00:01', status: 'up', clockRate: 64000 }
          ]
        },
        {
          id: 'l12-r2',
          name: 'Router1',
          type: 'router',
          model: '1941',
          x: 560,
          y: 200,
          powerState: 'on',
          interfaces: [
            { id: 'l12-r2-se0', name: 'Serial0/0/0', ip: '192.168.10.2', subnetMask: '255.255.255.252', mac: '00:SE:12:00:00:02', status: 'up' }
          ]
        }
      ],
      links: [
        { id: 'l12-l1', sourceDeviceId: 'l12-r1', sourcePortId: 'l12-r1-se0', targetDeviceId: 'l12-r2', targetPortId: 'l12-r2-se0', cableType: 'serial', status: 'up' }
      ]
    },
    procedureSteps: [
      '1. Connect Router0 to Router1 using Serial0/0/0 DCE cable. Clock rate 64000 on DCE.',
      '2. Enter interface config mode on Router0: "interface Serial0/0/0".',
      '3. Assign IP 192.168.10.1 255.255.255.252.',
      '4. Set encapsulation to HDLC: "encapsulation hdlc". Execute "no shutdown".',
      '5. Configure Router1 Serial0/0/0 with 192.168.10.2 255.255.255.252 and "encapsulation hdlc".',
      '6. Verify encapsulation with "show interface Serial0/0/0". Ping remote IP 192.168.10.2.'
    ],
    cliCommands: [
      'Router0(config)# interface Serial0/0/0',
      'Router0(config-if)# ip address 192.168.10.1 255.255.255.252',
      'Router0(config-if)# encapsulation hdlc',
      'Router0(config-if)# clock rate 64000',
      'Router0(config-if)# no shutdown',
      'Router0# show interface Serial0/0/0'
    ],
    verificationCheck: {
      description: 'Check that Serial0/0/0 has HDLC encapsulation and line protocol is up.',
      isPassed: (devices) => {
        const r0 = devices.find(d => d.name === 'Router0');
        return !!(r0 && r0.interfaces.some(i => i.status === 'up'));
      },
      hint: 'Configure "encapsulation hdlc" on Serial0/0/0.'
    },
    visualExplanation: {
      title: 'HDLC Bit-Oriented Framing',
      description: 'Cisco HDLC frame format featuring flag 01111110 and proprietary 2-byte protocol type field.',
      steps: [
        { step: 1, label: 'Flag Delimiter', source: 'Router0', target: 'Router1', layer: 'Data Link (L2)', detail: '01111110 flag synchronization sequence.' },
        { step: 2, label: 'Cisco Protocol Code', source: 'Router0', target: 'Router1', layer: 'Data Link (L2)', detail: 'Identifies encapsulated payload (0x0800 for IPv4, 0x86DD for IPv6).' },
        { step: 3, label: 'Payload Transfer', source: 'Router0', target: 'Router1', layer: 'Data Link (L2)', detail: 'Synchronous payload transfer checked via 16-bit CRC FCS.' }
      ]
    },
    resources: {
      referenceUrl: 'https://www.rfc-editor.org/info/rfc1662/',
      referenceTitle: 'RFC 1662: PPP in HDLC-like Framing',
      referenceSource: 'RFC Editor',
      geeksForGeeksUrl: 'https://www.geeksforgeeks.org/high-level-data-link-control-hdlc/',
      geeksForGeeksTitle: 'GeeksforGeeks HDLC Guide',
      youtubeUrl: 'https://www.youtube.com/watch?v=6qjD9_o80-E',
      youtubeTitle: 'HDLC vs PPP Encapsulation in Cisco IOS',
      youtubeChannel: 'Neso Academy'
    },
    vivaQuestions: [
      { question: 'What is the default encapsulation on Cisco serial synchronous interfaces?', answer: 'Cisco HDLC (High-Level Data Link Control).' },
      { question: 'How does Cisco proprietary HDLC differ from standard ISO HDLC?', answer: 'Cisco HDLC includes a 2-byte protocol code field, enabling multi-protocol traffic over a single point-to-point link.' }
    ]
  },

  // -------------------------------------------------------------
  // LAB 13: Implementation of BGP
  // -------------------------------------------------------------
  {
    id: 'exp-13',
    number: 13,
    title: 'Lab 13: Implementation of BGP',
    category: 'Dynamic Routing',
    aim: 'To configure and verify External Border Gateway Protocol (EBGP) between two distinct Autonomous Systems (AS 100 and AS 200) over TCP Port 179.',
    apparatus: ['2 Cisco 1941 Routers', 'Serial DCE Cables', 'Packet Tracer Workstation'],
    background: 'Border Gateway Protocol (BGP-4 - RFC 4271) is the Path-Vector standard routing the global Internet. BGP does not use broadcast/multicast; it establishes peer neighbor sessions over TCP port 179. EBGP (External BGP) connects routers in different Autonomous Systems (Administrative Distance = 20). Path-vector loop prevention uses the AS-Path attribute: if a router receives an update containing its own AS number, it drops the route.',
    initialTopology: {
      devices: [
        {
          id: 'l13-r1',
          name: 'AS100-ISP',
          type: 'router',
          model: '1941',
          x: 320,
          y: 200,
          powerState: 'on',
          interfaces: [
            { id: 'l13-r1-gi0', name: 'GigabitEthernet0/0', ip: '192.168.1.1', subnetMask: '255.255.255.0', mac: '00:RR:13:00:00:01', status: 'up' },
            { id: 'l13-r1-se0', name: 'Serial0/0/0', ip: '209.165.200.1', subnetMask: '255.255.255.252', mac: '00:SE:13:00:00:01', status: 'up', clockRate: 64000 }
          ],
          routingTable: [
            { id: 'l13-rt1', destinationNetwork: '192.168.2.0', subnetMask: '255.255.255.0', nextHop: '209.165.200.2', interfaceName: 'Se0/0/0', type: 'B', metric: 0 }
          ]
        },
        {
          id: 'l13-r2',
          name: 'AS200-Enterprise',
          type: 'router',
          model: '1941',
          x: 560,
          y: 200,
          powerState: 'on',
          interfaces: [
            { id: 'l13-r2-gi0', name: 'GigabitEthernet0/0', ip: '192.168.2.1', subnetMask: '255.255.255.0', mac: '00:RR:13:00:00:02', status: 'up' },
            { id: 'l13-r2-se0', name: 'Serial0/0/0', ip: '209.165.200.2', subnetMask: '255.255.255.252', mac: '00:SE:13:00:00:02', status: 'up' }
          ],
          routingTable: [
            { id: 'l13-rt2', destinationNetwork: '192.168.1.0', subnetMask: '255.255.255.0', nextHop: '209.165.200.1', interfaceName: 'Se0/0/0', type: 'B', metric: 0 }
          ]
        }
      ],
      links: [
        { id: 'l13-l1', sourceDeviceId: 'l13-r1', sourcePortId: 'l13-r1-se0', targetDeviceId: 'l13-r2', targetPortId: 'l13-r2-se0', cableType: 'serial', status: 'up' }
      ]
    },
    procedureSteps: [
      '1. Connect AS100-ISP to AS200-Enterprise via Serial0/0/0. Assign WAN subnet 209.165.200.0/30.',
      '2. On AS100-ISP: enter BGP config: "router bgp 100" -> define neighbor: "neighbor 209.165.200.2 remote-as 200" -> advertise network: "network 192.168.1.0 mask 255.255.255.0".',
      '3. On AS200-Enterprise: enter "router bgp 200" -> "neighbor 209.165.200.1 remote-as 100" -> "network 192.168.2.0 mask 255.255.255.0".',
      '4. Observe BGP peer state transition from IDLE -> CONNECT -> ACTIVE -> OPENSENT -> OPENCONFIRM -> ESTABLISHED.',
      '5. Verify BGP summary with "show ip bgp summary" and check routing table with "show ip route bgp".'
    ],
    cliCommands: [
      'AS100-ISP(config)# router bgp 100',
      'AS100-ISP(config-router)# neighbor 209.165.200.2 remote-as 200',
      'AS100-ISP(config-router)# network 192.168.1.0 mask 255.255.255.0',
      'AS100-ISP# show ip bgp summary',
      'AS100-ISP# show ip route bgp'
    ],
    verificationCheck: {
      description: 'Check that BGP routes (type B) are learned between AS 100 and AS 200.',
      isPassed: (devices) => {
        const r1 = devices.find(d => d.name === 'AS100-ISP');
        return !!(r1 && r1.routingTable && r1.routingTable.some(r => r.type === 'B'));
      },
      hint: 'Configure BGP neighbor and network statements with correct remote-as.'
    },
    visualExplanation: {
      title: 'BGP Peering Session Establishment',
      description: 'Routers establish TCP port 179 session and advertise AS-Path attributes.',
      steps: [
        { step: 1, label: 'TCP 3-Way Handshake', source: 'AS 100', target: 'AS 200', layer: 'Transport (L4)', detail: 'BGP establishes reliable session over TCP Port 179.' },
        { step: 2, label: 'OPEN Message', source: 'AS 100', target: 'AS 200', layer: 'Application (L7)', detail: 'Exchanges BGP version, AS number, BGP Router ID, and Hold Time.' },
        { step: 3, label: 'UPDATE & AS-Path', source: 'AS 200', target: 'AS 100', layer: 'Application (L7)', detail: 'Advertises route 192.168.2.0 with AS-Path attribute [200].' }
      ]
    },
    resources: {
      referenceUrl: 'https://www.geeksforgeeks.org/border-gateway-protocol-bgp/',
      referenceTitle: 'GeeksforGeeks - Border Gateway Protocol (BGP)',
      referenceSource: 'GeeksforGeeks',
      geeksForGeeksUrl: 'https://www.geeksforgeeks.org/border-gateway-protocol-bgp/',
      geeksForGeeksTitle: 'GeeksforGeeks BGP Guide',
      youtubeUrl: 'https://www.youtube.com/watch?v=cMkxPkh58wE',
      youtubeTitle: 'BGP Configuration in Cisco Packet Tracer',
      youtubeChannel: 'NetworkChuck'
    },
    vivaQuestions: [
      { question: 'What transport layer protocol and port number are used by BGP?', answer: 'TCP Port 179.' },
      { question: 'What is the administrative distance of External BGP (EBGP)?', answer: '20 (highly trusted for inter-domain routing).' }
    ]
  },

  // -------------------------------------------------------------
  // LAB 14: Implementation of EIGRP
  // -------------------------------------------------------------
  {
    id: 'exp-14',
    number: 14,
    title: 'Lab 14: Implementation of EIGRP',
    category: 'Dynamic Routing',
    aim: 'To configure and verify Enhanced Interior Gateway Routing Protocol (EIGRP) using the DUAL finite state machine and analyze feasible successors.',
    apparatus: ['2 Cisco 1941 Routers with HWIC-2T cards', '2 Catalyst 2960 Switches', '2 Workstation PCs', 'Serial DCE Cables'],
    background: 'EIGRP is Cisco\'s advanced distance-vector routing protocol using the Diffusing Update Algorithm (DUAL). Composite Metric = 256 * [ (10^7 / Min Bandwidth) + (Total Delay / 10) ]. Features: Zero routing loops, sub-second convergence via Feasible Successors, multicast updates to 224.0.0.10, and administrative distance of 90. Feasibility Condition: Reported Distance (RD) < Feasible Distance (FD).',
    initialTopology: {
      devices: [
        {
          id: 'l14-r1',
          name: 'Router1',
          type: 'router',
          model: '1941',
          x: 320,
          y: 200,
          powerState: 'on',
          interfaces: [
            { id: 'l14-r1-gi0', name: 'GigabitEthernet0/0', ip: '192.168.1.1', subnetMask: '255.255.255.0', mac: '00:RR:14:00:00:01', status: 'up' },
            { id: 'l14-r1-se0', name: 'Serial0/0/0', ip: '10.0.0.1', subnetMask: '255.255.255.252', mac: '00:SE:14:00:00:01', status: 'up', clockRate: 64000 }
          ],
          routingTable: [
            { id: 'l14-rt1', destinationNetwork: '192.168.2.0', subnetMask: '255.255.255.0', nextHop: '10.0.0.2', interfaceName: 'Se0/0/0', type: 'D', metric: 2172416 }
          ]
        },
        {
          id: 'l14-r2',
          name: 'Router2',
          type: 'router',
          model: '1941',
          x: 560,
          y: 200,
          powerState: 'on',
          interfaces: [
            { id: 'l14-r2-gi0', name: 'GigabitEthernet0/0', ip: '192.168.2.1', subnetMask: '255.255.255.0', mac: '00:RR:14:00:00:02', status: 'up' },
            { id: 'l14-r2-se0', name: 'Serial0/0/0', ip: '10.0.0.2', subnetMask: '255.255.255.252', mac: '00:SE:14:00:00:02', status: 'up' }
          ],
          routingTable: [
            { id: 'l14-rt2', destinationNetwork: '192.168.1.0', subnetMask: '255.255.255.0', nextHop: '10.0.0.1', interfaceName: 'Se0/0/0', type: 'D', metric: 2172416 }
          ]
        }
      ],
      links: [
        { id: 'l14-l1', sourceDeviceId: 'l14-r1', sourcePortId: 'l14-r1-se0', targetDeviceId: 'l14-r2', targetPortId: 'l14-r2-se0', cableType: 'serial', status: 'up' }
      ]
    },
    procedureSteps: [
      '1. Connect Router1 to Router2 via Serial0/0/0 DCE cable. Clock rate 64000.',
      '2. On Router1: enter "router eigrp 100" -> "no auto-summary" -> "network 192.168.1.0 0.0.0.255" -> "network 10.0.0.0 0.0.0.3".',
      '3. On Router2: enter "router eigrp 100" -> "no auto-summary" -> "network 192.168.2.0 0.0.0.255" -> "network 10.0.0.0 0.0.0.3".',
      '4. Observe EIGRP adjacency establishment notification: "%DUAL-5-NBRCHANGE: IP-EIGRP 100: Neighbor 10.0.0.2 is up: new adjacency".',
      '5. Verify neighbors with "show ip eigrp neighbors" and view DUAL topology with "show ip eigrp topology". Check routing table with "show ip route eigrp".'
    ],
    cliCommands: [
      'Router1(config)# router eigrp 100',
      'Router1(config-router)# no auto-summary',
      'Router1(config-router)# network 192.168.1.0 0.0.0.255',
      'Router1(config-router)# network 10.0.0.0 0.0.0.3',
      'Router1# show ip eigrp neighbors',
      'Router1# show ip eigrp topology',
      'Router1# show ip route eigrp'
    ],
    verificationCheck: {
      description: 'Check that EIGRP routes (type D) are installed in the routing table.',
      isPassed: (devices) => {
        const r1 = devices.find(d => d.name === 'Router1');
        return !!(r1 && r1.routingTable && r1.routingTable.some(r => r.type === 'D'));
      },
      hint: 'Configure "router eigrp 100" and matching autonomous system number on both routers.'
    },
    visualExplanation: {
      title: 'EIGRP DUAL Convergence & Successors',
      description: 'DUAL finite state machine selects Successor and validates Feasible Successors.',
      steps: [
        { step: 1, label: 'Hello Packet', source: 'Router1', target: 'Router2', layer: 'Network (L3)', detail: 'Hello packets sent to multicast 224.0.0.10 to establish adjacency.' },
        { step: 2, label: 'Topology Table', source: 'Router1', target: 'Router1', layer: 'Algorithm', detail: 'Calculates Feasible Distance (FD) and evaluates Feasibility Condition.' },
        { step: 3, label: 'Route Install', source: 'Router1', target: 'Router1', layer: 'Network (L3)', detail: 'Installs Successor route tagged as "D" with AD 90.' }
      ]
    },
    resources: {
      referenceUrl: 'https://www.geeksforgeeks.org/what-is-routing/',
      referenceTitle: 'GeeksforGeeks - What is Routing?',
      referenceSource: 'GeeksforGeeks',
      geeksForGeeksUrl: 'https://www.geeksforgeeks.org/what-is-routing/',
      geeksForGeeksTitle: 'GeeksforGeeks EIGRP Architecture Guide',
      youtubeUrl: 'https://www.youtube.com/watch?v=b4wHwYwzF38',
      youtubeTitle: 'EIGRP Configuration in Cisco Packet Tracer',
      youtubeChannel: 'Neso Academy'
    },
    vivaQuestions: [
      { question: 'What is the administrative distance of EIGRP internal routes?', answer: '90.' },
      { question: 'What is the Feasibility Condition in EIGRP?', answer: 'A neighbor\'s Reported Distance (RD) must be strictly less than the current Feasible Distance (FD) to qualify as an instant backup Feasible Successor.' }
    ]
  },

  // -------------------------------------------------------------
  // LAB 15: Telnet Configuration
  // -------------------------------------------------------------
  {
    id: 'exp-15',
    number: 15,
    title: 'Lab 15: Telnet Configuration',
    category: 'Fundamentals',
    aim: 'To configure remote virtual teletype (VTY) Telnet terminal access on a Cisco router, enforce password authentication, and test remote management from a client PC workstation.',
    apparatus: ['1 Cisco 1941 Router', '1 Catalyst 2960 Switch', '1 Workstation PC', 'Copper Straight-Through Cables'],
    background: 'Telnet (RFC 854) operates over TCP Port 23 to provide remote command-line access to routers and switches across the IP network. To enable Telnet in Cisco IOS: 1. Configure an `enable secret` password (mandatory; without it, remote Telnet sessions cannot enter privileged EXEC mode) 2. Configure `line vty 0 4` with `password <pass>` and `login` 3. Enable `transport input telnet`.',
    initialTopology: {
      devices: [
        {
          id: 'l15-r0',
          name: 'Core-Router',
          type: 'router',
          model: '1941',
          x: 440,
          y: 200,
          powerState: 'on',
          interfaces: [
            { id: 'l15-r0-gi0', name: 'GigabitEthernet0/0', ip: '192.168.1.1', subnetMask: '255.255.255.0', mac: '00:RR:15:00:00:01', status: 'up' }
          ]
        },
        {
          id: 'l15-pc0',
          name: 'Remote-PC',
          type: 'pc',
          model: 'PC-PT',
          x: 180,
          y: 200,
          powerState: 'on',
          defaultGateway: '192.168.1.1',
          interfaces: [{ id: 'l15-pc0-fa0', name: 'FastEthernet0', ip: '192.168.1.50', subnetMask: '255.255.255.0', mac: '00:PC:15:00:00:01', status: 'up' }]
        }
      ],
      links: [
        { id: 'l15-l1', sourceDeviceId: 'l15-pc0', sourcePortId: 'l15-pc0-fa0', targetDeviceId: 'l15-r0', targetPortId: 'l15-r0-gi0', cableType: 'straight', status: 'up' }
      ]
    },
    procedureSteps: [
      '1. Connect Remote-PC to Core-Router GigabitEthernet0/0.',
      '2. On Core-Router: configure enable secret: "enable secret SecretPass123".',
      '3. Enter VTY lines: "line vty 0 4".',
      '4. Set password: "password TelnetPass123".',
      '5. Enable authentication: "login".',
      '6. Allow Telnet protocol: "transport input telnet".',
      '7. Open Remote-PC Command Prompt -> execute "telnet 192.168.1.1".',
      '8. Enter VTY password ("TelnetPass123"), then enter privileged mode using "enable" and secret password.'
    ],
    cliCommands: [
      'Core-Router(config)# enable secret SecretPass123',
      'Core-Router(config)# line vty 0 4',
      'Core-Router(config-line)# password TelnetPass123',
      'Core-Router(config-line)# login',
      'Core-Router(config-line)# transport input telnet',
      'Core-Router(config-line)# exit',
      'Remote-PC> telnet 192.168.1.1'
    ],
    verificationCheck: {
      description: 'Check that VTY lines are configured and Telnet connectivity can be established.',
      isPassed: (devices) => {
        const r0 = devices.find(d => d.name === 'Core-Router');
        return !!(r0 && r0.interfaces.some(i => i.ip === '192.168.1.1'));
      },
      hint: 'Configure "enable secret" and "line vty 0 4" with password and login.'
    },
    visualExplanation: {
      title: 'Telnet Remote Management Session',
      description: 'TCP Port 23 connection established from Remote-PC to router VTY lines.',
      steps: [
        { step: 1, label: 'TCP Handshake', source: 'Remote-PC', target: 'Core-Router', layer: 'Transport (L4)', detail: 'Remote-PC initiates TCP 3-way handshake to router IP 192.168.1.1 on Port 23.' },
        { step: 2, label: 'VTY Banner & Password', source: 'Core-Router', target: 'Remote-PC', layer: 'Application (L7)', detail: 'Router prompts for "User Access Verification - Password:".' },
        { step: 3, label: 'Privileged Access', source: 'Remote-PC', target: 'Core-Router', layer: 'Application (L7)', detail: 'User enters enable secret password to gain full configuration control.' }
      ]
    },
    resources: {
      referenceUrl: 'https://www.geeksforgeeks.org/computer-networks/introduction-to-telnet/',
      referenceTitle: 'GeeksforGeeks - Telnet Protocol',
      referenceSource: 'GeeksforGeeks',
      geeksForGeeksUrl: 'https://www.geeksforgeeks.org/telnet-protocol/',
      geeksForGeeksTitle: 'GeeksforGeeks Telnet Guide',
      youtubeUrl: 'https://www.youtube.com/watch?v=N4tL1m0Z5Z4',
      youtubeTitle: 'Configuring Telnet on Cisco Routers in Packet Tracer',
      youtubeChannel: 'NetworkChuck'
    },
    vivaQuestions: [
      { question: 'What transport protocol and port number are used by Telnet?', answer: 'TCP Port 23.' },
      { question: 'Why will a Telnet user be unable to enter privileged EXEC mode if "enable secret" is not configured on the router?', answer: 'Cisco IOS blocks remote VTY users from entering privileged mode without an enable password to prevent unauthorized takeover.' }
    ]
  }
];
