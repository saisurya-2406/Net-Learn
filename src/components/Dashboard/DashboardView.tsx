import React from 'react';
import {
  Activity,
  ArrowRight,
  BookOpen,
  ExternalLink,
  FlaskConical,
  GitFork,
  Layers3,
  LibraryBig,
  Play,
  Sparkles,
} from 'lucide-react';
import { ActiveTab } from '../Navbar';

interface DashboardViewProps {
  onNavigate: (tab: ActiveTab) => void;
  onStartBlankNetwork: () => void;
  onOpenSavedTopologies: () => void;
}

const learningAreas = [
  {
    title: 'Guided labs',
    description: 'Work through network experiments with procedures, command references, and topology files.',
    detail: '15 experiments',
    tab: 'labs' as const,
    Icon: FlaskConical,
    color: 'text-violet-300',
    tint: 'bg-violet-400/10 border-violet-300/20',
  },
  {
    title: 'Protocol visualizers',
    description: 'Explore routing algorithms and protocol behavior through interactive diagrams.',
    detail: 'Routing · TCP · DNS',
    tab: 'visualizers' as const,
    Icon: GitFork,
    color: 'text-emerald-300',
    tint: 'bg-emerald-400/10 border-emerald-300/20',
  },
  {
    title: 'Practice & Viva',
    description: 'Review oral exam prompts or take a multiple choice quiz with answer explanations.',
    detail: '1,000 viva prompts',
    tab: 'practice' as const,
    Icon: Sparkles,
    color: 'text-indigo-300',
    tint: 'bg-indigo-400/10 border-indigo-300/20',
  },
  {
    title: 'Resource hub',
    description: 'Find references, external simulators, videos, tools, and NetLearn study material.',
    detail: 'Curated references',
    tab: 'resources' as const,
    Icon: LibraryBig,
    color: 'text-amber-300',
    tint: 'bg-amber-400/10 border-amber-300/20',
  },
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onStartBlankNetwork,
  onOpenSavedTopologies,
}) => (
  <div className="mx-auto flex max-w-6xl flex-col gap-5 font-sans">
    <section className="relative isolate grid overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-5 motion-safe:animate-[dashboard-enter_500ms_ease-out_both] sm:p-7 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:px-9 lg:py-6">
      <div className="pointer-events-none absolute -right-20 -top-28 h-64 w-64 rounded-full bg-sky-500/[0.035] blur-3xl" />
      <div className="relative z-10 max-w-xl space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/60 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-slate-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Computer networks learning platform
        </div>
        <div className="space-y-3">
          <h1 className="max-w-lg text-3xl font-semibold leading-[1.15] tracking-[-0.035em] text-white sm:text-4xl">Computer networks,<br /><span className="text-sky-300">made practical.</span></h1>
          <p className="max-w-lg text-sm leading-relaxed text-slate-400">Explore networking through hands-on topologies, interactive protocol demos, and guided study.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button type="button" onClick={onStartBlankNetwork} className="group inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-offset-2 focus:ring-offset-slate-950">
            <Play className="h-4 w-4 fill-current" /> Start building <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
          <button type="button" onClick={() => onNavigate('syllabus')} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400">
            <BookOpen className="h-4 w-4 text-sky-200" /> Explore syllabus
          </button>
        </div>
        <button type="button" onClick={onOpenSavedTopologies} className="text-xs font-medium text-slate-500 transition-colors hover:text-sky-300 focus:outline-none focus:underline">Open a saved topology <span aria-hidden="true">↗</span></button>
      </div>

      <div className="relative mx-auto mt-3 aspect-[1.65] w-full max-w-[400px] opacity-90 lg:mt-0" aria-label="Animated network topology illustration" role="img">
        <div className="absolute inset-[18%] rounded-full bg-sky-500/[0.04] blur-2xl" />
        <svg viewBox="0 0 520 340" className="relative h-full w-full overflow-visible" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="dash-line" x1="60" y1="60" x2="450" y2="300" gradientUnits="userSpaceOnUse"><stop stopColor="#22d3ee" stopOpacity=".72" /><stop offset="1" stopColor="#818cf8" stopOpacity=".42" /></linearGradient>
            <radialGradient id="router-glow"><stop stopColor="#38bdf8" stopOpacity=".36" /><stop offset="1" stopColor="#38bdf8" stopOpacity="0" /></radialGradient>
          </defs>
          <path d="M100 105 248 168 406 82M100 105 112 270 248 168M248 168 406 262M406 82 406 262M112 270 406 262" stroke="url(#dash-line)" strokeWidth="1.5" strokeDasharray="5 8" className="network-flow-line" />
          <path d="M100 105 248 168 406 82M100 105 112 270 248 168M248 168 406 262M406 82 406 262M112 270 406 262" stroke="#38bdf8" strokeWidth="1" strokeOpacity=".13" />
          <circle cx="248" cy="168" r="54" fill="url(#router-glow)" />
          <g className="network-router-pulse"><circle cx="248" cy="168" r="26" fill="#0c1c34" stroke="#38bdf8" strokeOpacity=".7" /><path d="M239 168h18m-5-5 5 5-5 5m-8-10-5 5 5 5" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></g>
          <g className="network-node-pulse"><circle cx="100" cy="105" r="18" fill="#111c31" stroke="#67e8f9" strokeOpacity=".6" /><rect x="92" y="98" width="16" height="13" rx="2" stroke="#a5f3fc" strokeWidth="1.5" /><path d="M96 115h8m-4-4v4" stroke="#a5f3fc" strokeWidth="1.5" strokeLinecap="round" /></g>
          <g className="network-node-pulse network-delay-1"><circle cx="406" cy="82" r="18" fill="#111c31" stroke="#a5b4fc" strokeOpacity=".65" /><rect x="398" y="75" width="16" height="13" rx="2" stroke="#c7d2fe" strokeWidth="1.5" /><path d="M402 92h8m-4-4v4" stroke="#c7d2fe" strokeWidth="1.5" strokeLinecap="round" /></g>
          <g className="network-node-pulse network-delay-2"><circle cx="112" cy="270" r="18" fill="#111c31" stroke="#6ee7b7" strokeOpacity=".65" /><circle cx="112" cy="267" r="5" stroke="#a7f3d0" strokeWidth="1.5" /><path d="M102 278c1.5-6 18.5-6 20 0" stroke="#a7f3d0" strokeWidth="1.5" strokeLinecap="round" /></g>
          <g className="network-node-pulse network-delay-3"><circle cx="406" cy="262" r="18" fill="#111c31" stroke="#f0abfc" strokeOpacity=".55" /><path d="M399 257h14v10h-14z" stroke="#f5d0fe" strokeWidth="1.5" /><path d="m400 258 6 5 6-5" stroke="#f5d0fe" strokeWidth="1.5" /></g>
          <circle className="network-packet-dot" r="4" fill="#e0f2fe" />
          <circle className="network-packet-dot network-packet-return" r="3.5" fill="#a7f3d0" />
        </svg>
        <div className="absolute bottom-[1%] left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-950/75 px-2.5 py-1 text-[9px] font-medium tracking-wide text-slate-400 backdrop-blur-sm">
          <Activity className="h-3 w-3 text-sky-300" /> Interactive network map
        </div>
      </div>
    </section>

    <section className="grid grid-cols-2 divide-x divide-slate-800 rounded-xl border border-slate-800 bg-slate-900/50 sm:grid-cols-4" aria-label="Learning platform overview">
      {[
        { value: '5', label: 'Curriculum units', icon: Layers3, color: 'text-sky-300' },
        { value: '15', label: 'Guided labs', icon: FlaskConical, color: 'text-violet-300' },
        { value: '1,000', label: 'Viva prompts', icon: Sparkles, color: 'text-indigo-300' },
        { value: '4', label: 'Routing methods', icon: GitFork, color: 'text-emerald-300' },
      ].map(({ value, label, icon: Icon, color }, index) => (
        <div key={label} className="group p-3.5 transition-colors hover:bg-slate-900 motion-safe:animate-[dashboard-enter_450ms_ease-out_both] sm:px-5" style={{ animationDelay: `${60 + index * 55}ms` }}>
          <div className="flex items-center gap-2.5"><Icon className={`h-4 w-4 shrink-0 ${color} opacity-80`} /><span className="font-mono text-xl font-semibold tracking-tight text-white sm:text-2xl">{value}</span></div>
          <p className="mt-1.5 pl-[26px] text-[11px] font-medium text-slate-500">{label}</p>
        </div>
      ))}
    </section>

    <section aria-labelledby="learning-areas-title" className="space-y-3">
      <div className="flex items-end justify-between gap-4 px-1">
        <div><h2 id="learning-areas-title" className="text-lg font-semibold tracking-tight text-white">Explore learning tools</h2></div>
        <button type="button" onClick={() => onNavigate('resources')} className="hidden items-center gap-1 text-xs font-semibold text-sky-300 transition-colors hover:text-sky-100 sm:inline-flex">All resources <ExternalLink className="h-3 w-3" /></button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {learningAreas.map(({ title, description, detail, tab, Icon, color, tint }, index) => (
          <button key={tab} type="button" onClick={() => onNavigate(tab)} className="group relative flex min-h-[176px] flex-col justify-between overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-left transition-all duration-200 hover:border-slate-600 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400 motion-safe:animate-[dashboard-enter_500ms_ease-out_both]" style={{ animationDelay: `${200 + index * 65}ms` }}>
            <div className="relative">
              <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border ${tint} ${color} transition-colors duration-200 group-hover:bg-opacity-20`}><Icon className="h-4 w-4" /></div>
              <h3 className="mt-4 text-base font-semibold tracking-tight text-white">{title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">{description}</p>
            </div>
            <div className="relative mt-4 flex items-center justify-between border-t border-slate-800 pt-3 text-[10px] font-semibold text-slate-400"><span>{detail}</span><ArrowRight className="h-3.5 w-3.5 text-slate-500 transition-all duration-200 group-hover:translate-x-1 group-hover:text-white" /></div>
          </button>
        ))}
      </div>
      <button type="button" onClick={() => onNavigate('resources')} className="inline-flex items-center gap-1 text-xs font-semibold text-sky-300 sm:hidden">Browse all resources <ArrowRight className="h-3.5 w-3.5" /></button>
    </section>
  </div>
);
