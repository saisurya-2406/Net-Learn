import React, { useState } from 'react';
import { 
  Monitor, Laptop, Shuffle, Compass, Server, Radio, Shield, Box,
  Zap, Cable, Clock, Play, Pause, StepForward, RotateCcw, Filter, Activity,
  Printer, Phone
} from 'lucide-react';
import { DeviceType, CableType } from '../../types/network';

interface PacketTracerBottomBarProps {
  onAddDevice: (type: DeviceType, modelName: string) => void;
  selectedCableType: CableType | null;
  onSelectCableType: (cable: CableType | null) => void;
  isSimulationMode: boolean;
  onToggleSimulationMode: (simMode: boolean) => void;
  isPlayingSim: boolean;
  onTogglePlaySim: () => void;
  onStepForwardSim: () => void;
  onResetSim: () => void;
}

type MainCategory = 'network_devices' | 'end_devices' | 'connections';
type SubCategory = 'routers' | 'switches' | 'hubs' | 'wireless' | 'end_models' | 'cables';

export const PacketTracerBottomBar: React.FC<PacketTracerBottomBarProps> = ({
  onAddDevice,
  selectedCableType,
  onSelectCableType,
  isSimulationMode,
  onToggleSimulationMode,
  isPlayingSim,
  onTogglePlaySim,
  onStepForwardSim,
  onResetSim,
}) => {
  const [mainCat, setMainCat] = useState<MainCategory>('network_devices');
  const [subCat, setSubCat] = useState<SubCategory>('routers');

  return (
    <div className="flex flex-col border border-slate-700 bg-slate-950 rounded-lg shadow-xl overflow-hidden select-none text-xs">
      
      {/* Upper Status / Mode Strip */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px]">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-300 font-mono tracking-wide">
            Cisco Packet Tracer 8.2 Component Box
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">
            {selectedCableType 
              ? `Selected Wire: ${selectedCableType.toUpperCase()} (Click Source Device Port, then Target Device Port)` 
              : 'Click any device icon below to place it onto the workspace'}
          </span>
        </div>

        {/* Realtime vs Simulation Mode Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleSimulationMode(false)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-bold transition-all ${
              !isSimulationMode
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white bg-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Realtime</span>
          </button>

          <button
            onClick={() => onToggleSimulationMode(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-bold transition-all ${
              isSimulationMode
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white bg-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Simulation</span>
          </button>

          {isSimulationMode && (
            <div className="flex items-center gap-1 border-l border-slate-700 pl-2">
              <button
                onClick={onTogglePlaySim}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400"
                title={isPlayingSim ? 'Pause' : 'Play Packet Simulation'}
                aria-label={isPlayingSim ? 'Pause packet simulation' : 'Play packet simulation'}
              >
                {isPlayingSim ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={onStepForwardSim}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400"
                title="Step Forward (Capture / Forward)"
              >
                <StepForward className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onResetSim}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-400"
                title="Reset Simulation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Bottom Device Selector Bar */}
      <div className="flex flex-col md:flex-row items-stretch min-h-[92px]">
        
        {/* Category Icons Left Panel */}
        <div className="flex md:flex-col items-center justify-center p-2 bg-slate-900 border-r border-slate-800 gap-2 shrink-0">
          {/* Network Devices */}
          <button
            onClick={() => {
              setMainCat('network_devices');
              setSubCat('routers');
              onSelectCableType(null);
            }}
            className={`p-2 rounded-lg transition-all ${
              mainCat === 'network_devices'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Network Devices (Routers, Switches, Hubs)"
          >
            <Compass className="w-5 h-5" />
          </button>

          {/* End Devices */}
          <button
            onClick={() => {
              setMainCat('end_devices');
              setSubCat('end_models');
              onSelectCableType(null);
            }}
            className={`p-2 rounded-lg transition-all ${
              mainCat === 'end_devices'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="End Devices (PC, Laptop, Server, Printer)"
          >
            <Monitor className="w-5 h-5" />
          </button>

          {/* Connections (Wires) */}
          <button
            onClick={() => {
              setMainCat('connections');
              setSubCat('cables');
            }}
            className={`p-2 rounded-lg transition-all ${
              mainCat === 'connections'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Connections (Cables & Wires)"
          >
            <Zap className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Category Sub-Row (for Network Devices: Routers, Switches, Hubs) */}
        {mainCat === 'network_devices' && (
          <div className="flex md:flex-col items-center justify-center px-2 py-1 bg-slate-950 border-r border-slate-800/80 gap-1.5 shrink-0 text-[10px]">
            <button
              onClick={() => setSubCat('routers')}
              className={`px-2 py-1 rounded w-full text-left font-semibold ${
                subCat === 'routers' ? 'bg-slate-800 text-sky-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              Routers
            </button>
            <button
              onClick={() => setSubCat('switches')}
              className={`px-2 py-1 rounded w-full text-left font-semibold ${
                subCat === 'switches' ? 'bg-slate-800 text-sky-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              Switches
            </button>
            <button
              onClick={() => setSubCat('hubs')}
              className={`px-2 py-1 rounded w-full text-left font-semibold ${
                subCat === 'hubs' ? 'bg-slate-800 text-sky-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              Hubs
            </button>
            <button
              onClick={() => setSubCat('wireless')}
              className={`px-2 py-1 rounded w-full text-left font-semibold ${
                subCat === 'wireless' ? 'bg-slate-800 text-sky-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              Wireless
            </button>
          </div>
        )}

        {/* Device Models / Cable Items Palette */}
        <div className="flex-1 p-2 flex items-center gap-2 overflow-x-auto bg-slate-900/60">
          
          {/* A. ROUTERS */}
          {mainCat === 'network_devices' && subCat === 'routers' && (
            <>
              <button
                onClick={() => onAddDevice('router', '1941')}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-sky-500 hover:bg-slate-800 text-center w-24 shrink-0 transition-all group"
              >
                <Compass className="w-6 h-6 text-sky-400 group-hover:scale-110 transition-transform mb-1" />
                <span className="font-bold text-white text-[11px]">1941</span>
                <span className="text-[9px] text-slate-500 font-mono">HWIC-2T</span>
              </button>
              <button
                onClick={() => onAddDevice('router', '2911')}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-sky-500 hover:bg-slate-800 text-center w-24 shrink-0 transition-all group"
              >
                <Compass className="w-6 h-6 text-sky-400 group-hover:scale-110 transition-transform mb-1" />
                <span className="font-bold text-white text-[11px]">2911</span>
                <span className="text-[9px] text-slate-500 font-mono">HWIC-2T</span>
              </button>
              <button
                onClick={() => onAddDevice('router', '2811')}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-sky-500 hover:bg-slate-800 text-center w-24 shrink-0 transition-all group"
              >
                <Compass className="w-6 h-6 text-sky-400 group-hover:scale-110 transition-transform mb-1" />
                <span className="font-bold text-white text-[11px]">2811</span>
                <span className="text-[9px] text-slate-500 font-mono">WIC-2T</span>
              </button>
              <button
                onClick={() => onAddDevice('router', '2621XM')}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-sky-500 hover:bg-slate-800 text-center w-24 shrink-0 transition-all group"
              >
                <Compass className="w-6 h-6 text-sky-400 group-hover:scale-110 transition-transform mb-1" />
                <span className="font-bold text-white text-[11px]">2621XM</span>
                <span className="text-[9px] text-slate-500 font-mono">WIC-1T</span>
              </button>
              <button
                onClick={() => onAddDevice('router', 'Router-PT')}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-sky-500 hover:bg-slate-800 text-center w-24 shrink-0 transition-all group"
              >
                <Compass className="w-6 h-6 text-sky-400 group-hover:scale-110 transition-transform mb-1" />
                <span className="font-bold text-white text-[11px]">Router-PT</span>
                <span className="text-[9px] text-slate-500 font-mono">Generic</span>
              </button>
            </>
          )}

          {/* B. SWITCHES */}
          {mainCat === 'network_devices' && subCat === 'switches' && (
            <>
              <button
                onClick={() => onAddDevice('switch', '2960-24TT')}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-sky-500 hover:bg-slate-800 text-center w-24 shrink-0 transition-all group"
              >
                <Shuffle className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform mb-1" />
                <span className="font-bold text-white text-[11px]">2960-24TT</span>
                <span className="text-[9px] text-slate-500 font-mono">Catalyst SW</span>
              </button>
              <button
                onClick={() => onAddDevice('switch', '2950-24')}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-sky-500 hover:bg-slate-800 text-center w-24 shrink-0 transition-all group"
              >
                <Shuffle className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform mb-1" />
                <span className="font-bold text-white text-[11px]">2950-24</span>
                <span className="text-[9px] text-slate-500 font-mono">FastEthernet</span>
              </button>
              <button
                onClick={() => onAddDevice('switch', '3560-24PS')}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-sky-500 hover:bg-slate-800 text-center w-24 shrink-0 transition-all group"
              >
                <Shuffle className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform mb-1" />
                <span className="font-bold text-white text-[11px]">3560-24PS</span>
                <span className="text-[9px] text-slate-500 font-mono">Layer 3 Switch</span>
              </button>
              <button
                onClick={() => onAddDevice('switch', 'Switch-PT')}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-sky-500 hover:bg-slate-800 text-center w-24 shrink-0 transition-all group"
              >
                <Shuffle className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform mb-1" />
                <span className="font-bold text-white text-[11px]">Switch-PT</span>
                <span className="text-[9px] text-slate-500 font-mono">Generic</span>
              </button>
            </>
          )}

          {/* C. HUBS & WIRELESS */}
          {mainCat === 'network_devices' && subCat === 'hubs' && (
            <button
              onClick={() => onAddDevice('hub', 'Hub-PT')}
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-sky-500 hover:bg-slate-800 text-center w-24 shrink-0 transition-all group"
            >
              <Box className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform mb-1" />
              <span className="font-bold text-white text-[11px]">Hub-PT</span>
              <span className="text-[9px] text-slate-500 font-mono">Repeater</span>
            </button>
          )}

          {mainCat === 'network_devices' && subCat === 'wireless' && (
            <button
              onClick={() => onAddDevice('access_point', 'AP-PT')}
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-sky-500 hover:bg-slate-800 text-center w-24 shrink-0 transition-all group"
            >
              <Radio className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform mb-1" />
              <span className="font-bold text-white text-[11px]">AP-PT</span>
              <span className="text-[9px] text-slate-500 font-mono">Access Point</span>
            </button>
          )}

          {/* D. END DEVICES */}
          {mainCat === 'end_devices' && (
            <>
              <button
                onClick={() => onAddDevice('pc', 'PC-PT')}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-sky-500 hover:bg-slate-800 text-center w-24 shrink-0 transition-all group"
              >
                <Monitor className="w-6 h-6 text-sky-300 group-hover:scale-110 transition-transform mb-1" />
                <span className="font-bold text-white text-[11px]">PC-PT</span>
                <span className="text-[9px] text-slate-500 font-mono">Standard PC</span>
              </button>
              <button
                onClick={() => onAddDevice('laptop', 'Laptop-PT')}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-sky-500 hover:bg-slate-800 text-center w-24 shrink-0 transition-all group"
              >
                <Laptop className="w-6 h-6 text-sky-300 group-hover:scale-110 transition-transform mb-1" />
                <span className="font-bold text-white text-[11px]">Laptop-PT</span>
                <span className="text-[9px] text-slate-500 font-mono">Notebook</span>
              </button>
              <button
                onClick={() => onAddDevice('server', 'Server-PT')}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-sky-500 hover:bg-slate-800 text-center w-24 shrink-0 transition-all group"
              >
                <Server className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform mb-1" />
                <span className="font-bold text-white text-[11px]">Server-PT</span>
                <span className="text-[9px] text-slate-500 font-mono">HTTP/DHCP/DNS</span>
              </button>
              <button
                onClick={() => onAddDevice('printer', 'Printer-PT')}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-sky-500 hover:bg-slate-800 text-center w-24 shrink-0 transition-all group"
              >
                <Printer className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform mb-1" />
                <span className="font-bold text-white text-[11px]">Printer-PT</span>
                <span className="text-[9px] text-slate-500 font-mono">Network Print</span>
              </button>
              <button
                onClick={() => onAddDevice('ip_phone', 'IP-Phone-PT')}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-sky-500 hover:bg-slate-800 text-center w-24 shrink-0 transition-all group"
              >
                <Phone className="w-6 h-6 text-sky-400 group-hover:scale-110 transition-transform mb-1" />
                <span className="font-bold text-white text-[11px]">IP-Phone</span>
                <span className="text-[9px] text-slate-500 font-mono">VoIP Terminal</span>
              </button>
            </>
          )}

          {/* E. CONNECTIONS (WIRES & CABLES) */}
          {mainCat === 'connections' && (
            <>
              {/* Automatically Choose Connection Type (Lightning) */}
              <button
                onClick={() => onSelectCableType(selectedCableType === 'auto' ? null : 'auto')}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center w-24 shrink-0 transition-all group ${
                  selectedCableType === 'auto'
                    ? 'bg-amber-950 border-amber-400 text-amber-300 shadow-md ring-1 ring-amber-400'
                    : 'bg-slate-950 border-slate-800 hover:border-amber-500 text-slate-300'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500 flex items-center justify-center mb-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <span className="font-bold text-[10px] leading-tight">Automatically Choose</span>
                <span className="text-[8px] text-slate-500">Auto Wire</span>
              </button>

              {/* Copper Straight-Through (Solid black wire) */}
              <button
                onClick={() => onSelectCableType(selectedCableType === 'straight' ? null : 'straight')}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center w-24 shrink-0 transition-all group ${
                  selectedCableType === 'straight'
                    ? 'bg-sky-950 border-sky-400 text-sky-300 shadow-md ring-1 ring-sky-400'
                    : 'bg-slate-950 border-slate-800 hover:border-sky-500 text-slate-300'
                }`}
              >
                <div className="w-8 h-1 bg-slate-300 my-2.5 rounded-full" />
                <span className="font-bold text-[10px] leading-tight">Copper Straight-Through</span>
                <span className="text-[8px] text-slate-500">PC to Switch</span>
              </button>

              {/* Copper Cross-Over (Dashed black wire) */}
              <button
                onClick={() => onSelectCableType(selectedCableType === 'crossover' ? null : 'crossover')}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center w-24 shrink-0 transition-all group ${
                  selectedCableType === 'crossover'
                    ? 'bg-sky-950 border-sky-400 text-sky-300 shadow-md ring-1 ring-sky-400'
                    : 'bg-slate-950 border-slate-800 hover:border-sky-500 text-slate-300'
                }`}
              >
                <div className="w-8 h-1 border-t-2 border-dashed border-slate-300 my-2.5" />
                <span className="font-bold text-[10px] leading-tight">Copper Cross-Over</span>
                <span className="text-[8px] text-slate-500">PC to PC / SW-SW</span>
              </button>

              {/* Fiber (Orange wire) */}
              <button
                onClick={() => onSelectCableType(selectedCableType === 'fiber' ? null : 'fiber')}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center w-24 shrink-0 transition-all group ${
                  selectedCableType === 'fiber'
                    ? 'bg-orange-950 border-orange-400 text-orange-300 shadow-md ring-1 ring-orange-400'
                    : 'bg-slate-950 border-slate-800 hover:border-orange-500 text-slate-300'
                }`}
              >
                <div className="w-8 h-1 bg-orange-500 my-2.5 rounded-full" />
                <span className="font-bold text-[10px] leading-tight">Fiber Optic</span>
                <span className="text-[8px] text-slate-500">High Speed Link</span>
              </button>

              {/* Serial DCE (Red wire with Clock) */}
              <button
                onClick={() => onSelectCableType(selectedCableType === 'serial' ? null : 'serial')}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center w-24 shrink-0 transition-all group ${
                  selectedCableType === 'serial'
                    ? 'bg-rose-950 border-rose-400 text-rose-300 shadow-md ring-1 ring-rose-400'
                    : 'bg-slate-950 border-slate-800 hover:border-rose-500 text-slate-300'
                }`}
              >
                <div className="w-8 h-1 bg-rose-500 my-2.5 rounded-full" />
                <span className="font-bold text-[10px] leading-tight">Serial DCE</span>
                <span className="text-[8px] text-slate-500">Clock Rate Link</span>
              </button>

              {/* Serial DTE (Red wire) */}
              <button
                onClick={() => onSelectCableType(selectedCableType === 'serial' ? null : 'serial')}
                className="flex flex-col items-center justify-center p-2 rounded-lg border text-center w-24 shrink-0 transition-all bg-slate-950 border-slate-800 hover:border-rose-500 text-slate-300"
              >
                <div className="w-8 h-1 bg-rose-400 my-2.5 rounded-full" />
                <span className="font-bold text-[10px] leading-tight">Serial DTE</span>
                <span className="text-[8px] text-slate-500">Router to Router</span>
              </button>

              {/* Console Cable (Light blue wire) */}
              <button onClick={() => onSelectCableType(selectedCableType === 'wireless' ? null : 'wireless')} className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center w-24 shrink-0 transition-all ${selectedCableType === 'wireless' ? 'bg-violet-950 border-violet-400 text-violet-300 shadow-md ring-1 ring-violet-400' : 'bg-slate-950 border-slate-800 hover:border-violet-500 text-slate-300'}`}>
                <div className="w-8 h-1 border-t-2 border-dashed border-violet-400 my-2.5" /><span className="font-bold text-[10px] leading-tight">Wireless</span><span className="text-[8px] text-slate-500">AP to Wi-Fi client</span>
              </button>

              {/* Console Cable (Light blue wire) */}
              <button
                onClick={() => onSelectCableType(selectedCableType === 'console' ? null : 'console')}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center w-24 shrink-0 transition-all group ${
                  selectedCableType === 'console'
                    ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-md ring-1 ring-cyan-400'
                    : 'bg-slate-950 border-slate-800 hover:border-cyan-500 text-slate-300'
                }`}
              >
                <div className="w-8 h-1 bg-cyan-400 my-2.5 rounded-full" />
                <span className="font-bold text-[10px] leading-tight">Console</span>
                <span className="text-[8px] text-slate-500">RS-232 to Console</span>
              </button>
            </>
          )}

        </div>

      </div>
    </div>
  );
};
