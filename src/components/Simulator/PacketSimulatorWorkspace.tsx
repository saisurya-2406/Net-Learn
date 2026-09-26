import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, StepForward, RotateCcw, HelpCircle, FileText, 
  Download, Upload, Sparkles, Send, ShieldAlert, Check, FastForward,
  FolderOpen, Save, RefreshCw, Layers, ChevronDown, BookOpen, Monitor,
  Compass, Shuffle, Terminal, Info, X, Cable
} from 'lucide-react';
import { NetworkDevice, NetworkLink, SimulationStep, DeviceType, CableType } from '../../types/network';
import { ACADEMIC_EXPERIMENTS } from '../../data/labData';
import { NetworkCanvas } from './NetworkCanvas';
import { PacketTracerBottomBar } from './PacketTracerBottomBar';
import { CiscoDeviceModal } from './CiscoDeviceModal';
import { PacketInspector } from './PacketInspector';
import { generateSimulationTrace } from '../../utils/simulationEngine';

// Default standard topology: PC0 -> Switch0 -> Router0 -> Server0
const DEFAULT_DEVICES: NetworkDevice[] = [
  {
    id: 'dev-pc0',
    name: 'PC0',
    type: 'pc',
    model: 'PC-PT',
    x: 100,
    y: 120,
    powerState: 'on',
    interfaces: [
      { id: 'pc0-fa0', name: 'FastEthernet0', ip: '192.168.1.10', subnetMask: '255.255.255.0', mac: '00:01:42:AA:00:10', status: 'up' },
    ],
    defaultGateway: '192.168.1.1',
    dnsServer: '192.168.2.100',
    configMode: 'static',
  },
  {
    id: 'dev-pc1',
    name: 'PC1',
    type: 'pc',
    model: 'PC-PT',
    x: 100,
    y: 300,
    powerState: 'on',
    interfaces: [
      { id: 'pc1-fa0', name: 'FastEthernet0', ip: '192.168.1.20', subnetMask: '255.255.255.0', mac: '00:01:42:AA:00:20', status: 'up' },
    ],
    defaultGateway: '192.168.1.1',
    dnsServer: '192.168.2.100',
    configMode: 'static',
  },
  {
    id: 'dev-sw0',
    name: 'Switch0',
    type: 'switch',
    model: '2960-24TT',
    x: 280,
    y: 210,
    powerState: 'on',
    macTable: [
      { mac: '00:01:42:AA:00:10', port: 'FastEthernet0/1', vlan: 1, type: 'DYNAMIC' },
      { mac: '00:01:42:AA:00:20', port: 'FastEthernet0/2', vlan: 1, type: 'DYNAMIC' },
    ],
    interfaces: [
      { id: 'sw0-fa1', name: 'FastEthernet0/1', mac: '00:SW:01:00:00:01', status: 'up' },
      { id: 'sw0-fa2', name: 'FastEthernet0/2', mac: '00:SW:01:00:00:02', status: 'up' },
      { id: 'sw0-fa3', name: 'FastEthernet0/3', mac: '00:SW:01:00:00:03', status: 'up' },
      { id: 'sw0-fa4', name: 'FastEthernet0/4', mac: '00:SW:01:00:00:04', status: 'up' },
      { id: 'sw0-gi1', name: 'GigabitEthernet0/1', mac: '00:SW:01:00:00:05', status: 'up' },
    ],
  },
  {
    id: 'dev-r0',
    name: 'Router0',
    type: 'router',
    model: '2911',
    x: 480,
    y: 210,
    powerState: 'on',
    interfaces: [
      { id: 'r0-gi0', name: 'GigabitEthernet0/0', ip: '192.168.1.1', subnetMask: '255.255.255.0', mac: '00:RR:01:00:00:01', status: 'up' },
      { id: 'r0-gi1', name: 'GigabitEthernet0/1', ip: '192.168.2.1', subnetMask: '255.255.255.0', mac: '00:RR:01:00:00:02', status: 'up' },
    ],
    routingTable: [
      { id: 'r-1', destinationNetwork: '192.168.1.0', subnetMask: '255.255.255.0', nextHop: 'Directly Connected', interfaceName: 'Gi0/0' },
      { id: 'r-2', destinationNetwork: '192.168.2.0', subnetMask: '255.255.255.0', nextHop: 'Directly Connected', interfaceName: 'Gi0/1' },
    ],
  },
  {
    id: 'dev-srv0',
    name: 'Server0',
    type: 'server',
    model: 'Server-PT',
    x: 680,
    y: 210,
    powerState: 'on',
    interfaces: [
      { id: 'srv0-fa0', name: 'FastEthernet0', ip: '192.168.2.100', subnetMask: '255.255.255.0', mac: '00:EE:EE:00:01:00', status: 'up' },
    ],
    defaultGateway: '192.168.2.1',
    serverServices: {
      httpEnabled: true,
      httpContent: `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
          <h1 style="color: #0284c7;">Welcome to Cisco Packet Tracer Web Server</h1>
          <p>Congratulations! Your end-to-end routing, DNS, and HTTP traffic is functioning successfully.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
          <p style="font-size: 13px; color: #64748b;">Server-PT (192.168.2.100) running Apache HTTP Service</p>
        </div>
      `,
      dnsEnabled: true,
      dnsRecords: [
        { domain: 'www.cisco.lab', ip: '192.168.2.100', type: 'A' },
        { domain: 'netlearn.local', ip: '192.168.2.100', type: 'A' }
      ],
      dhcpEnabled: true,
      dhcpPool: {
        poolName: 'LAN-POOL',
        startIp: '192.168.1.100',
        endIp: '192.168.1.200',
        subnetMask: '255.255.255.0',
        gateway: '192.168.1.1',
        dnsServer: '192.168.2.100',
      },
    },
    configMode: 'static',
  },
];

