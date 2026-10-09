import React, { useState } from 'react';
import { 
  BookOpen, Search, CheckCircle2, ChevronRight, Layers, Cpu, 
  Network, Compass, Zap, Shield, Globe, Award, HelpCircle, 
  ExternalLink, Play, Copy, Check, ArrowRight, Hash, Calculator,
  FlaskConical, Terminal, Activity, ArrowUpRight
} from 'lucide-react';
import { FIVE_UNITS_DATA } from '../../data/units';
import { SyllabusTopic, UnitSection } from '../../types/syllabus';
import { ACADEMIC_EXPERIMENTS, AcademicExperiment } from '../../data/labData';
import { NetworkDevice, NetworkLink } from '../../types/network';
import { ActiveTab } from '../Navbar';
import { TOPIC_LAB_MAPPINGS, UNIT_LAB_MAPPINGS } from '../../data/syllabusLabMappings';

interface SyllabusExamGuideViewProps {
  onNavigateToTab?: (tab: ActiveTab) => void;
  onLoadTopology?: (devices: NetworkDevice[], links: NetworkLink[]) => void;
  onOpenLab?: (experimentId: string) => void;
}

export const SyllabusExamGuideView: React.FC<SyllabusExamGuideViewProps> = ({
  onNavigateToTab,
  onLoadTopology,
  onOpenLab
}) => {
  const [selectedUnitId, setSelectedUnitId] = useState<string>('unit-1');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('u1-t1');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [activeTabMode, setActiveTabMode] = useState<'theory' | 'labs'>('theory');

  const getUnitIcon = (name: string) => {
    switch (name) {
      case 'Network': return Network;
      case 'Layers': return Layers;
      case 'Compass': return Compass;
      case 'Zap': return Zap;
      case 'Shield': return Shield;
      case 'Globe': return Globe;
      default: return BookOpen;
    }
  };

  const activeUnit = FIVE_UNITS_DATA.find(u => u.id === selectedUnitId) || FIVE_UNITS_DATA[0];
  const activeTopic = activeUnit.topics.find(t => t.id === selectedTopicId) || activeUnit.topics[0];

  // Get corresponding labs for the active unit
  const activeUnitLabNumbers = UNIT_LAB_MAPPINGS[activeUnit.unitNumber] || [];
  const activeUnitLabs = ACADEMIC_EXPERIMENTS.filter(e => activeUnitLabNumbers.includes(e.number));

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const handleLoadLab = (lab: AcademicExperiment) => {
    if (onLoadTopology) {
      onLoadTopology(lab.initialTopology.devices, lab.initialTopology.links);
    }
    if (onNavigateToTab) {
      onNavigateToTab('simulator');
    }
  };

  const handleOpenLabManual = () => {
    if (relevantLabExp && onOpenLab) {
      onOpenLab(relevantLabExp.id);
      return;
    }
    if (onNavigateToTab) {
      onNavigateToTab('labs');
    }
  };

  // Filtered search across all units and topics
  const allTopics = FIVE_UNITS_DATA.flatMap(u => u.topics.map(t => ({ ...t, unit: u })));
  const filteredSearchResults = searchQuery.trim()
    ? allTopics.filter(t => 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.keyPoints.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : null;

  const relevantLab = TOPIC_LAB_MAPPINGS[activeTopic.id];
  const relevantLabExp = relevantLab 
    ? ACADEMIC_EXPERIMENTS.find(e => e.number === relevantLab.labNumber) 
    : undefined;

  return (
    <div className="flex flex-col gap-6">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Official 5-Unit Curriculum
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-slate-400 text-xs font-mono">Guided theory and practical links</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-sky-400" />
            <span>Computer Networks Master Syllabus & Lab Experiments</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Complete syllabus notes, protocol diagrams, exam writing strategies, and corresponding network laboratory experiments (Labs 1 to 15).
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search concepts, formulas, RFCs, protocols..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Unit Selector Strip (5 Units) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {FIVE_UNITS_DATA.map((unit) => {
          const Icon = getUnitIcon(unit.iconName);
          const isSelected = unit.id === activeUnit.id && !searchQuery;
          const labCount = (UNIT_LAB_MAPPINGS[unit.unitNumber] || []).length;

          return (
            <button
              key={unit.id}
              onClick={() => {
                setSelectedUnitId(unit.id);
                setSelectedTopicId(unit.topics[0].id);
                setSearchQuery('');
              }}
              className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between gap-2 ${
                isSelected
                  ? 'bg-sky-950/80 border-sky-500 text-white shadow-md ring-1 ring-sky-500/50'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  isSelected ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  UNIT {unit.unitNumber}
                </span>
                <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                  {labCount} Labs
                </span>
              </div>
              <div className="text-xs font-bold leading-tight line-clamp-2">
                {unit.title.replace(/^Unit \d+:\s*/i, '').trim()}
              </div>
            </button>
          );
        })}
      </div>

      {/* View Mode Switcher: Theory vs Associated Labs */}
      <div className="flex items-center justify-between p-2 bg-slate-900/90 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-1.5 text-xs font-bold">
          <button
            onClick={() => setActiveTabMode('theory')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
              activeTabMode === 'theory'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Theory Topics & Notes ({activeUnit.topics.length})</span>
          </button>
          <button
            onClick={() => setActiveTabMode('labs')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
              activeTabMode === 'labs'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Unit {activeUnit.unitNumber} Labs ({activeUnitLabs.length} Experiments)</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 pr-2 font-mono">
          <span>Labs assigned:</span>
          <span className="font-bold text-sky-400">
            {activeUnitLabNumbers.map(n => `Lab ${n}`).join(', ')}
          </span>
        </div>
      </div>

      {/* TAB MODE 1: THEORY TOPICS & EXAM NOTES */}
      {activeTabMode === 'theory' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Topics List (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col gap-2 p-3 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 px-2 text-xs">
              <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                {searchQuery ? `Search Results (${filteredSearchResults?.length || 0})` : `Unit ${activeUnit.unitNumber} Topics`}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {searchQuery ? 'Global' : `${activeUnit.topics.length} Sections`}
              </span>
            </div>

            <div className="space-y-1.5 max-h-[700px] overflow-y-auto pr-1">
              {searchQuery ? (
                filteredSearchResults && filteredSearchResults.length > 0 ? (
                  filteredSearchResults.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedUnitId(t.unit.id);
                        setSelectedTopicId(t.id);
                      }}
                      className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs ${
                        t.id === activeTopic.id
                          ? 'bg-sky-950/80 border-sky-500 text-white shadow-sm ring-1 ring-sky-500/40'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-[10px] text-sky-400 font-mono font-bold mb-0.5">
                        UNIT {t.unit.unitNumber}
                      </div>
                      <div className="font-semibold text-white line-clamp-1">
                        {t.title}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No matching topics found for "{searchQuery}".
                  </div>
                )
              ) : (
                activeUnit.topics.map((topic, idx) => {
                  const isSelected = topic.id === activeTopic.id;
                  const hasLab = !!TOPIC_LAB_MAPPINGS[topic.id];

                  return (
                    <button
                      key={topic.id}
                      onClick={() => setSelectedTopicId(topic.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all flex items-start gap-2.5 ${
                        isSelected
                          ? 'bg-sky-950/80 border-sky-500 text-white shadow-sm ring-1 ring-sky-500/40'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold leading-snug line-clamp-2">
                          {topic.title}
                        </div>
                        {hasLab && (
                          <span className="inline-block mt-1 text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                            Practical Lab Mapped
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Full Detail Pane (8 Cols) */}
          <div className="lg:col-span-8 flex flex-col gap-5 bg-slate-900 border border-slate-800 rounded-xl p-6">
            
            {/* Header */}
            <div className="space-y-2 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-sky-950 text-sky-400 border border-sky-800">
                  UNIT {activeUnit.unitNumber}
                </span>
                <span className="text-slate-500 text-xs">•</span>
                <span className="text-slate-400 text-xs font-medium">Standard Academic Syllabus</span>
              </div>

              <h3 className="text-lg font-bold text-white tracking-tight">
                {activeTopic.title}
              </h3>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {activeTopic.description}
              </p>
            </div>

            {/* In-Context Mapped Lab Banner (If this topic has a syllabus lab) */}
            {relevantLab && (
              <div className="p-3.5 bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                    <FlaskConical className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-emerald-300">
                      Corresponding Practical Lab: Lab {relevantLab.labNumber}
                    </div>
                    <div className="text-slate-300 text-[11px] mt-0.5">
                      {relevantLab.title}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {relevantLabExp && (
                    <button
                      onClick={() => handleLoadLab(relevantLabExp)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shadow-sm transition-all"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Load in Simulator</span>
                    </button>
                  )}
                  <button
                    onClick={handleOpenLabManual}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold text-xs border border-slate-700 transition-colors"
                  >
                    <span>Lab Manual</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Key Concept Points Box */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5 text-xs">
              <h4 className="font-bold text-sky-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Core Theoretical Concepts & Working Mechanisms</span>
              </h4>

              <ul className="space-y-2 text-slate-300 leading-relaxed">
                {activeTopic.keyPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-sky-500 font-bold shrink-0 mt-0.5">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {activeTopic.references && activeTopic.references.length > 0 && (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5 text-xs">
                <h4 className="font-bold text-emerald-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Concept References</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {activeTopic.references.map((ref, idx) => (
                    <a
                      key={idx}
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:border-emerald-500/60 hover:text-emerald-300 transition-colors"
                    >
                      <span className="font-mono text-[10px] uppercase text-sky-400">{ref.type || 'Guide'}</span>
                      <span>{ref.title}</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Architecture / Formula / Protocol Flow Diagram */}
            {activeTopic.diagramOrSnippet && (
              <div className="p-4 bg-black border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-900">
                  <span className="font-mono font-bold text-amber-400 text-[11px] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Protocol Diagram / Mathematical Flow</span>
                  </span>
                  <button
                    onClick={() => handleCopy(activeTopic.diagramOrSnippet!, activeTopic.id)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] transition-colors"
                  >
                    {copiedSnippet === activeTopic.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Diagram</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="font-mono text-[11px] text-slate-200 overflow-x-auto whitespace-pre leading-relaxed p-2">
                  {activeTopic.diagramOrSnippet}
                </pre>
              </div>
            )}

            {/* Exam Tip: How to write in exam for Full Marks */}
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-300 text-xs">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Full Marks Exam Blueprint & Writing Strategy</span>
              </div>
              <p className="text-slate-300 leading-relaxed font-sans">
                {activeTopic.examTips}
              </p>
            </div>

          </div>

        </div>
      )}

      {/* TAB MODE 2: ASSOCIATED LABORATORY EXPERIMENTS (LABS 1 TO 15) */}
      {activeTabMode === 'labs' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <h3 className="font-bold text-white text-sm">
                Unit {activeUnit.unitNumber} Hands-On Network Labs
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                These {activeUnitLabs.length} experiments are prescribed for Unit {activeUnit.unitNumber}. You can test the CLI commands below or load the topology directly into the interactive simulator.
              </p>
            </div>

            <button
              onClick={handleOpenLabManual}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold rounded-lg border border-slate-700 transition-colors shrink-0"
            >
              <span>Open Complete Lab Index</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeUnitLabs.map((lab) => (
              <div 
                key={lab.id}
                className="p-5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-between gap-4 hover:border-slate-700 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-950 text-sky-400 border border-sky-800">
                      LAB {lab.number}
                    </span>
                    <span className="text-[10px] font-mono uppercase text-slate-400">
                      {lab.category}
                    </span>
                  </div>

                  <h4 className="font-bold text-white text-sm leading-snug">
                    {lab.title}
                  </h4>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans line-clamp-3">
                    <strong>Aim:</strong> {lab.aim}
                  </p>

                  {/* Apparatus */}
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] space-y-1">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Apparatus / Components:</span>
                    <ul className="text-slate-300 list-disc list-inside">
                      {lab.apparatus.slice(0, 3).map((a, i) => (
                        <li key={i} className="truncate">{a}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Key CLI Snippet */}
                  {lab.cliCommands && lab.cliCommands.length > 0 && (
                    <div className="p-2.5 rounded-lg bg-black border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-amber-400 font-mono font-bold">
                        <span className="flex items-center gap-1">
                          <Terminal className="w-3 h-3" />
                          <span>Cisco IOS Commands</span>
                        </span>
                        <button
                          onClick={() => handleCopy(lab.cliCommands!.join('\n'), lab.id)}
                          className="text-slate-400 hover:text-white"
                        >
                          {copiedSnippet === lab.id ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <pre className="text-[11px] font-mono text-emerald-400 overflow-x-auto whitespace-pre">
                        {lab.cliCommands.slice(0, 3).join('\n')}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Lab Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80">
                  <button
                    onClick={() => handleLoadLab(lab)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold shadow-md shadow-sky-600/30 transition-all"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Launch in Simulator</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
