/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { DashboardView } from './components/Dashboard/DashboardView';
import { PacketSimulatorWorkspace } from './components/Simulator/PacketSimulatorWorkspace';
import { LabsAndTroubleshootView } from './components/Labs/LabsAndTroubleshootView';
import { VisualizerHub } from './components/Visualizers/VisualizerHub';
import { CalculatorsView } from './components/Calculators/CalculatorsView';
import { PracticeAndVivaView } from './components/Practice/PracticeAndVivaView';
import { StudyResourcesView } from './components/Learn/StudyResourcesView';
import { SyllabusExamGuideView } from './components/Learn/SyllabusExamGuideView';
import { NetworkDevice, NetworkLink } from './types/network';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Shared topology state between Simulator and Labs
  const [activeDevices, setActiveDevices] = useState<NetworkDevice[]>([]);
  const [activeLinks, setActiveLinks] = useState<NetworkLink[]>([]);

  const handleLoadTopologyFromLab = (devices: NetworkDevice[], links: NetworkLink[]) => {
    setActiveDevices(devices);
    setActiveLinks(links);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 antialiased font-sans">
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickLab={() => setActiveTab('labs')}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5">
        {activeTab === 'dashboard' && (
          <DashboardView onNavigate={(tab) => setActiveTab(tab)} />
        )}

        {activeTab === 'simulator' && (
          <PacketSimulatorWorkspace
            initialDevices={activeDevices}
            initialLinks={activeLinks}
          />
        )}

        {activeTab === 'labs' && (
          <LabsAndTroubleshootView
            onLoadTopology={handleLoadTopologyFromLab}
            onNavigateToSimulator={() => setActiveTab('simulator')}
            currentDevices={activeDevices}
            currentLinks={activeLinks}
          />
        )}

        {activeTab === 'syllabus' && (
          <SyllabusExamGuideView
            onNavigateToTab={(tab) => setActiveTab(tab)}
            onLoadTopology={handleLoadTopologyFromLab}
          />
        )}

        {activeTab === 'visualizers' && (
          <VisualizerHub initialSection="routing" />
        )}

        {activeTab === 'numericals' && (
          <CalculatorsView />
        )}

        {activeTab === 'practice' && (
          <PracticeAndVivaView />
        )}

        {activeTab === 'resources' && (
          <StudyResourcesView />
        )}
      </main>

      {/* Academic Standard Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 px-6 py-4 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300 font-mono">NetLearn</span>
            <span>·</span>
            <span>Computer Networks Educational Workstation</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('simulator')}
              className="hover:text-slate-300 transition-colors"
            >
              Workspace Canvas
            </button>
            <button
              onClick={() => setActiveTab('labs')}
              className="hover:text-slate-300 transition-colors"
            >
              Lab Experiments
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className="hover:text-slate-300 transition-colors"
            >
              Tutorials & Docs
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