const DEFAULT_LINKS: NetworkLink[] = [
  { id: 'l1', sourceDeviceId: 'dev-pc0', sourcePortId: 'pc0-fa0', targetDeviceId: 'dev-sw0', targetPortId: 'sw0-fa1', cableType: 'straight', status: 'up' },
  { id: 'l2', sourceDeviceId: 'dev-pc1', sourcePortId: 'pc1-fa0', targetDeviceId: 'dev-sw0', targetPortId: 'sw0-fa2', cableType: 'straight', status: 'up' },
  { id: 'l3', sourceDeviceId: 'dev-sw0', sourcePortId: 'sw0-fa3', targetDeviceId: 'dev-r0', targetPortId: 'r0-gi0', cableType: 'straight', status: 'up' },
  { id: 'l4', sourceDeviceId: 'dev-r0', sourcePortId: 'r0-gi1', targetDeviceId: 'dev-srv0', targetPortId: 'srv0-fa0', cableType: 'straight', status: 'up' },
];

interface PacketSimulatorWorkspaceProps {
  initialDevices?: NetworkDevice[];
  initialLinks?: NetworkLink[];
}

export const PacketSimulatorWorkspace: React.FC<PacketSimulatorWorkspaceProps> = ({
  initialDevices,
  initialLinks,
}) => {
  const [devices, setDevices] = useState<NetworkDevice[]>(initialDevices && initialDevices.length > 0 ? initialDevices : DEFAULT_DEVICES);
  const [links, setLinks] = useState<NetworkLink[]>(initialLinks && initialLinks.length > 0 ? initialLinks : DEFAULT_LINKS);
  
  // Selected device
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  // Active Device Modal for Cisco Packet Tracer dialog
  const [activeModalDevice, setActiveModalDevice] = useState<NetworkDevice | null>(null);

  // Cable tool
  const [selectedCableType, setSelectedCableType] = useState<CableType | null>(null);

  // Simulation Mode Controls
  const [isSimulationMode, setIsSimulationMode] = useState<boolean>(false);
  const [srcDeviceId, setSrcDeviceId] = useState<string>('dev-pc0');
  const [dstDeviceId, setDstDeviceId] = useState<string>('dev-srv0');
  const [protocol, setProtocol] = useState<'ICMP' | 'HTTP' | 'DNS' | 'ARP'>('ICMP');
  const [simulationSteps, setSimulationSteps] = useState<SimulationStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [isPlayingSim, setIsPlayingSim] = useState<boolean>(false);

  // Packet Inspector Modal
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);

  // File Menu and Help Modal States
  const [isFileMenuOpen, setIsFileMenuOpen] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
  const [isOpenPrebuiltModalOpen, setIsOpenPrebuiltModalOpen] = useState<boolean>(false);
  const [activePrebuiltTab, setActivePrebuiltTab] = useState<'experiments' | 'classic' | 'upload'>('experiments');
  const fileMenuRef = useRef<HTMLDivElement>(null);

  // Close file menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(e.target as Node)) {
        setIsFileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync external topology changes (from Labs)
  useEffect(() => {
    if (initialDevices && initialDevices.length > 0) {
      setDevices(initialDevices);
      setSelectedDeviceId(null);
    }
  }, [initialDevices]);

  useEffect(() => {
    if (initialLinks && initialLinks.length > 0) {
      setLinks(initialLinks);
    }
  }, [initialLinks]);

  // Load a Prebuilt Lab Topology
  const handleLoadPrebuilt = (labDevices: NetworkDevice[], labLinks: NetworkLink[]) => {
    setDevices(labDevices);
    setLinks(labLinks);
    setSelectedDeviceId(null);
    handleResetSimulation();
    setIsOpenPrebuiltModalOpen(false);
    setIsFileMenuOpen(false);
  };

  // Clear to new blank workspace
  const handleNewBlankWorkspace = () => {
    setDevices([]);
    setLinks([]);
    setSelectedDeviceId(null);
    handleResetSimulation();
    setIsFileMenuOpen(false);
  };

  // Export Cisco IOS Running-Config Script
  const handleExportCiscoConfig = () => {
    let script = `! ========================================================\n`;
    script += `! Cisco Packet Tracer Exported Running-Configuration\n`;
    script += `! Generated on: ${new Date().toLocaleString()}\n`;
    script += `! ========================================================\n\n`;

    devices.forEach((dev) => {
      if (dev.type === 'router' || dev.type === 'switch') {
        script += `!\n! --------------------------------------------------------\n`;
        script += `! Hostname: ${dev.name} (${dev.model || dev.type.toUpperCase()})\n`;
        script += `! --------------------------------------------------------\n`;
        script += `hostname ${dev.name}\n!\n`;
        dev.interfaces.forEach((iface) => {
          script += `interface ${iface.name}\n`;
          if (iface.ip && iface.subnetMask) {
            script += ` ip address ${iface.ip} ${iface.subnetMask}\n`;
          }
          if (iface.status === 'up') {
            script += ` no shutdown\n`;
          } else {
            script += ` shutdown\n`;
          }
          script += `!\n`;
        });

        if (dev.routingTable && dev.routingTable.length > 0) {
          dev.routingTable.forEach((rt) => {
            if (rt.nextHop !== 'Directly Connected') {
              script += `ip route ${rt.destinationNetwork} ${rt.subnetMask} ${rt.nextHop}\n`;
            }
          });
          script += `!\n`;
        }
        script += `end\n\n`;
      }
    });

    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cisco-ios-running-config-${Date.now()}.cfg`;
    a.click();
    setIsFileMenuOpen(false);
  };

  // Spawn new device from bottom bar
  const handleAddDevice = (type: DeviceType, modelName: string) => {
    const id = `dev-${Date.now()}`;
    const count = devices.filter((d) => d.type === type).length;
    const name = `${type === 'pc' ? 'PC' : type === 'laptop' ? 'Laptop' : type === 'router' ? 'Router' : type === 'switch' ? 'Switch' : 'Server'}${count}`;
    
    // Default interfaces based on device model
    let ifaces = [];
    if (type === 'pc' || type === 'laptop' || type === 'printer' || type === 'ip_phone') {
      ifaces = [
        { id: `${id}-fa0`, name: 'FastEthernet0', ip: `192.168.1.${50 + count}`, subnetMask: '255.255.255.0', mac: `00:01:42:${Math.floor(Math.random() * 89 + 10)}:00:${Math.floor(Math.random() * 89 + 10)}`, status: 'up' as const },
      ];
    } else if (type === 'switch') {
      ifaces = [
        { id: `${id}-fa1`, name: 'FastEthernet0/1', mac: `00:SW:01:00:00:01`, status: 'up' as const },
        { id: `${id}-fa2`, name: 'FastEthernet0/2', mac: `00:SW:01:00:00:02`, status: 'up' as const },
        { id: `${id}-fa3`, name: 'FastEthernet0/3', mac: `00:SW:01:00:00:03`, status: 'up' as const },
        { id: `${id}-gi1`, name: 'GigabitEthernet0/1', mac: `00:SW:01:00:00:04`, status: 'up' as const },
      ];
    } else if (type === 'router') {
      ifaces = [
        { id: `${id}-gi0`, name: 'GigabitEthernet0/0', ip: `192.168.${count + 1}.1`, subnetMask: '255.255.255.0', mac: `00:RR:01:00:00:0${count + 1}`, status: 'up' as const },
        { id: `${id}-gi1`, name: 'GigabitEthernet0/1', ip: `10.0.${count}.1`, subnetMask: '255.255.255.252', mac: `00:RR:01:00:00:1${count + 1}`, status: 'up' as const },
        { id: `${id}-se0`, name: 'Serial0/0/0', ip: `10.1.${count}.1`, subnetMask: '255.255.255.252', mac: `00:SE:01:00:00:0${count + 1}`, status: 'up' as const, clockRate: 64000 },
        { id: `${id}-se1`, name: 'Serial0/0/1', mac: `00:SE:01:00:00:1${count + 1}`, status: 'down' as const },
        { id: `${id}-con`, name: 'Console', mac: `00:CN:01:00:00:01`, status: 'up' as const, isConsole: true },
      ];
    } else {
      ifaces = [
        { id: `${id}-fa0`, name: 'FastEthernet0', ip: '192.168.2.150', subnetMask: '255.255.255.0', mac: `00:EE:01:00:00:01`, status: 'up' as const },
      ];
    }

    const newDev: NetworkDevice = {
      id,
      name,
      type,
      model: modelName,
      x: 180 + Math.random() * 200,
      y: 140 + Math.random() * 150,
      powerState: 'on',
      interfaces: ifaces,
      defaultGateway: type === 'pc' || type === 'laptop' ? '192.168.1.1' : undefined,
      dnsServer: '192.168.2.100',
      configMode: 'static',
    };

    setDevices([...devices, newDev]);
    setSelectedDeviceId(id);
  };

  // Launch Packet Simulation
  const handleStartSimulation = () => {
    const trace = generateSimulationTrace(devices, links, srcDeviceId, dstDeviceId, protocol);
    setSimulationSteps(trace);
    setCurrentStepIndex(0);
    setIsSimulationMode(true);
    setIsPlayingSim(false);
  };

  const handleStepForward = () => {
    if (simulationSteps.length === 0) {
      handleStartSimulation();
      return;
    }
    if (currentStepIndex < simulationSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handleResetSimulation = () => {
    setIsPlayingSim(false);
    setCurrentStepIndex(-1);
    setSimulationSteps([]);
  };

  // Auto-play timer for simulation mode
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isPlayingSim) {
      timer = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev < simulationSteps.length - 1) {
            return prev + 1;
          } else {
            setIsPlayingSim(false);
            return prev;
          }
        });
      }, 1500);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlayingSim, simulationSteps]);

  const activeStep =
    currentStepIndex >= 0 && currentStepIndex < simulationSteps.length
      ? simulationSteps[currentStepIndex]
      : null;

  // Export Topology
  const handleExportTopology = () => {
    const data = JSON.stringify({ devices, links, version: 'Cisco-PT-8.2' }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cisco-packet-tracer-${Date.now()}.pkt.json`;
    a.click();
  };

  // Import Topology
  const handleImportTopology = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.devices && parsed.links) {
          setDevices(parsed.devices);
          setLinks(parsed.links);
          handleResetSimulation();
        }
      } catch {
        alert('Invalid topology file.');
      }
    };
    reader.readAsText(file);
  };

  // Fast Forward Time (like Cisco Packet Tracer fast forward time 30s)
  const handleFastForwardTime = () => {
    setLinks(links.map(l => ({ ...l, status: 'up' })));
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Cisco Packet Tracer Top Menu Strip */}
      <div className="flex flex-wrap items-center justify-between px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-bold text-white tracking-wide">
            <span className="w-2.5 h-2.5 rounded bg-sky-500 shadow-[0_0_8px_#0284c7]" />
            <span>Cisco Packet Tracer</span>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-slate-400 font-medium text-[11px] relative">
            {/* File Menu Dropdown */}
            <div className="relative" ref={fileMenuRef}>
              <button
                onClick={() => setIsFileMenuOpen(!isFileMenuOpen)}
                className="hover:text-white cursor-pointer flex items-center gap-0.5 focus:outline-none"
              >
                <span>File</span>
                <ChevronDown className="w-2.5 h-2.5 text-slate-500" />
              </button>

              {isFileMenuOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-56 bg-slate-900 border border-slate-700 rounded-md shadow-2xl py-1 z-50 animate-in fade-in">
                  <button
                    onClick={handleNewBlankWorkspace}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>New Blank Canvas</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsOpenPrebuiltModalOpen(true);
                      setIsFileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-2"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
                    <span>Open Lab Topology...</span>
                  </button>

                  <label className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2 cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-slate-400" />
                    <span>Import .PKT (JSON)...</span>
                    <input type="file" accept=".json" onChange={handleImportTopology} className="hidden" />
                  </label>

                  <div className="h-px bg-slate-800 my-1" />

                  <button
                    onClick={handleExportTopology}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2"
                  >
                    <Save className="w-3.5 h-3.5 text-slate-400" />
                    <span>Save / Export .PKT (JSON)</span>
                  </button>

                  <button
                    onClick={handleExportCiscoConfig}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-2"
                  >
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Export Cisco IOS Config (.cfg)</span>
                  </button>

                  <div className="h-px bg-slate-800 my-1" />

                  <button
                    onClick={() => {
                      setDevices(DEFAULT_DEVICES);
                      setLinks(DEFAULT_LINKS);
                      handleResetSimulation();
                      setIsFileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-rose-400 hover:text-rose-300 flex items-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-rose-400" />
                    <span>Reset Default Topology</span>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsOpenPrebuiltModalOpen(true)}
              className="hover:text-white cursor-pointer"
            >
              Open
            </button>
            <span className="hover:text-white cursor-pointer" onClick={handleExportTopology}>Save</span>
            <span className="hover:text-white cursor-pointer" onClick={() => setIsSimulationMode(!isSimulationMode)}>Simulation</span>
            <button
              onClick={() => setIsHelpModalOpen(true)}
              className="hover:text-sky-400 cursor-pointer flex items-center gap-1 text-slate-300 font-semibold"
            >
              <HelpCircle className="w-3 h-3 text-sky-400" />
              <span>Help</span>
            </button>
          </div>
        </div>

        {/* Quick Toolbar Actions */}
        <div className="flex items-center gap-2">
          {/* Fast Forward Time Button (Iconic PT feature!) */}
          <button
            onClick={handleFastForwardTime}
            className="flex items-center gap-1 px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-amber-300 font-bold text-[11px] transition-colors"
            title="Fast Forward Time (30 Seconds) - Skip STP Convergence"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Fast Forward Time</span>
          </button>

          <button
            onClick={() => setIsOpenPrebuiltModalOpen(true)}
            className="flex items-center gap-1 px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-slate-300 text-[11px] font-medium transition-colors"
          >
            <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline">Open Lab / .PKT</span>
          </button>

          <button
            onClick={handleExportTopology}
            className="flex items-center gap-1 px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-slate-300 text-[11px] font-medium transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Save</span>
          </button>

          <button
            onClick={() => {
              setDevices(DEFAULT_DEVICES);
              setLinks(DEFAULT_LINKS);
              handleResetSimulation();
            }}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
            title="Reset Default Topology"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Simulation Setup Bar (When in Simulation Mode or testing Packet Flow) */}
      {isSimulationMode && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/90 border border-slate-800 rounded-lg text-xs animate-in fade-in">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Source:</span>
              <select
                value={srcDeviceId}
                onChange={(e) => setSrcDeviceId(e.target.value)}
                className="px-2 py-1 bg-slate-950 border border-slate-700 rounded text-white font-mono font-bold"
              >
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.interfaces[0]?.ip || 'No IP'})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Destination:</span>
              <select
                value={dstDeviceId}
                onChange={(e) => setDstDeviceId(e.target.value)}
                className="px-2 py-1 bg-slate-950 border border-slate-700 rounded text-white font-mono font-bold"
              >
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.interfaces[0]?.ip || 'No IP'})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Protocol:</span>
              <select
                value={protocol}
                onChange={(e) => setProtocol(e.target.value as any)}
                className="px-2 py-1 bg-slate-950 border border-slate-700 rounded text-white font-bold"
              >
                <option value="ICMP">ICMP (Ping)</option>
                <option value="HTTP">HTTP (Web)</option>
                <option value="DNS">DNS Query</option>
                <option value="ARP">ARP Broadcast</option>
              </select>
            </div>

            <button
              onClick={handleStartSimulation}
              className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded font-bold transition-all shadow-sm"
            >
              Generate Simulation
            </button>
          </div>

          {/* Stepper info */}
          {activeStep && (
            <div className="flex items-center gap-3">
              <span className="font-mono text-slate-300">
                Step <strong className="text-white">{activeStep.stepIndex + 1}</strong> of{' '}
                <strong className="text-white">{activeStep.totalSteps}</strong>
              </span>

              <button
                onClick={() => setIsInspectorOpen(true)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-400 rounded font-medium transition-colors"
              >
                Inspect Packet Headers
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Interactive Workspace Canvas */}
      <div className="h-[520px]">
        <NetworkCanvas
          devices={devices}
          links={links}
          onUpdateDevices={setDevices}
          onUpdateLinks={setLinks}
          selectedDeviceId={selectedDeviceId}
          onSelectDevice={setSelectedDeviceId}
          onOpenDeviceModal={(dev) => setActiveModalDevice(dev)}
          activeSimulationStep={activeStep}
          onInspectPacket={() => setIsInspectorOpen(true)}
          selectedCableType={selectedCableType}
          onClearCableType={() => setSelectedCableType(null)}
        />
      </div>

      {/* Cisco Packet Tracer Bottom Component & Cable Palette */}
      <PacketTracerBottomBar
        onAddDevice={handleAddDevice}
        selectedCableType={selectedCableType}
        onSelectCableType={setSelectedCableType}
        isSimulationMode={isSimulationMode}
        onToggleSimulationMode={setIsSimulationMode}
        isPlayingSim={isPlayingSim}
        onTogglePlaySim={() => setIsPlayingSim(!isPlayingSim)}
        onStepForwardSim={handleStepForward}
        onResetSim={handleResetSimulation}
      />

      {/* Authentic Cisco Device Dialog Modal (Physical, Config, Desktop with CMD/IPConfig, or Cisco IOS CLI) */}
      {activeModalDevice && (
        <CiscoDeviceModal
          device={activeModalDevice}
          allDevices={devices}
          allLinks={links}
          isOpen={!!activeModalDevice}
          onClose={() => setActiveModalDevice(null)}
          onSaveDevice={(updated) => {
            setDevices(devices.map((d) => (d.id === updated.id ? updated : d)));
            setActiveModalDevice(updated);
          }}
        />
      )}

      {/* Packet Inspector (Wireshark-like multi-layer header dissection) */}
      <PacketInspector
        step={activeStep}
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
      />

      {/* Prebuilt Labs & Topology Loader Modal */}
      {isOpenPrebuiltModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="flex flex-col w-full max-w-3xl bg-slate-900 border-2 border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <FolderOpen className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-white text-sm">
                  Open Cisco Packet Tracer Topology (.PKT)
                </h3>
              </div>
              <button
                onClick={() => setIsOpenPrebuiltModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 px-5 pt-3 bg-slate-950/60 border-b border-slate-800 text-xs font-semibold">
              <button
                onClick={() => setActivePrebuiltTab('experiments')}
                className={`px-3 py-2 border-b-2 transition-colors ${
                  activePrebuiltTab === 'experiments'
                    ? 'border-sky-400 text-sky-400 font-bold'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                12 Academic Experiments
              </button>
              <button
                onClick={() => setActivePrebuiltTab('classic')}
                className={`px-3 py-2 border-b-2 transition-colors ${
                  activePrebuiltTab === 'classic'
                    ? 'border-sky-400 text-sky-400 font-bold'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Classic Network Topologies
              </button>
              <button
                onClick={() => setActivePrebuiltTab('upload')}
                className={`px-3 py-2 border-b-2 transition-colors ${
                  activePrebuiltTab === 'upload'
                    ? 'border-sky-400 text-sky-400 font-bold'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Open Local .PKT File
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-5 text-xs">
              {activePrebuiltTab === 'experiments' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {ACADEMIC_EXPERIMENTS.map((exp) => (
                    <div
                      key={exp.id}
                      className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-sky-500/60 transition-all flex flex-col justify-between gap-3 group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-950 text-sky-400 border border-sky-800">
                            EXP {exp.number}
                          </span>
                          <span className="text-[10px] text-slate-500 uppercase font-mono">
                            {exp.category}
                          </span>
                        </div>
                        <h4 className="font-bold text-white text-xs group-hover:text-sky-300 transition-colors">
                          {exp.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                          {exp.aim}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-[11px]">
                        <span className="text-slate-500 font-mono">
                          {exp.initialTopology.devices.length} Devices · {exp.initialTopology.links.length} Links
                        </span>
                        <button
                          onClick={() => handleLoadPrebuilt(exp.initialTopology.devices, exp.initialTopology.links)}
                          className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          <Play className="w-3 h-3" />
                          <span>Load Lab</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activePrebuiltTab === 'classic' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Default Standard Lab */}
                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between gap-3">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                        Default Setup
                      </span>
                      <h4 className="font-bold text-white text-xs mt-1.5">
                        Standard Campus Network (PC0, PC1, Switch0, Router0, Server0)
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1">
                        End-to-end IP network with configured gateway, DNS, and HTTP web server.
                      </p>
                    </div>
                    <button
                      onClick={() => handleLoadPrebuilt(DEFAULT_DEVICES, DEFAULT_LINKS)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs transition-colors self-end"
                    >
                      Load Default
                    </button>
                  </div>

                  {/* Star Topology */}
                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between gap-3">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-950 text-sky-400 border border-sky-800">
                        LAN Architecture
                      </span>
                      <h4 className="font-bold text-white text-xs mt-1.5">
                        Star Topology (Central Switch + 4 Workstations)
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Classic Ethernet star topology for studying broadcast domains and CAM address tables.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const starDevices: NetworkDevice[] = [
                          { id: 'star-sw', name: 'Switch0', type: 'switch', model: '2960-24TT', x: 380, y: 180, powerState: 'on', interfaces: [
                            { id: 's-f1', name: 'FastEthernet0/1', mac: '00:SW:01:00:00:01', status: 'up' },
                            { id: 's-f2', name: 'FastEthernet0/2', mac: '00:SW:01:00:00:02', status: 'up' },
                            { id: 's-f3', name: 'FastEthernet0/3', mac: '00:SW:01:00:00:03', status: 'up' },
                            { id: 's-f4', name: 'FastEthernet0/4', mac: '00:SW:01:00:00:04', status: 'up' },
                          ]},
                          { id: 'star-pc1', name: 'PC0', type: 'pc', model: 'PC-PT', x: 200, y: 80, powerState: 'on', interfaces: [{ id: 'p1-fa0', name: 'FastEthernet0', ip: '192.168.1.10', subnetMask: '255.255.255.0', mac: '00:01:42:00:00:10', status: 'up' }] },
                          { id: 'star-pc2', name: 'PC1', type: 'pc', model: 'PC-PT', x: 560, y: 80, powerState: 'on', interfaces: [{ id: 'p2-fa0', name: 'FastEthernet0', ip: '192.168.1.20', subnetMask: '255.255.255.0', mac: '00:01:42:00:00:20', status: 'up' }] },
                          { id: 'star-pc3', name: 'PC2', type: 'pc', model: 'PC-PT', x: 200, y: 280, powerState: 'on', interfaces: [{ id: 'p3-fa0', name: 'FastEthernet0', ip: '192.168.1.30', subnetMask: '255.255.255.0', mac: '00:01:42:00:00:30', status: 'up' }] },
                          { id: 'star-pc4', name: 'PC3', type: 'pc', model: 'PC-PT', x: 560, y: 280, powerState: 'on', interfaces: [{ id: 'p4-fa0', name: 'FastEthernet0', ip: '192.168.1.40', subnetMask: '255.255.255.0', mac: '00:01:42:00:00:40', status: 'up' }] },
                        ];
                        const starLinks: NetworkLink[] = [
                          { id: 'sl-1', sourceDeviceId: 'star-pc1', sourcePortId: 'p1-fa0', targetDeviceId: 'star-sw', targetPortId: 's-f1', cableType: 'straight', status: 'up' },
                          { id: 'sl-2', sourceDeviceId: 'star-pc2', sourcePortId: 'p2-fa0', targetDeviceId: 'star-sw', targetPortId: 's-f2', cableType: 'straight', status: 'up' },
                          { id: 'sl-3', sourceDeviceId: 'star-pc3', sourcePortId: 'p3-fa0', targetDeviceId: 'star-sw', targetPortId: 's-f3', cableType: 'straight', status: 'up' },
                          { id: 'sl-4', sourceDeviceId: 'star-pc4', sourcePortId: 'p4-fa0', targetDeviceId: 'star-sw', targetPortId: 's-f4', cableType: 'straight', status: 'up' },
                        ];
                        handleLoadPrebuilt(starDevices, starLinks);
                      }}
                      className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded text-xs transition-colors self-end"
                    >
                      Load Star Topology
                    </button>
                  </div>

                  {/* Academic CN Lab: PC - Switch - Router */}
                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between gap-3">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800">
                        Standard LAN & Gateway
                      </span>
                      <h4 className="font-bold text-white text-xs mt-1.5">
                        PC ── Switch ── Router (Single LAN Gateway)
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1">
                        PC0 (192.168.1.10) connected to Switch0 (2960) to Router0 (1941 Gi0/0 gateway 192.168.1.1).
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const prebuiltDevices: NetworkDevice[] = [
                          { id: 'dev-r0', name: 'Router0', type: 'router', model: '1941', x: 540, y: 160, powerState: 'on', interfaces: [
                            { id: 'sr-gi0', name: 'GigabitEthernet0/0', ip: '192.168.1.1', subnetMask: '255.255.255.0', mac: '00:RR:01:00:00:01', status: 'up' },
                            { id: 'sr-gi1', name: 'GigabitEthernet0/1', mac: '00:RR:01:00:00:02', status: 'down' },
                            { id: 'sr-se0', name: 'Serial0/0/0', ip: '10.0.0.1', subnetMask: '255.255.255.252', mac: '00:SE:01:00:00:01', status: 'up', clockRate: 64000 },
                            { id: 'sr-se1', name: 'Serial0/0/1', mac: '00:SE:01:00:00:02', status: 'down' },
                          ], routingTable: [
                            { id: 'rt-c1', destinationNetwork: '192.168.1.0', subnetMask: '255.255.255.0', nextHop: 'Directly Connected', interfaceName: 'Gi0/0', type: 'C' }
                          ]},
                          { id: 'dev-sw0', name: 'Switch0', type: 'switch', model: '2960-24TT', x: 340, y: 160, powerState: 'on', interfaces: [
                            { id: 'sw-f1', name: 'FastEthernet0/1', mac: '00:SW:01:00:00:01', status: 'up' },
                            { id: 'sw-g1', name: 'GigabitEthernet0/1', mac: '00:SW:01:00:00:02', status: 'up' },
                          ]},
                          { id: 'dev-pc0', name: 'PC0', type: 'pc', model: 'PC-PT', x: 140, y: 160, powerState: 'on', defaultGateway: '192.168.1.1', interfaces: [
                            { id: 'pc-fa0', name: 'FastEthernet0', ip: '192.168.1.10', subnetMask: '255.255.255.0', mac: '00:01:42:01:00:10', status: 'up' }
                          ]}
                        ];
                        const prebuiltLinks: NetworkLink[] = [
                          { id: 'lnk-l1', sourceDeviceId: 'dev-pc0', sourcePortId: 'pc-fa0', targetDeviceId: 'dev-sw0', targetPortId: 'sw-f1', cableType: 'straight', status: 'up' },
                          { id: 'lnk-l2', sourceDeviceId: 'dev-sw0', sourcePortId: 'sw-g1', targetDeviceId: 'dev-r0', targetPortId: 'sr-gi0', cableType: 'straight', status: 'up' },
                        ];
                        handleLoadPrebuilt(prebuiltDevices, prebuiltLinks);
                      }}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded text-xs transition-colors self-end"
                    >
                      Load PC-Switch-Router
                    </button>
                  </div>

                  {/* Academic CN Lab: PC - Switch - Router - Router - Switch - PC (Serial DCE) */}
                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between gap-3">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 text-rose-400 border border-rose-800">
                        Dual-Router Serial Core
                      </span>
                      <h4 className="font-bold text-white text-xs mt-1.5">
                        PC ── Switch ── Router ── Router ── Switch ── PC (WAN Serial)
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Dual 1941/2911 routers with HWIC-2T Serial0/0/0 DCE link (10.0.0.0/30) connecting two isolated LAN subnets.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const wanDevices: NetworkDevice[] = [
                          { id: 'wan-pc1', name: 'PC1 (HQ)', type: 'pc', model: 'PC-PT', x: 80, y: 160, powerState: 'on', defaultGateway: '192.168.1.1', interfaces: [{ id: 'w-p1-fa0', name: 'FastEthernet0', ip: '192.168.1.10', subnetMask: '255.255.255.0', mac: '00:01:42:01:00:10', status: 'up' }] },
                          { id: 'wan-sw1', name: 'Switch1', type: 'switch', model: '2960-24TT', x: 220, y: 160, powerState: 'on', interfaces: [{ id: 'w-s1-fa1', name: 'FastEthernet0/1', mac: '00:SW:01:00:00:01', status: 'up' }, { id: 'w-s1-gi1', name: 'GigabitEthernet0/1', mac: '00:SW:01:00:00:02', status: 'up' }] },
                          { id: 'wan-r1', name: 'Router1 (HQ)', type: 'router', model: '1941', x: 360, y: 160, powerState: 'on', interfaces: [
                            { id: 'w-r1-gi0', name: 'GigabitEthernet0/0', ip: '192.168.1.1', subnetMask: '255.255.255.0', mac: '00:RR:01:00:00:01', status: 'up' },
                            { id: 'w-r1-se0', name: 'Serial0/0/0', ip: '10.0.0.1', subnetMask: '255.255.255.252', mac: '00:SE:01:00:00:01', status: 'up', clockRate: 64000 },
                          ], routingTable: [
                            { id: 'w-rt1', destinationNetwork: '192.168.1.0', subnetMask: '255.255.255.0', nextHop: 'Directly Connected', interfaceName: 'Gi0/0', type: 'C' },
                            { id: 'w-rt2', destinationNetwork: '10.0.0.0', subnetMask: '255.255.255.252', nextHop: 'Directly Connected', interfaceName: 'Se0/0/0', type: 'C' },
                            { id: 'w-rt3', destinationNetwork: '192.168.2.0', subnetMask: '255.255.255.0', nextHop: '10.0.0.2', interfaceName: 'Se0/0/0', type: 'S' },
                          ]},
                          { id: 'wan-r2', name: 'Router2 (Branch)', type: 'router', model: '1941', x: 500, y: 160, powerState: 'on', interfaces: [
                            { id: 'w-r2-gi0', name: 'GigabitEthernet0/0', ip: '192.168.2.1', subnetMask: '255.255.255.0', mac: '00:RR:02:00:00:01', status: 'up' },
                            { id: 'w-r2-se0', name: 'Serial0/0/0', ip: '10.0.0.2', subnetMask: '255.255.255.252', mac: '00:SE:02:00:00:01', status: 'up' },
                          ], routingTable: [
                            { id: 'w-rt4', destinationNetwork: '192.168.2.0', subnetMask: '255.255.255.0', nextHop: 'Directly Connected', interfaceName: 'Gi0/0', type: 'C' },
                            { id: 'w-rt5', destinationNetwork: '10.0.0.0', subnetMask: '255.255.255.252', nextHop: 'Directly Connected', interfaceName: 'Se0/0/0', type: 'C' },
                            { id: 'w-rt6', destinationNetwork: '192.168.1.0', subnetMask: '255.255.255.0', nextHop: '10.0.0.1', interfaceName: 'Se0/0/0', type: 'S' },
                          ]},
                          { id: 'wan-sw2', name: 'Switch2', type: 'switch', model: '2960-24TT', x: 640, y: 160, powerState: 'on', interfaces: [{ id: 'w-s2-gi1', name: 'GigabitEthernet0/1', mac: '00:SW:02:00:00:01', status: 'up' }, { id: 'w-s2-fa1', name: 'FastEthernet0/1', mac: '00:SW:02:00:00:02', status: 'up' }] },
                          { id: 'wan-pc2', name: 'PC2 (Branch)', type: 'pc', model: 'PC-PT', x: 780, y: 160, powerState: 'on', defaultGateway: '192.168.2.1', interfaces: [{ id: 'w-p2-fa0', name: 'FastEthernet0', ip: '192.168.2.10', subnetMask: '255.255.255.0', mac: '00:01:42:02:00:20', status: 'up' }] },
                        ];
                        const wanLinks: NetworkLink[] = [
                          { id: 'wl-1', sourceDeviceId: 'wan-pc1', sourcePortId: 'w-p1-fa0', targetDeviceId: 'wan-sw1', targetPortId: 'w-s1-fa1', cableType: 'straight', status: 'up' },
                          { id: 'wl-2', sourceDeviceId: 'wan-sw1', sourcePortId: 'w-s1-gi1', targetDeviceId: 'wan-r1', targetPortId: 'w-r1-gi0', cableType: 'straight', status: 'up' },
                          { id: 'wl-3', sourceDeviceId: 'wan-r1', sourcePortId: 'w-r1-se0', targetDeviceId: 'wan-r2', targetPortId: 'w-r2-se0', cableType: 'serial', status: 'up' },
                          { id: 'wl-4', sourceDeviceId: 'wan-r2', sourcePortId: 'w-r2-gi0', targetDeviceId: 'wan-sw2', targetPortId: 'w-s2-gi1', cableType: 'straight', status: 'up' },
                          { id: 'wl-5', sourceDeviceId: 'wan-sw2', sourcePortId: 'w-s2-fa1', targetDeviceId: 'wan-pc2', targetPortId: 'w-p2-fa0', cableType: 'straight', status: 'up' },
                        ];
                        handleLoadPrebuilt(wanDevices, wanLinks);
                      }}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded text-xs transition-colors self-end"
                    >
                      Load Dual-Router Serial WAN
                    </button>
                  </div>
                </div>
              )}

              {activePrebuiltTab === 'upload' && (
                <div className="flex flex-col items-center justify-center p-8 bg-slate-950 border border-dashed border-slate-700 rounded-xl space-y-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Upload Cisco Packet Tracer JSON File</h4>
                    <p className="text-slate-400 text-xs mt-1 max-w-sm">
                      Select any previously exported .pkt.json file from your computer to restore its complete device configurations, links, and IP tables.
                    </p>
                  </div>
                  <label className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg cursor-pointer transition-colors text-xs flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    <span>Browse File (.json / .pkt)</span>
                    <input type="file" accept=".json" onChange={handleImportTopology} className="hidden" />
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cisco Packet Tracer Help & User Guide Modal */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="flex flex-col w-full max-w-3xl bg-slate-900 border-2 border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <HelpCircle className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-white text-sm">
                  Cisco Packet Tracer User Manual & Lab Reference Guide
                </h3>
              </div>
              <button
                onClick={() => setIsHelpModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Help Content */}
            <div className="flex-1 overflow-y-auto p-5 text-xs space-y-5">
              {/* Section 1 */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
                  <Cable className="w-4 h-4" />
                  <span>1. How to Cable & Connect Devices</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  1. In the bottom toolbar, click on the <strong>Connections (Lightning)</strong> category to view available cables: Copper Straight-Through, Copper Cross-Over, Fiber, and Serial DCE.
                </p>
                <p className="text-slate-300 leading-relaxed">
                  2. Click on a device on the canvas (e.g. <strong>PC0</strong>). A port selector will pop up allowing you to choose an interface like <code>FastEthernet0</code>.
                </p>
                <p className="text-slate-300 leading-relaxed">
                  3. Next, click on the target device (e.g. <strong>Switch0</strong> or <strong>Router0</strong>) and select its port (e.g. <code>GigabitEthernet0/0</code>). The cable will connect with authentic link light triangles pointing towards each port.
                </p>
              </div>

              {/* Section 2 */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Monitor className="w-4 h-4" />
                  <span>2. How to Configure Host Devices (PC / Laptop / Server)</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  1. Click on any PC or Laptop on the canvas. The authentic <strong>Cisco Packet Tracer Window</strong> opens.
                </p>
                <p className="text-slate-300 leading-relaxed">
                  2. Select the <strong>Desktop</strong> tab and click <strong>IP Configuration</strong> to configure IPv4 address, subnet mask, and default gateway.
                </p>
                <p className="text-slate-300 leading-relaxed">
                  3. Click <strong>Command Prompt</strong> to run standard network commands:
                </p>
                <div className="p-2.5 bg-black rounded font-mono text-[11px] text-emerald-400 space-y-0.5">
                  <div>C:\&gt; ipconfig</div>
                  <div>C:\&gt; ping 192.168.1.1</div>
                  <div>C:\&gt; tracert 192.168.2.100</div>
                  <div>C:\&gt; arp -a</div>
                </div>
              </div>

              {/* Section 3 */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Terminal className="w-4 h-4" />
                  <span>3. How to Configure Routers & Switches (Cisco IOS CLI)</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Click on any Router or Switch and select the <strong>CLI</strong> tab. Cisco IOS operates in hierarchical modes:
                </p>
                <div className="p-2.5 bg-black rounded font-mono text-[11px] text-slate-300 space-y-1">
                  <div><span className="text-slate-500">Router&gt;</span> <span className="text-amber-300">enable</span> <span className="text-slate-500">; Enter Privileged EXEC</span></div>
                  <div><span className="text-slate-500">Router#</span> <span className="text-amber-300">configure terminal</span> <span className="text-slate-500">; Enter Global Configuration</span></div>
                  <div><span className="text-slate-500">Router(config)#</span> <span className="text-amber-300">interface GigabitEthernet0/0</span></div>
                  <div><span className="text-slate-500">Router(config-if)#</span> <span className="text-amber-300">ip address 192.168.1.1 255.255.255.0</span></div>
                  <div><span className="text-slate-500">Router(config-if)#</span> <span className="text-amber-300">no shutdown</span> <span className="text-slate-500">; Bring interface UP</span></div>
                </div>
              </div>

              {/* Section 4 */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                  <RotateCcw className="w-4 h-4" />
                  <span>4. Router Power Switch (ON / OFF) & Boot Sequence</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Every router has a physical rocker switch in the <strong>Physical</strong> chassis tab and a quick <code>PWR: ON / OFF</code> button in the window title bar.
                </p>
                <p className="text-slate-300 leading-relaxed">
                  When powered OFF, the CLI displays a power warning, link lights turn RED, and pings fail. Toggling the power switch back to ON initiates the Cisco IOS Power-On Self Test (POST) and memory decompression before displaying <code>Press RETURN to get started!</code>.
                </p>
              </div>

              {/* Section 5 */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                  <Play className="w-4 h-4" />
                  <span>5. Real-Time vs Simulation Mode & Fast Forward Time</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  <strong>Fast Forward Time (30s):</strong> Clicking the amber fast-forward button immediately advances time by 30 seconds to bypass Spanning Tree Protocol (STP) listening/learning delays and converge all switch ports to green forwarding state.
                </p>
                <p className="text-slate-300 leading-relaxed">
                  <strong>Simulation Mode:</strong> Switch to Simulation Mode to generate ICMP, ARP, DNS, or HTTP traffic step-by-step and inspect full Layer 2, Layer 3, and Layer 4 packet headers in the Wireshark-like inspector!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
