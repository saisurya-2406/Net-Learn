# NetLearn simulator audit

## Existing architecture

- Frontend: React 19 + TypeScript, built with Vite 8. The simulator UI lives in `src/components/Simulator/`.
- Simulation: deterministic client-side packet trace in `src/utils/simulationEngine.ts`; IPv4 and networking calculations in `src/utils/networkingMath.ts`.
- Persistence: validated JSON import/export and browser-local topology snapshots in `src/utils/topologyFiles.ts` and `PacketSimulatorWorkspace.tsx`.
- Backend: small Express development/Node server in `server.ts`, plus a Vercel AI tutor function in `api/ai/ask.ts`. No database is configured; topology saves are browser-local.
- Tests: Node's built-in test runner with `tsx`; existing tests cover simulation traces, topology files, networking math, learning content, and resource links.
- Deployment/build: Vite output to `dist`, with Vercel configuration and Dockerfile present.

## Milestone 1 findings

- The topology canvas, device/interface models, device window, CLI, and packet trace already exist. Links explicitly reference interface IDs, and the JSON importer validates those references.
- The CLI in `CiscoDeviceModal.tsx` was a second, UI-local command interpreter. It set every interface up/down together, accepted partial interface-name matches, silently assigned an address to the first interface when no match existed, and printed a fabricated 100% ping result.
- Static routes were appended without validating address/mask/network or next-hop reachability. `show ip route` displayed each connected address as a `/24`, regardless of its configured mask. Connected routes were synthesized in the packet engine, not maintained as authoritative table entries.
- `simulationEngine.ts` validates IPv4 endpoints, links, gateway presence, and an outbound route along the selected physical path. It is a deterministic educational trace, not a full Layer 2/ARP or routing protocol runtime. It does not model TTL decrement with loop detection or dynamic route exchange.
- Existing route and interface configuration tabs remain available. The device modal commits changes to the workspace state, and topology persistence serializes device configuration.

## Implemented in this change

- Replaced the modal's CLI branches with a standalone state-aware command interpreter.
- Added exact interface selection, IPv4 and contiguous-mask validation, per-interface address and admin-state changes, descriptions, access/trunk VLAN commands, connected-route derivation using the configured mask, and static-route validation against an active directly connected next-hop subnet.
- Added supported `show` commands, static route removal, and startup configuration save/restore for the simulator's generated command subset.
- Added deterministic RIP v1/v2 and RIPng distance-vector learning, multi-area OSPF shortest-path learning with static-route redistribution, same-AS EIGRP educational distance-vector learning, and reciprocal directly connected eBGP route exchange. Routing tables are recalculated from live interfaces and links and are used during packet simulation.
- Added VLAN-aware access-port path isolation and per-frame trunk allowed-VLAN checks, a MAC table learning model populated by successful simulated request/reply paths (including router egress MACs), plus canvas grid arrangement and fit-to-workspace controls.
- Added deterministic loop prevention for redundant switch-to-switch links, configurable as PVST, Rapid-PVST, or off. This is a spanning-tree topology approximation; it does not model protocol BPDU exchanges, per-VLAN elections, port roles/states, or convergence timers.
- Added switch VLAN creation, naming, and deletion in the CLI. Topology import validates VLAN tables, VLAN IDs, and switchport mode fields before accepting data.
- Added state-backed `show mac address-table`, `show arp`, `show vlan brief`, and `show interfaces status` CLI output.
- Added canvas undo/redo for supported edits, Ctrl+Z/Ctrl+Y, Ctrl+D device duplication, Delete/Backspace removal, and grid arrangement/fit controls.
- Added spacebar-drag panning and zoom-aware device dragging.
- CLI ping still directs users to the topology packet simulator instead of claiming success. The CLI itself is not yet wired to trigger a topology ping.

## Scope and known limitations

This project does not establish full Packet Tracer feature parity. EIGRP uses hop count rather than the production composite metric; eBGP only exchanges configured networks between reciprocal directly connected peers and has no AS-path propagation; OSPF uses unit link costs and only redistributes static routes. RIP update timers/convergence are deterministic and immediate. VLAN support filters access/trunk paths, models DTP negotiation and basic VTP database sharing, and learns MACs along successful simulated paths; unknown-unicast flooding, full frame switching, BPDU exchanges, per-VLAN STP elections, port roles/states, and port counters are not modeled. VTP advertisements, pruning, passwords, and revision conflict resolution are not modeled. DHCP and DNS forms exist, but their behavior is not a full relay/server protocol implementation. ARP is educational trace output rather than a persistent cache/learning engine. IPv6 lacks neighbor discovery and dynamic routing beyond the RIPng approximation. ACLs provide ordered IPv4 filtering; firewall inspection is limited to a per-run flow model. Production protocol timers, complete service implementations, CLI ping integration, and many device workflows remain incomplete. Cisco IOS is not executed and NetLearn is not a Cisco product or Packet Tracer replacement.

