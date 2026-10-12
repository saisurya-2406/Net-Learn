import React, { useState } from 'react';
import { BookOpen, FlaskConical, Home, Layers3, Menu, Network, PlayCircle, Search, Sparkles, X } from 'lucide-react';

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

const navigation: Array<{ id: ActiveTab; label: string; Icon: typeof Home }> = [
  { id: 'dashboard', label: 'Home', Icon: Home },
  { id: 'simulator', label: 'Simulator', Icon: Network },
  { id: 'labs', label: 'Labs', Icon: FlaskConical },
  { id: 'syllabus', label: 'Syllabus', Icon: BookOpen },
  { id: 'visualizers', label: 'Visualizers', Icon: Layers3 },
  { id: 'numericals', label: 'Calculators', Icon: Search },
  { id: 'practice', label: 'Practice', Icon: Sparkles },
  { id: 'resources', label: 'Resources', Icon: BookOpen },
];

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenQuickLab }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/90 bg-slate-950/95 shadow-[0_8px_28px_rgba(2,6,23,.2)] backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-6">
        <button onClick={() => navigate('dashboard')} className="group flex min-w-0 items-center gap-2.5 text-left" aria-label="NetLearn home">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sky-400/25 bg-sky-400/10 text-sky-300 transition-colors group-hover:bg-sky-400/15">
            <Network className="h-[18px] w-[18px]" />
          </span>
          <span className="min-w-0">
            <span className="block text-[15px] font-bold leading-tight tracking-tight text-white">NetLearn</span>
            <span className="mt-0.5 hidden text-[10px] leading-tight tracking-wide text-slate-500 sm:block">Computer networks learning lab</span>
          </span>
        </button>

        <nav aria-label="Main navigation" className="hidden items-center gap-0.5 xl:flex">
          {navigation.map(({ id, label }) => (
            <button key={id} onClick={() => navigate(id)} aria-current={activeTab === id ? 'page' : undefined}
              className={`rounded-lg px-2.5 py-2 text-[11px] font-medium transition-colors 2xl:px-3 2xl:text-xs ${activeTab === id ? 'bg-sky-400/10 text-sky-200' : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <button onClick={onOpenQuickLab} className="hidden rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-900 hover:text-white sm:inline-flex">
            Quick lab
          </button>
          <button onClick={() => navigate('simulator')} className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-sky-950/50 transition-colors hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-offset-2 focus:ring-offset-slate-950">
            <PlayCircle className="h-4 w-4" /><span className="hidden sm:inline">Open simulator</span><span className="sm:hidden">Build</span>
          </button>
          <button onClick={() => setMobileOpen(open => !open)} aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileOpen}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 xl:hidden">
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav aria-label="Mobile navigation" className="border-t border-slate-800 bg-slate-950 px-4 py-3 xl:hidden sm:px-6">
          <div className="mx-auto grid max-w-[1600px] grid-cols-2 gap-1.5 sm:grid-cols-4">
            {navigation.map(({ id, label, Icon }) => (
              <button key={id} onClick={() => navigate(id)} aria-current={activeTab === id ? 'page' : undefined}
                className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-medium transition-colors ${activeTab === id ? 'bg-sky-400/10 text-sky-200' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                <Icon className="h-4 w-4 shrink-0" />{label}
              </button>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
};
