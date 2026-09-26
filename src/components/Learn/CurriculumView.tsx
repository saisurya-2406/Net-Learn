import React, { useState } from 'react';
import { 
  BookOpen, Search, ArrowRight, Play, ExternalLink, AlertTriangle, 
  CheckCircle2, Compass, Layers, Zap, Globe, Shield, Cpu, Network
} from 'lucide-react';
import { CURRICULUM_MODULES, CurriculumTopic } from '../../data/curriculumData';

interface CurriculumViewProps {
  onOpenVisualizer: (section?: any) => void;
  onOpenLab: (labId?: string) => void;
}

export const CurriculumView: React.FC<CurriculumViewProps> = ({
  onOpenVisualizer,
  onOpenLab,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedModuleId, setSelectedModuleId] = useState<string>('mod-1');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('top-1-1');

  // Search filtering
  const allTopics = CURRICULUM_MODULES.flatMap((m) => m.topics);
  const filteredTopics = searchQuery.trim()
    ? allTopics.filter(
        (t) =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.keyConcepts.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : null;

  const activeTopic = allTopics.find((t) => t.id === selectedTopicId) || allTopics[0];

  const getModuleIcon = (iconName: string) => {
    switch (iconName) {
      case 'Network':
        return Network;
      case 'Cpu':
        return Cpu;
      case 'Layers':
        return Layers;
      case 'Compass':
        return Compass;
      case 'Zap':
        return Zap;
      case 'Globe':
        return Globe;
      case 'Shield':
        return Shield;
      default:
        return BookOpen;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Global Search Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-sky-400" />
            <span>Computer Networks Curriculum & Knowledge Base</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Explore rigorous A–Z Computer Networks foundations: What it is, How it works, and Why the network behaves this way.
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search concepts, RFCs, protocols..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Main Layout: Left Modules/Topics Navigator, Right Content Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Modules & Topics list */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {filteredTopics ? (
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                Search Results ({filteredTopics.length})
              </div>
              {filteredTopics.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTopicId(t.id)}
                  className={`w-full p-3.5 rounded-lg border text-left transition-all ${
                    t.id === selectedTopicId
                      ? 'bg-sky-950/40 border-sky-500 shadow-md ring-1 ring-sky-500/50'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-semibold text-sky-400">{t.category}</div>
                  <div className="font-bold text-sm text-white mt-0.5">{t.title}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Module selection */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                  Curriculum Modules
                </span>
                {CURRICULUM_MODULES.map((mod) => {
                  const Icon = getModuleIcon(mod.iconName);
                  const isModSelected = mod.id === selectedModuleId;
                  return (
                    <button
                      key={mod.id}
                      onClick={() => {
                        setSelectedModuleId(mod.id);
                        if (mod.topics[0]) setSelectedTopicId(mod.topics[0].id);
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        isModSelected
                          ? 'bg-slate-850 border-sky-500/80 text-white shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg ${
                          isModSelected ? 'bg-sky-600 text-white' : 'bg-slate-950 text-slate-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-xs leading-snug">
                          Module {mod.number}: {mod.title}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {mod.topics.length} In-Depth Topics
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Topics of current module */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                  Topics in Module
                </span>
                {CURRICULUM_MODULES.find((m) => m.id === selectedModuleId)?.topics.map((t) => {
                  const isTopSelected = t.id === selectedTopicId;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTopicId(t.id)}
                      className={`w-full p-3 rounded-lg border text-left text-xs transition-all ${
                        isTopSelected
                          ? 'bg-sky-950/40 border-sky-500 text-white font-semibold'
                          : 'bg-slate-950/80 border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <div className="font-semibold text-white">{t.title}</div>
                      <div className="text-[11px] text-slate-500 mt-1 font-mono">
                        {t.durationMin} mins · {t.level}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Full Curriculum Topic Content Reader */}
        <div className="lg:col-span-8 p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-6">
          {/* Header */}
          <div className="border-b border-slate-800 pb-4 space-y-2">
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="text-sky-400 font-semibold">{activeTopic.category}</span>
              <span aria-hidden="true">·</span>
              <span>{activeTopic.level} Level</span>
              <span aria-hidden="true">·</span>
              <span>{activeTopic.durationMin} Min Read</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {activeTopic.title}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              {activeTopic.summary}
            </p>

            {/* Quick Action Links: Visualizer / Lab */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {activeTopic.visualizerLink && (
                <button
                  onClick={() => onOpenVisualizer(activeTopic.visualizerLink)}
                  className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Launch Visualizer</span>
                </button>
              )}
              {activeTopic.labId && (
                <button
                  onClick={() => onOpenLab(activeTopic.labId)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
                >
                  <span>Open Guided Lab</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Key Concepts Unboxed Text */}
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Core Principles:
            </span>
            <div className="flex flex-wrap gap-2 text-xs text-sky-300 font-mono">
              {activeTopic.keyConcepts.map((c, i) => (
                <span key={i} className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* The Triad: What, How, Why */}
          <div className="space-y-4">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1.5">
              <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                1. WHAT IS IT?
              </h3>
              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                {activeTopic.whatIsIt}
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1.5">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                2. HOW DOES IT WORK?
              </h3>
              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                {activeTopic.howItWorks}
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1.5">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                3. WHY DOES IT MATTER?
              </h3>
              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                {activeTopic.whyItMatters}
              </p>
            </div>
          </div>

          {/* Real-World Packet or CLI Example */}
          {activeTopic.cliOrPacketExample && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Real-World Packet / CLI Example: {activeTopic.cliOrPacketExample.title}
              </h3>
              <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                {activeTopic.cliOrPacketExample.content}
              </pre>
            </div>
          )}

          {/* Common Mistakes Engine */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Common Student Mistakes & Exam Pitfalls</span>
            </h3>
            <div className="space-y-2 font-sans text-xs">
              {activeTopic.commonMistakes.map((mistake, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-rose-950/20 border border-rose-500/30 rounded-lg text-rose-200"
                >
                  {mistake}
                </div>
              ))}
            </div>
          </div>

          {/* Academic & Exam Questions */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              High-Yield Exam Practice Questions
            </h3>
            <div className="space-y-2 font-mono text-xs text-slate-300">
              {activeTopic.examQuestions.map((q, idx) => (
                <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                  {idx + 1}. {q}
                </div>
              ))}
            </div>
          </div>

          {/* References */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <span className="text-xs font-semibold text-slate-500">
              Authoritative RFC & Engineering References:
            </span>
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              {activeTopic.references?.map((ref, idx) => (
                <a
                  key={idx}
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-950 border border-slate-800 rounded text-slate-400 hover:text-sky-300 hover:border-sky-700 transition-colors"
                >
                  <ExternalLink className="w-3 h-3 text-sky-400" />
                  <span>{ref.title}</span>
                </a>
              )) || <span className="text-slate-500">No direct references added for this topic yet.</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
