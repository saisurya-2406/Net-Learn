import React from 'react';
import { PlayCircle, BookOpen, ExternalLink, Activity, Layers } from 'lucide-react';

export type ActiveTab = 
  | 'dashboard'
  | 'simulator'
  | 'labs'
  | 'syllabus'
  | 'visualizers'
  | 'numericals'
  | 'practice'
  | 'resources';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenQuickLab: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenQuickLab,
}) => {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-3 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 select-none">
      
      {/* Zone 1: Branding - Ultra-Modern Cybernetic Router Emblem & Identity */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setActiveTab('dashboard')} 
          className="group flex items-center gap-3 text-left transition-all relative"
        >
          {/* Cybernetic Hexa-Core Router Dynamic Hologram Logo */}
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-500 p-[2px] shadow-[0_0_20px_rgba(6,182,212,0.4)] group-hover:shadow-[0_0_30px_rgba(6,182,212,0.7)] group-hover:scale-105 transition-all duration-300">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center relative overflow-hidden">
              {/* Radial glow background */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-500/25 via-indigo-500/10 to-transparent group-hover:opacity-100 transition-opacity" />
              
              {/* Futuristic Cisco-Inspired 4-Way Routing Vector Emblem */}
              <svg className="w-5 h-5 relative z-10 transition-transform duration-500 group-hover:rotate-45" viewBox="0 0 24 24" fill="none">
                {/* Hexagon Shield Frame */}
                <polygon 
                  points="12,2 20.5,6.9 20.5,17.1 12,22 3.5,17.1 3.5,6.9" 
                  stroke="url(#hexGradient)" 
                  strokeWidth="1.5" 
                  strokeDasharray="2 1.5"
                  className="opacity-70 group-hover:opacity-100 transition-opacity"
                />

                {/* 4-Way Routing Vector Arrows (Inward & Outward Route Paths) */}
                {/* North arrow */}
                <path d="M12 9V5M12 5L10 7M12 5L14 7" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                {/* South arrow */}
                <path d="M12 15V19M12 19L10 17M12 19L14 17" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                {/* West arrow (inward) */}
                <path d="M5 12H9M9 12L7 10M9 12L7 14" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                {/* East arrow (outward) */}
                <path d="M15 12H19M19 12L17 10M19 12L17 14" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

                {/* Core Router Nexus Node */}
                <circle cx="12" cy="12" r="2.2" fill="#06b6d4" className="animate-pulse" />
                <circle cx="12" cy="12" r="4" stroke="#38bdf8" strokeWidth="0.75" strokeOpacity="0.6" />

                {/* Gradient Defs */}
                <defs>
                  <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="50%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2 leading-none">
              <span className="font-extrabold text-base tracking-tight text-white font-mono flex items-center">
                NET<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">LEARN</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider bg-cyan-950/80 text-cyan-400 border border-cyan-500/30">
                PRO 4.0
              </span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </div>
            <span className="text-[9px] font-mono tracking-widest uppercase text-slate-400 font-semibold mt-1 flex items-center gap-1.5">
              <span>Packet Tracer</span>
              <span className="text-slate-600">•</span>
              <span className="text-sky-400">5-Unit Syllabus</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400">15 Labs</span>
            </span>
          </div>
        </button>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`transition-colors py-1 hover:text-white ${
            activeTab === 'dashboard' ? 'text-sky-400 border-b-2 border-sky-400' : 'text-slate-400'
          }`}
        >
          Home / Dashboard
        </button>
        <button
          onClick={() => setActiveTab('simulator')}
          className={`transition-colors py-1 hover:text-white ${
            activeTab === 'simulator' ? 'text-sky-400 border-b-2 border-sky-400' : 'text-slate-400'
          }`}
        >
          Packet Tracer Workspace
        </button>
        <button
          onClick={() => setActiveTab('labs')}
          className={`transition-colors py-1 hover:text-white ${
            activeTab === 'labs' ? 'text-sky-400 border-b-2 border-sky-400' : 'text-slate-400'
          }`}
        >
          15 Lab Experiments
        </button>
        <button
          onClick={() => setActiveTab('syllabus')}
          className={`transition-colors py-1 hover:text-white flex items-center gap-1.5 ${
            activeTab === 'syllabus' ? 'text-sky-400 border-b-2 border-sky-400' : 'text-slate-400'
          }`}
        >
          <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-bold">5 Units</span>
          <span>Syllabus Guide</span>
        </button>
        <button
          onClick={() => setActiveTab('visualizers')}
          className={`transition-colors py-1 hover:text-white ${
            activeTab === 'visualizers' ? 'text-sky-400 border-b-2 border-sky-400' : 'text-slate-400'
          }`}
        >
          Protocol Visualizers
        </button>
        <button
          onClick={() => setActiveTab('numericals')}
          className={`transition-colors py-1 hover:text-white ${
            activeTab === 'numericals' ? 'text-sky-400 border-b-2 border-sky-400' : 'text-slate-400'
          }`}
        >
          Subnetting Calculators
        </button>
        <button
          onClick={() => setActiveTab('practice')}
          className={`transition-colors py-1 hover:text-white ${
            activeTab === 'practice' ? 'text-sky-400 border-b-2 border-sky-400' : 'text-slate-400'
          }`}
        >
          Practice Examination
        </button>
        <button
          onClick={() => setActiveTab('resources')}
          className={`transition-colors py-1 hover:text-white ${
            activeTab === 'resources' ? 'text-sky-400 border-b-2 border-sky-400' : 'text-slate-400'
          }`}
        >
          Tutorials & Docs
        </button>
      </nav>

      {/* Zone 3: Quick Action Buttons */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => setActiveTab('simulator')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-sky-600 rounded-lg hover:bg-sky-500 shadow-sm shadow-sky-600/30 transition-all whitespace-nowrap"
        >
          <PlayCircle className="w-3.5 h-3.5" />
          <span>Simulator</span>
        </button>
      </div>

    </header>
  );
};
