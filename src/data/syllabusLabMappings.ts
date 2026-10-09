export const UNIT_LAB_MAPPINGS: Record<number, number[]> = {
  1: [1, 2, 3],
  2: [4, 5, 6],
  3: [7, 8, 9],
  4: [10, 11, 12],
  // Labs 13 and 14 cover routing. Lab 15 covers Telnet, the matching Unit 5 lab.
  5: [15],
};

export const TOPIC_LAB_MAPPINGS: Record<string, { labNumber: number; title: string }> = {
  'u1-t1': { labNumber: 1, title: 'Lab 1: Packet Tracer, Peer-to-Peer & Cable Color Codes' },
  'u1-t2': { labNumber: 2, title: 'Lab 2: Implementation of Network Topologies' },
  'u1-t6': { labNumber: 1, title: 'Lab 1: Cable Standards & Delay Metrics' },
  'u1-t7': { labNumber: 1, title: 'Lab 1: Study of Guided Media & T568A/B Pinouts' },
  'u2-t2': { labNumber: 4, title: 'Lab 4: IP Addressing & Subnetting (FLSM / VLSM)' },
  'u2-t3': { labNumber: 4, title: 'Lab 4: Variable Length Subnet Masking (VLSM)' },
  'u2-t4': { labNumber: 6, title: 'Lab 6: NAT & PAT Configuration on Cisco Routers' },
  'u2-t5': { labNumber: 3, title: 'Lab 3: Router Configuration & Switch Interconnections' },
  'u3-t1': { labNumber: 5, title: 'Lab 5: Static and Default Routing Implementation' },
  'u3-t2': { labNumber: 7, title: 'Lab 7: RIP Distance Vector Routing Simulation' },
  'u3-t3': { labNumber: 9, title: 'Lab 9: Single Area OSPF Link State Routing' },
  'u4-t1': { labNumber: 2, title: 'Lab 2: Ethernet & Shared Access Topologies' },
  'u4-t5': { labNumber: 11, title: 'Lab 11: PPP & CHAP Serial Encapsulation' },
  'u5-t1': { labNumber: 15, title: 'Lab 15: TCP-based remote access with Telnet' },
  'u5-t4': { labNumber: 15, title: 'Lab 15: Telnet VTY Line Access & Security' },
};
