# NetLearn User Manual

**Last checked:** 2026-10-27

NetLearn is a browser-based learning aid for computer networking. It combines guided notes, practical lab templates, a topology editor, deterministic packet demonstrations, calculators, protocol visualizers, practice questions, and a learning-resource library.

> **Scope:** NetLearn is an educational simulator, not Cisco Packet Tracer, a real router, or a production network. The checks recorded below establish that the application builds, its automated tests pass, and key screens and sample workflows load. They do not certify every possible configuration or every experiment end to end.

## Open NetLearn

Open the website in a modern browser. To run the project locally, install Node.js, open PowerShell in the project folder, and run:

```powershell
npm install
npm run dev
```

Open the local address printed by the development server. Use the top navigation, the **Quick lab** button, or the dashboard cards to move between sections. On a narrow screen, open the menu button to reveal the navigation links.

## Main sections

### Home

Use the dashboard cards to open guided labs, protocol visualizers, practice, and the Resource Hub. **Start building** opens a blank simulator canvas. **Open a saved topology** opens topology snapshots saved in the current browser profile.

### Guided labs

1. Open **Labs** or select **Quick lab**.
2. Choose one of the 15 experiments in the experiment index.
3. Read the aim, background, apparatus, and procedure. Use the procedure/visualizer controls to review the explanation and its steps.
4. Choose **Load Exp N into Simulator** or **Open in Simulator** to load that experiment's starting topology.
5. Configure devices as instructed, then use the lab's verification guidance. Use the lab reference and video links for additional study.

The lab collection is:

| # | Experiment |
|---|---|
| 1 | Packet Tracer introduction, peer-to-peer communication, and cable color codes |
| 2 | Network topologies |
| 3 | Router passwords and interface configuration |
| 4 | IP addressing and VLSM subnetting |
| 5 | Static and default routing |
| 6 | NAT configuration |
| 7 | RIP version 1 |
| 8 | RIP version 2 |
| 9 | Single-area OSPF |
| 10 | Multi-area OSPF |
| 11 | PPP configuration |
| 12 | HDLC configuration |
| 13 | BGP |
| 14 | EIGRP |
| 15 | Telnet configuration |

### Network simulator

The simulator starts with a sample PC/switch/router/server topology. To explore it:

1. Select **Send Message** and choose a source, destination, and packet type.
2. Select **Send Message** in the message form. Follow the event timeline on the page.
3. Select an event or **Inspect Packet Headers** to review the simulated packet fields. Use the play, step, and reset controls to move through a trace.
4. Select a device on the canvas to open its configuration or CLI. Configure IP addresses, routes, or other supported settings as needed.
5. Use the component palette to add network devices, end devices, and cables. Select the cable first, then connect the two device ports.
6. Use **Realtime** for the editable workspace and **Simulation** for packet/event playback controls.
7. Use the file controls to import/export topology JSON or save/load a topology in the current browser profile.

The simulated path checks device power, interface state, link compatibility, addressing, duplicate addresses, gateway reachability, routes, and basic configured ACL/firewall policy. A failed trace reports an educational drop reason; it does not send traffic onto a real network.

### Syllabus

Open **Syllabus** to browse the five curriculum units and their topics. Search for a concept, review notes and exam guidance, and follow the links to related labs or learning tools.

### Visualizers

Open **Visualizers** and select a demonstration:

- Routing algorithms (RIP, OSPF, BGP)
- OSI layers and encapsulation
- Error detection and CRC
- Flow control and ARQ
- TCP three-way handshake
- DHCP and DNS exchange

Use each visualizer's controls to explore its sequence, inputs, or diagram.

### Calculators

The **Calculators** section contains:

- **IPv4 & CIDR:** enter an IPv4 address and prefix to view subnet details.
- **FLSM Calculator:** divide an address block into fixed-size subnets.
- **VLSM Allocator:** enter a base block and host requirements to allocate variable-size subnets.
- **Nodal Delay & BDP:** calculate transmission/propagation delay and bandwidth-delay values.

Invalid addresses or allocations that do not fit should be corrected in the inputs before using the results.

### Practice and Viva

