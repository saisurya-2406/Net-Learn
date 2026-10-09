import { ACADEMIC_EXPERIMENTS } from './labData';

export type ResourceKind = 'YouTube channel' | 'YouTube search' | 'Video' | 'Video candidate' | 'Course' | 'Simulator' | 'Tool' | 'Protocol specification' | 'Guide' | 'Lab' | 'Learning path';
export type ResourceStatus = 'Official source listed' | 'Needs manual review' | 'Discovery link' | 'Available in NetLearn';

export interface LearningResource {
  id: string;
  title: string;
  description: string;
  kind: ResourceKind;
  topic: string;
  provider: string;
  url: string;
  docsUrl?: string;
  repositoryUrl?: string;
  thumbnailUrl?: string;
  duration?: string;
  youtubeId?: string;
  subtopic?: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'All levels';
  language?: string;
  tags: string[];
  status: ResourceStatus;
  lastChecked: string;
  access: string;
  details?: string[];
  learningObjectives?: string[];
  relatedLabs?: string[];
  relatedResourceIds?: string[];
  licenseNotes?: string;
  appSection?: 'labs' | 'visualizers' | 'calculators' | 'simulator' | 'quiz' | 'syllabus';
}

const checked = '2026-10-09';
const official = (resource: Omit<LearningResource, 'status' | 'lastChecked'>): LearningResource => ({ ...resource, status: 'Official source listed', lastChecked: checked });
const review = (resource: Omit<LearningResource, 'status' | 'lastChecked'>): LearningResource => ({ ...resource, status: 'Needs manual review', lastChecked: checked });
const discovery = (resource: Omit<LearningResource, 'status' | 'lastChecked'>): LearningResource => ({ ...resource, status: 'Discovery link', lastChecked: checked });
const localResource = (resource: Omit<LearningResource, 'status' | 'lastChecked'>): LearningResource => ({ ...resource, status: 'Available in NetLearn', lastChecked: checked });

