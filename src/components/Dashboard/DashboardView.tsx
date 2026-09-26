import React from 'react';
import { 
  Play, GitFork, BookOpen, FlaskConical, Calculator, 
  ArrowRight, CheckCircle2, Cpu, Network, Radio, Globe, Layers,
  Terminal, Shield, Compass, Sparkles, Activity
} from 'lucide-react';
import { ActiveTab } from '../Navbar';

interface DashboardViewProps {
  onNavigate: (tab: ActiveTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col gap-6 font-sans max-w-6xl mx-auto">
      
      {/* 1. Concise Hero Section with Futuristic Cyber Network Badge */}
      <div className="relative p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-300 text-xs font-mono font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>NetLearn · Regulations 2021 Volume 11 CSE Higher Semester</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Computer Networks & Packet Simulator
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            Full 5-unit curriculum, 15 official lab experiments, interactive routing algorithm visualizer (RIP, OSPF, BGP), and Cisco Packet Tracer workspace.
          </p>

          {/* Quick Launch Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('simulator')}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-sky-600/30 transition-all hover:scale-[1.02]"
            >
              <Terminal className="w-4 h-4" />
              <span>Launch Simulator</span>
            </button>

            <button
              onClick={() => onNavigate('visualizers')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02]"
            >
              <GitFork className="w-4 h-4" />
              <span>Routing Algorithm Visualizer</span>
            </button>

            <button
              onClick={() => onNavigate('syllabus')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-700 transition-all"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>5-Unit Syllabus & Labs</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Core 4 Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Cisco Packet Tracer */}
        <div 
          onClick={() => onNavigate('simulator')}
          className="group p-5 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-sky-500/50 rounded-xl cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-3"
        >
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
              <Terminal className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-white text-sm group-hover:text-sky-400 transition-colors">
              Packet Tracer Workspace
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Design networks with 1941/2911 routers, Catalyst switches, HWIC-2T serial DCE links, and real Cisco IOS CLI commands.
            </p>
          </div>
          <div className="flex items-center justify-between text-xs text-sky-400 font-semibold pt-2 border-t border-slate-800/80">
            <span>Open Workspace</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 2: Routing Visualizer */}
        <div 
          onClick={() => onNavigate('visualizers')}
          className="group p-5 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 rounded-xl cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-3"
        >
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <GitFork className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors">
              Routing Algorithm Visualizer
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time graph simulations for Distance Vector (RIP), Link State (OSPF), Path Vector (BGP), and Flooding with custom nodes and weights.
            </p>
          </div>
          <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold pt-2 border-t border-slate-800/80">
            <span>Simulate Graph</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 3: 5 Units Syllabus */}
        <div 
          onClick={() => onNavigate('syllabus')}
          className="group p-5 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/50 rounded-xl cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-3"
        >
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-white text-sm group-hover:text-amber-400 transition-colors">
              5-Unit Master Syllabus
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              1. Networks Intro 2. Addressing (VLSM/NAT) 3. Routing (OSPF/BGP) 4. Medium Access Control 5. Transport & Applications.
            </p>
          </div>
          <div className="flex items-center justify-between text-xs text-amber-400 font-semibold pt-2 border-t border-slate-800/80">
            <span>View Syllabus</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 4: 15 Labs */}
        <div 
          onClick={() => onNavigate('labs')}
          className="group p-5 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-purple-500/50 rounded-xl cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-3"
        >
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-400/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <FlaskConical className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-white text-sm group-hover:text-purple-400 transition-colors">
              15 Guided Lab Experiments
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Complete step-by-step procedures for all 15 syllabus labs: Topologies, VLSM, NAT, RIP v1/v2, OSPF, BGP, EIGRP, PPP, HDLC, and Telnet.
            </p>
          </div>
          <div className="flex items-center justify-between text-xs text-purple-400 font-semibold pt-2 border-t border-slate-800/80">
            <span>Explore 15 Labs</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

      </div>

      {/* 3. 5-Unit Curriculum at a Glance */}
      <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Official 5-Unit Syllabus & Laboratory Curriculum
            </h3>
          </div>
          <button
            onClick={() => onNavigate('syllabus')}
            className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
          >
            <span>Open Full Syllabus</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
          {[
            {
              unit: 'Unit 1',
              title: 'Introduction to Networks',
              topics: 'LAN/MAN/PAN/WAN, Topologies, Switching, OSI & TCP/IP, Delay, Guided & Unguided Media',
              labs: 'Labs 1, 2, 3',
              color: 'text-sky-400 border-sky-500/30 bg-sky-500/5'
            },
            {
              unit: 'Unit 2',
              title: 'Addressing',
              topics: 'IPv4, Address Space, Classful, Subnet Mask, FLSM, VLSM, NAT, Supernetting, Devices',
              labs: 'Labs 4, 5, 6',
              color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5'
            },
            {
              unit: 'Unit 3',
              title: 'Routing',
              topics: 'Forwarding, Static & Default, DV, LS, PV, RIP v1/v2, OSPF, BGP, EIGRP, Multicast, IPv6',
              labs: 'Labs 7, 8, 9',
              color: 'text-amber-400 border-amber-500/30 bg-amber-500/5'
            },
            {
              unit: 'Unit 4',
              title: 'Medium Access Control',
              topics: 'ALOHA, CSMA/CD, CSMA/CA, Ethernet, Token Ring, Flow Control, ARQ, CRC, Hamming, HDLC, PPP',
              labs: 'Labs 10, 11, 12',
              color: 'text-purple-400 border-purple-500/30 bg-purple-500/5'
            },
            {
              unit: 'Unit 5',
              title: 'Transport & Application Protocols',
              topics: 'Port Numbers, UDP, TCP, WWW/HTTP, FTP, Email, Telnet, DNS',
              labs: 'Labs 13, 14, 15',
              color: 'text-rose-400 border-rose-500/30 bg-rose-500/5'
            }
          ].map((item, idx) => (
            <div
              key={idx}
              onClick={() => onNavigate('syllabus')}
              className={`p-3 rounded-lg border ${item.color} cursor-pointer hover:border-slate-600 transition-all flex flex-col justify-between gap-1.5`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold uppercase opacity-80">{item.unit}</span>
                  <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-slate-800 text-slate-300">{item.labs}</span>
                </div>
                <h4 className="font-bold text-white text-xs mt-1 leading-snug">{item.title}</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug line-clamp-2">{item.topics}</p>
              </div>
              <span className="text-[10px] font-semibold text-slate-300 mt-1 flex items-center gap-1">
                Read notes <ArrowRight className="w-2.5 h-2.5" />
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
