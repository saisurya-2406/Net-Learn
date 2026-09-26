import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Eye, Shield, Layers, X } from 'lucide-react';
import { PacketHeaders, SimulationStep } from '../../types/network';

interface PacketInspectorProps {
  headers?: PacketHeaders | null;
  step?: SimulationStep | null;
  packetName?: string;
  isOpen?: boolean;
  onClose?: () => void;
  onOpenWhyExplainer?: () => void;
}

export const PacketInspector: React.FC<PacketInspectorProps> = ({
  headers: propHeaders,
  step,
  packetName = 'ICMP Echo Request',
  isOpen = true,
  onClose,
  onOpenWhyExplainer,
}) => {
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    l2: true,
    l3: true,
    l4: true,
    payload: true,
  });

  if (!isOpen) return null;

  const activeHeaders = step ? step.headers : propHeaders;
  const activeName = step ? step.packetName : packetName;

  const toggleSection = (sec: string) => {
    setOpenSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const content = (
    <div className="flex flex-col gap-3 font-mono text-xs">
      {/* Title Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-sky-400" />
          <span className="font-bold text-white font-sans text-xs">
            Wireshark Packet Dissection: {activeName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onOpenWhyExplainer && (
            <button
              onClick={onOpenWhyExplainer}
              className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-[11px] font-sans font-semibold transition-colors"
            >
              Why Did This Happen?
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 font-sans"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {!activeHeaders ? (
        <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl text-center text-xs text-slate-400 italic">
          No packet currently moving along the wire. Start or step forward in the simulation to sniff and dissect live packet headers.
        </div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {/* Layer 2: Ethernet II */}
          <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/70">
            <button
              onClick={() => toggleSection('l2')}
              className="w-full flex items-center justify-between p-2.5 bg-slate-950 text-left font-semibold text-sky-400 hover:bg-slate-900/60 transition-colors"
            >
              <div className="flex items-center gap-2">
                {openSections.l2 ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                <span>Frame: Ethernet II (14 Bytes)</span>
              </div>
              <span className="text-[10px] text-slate-500">Layer 2 Data Link</span>
            </button>

            {openSections.l2 && (
              <div className="p-3 text-[11px] space-y-1.5 text-slate-300 divide-y divide-slate-800/60">
                <div className="flex justify-between">
                  <span className="text-slate-500">Destination MAC:</span>
                  <span className="text-white font-bold">{activeHeaders.ethernet.destMac}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Source MAC:</span>
                  <span className="text-white font-bold">{activeHeaders.ethernet.sourceMac}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Type:</span>
                  <span className="text-emerald-400">{activeHeaders.ethernet.type}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Frame Check Sequence (FCS):</span>
                  <span className="text-slate-400">{activeHeaders.ethernet.fcs}</span>
                </div>
              </div>
            )}
          </div>

          {/* Layer 3: IPv4 Packet */}
          {activeHeaders.ip && (
            <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/70">
              <button
                onClick={() => toggleSection('l3')}
                className="w-full flex items-center justify-between p-2.5 bg-slate-950 text-left font-semibold text-indigo-400 hover:bg-slate-900/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {openSections.l3 ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  <span>Internet Protocol Version 4 (20 Bytes)</span>
                </div>
                <span className="text-[10px] text-slate-500">Layer 3 Network</span>
              </button>

              {openSections.l3 && (
                <div className="p-3 text-[11px] space-y-1.5 text-slate-300 divide-y divide-slate-800/60">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Source IP:</span>
                    <span className="text-sky-300 font-bold">{activeHeaders.ip.sourceIp}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500">Destination IP:</span>
                    <span className="text-indigo-300 font-bold">{activeHeaders.ip.destIp}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500">Time to Live (TTL):</span>
                    <span className="text-amber-400 font-bold">{activeHeaders.ip.ttl}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500">Protocol:</span>
                    <span className="text-white">{activeHeaders.ip.protocol}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500">Header Checksum:</span>
                    <span className="text-slate-400">{activeHeaders.ip.headerChecksum}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Layer 4: Transport */}
          {activeHeaders.transport && (
            <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/70">
              <button
                onClick={() => toggleSection('l4')}
                className="w-full flex items-center justify-between p-2.5 bg-slate-950 text-left font-semibold text-purple-400 hover:bg-slate-900/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {openSections.l4 ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  <span>Transport: {activeHeaders.transport.protocol}</span>
                </div>
                <span className="text-[10px] text-slate-500">Layer 4 Transport</span>
              </button>

              {openSections.l4 && (
                <div className="p-3 text-[11px] space-y-1.5 text-slate-300 divide-y divide-slate-800/60">
                  {activeHeaders.transport.sourcePort && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Source Port:</span>
                      <span className="text-white">{activeHeaders.transport.sourcePort}</span>
                    </div>
                  )}
                  {activeHeaders.transport.destPort && (
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-500">Destination Port:</span>
                      <span className="text-white">{activeHeaders.transport.destPort}</span>
                    </div>
                  )}
                  {activeHeaders.transport.icmpType && (
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-500">ICMP Control Message:</span>
                      <span className="text-emerald-400 font-bold">{activeHeaders.transport.icmpType}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Payload Data */}
          {activeHeaders.payload && (
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <div className="text-slate-500 text-[10px] uppercase font-bold mb-1">
                Layer 7 Payload Data
              </div>
              <div className="text-slate-300 text-xs font-mono break-all">
                {activeHeaders.payload}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (onClose) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
        <div className="w-full max-w-xl bg-slate-900 border-2 border-slate-700 rounded-xl p-4 shadow-2xl">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
      {content}
    </div>
  );
};