## Verification

- Current verification: `npm test` passed (95 tests), `npm run lint` passed, and `npm run build` passed. Build retains non-blocking Vite config-loader and large-chunk warnings.
- `npm run lint`: passed (`tsc --noEmit`).
- `npm run build`: passed. Vite emitted a non-blocking notice that `vite.config.ts` uses `__dirname` with the native config loader.
- Local development server responded with HTTP 200 at `http://localhost:3000`.

## Practical lab coverage

- The repository contains 15 practical experiments. A regression test confirms every experiment has a topology and a verification objective and checks each published router/switch CLI reference against the simulated CLI. PC command references remain host commands, not IOS commands.
- The device CLI accepts multiline IOS command references, including prompt/mode transitions. The PC command prompt supports the host commands implemented by the simulator; it is not a general operating-system shell.
- Tightened verification checks for NAT overload, RIP v1/v2, single- and multi-area OSPF, PPP/CHAP, HDLC, BGP, EIGRP, and Telnet so the relevant device configuration is checked in addition to topology or generic interface state.
- This coverage means the documented command references are accepted and lab predicates inspect relevant configuration. It does not mean all experiments model complete protocol exchanges, real IOS, or Packet Tracer behavior. Limitations in the scope section still apply.
- Current verification after these updates: 97 tests, lint/typecheck, production build; see the final run results for this workspace state.

## Security, wireless, and link aggregation increment

- Added wireless profiles and a Wireless canvas link. It forwards only between an access point and supported client with matching SSID, security mode, and secured passphrase. It validates credentials but does not perform 802.11 association frames, WPA key exchange, radio/channel behavior, roaming, or encryption.
- Added an ordered allow/deny policy on firewall devices. Denied new flows are dropped; replies to an allowed request pass in that generated trace. This state lasts only for that trace and is not a persistent connection table or complete firewall.
- Added switchport EtherChannel group and LACP/PAgP selection. Path checks require matching group/protocol at both switch ends, and member links in the same group avoid separate spanning-tree blocking. There are no negotiation packets, logical port-channel object, load distribution, member timers, or full failure convergence.
- Full STP/RSTP, IPsec/GRE, persistent stateful NAT/PAT, SNMP/AAA services, expanded route redistribution, voice call control, IoT registration/automation, and timer-driven packet exchanges remain outstanding.

## Service checks and redistribution increment

- Added SNMP server settings for enabled state, version label, and read community. Configured servers reject disabled agents or mismatched communities in SNMP traces. This is a credential gate and sample GetRequest payload, not SNMP encoding, MIB/OID storage, v3 authentication/privacy, or manager polling.
- Added AAA server settings for RADIUS/TACACS+ selection and local username/password/privilege entries. Configured servers accept or reject the submitted `username:password` in the simulator. No RADIUS/TACACS+ packet exchange, shared-secret signing, accounting, or authorization policy engine is implemented.
- Added OSPF `redistribute connected` CLI configuration and startup-config persistence alongside existing static redistribution. The route engine advertises connected prefixes deterministically without route maps, tags, metrics, loop prevention, or inter-protocol redistribution policy.
- These additions remain educational checks. Full SNMP/AAA protocols and broad route redistribution are still gaps.

## Protocol composer and canvas increment

## WAN and traffic marking increment

- Added per-interface WAN encapsulation configuration for HDLC, PPP, PPPoE, and Frame Relay in the device configuration modal, plus CLI commands for encapsulation and Frame Relay DLCI assignment. Encapsulation and DLCI values survive generated running/startup configuration and imported topology validation.
- The path engine treats serial links with no explicit setting as HDLC, requires matching serial encapsulation, rejects serial PPPoE and serial-only encapsulations on Ethernet, and requires both Frame Relay endpoints to have a local DLCI (which may differ by side). These are link compatibility checks; there is no PPP LCP/authentication/IPCP negotiation, PPPoE discovery/session state, Frame Relay cloud/LMI/PVC switching, or timer-driven link state.
- Added per-interface QoS priority selection and maps low/normal/high/voice to DSCP markings 8/0/32/46 in outbound IPv4 request traces. This is packet marking only; there are no egress queues, shaping/policing, congestion, bandwidth reservation, or Layer 2 CoS scheduling.
- Verification for the WAN/wireless/firewall/EtherChannel/service/redistribution increments: `npm test` passed (95 tests), `npm run lint` passed, and `npm run build` passed.

