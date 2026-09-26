import React from 'react';
import { X, HelpCircle, CheckCircle2, ArrowRight, ShieldCheck, BookOpen } from 'lucide-react';
import { SimulationStep } from '../../types/network';

interface WhyDidThisHappenModalProps {
  step: SimulationStep | null;
  isOpen: boolean;
  onClose: () => void;
}

export const WhyDidThisHappenModal: React.FC<WhyDidThisHappenModalProps> = ({
  step,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !step) return null;

  const { explanation, headers, protocol } = step;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-mono text-amber-400 uppercase tracking-wider font-semibold">
                NetLearn Signature Explainer
              </span>
              <h2 className="text-base font-bold text-white mt-0.5">
                Why Did This Network Event Happen?
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5 text-xs leading-relaxed">
          {/* Main Action Banner */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <span>{explanation.title}</span>
            </div>
            <p className="text-slate-300 font-sans text-xs">
              {explanation.whatHappened}
            </p>
          </div>

          {/* Decision Reason */}
          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] text-slate-400">
              Underlying Protocol Logic & State Machine
            </h4>
            <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80 font-mono text-xs text-sky-200 space-y-2">
              <div>{explanation.decisionReason}</div>
              <div className="text-slate-400 pt-1 border-t border-slate-800">
                Layer Mechanism: <span className="text-emerald-400">{explanation.layerMechanism}</span>
              </div>
            </div>
          </div>

          {/* Rules Applied */}
          {explanation.rulesApplied && explanation.rulesApplied.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px] text-slate-400">
                Governing Networking Invariants Applied:
              </h4>
              <div className="space-y-1.5">
                {explanation.rulesApplied.map((rule, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-2.5 bg-slate-950/60 rounded-lg border border-slate-800 text-slate-300"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deep Header Packet Snapshot */}
          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] text-slate-400">
              Active Packet Header Values at this Hop
            </h4>
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px]">
              <div>
                <span className="text-slate-500 block">L2 Source MAC:</span>
                <span className="text-white">{headers.ethernet.sourceMac}</span>
              </div>
              <div>
                <span className="text-slate-500 block">L2 Destination MAC:</span>
                <span className="text-sky-400">{headers.ethernet.destMac}</span>
              </div>
              {headers.ip && (
                <>
                  <div>
                    <span className="text-slate-500 block">L3 Source IP:</span>
                    <span className="text-white">{headers.ip.sourceIp}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">L3 Destination IP:</span>
                    <span className="text-emerald-400">{headers.ip.destIp}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">TTL (Time to Live):</span>
                    <span className="text-amber-400">{headers.ip.ttl}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Transport Protocol:</span>
                    <span className="text-white">{headers.ip.protocol}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 text-xs">
          <span className="text-slate-500">
            NETLEARN Core Principle: Understand WHAT and WHY.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
