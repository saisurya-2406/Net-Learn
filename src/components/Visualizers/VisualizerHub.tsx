import React, { useState } from 'react';
import { Layers, ShieldCheck, ArrowLeftRight, GitFork, RefreshCw, Globe } from 'lucide-react';
import { OsiEncapsulationVisualizer } from './OsiEncapsulationVisualizer';
import { ErrorDetectionVisualizer } from './ErrorDetectionVisualizer';
import { FlowControlVisualizer } from './FlowControlVisualizer';
import { RoutingAlgorithmsVisualizer } from './RoutingAlgorithmsVisualizer';
import { TcpHandshakeVisualizer } from './TcpHandshakeVisualizer';
import { DhcpDnsVisualizer } from './DhcpDnsVisualizer';

export type VisualizerSection = 
  | 'osi'
  | 'error-detection'
  | 'flow-control'
  | 'routing'
  | 'tcp-handshake'
  | 'dhcp-dns';

interface VisualizerHubProps {
  initialSection?: VisualizerSection;
}

export const VisualizerHub: React.FC<VisualizerHubProps> = ({ initialSection = 'routing' }) => {
  const [section, setSection] = useState<VisualizerSection>(initialSection);

  const TABS = [
    { id: 'routing' as const, label: 'Routing Algorithm Visualizer (RIP, OSPF, BGP)', icon: GitFork },
    { id: 'osi' as const, label: 'OSI & Encapsulation', icon: Layers },
    { id: 'error-detection' as const, label: 'Error Detection & CRC', icon: ShieldCheck },
    { id: 'flow-control' as const, label: 'Flow Control & ARQ', icon: ArrowLeftRight },
    { id: 'tcp-handshake' as const, label: 'TCP 3-Way Handshake', icon: RefreshCw },
    { id: 'dhcp-dns' as const, label: 'DHCP & DNS Exchange', icon: Globe },
  ];

  return (
    <div className="space-y-6">
      {/* Sub-navigation bar with segmented button controls */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto text-xs font-medium">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = section === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSection(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-sky-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Render Active Visualizer */}
      {section === 'osi' && <OsiEncapsulationVisualizer />}
      {section === 'error-detection' && <ErrorDetectionVisualizer />}
      {section === 'flow-control' && <FlowControlVisualizer />}
      {section === 'routing' && <RoutingAlgorithmsVisualizer />}
      {section === 'tcp-handshake' && <TcpHandshakeVisualizer />}
      {section === 'dhcp-dns' && <DhcpDnsVisualizer />}
    </div>
  );
};
