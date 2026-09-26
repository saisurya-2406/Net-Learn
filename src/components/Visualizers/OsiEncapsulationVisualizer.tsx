import React, { useState } from 'react';
import { Layers, ArrowDown, ArrowUp, Info, Eye } from 'lucide-react';

interface LayerInfo {
  layerNum: number;
  name: string;
  tcpIpEquivalent: string;
  pdu: string;
  coreResponsibilities: string;
  keyProtocols: string[];
  hardwareDevices: string[];
  headerFields: Array<{ name: string; size: string; purpose: string }>;
  sampleSnippet: string;
}

const OSI_LAYERS: LayerInfo[] = [
  {
    layerNum: 7,
    name: 'Application Layer',
    tcpIpEquivalent: 'Application',
    pdu: 'Data / Messages',
    coreResponsibilities: 'Provides human-computer interaction services, network API interfaces, authentication, and presentation syntax negotiation.',
    keyProtocols: ['HTTP/HTTPS', 'DNS', 'DHCP', 'FTP', 'SSH', 'SMTP'],
    hardwareDevices: ['Workstations', 'Web Servers', 'Application Gateways'],
    headerFields: [
      { name: 'Request Method', size: 'Variable', purpose: 'e.g., GET, POST, PUT' },
      { name: 'URI / Path', size: 'Variable', purpose: 'e.g., /api/data, /index.html' },
      { name: 'Headers', size: 'Variable', purpose: 'Host, User-Agent, Content-Type' },
    ],
    sampleSnippet: 'GET /index.html HTTP/1.1\r\nHost: www.example.com\r\nUser-Agent: NetLearn/2.0\r\n\r\n',
  },
  {
    layerNum: 6,
    name: 'Presentation Layer',
    tcpIpEquivalent: 'Application',
    pdu: 'Formatted Data',
    coreResponsibilities: 'Syntax translation, character encoding (ASCII, UTF-8), compression (Gzip), and cryptographic encryption/decryption (TLS/SSL).',
    keyProtocols: ['TLS/SSL', 'JPEG/PNG', 'MIME', 'ASCII/Unicode'],
    hardwareDevices: ['Workstations', 'TLS Offloader'],
    headerFields: [
      { name: 'TLS Record ContentType', size: '1 Byte', purpose: 'Handshake (22), Application (23)' },
      { name: 'TLS Version', size: '2 Bytes', purpose: 'e.g. TLS 1.3 (0x0304)' },
      { name: 'Ciphertext Length', size: '2 Bytes', purpose: 'Encrypted payload payload length' },
    ],
    sampleSnippet: '[Encrypted TLS Application Record with AES-256-GCM cipher]',
  },
  {
    layerNum: 5,
    name: 'Session Layer',
    tcpIpEquivalent: 'Application',
    pdu: 'Session Tokens',
    coreResponsibilities: 'Establishes, manages, synchronizes, and terminates communication sessions and dialogs between applications (full/half-duplex checkpoints).',
    keyProtocols: ['NetBIOS', 'RPC', 'PPTP', 'SOCKS'],
    hardwareDevices: ['Workstations', 'Session Gateways'],
    headerFields: [
      { name: 'Session ID', size: 'Variable', purpose: 'Identifies established dialogue state' },
      { name: 'Checkpoint / Token', size: 'Variable', purpose: 'Permits recovery after mid-stream drops' },
    ],
    sampleSnippet: '[RPC / Session Synchronizer Dialogue Token: 0x9F82A1B0]',
  },
  {
    layerNum: 4,
    name: 'Transport Layer',
    tcpIpEquivalent: 'Transport',
    pdu: 'Segment (TCP) / Datagram (UDP)',
    coreResponsibilities: 'End-to-end process-to-process communication, port multiplexing, segmentation, reassembly, reliable flow control (TCP), and congestion avoidance.',
    keyProtocols: ['TCP', 'UDP', 'QUIC', 'SCTP'],
    hardwareDevices: ['Stateful Firewalls', 'Layer 4 Load Balancers'],
    headerFields: [
      { name: 'Source Port', size: '16 Bits (2B)', purpose: 'Ephemeral client port (e.g. 51842)' },
      { name: 'Destination Port', size: '16 Bits (2B)', purpose: 'Well-known server port (e.g. 80, 443)' },
      { name: 'Sequence Number', size: '32 Bits (4B)', purpose: 'Bytes tracking for reliable ordering' },
      { name: 'Acknowledgment Number', size: '32 Bits (4B)', purpose: 'Next expected byte from sender' },
      { name: 'Control Flags', size: '9 Bits', purpose: 'SYN, ACK, FIN, RST, PSH, URG' },
      { name: 'Window Size', size: '16 Bits (2B)', purpose: 'Advertised receiver buffer capacity' },
      { name: 'Checksum', size: '16 Bits (2B)', purpose: 'Error check covering header + pseudo-header' },
    ],
    sampleSnippet: 'TCP [Src: 52410, Dst: 443, Seq: 1001, Ack: 5001, Flags: [ACK], Win: 65535]',
  },
  {
    layerNum: 3,
    name: 'Network Layer',
    tcpIpEquivalent: 'Internet',
    pdu: 'Packet',
    coreResponsibilities: 'Host-to-host logical addressing (IPv4/IPv6), hierarchical routing across inter-networks, path determination, and fragmentation.',
    keyProtocols: ['IPv4', 'IPv6', 'ICMP', 'OSPF', 'BGP', 'ARP'],
    hardwareDevices: ['Routers', 'Layer 3 Multilayer Switches'],
    headerFields: [
      { name: 'Version & IHL', size: '8 Bits (1B)', purpose: 'IPv4 (4) and Header Length (typically 20B)' },
      { name: 'Type of Service / DSCP', size: '8 Bits (1B)', purpose: 'Quality of service & priority queuing' },
      { name: 'Total Length', size: '16 Bits (2B)', purpose: 'Entire packet size including payload' },
      { name: 'Time to Live (TTL)', size: '8 Bits (1B)', purpose: 'Hop limit counter to kill routing loops' },
      { name: 'Protocol', size: '8 Bits (1B)', purpose: 'Payload type: TCP (6), UDP (17), ICMP (1)' },
      { name: 'Header Checksum', size: '16 Bits (2B)', purpose: '1\'s complement checksum of IPv4 header' },
      { name: 'Source IP Address', size: '32 Bits (4B)', purpose: 'e.g., 192.168.1.50' },
      { name: 'Destination IP Address', size: '32 Bits (4B)', purpose: 'e.g., 93.184.216.34' },
    ],
    sampleSnippet: 'IPv4 [Src: 192.168.1.50, Dst: 93.184.216.34, TTL: 64, Proto: TCP(6), Len: 52]',
  },
  {
    layerNum: 2,
    name: 'Data Link Layer',
    tcpIpEquivalent: 'Network Access',
    pdu: 'Frame',
    coreResponsibilities: 'Hop-by-hop node-to-node framing across physical links, physical MAC addressing, media access control (CSMA/CD), and CRC error detection.',
    keyProtocols: ['Ethernet (802.3)', 'Wi-Fi (802.11)', 'PPP', 'VLAN (802.1Q)'],
    hardwareDevices: ['Layer 2 Switches', 'Bridges', 'NICs'],
    headerFields: [
      { name: 'Preamble + SFD', size: '8 Bytes', purpose: 'Bit clock synchronization (101010...10101011)' },
      { name: 'Destination MAC', size: '6 Bytes (48b)', purpose: 'e.g., 00:1A:2B:3C:4D:5E' },
      { name: 'Source MAC', size: '6 Bytes (48b)', purpose: 'e.g., 00:AA:BB:CC:DD:EE' },
      { name: 'EtherType', size: '2 Bytes', purpose: '0x0800 (IPv4), 0x86DD (IPv6), 0x0806 (ARP)' },
      { name: 'FCS / CRC-32', size: '4 Bytes', purpose: 'Cyclic redundancy check polynomial remainder' },
    ],
    sampleSnippet: 'Ethernet II [D-MAC: 00:1A:2B:3C:4D:5E, S-MAC: 00:AA:BB:CC:DD:EE, Type: 0x0800, FCS: 0x8E29B1A0]',
  },
  {
    layerNum: 1,
    name: 'Physical Layer',
    tcpIpEquivalent: 'Network Access',
    pdu: 'Bits',
    coreResponsibilities: 'Physical transmission of raw unstructured bit streams over copper cables, optical fibers, or radio frequency wireless waves.',
    keyProtocols: ['1000BASE-T', '10GBASE-LR', 'EIA/TIA-232', 'DSL'],
    hardwareDevices: ['Hubs', 'Repeaters', 'Cables (Cat6/Fiber)', 'Transceivers (SFP+)'],
    headerFields: [
      { name: 'Voltage / Signaling', size: 'Physical', purpose: '+0.85V to -0.85V differential signaling' },
      { name: 'Modulation', size: 'Physical', purpose: 'PAM-5, QAM-64, Manchester encoding' },
      { name: 'Bit Timing', size: '1 ns (1Gbps)', purpose: 'Clock tick per symbol transition' },
    ],
    sampleSnippet: '01000111 01000101 01010100 00100000 00101111 01101001 01101110 01100100 01100101 01111000...',
  },
];

