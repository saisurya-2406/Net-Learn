import { UnitSection } from '../../types/syllabus';

export const UNIT_4_DATA: UnitSection = {
  id: 'unit-4',
  unitNumber: 4,
  title: 'Unit 4: Medium Access Control',
  subtitle: 'ALOHA, CSMA/CD, CSMA/CA, Ethernet, Token Ring, Flow Control (Stop & Wait, Sliding Window), Error Control (ARQ), Error Detection (Parity, Checksum, CRC), Error Correction (Hamming), Data-Link Protocols (HDLC, PPP)',
  iconName: 'Layers',
  topics: [
    {
      id: 'u4-t1',
      title: 'Multiple Access Protocols: ALOHA, CSMA/CD, CSMA/CA, Ethernet & Token Ring',
      description: 'Channel allocation mechanisms for shared broadcast networks, collision detection and avoidance.',
      keyPoints: [
        'Pure ALOHA: Stations transmit immediately when ready. Collision if frames overlap. Vulnerable time = 2 * T_fr. Maximum throughput S_max = 1 / (2e) ≈ 18.4% at G = 0.5.',
        'Slotted ALOHA: Time is divided into slots equal to frame duration T_fr. Stations can transmit only at beginning of slot. Vulnerable time = T_fr. Maximum throughput S_max = 1 / e ≈ 36.8% at G = 1.0.',
        'CSMA/CD (Carrier Sense Multiple Access with Collision Detection - Ethernet IEEE 802.3):',
        '• "Listen before talk": Sense medium. If idle, transmit. If busy, defer.',
        '• "Listen while talk": Continuously monitor electrical voltage while transmitting.',
        '• If collision detected, abort immediately and broadcast 32-bit JAM signal.',
        '• Binary Exponential Backoff: Wait R * 51.2 µs, R in [0, 2^k - 1], k = min(attempt, 10).',
        '• Collision Detection Requirement: T_trans >= 2 * T_prop. Minimum Frame Size L_min = 2 * T_prop * Bandwidth (64 bytes in Ethernet).',
        'CSMA/CA (Collision Avoidance - Wi-Fi IEEE 802.11): Uses Interframe Spacing (DIFS, SIFS), Contention Window backoff, and optional RTS/CTS (Request-to-Send / Clear-to-Send) virtual carrier sensing to prevent collisions.',
        'Token Ring (IEEE 802.5): Deterministic token passing around a ring. Station holds token, transmits data frame, receiver sets copy bit, frame circulates back to sender to be stripped. Zero collisions.',
        'Associated Lab: Lab 10 (Implementation of Multi Area OSPF).'
      ],
      examTips: 'Exam Minimum Frame Size Formula: L_min = 2 * T_prop * Bandwidth. For distance d = 1 km, speed s = 2*10^8 m/s, Bandwidth = 100 Mbps: T_prop = 1000 / (2*10^8) = 5 µs. L_min = 2 * 5 µs * 100 Mbps = 1000 bits (125 bytes).',
      diagramOrSnippet: `CSMA/CD vs CSMA/CA:
CSMA/CD (Wired Ethernet):
[ Carrier Sense ] ──► Idle? ──► Transmit & Monitor ──► Collision? ──► JAM & Backoff
CSMA/CA (Wireless Wi-Fi):
[ Carrier Sense ] ──► Idle? ──► Wait DIFS ──► Random Backoff ──► RTS/CTS Exchange`,
      vivaQuestions: [
        { q: 'Why is CSMA/CD not used in wireless 802.11 networks?', a: 'Because wireless antennas cannot transmit and listen simultaneously (transmit signal overpowers received signal), requiring Collision Avoidance (CSMA/CA) instead.' },
        { q: 'What is the maximum theoretical channel efficiency of Pure ALOHA?', a: '18.4% (1 / 2e), achieved at channel traffic G = 0.5.' }
      ]
    },
    {
      id: 'u4-t2',
      title: 'Flow Control: Stop-and-Wait & Sliding Window',
      description: 'Techniques ensuring a transmitting entity does not overwhelm the processing or buffer capacity of the receiver.',
      keyPoints: [
        'Stop-and-Wait Flow Control: Sender transmits one frame and waits for acknowledgment (ACK) before transmitting next. Efficiency: eta = 1 / (1 + 2a), where a = T_prop / T_trans. Very low throughput on high latency or long distance links.',
        'Sliding Window Flow Control: Sender can transmit up to W frames without waiting for an individual ACK. Receiver advertises window size based on buffer capacity. Allows full link pipelining and significantly higher throughput.'
      ],
      examTips: 'Formula to remember: Parameter a = T_prop / T_trans. Efficiency of Stop-and-Wait is 1 / (1 + 2a). Efficiency of Sliding Window is W / (1 + 2a) (capped at 100%).',
      diagramOrSnippet: `STOP-AND-WAIT vs SLIDING WINDOW:
Stop-and-Wait:  [Send Frame 0] ──► [Wait ACK 0] ──► [Send Frame 1] ──► [Wait ACK 1]
Sliding Window: [Send 0, 1, 2, 3 in pipeline] ──► [Continuous Transmission]`,
      vivaQuestions: [
        { q: 'What happens to Stop-and-Wait efficiency as propagation delay increases?', a: 'Efficiency drops drastically because the sender spends most of its time idle waiting for round-trip propagation.' },
        { q: 'How does sliding window flow control prevent receiver buffer overflow?', a: 'The receiver explicitly advertises its remaining buffer space in an acknowledgment field (window size).' }
      ]
    },
    {
      id: 'u4-t3',
      title: 'Error Control: Stop-and-Wait ARQ & Sliding Window ARQ (Go-Back-N & Selective Repeat)',
      description: 'Automatic Repeat reQuest mechanisms combining flow control with retransmission timers to guarantee error-free delivery.',
      keyPoints: [
        'Stop-and-Wait ARQ: Alternating 1-bit sequence numbers (0 and 1). Sender retransmits frame if timeout occurs before ACK is received.',
        'Go-Back-N ARQ: Pipelined sliding window. Sender window size W_s = 2^m - 1 (for m-bit sequence numbers). Receiver window W_r = 1. Uses cumulative ACKs. If frame i is lost, receiver drops all subsequent out-of-order frames; sender must retransmit ALL frames from i onward.',
        'Selective Repeat ARQ: Sender window W_s = 2^(m - 1). Receiver window W_r = 2^(m - 1). Receiver buffers out-of-order frames and sends NAK or Selective ACKs. Only the damaged or lost frame is retransmitted, maximizing throughput.'
      ],
      examTips: 'Exam Window Size Rules: For m-bit sequence numbers: Maximum Sender Window for Go-Back-N is 2^m - 1. For Selective Repeat, W_s = W_r = 2^(m - 1). Violating this causes ambiguity between old and new duplicate frames.',
      diagramOrSnippet: `GO-BACK-N vs SELECTIVE REPEAT:
GO-BACK-N (W=4):
Sender:    [0] [1] [2] [3] ──► (Frame 1 Lost!)
Receiver:  ACK0 ── Discard 2 & 3 (Out of order)
Resend:    [1] [2] [3] [4] (Retransmits all from 1!)

SELECTIVE REPEAT (W=4):
Sender:    [0] [1] [2] [3] ──► (Frame 1 Lost!)
Receiver:  ACK0 ── Buffers 2 & 3 -> NAK 1
Resend:    [1] ONLY! (Buffers 2 & 3 merged, saves bandwidth)`,
      vivaQuestions: [
        { q: 'Why is receiver window size in Go-Back-N equal to 1?', a: 'Because the GBN receiver cannot buffer out-of-order frames; it only accepts frames in strict sequential order.' },
        { q: 'What is the maximum sender window for Selective Repeat with 3-bit sequence numbers?', a: 'W_s = 2^(3 - 1) = 2^2 = 4 frames.' }
      ]
    },
    {
      id: 'u4-t4',
      title: 'Error Detection (Parity, Checksum, CRC) & Error Correction (Hamming Codes)',
      description: 'Mathematical redundancy schemes to detect and correct transmission bit errors caused by channel noise.',
      keyPoints: [
        'Error Detection Schemes:',
        '• Parity Check: Appends 1 bit for Even or Odd parity. Detects only single-bit errors.',
        '• Internet Checksum: Computes 1\'s complement sum of 16-bit words.',
        '• CRC (Cyclic Redundancy Check): Polynomial division modulo-2 using bitwise XOR without borrows. Frame Check Sequence (FCS) remainder is appended to data.',
        'Error Correction (Hamming Code):',
        '• Parity bits placed at power-of-2 positions (1, 2, 4, 8...).',
        '• Parity inequality condition: 2^p >= m + p + 1 (m = data bits, p = parity bits).',
        '• Receiver syndrome binary index points directly to the erroneous bit position for automated single-bit error correction.'
      ],
      examTips: 'Solved CRC Problem: Message M = 110101, Generator G = 1011 (k=3). Append 3 zeros: 110101000. Perform XOR division by 1011. Remainder = 011. Transmitted frame = 110101011.',
      diagramOrSnippet: `CRC MODULO-2 DIVISION:
Message M: 110101   Generator G: 1011
Append k=3 zeros:  1 1 0 1 0 1 0 0 0
XOR division by 1011 -> Remainder: 0 1 1
Transmitted Codeword: 1 1 0 1 0 1 0 1 1 (Zero remainder at receiver!)`,
      vivaQuestions: [
        { q: 'What is the minimum Hamming distance required to detect d bit errors?', a: 'd_min = d + 1.' },
        { q: 'How many parity bits are required to correct a single error in a 4-bit data word?', a: 'Using 2^p >= 4 + p + 1; for p=3, 2^3 = 8 >= 8, so 3 parity bits are required.' }
      ]
    },
    {
      id: 'u4-t5',
      title: 'Data-Link Layer Protocols: HDLC & PPP Configuration',
      description: 'Point-to-point link encapsulation protocols for synchronous and asynchronous serial communications.',
      keyPoints: [
        'HDLC (High-Level Data Link Control - ISO 13239):',
        '• Bit-oriented protocol using Flag 01111110 and bit stuffing.',
        '• Cisco Default: Cisco HDLC includes a proprietary 2-byte protocol type field (allowing multiprotocol routing over serial).',
        '• Cisco IOS Command: `Router(config-if)# encapsulation hdlc`.',
        'PPP (Point-to-Point Protocol - RFC 1661):',
        '• Industry open-standard point-to-point serial encapsulation.',
        '• Three Components: 1. HDLC-like framing 2. LCP (Link Control Protocol) for link establishment/negotiation 3. NCP (Network Control Protocols, e.g. IPCP) for network-layer configuration.',
        '• Authentication Support: PAP (Password Authentication Protocol - 2-way plain text) and CHAP (Challenge Handshake Authentication Protocol - 3-way encrypted MD5 challenge).',
        '• Cisco IOS Command: `Router(config-if)# encapsulation ppp`.',
        'Associated Labs: Lab 11 (PPP Configuration) and Lab 12 (HDLC Configuration).'
      ],
      examTips: 'Cisco CLI Syntax in Exams: HDLC: `interface Serial0/0/0` -> `encapsulation hdlc`. PPP: `interface Serial0/0/0` -> `encapsulation ppp` -> `ppp authentication chap`.',
      diagramOrSnippet: `PPP ARCHITECTURE LAYERS:
[ Layer 3: IPv4 / IPv6 ]
           │
[ Network Control Protocol (IPCP / IPv6CP) ]
[ Link Control Protocol (LCP) + CHAP Auth  ]
           │
[ High-Level Data Link Framing (RFC 1662)  ]`,
      vivaQuestions: [
        { q: 'What is the advantage of PPP over standard HDLC?', a: 'PPP is an open multi-vendor standard supporting dynamic IP negotiation (IPCP) and secure authentication (CHAP).' },
        { q: 'Why is CHAP authentication more secure than PAP in PPP?', a: 'CHAP uses a 3-way handshake with an MD5 hashed challenge; passwords are never sent across the link in clear text.' }
      ],
      references: [
        { title: 'GeeksforGeeks - Point-to-Point Protocol (PPP)', url: 'https://www.geeksforgeeks.org/point-to-point-protocol-ppp/', type: 'Guide', source: 'GeeksforGeeks' },
        { title: 'GeeksforGeeks - High-Level Data Link Control (HDLC)', url: 'https://www.geeksforgeeks.org/high-level-data-link-control-hdlc/', type: 'Guide', source: 'GeeksforGeeks' }
      ]
    }
  ]
};
