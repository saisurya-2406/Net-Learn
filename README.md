# NetLearn

Interactive computer networks learning platform with a browser-based packet simulator, protocol demonstrations, practical labs, a resource hub, and a graded multiple-choice quiz.

## Run locally

**Prerequisite:** Node.js

```sh
npm install
npm run dev
```

Open the local URL printed by Vite.

## Deploy to Vercel

1. Import `https://github.com/saisurya-2406/Net-Learn` into Vercel.
2. Use the Vite framework preset, `npm run build` as the build command, and `dist` as the output directory. These values are also set in `vercel.json`.
3. The AI tutor component is not currently connected to the active website UI, so `GEMINI_API_KEY` is not required for the user-facing app.
4. Deploy. The Vite single-page app uses a fallback rewrite for direct page loads, and `/api/ai/ask` is handled by the Express-backed Vercel Function in `api/ai/ask.ts`.

For local and traditional Node hosting, `npm run dev` and `npm run start` continue to use the Express server.

## Features

See [USER-MANUAL.md](./USER-MANUAL.md) for user workflows, protocol scope, limitations, and the latest verification summary.

- Five-unit networking syllabus and 15 practical lab experiments
- Browser-based topology editor with validated NetLearn JSON import/export and browser-local topology snapshots
- Deterministic educational packet traces for selected ICMP, HTTP, and DNS scenarios
- Router CLI configuration for IPv4/IPv6 addressing and routes, RIP/RIPng, OSPF, EIGRP, BGP, VLANs, ACLs, NAT overload, and WAN interface framing
- Link path checks for HDLC/PPP/PPPoE/Frame Relay compatibility, WPA2/WPA3 profile matching on wireless links, basic firewall policy, and EtherChannel member compatibility
- Interface QoS priority-to-DSCP marking for IPv4 trace packets
- Configurable educational SNMP community checks and RADIUS/TACACS+ style AAA user authentication on server devices
- OSPF redistribution controls for static and connected routes
- Subnetting and networking calculators, routing demonstrations, and protocol visualizers
- Resource Hub with filters for provider, topic/protocol, type, difficulty, and language; resource bookmarks stay in the current browser profile
- Directory records for official simulators, packet analysis tools, RFCs, courses, YouTube channels, and topic discovery searches
- Practice room with 1,000 viva prompts and 198 multiple-choice questions, topic filters, model answers, explanations, and score summary
- An AI tutor component exists but is not currently connected to the active website UI.

Resource links are labeled as official source listings, items that need manual review, or discovery links. A catalog date is not a successful live link check. YouTube channel and search pages are not represented as individually verified videos. Course access and pricing vary by provider.

## Tests and build

```sh
npm test
npm run lint
npm run build
npm run check:resource-links
```

The optional link checker makes at most one request per second to each host. It reports HTTP or network failures as items needing manual review; an automated failure is not treated as proof that a resource is permanently broken.

From the dashboard, choose **Build a network** to open a blank canvas. Add devices from the component palette, connect interfaces, then use **Send Message** to inspect a simulated packet path and event timeline. Topology snapshots stay in the current browser profile; JSON export is the portable backup format.

The packet trace checks device power, interface state, link compatibility, IPv4 addressing, duplicate addresses, gateway reachability, routes, and basic configured ACL/firewall policy. Wireless links require a matching access point/client SSID, security mode, and passphrase. The firewall permits replies to an allowed request within that simulation run. WAN encapsulation, QoS marking, STP, EtherChannel, and routing protocol behavior are educational deterministic models.

This project does not provide complete Cisco Packet Tracer feature parity. It does not implement full LACP/PAgP negotiation or load balancing, BPDU-based STP/RSTP convergence, PPP/PPPoE negotiation, Frame Relay cloud/PVC switching, real WPA key exchange or radio association, IPsec or GRE tunnels, persistent stateful firewall/NAT tables, SNMP agent/MIB operations, real RADIUS/TACACS+ wire exchanges, voice call control, or IoT registration and automation. SNMP and AAA settings are simplified server-side credential checks, not full protocol services. Protocol traces do not execute real packets or production-grade timers. The browser simulator is not a CORE/GNS3 runtime, real Cisco IOS, or an Internet connection; external simulators require separate installation and suitable local infrastructure.

### Remaining feature scope

The following are future-work areas, not features promised as complete today:

1. **Routing:** broader OSPF redistribution policies (including metrics, tags, route maps, and loop prevention) and realistic protocol timers/exchanges.
2. **Security:** IPsec/GRE tunnel configuration and packet behavior; persistent stateful NAT/PAT and firewall connection tracking.
3. **Switching:** BPDU-based STP/RSTP elections, port states, and convergence; LACP/PAgP negotiation, logical port channels, and load distribution.
4. **WAN:** PPP/PPPoE negotiation and authentication, plus Frame Relay cloud, LMI, and PVC switching.
5. **Services:** SNMP MIB/OID operations and manager polling; real RADIUS/TACACS+ packet exchanges, accounting, and authorization.
6. **Wireless, voice, and IoT:** 802.11 association and key exchange, call control, and device registration/automation.
7. **Protocol realism:** packet-level exchanges, protocol state, timers, retransmissions, and failure/convergence behavior across the supported protocols.

The current CLI is a deliberately limited IOS-like command interpreter. The automated checks exercise the router/switch commands published in the 15 lab manuals and selected command behavior in `tests/routerCli.test.mjs`; they do not exhaustively test every possible command, IOS abbreviation, or device-specific variant. PC command-prompt instructions are outside the router/switch CLI coverage test. See `AUDIT.md` for the implementation boundaries.

Resource entries are maintained in `src/data/resourceLibrary.ts`; question content is in `src/data/questionsData.ts`; practical lab definitions are in `src/data/labs/`.

### Running a practical lab

Open **Labs**, choose one of the 15 experiments, and load its topology into the simulator. Router and switch IOS command references can be pasted as multiline scripts into the device CLI; PC command-prompt instructions are entered on the PC. Use each lab's verification check after configuration. These are educational simulations, and the supported commands and protocol behaviors are described in `AUDIT.md`; they do not provide full Cisco Packet Tracer parity.
