import { AcademicExperiment } from './types';

export const LABS_PART_1: AcademicExperiment[] = [
  // -------------------------------------------------------------
  // LAB 1: Introduction to Packet Tracer, Peer to Peer communication, study of cables and its colour codes
  // -------------------------------------------------------------
  {
    id: 'exp-1',
    number: 1,
    title: 'Lab 1: Introduction to Packet Tracer, Peer to Peer Communication & Cable Color Codes',
    category: 'Fundamentals',
    aim: 'To understand the Cisco Packet Tracer GUI, configure peer-to-peer communication between two workstations, and study Ethernet cable standards (T568A vs T568B) and pinouts.',
    apparatus: ['2 Workstation PCs (PC0, PC1)', 'Copper Crossover Cable / Straight-Through Cable', 'Packet Tracer Simulation Engine'],
    background: 'In Peer-to-Peer communication, two hosts communicate directly without an intermediary switch. \n• EIA/TIA 568A: White-Green, Green, White-Orange, Blue, White-Blue, Orange, White-Brown, Brown.\n• EIA/TIA 568B: White-Orange, Orange, White-Green, Blue, White-Blue, Green, White-Brown, Brown.\n• Straight-Through Cable: Both ends terminate in identical standard (568B to 568B) used to connect unlike devices (PC to Switch).\n• Crossover Cable: One end 568A, other end 568B (pins 1,2 swap with 3,6) used to connect like devices directly (PC to PC, Switch to Switch). Modern Auto-MDIX automatically detects and configures pairs.',
    initialTopology: {
      devices: [
        {
          id: 'l1-pc0',
          name: 'PC0',
          type: 'pc',
          model: 'PC-PT',
          x: 180,
          y: 200,
          powerState: 'on',
          interfaces: [{ id: 'l1-pc0-fa0', name: 'FastEthernet0', ip: '192.168.1.10', subnetMask: '255.255.255.0', mac: '00:01:42:01:00:10', status: 'up' }],
          configMode: 'static',
        },
        {
          id: 'l1-pc1',
          name: 'PC1',
          type: 'pc',
          model: 'PC-PT',
          x: 480,
          y: 200,
          powerState: 'on',
          interfaces: [{ id: 'l1-pc1-fa0', name: 'FastEthernet0', ip: '192.168.1.20', subnetMask: '255.255.255.0', mac: '00:01:42:01:00:20', status: 'up' }],
          configMode: 'static',
        }
      ],
      links: [
        { id: 'l1-link', sourceDeviceId: 'l1-pc0', sourcePortId: 'l1-pc0-fa0', targetDeviceId: 'l1-pc1', targetPortId: 'l1-pc1-fa0', cableType: 'crossover', status: 'up' }
      ]
    },
    procedureSteps: [
      '1. Drag two PC workstations onto the workspace canvas.',
      '2. Select a Copper Crossover Cable (or auto-connect) to link PC0 FastEthernet0 to PC1 FastEthernet0.',
      '3. Open PC0 Desktop -> IP Configuration; assign IPv4 address 192.168.1.10, mask 255.255.255.0.',
      '4. Open PC1 Desktop -> IP Configuration; assign IPv4 address 192.168.1.20, mask 255.255.255.0.',
      '5. Open PC0 Command Prompt and execute "ping 192.168.1.20". Verify 0% packet loss.',
      '6. Inspect ARP cache using "arp -a" to view the discovered MAC address.'
    ],
    cliCommands: [
      'PC0> ipconfig',
      'PC0> ping 192.168.1.20',
      'PC0> arp -a'
    ],
    verificationCheck: {
      description: 'Check that both PCs have valid IPs on the same subnet and link status is up.',
      isPassed: (devices, links) => {
        const pc0 = devices.find(d => d.name === 'PC0');
        const pc1 = devices.find(d => d.name === 'PC1');
        return !!(pc0 && pc1 && pc0.interfaces[0]?.ip && pc1.interfaces[0]?.ip && links.length > 0);
      },
      hint: 'Ensure PC0 and PC1 are configured with IP addresses on the 192.168.1.0/24 subnet and connected.'
    },
    visualExplanation: {
      title: 'Peer-to-Peer ICMP Ping Exchange',
      description: 'Demonstrates direct peer transmission with ARP resolution and ICMP Echo Request/Reply.',
      steps: [
        { step: 1, label: 'ARP Request', source: 'PC0', target: 'PC1', layer: 'Data Link (L2)', detail: 'PC0 broadcasts ARP request: "Who has 192.168.1.20? Tell 192.168.1.10"' },
        { step: 2, label: 'ARP Reply', source: 'PC1', target: 'PC0', layer: 'Data Link (L2)', detail: 'PC1 unicasts ARP reply with its MAC address to PC0.' },
        { step: 3, label: 'ICMP Echo Request', source: 'PC0', target: 'PC1', layer: 'Network (L3)', detail: 'PC0 encapsulates IP packet containing ICMP Type 8 Echo Request.' },
        { step: 4, label: 'ICMP Echo Reply', source: 'PC1', target: 'PC0', layer: 'Network (L3)', detail: 'PC1 replies with ICMP Type 0 Echo Reply, confirming reachability.' }
      ]
    },
    resources: {
      referenceUrl: 'https://www.geeksforgeeks.org/computer-networks/computer-network-tutorials/',
      referenceTitle: 'GeeksforGeeks - Computer Network Tutorial',
      referenceSource: 'GeeksforGeeks',
      geeksForGeeksUrl: 'https://www.geeksforgeeks.org/computer-network-tutorial/',
      geeksForGeeksTitle: 'GeeksforGeeks Computer Network Tutorial',
      youtubeUrl: 'https://www.youtube.com/watch?v=1u_G5g-V4Gk',
      youtubeTitle: 'Packet Tracer Basics & Cable Color Codes',
      youtubeChannel: 'NetworkChuck'
    },
    vivaQuestions: [
      { question: 'What is the color code sequence for T568B standard RJ-45 termination?', answer: 'White-Orange, Orange, White-Green, Blue, White-Blue, Green, White-Brown, Brown.' },
      { question: 'When is a crossover cable required instead of a straight-through cable?', answer: 'When connecting two like devices directly (e.g. PC to PC, Router to Router, Switch to Switch) without Auto-MDIX.' }
    ]
  },

  // -------------------------------------------------------------
  // LAB 2: Implementation of Network Topologies
  // -------------------------------------------------------------
  {
    id: 'exp-2',
    number: 2,
    title: 'Lab 2: Implementation of Network Topologies',
    category: 'Topologies',
    aim: 'To design, build, and verify Star, Bus, and Ring topologies in Cisco Packet Tracer and analyze fault tolerance and broadcast domains.',
    apparatus: ['4 Workstation PCs (PC0, PC1, PC2, PC3)', '1 Cisco Catalyst 2960 Switch', 'Copper Straight-Through Cables'],
    background: 'Network topologies define the structural arrangement of transmission links and devices. Star topology connects all devices to a central switch. Full mesh connects every pair of nodes directly ($n(n-1)/2$ links). In Star topology, a broken cable disconnects only one host, while the central switch maintains communication among remaining hosts.',
    initialTopology: {
      devices: [
        {
          id: 'l2-sw0',
          name: 'Switch0',
          type: 'switch',
          model: '2960-24TT',
          x: 340,
          y: 200,
          powerState: 'on',
          interfaces: [
            { id: 'l2-sw-fa1', name: 'FastEthernet0/1', mac: '00:SW:02:00:00:01', status: 'up' },
            { id: 'l2-sw-fa2', name: 'FastEthernet0/2', mac: '00:SW:02:00:00:02', status: 'up' },
            { id: 'l2-sw-fa3', name: 'FastEthernet0/3', mac: '00:SW:02:00:00:03', status: 'up' },
            { id: 'l2-sw-fa4', name: 'FastEthernet0/4', mac: '00:SW:02:00:00:04', status: 'up' }
          ]
        },
        {
          id: 'l2-pc0',
          name: 'PC0',
          type: 'pc',
          model: 'PC-PT',
          x: 160,
          y: 100,
          powerState: 'on',
          interfaces: [{ id: 'l2-pc0-fa0', name: 'FastEthernet0', ip: '192.168.1.1', subnetMask: '255.255.255.0', mac: '00:PC:02:00:00:01', status: 'up' }]
        },
        {
          id: 'l2-pc1',
          name: 'PC1',
          type: 'pc',
          model: 'PC-PT',
          x: 520,
          y: 100,
          powerState: 'on',
          interfaces: [{ id: 'l2-pc1-fa0', name: 'FastEthernet0', ip: '192.168.1.2', subnetMask: '255.255.255.0', mac: '00:PC:02:00:00:02', status: 'up' }]
        },
        {
          id: 'l2-pc2',
          name: 'PC2',
          type: 'pc',
          model: 'PC-PT',
          x: 160,
          y: 300,
          powerState: 'on',
          interfaces: [{ id: 'l2-pc2-fa0', name: 'FastEthernet0', ip: '192.168.1.3', subnetMask: '255.255.255.0', mac: '00:PC:02:00:00:03', status: 'up' }]
        },
        {
          id: 'l2-pc3',
          name: 'PC3',
          type: 'pc',
          model: 'PC-PT',
          x: 520,
          y: 300,
          powerState: 'on',
          interfaces: [{ id: 'l2-pc3-fa0', name: 'FastEthernet0', ip: '192.168.1.4', subnetMask: '255.255.255.0', mac: '00:PC:02:00:00:04', status: 'up' }]
        }
      ],
      links: [
        { id: 'l2-l1', sourceDeviceId: 'l2-pc0', sourcePortId: 'l2-pc0-fa0', targetDeviceId: 'l2-sw0', targetPortId: 'l2-sw-fa1', cableType: 'straight', status: 'up' },
        { id: 'l2-l2', sourceDeviceId: 'l2-pc1', sourcePortId: 'l2-pc1-fa0', targetDeviceId: 'l2-sw0', targetPortId: 'l2-sw-fa2', cableType: 'straight', status: 'up' },
        { id: 'l2-l3', sourceDeviceId: 'l2-pc2', sourcePortId: 'l2-pc2-fa0', targetDeviceId: 'l2-sw0', targetPortId: 'l2-sw-fa3', cableType: 'straight', status: 'up' },
        { id: 'l2-l4', sourceDeviceId: 'l2-pc3', sourcePortId: 'l2-pc3-fa0', targetDeviceId: 'l2-sw0', targetPortId: 'l2-sw-fa4', cableType: 'straight', status: 'up' }
      ]
    },
    procedureSteps: [
      '1. Place 1 Cisco 2960 switch in the center and 4 PCs around it.',
      '2. Connect each PC to a switch FastEthernet port using straight-through cables.',
      '3. Assign IP addresses 192.168.1.1 through 192.168.1.4 (/24) to the PCs.',
      '4. Execute ping tests between all nodes to verify full reachability.',
      '5. Disconnect one cable to observe that other 3 nodes continue communicating uninterrupted.'
    ],
    cliCommands: [
      'Switch> enable',
      'Switch# show mac address-table',
      'PC0> ping 192.168.1.4'
    ],
    verificationCheck: {
      description: 'Check that 4 PCs are linked to the central switch and configured with IP addresses.',
      isPassed: (devices, links) => links.length >= 4 && devices.filter(d => d.type === 'pc').length >= 4,
      hint: 'Connect at least 4 PCs to the central switch and assign IPs on the 192.168.1.0/24 subnet.'
    },
    visualExplanation: {
      title: 'Star Topology Frame Switching',
      description: 'Central switch inspects destination MAC address and forwards frames directly to destination port.',
      steps: [
        { step: 1, label: 'Frame Ingress', source: 'PC0', target: 'Switch0', layer: 'Data Link (L2)', detail: 'PC0 sends unicast Ethernet frame destined for PC3.' },
        { step: 2, label: 'CAM Table Lookup', source: 'Switch0', target: 'Switch0', layer: 'Data Link (L2)', detail: 'Switch looks up PC3 MAC address in its MAC address table (CAM).' },
        { step: 3, label: 'Selective Forward', source: 'Switch0', target: 'PC3', layer: 'Data Link (L2)', detail: 'Frame is switched exclusively out Fa0/4 without broadcasting to PC1 or PC2.' }
      ]
    },
    resources: {
      referenceUrl: 'https://www.geeksforgeeks.org/types-of-network-topology/',
      referenceTitle: 'GeeksforGeeks - Types of Network Topology',
      referenceSource: 'GeeksforGeeks',
      geeksForGeeksUrl: 'https://www.geeksforgeeks.org/types-of-network-topology/',
      geeksForGeeksTitle: 'GeeksforGeeks Types of Network Topology',
      youtubeUrl: 'https://www.youtube.com/watch?v=zbqrNg4C98U',
      youtubeTitle: 'Network Topologies Explained',
      youtubeChannel: 'Neso Academy'
    },
    vivaQuestions: [
      { question: 'What is the formula for the number of links in a full mesh network of n devices?', answer: 'n(n - 1) / 2.' },
      { question: 'What is the main advantage of Star topology over Bus topology?', answer: 'Failure of a single cable affects only that connected host and does not halt network communication.' }
    ]
  },

  // -------------------------------------------------------------
  // LAB 3: Router Configuration (Creating Passwords, Configuring Interfaces)
  // -------------------------------------------------------------
  {
    id: 'exp-3',
    number: 3,
    title: 'Lab 3: Router Configuration (Creating Passwords, Configuring Interfaces)',
    category: 'Fundamentals',
    aim: 'To configure a Cisco 1941/2911 router from initial prompt: set hostname, configure privileged enable secret passwords, console/VTY passwords, and configure IP addresses on GigabitEthernet interfaces with "no shutdown".',
    apparatus: ['1 Cisco 1941 Router', '1 Workstation PC', '1 Console Rollover Cable', '1 Copper Straight-Through Cable'],
    background: 'Cisco IOS employs hierarchical command modes: User EXEC (`Router>`), Privileged EXEC (`Router#`), Global Configuration (`Router(config)#`), and Interface Configuration (`Router(config-if)#`). Security best practices mandate encrypting privileged access with `enable secret` (MD5/SHA-256) rather than plaintext `enable password`, and configuring console and VTY lines.',
    initialTopology: {
      devices: [
        {
          id: 'l3-r0',
          name: 'Router0',
          type: 'router',
          model: '1941',
          x: 440,
          y: 200,
          powerState: 'on',
          interfaces: [
            { id: 'l3-r0-gi0', name: 'GigabitEthernet0/0', ip: '192.168.1.1', subnetMask: '255.255.255.0', mac: '00:RR:03:00:00:01', status: 'up' },
            { id: 'l3-r0-gi1', name: 'GigabitEthernet0/1', mac: '00:RR:03:00:00:02', status: 'down' }
          ]
        },
        {
          id: 'l3-pc0',
          name: 'Admin-PC',
          type: 'pc',
          model: 'PC-PT',
          x: 180,
          y: 200,
          powerState: 'on',
          defaultGateway: '192.168.1.1',
          interfaces: [{ id: 'l3-pc0-fa0', name: 'FastEthernet0', ip: '192.168.1.10', subnetMask: '255.255.255.0', mac: '00:PC:03:00:00:01', status: 'up' }]
        }
      ],
      links: [
        { id: 'l3-l1', sourceDeviceId: 'l3-pc0', sourcePortId: 'l3-pc0-fa0', targetDeviceId: 'l3-r0', targetPortId: 'l3-r0-gi0', cableType: 'straight', status: 'up' }
      ]
    },
    procedureSteps: [
      '1. Connect Admin-PC to Router0 GigabitEthernet0/0.',
      '2. Click Router0 -> CLI tab. Enter "enable" to enter privileged mode.',
      '3. Enter "configure terminal". Change hostname using "hostname Branch-R1".',
      '4. Secure privileged mode: "enable secret CiscoSecret123".',
      '5. Secure console line: "line console 0" -> "password ConPass123" -> "login".',
      '6. Configure interface: "interface GigabitEthernet0/0" -> "ip address 192.168.1.1 255.255.255.0" -> "no shutdown".',
      '7. Verify interface status using "show ip interface brief".'
    ],
    cliCommands: [
      'Router> enable',
      'Router# configure terminal',
      'Router(config)# hostname Branch-R1',
      'Branch-R1(config)# enable secret CiscoSecret123',
      'Branch-R1(config)# line console 0',
      'Branch-R1(config-line)# password ConPass123',
      'Branch-R1(config-line)# login',
      'Branch-R1(config-line)# exit',
      'Branch-R1(config)# interface GigabitEthernet0/0',
      'Branch-R1(config-if)# ip address 192.168.1.1 255.255.255.0',
      'Branch-R1(config-if)# no shutdown',
      'Branch-R1(config-if)# end',
      'Branch-R1# show ip interface brief'
    ],
    verificationCheck: {
      description: 'Check that router interface is configured with IP and brought up using no shutdown.',
      isPassed: (devices) => {
        const r0 = devices.find(d => d.type === 'router');
        return !!(r0 && r0.interfaces.some(i => i.ip === '192.168.1.1' && i.status === 'up'));
      },
      hint: 'Configure GigabitEthernet0/0 with 192.168.1.1 and issue "no shutdown".'
    },
    visualExplanation: {
      title: 'Cisco IOS Configuration Hierarchy',
      description: 'Demonstrates navigation through User EXEC, Privileged EXEC, and Global Config modes.',
      steps: [
        { step: 1, label: 'User Mode', source: 'Admin', target: 'Router', layer: 'CLI Mode', detail: 'Prompt: Router> (Basic monitoring commands).' },
        { step: 2, label: 'Privileged Mode', source: 'Admin', target: 'Router', layer: 'CLI Mode', detail: 'Prompt: Router# (Entered via "enable", view and debug configs).' },
        { step: 3, label: 'Global Config', source: 'Admin', target: 'Router', layer: 'CLI Mode', detail: 'Prompt: Router(config)# (Configures hostnames, passwords, protocols).' },
        { step: 4, label: 'Interface Config', source: 'Admin', target: 'Router', layer: 'CLI Mode', detail: 'Prompt: Router(config-if)# (Assigns IP address and executes "no shutdown").' }
      ]
    },
    resources: {
      referenceUrl: 'https://www.geeksforgeeks.org/computer-networks/network-devices-hub-repeater-bridge-switch-router-gateways/',
      referenceTitle: 'GeeksforGeeks - Network Devices (Hub, Switch, Router & Gateway)',
      referenceSource: 'GeeksforGeeks',
      geeksForGeeksUrl: 'https://www.geeksforgeeks.org/network-devices-hub-switch-router-gateway/',
      geeksForGeeksTitle: 'GeeksforGeeks Network Device Guide',
      youtubeUrl: 'https://www.youtube.com/watch?v=0k9r9a5Y5Lw',
      youtubeTitle: 'Cisco Router Initial Setup & Passwords',
      youtubeChannel: 'NetworkChuck'
    },
    vivaQuestions: [
      { question: 'Why is "enable secret" preferred over "enable password" in Cisco IOS?', answer: 'Because "enable secret" encrypts the password with a cryptographic hash (MD5/SHA), while "enable password" is stored in clear text.' },
      { question: 'What is the purpose of the "no shutdown" command on a router interface?', answer: 'Cisco router interfaces are administratively down by default; "no shutdown" changes the interface operational state to up.' }
    ]
  },

  // -------------------------------------------------------------
  // LAB 4: IP addressing and Sub netting (VLSM)
  // -------------------------------------------------------------
  {
    id: 'exp-4',
    number: 4,
    title: 'Lab 4: IP Addressing and Subnetting (VLSM)',
    category: 'Subnetting',
    aim: 'To calculate and implement Variable Length Subnet Masking (VLSM) for an enterprise network topology with varying host requirements (60 hosts, 30 hosts, 14 hosts, and 2-host WAN links).',
    apparatus: ['2 Cisco 1941 Routers', '2 Cisco 2960 Switches', '4 Workstation PCs', 'Serial & Copper Straight Cables'],
    background: 'VLSM enables assigning variable subnet masks to subnets derived from a single classful block (192.168.1.0/24). Requirements: Subnet A (60 hosts -> /26, mask 255.255.255.192, 62 hosts), Subnet B (30 hosts -> /27, mask 255.255.255.224, 30 hosts), Subnet C (14 hosts -> /28, mask 255.255.255.240, 14 hosts), Subnet D (WAN link 2 hosts -> /30, mask 255.255.255.252, 2 hosts).',
    initialTopology: {
      devices: [
        {
          id: 'l4-r1',
          name: 'Router1',
          type: 'router',
          model: '1941',
          x: 320,
          y: 200,
          powerState: 'on',
          interfaces: [
            { id: 'l4-r1-gi0', name: 'GigabitEthernet0/0', ip: '192.168.1.1', subnetMask: '255.255.255.192', mac: '00:RR:04:00:00:01', status: 'up' },
            { id: 'l4-r1-se0', name: 'Serial0/0/0', ip: '192.168.1.193', subnetMask: '255.255.255.252', mac: '00:SE:04:00:00:01', status: 'up', clockRate: 64000 }
          ]
        },
        {
          id: 'l4-r2',
          name: 'Router2',
          type: 'router',
          model: '1941',
          x: 520,
          y: 200,
          powerState: 'on',
          interfaces: [
            { id: 'l4-r2-gi0', name: 'GigabitEthernet0/0', ip: '192.168.1.65', subnetMask: '255.255.255.224', mac: '00:RR:04:00:00:02', status: 'up' },
            { id: 'l4-r2-se0', name: 'Serial0/0/0', ip: '192.168.1.194', subnetMask: '255.255.255.252', mac: '00:SE:04:00:00:02', status: 'up' }
          ]
        },
        {
          id: 'l4-pc1',
          name: 'PC-SubA',
          type: 'pc',
          model: 'PC-PT',
          x: 160,
          y: 200,
          powerState: 'on',
          defaultGateway: '192.168.1.1',
          interfaces: [{ id: 'l4-pc1-fa0', name: 'FastEthernet0', ip: '192.168.1.10', subnetMask: '255.255.255.192', mac: '00:PC:04:00:00:01', status: 'up' }]
        },
        {
          id: 'l4-pc2',
          name: 'PC-SubB',
          type: 'pc',
          model: 'PC-PT',
          x: 680,
          y: 200,
          powerState: 'on',
          defaultGateway: '192.168.1.65',
          interfaces: [{ id: 'l4-pc2-fa0', name: 'FastEthernet0', ip: '192.168.1.70', subnetMask: '255.255.255.224', mac: '00:PC:04:00:00:02', status: 'up' }]
        }
      ],
      links: [
        { id: 'l4-l1', sourceDeviceId: 'l4-pc1', sourcePortId: 'l4-pc1-fa0', targetDeviceId: 'l4-r1', targetPortId: 'l4-r1-gi0', cableType: 'straight', status: 'up' },
        { id: 'l4-l2', sourceDeviceId: 'l4-r1', sourcePortId: 'l4-r1-se0', targetDeviceId: 'l4-r2', targetPortId: 'l4-r2-se0', cableType: 'serial', status: 'up' },
        { id: 'l4-l3', sourceDeviceId: 'l4-r2', sourcePortId: 'l4-r2-gi0', targetDeviceId: 'l4-pc2', targetPortId: 'l4-pc2-fa0', cableType: 'straight', status: 'up' }
      ]
    },
    procedureSteps: [
      '1. Order subnets descending by host requirement: Subnet A (60 hosts), Subnet B (30 hosts), Subnet C (14 hosts), WAN (2 hosts).',
      '2. Subnet A: 192.168.1.0/26 (Mask 255.255.255.192, Range .1 to .62).',
      '3. Subnet B: 192.168.1.64/27 (Mask 255.255.255.224, Range .65 to .94).',
      '4. WAN Link: 192.168.1.192/30 (Mask 255.255.255.252, Range .193 and .194).',
      '5. Configure Router1 Gi0/0 with 192.168.1.1 255.255.255.192 and Serial0/0/0 with 192.168.1.193 255.255.255.252.',
      '6. Configure Router2 Gi0/0 with 192.168.1.65 255.255.255.224 and Serial0/0/0 with 192.168.1.194 255.255.255.252.',
      '7. Test ping from PC-SubA to PC-SubB after adding static routes.'
    ],
    cliCommands: [
      'Router1(config)# interface GigabitEthernet0/0',
      'Router1(config-if)# ip address 192.168.1.1 255.255.255.192',
      'Router1(config-if)# no shutdown',
      'Router1(config)# interface Serial0/0/0',
      'Router1(config-if)# ip address 192.168.1.193 255.255.255.252',
      'Router1(config-if)# clock rate 64000',
      'Router1(config-if)# no shutdown'
    ],
    verificationCheck: {
      description: 'Check that routers have distinct VLSM masks configured (/26, /27, /30).',
      isPassed: (devices) => {
        const r1 = devices.find(d => d.name === 'Router1');
        return !!(r1 && r1.interfaces.some(i => i.subnetMask === '255.255.255.192'));
      },
      hint: 'Configure Router1 Gi0/0 with mask 255.255.255.192 (/26).'
    },
    visualExplanation: {
      title: 'VLSM Address Allocation',
      description: 'Hierarchical division of 192.168.1.0/24 into /26, /27, and /30 subnets.',
      steps: [
        { step: 1, label: 'Subnet A (/26)', source: 'Pool', target: 'LAN A', layer: 'Network (L3)', detail: '192.168.1.0/26 allocates 62 usable addresses for 60 hosts.' },
        { step: 2, label: 'Subnet B (/27)', source: 'Pool', target: 'LAN B', layer: 'Network (L3)', detail: '192.168.1.64/27 allocates 30 usable addresses for 30 hosts.' },
        { step: 3, label: 'WAN Link (/30)', source: 'Pool', target: 'Serial', layer: 'Network (L3)', detail: '192.168.1.192/30 allocates exactly 2 usable addresses (.193, .194) for router link.' }
      ]
    },
    resources: {
      referenceUrl: 'https://www.geeksforgeeks.org/computer-networks/structure-and-types-of-ip-address/',
      referenceTitle: 'GeeksforGeeks - IP Addressing & Subnetting',
      referenceSource: 'GeeksforGeeks',
      geeksForGeeksUrl: 'https://www.geeksforgeeks.org/ip-addressing/',
      geeksForGeeksTitle: 'GeeksforGeeks IP Addressing Guide',
      youtubeUrl: 'https://www.youtube.com/watch?v=s_Ntt6eTn94',
      youtubeTitle: 'VLSM Subnetting Step by Step',
      youtubeChannel: 'NetworkChuck'
    },
    vivaQuestions: [
      { question: 'What is the primary benefit of VLSM over FLSM?', answer: 'VLSM prevents IP address exhaustion by tailoring subnet mask lengths to the exact host requirements of each subnetwork.' },
      { question: 'What is the optimal subnet mask for a two-router serial connection?', answer: '/30 (255.255.255.252), which provides exactly two usable host IP addresses.' }
    ]
  },

  // -------------------------------------------------------------
  // LAB 5: Static and Default Routing
  // -------------------------------------------------------------
  {
    id: 'exp-5',
    number: 5,
    title: 'Lab 5: Static and Default Routing',
    category: 'Routing',
    aim: 'To configure static routes and a default gateway route across multiple routers using Cisco IOS "ip route" commands.',
    apparatus: ['2 Cisco 1941 Routers with HWIC-2T cards', '2 Catalyst 2960 Switches', '2 Workstation PCs', 'Smart Serial DCE/DTE Cables'],
    background: 'Static routing manually specifies next-hop addresses for remote networks: `ip route <network> <mask> <next-hop>`. Default routing (`ip route 0.0.0.0 0.0.0.0 <next-hop>`) defines a gateway of last resort matching all packets without an explicit table entry. Administrative Distance for static routes is 1.',
    initialTopology: {
      devices: [
        {
          id: 'l5-r1',
          name: 'Router0',
          type: 'router',
          model: '1941',
          x: 320,
          y: 200,
          powerState: 'on',
          interfaces: [
            { id: 'l5-r1-gi0', name: 'GigabitEthernet0/0', ip: '192.168.1.1', subnetMask: '255.255.255.0', mac: '00:RR:05:00:00:01', status: 'up' },
            { id: 'l5-r1-se0', name: 'Serial0/0/0', ip: '10.0.0.1', subnetMask: '255.255.255.252', mac: '00:SE:05:00:00:01', status: 'up', clockRate: 64000 }
          ],
          routingTable: [
            { id: 'l5-rt1', destinationNetwork: '192.168.2.0', subnetMask: '255.255.255.0', nextHop: '10.0.0.2', interfaceName: 'Se0/0/0', type: 'S' }
          ]
        },
        {
          id: 'l5-r2',
          name: 'Router1',
          type: 'router',
          model: '1941',
          x: 540,
          y: 200,
          powerState: 'on',
          interfaces: [
            { id: 'l5-r2-gi0', name: 'GigabitEthernet0/0', ip: '192.168.2.1', subnetMask: '255.255.255.0', mac: '00:RR:05:00:00:02', status: 'up' },
            { id: 'l5-r2-se0', name: 'Serial0/0/0', ip: '10.0.0.2', subnetMask: '255.255.255.252', mac: '00:SE:05:00:00:02', status: 'up' }
          ],
          routingTable: [
            { id: 'l5-rt2', destinationNetwork: '0.0.0.0', subnetMask: '0.0.0.0', nextHop: '10.0.0.1', interfaceName: 'Se0/0/0', type: 'S*' }
          ]
        },
        {
          id: 'l5-pc0',
          name: 'PC0',
          type: 'pc',
          model: 'PC-PT',
          x: 140,
          y: 200,
          powerState: 'on',
          defaultGateway: '192.168.1.1',
          interfaces: [{ id: 'l5-pc0-fa0', name: 'FastEthernet0', ip: '192.168.1.10', subnetMask: '255.255.255.0', mac: '00:PC:05:00:00:01', status: 'up' }]
        },
        {
          id: 'l5-pc1',
          name: 'PC1',
          type: 'pc',
          model: 'PC-PT',
          x: 720,
          y: 200,
          powerState: 'on',
          defaultGateway: '192.168.2.1',
          interfaces: [{ id: 'l5-pc1-fa0', name: 'FastEthernet0', ip: '192.168.2.10', subnetMask: '255.255.255.0', mac: '00:PC:05:00:00:02', status: 'up' }]
        }
      ],
      links: [
        { id: 'l5-l1', sourceDeviceId: 'l5-pc0', sourcePortId: 'l5-pc0-fa0', targetDeviceId: 'l5-r1', targetPortId: 'l5-r1-gi0', cableType: 'straight', status: 'up' },
        { id: 'l5-l2', sourceDeviceId: 'l5-r1', sourcePortId: 'l5-r1-se0', targetDeviceId: 'l5-r2', targetPortId: 'l5-r2-se0', cableType: 'serial', status: 'up' },
        { id: 'l5-l3', sourceDeviceId: 'l5-r2', sourcePortId: 'l5-r2-gi0', targetDeviceId: 'l5-pc1', targetPortId: 'l5-pc1-fa0', cableType: 'straight', status: 'up' }
      ]
    },
    procedureSteps: [
      '1. Connect Router0 to Router1 via Serial0/0/0 DCE cable. Set clock rate 64000 on DCE interface.',
      '2. Assign IP 10.0.0.1/30 to Router0 Se0/0/0 and 10.0.0.2/30 to Router1 Se0/0/0.',
      '3. On Router0, configure static route to LAN 2: "ip route 192.168.2.0 255.255.255.0 10.0.0.2".',
      '4. On Router1, configure default route: "ip route 0.0.0.0 0.0.0.0 10.0.0.1".',
      '5. Verify routing tables using "show ip route" on both routers.',
      '6. Test end-to-end ping from PC0 (192.168.1.10) to PC1 (192.168.2.10).'
    ],
    cliCommands: [
      'Router0(config)# ip route 192.168.2.0 255.255.255.0 10.0.0.2',
      'Router1(config)# ip route 0.0.0.0 0.0.0.0 10.0.0.1',
      'Router0# show ip route'
    ],
    verificationCheck: {
      description: 'Check that static routes are installed in the routing tables.',
      isPassed: (devices) => {
        const r0 = devices.find(d => d.name === 'Router0');
        return !!(r0 && r0.routingTable && r0.routingTable.some(r => r.type === 'S'));
      },
      hint: 'Configure static route on Router0 pointing to 192.168.2.0/24 via 10.0.0.2.'
    },
    visualExplanation: {
      title: 'Static Route Forwarding',
      description: 'Hop-by-hop packet forwarding using next-hop IP lookup in static routing tables.',
      steps: [
        { step: 1, label: 'Default Gateway', source: 'PC0', target: 'Router0', layer: 'Network (L3)', detail: 'PC0 forwards packet destined for 192.168.2.10 to default gateway 192.168.1.1.' },
        { step: 2, label: 'Static Route Match', source: 'Router0', target: 'Router1', layer: 'Network (L3)', detail: 'Router0 matches route 192.168.2.0/24 -> next hop 10.0.0.2 out Se0/0/0.' },
        { step: 3, label: 'Delivery', source: 'Router1', target: 'PC1', layer: 'Network (L3)', detail: 'Router1 forwards directly to directly connected PC1 on Gi0/0.' }
      ]
    },
    resources: {
      referenceUrl: 'https://www.geeksforgeeks.org/what-is-routing/',
      referenceTitle: 'GeeksforGeeks - What is Routing?',
      referenceSource: 'GeeksforGeeks',
      geeksForGeeksUrl: 'https://www.geeksforgeeks.org/what-is-routing/',
      geeksForGeeksTitle: 'GeeksforGeeks Routing Guide',
      youtubeUrl: 'https://www.youtube.com/watch?v=Xh3hW-d4_1k',
      youtubeTitle: 'Static Route Configuration in Packet Tracer',
      youtubeChannel: 'Neso Academy'
    },
    vivaQuestions: [
      { question: 'What is the administrative distance of a statically configured route?', answer: '1 (trusted ahead of all dynamic protocols except directly connected links).' },
      { question: 'What is a Gateway of Last Resort in router configurations?', answer: 'A default route (0.0.0.0/0) that forwards all packets whose destination address has no explicit match in the routing table.' }
    ]
  }
];
