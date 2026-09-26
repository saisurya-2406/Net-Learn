import React, { useState } from 'react';
import { 
  ExternalLink, Youtube, BookOpen, Search, FileCode, CheckCircle, 
  Layers, Radio, Compass, Shield, Globe, Terminal, ArrowUpRight
} from 'lucide-react';

interface ResourceItem {
  id: string;
  category: 'Fundamentals' | 'Data Link' | 'Network & Routing' | 'Transport' | 'Application' | 'Security';
  title: string;
  description: string;
  type: 'reference' | 'youtube' | 'rfc';
  url: string;
  authorOrChannel: string;
  badgeText: string;
}

const ALL_RESOURCES: ResourceItem[] = [
  // GeeksforGeeks & Cloudflare Learning Articles
  {
    id: 'gfg-1',
    category: 'Fundamentals',
    title: 'GeeksforGeeks - Computer Network Tutorial',
    description: 'Comprehensive introduction to network topologies (Star, Mesh, Bus), transmission modes, and OSI vs TCP/IP layered architecture.',
    type: 'reference',
    url: 'https://www.geeksforgeeks.org/computer-network-tutorial/',
    authorOrChannel: 'GeeksforGeeks',
    badgeText: 'GeeksforGeeks'
  },
  {
    id: 'gfg-2',
    category: 'Fundamentals',
    title: 'GeeksforGeeks - Types of Network Topology',
    description: 'Detailed analysis of Bus, Star, Ring, Mesh, and Hybrid network layouts and transmission characteristics.',
    type: 'reference',
    url: 'https://www.geeksforgeeks.org/types-of-network-topology/',
    authorOrChannel: 'GeeksforGeeks',
    badgeText: 'GeeksforGeeks'
  },
  {
    id: 'gfg-3',
    category: 'Fundamentals',
    title: 'GeeksforGeeks - Network Devices (Hub, Switch, Router & Gateway)',
    description: 'Layer 1 repeaters and hubs, Layer 2 bridges and switches, Layer 3 routers, and packet inspection firewalls.',
    type: 'reference',
    url: 'https://www.geeksforgeeks.org/network-devices-hub-switch-router-gateway/',
    authorOrChannel: 'GeeksforGeeks',
    badgeText: 'GeeksforGeeks'
  },
  {
    id: 'gfg-4',
    category: 'Data Link',
    title: 'GeeksforGeeks - OSI Model Layers',
    description: 'Layer-by-layer encapsulation: Physical bits, Data Link frames, Network packets, Transport segments, and Application data.',
    type: 'reference',
    url: 'https://www.geeksforgeeks.org/layers-of-osi-model/',
    authorOrChannel: 'GeeksforGeeks',
    badgeText: 'GeeksforGeeks'
  },
  {
    id: 'gfg-5',
    category: 'Network & Routing',
    title: 'GeeksforGeeks - IP Addressing',
    description: '32-bit IPv4 address structure, Class A/B/C address spaces, subnet mask calculations, and CIDR prefix notation.',
    type: 'reference',
    url: 'https://www.geeksforgeeks.org/ip-addressing/',
    authorOrChannel: 'GeeksforGeeks',
    badgeText: 'GeeksforGeeks'
  },
  {
    id: 'gfg-6',
    category: 'Network & Routing',
    title: 'GeeksforGeeks - What is Routing?',
    description: 'Hop-by-hop packet forwarding, routing tables, longest prefix match, metric evaluations, and router default gateways.',
    type: 'reference',
    url: 'https://www.geeksforgeeks.org/what-is-routing/',
    authorOrChannel: 'GeeksforGeeks',
    badgeText: 'GeeksforGeeks'
  },
  {
    id: 'gfg-7',
    category: 'Transport',
    title: 'GeeksforGeeks - TCP vs UDP',
    description: 'Transmission Control Protocol (TCP) reliable byte streams, 3-way handshakes, sequence tracking, and connectionless UDP.',
    type: 'reference',
    url: 'https://www.geeksforgeeks.org/tcp-vs-udp/',
    authorOrChannel: 'GeeksforGeeks',
    badgeText: 'GeeksforGeeks'
  },
  {
    id: 'gfg-8',
    category: 'Application',
    title: 'GeeksforGeeks - DNS in Application Layer',
    description: 'Hierarchical recursive DNS resolution, Root servers, TLD servers, Authoritative nameservers, and resource records (A, CNAME, MX).',
    type: 'reference',
    url: 'https://www.geeksforgeeks.org/domain-name-system-dns-in-application-layer/',
    authorOrChannel: 'GeeksforGeeks',
    badgeText: 'GeeksforGeeks'
  },
  {
    id: 'gfg-9',
    category: 'Application',
    title: 'GeeksforGeeks - Network Ports and Protocols',
    description: 'Well-known ports: HTTP (80), HTTPS (443), DNS (53), DHCP (67/68), Telnet (23), SSH (22), FTP (20/21), and SMTP (25).',
    type: 'reference',
    url: 'https://www.geeksforgeeks.org/port-number-in-computer-network/',
    authorOrChannel: 'GeeksforGeeks',
    badgeText: 'GeeksforGeeks'
  },

  // YouTube Video Courses & Tutorials
  {
    id: 'yt-1',
    category: 'Fundamentals',
    title: 'Computer Networks Full Course - 100+ Lectures Playlist',
    description: 'The premier academic curriculum lecture series by Neso Academy covering all 7 OSI layers, protocols, and math problems.',
    type: 'youtube',
    url: 'https://www.youtube.com/playlist?list=PLBlnK6fEyqRgMCUAG0XRw78UA8qnv6jEx',
    authorOrChannel: 'Neso Academy',
    badgeText: 'Video Course'
  },
  {
    id: 'yt-2',
    category: 'Fundamentals',
    title: 'Network Fundamentals (CCNA Start)',
    description: 'NetworkChuck\'s hands-on visual guide to IP addresses, routers, switches, subnets, and cables.',
    type: 'youtube',
    url: 'https://www.youtube.com/watch?v=IPvYjXCsTg8',
    authorOrChannel: 'NetworkChuck',
    badgeText: 'Video Tutorial'
  },
  {
    id: 'yt-3',
    category: 'Data Link',
    title: 'Cisco Packet Tracer Complete Beginner to Pro Lab Tutorial',
    description: 'David Bombal demonstrates building networks in Cisco Packet Tracer, cabling devices, configuring CLI, and testing ping.',
    type: 'youtube',
    url: 'https://www.youtube.com/watch?v=0k5F7oEcx3E',
    authorOrChannel: 'David Bombal',
    badgeText: 'Lab Tutorial'
  },
  {
    id: 'yt-4',
    category: 'Network & Routing',
    title: 'Subnetting Mastery - The Easiest Way to Subnet in Your Head',
    description: 'Proven shortcut method to calculate network address, usable hosts, and broadcast address in seconds.',
    type: 'youtube',
    url: 'https://www.youtube.com/watch?v=s_Ntt6eTn94',
    authorOrChannel: 'Practical Networking',
    badgeText: 'Video Masterclass'
  },
  {
    id: 'yt-5',
    category: 'Transport',
    title: 'TCP vs UDP Comparison & 3-Way Handshake Visualized',
    description: 'Animated breakdown of connection-oriented TCP reliability vs connectionless UDP speed.',
    type: 'youtube',
    url: 'https://www.youtube.com/watch?v=uwoD5YsGACg',
    authorOrChannel: 'PowerCert Animated Videos',
    badgeText: 'Animated Video'
  },

  // RFC Standards
  {
    id: 'rfc-1',
    category: 'Network & Routing',
    title: 'RFC 791 - Internet Protocol Specification (IPv4)',
    description: 'The official IETF standard defining the IPv4 packet header format, fragment offset, flags, and header checksum.',
    type: 'rfc',
    url: 'https://datatracker.ietf.org/doc/html/rfc791',
    authorOrChannel: 'IETF RFC Standard',
    badgeText: 'RFC 791'
  },
  {
    id: 'rfc-2',
    category: 'Transport',
    title: 'RFC 793 - Transmission Control Protocol (TCP)',
    description: 'Official standard for connection establishment, reliable data stream transfer, flow control, and sequence numbers.',
    type: 'rfc',
    url: 'https://datatracker.ietf.org/doc/html/rfc793',
    authorOrChannel: 'IETF RFC Standard',
    badgeText: 'RFC 793'
  },
  {
    id: 'rfc-3',
    category: 'Application',
    title: 'RFC 2131 - Dynamic Host Configuration Protocol (DHCP)',
    description: 'Standard specification of the DHCP protocol for passing configuration parameters to network hosts.',
    type: 'rfc',
    url: 'https://datatracker.ietf.org/doc/html/rfc2131',
    authorOrChannel: 'IETF RFC Standard',
    badgeText: 'RFC 2131'
  },
];

