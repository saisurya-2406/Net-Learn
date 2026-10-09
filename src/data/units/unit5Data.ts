import { UnitSection } from '../../types/syllabus';

export const UNIT_5_DATA: UnitSection = {
  id: 'unit-5',
  unitNumber: 5,
  title: 'Unit 5: Transport and Application Layer Protocols',
  subtitle: 'Port Numbers, User Datagram Protocol (UDP), Transmission Control Protocol (TCP), WWW & HTTP, FTP, Email, Telnet & DNS',
  iconName: 'Globe',
  topics: [
    {
      id: 'u5-t1',
      title: 'Port Numbers, UDP & TCP Architecture',
      description: 'Transport layer process-to-process delivery, port numbering ranges, connectionless UDP vs connection-oriented TCP.',
      keyPoints: [
        'Port Numbers: 16-bit integers (0 to 65535) identifying application endpoints.',
        '• Well-Known Ports (0 - 1023): HTTP (80), HTTPS (443), DNS (53), DHCP (67/68), Telnet (23), SSH (22), FTP (20/21), SMTP (25).',
        '• Registered Ports (1024 - 49151) and Ephemeral/Dynamic Ports (49152 - 65535).',
        'User Datagram Protocol (UDP - RFC 768): Connectionless, lightweight 8-byte fixed header (Source Port, Dest Port, Length, Checksum). No handshakes, no acknowledgments, no congestion control. Best for real-time multimedia, DNS queries, DHCP, VoIP.',
        'Transmission Control Protocol (TCP - RFC 9293): Connection-oriented, reliable in-order byte stream. 20-60 byte header with Sequence numbers, Acknowledgment numbers, Window size, Checksum, and Flags (SYN, ACK, FIN, RST, PSH, URG).',
        'TCP 3-Way Handshake: SYN -> SYN-ACK -> ACK. TCP 4-Way Termination: FIN -> ACK -> FIN -> ACK.'
      ],
      examTips: 'Exam Comparison Table: Tabulate TCP vs UDP on: 1. Connection-mode 2. Reliability & retransmission 3. Header size (20-60B vs 8B) 4. Flow & congestion control 5. Typical protocols.',
      diagramOrSnippet: `TCP 3-WAY HANDSHAKE:
[ Client ]                                     [ Server ]
    │ ───────── 1. SYN [Seq = x] ────────────► │ (SYN-RCVD)
    │ ◄──────── 2. SYN-ACK [Seq=y, Ack=x+1] ── │
    │ ───────── 3. ACK [Seq=x+1, Ack=y+1] ───► │
    ▼                                          ▼
[ ESTABLISHED ]                            [ ESTABLISHED ]`,
      vivaQuestions: [
        { q: 'What is the default header size of TCP and UDP?', a: 'TCP header is minimum 20 bytes; UDP header is fixed at 8 bytes.' },
        { q: 'Why do DNS queries utilize UDP port 53 rather than TCP?', a: 'Because DNS queries consist of short single-packet request/response pairs, making UDP much faster without handshake latency.' }
      ],
      references: [
        { title: 'TCP and UDP in Transport Layer', url: 'https://www.geeksforgeeks.org/computer-networks/transport-layer-protocols/', type: 'Guide', source: 'GeeksforGeeks' },
        { title: 'RFC 9293: Transmission Control Protocol', url: 'https://www.rfc-editor.org/info/rfc9293/', type: 'RFC', source: 'RFC Editor' },
        { title: 'RFC 854: Telnet Protocol Specification', url: 'https://www.rfc-editor.org/info/rfc854/', type: 'RFC', source: 'RFC Editor' }
      ]
    },
    {
      id: 'u5-t2',
      title: 'World Wide Web (WWW) & HyperText Transfer Protocol (HTTP)',
      description: 'Web client-server architecture, methods, persistent connections, and TLS security.',
      keyPoints: [
        'HTTP Evolution (RFC 9110 / RFC 9113 / RFC 9114):',
        '• HTTP/1.0: Non-persistent (new TCP handshake per object, high RTT latency).',
        '• HTTP/1.1: Persistent connections by default (`Connection: keep-alive`), allowing multiple objects per connection.',
        '• HTTP/2: Binary framing, stream multiplexing over one TCP connection, and HPACK header compression (RFC 9113).',
        '• HTTP/3: Runs over QUIC and avoids TCP-level head-of-line blocking between independent streams (RFC 9114).',
        'Standard Request Methods: GET (Retrieve data), POST (Submit form data), PUT (Upload/replace), DELETE (Remove resource).',
        'Status Codes: 200 OK, 301 Moved Permanently, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error, 502 Bad Gateway.',
        'HTTPS (Port 443): Encapsulates HTTP inside TLS/SSL encryption.'
      ],
      examTips: 'Compare Non-persistent HTTP/1.0 (2 RTT per object) vs Persistent HTTP/1.1 (1 RTT per object) vs HTTP/2 (Multiplexing).',
      diagramOrSnippet: `HTTP/1.1 PERSISTENT vs HTTP/2 MULTIPLEXING:
HTTP/1.1: [TCP Handshake] ──► [Req 1] ──► [Resp 1] ──► [Req 2] ──► [Resp 2] (Serial)
HTTP/2:   [TCP + TLS]     ──► ═════════[Multiplexed Stream 1, 2, 3]═════════► (Parallel)`,
      vivaQuestions: [
        { q: 'What port numbers are assigned by default to HTTP and HTTPS?', a: 'HTTP uses TCP Port 80; HTTPS uses TCP Port 443.' },
        { q: 'What is the benefit of HTTP/2 stream multiplexing?', a: 'It allows interleaving multiple concurrent requests and responses over a single TCP connection, eliminating head-of-line blocking.' }
      ],
      references: [
        { title: 'RFC 9110: HTTP Semantics', url: 'https://www.rfc-editor.org/info/rfc9110/', type: 'RFC', source: 'RFC Editor' },
        { title: 'RFC 9113: HTTP/2', url: 'https://www.rfc-editor.org/info/rfc9113/', type: 'RFC', source: 'RFC Editor' },
        { title: 'RFC 9114: HTTP/3', url: 'https://www.rfc-editor.org/info/rfc9114/', type: 'RFC', source: 'RFC Editor' }
      ]
    },
    {
      id: 'u5-t3',
      title: 'File Transfer Protocol (FTP) & Electronic Mail (SMTP, POP3, IMAP)',
      description: 'Dual-port file transmission and multi-tier store-and-forward email architecture.',
      keyPoints: [
        'File Transfer Protocol (FTP - RFC 959):',
        '• Dual-Port Out-of-Band Architecture:',
        '  - Control Connection (TCP Port 21): Carries user commands and credentials. Stays open throughout session.',
        '  - Data Connection (TCP Port 20): Opened and closed dynamically per file transfer.',
        '• Modes: Active Mode (Server connects to client data port) vs Passive Mode (PASV - client initiates data connection, firewall friendly).',
        'Electronic Mail Architecture:',
        '• SMTP (Simple Mail Transfer Protocol - RFC 5321): Push protocol over TCP Port 25 (or 587 submission) for sending mail.',
        '• POP3 (Post Office Protocol 3 - TCP Port 110): Pull protocol; downloads and deletes mail from server.',
        '• IMAP4 (Internet Message Access Protocol 4 - TCP Port 143): Pull protocol; synchronizes folders and retains mail on server.',
        '• MIME: Encodes binary media attachments into 7-bit ASCII.'
      ],
      examTips: 'Exam Question: Explain why FTP uses two separate connections while HTTP uses one. Answer: FTP separates control signaling out-of-band to allow sending commands like ABORT during a massive file transfer without disrupting the data stream.',
      diagramOrSnippet: `FTP DUAL-PORT ARCHITECTURE:
[ FTP Client ] ═════════ Control Connection (TCP Port 21) ════════► [ FTP Server ]
               ◄════════ Data Connection (TCP Port 20) ═══════════► (Payload files)`,
      vivaQuestions: [
        { q: 'Which two ports are utilized by File Transfer Protocol (FTP) and for what purpose?', a: 'Port 21 for Control/Signaling commands and Port 20 for actual Data file transfers.' },
        { q: 'What is the difference between POP3 and IMAP for email retrieval?', a: 'POP3 downloads mail locally and removes it from the server, while IMAP synchronizes folders and keeps email stored on the server.' }
      ],
      references: [
        { title: 'RFC 959: File Transfer Protocol', url: 'https://www.rfc-editor.org/info/rfc959/', type: 'RFC', source: 'RFC Editor' },
        { title: 'RFC 5321: Simple Mail Transfer Protocol', url: 'https://www.rfc-editor.org/info/rfc5321/', type: 'RFC', source: 'RFC Editor' },
        { title: 'RFC 9051: Internet Message Access Protocol', url: 'https://www.rfc-editor.org/info/rfc9051/', type: 'RFC', source: 'RFC Editor' },
        { title: 'RFC 1939: Post Office Protocol Version 3', url: 'https://www.rfc-editor.org/info/rfc1939/', type: 'RFC', source: 'RFC Editor' }
      ]
    },
    {
      id: 'u5-t4',
      title: 'Telnet Configuration & Remote Terminal Management',
      description: 'Virtual terminal emulation protocol for remote CLI management of Cisco routers and switches.',
      keyPoints: [
        'Telnet (RFC 854): Operates over TCP Port 23. Provides bidirectional interactive character-oriented terminal access to remote network equipment.',
        'Limitation: Telnet transmits all data—including passwords—in clear unencrypted plaintext. Replaced by SSH (Secure Shell - TCP Port 22) in modern production.',
        'Cisco IOS Telnet Configuration on VTY Lines:',
        '1. Set enable secret password: `Router(config)# enable secret cisco123`',
        '2. Enter virtual terminal configuration: `Router(config)# line vty 0 4`',
        '3. Set vty access password: `Router(config-line)# password ciscovty`',
        '4. Enable login checking: `Router(config-line)# login`',
        '5. Specify allowed transport: `Router(config-line)# transport input telnet`',
        'Associated Lab: Lab 15 (Telnet Configuration on Cisco Router).'
      ],
      examTips: 'Cisco CLI Syntax for Telnet: Always remember to configure both `enable secret` and `line vty 0 4` with `password` and `login`. If `enable secret` is missing, Telnet users cannot enter privileged EXEC mode!',
      diagramOrSnippet: `CISCO IOS TELNET CONFIGURATION WORKFLOW:
Router(config)# enable secret AdminPass123
Router(config)# line vty 0 4
Router(config-line)# password VtyPass123
Router(config-line)# login
Router(config-line)# transport input telnet
Router(config-line)# exit`,
      vivaQuestions: [
        { q: 'Why is Telnet considered insecure for remote management across untrusted networks?', a: 'Because Telnet transmits all credentials and commands in clear text, making it vulnerable to packet sniffing.' },
        { q: 'What virtual lines are configured in Cisco IOS to enable Telnet access?', a: 'The VTY (Virtual Teletype) lines, configured via "line vty 0 4".' }
      ],
      references: [
        { title: 'RFC 854: Telnet Protocol Specification', url: 'https://www.rfc-editor.org/info/rfc854/', type: 'RFC', source: 'RFC Editor' },
        { title: 'RFC 4251: Secure Shell Protocol Architecture', url: 'https://www.rfc-editor.org/info/rfc4251/', type: 'RFC', source: 'RFC Editor' }
      ]
    },
    {
      id: 'u5-t5',
      title: 'Domain Name System (DNS) Architecture & Resolution',
      description: 'Distributed hierarchical database mapping domain names to numerical IP addresses.',
      keyPoints: [
        'DNS Characteristics (RFC 1034 / RFC 1035): Operates over UDP Port 53 (and TCP 53 for zone transfers and responses > 512 bytes).',
        'Hierarchical Namespace:',
        '• Root DNS Servers (13 logical root identities replicated worldwide via Anycast).',
        '• Top-Level Domain (TLD) Servers: Generic (.com, .org, .edu) and Country-Code (.us, .in, .uk).',
        '• Authoritative DNS Servers: Official organization-owned servers holding official master mapping records.',
        '• Local DNS Nameserver: ISP or enterprise resolver with caching.',
        'Query Resolution Modes: Recursive (Resolver takes full responsibility) vs Iterative (Server returns referrals to next level).',
        'Resource Record Types (RR): A (IPv4), AAAA (IPv6), CNAME (Canonical alias), MX (Mail Exchange), PTR (Reverse lookup).'
      ],
      examTips: 'Exam Workflow Drawing: Draw the 8-step iterative DNS lookup: Client -> Local DNS -> Root -> TLD -> Authoritative -> Local DNS -> Client. Clearly show UDP Port 53.',
      diagramOrSnippet: `DNS RESOLUTION WORKFLOW:
[Client] ──1. Query "example.com"──► [Local DNS Cache]
                                         │ 2. Query Root
                                         ▼
                                  [Root Server (.)]
                                         │ 3. Refer .com TLD
                                         ▼
                                  [.com TLD Server]
                                         │ 4. Refer Authoritative
                                         ▼
                                  [Authoritative DNS] ──► Returns IP!`,
      vivaQuestions: [
        { q: 'What is the purpose of an MX record in DNS?', a: 'To designate the mail server responsible for accepting incoming email for a domain.' },
        { q: 'What transport protocol and port are used for standard DNS lookups?', a: 'UDP Port 53.' }
      ],
      references: [
        { title: 'RFC 1034: Domain Names – Concepts and Facilities', url: 'https://www.rfc-editor.org/info/rfc1034/', type: 'RFC', source: 'RFC Editor' },
        { title: 'RFC 1035: Domain Names – Implementation and Specification', url: 'https://www.rfc-editor.org/info/rfc1035/', type: 'RFC', source: 'RFC Editor' },
        { title: 'RFC 7766: DNS Transport over TCP', url: 'https://www.rfc-editor.org/info/rfc7766/', type: 'RFC', source: 'RFC Editor' }
      ]
    }
  ]
};