export const OsiEncapsulationVisualizer: React.FC = () => {
  const [selectedLayerIndex, setSelectedLayerIndex] = useState<number>(3); // Default to Layer 4 (Transport)
  const [direction, setDirection] = useState<'encapsulate' | 'decapsulate'>('encapsulate');
  const [activeStep, setActiveStep] = useState<number>(0);

  const selectedLayer = OSI_LAYERS[selectedLayerIndex];

  return (
    <div className="flex flex-col gap-6">
      {/* Intro Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-sky-400" />
            <span>OSI 7-Layer & TCP/IP Encapsulation Engine</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Observe how raw application data transforms into bits through layered header addition (Encapsulation) and stripped at the destination (Decapsulation).
          </p>
        </div>

        {/* Direction Controls */}
        <div className="flex items-center gap-2 p-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold">
          <button
            onClick={() => {
              setDirection('encapsulate');
              setActiveStep(0);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              direction === 'encapsulate'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowDown className="w-3.5 h-3.5" />
            <span>Encapsulation (Sender)</span>
          </button>
          <button
            onClick={() => {
              setDirection('decapsulate');
              setActiveStep(6);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              direction === 'decapsulate'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span>Decapsulation (Receiver)</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout: Left OSI Matrix, Right Layer Deep-Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive 7 Layers */}
        <div className="lg:col-span-5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-slate-400 px-2 mb-1">
            <span>OSI Layer</span>
            <span>PDU (Data Unit)</span>
            <span>TCP/IP Model</span>
          </div>

          {OSI_LAYERS.map((layer, index) => {
            const isSelected = selectedLayerIndex === index;
            return (
              <button
                key={layer.layerNum}
                onClick={() => setSelectedLayerIndex(index)}
                className={`flex items-center justify-between p-3.5 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'bg-sky-950/40 border-sky-500 text-white shadow-md shadow-sky-500/10 ring-1 ring-sky-500/50'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded flex items-center justify-center text-xs font-mono font-bold ${
                      isSelected
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    L{layer.layerNum}
                  </span>
                  <div>
                    <div className="font-semibold text-sm">{layer.name}</div>
                    <div className="text-xs text-slate-400 font-mono">{layer.pdu}</div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-medium text-slate-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                    {layer.tcpIpEquivalent}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Layer Inspector & Encapsulation Packet Inspector */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Header Inspection Panel */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono text-sky-400 uppercase tracking-wider font-semibold">
                  Layer {selectedLayer.layerNum} Deep Dive
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {selectedLayer.name} ({selectedLayer.pdu})
                </h3>
              </div>
              <span className="text-xs font-medium text-slate-400 px-2.5 py-1 rounded bg-slate-800 border border-slate-700">
                TCP/IP: {selectedLayer.tcpIpEquivalent} Layer
              </span>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              {selectedLayer.coreResponsibilities}
            </p>

            {/* Key Hardware & Protocols */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
                <div className="text-xs font-semibold text-slate-400 mb-1.5">Typical Protocols</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedLayer.keyProtocols.map((proto) => (
                    <span
                      key={proto}
                      className="px-2 py-0.5 text-xs font-mono bg-slate-800 text-sky-300 rounded border border-slate-700/60"
                    >
                      {proto}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
                <div className="text-xs font-semibold text-slate-400 mb-1.5">Operating Devices</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedLayer.hardwareDevices.map((dev) => (
                    <span
                      key={dev}
                      className="px-2 py-0.5 text-xs font-mono bg-slate-800 text-emerald-300 rounded border border-slate-700/60"
                    >
                      {dev}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Header Structure Table */}
            <div>
              <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-sky-400" />
                <span>Protocol Header Fields at Layer {selectedLayer.layerNum}</span>
              </div>
              <div className="overflow-x-auto border border-slate-800 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3 font-semibold">Header Field</th>
                      <th className="py-2 px-3 font-semibold">Size</th>
                      <th className="py-2 px-3 font-semibold">Function & Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono">
                    {selectedLayer.headerFields.map((field, i) => (
                      <tr key={i} className="hover:bg-slate-850/50">
                        <td className="py-2 px-3 font-semibold text-sky-300">{field.name}</td>
                        <td className="py-2 px-3 text-slate-400">{field.size}</td>
                        <td className="py-2 px-3 text-slate-300 font-sans">{field.purpose}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Wire Example Snippet */}
            <div>
              <div className="text-xs font-semibold text-slate-400 mb-1.5">
                Simulated Packet Header Representation on Wire:
              </div>
              <pre className="p-3 bg-slate-950 rounded-lg text-xs font-mono text-emerald-400 border border-slate-800 overflow-x-auto whitespace-pre-wrap">
                {selectedLayer.sampleSnippet}
              </pre>
            </div>
          </div>

          {/* Visual Encapsulation Nesting Box */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-sky-400" />
              <span>Full Encapsulated Frame Hierarchy</span>
            </h4>
            <p className="text-xs text-slate-400">
              Notice how each descending layer wraps the entire upper layer payload with its own protocol header.
            </p>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs space-y-2">
              <div className="border border-sky-500/60 bg-sky-950/20 p-2.5 rounded">
                <div className="text-sky-400 font-bold mb-1">Layer 2: Ethernet II Frame Header (14 Bytes)</div>
                <div className="text-slate-400 text-[11px] mb-2">Dest MAC: 00:1A:2B:3C:4D:5E | Src MAC: 00:AA:BB:CC:DD:EE | EtherType: 0x0800 (IPv4)</div>

                <div className="border border-indigo-500/60 bg-indigo-950/20 p-2.5 rounded">
                  <div className="text-indigo-400 font-bold mb-1">Layer 3: IPv4 Packet Header (20 Bytes)</div>
                  <div className="text-slate-400 text-[11px] mb-2">Src IP: 192.168.1.50 | Dst IP: 93.184.216.34 | TTL: 64 | Proto: 6 (TCP)</div>

                  <div className="border border-emerald-500/60 bg-emerald-950/20 p-2.5 rounded">
                    <div className="text-emerald-400 font-bold mb-1">Layer 4: TCP Segment Header (20 Bytes)</div>
                    <div className="text-slate-400 text-[11px] mb-2">Src Port: 52410 | Dst Port: 443 | Seq: 1001 | Ack: 5001 | Flags: [ACK]</div>

                    <div className="border border-amber-500/60 bg-amber-950/20 p-2 rounded text-amber-300">
                      <span className="font-bold">Layer 7: Application Payload:</span> GET /index.html HTTP/1.1 (64 Bytes)
                    </div>
                  </div>
                </div>

                <div className="mt-2 text-right text-[11px] text-sky-400 font-semibold">
                  Layer 2 FCS: CRC-32 Checksum (4 Bytes)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
