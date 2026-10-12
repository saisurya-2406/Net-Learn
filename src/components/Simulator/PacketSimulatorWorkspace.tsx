import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, StepForward, RotateCcw, HelpCircle, FileText, 
  Download, Upload, Sparkles, Send, ShieldAlert, Check, FastForward,
  FolderOpen, Save, RefreshCw, Layers, ChevronDown, BookOpen, Monitor, Activity,
  Compass, Shuffle, Terminal, Info, X, Cable
} from 'lucide-react';
import { NetworkDevice, NetworkLink, SimulationStep, DeviceType, CableType } from '../../types/network';
import { APPLICATION_PROTOCOLS, ApplicationProtocol } from '../../utils/protocolCatalog';
import { ACADEMIC_EXPERIMENTS } from '../../data/labData';
import { NetworkCanvas } from './NetworkCanvas';
import { PacketTracerBottomBar } from './PacketTracerBottomBar';
import { CiscoDeviceModal } from './CiscoDeviceModal';
import { PacketInspector } from './PacketInspector';
import { generateSimulationTrace, learnSwitchMacAddresses } from '../../utils/simulationEngine';
import { calculateRoutingTables } from '../../utils/routingEngine';
import {
  createTopologyFile,
  parseTopologyFile,
  readSavedTopologies,
  SavedTopology,
  writeSavedTopologies,
} from '../../utils/topologyFiles';

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
          <h1 style="color: #0284c7;">Welcome to the NetLearn Network Simulator</h1>
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
  startBlankTopologyOnMount?: boolean;
  onBlankTopologyStarted?: () => void;
  openSavedTopologiesOnMount?: boolean;
  onSavedTopologiesOpened?: () => void;
}