export const LEARNING_RESOURCES: LearningResource[] = [
  ...ACADEMIC_EXPERIMENTS.map((experiment) => localResource({
    id: `lab-${experiment.id}`,
    title: `Lab ${experiment.number}: ${experiment.title}`,
    description: experiment.aim,
    kind: 'Lab',
    topic: experiment.category,
    provider: 'NetLearn practical lab',
    url: experiment.resources.referenceUrl,
    difficulty: 'Beginner',
    tags: [experiment.category, 'Practical lab', ...experiment.apparatus],
    access: 'Available in the NetLearn Labs section; external reference link opens separately.',
    appSection: 'labs',
    details: ['The lab includes a stated aim, required apparatus, procedure, verification check, and a topology that can be opened in the NetLearn simulator.'],
  } as Omit<LearningResource, 'status' | 'lastChecked'>)),

  // Channel pages are intentionally labeled as channels. No individual video title or duration is inferred.
  ...[
    ['neso-academy', 'Neso Academy', 'Computer science and networking lessons; use its channel search for the topic you need.', 'https://www.youtube.com/@nesoacademy', ['Fundamentals', 'OSI model', 'TCP/IP', 'Subnetting', 'Routing', 'Protocols']],
    ['gate-smashers', 'Gate Smashers', 'Computer Networks lectures and exam-oriented explanations.', 'https://www.youtube.com/@GateSmashers', ['Fundamentals', 'OSI model', 'Data Link', 'Routing', 'TCP', 'UDP']],
    ['practical-networking', 'Practical Networking', 'Visual explanations of routing, subnetting, and network operation.', 'https://www.youtube.com/@PracticalNetworking', ['Subnetting', 'Routing', 'NAT', 'ACL', 'Troubleshooting']],
    ['powercert', 'PowerCert Animated Videos', 'Animated introductions to common networking and security concepts.', 'https://www.youtube.com/@PowerCertAnimatedVideos', ['Fundamentals', 'OSI model', 'Ethernet', 'Wireless', 'Security']],
    ['jeremys-it-lab', "Jeremy's IT Lab", 'Structured CCNA lessons and practice resources.', 'https://www.youtube.com/@JeremysITLab', ['Switching', 'VLANs', 'Routing', 'OSPF', 'ACL', 'Packet Tracer']],
    ['cisco-youtube', 'Cisco', 'Official Cisco channel for networking, products, and learning content.', 'https://www.youtube.com/@Cisco', ['Routing', 'Switching', 'Security', 'Wireless', 'Networking']],
    ['jennys-lectures', "Jenny's Lectures CS/IT", 'Computer science and information technology lectures, including networking topics.', 'https://www.youtube.com/@JennyslecturesCSIT', ['Fundamentals', 'OSI model', 'Data Link', 'TCP/IP', 'Protocols']],
  ].map(([id, title, description, url, tags]) => official({
    id: `youtube-${id}`, title, description, kind: 'YouTube channel', topic: 'Computer Networks', provider: 'YouTube', url,
    difficulty: 'All levels', language: 'Not verified', tags: tags as string[], access: 'Free to view; availability and ads depend on YouTube.',
    details: ['Channel page, not an individual video. Search the channel for a topic before assigning a lesson.'],
  } as Omit<LearningResource, 'status' | 'lastChecked'>)),

  // Simulators: descriptions distinguish local educational models from external emulation tools.
  official({ id: 'sim-core', title: 'CORE Network Emulator', description: 'Build and run virtual network topologies using real protocol stacks. This is an external emulator, not embedded in NetLearn.', kind: 'Simulator', topic: 'Network emulation', provider: 'CORE project', url: 'https://github.com/coreemu/core', docsUrl: 'https://github.com/coreemu/core/tree/master/docs', repositoryUrl: 'https://github.com/coreemu/core', difficulty: 'Advanced', tags: ['CORE', 'Linux', 'Emulator', 'Routing', 'Labs'], access: 'Open source; see the repository for current license and host requirements.', licenseNotes: 'Review the repository license and licensing of any third-party images used.', details: ['CORE is an emulator: it runs real applications and protocols in virtual nodes.', 'Start with a small LAN and inspect interface addresses and routes.', 'Requires local installation and suitable host privileges; it does not run inside this website.', 'See the official install documentation for supported systems and system requirements.'] }),
  official({ id: 'sim-gns3', title: 'GNS3', description: 'Graphical network emulation and simulation environment for building multi-vendor topologies.', kind: 'Simulator', topic: 'Network emulation', provider: 'GNS3', url: 'https://www.gns3.com/', docsUrl: 'https://docs.gns3.com/docs/', repositoryUrl: 'https://github.com/GNS3/gns3-gui', difficulty: 'Intermediate', tags: ['GNS3', 'Windows', 'macOS', 'Linux', 'Routing', 'Switching'], access: 'GNS3 software is free; virtual device images may have separate licensing requirements.', licenseNotes: 'GNS3 software is open source; device images can require separate licenses.', details: ['Official documentation describes Windows, macOS, and Linux clients and local or VM-backed servers.', 'Begin with a two-router topology and verify routes with traceroute.', 'GNS3 distinguishes emulated device images from simulated devices.', 'See the official install guide for current CPU, memory, virtualization, and disk requirements.'] }),
  review({ id: 'sim-packet-tracer', title: 'Cisco Packet Tracer', description: 'Cisco’s educational network simulation environment for practicing topologies and device configuration.', kind: 'Simulator', topic: 'Network simulation', provider: 'Cisco Networking Academy', url: 'https://www.netacad.com/learning-collections/cisco-packet-tracer', difficulty: 'Beginner', tags: ['Packet Tracer', 'Windows', 'macOS', 'Linux', 'Switching', 'Routing', 'VLANs'], access: 'May require a Cisco Networking Academy account; check current access terms.', details: ['Create a small LAN, assign addresses, and test connectivity with simulation mode.', 'This is a separate desktop application; it is not the NetLearn canvas.'] }),
  official({ id: 'sim-mininet', title: 'Mininet', description: 'Create virtual software-defined networks using lightweight hosts, switches, controllers, and links.', kind: 'Simulator', topic: 'Software-defined networking', provider: 'Mininet project', url: 'https://mininet.org/', docsUrl: 'https://mininet.org/walkthrough/', repositoryUrl: 'https://github.com/mininet/mininet', difficulty: 'Advanced', language: 'English', tags: ['Mininet', 'Linux', 'SDN', 'Emulator', 'OpenFlow'], access: 'Open source under a BSD license; intended for Linux-based environments.', licenseNotes: 'The official project site identifies Mininet as BSD-licensed.', details: ['Use the walkthrough to create a minimal topology and test connectivity.', 'Mininet emulates hosts and links in a Linux environment; it is not a privileged web deployment feature.', 'Start with the Mininet VM or a native Ubuntu setup; check the install guide for current requirements.'] }),
  official({ id: 'sim-kathara', title: 'Kathará', description: 'Container-based network emulation for composing reproducible multi-node labs.', kind: 'Simulator', topic: 'Network emulation', provider: 'Kathará project', url: 'https://github.com/KatharaFramework/Kathara', docsUrl: 'https://www.kathara.org/download.html', repositoryUrl: 'https://github.com/KatharaFramework/Kathara', difficulty: 'Intermediate', tags: ['Kathará', 'Containers', 'Linux', 'Labs', 'Emulator'], access: 'Free and open source; hardware and container runtime requirements depend on host.', licenseNotes: 'See the project repository for the current license.', details: ['The project download page provides installation guides for Linux distributions, macOS, and Windows.', 'Follow the installation guide and run a supplied introductory lab.', 'Check the project’s current documentation for supported host setup and system requirements.'] }),
  official({ id: 'sim-ns3', title: 'ns-3 Network Simulator', description: 'Discrete-event simulator for studying packet networks and communication systems.', kind: 'Simulator', topic: 'Network simulation', provider: 'ns-3 project', url: 'https://www.nsnam.org/', docsUrl: 'https://www.nsnam.org/documentation/', repositoryUrl: 'https://gitlab.com/nsnam/ns-3-dev', difficulty: 'Advanced', tags: ['ns-3', 'Simulation', 'Research'], access: 'Open source; review the current project license and build requirements.', licenseNotes: 'Review the ns-3 repository for current licensing terms.', details: ['Official documentation links to the current installation guide, tutorial, model library, and reference manual.', 'Run a tutorial scenario and compare packet delay under different link rates.', 'ns-3 simulates network behavior; it does not run vendor router operating systems.', 'Operating system and compiler requirements vary by ns-3 release; follow the selected release guide.'] }),
  official({ id: 'sim-eve-ng', title: 'EVE-NG', description: 'Virtual lab platform for assembling network and security device topologies.', kind: 'Simulator', topic: 'Network emulation', provider: 'EVE-NG', url: 'https://www.eve-ng.net/', docsUrl: 'https://www.eve-ng.net/index.php/documentation/', difficulty: 'Advanced', tags: ['EVE-NG', 'Linux', 'Emulator', 'Routing', 'Security'], access: 'Community and commercial editions have different terms; verify current licensing.', licenseNotes: 'Edition licensing differs; consult current vendor terms and device image licenses.', details: ['Check the official installation guide for supported operating systems and system requirements.', 'Check device image licensing before use.', 'EVE-NG is a separate virtual lab platform, not integrated with NetLearn.'] }),

  // Packet analysis and address tools.
  official({ id: 'tool-wireshark', title: 'Wireshark', description: 'Capture and inspect packets to study protocol fields, handshakes, and troubleshooting evidence.', kind: 'Tool', topic: 'Packet analysis', provider: 'Wireshark Foundation', url: 'https://www.wireshark.org/', docsUrl: 'https://www.wireshark.org/docs/', difficulty: 'Beginner', tags: ['Wireshark', 'Capture', 'TCP', 'DNS', 'Labs'], access: 'Free and open source.', details: ['Open a sample capture and filter for dns or tcp.', 'Capture traffic only on systems and networks where you have permission.'] }),
  official({ id: 'tool-wireshark-samples', title: 'Wireshark Sample Captures', description: 'Downloadable packet traces for learning protocol analysis without capturing live traffic.', kind: 'Tool', topic: 'Packet analysis', provider: 'Wireshark Wiki', url: 'https://wiki.wireshark.org/SampleCaptures', difficulty: 'Beginner', tags: ['Wireshark', 'pcap', 'DNS', 'TCP', 'Practice'], access: 'Free sample files; each capture may have its own terms.', details: ['Choose a capture, inspect protocol layers, and write down source, destination, and key fields.'] }),
  official({ id: 'tool-tcpdump', title: 'tcpdump', description: 'Command-line packet capture and filtering tool for supported systems.', kind: 'Tool', topic: 'Packet analysis', provider: 'tcpdump project', url: 'https://www.tcpdump.org/', docsUrl: 'https://www.tcpdump.org/manpages/tcpdump.1.html', difficulty: 'Intermediate', tags: ['tcpdump', 'Linux', 'macOS', 'Capture', 'CLI'], access: 'Open source; packet capture may require elevated local privileges.', details: ['On an authorized lab interface, capture DNS traffic and save a pcap for Wireshark.'] }),
  official({ id: 'tool-iperf', title: 'iPerf3 documentation', description: 'Measure TCP and UDP throughput between endpoints you control.', kind: 'Tool', topic: 'Performance testing', provider: 'ESnet / iPerf', url: 'https://iperf.fr/iperf-doc.php', difficulty: 'Intermediate', tags: ['iPerf3', 'Throughput', 'TCP', 'UDP', 'Performance'], access: 'Free software; use only between authorized endpoints.', details: ['Run an iPerf3 server and client on your own lab machines, then compare TCP and UDP measurements.'] }),
  official({ id: 'tool-nmap', title: 'Nmap', description: 'Network discovery and security auditing tool. Use only on networks you own or are authorized to test.', kind: 'Tool', topic: 'Network discovery', provider: 'Nmap Project', url: 'https://nmap.org/', docsUrl: 'https://nmap.org/book/man.html', difficulty: 'Intermediate', tags: ['Nmap', 'Discovery', 'Ports', 'Security'], access: 'Free and open source; scanning requires authorization.', details: ['Start with a scan of a local lab host you control and compare detected ports with its running services.'] }),
  official({ id: 'tool-google-dig', title: 'Google Admin Toolbox Dig', description: 'Web interface for querying DNS records through Google’s DNS tools.', kind: 'Tool', topic: 'DNS', provider: 'Google Admin Toolbox', url: 'https://toolbox.googleapps.com/apps/dig/', difficulty: 'Beginner', tags: ['DNS', 'Dig', 'Lookup', 'Web tool'], access: 'Free web tool; availability follows Google service terms.', details: ['Query A, AAAA, MX, and TXT records for a domain you are allowed to inspect.'] }),
  review({ id: 'tool-subnet-calculator', title: 'Calculator.net IP Subnet Calculator', description: 'Web-based IPv4 subnet calculations for checking network ranges and host counts.', kind: 'Tool', topic: 'Subnetting', provider: 'Calculator.net', url: 'https://www.calculator.net/ip-subnet-calculator.html', difficulty: 'Beginner', tags: ['IPv4', 'Subnetting', 'CIDR', 'Calculator'], access: 'Free web calculator; check the site’s current terms.', details: ['Verify a /26 network address and broadcast address, then solve the same example by hand.'] }),
  review({ id: 'tool-subnetonline', title: 'SubnetOnline', description: 'Subnetting and IP address reference tools; verify the current utility and terms before use.', kind: 'Tool', topic: 'Subnetting', provider: 'SubnetOnline', url: 'https://www.subnetonline.com/', difficulty: 'Beginner', tags: ['IPv4', 'Subnetting', 'CIDR', 'Calculator'], access: 'Web resource; current access terms need review.', details: ['Compare an independently calculated subnet range with the site output.'] }),

  ...[
    ['local-subnet', 'NetLearn IPv4, FLSM, and VLSM calculators', 'Calculate subnet masks, network and broadcast addresses, host ranges, fixed-size subnets, and variable-length allocations.', 'Subnetting', 'calculators', ['IPv4', 'CIDR', 'FLSM', 'VLSM'], 'Solve a /26 subnet by hand, then compare its range and usable host count.'],
    ['local-osi', 'NetLearn OSI and encapsulation explorer', 'Step through how data is wrapped into transport segments, IP packets, link frames, and bits. Conceptual demonstration only.', 'OSI model', 'visualizers', ['OSI', 'TCP/IP', 'Encapsulation'], 'Trace one HTTP payload down the layers and name the protocol data unit at each step.'],
    ['local-routing', 'NetLearn routing algorithm visualizer', 'Explore route selection and shortest-path concepts in a simplified topology. It does not run a real routing protocol.', 'Routing', 'visualizers', ['Dijkstra', 'RIP', 'OSPF', 'BGP'], 'Change link costs and observe how the selected shortest path changes.'],
    ['local-error', 'NetLearn error detection and CRC', 'Inspect parity, checksum, and CRC calculations with visible intermediate steps.', 'Error detection', 'visualizers', ['CRC', 'Checksum', 'Parity'], 'Change one transmitted bit and compare the CRC remainder.'],
    ['local-flow', 'NetLearn flow control and ARQ', 'Step through flow-control and retransmission examples, including stop-and-wait and sliding-window concepts.', 'Flow control', 'visualizers', ['ARQ', 'Sliding window', 'Retransmission'], 'Simulate a lost acknowledgment and follow the retransmission behavior.'],
    ['local-handshake', 'NetLearn TCP connection setup', 'Visualize SYN, SYN-ACK, and ACK as a conceptual TCP connection setup.', 'TCP', 'visualizers', ['TCP', 'Handshake', 'Sequence numbers'], 'Follow the acknowledgment and sequence numbers through the three steps.'],
    ['local-dhcp-dns', 'NetLearn DHCP and DNS exchange', 'Step through DHCP DORA and DNS query exchanges as conceptual message flows.', 'DHCP and DNS', 'visualizers', ['DHCP', 'DNS', 'Application'], 'Trace a client lease request, then inspect a DNS lookup sequence.'],
    ['local-simulator', 'NetLearn packet simulator', 'Build a browser topology and inspect deterministic educational traces for supported scenarios. This is not a real network emulator.', 'Packet simulation', 'simulator', ['Topology', 'ICMP', 'HTTP', 'DNS'], 'Create two hosts, connect them, assign addresses, and inspect a supported message trace.'],
    ['local-quiz', 'NetLearn general networking quiz', 'Practice 198 graded multiple-choice questions with topic filters and answer explanations.', 'Computer Networks', 'quiz', ['Quiz', 'Practice', 'Computer Networks'], 'Choose a topic, complete a filtered set, and review the explanations.'],
  ].map(([id, title, description, topic, appSection, tags, exercise]) => localResource({
    id: `local-${id}`, title, description, kind: 'Tool', topic, provider: 'NetLearn', url: 'https://netlearn-em6c.onrender.com/',
    appSection, difficulty: 'Beginner', tags: tags as string[], access: 'Available inside this NetLearn project; no external integration is implied.',
    details: [exercise, 'This is a browser learning demonstration; it does not generate real network traffic unless a separate external tool is used.'],
  } as Omit<LearningResource, 'status' | 'lastChecked'>)),
  ...[
    ['path-foundations', 'Learning path: network foundations', 'Start with models and media, continue through Ethernet and IP addressing, then practice basic connectivity.', ['Models', 'Fundamentals', 'Ethernet', 'IP addressing'], ['Review the five-unit syllabus, complete Labs 1–4, and take a Fundamentals quiz.']],
    ['path-routing', 'Learning path: subnetting and routing', 'Build addressing skills before studying static routes, RIP, OSPF, and route selection.', ['Subnetting', 'CIDR', 'Routing', 'RIP', 'OSPF'], ['Complete subnetting exercises, then Labs 5 and 7–10; compare static and dynamic route behavior.']],
    ['path-analysis', 'Learning path: packet analysis and troubleshooting', 'Practice reading packet traces, identify DNS and transport exchanges, and use structured troubleshooting.', ['Wireshark', 'TCP', 'DNS', 'Troubleshooting'], ['Use Wireshark sample captures, inspect a DNS lookup, and record what each protocol layer contributes.']],
  ].map(([id, title, description, tags, exercise]) => localResource({
    id, title, description, kind: 'Learning path', topic: 'Learning paths', provider: 'NetLearn', url: 'https://netlearn-em6c.onrender.com/',
    difficulty: 'Beginner', tags: tags as string[], access: 'Available inside this NetLearn project; sequence is a study suggestion.', appSection: 'syllabus',
    details: [exercise as string, 'Use the Syllabus Guide, Labs, Resource Hub, and General Quiz links to follow the sequence.'],
  } as Omit<LearningResource, 'status' | 'lastChecked'>)),
  localResource({ id: 'local-notes-diagrams', title: 'NetLearn protocol notes and diagrams', description: 'Browse the five-unit syllabus notes, protocol summaries, diagrams, exam guidance, and connected lab definitions.', kind: 'Guide', topic: 'Notes and diagrams', provider: 'NetLearn', url: 'https://netlearn-em6c.onrender.com/', difficulty: 'All levels', tags: ['Syllabus', 'Notes', 'Diagrams', 'Protocols'], access: 'Available inside this NetLearn project.', appSection: 'syllabus', details: ['Choose a unit and topic in the Syllabus Guide, then compare the explanation with its associated lab.'] }),

  // Protocol standards: canonical RFC Editor documents and the IEEE standards portal.
  ...[
    ['rfc-ipv4', 'RFC 791 — Internet Protocol', 'IPv4 datagram format and forwarding behavior; historical specification, read alongside current updates.', 'https://www.rfc-editor.org/rfc/rfc791', 'IPv4', 'Advanced', ['IPv4', 'IP', 'Datagrams']],
    ['rfc-ipv6', 'RFC 8200 — Internet Protocol, Version 6 (IPv6) Specification', 'IPv6 packet format and forwarding requirements.', 'https://www.rfc-editor.org/rfc/rfc8200', 'IPv6', 'Advanced', ['IPv6', 'IP', 'Addressing']],
    ['rfc-tcp', 'RFC 9293 — Transmission Control Protocol (TCP)', 'Current core TCP specification; replaces RFC 793.', 'https://www.rfc-editor.org/rfc/rfc9293', 'TCP', 'Advanced', ['TCP', 'Transport', 'Reliability']],
    ['rfc-udp', 'RFC 768 — User Datagram Protocol', 'Original UDP specification and header format.', 'https://www.rfc-editor.org/rfc/rfc768', 'UDP', 'Advanced', ['UDP', 'Transport']],
    ['rfc-dns-concepts', 'RFC 1034 — Domain Names: Concepts and Facilities', 'DNS architecture and concepts; consult current updates where needed.', 'https://www.rfc-editor.org/rfc/rfc1034', 'DNS', 'Advanced', ['DNS', 'Application']],
    ['rfc-dns-implementation', 'RFC 1035 — Domain Names: Implementation and Specification', 'DNS message formats and implementation details; consult current updates where needed.', 'https://www.rfc-editor.org/rfc/rfc1035', 'DNS', 'Advanced', ['DNS', 'Application']],
    ['rfc-dhcp', 'RFC 2131 — Dynamic Host Configuration Protocol', 'DHCP operation, messages, and leases.', 'https://www.rfc-editor.org/rfc/rfc2131', 'DHCP', 'Advanced', ['DHCP', 'Addressing']],
    ['rfc-ospf', 'RFC 2328 — OSPF Version 2', 'OSPFv2 specification for IPv4 routing.', 'https://www.rfc-editor.org/rfc/rfc2328', 'OSPF', 'Advanced', ['OSPF', 'Routing', 'IPv4']],
    ['rfc-rip', 'RFC 2453 — RIP Version 2', 'RIPv2 routing protocol specification.', 'https://www.rfc-editor.org/rfc/rfc2453', 'RIP', 'Advanced', ['RIP', 'Routing', 'IPv4']],
    ['rfc-http', 'RFC 9110 — HTTP Semantics', 'Current HTTP semantics and shared protocol concepts.', 'https://www.rfc-editor.org/rfc/rfc9110', 'HTTP', 'Advanced', ['HTTP', 'HTTPS', 'Application']],
  ].map(([id, title, description, url, topic, difficulty, tags]) => official({
    id, title, description, kind: 'Protocol specification', topic, provider: 'RFC Editor / IETF', url,
    difficulty, language: 'English', tags: tags as string[], access: 'Free public standards document.',
    details: ['Read the abstract and message format first; use a beginner guide before implementing a protocol.'],
  } as Omit<LearningResource, 'status' | 'lastChecked'>)),
  official({ id: 'ieee-standards', title: 'IEEE Standards', description: 'Official standards portal. IEEE 802 networking standards may require purchase or institutional access.', kind: 'Protocol specification', topic: 'IEEE 802', provider: 'IEEE', url: 'https://standards.ieee.org/', difficulty: 'Advanced', tags: ['Ethernet', 'Wi-Fi', 'IEEE 802', 'Standards'], access: 'Some material is publicly available; full standards may require payment or institutional access.' }),

  review({ id: 'video-jeremy-ospf-lab', title: 'Free CCNA | Configuring OSPF (3) | Day 28 Lab | CCNA 200-301 Complete Course', description: 'A hands-on OSPF lab covering configuration and troubleshooting, including OSPF network types, hello/dead timers, and serial connections.', kind: 'Video', topic: 'OSPF', provider: "Jeremy's IT Lab", url: 'https://www.youtube.com/watch?v=Goekjm3bK5o', youtubeId: 'Goekjm3bK5o', thumbnailUrl: 'https://i.ytimg.com/vi/Goekjm3bK5o/hqdefault.jpg', difficulty: 'Intermediate', language: 'Not verified', tags: ['OSPF', 'CCNA', 'Lab', 'Routing'], access: 'Free to view on YouTube; playback or embedding can vary by region and channel settings.', relatedLabs: ['exp-9'], learningObjectives: ['Practice OSPF configuration and troubleshooting', 'Review network types and hello/dead timers'], details: ['YouTube title and channel attribution were present in search results on 2026-10-09; the watch page could not be fetched for an independent duration or language check.', 'Try the steps in an isolated Packet Tracer or GNS3 lab and verify adjacencies before adding other routers.'] }),

  // Courses and educational references; platform-wide access is not described as uniformly free.
  review({ id: 'course-netacad', title: 'Cisco Networking Academy', description: 'Cisco learning platform with networking courses and Packet Tracer learning collections.', kind: 'Course', topic: 'Networking fundamentals', provider: 'Cisco Networking Academy', url: 'https://www.netacad.com/', difficulty: 'Beginner', tags: ['Cisco', 'Networking Basics', 'Packet Tracer', 'Course'], access: 'Course access varies; registration may be required and some offerings may have fees.' }),
  review({ id: 'course-netacad-basics', title: 'Networking Basics', description: 'Cisco Networking Academy course page for networking basics.', kind: 'Course', topic: 'Networking fundamentals', provider: 'Cisco Networking Academy', url: 'https://www.netacad.com/courses/networking-basics', difficulty: 'Beginner', tags: ['Cisco', 'Fundamentals', 'Course'], access: 'Check current enrollment, registration, language, and pricing.' }),
  review({ id: 'course-mit-ocw', title: 'MIT OpenCourseWare', description: 'Open educational materials from MIT courses; search the catalog for networking offerings.', kind: 'Course', topic: 'Computer Networks', provider: 'MIT OpenCourseWare', url: 'https://ocw.mit.edu/', difficulty: 'Intermediate', tags: ['MIT', 'Open courseware', 'Course'], access: 'Course materials are generally free to access; this is a course catalog, not a specific verified networking course.' }),
  review({ id: 'course-cloudflare', title: 'Cloudflare Learning Center', description: 'Short explainers on Internet infrastructure, DNS, security, and web technologies.', kind: 'Guide', topic: 'Internet concepts', provider: 'Cloudflare', url: 'https://www.cloudflare.com/learning/', difficulty: 'Beginner', tags: ['DNS', 'CDN', 'Security', 'Internet'], access: 'Free articles; provider-authored explanations.' }),
  review({ id: 'course-gfg', title: 'GeeksforGeeks Computer Networks', description: 'Computer networking tutorial and reference articles.', kind: 'Guide', topic: 'Computer Networks', provider: 'GeeksforGeeks', url: 'https://www.geeksforgeeks.org/computer-networks/', difficulty: 'Beginner', tags: ['Tutorial', 'Fundamentals', 'Subnetting'], access: 'Free articles; some site features or content may require an account or payment.' }),
  review({ id: 'course-coursera', title: 'Coursera Computer Networks course search', description: 'Search current course offerings; individual courses may require payment or offer limited free access.', kind: 'Course', topic: 'Computer Networks', provider: 'Coursera', url: 'https://www.coursera.org/search?query=computer%20networks', difficulty: 'All levels', tags: ['Course search', 'Computer Networks'], access: 'Course pricing and audit access vary; check each listing.' }),
  review({ id: 'course-edx', title: 'edX Computer Networks course search', description: 'Search current course offerings; certificates and some course access may require payment.', kind: 'Course', topic: 'Computer Networks', provider: 'edX', url: 'https://www.edx.org/search?q=computer%20networks', difficulty: 'All levels', tags: ['Course search', 'Computer Networks'], access: 'Course pricing and access vary; check each listing.' }),
  review({ id: 'course-kurose', title: 'Computer Networking: A Top-Down Approach companion site', description: 'Publisher and author companion resources for the networking textbook.', kind: 'Guide', topic: 'Computer Networks', provider: 'University of Massachusetts Amherst', url: 'https://gaia.cs.umass.edu/kurose_ross/index.php', difficulty: 'Intermediate', tags: ['Textbook', 'Exercises', 'Course'], access: 'Companion materials may be free; the textbook may require purchase or library access.' }),

  // Previously listed GeeksforGeeks articles retained as unverified secondary references pending manual review.
  ...[
    ['legacy-gfg-1', 'Computer Network Tutorial', 'https://www.geeksforgeeks.org/computer-network-tutorial/', 'Fundamentals'],
    ['legacy-gfg-2', 'Types of Network Topology', 'https://www.geeksforgeeks.org/types-of-network-topology/', 'Topologies'],
    ['legacy-gfg-3', 'Network Devices (Hub, Switch, Router & Gateway)', 'https://www.geeksforgeeks.org/network-devices-hub-switch-router-gateway/', 'Network devices'],
    ['legacy-gfg-4', 'OSI Model Layers', 'https://www.geeksforgeeks.org/layers-of-osi-model/', 'OSI model'],
    ['legacy-gfg-5', 'IP Addressing', 'https://www.geeksforgeeks.org/ip-addressing/', 'IP addressing'],
    ['legacy-gfg-6', 'What is Routing?', 'https://www.geeksforgeeks.org/what-is-routing/', 'Routing'],
    ['legacy-gfg-7', 'TCP vs UDP', 'https://www.geeksforgeeks.org/tcp-vs-udp/', 'Transport'],
    ['legacy-gfg-8', 'DNS in Application Layer', 'https://www.geeksforgeeks.org/domain-name-system-dns-in-application-layer/', 'DNS'],
    ['legacy-gfg-9', 'Network Ports and Protocols', 'https://www.geeksforgeeks.org/port-number-in-computer-network/', 'Application protocols'],
  ].map(([id, title, url, topic]) => review({
    id, title: `GeeksforGeeks: ${title}`, description: 'Previously listed secondary article retained for review. Confirm that the page is available and its explanation is current before assigning.', kind: 'Guide', topic, provider: 'GeeksforGeeks', url,
    difficulty: 'Beginner', tags: [topic, 'Legacy listing', 'Secondary source'], access: 'Free article; page availability and current content need manual review.',
  } as Omit<LearningResource, 'status' | 'lastChecked'>)),

  // Previously listed individual videos kept as candidates only; title, channel, and availability were not confirmed.
  ...[
    ['legacy-video-1', 'Computer Networks Full Course - 100+ Lectures Playlist', 'https://www.youtube.com/playlist?list=PLBlnK6fEyqRgMCUAG0XRw78UA8qnv6jEx', 'Neso Academy', 'Fundamentals'],
    ['legacy-video-2', 'Network Fundamentals (CCNA Start)', 'https://www.youtube.com/watch?v=IPvYjXCsTg8', 'NetworkChuck', 'Fundamentals'],
    ['legacy-video-3', 'Cisco Packet Tracer Complete Beginner to Pro Lab Tutorial', 'https://www.youtube.com/watch?v=0k5F7oEcx3E', 'David Bombal', 'Packet Tracer'],
    ['legacy-video-4', 'Subnetting Mastery - The Easiest Way to Subnet in Your Head', 'https://www.youtube.com/watch?v=s_Ntt6eTn94', 'Practical Networking', 'Subnetting'],
    ['legacy-video-5', 'TCP vs UDP Comparison & 3-Way Handshake Visualized', 'https://www.youtube.com/watch?v=uwoD5YsGACg', 'PowerCert Animated Videos', 'TCP and UDP'],
  ].map(([id, title, url, channel, topic]) => review({
    id, title, description: 'Previously listed video candidate. Its title, channel attribution, topic match, and availability have not been independently confirmed; review before using.', kind: 'Video candidate', topic, provider: channel,
    url, difficulty: 'All levels', language: 'Not verified', tags: [topic, 'Legacy listing', 'Manual review'], access: 'YouTube access and availability vary. This is not a verified video entry.',
  } as Omit<LearningResource, 'status' | 'lastChecked'>)),

  // Discovery links are explicitly not represented as verified video resources.
  ...[
    'Complete Computer Networks courses', 'Networking fundamentals', 'Network topologies', 'OSI model', 'TCP/IP model', 'Physical layer', 'Transmission media', 'Switching techniques', 'Data Link layer', 'Framing', 'Ethernet', 'MAC addressing', 'Error detection', 'CRC and checksum', 'Hamming code', 'Flow control', 'Stop-and-Wait ARQ', 'Go-Back-N ARQ', 'Selective Repeat ARQ', 'ALOHA', 'CSMA/CD', 'CSMA/CA', 'IP addressing', 'IPv4', 'IPv6', 'Binary conversion', 'Subnetting and CIDR', 'ARP', 'ICMP', 'Routing fundamentals', 'Distance-vector routing', 'RIP', 'Link-state routing', 'OSPF', "Dijkstra's algorithm", 'TCP', 'UDP', 'Congestion control', 'DNS', 'DHCP', 'HTTP and HTTPS', 'FTP and SMTP', 'Switching and VLANs', 'NAT', 'ACL concepts', 'Wireless networking', 'Network security fundamentals', 'Wireshark packet analysis', 'Network troubleshooting', 'Computer Networks practical experiments', 'Cisco Packet Tracer', 'CORE Network Emulator', 'GNS3', 'Mininet', 'Advanced networking topics',
  ].map((topic, index) => discovery({
    id: `video-search-${index + 1}`, title: `YouTube search: ${topic}`, description: `Discovery search for ${topic}. Search results are not individually reviewed videos; confirm the channel, title, and content before assigning.`, kind: 'YouTube search', topic, provider: 'YouTube search', url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${topic} computer networks tutorial`)}`, difficulty: 'All levels', language: 'Varies; not verified', tags: [topic, 'Discovery search'], access: 'Free to browse; results may include ads or external links.',
  })),
];

export const RESOURCE_CATEGORIES = ['All resources', 'YouTube channel', 'YouTube search', 'Video', 'Video candidate', 'Course', 'Simulator', 'Tool', 'Protocol specification', 'Guide', 'Lab', 'Learning path'] as const;