- **Multiple choice:** search and filter the 198-question quiz by topic and difficulty. Select an answer, choose **Check answer**, review the explanation, and navigate questions to see the score summary.
- **Viva questions:** search or filter the oral-exam question bank by topic, reveal model answers, and page through the results (up to 50 questions per page).

### Resources

Search and filter the Resource Hub by topic, provider, resource type, difficulty, and language. Bookmarks and completion marks are saved in the current browser profile. Some links are discovery searches or need manual review; their presence does not mean the external destination has been recently checked or that a course is free.

## Protocol and simulation support

### Router and switch configuration

The IOS-like CLI implements a documented educational subset. Supported configuration areas include IPv4/IPv6 addresses and routes, RIP/RIPng, OSPF, EIGRP, BGP, VLANs, ACLs, NAT overload, and WAN interface framing. The CLI is not a full Cisco IOS implementation: commands, abbreviations, and device-specific behaviors outside the implemented subset may not work.

### Packet composer options

The packet composer offers ICMP, ICMPv6, HTTP, FTP, TFTP, SMTP, POP3, DNS, DHCP, NTP, SNMP, Telnet, SSH, AAA/RADIUS-style, RTP, generic TCP/UDP, and ARP broadcast selections. A selectable entry is not a promise of a complete protocol stack. The application's deterministic packet traces cover selected ICMP, HTTP, and DNS scenarios; these are educational traces, not live protocol exchanges.

Other behaviors are simplified models, including WAN encapsulation compatibility, wireless profile matching, basic firewall policy, EtherChannel member compatibility, QoS-to-DSCP marking, and SNMP/AAA credential checks. For example, SNMP and AAA are not full manager/agent or RADIUS/TACACS+ services.

### Features not implemented as full protocol services

The simulator does not provide full LACP/PAgP negotiation or load balancing, BPDU-based STP/RSTP convergence, PPP/PPPoE negotiation, Frame Relay cloud/PVC switching, real WPA key exchange or radio association, IPsec/GRE tunnels, persistent stateful NAT/firewall tables, SNMP MIB operations, real RADIUS/TACACS+ wire exchanges, voice call control, or IoT registration and automation. Packet traces do not reproduce production-grade timers, retransmissions, or complete protocol state machines.

## Verification status

Checks run on 2026-10-27:

| Check | Result | What it establishes |
|---|---|---|
| `npm test` | Pass: 97 tests, 0 failures | Unit/data checks for the CLI, routing, simulation, topology files, calculators, questions, resources, lab metadata, and other listed test coverage. |
| `npm run lint` | Pass | TypeScript check completed without errors. |
| `npm run build` | Pass | Production bundle created. Vite emitted non-blocking warnings about `__dirname` in its config and a JavaScript chunk larger than 500 kB. |
| Browser smoke check | Pass for exercised paths | Dashboard and major sections loaded; visualizer sections, VLSM, Viva, resources, and simulator were opened. A default ICMP message produced a six-event simulated trace, and Lab 15 loaded its topology into the simulator. |
| All 15 lab definitions | Partial verification | Automated checks confirm every lab has a starting topology and verification guidance, and that published router/switch CLI scripts are accepted. They do not run every lab's verification function or prove every lab workflow succeeds end to end. PC command-prompt instructions are not covered by the router/switch CLI coverage test. |
| Every protocol and every simulator action | Not fully verified | The passing suite and browser smoke check are not exhaustive protocol-conformance or feature-parity tests. Treat the supported behaviors and limitations above as the accurate scope. |
| AI Tutor | Not available in the active website UI | An AI tutor component exists in the source, but it is not connected to the active application screen during this check. |

## Troubleshooting

- **A trace is dropped:** check that devices are powered on, interfaces and links are up, addresses and masks are valid, gateways/routes exist, and ACL/firewall rules permit the traffic.
- **A CLI command is rejected:** use the lab's command reference and remember the CLI supports only a subset of IOS syntax.
- **A lab's verification prompt is not satisfied:** follow its hint and inspect the topology/configuration. Some verification conditions are simpler than a full network validation.
- **A resource link does not open:** the catalog may mark it as needing manual review or as a discovery link. Check the provider's site independently.
- **A saved topology or bookmark is missing:** local snapshots, bookmarks, and resource progress are stored per browser profile; they are not automatically synchronized between profiles or devices. Export topology JSON for a portable backup.