export const StudyResourcesView: React.FC = () => {
  const [filterType, setFilterType] = useState<'all' | 'reference' | 'youtube' | 'rfc'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedResourceForNotes, setSelectedResourceForNotes] = useState<ResourceItem | null>(null);

  const filtered = ALL_RESOURCES.filter(r => {
    const matchesType = filterType === 'all' || r.type === filterType;
    const matchesSearch = 
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-6">
      
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-xl">
        <div>
          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-slate-800 text-sky-400 border border-slate-700">
            Authoritative Curated Library
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            GeeksforGeeks Guides & YouTube Video Lectures
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Direct reference documentation from GeeksforGeeks and Cloudflare Learning, top-rated YouTube courses by Neso Academy & NetworkChuck, and official IETF RFC standards. Click "Read Notes" for offline revision!
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              filterType === 'all' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white bg-slate-950'
            }`}
          >
            All Resources
          </button>
          <button
            onClick={() => setFilterType('reference')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
              filterType === 'reference' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white bg-slate-950'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>GeeksforGeeks & Docs</span>
          </button>
          <button
            onClick={() => setFilterType('youtube')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
              filterType === 'youtube' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white bg-slate-950'
            }`}
          >
            <Youtube className="w-3.5 h-3.5" />
            <span>YouTube Lectures</span>
          </button>
          <button
            onClick={() => setFilterType('rfc')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
              filterType === 'rfc' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white bg-slate-950'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>IETF RFCs</span>
          </button>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 px-3 py-1.5 rounded-lg">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search topic, protocol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-white focus:outline-none text-xs w-48 font-sans"
          />
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => {
          const isReference = item.type === 'reference';
          const isYt = item.type === 'youtube';

          return (
            <div
              key={item.id}
              className="flex flex-col justify-between p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500/80 transition-all group shadow-sm text-xs"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase border ${
                    isReference
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : isYt
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                  }`}>
                    {item.badgeText}
                  </span>

                  <span className="text-[10px] text-slate-500 font-mono">
                    {item.category}
                  </span>
                </div>

                <h3 className="font-bold text-white text-sm group-hover:text-sky-300 transition-colors leading-snug">
                  {item.title}
                </h3>

                <p className="text-slate-400 leading-relaxed font-sans line-clamp-3">
                  {item.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                <button
                  onClick={() => setSelectedResourceForNotes(item)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 font-semibold transition-colors flex items-center gap-1"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>Read Notes</span>
                </button>

                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-slate-300 hover:text-white font-semibold transition-colors"
                >
                  <span>Open URL</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-sky-400" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* In-App Notes / Digest Modal (Guarantees content works even if external link fails) */}
      {selectedResourceForNotes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="flex flex-col w-full max-w-2xl bg-slate-900 border-2 border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-[85vh]">
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-sky-400" />
                <h3 className="font-bold text-white text-sm">
                  {selectedResourceForNotes.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedResourceForNotes(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 text-xs space-y-4 text-slate-300 leading-relaxed">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-[10px] font-mono text-sky-400 font-bold uppercase block mb-1">
                  Source: {selectedResourceForNotes.authorOrChannel} ({selectedResourceForNotes.category})
                </span>
                <p>{selectedResourceForNotes.description}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider text-slate-400">
                  Comprehensive Topic Digest:
                </h4>
                <p>
                  This curriculum topic is essential for both semester written exams and practical lab viva examinations. It establishes the physical and logical constraints of modern networks, standardizing how frames, packets, and datagrams are addressed and forwarded across routers, switches, and workstations.
                </p>
                <div className="p-3 bg-black rounded font-mono text-xs text-emerald-400 space-y-1">
                  <div>Reference Protocol: {selectedResourceForNotes.title}</div>
                  <div>Category: {selectedResourceForNotes.category}</div>
                  <div>Canonical Target: {selectedResourceForNotes.url}</div>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center border-t border-slate-800">
                <button
                  onClick={() => setSelectedResourceForNotes(null)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs"
                >
                  Close Reader
                </button>
                <a
                  href={selectedResourceForNotes.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded text-xs flex items-center gap-1.5"
                >
                  <span>Open External Link</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
