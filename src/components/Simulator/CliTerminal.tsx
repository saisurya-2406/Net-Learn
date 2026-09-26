import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, X, Maximize2, Minimize2 } from 'lucide-react';
import { NetworkDevice } from '../../types/network';

interface CliTerminalProps {
  device: NetworkDevice;
  isOpen: boolean;
  onClose: () => void;
  onUpdateDevice: (updated: NetworkDevice) => void;
}

export const CliTerminal: React.FC<CliTerminalProps> = ({
  device,
  isOpen,
  onClose,
  onUpdateDevice,
}) => {
  const [mode, setMode] = useState<'user' | 'priv' | 'config' | 'config-if'>('user');
  const [selectedInterface, setSelectedInterface] = useState<string>('');
  const [commandInput, setCommandInput] = useState<string>('');
  const [history, setHistory] = useState<string[]>([
    `NetLearn Educational IOS Terminal v15.4`,
    `Connected to ${device.name} [Type '?' or 'help' for available commands]`,
    '',
  ]);
  const [cmdHistoryIndex, setCmdHistoryIndex] = useState<number>(-1);
  const [savedCommands, setSavedCommands] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  if (!isOpen) return null;

  const promptString = () => {
    const hostname = device.name;
    switch (mode) {
      case 'user':
        return `${hostname}>`;
      case 'priv':
        return `${hostname}#`;
      case 'config':
        return `${hostname}(config)#`;
      case 'config-if':
        return `${hostname}(config-if)#`;
    }
  };

  const executeCommand = (cmdStr: string) => {
    const raw = cmdStr.trim();
    const parts = raw.split(/\s+/);
    const cmd = parts[0]?.toLowerCase() || '';

    const newHistory = [...history, `${promptString()} ${raw}`];

    if (!raw) {
      setHistory(newHistory);
      return;
    }

    setSavedCommands(prev => [raw, ...prev]);
    setCmdHistoryIndex(-1);

    // Help
    if (cmd === '?' || cmd === 'help') {
      newHistory.push(
        'Available commands:',
        '  enable                  - Enter privileged EXEC mode',
        '  disable                 - Exit to user EXEC mode',
        '  configure terminal      - Enter global configuration mode (conf t)',
        '  interface <name>        - Select and configure an interface (e.g. gi0/0, fa0/1)',
        '  ip address <ip> <mask>  - Set interface IP and subnet mask',
        '  no shutdown             - Administratively enable the current interface',
        '  shutdown                - Administratively disable the current interface',
        '  ip route <net> <mask> <gw> - Add static route',
        '  show ip int brief       - Display IP status summary of all interfaces',
        '  show ip route           - Display IPv4 routing table',
        '  show mac address-table  - Display switch MAC address table',
        '  show running-config     - Display active device configuration',
        '  ping <ip>               - Test ICMP echo reachability',
        '  traceroute <ip>         - Trace network route hops',
        '  clear                   - Clear terminal screen',
        '  exit / end              - Exit current configuration mode'
      );
    } else if (cmd === 'clear') {
      setHistory([]);
      return;
    } else if (cmd === 'enable') {
      setMode('priv');
    } else if (cmd === 'disable') {
      setMode('user');
    } else if (cmd === 'configure' || cmd === 'conf') {
      if (mode === 'user') {
        newHistory.push('% Access denied. Type "enable" first.');
      } else {
        setMode('config');
      }
    } else if (cmd === 'interface' || cmd === 'int') {
      if (mode !== 'config' && mode !== 'config-if') {
        newHistory.push('% Incomplete command or invalid mode.');
      } else {
        const ifName = parts[1] || 'gi0/0';
        setSelectedInterface(ifName);
        setMode('config-if');
        newHistory.push(`Entered interface configuration mode for ${ifName}`);
      }
    } else if (cmd === 'ip' && parts[1]?.toLowerCase() === 'address') {
      if (mode !== 'config-if') {
        newHistory.push('% Command must be run in interface mode (config-if).');
      } else {
        const ip = parts[2];
        const mask = parts[3];
        if (!ip || !mask) {
          newHistory.push('% Usage: ip address <ip-address> <subnet-mask>');
        } else {
          // Update device
          const updated = { ...device };
          const idx = updated.interfaces.findIndex(
            i => i.name.toLowerCase() === selectedInterface.toLowerCase()
          );
          if (idx !== -1) {
            updated.interfaces[idx].ip = ip;
            updated.interfaces[idx].subnetMask = mask;
            onUpdateDevice(updated);
            newHistory.push(`Assigned IP ${ip} with mask ${mask} to ${selectedInterface}.`);
          } else {
            newHistory.push(`% Interface ${selectedInterface} not found on this device.`);
          }
        }
      }
    } else if (raw.toLowerCase() === 'no shutdown' || raw.toLowerCase() === 'no shut') {
      if (mode !== 'config-if') {
        newHistory.push('% Command must be run in interface mode (config-if).');
      } else {
        const updated = { ...device };
        const idx = updated.interfaces.findIndex(
          i => i.name.toLowerCase() === selectedInterface.toLowerCase()
        );
        if (idx !== -1) {
          updated.interfaces[idx].status = 'up';
          onUpdateDevice(updated);
          newHistory.push(
            `%LINK-5-CHANGED: Interface ${selectedInterface}, changed state to up`,
            `%LINEPROTO-5-UPDOWN: Line protocol on Interface ${selectedInterface}, changed state to up`
          );
        } else {
          newHistory.push(`% Interface ${selectedInterface} not found.`);
        }
      }
    } else if (cmd === 'shutdown' || cmd === 'shut') {
      if (mode !== 'config-if') {
        newHistory.push('% Command must be run in interface mode.');
      } else {
        const updated = { ...device };
        const idx = updated.interfaces.findIndex(
          i => i.name.toLowerCase() === selectedInterface.toLowerCase()
        );
        if (idx !== -1) {
          updated.interfaces[idx].status = 'down';
          onUpdateDevice(updated);
          newHistory.push(`%LINK-5-CHANGED: Interface ${selectedInterface}, changed state to administratively down`);
        }
      }
    } else if (raw.toLowerCase().startsWith('show ip int') || raw.toLowerCase() === 'show ip interface brief') {
      newHistory.push(
        'Interface                  IP-Address      OK? Method Status                Protocol',
        '--------------------------------------------------------------------------------'
      );
      device.interfaces.forEach((iface) => {
        const ipStr = (iface.ip || 'unassigned').padEnd(16, ' ');
        const statStr = (iface.status === 'up' ? 'up' : 'administratively down').padEnd(21, ' ');
        const protoStr = iface.status === 'up' ? 'up' : 'down';
        newHistory.push(`${iface.name.padEnd(26, ' ')} ${ipStr} YES manual ${statStr} ${protoStr}`);
      });
    } else if (raw.toLowerCase().startsWith('show ip route')) {
      newHistory.push(
        'Codes: C - connected, S - static, R - RIP, O - OSPF',
        'Gateway of last resort is not set',
        ''
      );
      (device.routingTable || []).forEach((r) => {
        newHistory.push(`S    ${r.destinationNetwork} [1/0] via ${r.nextHop}, ${r.interfaceName}`);
      });
      device.interfaces.forEach((iface) => {
        if (iface.ip && iface.status === 'up') {
          newHistory.push(`C    ${iface.ip}/24 is directly connected, ${iface.name}`);
        }
      });
    } else if (raw.toLowerCase().startsWith('show mac')) {
      newHistory.push(
        '          Mac Address Table',
        '-------------------------------------------',
        'Vlan    Mac Address       Type        Ports',
        '----    -----------       --------    -----'
      );
      if (device.macTable && device.macTable.length > 0) {
        device.macTable.forEach((m) => {
          newHistory.push(`   ${m.vlan}    ${m.mac}    ${m.type}     ${m.port}`);
        });
      } else {
        newHistory.push('Total Mac Addresses for this criterion: 0');
      }
    } else if (raw.toLowerCase().startsWith('ping')) {
      const targetIp = parts[1];
      if (!targetIp) {
        newHistory.push('% Usage: ping <ip-address>');
      } else {
        newHistory.push(
          `Type escape sequence to abort.`,
          `Sending 5, 100-byte ICMP Echos to ${targetIp}, timeout is 2 seconds:`,
          `!!!!!`,
          `Success rate is 100 percent (5/5), round-trip min/avg/max = 1/3/4 ms`
        );
      }
    } else if (cmd === 'exit' || cmd === 'end') {
      if (mode === 'config-if') setMode('config');
      else if (mode === 'config') setMode('priv');
      else if (mode === 'priv') setMode('user');
    } else {
      newHistory.push(`% Unknown command: "${raw}". Type "?" for help.`);
    }

    setHistory(newHistory);
    setCommandInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`flex flex-col bg-slate-950 border border-slate-800 rounded-xl shadow-2xl overflow-hidden transition-all duration-200 ${
          isExpanded ? 'w-full h-full max-w-5xl max-h-[92vh]' : 'w-full max-w-2xl h-[520px]'
        }`}
      >
        {/* Terminal Title Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs select-none">
          <div className="flex items-center gap-2">
            <TerminalIcon className="w-4 h-4 text-emerald-400" />
            <span className="font-mono font-bold text-white">
              {device.name} — Cisco IOS Interactive CLI
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-slate-400 hover:text-white rounded"
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Terminal Screen */}
        <div
          onClick={() => inputRef.current?.focus()}
          className="flex-1 p-4 bg-slate-950 font-mono text-xs text-emerald-400 overflow-y-auto leading-relaxed cursor-text space-y-1"
        >
          {history.map((line, idx) => (
            <div key={idx} className="whitespace-pre-wrap">
              {line}
            </div>
          ))}

          {/* Active Input Line */}
          <div className="flex items-center gap-2">
            <span className="text-white font-bold select-none">{promptString()}</span>
            <input
              ref={inputRef}
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  executeCommand(commandInput);
                } else if (e.key === 'ArrowUp') {
                  if (savedCommands.length > 0) {
                    const nextIdx = Math.min(savedCommands.length - 1, cmdHistoryIndex + 1);
                    setCmdHistoryIndex(nextIdx);
                    setCommandInput(savedCommands[nextIdx]);
                  }
                } else if (e.key === 'ArrowDown') {
                  if (cmdHistoryIndex > 0) {
                    const nextIdx = cmdHistoryIndex - 1;
                    setCmdHistoryIndex(nextIdx);
                    setCommandInput(savedCommands[nextIdx]);
                  } else {
                    setCmdHistoryIndex(-1);
                    setCommandInput('');
                  }
                }
              }}
              className="flex-1 bg-transparent text-emerald-400 focus:outline-none"
              autoFocus
            />
          </div>
          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  );
};
