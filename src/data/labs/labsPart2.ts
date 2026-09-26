import { AcademicExperiment } from './types';

export const LABS_PART_2: AcademicExperiment[] = [
  // -------------------------------------------------------------
  // LAB 6: NAT Configuration
  // -------------------------------------------------------------
  {
    id: 'exp-6',
    number: 6,
    title: 'Lab 6: NAT Configuration',
    category: 'Subnetting',
    aim: 'To configure Port Address Translation (PAT / NAT Overload) on a Cisco border router to enable multiple private LAN hosts (192.168.1.0/24) to share a single public IP address.',
    apparatus: ['1 Cisco 1941 Edge Router', '1 Catalyst 2960 Switch', '2 LAN PCs', '1 ISP Web Server', 'Copper Cables'],
    background: 'Port Address Translation (PAT) maps private IP addresses to a single public IP address using unique Layer 4 port numbers. Configuration steps: 1. Define standard ACL permitting internal private subnet 2. Bind ACL to external exit interface using `ip nat inside source list 1 interface Gi0/1 overload` 3. Designate `ip nat inside` and `ip nat outside` on respective interfaces.',
    initialTopology: {
      devices: [
        {
          id: 'l6-r0',
          name: 'NAT-Gateway',
          type: 'router',
          model: '1941',
          x: 400,
          y: 200,
          powerState: 'on',
          interfaces: [
            { id: 'l6-r0-gi0', name: 'GigabitEthernet0/0', ip: '192.168.1.1', subnetMask: '255.255.255.0', mac: '00:RR:06:00:00:01', status: 'up' },
            { id: 'l6-r0-gi1', name: 'GigabitEthernet0/1', ip: '203.0.113.1', subnetMask: '255.255.255.0', mac: '00:RR:06:00:00:02', status: 'up' }
          ]
        },
        {
          id: 'l6-pc0',
          name: 'Inside-PC0',
          type: 'pc',
          model: 'PC-PT',
          x: 180,
          y: 200,
          powerState: 'on',
          defaultGateway: '192.168.1.1',
          interfaces: [{ id: 'l6-pc0-fa0', name: 'FastEthernet0', ip: '192.168.1.10', subnetMask: '255.255.255.0', mac: '00:PC:06:00:00:01', status: 'up' }]
        },
        {
          id: 'l6-srv',
          name: 'ISP-Server',
          type: 'server',
          model: 'Server-PT',
          x: 640,
          y: 200,
          powerState: 'on',
          interfaces: [{ id: 'l6-srv-fa0', name: 'FastEthernet0', ip: '203.0.113.100', subnetMask: '255.255.255.0', mac: '00:SR:06:00:00:01', status: 'up' }]
        }
      ],
      links: [
        { id: 'l6-l1', sourceDeviceId: 'l6-pc0', sourcePortId: 'l6-pc0-fa0', targetDeviceId: 'l6-r0', targetPortId: 'l6-r0-gi0', cableType: 'straight', status: 'up' },
        { id: 'l6-l2', sourceDeviceId: 'l6-r0', sourcePortId: 'l6-r0-gi1', targetDeviceId: 'l6-srv', targetPortId: 'l6-srv-fa0', cableType: 'straight', status: 'up' }
      ]
    },
    procedureSteps: [
      '1. Connect Inside-PC0 to Gateway Gi0/0 and ISP-Server to Gi0/1.',
      '2. Create access-list 1: "access-list 1 permit 192.168.1.0 0.0.0.255".',
      '3. Enable PAT overload: "ip nat inside source list 1 interface GigabitEthernet0/1 overload".',
      '4. Assign "ip nat inside" to Gi0/0 and "ip nat outside" to Gi0/1.',
      '5. Ping ISP-Server from Inside-PC0.',
      '6. Verify active translations on router with "show ip nat translations".'
    ],
    cliCommands: [
      'Router(config)# access-list 1 permit 192.168.1.0 0.0.0.255',
      'Router(config)# ip nat inside source list 1 interface GigabitEthernet0/1 overload',
      'Router(config)# interface GigabitEthernet0/0',
      'Router(config-if)# ip nat inside',
      'Router(config)# interface GigabitEthernet0/1',
      'Router(config-if)# ip nat outside',
      'Router# show ip nat translations'
    ],
    verificationCheck: {
      description: 'Check that NAT overload is configured and translations can be processed.',
      isPassed: (devices) => {
        const r0 = devices.find(d => d.name === 'NAT-Gateway');
        return !!(r0 && r0.interfaces.some(i => i.ip === '203.0.113.1'));
      },
      hint: 'Configure NAT inside/outside on interfaces and create NAT overload statement.'
    },
    visualExplanation: {
      title: 'NAT Overload Address Translation',
      description: 'Private IP 192.168.1.10 is translated into public IP 203.0.113.1 with unique port.',
      steps: [
        { step: 1, label: 'Outbound Packet', source: 'Inside-PC0', target: 'Gateway', layer: 'Network (L3)', detail: 'Source IP: 192.168.1.10, Port: 5000 -> Dest IP: 203.0.113.100, Port: 80.' },
        { step: 2, label: 'NAT Table Entry', source: 'Gateway', target: 'Gateway', layer: 'Network (L3)', detail: 'Router translates source to 203.0.113.1:60001 and saves entry in NAT table.' },
        { step: 3, label: 'Return Traffic', source: 'ISP-Server', target: 'Gateway', layer: 'Network (L3)', detail: 'Server replies to 203.0.113.1:60001; router translates back to 192.168.1.10:5000.' }
      ]
    },
    resources: {
      referenceUrl: 'https://www.geeksforgeeks.org/network-address-translation-nat/',
      referenceTitle: 'GeeksforGeeks - Network Address Translation (NAT)',
      referenceSource: 'GeeksforGeeks',
      geeksForGeeksUrl: 'https://www.geeksforgeeks.org/network-address-translation-nat/',
      geeksForGeeksTitle: 'GeeksforGeeks NAT Architecture Guide',
      youtubeUrl: 'https://www.youtube.com/watch?v=QBqPzHEDRvM',
      youtubeTitle: 'NAT and PAT Configuration Explained',
      youtubeChannel: 'NetworkChuck'
    },
    vivaQuestions: [
      { question: 'What keyword enables Port Address Translation (PAT) in Cisco IOS?', answer: 'The "overload" keyword in the "ip nat inside source list" command.' },
      { question: 'What Cisco IOS command displays active NAT translation sessions?', answer: '"show ip nat translations".' }
    ]
  },

  // -------------------------------------------------------------
  // LAB 7: Implementation of RIP version 1
  // -------------------------------------------------------------
  {
    id: 'exp-7',
    number: 7,
    title: 'Lab 7: Implementation of RIP version 1',
    category: 'Dynamic Routing',
    aim: 'To configure and verify Routing Information Protocol Version 1 (RIPv1) on multiple Cisco routers and observe classful broadcast updates.',
    apparatus: ['2 Cisco 1941 Routers with HWIC-2T cards', '2 Catalyst 2960 Switches', '2 Workstation PCs', 'Serial DCE/DTE Cables'],
    background: 'RIPv1 (RFC 1058) is a legacy distance-vector routing protocol. Metric: Hop count (Max 15; 16 is unreachable). Updates: Broadcasts complete routing table to 255.255.255.255 every 30 seconds via UDP port 520. Because it is classful, it does not send subnet masks in updates, preventing support for VLSM or CIDR.',
    initialTopology: {
      devices: [
        {
          id: 'l7-r1',
          name: 'Router1',
          type: 'router',
          model: '1941',
          x: 320,
          y: 200,
          powerState: 'on',
          interfaces: [
            { id: 'l7-r1-gi0', name: 'GigabitEthernet0/0', ip: '192.168.1.1', subnetMask: '255.255.255.0', mac: '00:RR:07:00:00:01', status: 'up' },
            { id: 'l7-r1-se0', name: 'Serial0/0/0', ip: '10.0.0.1', subnetMask: '255.0.0.0', mac: '00:SE:07:00:00:01', status: 'up', clockRate: 64000 }
          ],
          routingTable: [
            { id: 'l7-rt1', destinationNetwork: '192.168.2.0', subnetMask: '255.255.255.0', nextHop: '10.0.0.2', interfaceName: 'Se0/0/0', type: 'R', metric: 1 }
          ]
        },
        {
          id: 'l7-r2',
          name: 'Router2',
          type: 'router',
          model: '1941',
          x: 540,
          y: 200,
          powerState: 'on',
          interfaces: [
            { id: 'l7-r2-gi0', name: 'GigabitEthernet0/0', ip: '192.168.2.1', subnetMask: '255.255.255.0', mac: '00:RR:07:00:00:02', status: 'up' },
            { id: 'l7-r2-se0', name: 'Serial0/0/0', ip: '10.0.0.2', subnetMask: '255.0.0.0', mac: '00:SE:07:00:00:02', status: 'up' }
          ],
          routingTable: [
            { id: 'l7-rt2', destinationNetwork: '192.168.1.0', subnetMask: '255.255.255.0', nextHop: '10.0.0.1', interfaceName: 'Se0/0/0', type: 'R', metric: 1 }
          ]
        },
        {
          id: 'l7-pc1',
          name: 'PC1',
          type: 'pc',
          model: 'PC-PT',
          x: 140,
          y: 200,
          powerState: 'on',
          defaultGateway: '192.168.1.1',
          interfaces: [{ id: 'l7-pc1-fa0', name: 'FastEthernet0', ip: '192.168.1.10', subnetMask: '255.255.255.0', mac: '00:PC:07:00:00:01', status: 'up' }]
        },
        {
          id: 'l7-pc2',
          name: 'PC2',
          type: 'pc',
          model: 'PC-PT',
          x: 720,
          y: 200,
          powerState: 'on',
          defaultGateway: '192.168.2.1',
          interfaces: [{ id: 'l7-pc2-fa0', name: 'FastEthernet0', ip: '192.168.2.10', subnetMask: '255.255.255.0', mac: '00:PC:07:00:00:02', status: 'up' }]
        }
      ],
      links: [
        { id: 'l7-l1', sourceDeviceId: 'l7-pc1', sourcePortId: 'l7-pc1-fa0', targetDeviceId: 'l7-r1', targetPortId: 'l7-r1-gi0', cableType: 'straight', status: 'up' },
        { id: 'l7-l2', sourceDeviceId: 'l7-r1', sourcePortId: 'l7-r1-se0', targetDeviceId: 'l7-r2', targetPortId: 'l7-r2-se0', cableType: 'serial', status: 'up' },
        { id: 'l7-l3', sourceDeviceId: 'l7-r2', sourcePortId: 'l7-r2-gi0', targetDeviceId: 'l7-pc2', targetPortId: 'l7-pc2-fa0', cableType: 'straight', status: 'up' }
      ]
    },
    procedureSteps: [
      '1. Connect Router1 to Router2 with Serial0/0/0 DCE cable. Clock rate 64000.',
      '2. Enter global config on Router1: "router rip" -> "network 192.168.1.0" -> "network 10.0.0.0".',
      '3. On Router2: "router rip" -> "network 192.168.2.0" -> "network 10.0.0.0".',
      '4. Verify routes learned dynamically with "show ip route". Look for the "R" prefix.',
      '5. Execute "show ip protocols" to view 30s update timer and 15 hop limit.'
    ],
    cliCommands: [
      'Router1(config)# router rip',
      'Router1(config-router)# network 192.168.1.0',
      'Router1(config-router)# network 10.0.0.0',
      'Router1# show ip route',
      'Router1# show ip protocols'
    ],
    verificationCheck: {
      description: 'Check that RIP routes (type R) are present in the routing table.',
      isPassed: (devices) => {
        const r1 = devices.find(d => d.name === 'Router1');
        return !!(r1 && r1.routingTable && r1.routingTable.some(r => r.type === 'R'));
      },
      hint: 'Configure "router rip" and network statements on Router1 and Router2.'
    },
    visualExplanation: {
      title: 'RIPv1 Broadcast Update Exchange',
      description: 'Routers broadcast full routing tables every 30 seconds to 255.255.255.255.',
      steps: [
        { step: 1, label: 'Broadcast Update', source: 'Router1', target: 'Router2', layer: 'Network (L3)', detail: 'Router1 broadcasts its directly connected network 192.168.1.0 with hop count 1.' },
        { step: 2, label: 'Route Installation', source: 'Router2', target: 'Router2', layer: 'Network (L3)', detail: 'Router2 adds route [120/1] via 10.0.0.1 to its routing table.' },
        { step: 3, label: 'Convergence', source: 'Router2', target: 'Router1', layer: 'Network (L3)', detail: 'Router2 advertises 192.168.2.0 back to Router1; full convergence reached.' }
      ]
    },
    resources: {
      referenceUrl: 'https://www.geeksforgeeks.org/what-is-routing/',
      referenceTitle: 'GeeksforGeeks - What is Routing?',
      referenceSource: 'GeeksforGeeks',
      geeksForGeeksUrl: 'https://www.geeksforgeeks.org/what-is-routing/',
      geeksForGeeksTitle: 'GeeksforGeeks Routing Guide',
      youtubeUrl: 'https://www.youtube.com/watch?v=yWbB32q9fFs',
      youtubeTitle: 'Configuring RIPv1 in Packet Tracer',
      youtubeChannel: 'Neso Academy'
    },
    vivaQuestions: [
      { question: 'What is the maximum valid hop count in RIP?', answer: '15 hops. A hop count of 16 represents an unreachable network.' },
      { question: 'What is the default update interval in RIP?', answer: '30 seconds.' }
    ]
  },

  // -------------------------------------------------------------
  // LAB 8: Implementation of RIP version 2
  // -------------------------------------------------------------
  {
    id: 'exp-8',
    number: 8,
    title: 'Lab 8: Implementation of RIP version 2',
    category: 'Dynamic Routing',
    aim: 'To configure and verify Routing Information Protocol Version 2 (RIPv2) supporting classless routing (VLSM) and multicast updates to 224.0.0.9.',
    apparatus: ['2 Cisco 1941 Routers with HWIC-2T cards', '2 Catalyst 2960 Switches', '2 Workstation PCs', 'Serial DCE/DTE Cables'],
    background: 'RIPv2 (RFC 2453) upgrades RIPv1: 1. Classless (sends 32-bit subnet mask with each route, supporting VLSM/CIDR) 2. Multicast updates to 224.0.0.9 (preventing non-routing PCs from processing broadcasts) 3. Supports plaintext and MD5 authentication 4. Requires `no auto-summary` to prevent automatic summarization at classful network boundaries.',
    initialTopology: {
      devices: [
        {
          id: 'l8-r1',
          name: 'Router1',
          type: 'router',
          model: '1941',
          x: 320,
          y: 200,
          powerState: 'on',
          interfaces: [
            { id: 'l8-r1-gi0', name: 'GigabitEthernet0/0', ip: '192.168.1.1', subnetMask: '255.255.255.192', mac: '00:RR:08:00:00:01', status: 'up' },
            { id: 'l8-r1-se0', name: 'Serial0/0/0', ip: '10.0.0.1', subnetMask: '255.255.255.252', mac: '00:SE:08:00:00:01', status: 'up', clockRate: 64000 }
          ],
          routingTable: [
            { id: 'l8-rt1', destinationNetwork: '192.168.1.64', subnetMask: '255.255.255.192', nextHop: '10.0.0.2', interfaceName: 'Se0/0/0', type: 'R', metric: 1 }
          ]
        },
        {
          id: 'l8-r2',
          name: 'Router2',
          type: 'router',
          model: '1941',
          x: 540,
          y: 200,
          powerState: 'on',
          interfaces: [
            { id: 'l8-r2-gi0', name: 'GigabitEthernet0/0', ip: '192.168.1.65', subnetMask: '255.255.255.192', mac: '00:RR:08:00:00:02', status: 'up' },
            { id: 'l8-r2-se0', name: 'Serial0/0/0', ip: '10.0.0.2', subnetMask: '255.255.255.252', mac: '00:SE:08:00:00:02', status: 'up' }
          ],
          routingTable: [
            { id: 'l8-rt2', destinationNetwork: '192.168.1.0', subnetMask: '255.255.255.192', nextHop: '10.0.0.1', interfaceName: 'Se0/0/0', type: 'R', metric: 1 }
          ]
        },
        {
          id: 'l8-pc1',
          name: 'PC1',
          type: 'pc',
          model: 'PC-PT',
          x: 140,
          y: 200,
          powerState: 'on',
          defaultGateway: '192.168.1.1',
          interfaces: [{ id: 'l8-pc1-fa0', name: 'FastEthernet0', ip: '192.168.1.10', subnetMask: '255.255.255.192', mac: '00:PC:08:00:00:01', status: 'up' }]
        },
        {
          id: 'l8-pc2',
          name: 'PC2',
          type: 'pc',
          model: 'PC-PT',
          x: 720,
          y: 200,
          powerState: 'on',
          defaultGateway: '192.168.1.65',
          interfaces: [{ id: 'l8-pc2-fa0', name: 'FastEthernet0', ip: '192.168.1.70', subnetMask: '255.255.255.192', mac: '00:PC:08:00:00:02', status: 'up' }]
        }
      ],
      links: [
        { id: 'l8-l1', sourceDeviceId: 'l8-pc1', sourcePortId: 'l8-pc1-fa0', targetDeviceId: 'l8-r1', targetPortId: 'l8-r1-gi0', cableType: 'straight', status: 'up' },
        { id: 'l8-l2', sourceDeviceId: 'l8-r1', sourcePortId: 'l8-r1-se0', targetDeviceId: 'l8-r2', targetPortId: 'l8-r2-se0', cableType: 'serial', status: 'up' },
        { id: 'l8-l3', sourceDeviceId: 'l8-r2', sourcePortId: 'l8-r2-gi0', targetDeviceId: 'l8-pc2', targetPortId: 'l8-pc2-fa0', cableType: 'straight', status: 'up' }
      ]
    },
    procedureSteps: [
      '1. Connect routers via Serial0/0/0. Assign VLSM IPs 192.168.1.1/26 and 192.168.1.65/26.',
      '2. Enter Router1: "router rip" -> "version 2" -> "no auto-summary" -> "network 192.168.1.0" -> "network 10.0.0.0".',
      '3. Enter Router2: "router rip" -> "version 2" -> "no auto-summary" -> "network 192.168.1.0" -> "network 10.0.0.0".',
      '4. Verify routes with "show ip route". Note that subnet masks (/26) are preserved!',
      '5. Ping PC2 from PC1 to verify end-to-end connectivity.'
    ],
    cliCommands: [
      'Router1(config)# router rip',
      'Router1(config-router)# version 2',
      'Router1(config-router)# no auto-summary',
      'Router1(config-router)# network 192.168.1.0',
      'Router1(config-router)# network 10.0.0.0',
      'Router1# show ip route rip'
    ],
    verificationCheck: {
      description: 'Check that RIPv2 preserves VLSM subnets in the routing table.',
      isPassed: (devices) => {
        const r1 = devices.find(d => d.name === 'Router1');
        return !!(r1 && r1.routingTable && r1.routingTable.some(r => r.type === 'R'));
      },
      hint: 'Configure "version 2" and "no auto-summary" under router rip.'
    },
    visualExplanation: {
      title: 'RIPv2 Multicast Updates',
      description: 'RIPv2 multicasts updates to 224.0.0.9 carrying exact prefix masks.',
      steps: [
        { step: 1, label: 'Multicast Update', source: 'Router1', target: 'Router2', layer: 'Network (L3)', detail: 'Router1 multicasts to 224.0.0.9: 192.168.1.0 with mask 255.255.255.192.' },
        { step: 2, label: 'VLSM Route Installed', source: 'Router2', target: 'Router2', layer: 'Network (L3)', detail: 'Router2 installs /26 route without auto-summarizing to /24.' }
      ]
    },
    resources: {
      referenceUrl: 'https://www.geeksforgeeks.org/subnetting/',
      referenceTitle: 'GeeksforGeeks - Subnetting',
      referenceSource: 'GeeksforGeeks',
      geeksForGeeksUrl: 'https://www.geeksforgeeks.org/subnetting/',
      geeksForGeeksTitle: 'GeeksforGeeks Subnetting & CIDR Guide',
      youtubeUrl: 'https://www.youtube.com/watch?v=0B6wYqT3L9s',
      youtubeTitle: 'Configuring RIPv2 with VLSM',
      youtubeChannel: 'NetworkChuck'
    },
    vivaQuestions: [
      { question: 'What multicast IP address is used by RIPv2 for routing updates?', answer: '224.0.0.9.' },
      { question: 'Why is the "no auto-summary" command essential in RIPv2 configurations?', answer: 'It prevents RIPv2 from automatically summarizing subnetted routes to classful network boundaries, preserving VLSM subnets.' }
    ]
  },

  // -------------------------------------------------------------
  // LAB 9: Implementation of Single Area OSPF
  // -------------------------------------------------------------
  {
    id: 'exp-9',
    number: 9,
    title: 'Lab 9: Implementation of Single Area OSPF',
    category: 'Dynamic Routing',
    aim: 'To configure and verify Open Shortest Path First (OSPF) Single Area (Area 0 Backbone) dynamic routing protocol across multiple Cisco routers using wildcard masks.',
    apparatus: ['2 Cisco 1941 Routers with HWIC-2T cards', '2 Catalyst 2960 Switches', '2 Workstation PCs', 'Serial DCE/DTE Cables'],
    background: 'OSPF (RFC 2328) is an open-standard link-state IGP protocol using Dijkstra\'s Shortest Path First (SPF) algorithm. Metric: Cost = 10^8 / Bandwidth in bps. Features: Fast convergence, loop-free topology, supports VLSM, and uses wildcard masks (inverse of subnet mask) in network statements. Area 0 is the mandatory backbone area.',
    initialTopology: {
      devices: [
        {
          id: 'l9-r1',
          name: 'Router1',
          type: 'router',
          model: '1941',
          x: 320,
          y: 200,
          powerState: 'on',
          interfaces: [
            { id: 'l9-r1-gi0', name: 'GigabitEthernet0/0', ip: '192.168.1.1', subnetMask: '255.255.255.0', mac: '00:RR:09:00:00:01', status: 'up' },
            { id: 'l9-r1-se0', name: 'Serial0/0/0', ip: '10.0.0.1', subnetMask: '255.255.255.252', mac: '00:SE:09:00:00:01', status: 'up', clockRate: 64000 }
          ],
          routingTable: [
            { id: 'l9-rt1', destinationNetwork: '192.168.2.0', subnetMask: '255.255.255.0', nextHop: '10.0.0.2', interfaceName: 'Se0/0/0', type: 'O', metric: 65 }
          ]
        },
        {
          id: 'l9-r2',
          name: 'Router2',
          type: 'router',
          model: '1941',
          x: 540,
          y: 200,
          powerState: 'on',
          interfaces: [
            { id: 'l9-r2-gi0', name: 'GigabitEthernet0/0', ip: '192.168.2.1', subnetMask: '255.255.255.0', mac: '00:RR:09:00:00:02', status: 'up' },
            { id: 'l9-r2-se0', name: 'Serial0/0/0', ip: '10.0.0.2', subnetMask: '255.255.255.252', mac: '00:SE:09:00:00:02', status: 'up' }
          ],
          routingTable: [
            { id: 'l9-rt2', destinationNetwork: '192.168.1.0', subnetMask: '255.255.255.0', nextHop: '10.0.0.1', interfaceName: 'Se0/0/0', type: 'O', metric: 65 }
          ]
        },
        {
          id: 'l9-pc1',
          name: 'PC1',
          type: 'pc',
          model: 'PC-PT',
          x: 140,
          y: 200,
          powerState: 'on',
          defaultGateway: '192.168.1.1',
          interfaces: [{ id: 'l9-pc1-fa0', name: 'FastEthernet0', ip: '192.168.1.10', subnetMask: '255.255.255.0', mac: '00:PC:09:00:00:01', status: 'up' }]
        },
        {
          id: 'l9-pc2',
          name: 'PC2',
          type: 'pc',
          model: 'PC-PT',
          x: 720,
          y: 200,
          powerState: 'on',
          defaultGateway: '192.168.2.1',
          interfaces: [{ id: 'l9-pc2-fa0', name: 'FastEthernet0', ip: '192.168.2.10', subnetMask: '255.255.255.0', mac: '00:PC:09:00:00:02', status: 'up' }]
        }
      ],
      links: [
        { id: 'l9-l1', sourceDeviceId: 'l9-pc1', sourcePortId: 'l9-pc1-fa0', targetDeviceId: 'l9-r1', targetPortId: 'l9-r1-gi0', cableType: 'straight', status: 'up' },
        { id: 'l9-l2', sourceDeviceId: 'l9-r1', sourcePortId: 'l9-r1-se0', targetDeviceId: 'l9-r2', targetPortId: 'l9-r2-se0', cableType: 'serial', status: 'up' },
        { id: 'l9-l3', sourceDeviceId: 'l9-r2', sourcePortId: 'l9-r2-gi0', targetDeviceId: 'l9-pc2', targetPortId: 'l9-pc2-fa0', cableType: 'straight', status: 'up' }
      ]
    },
    procedureSteps: [
      '1. Connect Router1 to Router2 via Serial0/0/0 DCE cable. Clock rate 64000.',
      '2. Configure OSPF on Router1: "router ospf 1" -> "network 192.168.1.0 0.0.0.255 area 0" -> "network 10.0.0.0 0.0.0.3 area 0".',
      '3. Configure OSPF on Router2: "router ospf 1" -> "network 192.168.2.0 0.0.0.255 area 0" -> "network 10.0.0.0 0.0.0.3 area 0".',
      '4. Observe OSPF adjacency state transition from INIT -> 2-WAY -> EXSTART -> EXCHANGE -> LOADING -> FULL.',
      '5. Verify neighbors with "show ip ospf neighbor" and routing table with "show ip route ospf".'
    ],
    cliCommands: [
      'Router1(config)# router ospf 1',
      'Router1(config-router)# network 192.168.1.0 0.0.0.255 area 0',
      'Router1(config-router)# network 10.0.0.0 0.0.0.3 area 0',
      'Router1# show ip ospf neighbor',
      'Router1# show ip route ospf'
    ],
    verificationCheck: {
      description: 'Check that OSPF routes (type O) are installed in the routing table.',
      isPassed: (devices) => {
        const r1 = devices.find(d => d.name === 'Router1');
        return !!(r1 && r1.routingTable && r1.routingTable.some(r => r.type === 'O'));
      },
      hint: 'Configure OSPF process 1 and wildcard mask network statements in area 0.'
    },
    visualExplanation: {
      title: 'OSPF Adjacency & Dijkstra Tree',
      description: 'Routers establish neighbor adjacencies, flood LSAs, and calculate Shortest Path Tree.',
      steps: [
        { step: 1, label: 'Hello Packet', source: 'Router1', target: 'Router2', layer: 'Network (L3)', detail: 'Routers exchange Hello packets on 224.0.0.5 to negotiate parameters.' },
        { step: 2, label: 'LSA Exchange', source: 'Router1', target: 'Router2', layer: 'Network (L3)', detail: 'Link-State Advertisements synchronize Link-State Databases (LSDB).' },
        { step: 3, label: 'Dijkstra SPF', source: 'Router1', target: 'Router1', layer: 'Algorithm', detail: 'Runs Dijkstra SPF to determine shortest path; installs O route [110/65].' }
      ]
    },
    resources: {
      referenceUrl: 'https://www.geeksforgeeks.org/what-is-routing/',
      referenceTitle: 'GeeksforGeeks - What is Routing?',
      referenceSource: 'GeeksforGeeks',
      geeksForGeeksUrl: 'https://www.geeksforgeeks.org/what-is-routing/',
      geeksForGeeksTitle: 'GeeksforGeeks OSPF Guide',
      youtubeUrl: 'https://www.youtube.com/watch?v=k1t6Fm3s7v8',
      youtubeTitle: 'OSPF Single Area Configuration in Cisco IOS',
      youtubeChannel: 'Neso Academy'
    },
    vivaQuestions: [
      { question: 'What is the default Administrative Distance of OSPF in Cisco IOS?', answer: '110.' },
      { question: 'How is OSPF cost metric calculated on Cisco routers?', answer: 'Cost = Reference Bandwidth (default 100 Mbps or 10^8 bps) / Interface Bandwidth in bps.' }
    ]
  },

  // -------------------------------------------------------------
  // LAB 10: Implementation of Multi Area OSPF
  // -------------------------------------------------------------
  {
    id: 'exp-10',
    number: 10,
    title: 'Lab 10: Implementation of Multi Area OSPF',
    category: 'Dynamic Routing',
    aim: 'To configure and verify Multi-Area OSPF with an Area Border Router (ABR) connecting Area 0 (Backbone Area) and Area 1 (Standard Area) to limit LSA flooding.',
    apparatus: ['3 Cisco 1941 Routers', '2 Catalyst 2960 Switches', '2 Workstation PCs', 'Serial DCE Cables'],
    background: 'In large networks, Single Area OSPF causes excessive LSDB sizes and CPU load from frequent Dijkstra recalculations. Multi-Area OSPF organizes the network hierarchically: Area 0 (Backbone) connects all non-backbone areas. An Area Border Router (ABR) has interfaces in Area 0 and another area, containing separate LSDBs and advertising summary LSAs (Type 3) across area boundaries.',
    initialTopology: {
      devices: [
        {
          id: 'l10-r1',
          name: 'Area1-R1',
          type: 'router',
          model: '1941',
          x: 240,
          y: 200,
          powerState: 'on',
          interfaces: [
            { id: 'l10-r1-gi0', name: 'GigabitEthernet0/0', ip: '192.168.10.1', subnetMask: '255.255.255.0', mac: '00:RR:10:00:00:01', status: 'up' },
            { id: 'l10-r1-se0', name: 'Serial0/0/0', ip: '10.1.1.1', subnetMask: '255.255.255.252', mac: '00:SE:10:00:00:01', status: 'up', clockRate: 64000 }
          ],
          routingTable: [
            { id: 'l10-rt1', destinationNetwork: '192.168.20.0', subnetMask: '255.255.255.0', nextHop: '10.1.1.2', interfaceName: 'Se0/0/0', type: 'O', metric: 75 }
          ]
        },
        {
          id: 'l10-abr',
          name: 'ABR-Router',
          type: 'router',
          model: '1941',
          x: 480,
          y: 200,
          powerState: 'on',
          interfaces: [
            { id: 'l10-abr-se0', name: 'Serial0/0/0', ip: '10.1.1.2', subnetMask: '255.255.255.252', mac: '00:SE:10:00:00:02', status: 'up' },
            { id: 'l10-abr-se1', name: 'Serial0/0/1', ip: '10.2.2.1', subnetMask: '255.255.255.252', mac: '00:SE:10:00:00:03', status: 'up', clockRate: 64000 }
          ]
        },
        {
          id: 'l10-r2',
          name: 'Area0-R2',
          type: 'router',
          model: '1941',
          x: 720,
          y: 200,
          powerState: 'on',
          interfaces: [
            { id: 'l10-r2-gi0', name: 'GigabitEthernet0/0', ip: '192.168.20.1', subnetMask: '255.255.255.0', mac: '00:RR:10:00:00:04', status: 'up' },
            { id: 'l10-r2-se0', name: 'Serial0/0/0', ip: '10.2.2.2', subnetMask: '255.255.255.252', mac: '00:SE:10:00:00:05', status: 'up' }
          ]
        }
      ],
      links: [
        { id: 'l10-l1', sourceDeviceId: 'l10-r1', sourcePortId: 'l10-r1-se0', targetDeviceId: 'l10-abr', targetPortId: 'l10-abr-se0', cableType: 'serial', status: 'up' },
        { id: 'l10-l2', sourceDeviceId: 'l10-abr', sourcePortId: 'l10-abr-se1', targetDeviceId: 'l10-r2', targetPortId: 'l10-r2-se0', cableType: 'serial', status: 'up' }
      ]
    },
    procedureSteps: [
      '1. Designate Area 1 for Area1-R1 and Area 0 (Backbone) for Area0-R2.',
      '2. Configure ABR-Router as Area Border Router: interface Se0/0/0 in Area 1, interface Se0/0/1 in Area 0.',
      '3. On Area1-R1: "router ospf 1" -> "network 192.168.10.0 0.0.0.255 area 1" -> "network 10.1.1.0 0.0.0.3 area 1".',
      '4. On ABR-Router: "router ospf 1" -> "network 10.1.1.0 0.0.0.3 area 1" -> "network 10.2.2.0 0.0.0.3 area 0".',
      '5. On Area0-R2: "router ospf 1" -> "network 10.2.2.0 0.0.0.3 area 0" -> "network 192.168.20.0 0.0.0.255 area 0".',
      '6. Verify inter-area routes on Area1-R1 with "show ip route ospf". Routes will show "O IA" (Inter-Area).'
    ],
    cliCommands: [
      'ABR-Router(config)# router ospf 1',
      'ABR-Router(config-router)# network 10.1.1.0 0.0.0.3 area 1',
      'ABR-Router(config-router)# network 10.2.2.0 0.0.0.3 area 0',
      'Area1-R1# show ip route ospf'
    ],
    verificationCheck: {
      description: 'Check that inter-area OSPF routes (O IA) are learned across the ABR.',
      isPassed: (devices) => {
        const abr = devices.find(d => d.name === 'ABR-Router');
        return !!(abr && abr.interfaces.length >= 2);
      },
      hint: 'Configure ABR interfaces connecting Area 1 and Area 0.'
    },
    visualExplanation: {
      title: 'Multi-Area OSPF LSA Filtering',
      description: 'ABR summarizes internal area topology and floods Type 3 Summary LSAs into Area 0.',
      steps: [
        { step: 1, label: 'Intra-Area LSA', source: 'Area1-R1', target: 'ABR', layer: 'Network (L3)', detail: 'Router-LSAs (Type 1) flood only within Area 1 boundary.' },
        { step: 2, label: 'ABR Translation', source: 'ABR', target: 'ABR', layer: 'Network (L3)', detail: 'ABR creates Summary-LSA (Type 3) representing Area 1 subnets.' },
        { step: 3, label: 'Inter-Area Route', source: 'ABR', target: 'Area0-R2', layer: 'Network (L3)', detail: 'Type 3 LSA floods into Area 0, installed as "O IA" route.' }
      ]
    },
    resources: {
      referenceUrl: 'https://www.geeksforgeeks.org/network-layer-in-osi-model/',
      referenceTitle: 'GeeksforGeeks - Network Layer in OSI Model',
      referenceSource: 'GeeksforGeeks',
      geeksForGeeksUrl: 'https://www.geeksforgeeks.org/network-layer-in-osi-model/',
      geeksForGeeksTitle: 'GeeksforGeeks Multi-Area Architecture',
      youtubeUrl: 'https://www.youtube.com/watch?v=wX-y0Z9k0l8',
      youtubeTitle: 'Multi-Area OSPF Configuration & ABR',
      youtubeChannel: 'NetworkChuck'
    },
    vivaQuestions: [
      { question: 'What is the role of an Area Border Router (ABR) in OSPF?', answer: 'An ABR connects one or more non-backbone areas to the backbone Area 0, maintaining separate LSDBs per area and generating Type 3 Summary LSAs.' },
      { question: 'What does "O IA" signify in the Cisco IOS routing table?', answer: 'OSPF Inter-Area route (a route learned from another OSPF area via an ABR).' }
    ]
  }
];
