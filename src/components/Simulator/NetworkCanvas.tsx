import React, { useState, useRef } from 'react';
import { 
  Monitor, Laptop, Shuffle, Compass, Server, Radio, Shield, Box,
  Trash2, Settings, Terminal, Cable, ZoomIn, ZoomOut, RotateCcw, Copy,
  FileText, MousePointer, X, Check, MapPin, Building, Server as ServerIcon,
  Printer, Phone
} from 'lucide-react';
import { NetworkDevice, NetworkLink, SimulationStep, DeviceType, CableType } from '../../types/network';

interface NetworkCanvasProps {
  devices: NetworkDevice[];
  links: NetworkLink[];
  onUpdateDevices: (devices: NetworkDevice[]) => void;
  onUpdateLinks: (links: NetworkLink[]) => void;
  selectedDeviceId: string | null;
  onSelectDevice: (id: string | null) => void;
  onOpenDeviceModal: (device: NetworkDevice) => void;
  activeSimulationStep: SimulationStep | null;
  onInspectPacket: () => void;
  selectedCableType: CableType | null;
  onClearCableType: () => void;
}

export const NetworkCanvas: React.FC<NetworkCanvasProps> = ({
  devices,
  links,
  onUpdateDevices,
  onUpdateLinks,
  selectedDeviceId,
  onSelectDevice,
  onOpenDeviceModal,
  activeSimulationStep,
  onInspectPacket,
  selectedCableType,
  onClearCableType,
}) => {
  const [workspaceMode, setWorkspaceMode] = useState<'logical' | 'physical'>('logical');
  const [activeTool, setActiveTool] = useState<'select' | 'delete' | 'note'>('select');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showPortLabels, setShowPortLabels] = useState<boolean>(true);

  // Cable Connection State
  const [pendingCableSource, setPendingCableSource] = useState<{
    deviceId: string;
    portId: string;
    portName: string;
  } | null>(null);

  // Port Selection Dialog State (when clicking device while cable tool is active)
  const [portSelectDevice, setPortSelectDevice] = useState<NetworkDevice | null>(null);

  // Dragging State
  const [draggingDeviceId, setDraggingDeviceId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);

  // Device Icons Map
  const getDeviceIcon = (type: DeviceType) => {
    switch (type) {
      case 'pc': return Monitor;
      case 'laptop': return Laptop;
      case 'switch': return Shuffle;
      case 'router': return Compass;
      case 'server': return Server;
      case 'printer': return Printer;
      case 'ip_phone': return Phone;
      case 'hub': return Box;
      case 'access_point': return Radio;
      case 'firewall': return Shield;
      default: return Monitor;
    }
  };

  // Device Click Handler
  const handleDeviceClick = (e: React.MouseEvent, dev: NetworkDevice) => {
    e.stopPropagation();

    if (activeTool === 'delete') {
      handleDeleteDevice(dev.id);
      return;
    }

    if (selectedCableType) {
      // Open port selection dialog for this device
      setPortSelectDevice(dev);
      return;
    }

    // Normal click opens the authentic Cisco Packet Tracer Device Modal
    onSelectDevice(dev.id);
    onOpenDeviceModal(dev);
  };

  // Dragging Handlers
  const handleMouseDownDevice = (e: React.MouseEvent, dev: NetworkDevice) => {
    if (selectedCableType || activeTool === 'delete') return;
    e.stopPropagation();
    onSelectDevice(dev.id);
    setDraggingDeviceId(dev.id);
    setDragOffset({
      x: e.clientX - dev.x,
      y: e.clientY - dev.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingDeviceId) return;
    const canvasBounds = canvasRef.current?.getBoundingClientRect();
    if (!canvasBounds) return;

    const newX = Math.max(20, Math.min(canvasBounds.width - 80, e.clientX - dragOffset.x));
    const newY = Math.max(20, Math.min(canvasBounds.height - 80, e.clientY - dragOffset.y));

    onUpdateDevices(
      devices.map((d) => (d.id === draggingDeviceId ? { ...d, x: newX, y: newY } : d))
    );
  };

  const handleMouseUp = () => {
    setDraggingDeviceId(null);
  };

  // Port Selection Confirmation (Port Selected for Cable)
  const handleSelectPort = (dev: NetworkDevice, portId: string, portName: string) => {
    setPortSelectDevice(null);

    if (!pendingCableSource) {
      // First endpoint selected
      setPendingCableSource({
        deviceId: dev.id,
        portId,
        portName,
      });
    } else {
      // Second endpoint selected -> Connect Cable
      if (pendingCableSource.deviceId === dev.id) {
        // Cannot connect port on same device
        setPendingCableSource(null);
        return;
      }

      const newLink: NetworkLink = {
        id: `link-${Date.now()}`,
        sourceDeviceId: pendingCableSource.deviceId,
        sourcePortId: pendingCableSource.portId,
        targetDeviceId: dev.id,
        targetPortId: portId,
        cableType: selectedCableType || 'straight',
        status: 'up',
      };

      onUpdateLinks([...links, newLink]);
      setPendingCableSource(null);
      onClearCableType();
    }
  };

  const handleDeleteDevice = (id: string) => {
    onUpdateDevices(devices.filter((d) => d.id !== id));
    onUpdateLinks(links.filter((l) => l.sourceDeviceId !== id && l.targetDeviceId !== id));
    if (selectedDeviceId === id) onSelectDevice(null);
  };

  const handleDeleteLink = (linkId: string) => {
    onUpdateLinks(links.filter((l) => l.id !== linkId));
  };

  const selectedDev = devices.find((d) => d.id === selectedDeviceId);

  // Active packet coordinate calculation
  let packetAnimCoords: { x: number; y: number } | null = null;
  if (activeSimulationStep && activeSimulationStep.fromDeviceId && activeSimulationStep.toDeviceId) {
    const fromDev = devices.find((d) => d.id === activeSimulationStep.fromDeviceId);
    const toDev = devices.find((d) => d.id === activeSimulationStep.toDeviceId);
    if (fromDev && toDev) {
      packetAnimCoords = {
        x: (fromDev.x + toDev.x) / 2 + 28,
        y: (fromDev.y + toDev.y) / 2 + 28,
      };
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-700 rounded-lg overflow-hidden relative shadow-lg">
      
      {/* Top Packet Tracer Workspace Header & Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-slate-950 border-b border-slate-800 text-xs">
        {/* Workspace Mode Tabs: Logical vs Physical */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setWorkspaceMode('logical')}
            className={`px-3 py-1 rounded font-bold transition-all text-xs ${
              workspaceMode === 'logical'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white bg-slate-900'
            }`}
          >
            Logical Workspace
          </button>
          <button
            onClick={() => setWorkspaceMode('physical')}
            className={`px-3 py-1 rounded font-bold transition-all text-xs ${
              workspaceMode === 'physical'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white bg-slate-900'
            }`}
          >
            Physical Workspace
          </button>
        </div>

        {/* Cisco Packet Tracer Secondary Action Tools */}
        <div className="flex items-center gap-2">
          {/* Select Tool */}
          <button
            onClick={() => { setActiveTool('select'); onClearCableType(); }}
            className={`p-1.5 rounded transition-colors ${
              activeTool === 'select' && !selectedCableType
                ? 'bg-slate-800 text-sky-400 border border-slate-600'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Select Tool"
          >
            <MousePointer className="w-4 h-4" />
          </button>

          {/* Delete Tool (X) */}
          <button
            onClick={() => { setActiveTool('delete'); onClearCableType(); }}
            className={`p-1.5 rounded transition-colors ${
              activeTool === 'delete'
                ? 'bg-rose-950 text-rose-400 border border-rose-500'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Delete Tool (Click device or wire to remove)"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-800" />

          {/* Toggle Port Labels */}
          <button
            onClick={() => setShowPortLabels(!showPortLabels)}
            className={`px-2 py-1 rounded text-[11px] font-semibold border ${
              showPortLabels 
                ? 'bg-slate-800 text-sky-300 border-sky-500/40' 
                : 'text-slate-400 border-slate-800 hover:text-white'
            }`}
            title="Toggle Interface Port Labels (Fa0/1, Gi0/0)"
          >
            Ports: {showPortLabels ? 'Show' : 'Hide'}
          </button>

          <div className="h-4 w-px bg-slate-800" />

          {/* Zoom Controls */}
          <button
            onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.1))}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
            title="Reset Zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Selected Cable Indicator Notification */}
      {selectedCableType && (
        <div className="bg-amber-950/90 border-b border-amber-500/50 px-4 py-1.5 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>
              {pendingCableSource
                ? `Cable connected to ${pendingCableSource.portName}. Now click Destination Device to pick port.`
                : `Cable tool active: [${selectedCableType.toUpperCase()}]. Click source device to pick port.`}
            </span>
          </div>
          <button
            onClick={() => {
              onClearCableType();
              setPendingCableSource(null);
            }}
            className="text-amber-400 hover:text-white underline font-semibold"
          >
            Cancel Cable
          </button>
        </div>
      )}

      {/* WORKSPACE VIEW: PHYSICAL OR LOGICAL */}
      {workspaceMode === 'physical' ? (
        /* Physical Workspace View (Corporate Office & Wiring Closet Rack) */
        <div className="w-full h-full min-h-[520px] p-6 bg-slate-950 flex flex-col items-center justify-center text-center">
          <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto">
              <Building className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Physical Workplace - Main Data Center & Wiring Closet</h3>
              <p className="text-xs text-slate-400 mt-1">
                Displays 19-inch standard equipment racks, patch panels, power distribution units (PDU), and structured cabling.
              </p>
            </div>

            {/* Equipment Rack Preview */}
            <div className="p-4 bg-slate-950 border-2 border-slate-700 rounded-lg space-y-2">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest text-left">
                Standard 42U Server Rack (Rack-101)
              </div>
              {devices.map((d) => (
                <div
                  key={d.id}
                  onClick={() => onOpenDeviceModal(d)}
                  className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 hover:border-sky-500 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${d.powerState === 'on' ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                    <span className="font-mono font-bold text-white text-xs">{d.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({d.model || d.type.toUpperCase()})</span>
                  </div>
                  <span className="text-[10px] text-sky-400 font-mono">
                    {d.interfaces[0]?.ip || 'No IP'}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setWorkspaceMode('logical')}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold text-xs transition-colors"
            >
              Switch Back to Logical Diagram
            </button>
          </div>
        </div>
      ) : (
        /* Logical Workspace Canvas Surface */
        <div
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={() => onSelectDevice(null)}
          className={`w-full h-full min-h-[520px] relative select-none bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] overflow-hidden ${
            activeTool === 'delete' ? 'cursor-not-allowed' : selectedCableType ? 'cursor-crosshair' : 'cursor-default'
          }`}
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
        >
          {/* SVG Links Layer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {links.map((link) => {
              const src = devices.find((d) => d.id === link.sourceDeviceId);
              const dst = devices.find((d) => d.id === link.targetDeviceId);
              if (!src || !dst) return null;

              const isLinkActive =
                activeSimulationStep?.linkId === link.id ||
                (activeSimulationStep?.fromDeviceId === src.id && activeSimulationStep?.toDeviceId === dst.id) ||
                (activeSimulationStep?.fromDeviceId === dst.id && activeSimulationStep?.toDeviceId === src.id);

              const x1 = src.x + 28;
              const y1 = src.y + 28;
              const x2 = dst.x + 28;
              const y2 = dst.y + 28;

              // Cable calculations
              const dx = x2 - x1;
              const dy = y2 - y1;
              const dist = Math.hypot(dx, dy) || 1;
              const ux = dx / dist;
              const uy = dy / dist;
              const px = -uy;
              const py = ux;

              const isCrossover = link.cableType === 'crossover';
              const isFiber = link.cableType === 'fiber';
              const isSerial = link.cableType === 'serial';
              const isConsole = link.cableType === 'console';

              let cableStroke = '#334155';
              if (isLinkActive) cableStroke = '#38bdf8';
              else if (isFiber) cableStroke = '#f97316';
              else if (isSerial) cableStroke = '#ef4444';
              else if (isConsole) cableStroke = '#06b6d4';
              else if (link.status === 'down') cableStroke = '#ef4444';

              // Cisco Packet Tracer Link Lights: Green / Amber / Red Triangles pointing to ports
              const srcPort = src.interfaces.find(i => i.id === link.sourcePortId);
              const dstPort = dst.interfaces.find(i => i.id === link.targetPortId);

              const srcUp = src.powerState !== 'off' && srcPort?.status !== 'down' && link.status === 'up';
              const dstUp = dst.powerState !== 'off' && dstPort?.status !== 'down' && link.status === 'up';

              // Source link light coordinates (offset ~36px from device center)
              const sLightX = x1 + ux * 36;
              const sLightY = y1 + uy * 36;
              const sTipX = sLightX - ux * 6;
              const sTipY = sLightY - uy * 6;
              const sBase1X = sLightX + ux * 5 + px * 5;
              const sBase1Y = sLightY + uy * 5 + py * 5;
              const sBase2X = sLightX + ux * 5 - px * 5;
              const sBase2Y = sLightY + uy * 5 - py * 5;

              // Target link light coordinates
              const tLightX = x2 - ux * 36;
              const tLightY = y2 - uy * 36;
              const tTipX = tLightX + ux * 6;
              const tTipY = tLightY + uy * 6;
              const tBase1X = tLightX - ux * 5 + px * 5;
              const tBase1Y = tLightY - uy * 5 + py * 5;
              const tBase2X = tLightX - ux * 5 - px * 5;
              const tBase2Y = tLightY - uy * 5 - py * 5;

              // Serial DCE Clock position
              const dceX = x1 + ux * 52;
              const dceY = y1 + uy * 52;

              return (
                <g key={link.id}>
                  {/* Outer glow when packet active */}
                  {isLinkActive && (
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#38bdf8"
                      strokeWidth={8}
                      strokeOpacity={0.3}
                    />
                  )}

                  {/* Main Cable Line */}
                  {isFiber ? (
                    // Fiber: dual orange strands
                    <>
                      <line
                        x1={x1 + px * 1.5}
                        y1={y1 + py * 1.5}
                        x2={x2 + px * 1.5}
                        y2={y2 + py * 1.5}
                        stroke="#ea580c"
                        strokeWidth={1.8}
                      />
                      <line
                        x1={x1 - px * 1.5}
                        y1={y1 - py * 1.5}
                        x2={x2 - px * 1.5}
                        y2={y2 - py * 1.5}
                        stroke="#f97316"
                        strokeWidth={1.8}
                      />
                    </>
                  ) : (
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={cableStroke}
                      strokeWidth={isLinkActive ? 3.5 : 2.5}
                      strokeDasharray={isCrossover ? '6 4' : ''}
                    />
                  )}

                  {/* Serial DCE Clock Icon on Source Side */}
                  {isSerial && (
                    <g transform={`translate(${dceX}, ${dceY})`}>
                      <circle r="6" fill="#0f172a" stroke="#ef4444" strokeWidth="1.2" />
                      <line x1="0" y1="0" x2="0" y2="-3" stroke="#ef4444" strokeWidth="1" strokeLinecap="round" />
                      <line x1="0" y1="0" x2="2.5" y2="0" stroke="#ef4444" strokeWidth="1" strokeLinecap="round" />
                    </g>
                  )}

                  {/* Invisible thick line for clicking wire with Delete Tool */}
                  {activeTool === 'delete' && (
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="transparent"
                      strokeWidth={16}
                      className="pointer-events-auto cursor-pointer hover:stroke-rose-500/40"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLink(link.id);
                      }}
                    />
                  )}

                  {/* Source Side Cisco Link Light: Directional Triangle pointing to source port */}
                  <polygon
                    points={`${sTipX},${sTipY} ${sBase1X},${sBase1Y} ${sBase2X},${sBase2Y}`}
                    fill={srcUp ? '#10b981' : '#ef4444'}
                    stroke={srcUp ? '#059669' : '#b91c1c'}
                    strokeWidth={0.5}
                  />

                  {/* Target Side Cisco Link Light: Directional Triangle pointing to target port */}
                  <polygon
                    points={`${tTipX},${tTipY} ${tBase1X},${tBase1Y} ${tBase2X},${tBase2Y}`}
                    fill={dstUp ? '#10b981' : '#ef4444'}
                    stroke={dstUp ? '#059669' : '#b91c1c'}
                    strokeWidth={0.5}
                  />

                  {/* Port Labels along wire */}
                  {showPortLabels && (
                    <>
                      <g transform={`translate(${x1 + ux * 68}, ${y1 + uy * 68})`}>
                        <rect x="-16" y="-7" width="32" height="13" rx="2" fill="#020617" fillOpacity="0.85" stroke="#334155" strokeWidth="0.5" />
                        <text
                          x="0"
                          y="2.5"
                          fill="#94a3b8"
                          fontSize="8"
                          fontFamily="monospace"
                          fontWeight="bold"
                          textAnchor="middle"
                          className="select-none"
                        >
                          {srcPort?.name?.replace('FastEthernet', 'Fa')?.replace('GigabitEthernet', 'Gi')?.replace('Serial', 'Se') || 'Fa0'}
                        </text>
                      </g>

                      <g transform={`translate(${x2 - ux * 68}, ${y2 - uy * 68})`}>
                        <rect x="-16" y="-7" width="32" height="13" rx="2" fill="#020617" fillOpacity="0.85" stroke="#334155" strokeWidth="0.5" />
                        <text
                          x="0"
                          y="2.5"
                          fill="#94a3b8"
                          fontSize="8"
                          fontFamily="monospace"
                          fontWeight="bold"
                          textAnchor="middle"
                          className="select-none"
                        >
                          {dstPort?.name?.replace('FastEthernet', 'Fa')?.replace('GigabitEthernet', 'Gi')?.replace('Serial', 'Se') || 'Fa0'}
                        </text>
                      </g>
                    </>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Animated Moving Packet Envelope */}
          {packetAnimCoords && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onInspectPacket();
              }}
              className="absolute z-30 -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 animate-bounce"
              style={{ left: packetAnimCoords.x, top: packetAnimCoords.y }}
              title="Click to Inspect Packet Layers"
            >
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-500 text-white font-mono text-[10px] font-bold shadow-lg shadow-sky-500/50 border border-white/60">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>{activeSimulationStep?.protocol} PACKET</span>
              </div>
            </div>
          )}

          {/* Render Device Nodes */}
          {devices.map((dev) => {
            const Icon = getDeviceIcon(dev.type);
            const isSelected = selectedDeviceId === dev.id;
            const isCableSource = pendingCableSource?.deviceId === dev.id;
            const isPoweredOff = dev.powerState === 'off';
            const firstIp = dev.interfaces[0]?.ip;

            return (
              <div
                key={dev.id}
                onMouseDown={(e) => handleMouseDownDevice(e, dev)}
                onClick={(e) => handleDeviceClick(e, dev)}
                className={`absolute cursor-pointer flex flex-col items-center group transition-shadow select-none ${
                  isSelected ? 'z-20' : 'z-10'
                } ${isPoweredOff ? 'opacity-75' : ''}`}
                style={{ left: dev.x, top: dev.y }}
              >
                {/* Device Chassis Box */}
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center border-2 transition-all relative ${
                    isCableSource
                      ? 'bg-amber-950 border-amber-400 ring-4 ring-amber-400/40 shadow-lg'
                      : isSelected
                      ? 'bg-sky-950 border-sky-400 shadow-xl shadow-sky-500/30 ring-2 ring-sky-500/60'
                      : isPoweredOff
                      ? 'bg-slate-950/90 border-slate-800 shadow-none'
                      : 'bg-slate-950 border-slate-700 hover:border-slate-500 shadow-md'
                  }`}
                >
                  {/* Power status indicator dot */}
                  <div
                    className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${
                      !isPoweredOff ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]' : 'bg-rose-500'
                    }`}
                    title={!isPoweredOff ? 'Power: ON' : 'Power: OFF'}
                  />

                  <Icon
                    className={`w-7 h-7 ${
                      isCableSource
                        ? 'text-amber-400'
                        : isSelected
                        ? 'text-sky-300'
                        : isPoweredOff
                        ? 'text-slate-500'
                        : 'text-slate-300 group-hover:text-white'
                    }`}
                  />
                </div>

                {/* Device Labels (Cisco Packet Tracer Hostname & IP) */}
                <div className="mt-1 text-center font-mono">
                  <div className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors flex items-center justify-center gap-1">
                    <span>{dev.name}</span>
                    {isPoweredOff && (
                      <span className="text-[8px] font-bold text-rose-400 bg-rose-950/90 px-1 py-0.5 rounded border border-rose-800">
                        OFF
                      </span>
                    )}
                  </div>
                  {firstIp && (
                    <div className="text-[10px] text-slate-400 bg-slate-950/90 px-1.5 py-0.5 rounded border border-slate-800">
                      {firstIp}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Port Selection Dialog Popup when Connecting a Wire */}
          {portSelectDevice && (
            <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-slate-900 border-2 border-slate-700 rounded-lg p-4 shadow-2xl max-w-sm w-full space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-white font-sans">
                    Select Port on {portSelectDevice.name}
                  </span>
                  <button
                    onClick={() => setPortSelectDevice(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {portSelectDevice.interfaces.map((iface) => {
                    const isPortInUse = links.some(
                      (l) =>
                        (l.sourceDeviceId === portSelectDevice.id && l.sourcePortId === iface.id) ||
                        (l.targetDeviceId === portSelectDevice.id && l.targetPortId === iface.id)
                    );

                    return (
                      <button
                        key={iface.id}
                        disabled={isPortInUse}
                        onClick={() => handleSelectPort(portSelectDevice, iface.id, iface.name)}
                        className={`w-full flex items-center justify-between p-2 rounded border text-left transition-all ${
                          isPortInUse
                            ? 'bg-slate-950/60 border-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                            : 'bg-slate-950 border-slate-800 hover:border-sky-500 hover:bg-slate-800 text-slate-200'
                        }`}
                      >
                        <span className="font-bold text-sky-400">{iface.name}</span>
                        <span className="text-[10px] text-slate-400">
                          {isPortInUse ? 'Cable Connected' : iface.ip || 'Available'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
