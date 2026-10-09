import React, { useState } from 'react';
import { 
  Play, CheckCircle2, AlertCircle, ExternalLink, Youtube, BookOpen, 
  HelpCircle, ChevronRight, Terminal, RefreshCw, Cpu, Layers, ArrowRight,
  ShieldCheck, Check, Sparkles
} from 'lucide-react';
import { ACADEMIC_EXPERIMENTS, AcademicExperiment, VisualStep } from '../../data/labData';
import { NetworkDevice, NetworkLink } from '../../types/network';
import { buildLabVideoSearchUrl } from '../../utils/labResourceLinks';

interface LabsAndTroubleshootViewProps {
  onLoadTopology: (devices: NetworkDevice[], links: NetworkLink[]) => void;
  onNavigateToSimulator: () => void;
  currentDevices: NetworkDevice[];
  currentLinks: NetworkLink[];
  initialExperimentId?: string;
}

export const LabsAndTroubleshootView: React.FC<LabsAndTroubleshootViewProps> = ({
  onLoadTopology,
  onNavigateToSimulator,
  currentDevices,
  currentLinks,
  initialExperimentId,
}) => {
  const [selectedExpId, setSelectedExpId] = useState<string>(initialExperimentId ?? 'exp-1');
  const [activeVisualStepIdx, setActiveVisualStepIdx] = useState<number>(0);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'procedure' | 'visualizer'>('procedure');
  const [isNotesModalOpen, setIsNotesModalOpen] = useState<boolean>(false);

  const currentExp: AcademicExperiment = 
    ACADEMIC_EXPERIMENTS.find(e => e.id === selectedExpId) || ACADEMIC_EXPERIMENTS[0];

  const handleLoadAndOpen = () => {
    onLoadTopology(
      currentExp.initialTopology.devices,
      currentExp.initialTopology.links
    );
    onNavigateToSimulator();
  };

  const isRequirementMet = currentExp.verificationCheck.isPassed(
    currentDevices,
    currentLinks
  );

  return (
    <div className="flex flex-col gap-6">
      
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Academic Lab Curriculum
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-slate-400 text-xs">Guided Syllabus Experiments</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            Computer Networks Laboratory Experiments
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Complete practical experiments with step-by-step visual demonstrations, NetLearn simulator topologies, reference articles, and video resources.
          </p>
        </div>

        <button
          onClick={handleLoadAndOpen}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition-all shadow-md shadow-sky-600/30 text-xs whitespace-nowrap"
        >
          <Play className="w-4 h-4" />
          <span>Load Exp {currentExp.number} into Simulator</span>
        </button>
      </div>

      {/* Main 2-Column Split: Experiments List (Left) + Selected Lab Manual (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Experiments Navigation List (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-2 p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 px-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Experiments Index
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              {ACADEMIC_EXPERIMENTS.length} Total Labs
            </span>
          </div>

          <div className="space-y-1.5 max-h-[720px] overflow-y-auto pr-1">
            {ACADEMIC_EXPERIMENTS.map((exp) => {
              const isSelected = exp.id === currentExp.id;
              return (
                <button
                  key={exp.id}
                  onClick={() => {
                    setSelectedExpId(exp.id);
                    setActiveVisualStepIdx(0);
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'bg-sky-950/80 border-sky-500/80 text-white shadow-sm ring-1 ring-sky-500/40'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-md font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 ${
                    isSelected ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {exp.number}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-sky-400">
                        {exp.category}
                      </span>
                    </div>
                    <div className="text-xs font-semibold leading-snug line-clamp-2">
                      {exp.title}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Lab Manual, Step-by-Step Visualizer & Resources (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-5 bg-slate-900 border border-slate-800 rounded-xl p-6">
          
          {/* Header of Active Experiment */}
          <div className="space-y-2 border-b border-slate-800 pb-4">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-sky-400 border border-slate-700">
                EXPERIMENT {currentExp.number} : {currentExp.category.toUpperCase()}
              </span>
              <button
                onClick={handleLoadAndOpen}
                className="flex items-center gap-1.5 px-3 py-1 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 rounded text-xs font-semibold transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Open in Simulator</span>
              </button>
            </div>

            <h3 className="text-lg font-bold text-white tracking-tight">
              {currentExp.title}
            </h3>

            {/* Aim */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 text-xs">
              <strong className="text-sky-400 uppercase tracking-wider text-[10px] block mb-1">
                Aim / Objective:
              </strong>
              <p className="text-slate-300 leading-relaxed font-sans">{currentExp.aim}</p>
            </div>

            {/* Apparatus Required */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-xs text-slate-400 font-semibold mr-1">Apparatus:</span>
              {currentExp.apparatus.map((app, i) => (
                <span key={i} className="px-2 py-0.5 bg-slate-800/80 text-slate-300 rounded text-[11px] border border-slate-700/60 font-mono">
                  {app}
                </span>
              ))}
            </div>
          </div>

          {/* Lab procedure and interactive visual explanation */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('procedure')}
              className={`px-3 py-1.5 rounded-t-md transition-colors ${
                activeTab === 'procedure'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Procedure & CLI Commands
            </button>
            <button
              onClick={() => setActiveTab('visualizer')}
              className={`px-3 py-1.5 rounded-t-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'visualizer'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span>Interactive Visual Demonstration</span>
            </button>
          </div>

          {/* TAB 1: PROCEDURE & CLI COMMANDS */}
          {activeTab === 'procedure' && (
            <div className="space-y-5">
              {/* Background Theory */}
              <div>
                <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-1.5 text-slate-300">
                  Theoretical Background
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  {currentExp.background}
                </p>
              </div>

              {/* Step-by-Step Procedure */}
              <div>
                <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-2 text-slate-300">
                  Step-by-Step Execution Procedure
                </h4>
                <div className="space-y-2">
                  {currentExp.procedureSteps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-sky-400 font-mono font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-slate-300 leading-relaxed font-sans">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* CLI Commands Reference (if any) */}
              {currentExp.cliCommands && currentExp.cliCommands.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Cisco IOS CLI Commands Reference</span>
                    </h4>
                  </div>
                  <div className="p-3 bg-black border border-slate-800 rounded-lg font-mono text-xs text-emerald-400 space-y-1">
                    {currentExp.cliCommands.map((cmd, i) => (
                      <div key={i}>{cmd}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Verification Checklist */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-300">
                    Automated Lab Verification Check
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase font-mono ${
                    isRequirementMet
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/50'
                      : 'bg-amber-950 text-amber-400 border border-amber-500/50'
                  }`}>
                    {isRequirementMet ? '✓ Objective Completed' : 'Pending in Workspace'}
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  {currentExp.verificationCheck.description}
                </p>
                {!isRequirementMet && (
                  <p className="text-[11px] text-amber-400/90 font-mono">
                    Hint: {currentExp.verificationCheck.hint}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: INTERACTIVE VISUAL DEMONSTRATION */}
          {activeTab === 'visualizer' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div>
                    <h4 className="font-bold text-white text-sm">
                      {currentExp.visualExplanation.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {currentExp.visualExplanation.description}
                    </p>
                  </div>
                </div>

                {/* Animated Steps Pipeline */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2">
                  {currentExp.visualExplanation.steps.map((st, i) => {
                    const isCurrent = i === activeVisualStepIdx;
                    return (
                      <button
                        key={i}
                        onClick={() => setActiveVisualStepIdx(i)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          isCurrent
                            ? 'bg-sky-950 border-sky-400 text-white shadow-md ring-1 ring-sky-400'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="text-[10px] font-mono text-slate-500 mb-1">
                          Step {st.step} of {currentExp.visualExplanation.steps.length}
                        </div>
                        <div className="text-xs font-bold leading-tight line-clamp-1 text-sky-300">
                          {st.label}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Step Detail Card */}
                {currentExp.visualExplanation.steps[activeVisualStepIdx] && (
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-3 mt-3 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-400 font-mono">
                        {currentExp.visualExplanation.steps[activeVisualStepIdx].layer}
                      </span>
                      <span className="font-mono text-slate-400">
                        {currentExp.visualExplanation.steps[activeVisualStepIdx].source} →{' '}
                        {currentExp.visualExplanation.steps[activeVisualStepIdx].target}
                      </span>
                    </div>

                    <div className="p-3 bg-black rounded border border-slate-800 font-mono text-xs text-slate-200">
                      {currentExp.visualExplanation.steps[activeVisualStepIdx].detail}
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <button
                        disabled={activeVisualStepIdx === 0}
                        onClick={() => setActiveVisualStepIdx(prev => prev - 1)}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white rounded text-xs"
                      >
                        ← Previous Step
                      </button>

                      <button
                        disabled={activeVisualStepIdx === currentExp.visualExplanation.steps.length - 1}
                        onClick={() => setActiveVisualStepIdx(prev => prev + 1)}
                        className="px-3 py-1 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white rounded text-xs font-bold"
                      >
                        Next Step →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reference links and topic-matched video search */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 mt-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                <span>References & video resources</span>
              </h4>
              <button
                onClick={() => setIsNotesModalOpen(true)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold transition-colors flex items-center gap-1"
              >
                <BookOpen className="w-3 h-3" />
                <span>Read In-App Notes</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* GeeksforGeeks / Reference Link */}
              <a
                href={currentExp.resources.referenceUrl || currentExp.resources.geeksForGeeksUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-950/30 transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold font-mono text-[10px]">
                    {currentExp.resources.referenceSource === 'Cloudflare' ? 'CF' : currentExp.resources.referenceSource === 'RFC Editor' ? 'RFC' : 'GFG'}
                  </div>
                  <div>
                    <div className="font-bold text-emerald-300 group-hover:text-emerald-200">
                      {currentExp.resources.referenceSource || 'Reference'}
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">
                      {currentExp.resources.referenceTitle || currentExp.resources.geeksForGeeksTitle}
                    </div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-emerald-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </a>

              {/* YouTube Tutorial Link */}
              <a
                href={buildLabVideoSearchUrl(currentExp)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg bg-rose-950/20 border border-rose-500/30 hover:border-rose-400 hover:bg-rose-950/30 transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                    <Youtube className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-rose-300 group-hover:text-rose-200">
                      Search YouTube
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">
                      {currentExp.resources.youtubeTitle} · topic-matched results
                    </div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-rose-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </div>

        </div>

      </div>

      {/* In-App Notes & Reference Modal */}
      {isNotesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="flex flex-col w-full max-w-2xl bg-slate-900 border-2 border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-[85vh]">
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-sky-400" />
                <h3 className="font-bold text-white text-sm">
                  {currentExp.title} - Academic Laboratory Notes
                </h3>
              </div>
              <button
                onClick={() => setIsNotesModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 text-xs space-y-4 text-slate-300 leading-relaxed">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-[10px] font-mono text-sky-400 font-bold uppercase block mb-1">
                  Aim & Objective
                </span>
                <p>{currentExp.aim}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider text-slate-400">
                  Background Theory & Working Architecture:
                </h4>
                <p>{currentExp.background}</p>
              </div>

              {currentExp.cliCommands && currentExp.cliCommands.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-amber-400 text-xs uppercase tracking-wider">
                    Cisco IOS CLI Syntax Reference:
                  </h4>
                  <pre className="p-3 bg-black rounded font-mono text-xs text-slate-200 overflow-x-auto whitespace-pre">
                    {currentExp.cliCommands.join('\n')}
                  </pre>
                </div>
              )}

              <div className="pt-2 flex justify-between items-center border-t border-slate-800">
                <button
                  onClick={() => setIsNotesModalOpen(false)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs"
                >
                  Close Notes
                </button>
                <button
                  onClick={() => {
                    setIsNotesModalOpen(false);
                    handleLoadAndOpen();
                  }}
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded text-xs flex items-center gap-1.5 shadow-md"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Load into Simulator</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