- The packet composer now offers ICMP, HTTP, FTP, TFTP, SMTP, POP3, DNS, DHCP, NTP, SNMP, Telnet, SSH, AAA/RADIUS, RTP, generic TCP, and generic UDP. Traces identify the TCP/UDP protocol number, conventional destination port, and an educational request/response payload. These are packet-trace templates; they do not imply that each server service, handshake, session state, or protocol state machine is implemented. DHCP is represented as an educational Discover/Offer exchange and does not currently model its real link-local broadcast/address-assignment lifecycle.
- Canvas mouse-wheel zoom now anchors around the pointer. Fit-topology centers the layout and scales the full device bounds into view.
- Added IPv6 interface CLI addressing, static IPv6 routes, `ipv6 unicast-routing`, IPv6 default-gateway configuration, route display, and ICMPv6 echo traces with connected/static/dynamic longest-prefix forwarding checks and IPv6 hop-limit fields. RIPng exchanges prefixes deterministically across configured router interfaces with a 15-hop limit and CLI/config-tab control; it does not model link-local next-hop selection, update timers, authentication, or packet-level RTEs. IPv6 still lacks router advertisements, neighbor discovery, SLAAC, DHCPv6, and extension headers.
- Added a deterministic spanning-tree approximation for switch loops and switch CLI configuration/display of PVST/Rapid-PVST/off mode. It blocks redundant switch links in the forwarding graph; BPDU behavior and full STP/RSTP state transitions remain unimplemented.
- Added multi-area OSPF path learning across routers that share area IDs on each active link, correct receiver-side next-hop selection, and optional static-route redistribution. The model still uses unit link costs and does not model LSAs, DR/BDR election, timers, or dynamic protocol redistribution.
- Added basic VTP server/client VLAN database propagation for connected switches in a matching domain/version, transparent-mode forwarding behavior, configuration UI, CLI status, and persistence. Added DTP dynamic auto/desirable negotiation for switchport forwarding and CLI/UI controls. These are deterministic topology models; wire-level negotiations and VTP security/revision rules are not implemented.
- Added CDP neighbor and detail display based on active topology links, plus global CDP enable/disable and CLI persistence.
- Added numbered IPv4 ACL creation/removal, first-match protocol/address/port filtering on router interface ingress/egress, CLI display and startup-config persistence, and a Config-tab rule editor with interface bindings. This is stateless basic ACL filtering.
- Added educational NAT overload setup through the CLI and Config UI, inside/outside interface roles, ACL and outside-interface selection, outbound source address and transport-port rewriting, reply destination and port reversal, topology validation, and startup-config persistence. Port mappings are deterministic trace examples, not a stateful NAT/PAT session table; collision handling and concurrent-flow state are not modeled.
- Still outstanding from the requested matrix: OSPF redistribution beyond static routes; full SNMP/AAA server behavior; IPsec/GRE; persistent stateful NAT/PAT; full STP/RSTP and LACP/PAgP negotiations/load balancing; WAN negotiation and Frame Relay PVC switching; QoS scheduling beyond DSCP marking; full 802.11 association/security; voice call control; IoT registration/automation; and production protocol timers/exchanges.

## Remaining feature scope and CLI verification boundary

These items are the remaining roadmap scope, not claims of completed functionality:

1. **Routing:** OSPF redistribution policies beyond connected/static routes, including route maps, metrics, tags, and loop prevention.
2. **Security:** IPsec and GRE tunnels; persistent stateful NAT/PAT mappings and firewall connection tracking.
3. **Switching:** BPDU exchanges, STP/RSTP election and port-state convergence; LACP/PAgP negotiation, logical port channels, and load balancing.
4. **WAN:** PPP/PPPoE negotiation/authentication and Frame Relay cloud, LMI, and PVC switching.
5. **Services:** SNMP MIB/OID operations and manager polling; RADIUS/TACACS+ wire exchanges, accounting, and authorization.
6. **Wireless, voice, IoT:** 802.11 association/key exchange/roaming, call control, and device registration/automation.
7. **Protocol realism:** packet-level state machines, timers, retransmissions, and convergence/failure behavior across protocols.

CLI verification is bounded: tests run each published router/switch CLI reference from the 15 lab manuals and exercise selected interpreter commands in `tests/routerCli.test.mjs`. This is not an exhaustive test of the complete IOS command language, aliases, or all device-specific command forms. The lab coverage test skips PC/Remote-PC prompt lines, so host command behavior is not included in that CLI result. Successful tests show the checked command subset works in the simulator; they do not certify all protocols or Packet Tracer parity.