export const PacketSimulatorWorkspace: React.FC<PacketSimulatorWorkspaceProps> = ({
  initialDevices,
  initialLinks,
  startBlankTopologyOnMount = false,
  onBlankTopologyStarted,
  openSavedTopologiesOnMount = false,
  onSavedTopologiesOpened,
}) => {
  const [devices, setDevices] = useState<NetworkDevice[]>(
    startBlankTopologyOnMount ? [] : initialDevices && initialDevices.length > 0 ? initialDevices : DEFAULT_DEVICES
  );
  const [links, setLinks] = useState<NetworkLink[]>(
    startBlankTopologyOnMount ? [] : initialLinks && initialLinks.length > 0 ? initialLinks : DEFAULT_LINKS
  );
  
  // Selected device
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  // Active Device Modal for Cisco Packet Tracer dialog
  const [activeModalDevice, setActiveModalDevice] = useState<NetworkDevice | null>(null);

  // Cable tool
  const [selectedCableType, setSelectedCableType] = useState<CableType | null>(null);

  // Simulation Mode Controls
  const [isSimulationMode, setIsSimulationMode] = useState<boolean>(startBlankTopologyOnMount);
  const [srcDeviceId, setSrcDeviceId] = useState<string>('dev-pc0');
  const [dstDeviceId, setDstDeviceId] = useState<string>('dev-srv0');
  const [protocol, setProtocol] = useState<ApplicationProtocol | 'ARP'>('ICMP');
  const [messagePayload, setMessagePayload] = useState('Hello from NetLearn');
  const [simulationSteps, setSimulationSteps] = useState<SimulationStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [isPlayingSim, setIsPlayingSim] = useState<boolean>(false);

  // Packet Inspector Modal
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);

  // File Menu and Help Modal States
  const [isFileMenuOpen, setIsFileMenuOpen] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
  const [isOpenPrebuiltModalOpen, setIsOpenPrebuiltModalOpen] = useState<boolean>(false);
  const [isSavedTopologiesOpen, setIsSavedTopologiesOpen] = useState<boolean>(false);
  const [savedTopologyName, setSavedTopologyName] = useState<string>('');
  const [savedTopologies, setSavedTopologies] = useState<SavedTopology[]>([]);
  const [topologyMessage, setTopologyMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
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
    setIsSimulationMode(true);
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

    if (devices.length === 0) setSrcDeviceId(id);
    if (devices.length === 1) setDstDeviceId(id);
    setDevices([...devices, newDev]);
    setSelectedDeviceId(id);
  };

  // Launch Packet Simulation
  const handleStartSimulation = () => {
    if (devices.length < 2 || !devices.some((device) => device.id === srcDeviceId) ||
        !devices.some((device) => device.id === dstDeviceId) || srcDeviceId === dstDeviceId) {
      setTopologyMessage({ type: 'error', text: 'Add at least two devices and choose different source and destination devices.' });
      return;
    }
    if (protocol !== 'ARP' && !messagePayload.trim()) {
      setTopologyMessage({ type: 'error', text: 'Enter a message or query before sending.' });
      return;
    }
    if (protocol === 'DNS' &&
        !/^(?=.{1,253}$)(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)(?:\.(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?))*$/.test(messagePayload.trim())) {
      setTopologyMessage({ type: 'error', text: 'Enter a valid DNS hostname such as server.example.' });
      return;
    }
    const trace = generateSimulationTrace(
      devices,
      links,
      srcDeviceId,
      dstDeviceId,
      protocol,
      messagePayload.trim(),
    );
    const packetDropped = trace.some(step => /failed|drop|no route|unreachable|invalid|duplicate|missing default/i.test(step.explanation.title));
    if (!packetDropped) setDevices(learnSwitchMacAddresses(devices, links, srcDeviceId, dstDeviceId));
    setSimulationSteps(trace);
    setCurrentStepIndex(0);
    setIsSimulationMode(true);
    setIsPlayingSim(trace.length > 1);
    setTopologyMessage({
      type: trace.length > 0 ? 'success' : 'error',
      text: trace.length > 0
        ? `Simulated ${protocol} message from ${devices.find((device) => device.id === srcDeviceId)?.name} to ${devices.find((device) => device.id === dstDeviceId)?.name}. Follow the packet and event explanation on the canvas.`
        : 'No simulation events were generated. Check that both selected devices have configured interfaces.',
    });
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

  const openSavedTopologies = () => {
    setTopologyMessage(null);
    setIsSavedTopologiesOpen(true);
    try {
      setSavedTopologies(readSavedTopologies(window.localStorage));
    } catch (error) {
      setSavedTopologies([]);
      setTopologyMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Could not read saved topologies.',
      });
    }
  };

  useEffect(() => {
    if (!startBlankTopologyOnMount) return;
    onBlankTopologyStarted?.();
  }, [startBlankTopologyOnMount, onBlankTopologyStarted]);

  useEffect(() => {
    if (!openSavedTopologiesOnMount) return;
    openSavedTopologies();
    onSavedTopologiesOpened?.();
  }, [openSavedTopologiesOnMount, onSavedTopologiesOpened]);

  const handleSaveTopologyToBrowser = () => {
    try {
      const topology = createTopologyFile(savedTopologyName, devices, links);
      const existing = readSavedTopologies(window.localStorage);
      const saved: SavedTopology = {
        id: `saved-${crypto.randomUUID()}`,
        name: topology.name,
        savedAt: new Date().toISOString(),
        devices: topology.devices,
        links: topology.links,
      };
      const updated = [saved, ...existing.filter((item) => item.name !== saved.name)].slice(0, 25);
      writeSavedTopologies(window.localStorage, updated);
      setSavedTopologies(updated);
      setSavedTopologyName('');
      setTopologyMessage({ type: 'success', text: `Saved "${saved.name}" in this browser.` });
    } catch (error) {
      setTopologyMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Could not save this topology.',
      });
    }
  };

  const handleLoadSavedTopology = (topology: SavedTopology) => {
    try {
      createTopologyFile(topology.name, topology.devices, topology.links);
      setDevices(topology.devices);
      setLinks(topology.links);
      handleResetSimulation();
      setSelectedDeviceId(null);
      setIsSavedTopologiesOpen(false);
      setTopologyMessage({ type: 'success', text: `Loaded "${topology.name}".` });
    } catch (error) {
      setTopologyMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Could not load this topology.',
      });
    }
  };

  const handleDeleteSavedTopology = (topology: SavedTopology) => {
    if (!window.confirm(`Delete the saved topology "${topology.name}" from this browser?`)) return;
    try {
      const updated = readSavedTopologies(window.localStorage).filter((item) => item.id !== topology.id);
      writeSavedTopologies(window.localStorage, updated);
      setSavedTopologies(updated);
      setTopologyMessage({ type: 'success', text: `Deleted "${topology.name}".` });
    } catch (error) {
      setTopologyMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Could not delete this topology.',
      });
    }
  };

  const handleClearSavedTopologies = () => {
    if (!window.confirm('Clear all NetLearn topologies saved in this browser? This cannot be undone.')) return;
    try {
      window.localStorage.removeItem('netlearn.saved-topologies.v1');
      setSavedTopologies([]);
      setTopologyMessage({ type: 'success', text: 'Browser topology saves were cleared.' });
    } catch (error) {
      setTopologyMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Could not clear browser topology saves.',
      });
    }
  };

  // Export Topology
  const handleExportTopology = () => {
    try {
      const topology = createTopologyFile('NetLearn topology', devices, links);
      const data = JSON.stringify(topology, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `netlearn-topology-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setTopologyMessage({ type: 'success', text: 'Topology exported as NetLearn JSON.' });
    } catch (error) {
      setTopologyMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Could not export this topology.',
      });
    }
  };

  // Import Topology
  const handleImportTopology = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (file.size > 5 * 1024 * 1024) {
      setTopologyMessage({ type: 'error', text: 'Topology file is too large. The maximum file size is 5 MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        if (typeof event.target?.result !== 'string') {
          throw new Error('The selected topology file could not be read.');
        }
        const parsed = parseTopologyFile(event.target.result);
        setDevices(parsed.devices);
        setLinks(parsed.links);
        setSelectedDeviceId(null);
        handleResetSimulation();
        setTopologyMessage({ type: 'success', text: `Imported "${parsed.name}".` });
      } catch (error) {
        setTopologyMessage({
          type: 'error',
          text: error instanceof Error ? error.message : 'Could not import this topology.',
        });
      }
    };
    reader.onerror = () => {
      setTopologyMessage({ type: 'error', text: 'The selected topology file could not be read.' });
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
            <span>NetLearn Network Simulator</span>
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

                  <button
                    onClick={() => {
                      setIsSavedTopologiesOpen(true);
                      setSavedTopologyName('');
                      setIsFileMenuOpen(false);
                      openSavedTopologies();
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 flex items-center gap-2"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save / Load in This Browser...</span>
                  </button>

                  <label className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2 cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-slate-400" />
                    <span>Import NetLearn JSON...</span>
                    <input type="file" accept=".json,application/json" onChange={handleImportTopology} className="hidden" />
                  </label>

                  <div className="h-px bg-slate-800 my-1" />

                  <button
                    onClick={handleExportTopology}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2"
                  >
                    <Save className="w-3.5 h-3.5 text-slate-400" />
                    <span>Export NetLearn JSON...</span>
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
            onClick={() => setIsSimulationMode(true)}
            className="flex items-center gap-1 px-2 py-1 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 rounded text-cyan-200 text-[11px] font-bold transition-colors"
            title="Open the message-sending simulation controls"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Message</span>
          </button>

          <button
            onClick={openSavedTopologies}
            className="flex items-center gap-1 px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-cyan-300 text-[11px] font-medium transition-colors"
            title="Save or load topologies in this browser"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Browser Saves</span>
          </button>

          <button
            onClick={() => {
              if (devices.length > 0 && !window.confirm('Start a blank network? Save or export your current topology first if you want to keep it.')) return;
              handleNewBlankWorkspace();
            }}
            className="flex items-center gap-1 px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-slate-300 text-[11px] font-medium transition-colors"
            title="Clear the current workspace and start with an empty network"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>New Network</span>
          </button>
        </div>
      </div>

      {topologyMessage && (
        <div
          role={topologyMessage.type === 'error' ? 'alert' : 'status'}
          className={`flex items-center justify-between gap-3 px-3 py-2 border rounded-lg text-xs ${
            topologyMessage.type === 'error'
              ? 'bg-rose-950/60 border-rose-800 text-rose-200'
              : 'bg-emerald-950/50 border-emerald-800 text-emerald-200'
          }`}
        >
          <span>{topologyMessage.text}</span>
          <button
            onClick={() => setTopologyMessage(null)}
            className="shrink-0 p-1 rounded hover:bg-black/20"
            aria-label="Dismiss topology message"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Simulation Setup Bar (When in Simulation Mode or testing Packet Flow) */}
      {isSimulationMode && (
        <div className="flex flex-col gap-3 p-3 bg-slate-900/90 border border-cyan-900 rounded-lg text-xs animate-in fade-in">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Source:</span>
              <select
                value={srcDeviceId}
                onChange={(e) => setSrcDeviceId(e.target.value)}
                disabled={devices.length === 0}
                className="px-2 py-1 bg-slate-950 border border-slate-700 rounded text-white font-mono font-bold"
              >
                {devices.length === 0 && <option value="">Add a source device</option>}
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
                disabled={devices.length === 0}
                className="px-2 py-1 bg-slate-950 border border-slate-700 rounded text-white font-mono font-bold"
              >
                {devices.length === 0 && <option value="">Add a destination device</option>}
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
                onChange={(e) => setProtocol(e.target.value as ApplicationProtocol | 'ARP')}
                className="px-2 py-1 bg-slate-950 border border-slate-700 rounded text-white font-bold"
              >
                {Object.entries(APPLICATION_PROTOCOLS).map(([key, value]) => (
                  <option key={key} value={key}>{value.label}</option>
                ))}
                <option value="ARP">ARP Broadcast</option>
              </select>
            </div>

            <label className="flex min-w-48 flex-1 flex-col gap-1">
              <span className="text-slate-400 font-medium">
                {protocol === 'DNS' ? 'DNS name' : protocol === 'ARP' ? 'ARP has no application payload' : `${protocol} payload`}
              </span>
              <input
                value={messagePayload}
                onChange={(event) => setMessagePayload(event.target.value)}
                maxLength={256}
                disabled={protocol === 'ARP'}
                placeholder={protocol === 'DNS' ? 'host.example' : protocol === 'DHCP' ? 'DHCP Discover options' : 'Type a message to send'}
                className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-white disabled:opacity-50"
              />
            </label>

            <button
              onClick={handleStartSimulation}
              disabled={devices.length < 2 || srcDeviceId === dstDeviceId}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-400 text-slate-950 rounded font-bold transition-all shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              Send Message
            </button>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            Educational simulation only. Configure device addresses and connect ports before sending; the event trace reports delivery or the actual simulated drop reason.
          </p>

          {/* Stepper info */}
          {activeStep && (
            <div className="flex items-center gap-3">
              <span className="font-mono text-slate-300">
                Step <strong className="text-white">{activeStep.stepIndex}</strong> of{' '}
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

      {simulationSteps.length > 0 && (
        <section aria-label="Message event timeline" className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
          <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
            <h2 className="flex items-center gap-2 text-xs font-bold text-white">
              <Activity className="h-4 w-4 text-cyan-300" />
              Message event timeline
            </h2>
            <span className="text-[11px] text-slate-400">{simulationSteps.length} simulated events</span>
          </div>
          <ol className="max-h-56 space-y-1 overflow-y-auto p-2">
            {simulationSteps.map((step, index) => (
              <li key={`${step.stepIndex}-${step.linkId}-${step.packetName}`}>
                <button
                  type="button"
                  onClick={() => {
                    setIsPlayingSim(false);
                    setCurrentStepIndex(index);
                  }}
                  aria-current={currentStepIndex === index ? 'step' : undefined}
                  className={`w-full rounded-md border px-3 py-2 text-left transition-colors ${
                    currentStepIndex === index
                      ? 'border-cyan-700 bg-cyan-950/50'
                      : 'border-transparent hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-100">
                      {step.stepIndex}. {step.explanation.title}
                    </span>
                    <span className="font-mono text-[10px] text-cyan-200">
                      {devices.find((device) => device.id === step.fromDeviceId)?.name || 'Device'}
                      {' → '}
                      {devices.find((device) => device.id === step.toDeviceId)?.name || 'Device'}
                    </span>
                  </span>
                  <span className="mt-1 block text-[11px] leading-relaxed text-slate-400">
                    {step.explanation.decisionReason}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </section>
      )}

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
            const nextDevices = calculateRoutingTables(devices.map((d) => (d.id === updated.id ? updated : d)), links);
            const savedDevice = nextDevices.find(item => item.id === updated.id) || updated;
            setDevices(nextDevices);
            setActiveModalDevice(savedDevice);
          }}
        />
      )}

      {/* Packet Inspector (Wireshark-like multi-layer header dissection) */}
      <PacketInspector
        step={activeStep}
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
      />

      {isSavedTopologiesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="saved-topologies-title"
            className="w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl"
          >
            <header className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950">
              <div>
                <h2 id="saved-topologies-title" className="text-sm font-bold text-white">
                  Topologies saved in this browser
                </h2>
                <p className="mt-1 text-[11px] text-slate-400">
                  Private to this browser profile; export a JSON backup to share or move a topology.
                </p>
              </div>
              <button
                onClick={() => setIsSavedTopologiesOpen(false)}
                className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                aria-label="Close saved topologies"
              >
                <X className="w-4 h-4" />
              </button>
            </header>

            <div className="p-5 overflow-y-auto space-y-5">
              <form
                className="flex flex-col sm:flex-row gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleSaveTopologyToBrowser();
                }}
              >
                <label className="sr-only" htmlFor="saved-topology-name">Topology name</label>
                <input
                  id="saved-topology-name"
                  value={savedTopologyName}
                  onChange={(event) => setSavedTopologyName(event.target.value)}
                  maxLength={100}
                  required
                  placeholder="Name this topology"
                  className="min-w-0 flex-1 px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-sm font-semibold text-white"
                >
                  <Save className="w-4 h-4" />
                  Save current topology
                </button>
              </form>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                    Saved topologies ({savedTopologies.length}/25)
                  </h3>
                  {savedTopologies.length > 0 && (
                    <button
                      onClick={handleClearSavedTopologies}
                      className="text-[11px] text-rose-300 hover:text-rose-200"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                {savedTopologies.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-slate-700 px-4 py-6 text-center text-xs text-slate-400">
                    No topologies saved in this browser yet.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-800 rounded-lg border border-slate-800">
                    {savedTopologies.map((topology) => (
                      <li key={topology.id} className="flex items-center gap-3 px-3 py-3">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-white">{topology.name}</div>
                          <div className="mt-0.5 text-[11px] text-slate-400">
                            {topology.devices.length} devices · {topology.links.length} links ·{' '}
                            {new Date(topology.savedAt).toLocaleString()}
                          </div>
                        </div>
                        <button
                          onClick={() => handleLoadSavedTopology(topology)}
                          className="rounded-md border border-sky-700 px-2.5 py-1.5 text-xs font-semibold text-sky-200 hover:bg-sky-950"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => handleDeleteSavedTopology(topology)}
                          className="rounded-md border border-slate-700 px-2.5 py-1.5 text-xs text-slate-300 hover:border-rose-700 hover:text-rose-200"
                          aria-label={`Delete ${topology.name}`}
                        >
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Prebuilt Labs & Topology Loader Modal */}
      {isOpenPrebuiltModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="flex flex-col w-full max-w-3xl bg-slate-900 border-2 border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <FolderOpen className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-white text-sm">
                  Open NetLearn Topology
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
                  <h4 className="font-bold text-white text-sm">Import a NetLearn topology file</h4>
                    <p className="text-slate-400 text-xs mt-1 max-w-sm">
                      Select a NetLearn JSON topology file you exported earlier to restore its devices, links, and interface settings. Cisco .pkt files are not supported.
                    </p>
                  </div>
                  <label className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg cursor-pointer transition-colors text-xs flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    <span>Browse NetLearn JSON</span>
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
                  NetLearn Simulator Guide
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
                  1. Click on a PC or laptop on the canvas to open its simulated device panel.
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
                  <span>3. Configure Routers & Switches (IOS-style CLI)</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Click on a router or switch and select the <strong>CLI</strong> tab. The simulated command interface uses familiar IOS-style modes:
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
                  Routers include a simulated power control in the <strong>Physical</strong> chassis tab and a quick <code>PWR: ON / OFF</code> button in the window title bar.
                </p>
                <p className="text-slate-300 leading-relaxed">
                  When powered off, the CLI displays a power warning, link lights turn red, and simulated pings fail. Powering on runs the simulator boot sequence before displaying <code>Press RETURN to get started!</code>.
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
