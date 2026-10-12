import React, { useState } from 'react';
import { 
  X, Power, Monitor, Terminal, Globe, Settings, FileText, 
  Cpu, HardDrive, Check, Play, RefreshCw, Layers, ShieldCheck,
  Server as ServerIcon, Radio, Compass, Shuffle, ShieldAlert
} from 'lucide-react';
import { AccessListRule, NetworkDevice, NetworkLink, RouteEntry, DnsRecord } from '../../types/network';
import { CliMode, CliSession, cliPrompt, runCliScript, runRouterCommand } from '../../utils/routerCli';
import { findDevicePath } from '../../utils/simulationEngine';

interface CiscoDeviceModalProps {
  device: NetworkDevice;
  allDevices: NetworkDevice[];
  allLinks: NetworkLink[];
  isOpen: boolean;
  onClose: () => void;
  onSaveDevice: (updated: NetworkDevice) => void;
}

export const CiscoDeviceModal: React.FC<CiscoDeviceModalProps> = ({
  device,
  allDevices,
  allLinks,
  isOpen,
  onClose,
  onSaveDevice,
}) => {
  const [devData, setDevData] = useState<NetworkDevice>({ 
    ...device,
    powerState: device.powerState || 'on',
  });

  // Top Tabs: Physical | Config | CLI (for routers/switches) | Desktop (for PCs/laptops/servers) | Services (for servers)
  const isHost = devData.type === 'pc' || devData.type === 'laptop';
  const isRouter = devData.type === 'router';
  const isSwitch = devData.type === 'switch';
  const isServer = devData.type === 'server';

  const defaultTab = isRouter || isSwitch ? 'cli' : 'desktop';
  const [activeTab, setActiveTab] = useState<'physical' | 'config' | 'desktop' | 'cli' | 'services'>(defaultTab);

  // Desktop App open inside Desktop tab
  const [openDesktopApp, setOpenDesktopApp] = useState<'none' | 'ipconfig' | 'cmd' | 'browser' | 'terminal' | 'textedit'>('none');

  // Command Prompt (CMD) State
  const [cmdInput, setCmdInput] = useState<string>('');
  const [cmdOutput, setCmdOutput] = useState<string[]>([
    'Cisco Packet Tracer PC Command Prompt 2.1',
    'Type "help" or "ipconfig" or "ping <ip>" to begin.',
    '',
  ]);
  const [remoteTelnet, setRemoteTelnet] = useState<{ deviceId: string; stage: 'vty-password' | 'user' | 'enable-password' | 'priv'; session: CliSession } | null>(null);

  // Web Browser State
  const [browserUrl, setBrowserUrl] = useState<string>('http://192.168.2.100');
  const [renderedWebPage, setRenderedWebPage] = useState<string | null>(null);

  // Cisco IOS CLI State
  const [cliInput, setCliInput] = useState<string>('');
  const [cliMode, setCliMode] = useState<CliMode>('user');
  const [currentCliIface, setCurrentCliIface] = useState<string>('');
  const [cliProtocol, setCliProtocol] = useState<'rip' | 'ripng' | 'ospf' | 'eigrp' | 'bgp' | undefined>();
  const [powerAlertMessage, setPowerAlertMessage] = useState<string | null>(null);
  const [selectedModuleType, setSelectedModuleType] = useState<'HWIC-2T' | 'WIC-1T' | 'COVER'>('HWIC-2T');
  const [cliLog, setCliLog] = useState<string[]>([
    'Cisco IOS Software, 2900 Software (C2900-UNIVERSALK9-M), Version 15.1(4)M4, RELEASE SOFTWARE (fc2)',
    'Technical Support: http://www.cisco.com/techsupport',
    'Compiled Wed 15-Jun-11 08:35 by prod_rel_team',
    '',
    'Press RETURN to get started!',
    '',
  ]);

  // Selected interface in Config Tab
  const [selectedIfaceIdx, setSelectedIfaceIdx] = useState<number>(0);
  const [aclDraft, setAclDraft] = useState({ number: '101', action: 'deny' as 'permit' | 'deny', protocol: 'tcp' as AccessListRule['protocol'], source: 'any', destination: 'any', port: '' });
  const [aclError, setAclError] = useState('');

  if (!isOpen) return null;

  const handleCommit = (updated: NetworkDevice) => {
    setDevData(updated);
    onSaveDevice(updated);
  };

  const addAccessRule = () => {
    const normalize = (value: string) => {
      const address = value.trim().replace(/^host\s+/i, '');
      if (address.toLowerCase() === 'any') return 'any';
      return address.includes('/') ? address : `${address}/32`;
    };
    const port = aclDraft.port ? Number(aclDraft.port) : undefined;
    const validAddress = (value: string) => {
      const address = value.trim().replace(/^host\s+/i, '');
      if (address.toLowerCase() === 'any') return true;
      const [ip, prefixText] = address.split('/');
      const octets = ip.split('.');
      const prefix = prefixText === undefined ? 32 : Number(prefixText);
      return octets.length === 4 && octets.every(part => /^\d{1,3}$/.test(part) && Number(part) <= 255) && Number.isInteger(prefix) && prefix >= 0 && prefix <= 32;
    };
    if (!/^\d+$/.test(aclDraft.number) || Number(aclDraft.number) < 1 || Number(aclDraft.number) > 199 ||
        !validAddress(aclDraft.source) || !validAddress(aclDraft.destination) ||
        (port !== undefined && (!Number.isInteger(port) || port < 1 || port > 65535 || !['tcp', 'udp'].includes(aclDraft.protocol)))) {
      setAclError('Enter an ACL number from 1 to 199, valid IPv4 or any addresses, and a valid TCP/UDP port if used.');
      return;
    }
    setAclError('');
    const rule: AccessListRule = { id: `acl-ui-${Date.now()}`, number: aclDraft.number, action: aclDraft.action, protocol: aclDraft.protocol, source: normalize(aclDraft.source), destination: normalize(aclDraft.destination), ...(port ? { destinationPort: port } : {}) };
    handleCommit({ ...devData, accessLists: [...(devData.accessLists || []), rule] });
  };

  const togglePower = () => {
    const nextPower = devData.powerState === 'on' ? 'off' : 'on';
    const updated: NetworkDevice = {
      ...devData,
      powerState: nextPower,
      interfaces: devData.interfaces.map(i => ({
        ...i,
        status: nextPower === 'on' ? 'up' : 'down'
      }))
    };
    if (nextPower === 'off') {
      setCliLog(prev => [
        ...prev,
        '',
        '%SYS-5-RELOAD: Reload requested by power switch. System shutdown initiated.',
        `%LINK-5-CHANGED: Interface ${devData.interfaces[0]?.name || 'FastEthernet0'}, changed state to administratively down`,
        '[System is powered OFF. Turn on the power switch in the Physical tab or Top Bar to boot Cisco IOS engine.]',
        ''
      ]);
    } else {
      setCliLog(prev => [
        ...prev,
        '',
        'System Bootstrap, Version 15.1(4)M4, RELEASE SOFTWARE (fc2)',
        'Technical Support: http://www.cisco.com/techsupport',
        'Compiled Wed 15-Jun-11 08:35 by prod_rel_team',
        'POST: Memory test passed [512 MB].',
        'Decompressing image: c2900-universalk9-mz.SPA.151-4.M4.bin... [OK]',
        'Initializing GigabitEthernet / FastEthernet interfaces... OK',
        `%LINK-5-CHANGED: Interface ${devData.interfaces[0]?.name || 'FastEthernet0'}, changed state to up`,
        `%LINEPROTO-5-UPDOWN: Line protocol on Interface ${devData.interfaces[0]?.name || 'FastEthernet0'}, changed state to up`,
        '',
        'Press RETURN to get started!',
        ''
      ]);
    }
    handleCommit(updated);
  };

  const handleToggleModule = (slot: number, moduleName: 'HWIC-2T' | 'WIC-1T') => {
    if (devData.powerState === 'on') {
      setPowerAlertMessage('Cannot add or remove a module when the power is on. Turn off the device power switch first!');
      setTimeout(() => setPowerAlertMessage(null), 5000);
      return;
    }

    setPowerAlertMessage(null);
    const hasHWIC = devData.interfaces.some(i => i.name.startsWith('Serial0/0/0') || i.name.startsWith('Serial0/0'));

    if (moduleName === 'HWIC-2T') {
      if (hasHWIC) {
        // Remove HWIC-2T (removes serial ports)
        const updatedIfaces = devData.interfaces.filter(i => 
          !i.name.startsWith('Serial0/0/0') && 
          !i.name.startsWith('Serial0/0/1') && 
          !i.name.startsWith('Serial0/0') && 
          !i.name.startsWith('Serial0/1')
        );
        handleCommit({ ...devData, interfaces: updatedIfaces });
      } else {
        // Install HWIC-2T (adds 2 Serial interfaces)
        const newIfaces = [
          ...devData.interfaces,
          {
            id: `${devData.id}-se0`,
            name: 'Serial0/0/0',
            mac: `00:SE:01:00:00:01`,
            status: 'down' as const,
            clockRate: 64000
          },
          {
            id: `${devData.id}-se1`,
            name: 'Serial0/0/1',
            mac: `00:SE:01:00:00:02`,
            status: 'down' as const
          }
        ];
        handleCommit({ ...devData, interfaces: newIfaces });
      }
    } else if (moduleName === 'WIC-1T') {
      const hasWic1 = devData.interfaces.some(i => i.name === 'Serial0/1/0' || i.name === 'Serial0/2');
      if (hasWic1) {
        const updatedIfaces = devData.interfaces.filter(i => i.name !== 'Serial0/1/0' && i.name !== 'Serial0/2');
        handleCommit({ ...devData, interfaces: updatedIfaces });
      } else {
        const newIfaces = [
          ...devData.interfaces,
          {
            id: `${devData.id}-se2`,
            name: 'Serial0/1/0',
            mac: `00:SE:01:00:00:03`,
            status: 'down' as const
          }
        ];
        handleCommit({ ...devData, interfaces: newIfaces });
      }
    }
  };

  // -------------------------------------------------------------
  // Command Prompt (CMD) Execution Logic
  // -------------------------------------------------------------
  const handleCmdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawCmd = cmdInput.trim();
    if (!rawCmd) return;

    const tokens = rawCmd.split(/\s+/);
    const cmd = tokens[0].toLowerCase();
    const args = tokens.slice(1);

    const newLines = [`C:\\> ${rawCmd}`];

    if (remoteTelnet) {
      const remote = allDevices.find(item => item.id === remoteTelnet.deviceId);
      if (!remote) { setRemoteTelnet(null); newLines.push('Telnet peer is no longer in this topology.'); }
      else if (remoteTelnet.stage === 'vty-password') {
        if (rawCmd !== remote.lineConfig?.vty?.password) newLines.push('% Login invalid.');
        else { setRemoteTelnet({ ...remoteTelnet, stage: 'user' }); newLines.push('User Access Verification', `${remote.name}>`); }
      } else if (remoteTelnet.stage === 'user' && cmd === 'enable') {
        setRemoteTelnet({ ...remoteTelnet, stage: 'enable-password' }); newLines.push('Password:');
      } else if (remoteTelnet.stage === 'enable-password') {
        if (rawCmd !== remote.enableSecret) newLines.push('% Access denied.');
        else setRemoteTelnet({ ...remoteTelnet, stage: 'priv', session: { ...remoteTelnet.session, mode: 'priv' } });
      } else {
        const mode = remoteTelnet.stage === 'user' ? 'user' : remoteTelnet.session.mode;
        const result = runRouterCommand(remote, { ...remoteTelnet.session, mode }, rawCmd);
        if (result.device !== remote) onSaveDevice(result.device);
        setRemoteTelnet({ ...remoteTelnet, stage: result.session.mode === 'priv' ? 'priv' : remoteTelnet.stage, session: result.session });
        newLines.push(`${cliPrompt(remote, mode)} ${rawCmd}`, ...result.output);
      }
      setCmdOutput(prev => [...prev, ...newLines]);
      setCmdInput('');
      return;
    }

    if (cmd === 'cls' || cmd === 'clear') {
      setCmdOutput([]);
      setCmdInput('');
      return;
    }

    if (cmd === 'help') {
      newLines.push(
        'Available Cisco Packet Tracer CMD commands:',
        '  ipconfig           - Display IP addressing information',
        '  ipconfig /all      - Display detailed IP and MAC configuration',
        '  ipconfig /renew    - Request DHCP IP configuration',
        '  ping <ip-address>  - Send ICMP echo requests to target host',
        '  tracert <ip>       - Trace route hops to remote destination',
        '  arp -a             - Display current ARP resolution table',
        '  nslookup <domain>  - Query DNS server for IP resolution',
        '  cls                - Clear command prompt screen'
      );
    } else if (cmd === 'ipconfig') {
      const iface = devData.interfaces[0];
      if (args[0] === '/all') {
        newLines.push(
          'FastEthernet0 Connection:',
          `  Physical Address. . . . . . . . . : ${iface?.mac || '00:00:00:00:00:00'}`,
          `  DHCP Enabled. . . . . . . . . . . : ${devData.configMode === 'dhcp' ? 'Yes' : 'No'}`,
          `  IP Address. . . . . . . . . . . . : ${iface?.ip || '0.0.0.0'}`,
          `  Subnet Mask . . . . . . . . . . . : ${iface?.subnetMask || '0.0.0.0'}`,
          `  Default Gateway . . . . . . . . . : ${devData.defaultGateway || '0.0.0.0'}`,
          `  DNS Servers . . . . . . . . . . . : ${devData.dnsServer || '0.0.0.0'}`
        );
      } else if (args[0] === '/renew') {
        // Query DHCP Server in network
        const dhcpServer = allDevices.find(d => d.serverServices?.dhcpEnabled && d.powerState !== 'off');
        if (dhcpServer?.serverServices?.dhcpPool) {
          const pool = dhcpServer.serverServices.dhcpPool;
          const assignedIp = pool.startIp || '192.168.1.150';
          const updatedIfaces = [...devData.interfaces];
          updatedIfaces[0] = {
            ...updatedIfaces[0],
            ip: assignedIp,
            subnetMask: pool.subnetMask || '255.255.255.0'
          };
          const updated: NetworkDevice = {
            ...devData,
            configMode: 'dhcp',
            defaultGateway: pool.gateway || '192.168.1.1',
            dnsServer: pool.dnsServer || '8.8.8.8',
            interfaces: updatedIfaces
          };
          handleCommit(updated);
          newLines.push(
            'DHCP renewal successful:',
            `  Assigned IP Address . . . : ${assignedIp}`,
            `  Subnet Mask . . . . . . . : ${pool.subnetMask || '255.255.255.0'}`,
            `  Default Gateway . . . . . : ${pool.gateway || '192.168.1.1'}`,
            `  DNS Server. . . . . . . . : ${pool.dnsServer || '8.8.8.8'}`
          );
        } else {
          newLines.push('DHCP request failed: No active DHCP server found on the network.');
        }
      } else {
        newLines.push(
          'FastEthernet0 Connection:',
          `  IP Address. . . . . . . . . : ${iface?.ip || '0.0.0.0'}`,
          `  Subnet Mask . . . . . . . . : ${iface?.subnetMask || '0.0.0.0'}`,
          `  Default Gateway . . . . . . : ${devData.defaultGateway || '0.0.0.0'}`
        );
      }
    } else if (cmd === 'telnet') {
      const targetIp = args[0];
      const target = allDevices.find(item => item.interfaces.some(iface => iface.ip === targetIp) && ['router', 'switch'].includes(item.type));
      const vty = target?.lineConfig?.vty;
      if (!targetIp || !target) newLines.push('Connection failed: no router or switch uses that IPv4 address.');
      else if (!findDevicePath(allDevices, allLinks, devData.id, target.id)) newLines.push('Connection failed: no operational network path to the remote device.');
      else if (!vty?.login || !vty.password || !['telnet', 'all'].includes(vty.transport || 'telnet')) newLines.push('Connection refused: VTY lines require login, a password, and transport input telnet.');
      else if (!target.enableSecret) newLines.push('Connection opened, but remote privileged EXEC is unavailable until an enable secret is configured.');
      else {
        setRemoteTelnet({ deviceId: target.id, stage: 'vty-password', session: { mode: 'user', selectedInterface: '' } });
        newLines.push(`Connecting to ${targetIp}...`, 'User Access Verification', 'Password:');
      }
    } else if (cmd === 'ping') {
      const targetIp = args[0];
      if (!targetIp) {
        newLines.push('Usage: ping <target-ip-address>');
      } else if (devData.powerState === 'off') {
        newLines.push('Device is powered OFF. Cannot send packets.');
      } else {
        const myIface = devData.interfaces[0];
        const myIp = myIface?.ip;
        
        newLines.push(`Pinging ${targetIp} with 32 bytes of data:`);
        
        // Find destination device
        const targetDev = allDevices.find(d => 
          d.interfaces.some(i => i.ip === targetIp) && d.powerState !== 'off'
        );

        if (!myIp) {
          newLines.push('Source device does not have an IP address configured.');
          newLines.push(`Ping statistics for ${targetIp}: Packets: Sent = 4, Received = 0, Lost = 4 (100% loss)`);
        } else if (!targetDev) {
          newLines.push('Request timed out.');
          newLines.push('Request timed out.');
          newLines.push('Request timed out.');
          newLines.push('Request timed out.');
          newLines.push(`Ping statistics for ${targetIp}: Packets: Sent = 4, Received = 0, Lost = 4 (100% loss)`);
        } else {
          // Check if on same subnet
          const myMask = myIface.subnetMask || '255.255.255.0';
          const targetIface = targetDev.interfaces.find(i => i.ip === targetIp)!;
          const targetMask = targetIface.subnetMask || '255.255.255.0';

          const myNet = myIp.split('.').slice(0, 3).join('.');
          const targetNet = targetIp.split('.').slice(0, 3).join('.');

          const sameSubnet = (myNet === targetNet) && (myMask === targetMask);

          if (sameSubnet) {
            // Direct L2 ping
            newLines.push(
              `Reply from ${targetIp}: bytes=32 time=1ms TTL=128`,
              `Reply from ${targetIp}: bytes=32 time=1ms TTL=128`,
              `Reply from ${targetIp}: bytes=1ms TTL=128`,
              `Reply from ${targetIp}: bytes=32 time<1ms TTL=128`,
              '',
              `Ping statistics for ${targetIp}:`,
              `    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),`,
              `Approximate round trip times in milli-seconds:`,
              `    Minimum = 0ms, Maximum = 1ms, Average = 0ms`
            );
            // Update ARP cache
            const updatedArp = { ...(devData.arpCache || {}), [targetIp]: targetIface.mac };
            handleCommit({ ...devData, arpCache: updatedArp });
          } else {
            // Requires default gateway and router
            if (!devData.defaultGateway) {
              newLines.push(
                'Destination host unreachable (Default Gateway not configured on source host).',
                'Request timed out.',
                'Request timed out.',
                'Request timed out.',
                `Ping statistics for ${targetIp}: Packets: Sent = 4, Received = 0, Lost = 4 (100% loss)`
              );
            } else {
              // Has gateway: reply with TTL=127 (router hop)
              newLines.push(
                `Reply from ${targetIp}: bytes=32 time=3ms TTL=127`,
                `Reply from ${targetIp}: bytes=32 time=2ms TTL=127`,
                `Reply from ${targetIp}: bytes=32 time=2ms TTL=127`,
                `Reply from ${targetIp}: bytes=32 time=2ms TTL=127`,
                '',
                `Ping statistics for ${targetIp}:`,
                `    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),`,
                `Approximate round trip times in milli-seconds:`,
                `    Minimum = 2ms, Maximum = 3ms, Average = 2ms`
              );
            }
          }
        }
      }
    } else if (cmd === 'tracert') {
      const targetIp = args[0];
      if (!targetIp) {
        newLines.push('Usage: tracert <target-ip-address>');
      } else {
        newLines.push(`Tracing route to ${targetIp} over a maximum of 30 hops:`);
        if (devData.defaultGateway) {
          newLines.push(`  1    1 ms    1 ms    1 ms  ${devData.defaultGateway}`);
          newLines.push(`  2    2 ms    2 ms    2 ms  ${targetIp}`);
          newLines.push('Trace complete.');
        } else {
          newLines.push(`  1    1 ms    1 ms    1 ms  ${targetIp}`);
          newLines.push('Trace complete.');
        }
      }
    } else if (cmd === 'arp') {
      if (args[0] === '-a') {
        newLines.push('Interface: FastEthernet0');
        newLines.push('  Internet Address      Physical Address      Type');
        const arpEntries = Object.entries(devData.arpCache || {});
        if (arpEntries.length === 0) {
          newLines.push('  No ARP Entries Found.');
        } else {
          arpEntries.forEach(([ip, mac]) => {
            newLines.push(`  ${ip.padEnd(20, ' ')}  ${mac.padEnd(20, ' ')}  dynamic`);
          });
        }
      } else {
        newLines.push('Usage: arp -a');
      }
    } else if (cmd === 'nslookup') {
      const domain = args[0];
      if (!domain) {
        newLines.push('Usage: nslookup <domain-name>');
      } else {
        const dnsSrv = allDevices.find(d => d.serverServices?.dnsEnabled);
        const record = dnsSrv?.serverServices?.dnsRecords.find(r => r.domain.toLowerCase() === domain.toLowerCase());
        newLines.push(`Server:  ${devData.dnsServer || '192.168.2.100'}`);
        newLines.push('Address: ' + (devData.dnsServer || '192.168.2.100'));
        newLines.push('');
        if (record) {
          newLines.push(`Non-authoritative answer:`);
          newLines.push(`Name:    ${record.domain}`);
          newLines.push(`Address: ${record.ip}`);
        } else {
          newLines.push(`*** DNS server can't find ${domain}: Non-existent domain`);
        }
      }
    } else {
      newLines.push(`'${cmd}' is not recognized as an internal or external command, operable program or batch file.`);
    }

    setCmdOutput(prev => [...prev, ...newLines]);
    setCmdInput('');
  };

  // -------------------------------------------------------------
  // Web Browser Request Logic
  // -------------------------------------------------------------
  const handleBrowse = () => {
    let cleanUrl = browserUrl.trim().replace(/^https?:\/\//i, '');
    cleanUrl = cleanUrl.split('/')[0]; // domain or ip

    // Find if it's domain or IP
    let targetIp = cleanUrl;
    const dnsSrv = allDevices.find(d => d.serverServices?.dnsEnabled);
    if (dnsSrv?.serverServices?.dnsRecords) {
      const match = dnsSrv.serverServices.dnsRecords.find(r => r.domain.toLowerCase() === cleanUrl.toLowerCase());
      if (match) targetIp = match.ip;
    }

    // Find server with this IP
    const webServer = allDevices.find(d => 
      d.interfaces.some(i => i.ip === targetIp) && 
      d.serverServices?.httpEnabled && 
      d.powerState !== 'off'
    );

    if (webServer?.serverServices?.httpContent) {
      setRenderedWebPage(webServer.serverServices.httpContent);
    } else {
      setRenderedWebPage(`
        <div style="font-family:sans-serif; padding: 24px; color: #f87171;">
          <h2>404 Not Found / Connection Timed Out</h2>
          <p>Could not connect to HTTP server at <strong>${browserUrl}</strong>.</p>
          <p>Make sure the target server has HTTP service enabled and an IP address configured.</p>
        </div>
      `);
    }
  };

  // -------------------------------------------------------------
  // Cisco IOS CLI Engine (Router / Switch)
  // -------------------------------------------------------------
  const getPrompt = () => {
    return cliPrompt(devData, cliMode);
  };

  const handleCliSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawCmd = cliInput.trim();
    const currentPrompt = getPrompt();

    if (!rawCmd) {
      setCliLog(prev => [...prev, currentPrompt]);
      setCliInput('');
      return;
    }

    const cdpNeighbors = devData.cdpEnabled === false ? [] : allLinks.flatMap(link => {
      if (link.status !== 'up' || link.cableType === 'console') return [];
      const localIsSource = link.sourceDeviceId === devData.id;
      const localIsTarget = link.targetDeviceId === devData.id;
      if (!localIsSource && !localIsTarget) return [];
      const localPortId = localIsSource ? link.sourcePortId : link.targetPortId;
      const remoteDeviceId = localIsSource ? link.targetDeviceId : link.sourceDeviceId;
      const remotePortId = localIsSource ? link.targetPortId : link.sourcePortId;
      const localPort = devData.interfaces.find(iface => iface.id === localPortId);
      const remoteDevice = allDevices.find(item => item.id === remoteDeviceId);
      const remotePort = remoteDevice?.interfaces.find(iface => iface.id === remotePortId);
      if (devData.powerState !== 'on' || localPort?.status !== 'up' || remoteDevice?.powerState !== 'on' || remoteDevice.cdpEnabled === false || remotePort?.status !== 'up') return [];
      return [{ deviceName: remoteDevice.name, localInterface: localPort.name, remoteInterface: remotePort.name, capability: remoteDevice.type === 'router' ? 'R' : remoteDevice.type === 'switch' ? 'S' : 'H' }];
    });
    const result = runCliScript(devData, { mode: cliMode, selectedInterface: currentCliIface, protocol: cliProtocol, cdpNeighbors }, rawCmd);
    setCliMode(result.session.mode);
    setCurrentCliIface(result.session.selectedInterface);
    setCliProtocol(result.session.protocol);
    if (result.device !== devData) handleCommit(result.device);
    setCliLog(prev => [...prev, `${currentPrompt} ${rawCmd}`, ...result.output]);
    setCliInput('');
  };

  const selectedIface = devData.interfaces[selectedIfaceIdx] || devData.interfaces[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      {/* Authentic Cisco Packet Tracer Device Window Frame */}
      <div className="flex flex-col w-full max-w-4xl bg-slate-900 border-2 border-slate-700 rounded-lg shadow-2xl overflow-hidden max-h-[90vh]">
        
        {/* Title Bar (Classic Cisco PT style) */}
        <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-700 text-xs select-none">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded bg-sky-500/20 border border-sky-400 flex items-center justify-center">
              <span className="text-[9px] font-bold text-sky-400 font-mono">PT</span>
            </div>
            <span className="font-bold text-white tracking-wide">
              {devData.name} ({devData.model || devData.type.toUpperCase()})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={togglePower}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold transition-all border ${
                devData.powerState === 'on'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                  : 'bg-rose-500/20 text-rose-400 border-rose-500/50'
              }`}
            >
              <Power className="w-3 h-3" />
              <span>PWR: {devData.powerState === 'on' ? 'ON' : 'OFF'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cisco Packet Tracer Primary Tabs Bar */}
        <div className="flex items-center gap-1 px-4 pt-2 bg-slate-950 border-b border-slate-800 text-xs font-semibold">
          <button
            onClick={() => { setActiveTab('physical'); setOpenDesktopApp('none'); }}
            className={`px-4 py-2 rounded-t-md transition-colors border-t-2 ${
              activeTab === 'physical'
                ? 'bg-slate-900 text-sky-400 border-sky-400'
                : 'text-slate-400 hover:text-white border-transparent'
            }`}
          >
            Physical
          </button>
          <button
            onClick={() => { setActiveTab('config'); setOpenDesktopApp('none'); }}
            className={`px-4 py-2 rounded-t-md transition-colors border-t-2 ${
              activeTab === 'config'
                ? 'bg-slate-900 text-sky-400 border-sky-400'
                : 'text-slate-400 hover:text-white border-transparent'
            }`}
          >
            Config
          </button>

          {/* Desktop Tab for Host Devices */}
          {(isHost || isServer) && (
            <button
              onClick={() => { setActiveTab('desktop'); setOpenDesktopApp('none'); }}
              className={`px-4 py-2 rounded-t-md transition-colors border-t-2 ${
                activeTab === 'desktop'
                  ? 'bg-slate-900 text-sky-400 border-sky-400'
                  : 'text-slate-400 hover:text-white border-transparent'
              }`}
            >
              Desktop
            </button>
          )}

          {/* CLI Tab for Intermediary Devices */}
          {(isRouter || isSwitch) && (
            <button
              onClick={() => { setActiveTab('cli'); setOpenDesktopApp('none'); }}
              className={`px-4 py-2 rounded-t-md transition-colors border-t-2 ${
                activeTab === 'cli'
                  ? 'bg-slate-900 text-emerald-400 border-emerald-400'
                  : 'text-slate-400 hover:text-white border-transparent'
              }`}
            >
              CLI
            </button>
          )}

          {/* Services Tab for Servers */}
          {isServer && (
            <button
              onClick={() => { setActiveTab('services'); setOpenDesktopApp('none'); }}
              className={`px-4 py-2 rounded-t-md transition-colors border-t-2 ${
                activeTab === 'services'
                  ? 'bg-slate-900 text-amber-400 border-amber-400'
                  : 'text-slate-400 hover:text-white border-transparent'
              }`}
            >
              Services
            </button>
          )}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-900 min-h-[460px] text-xs">
          
          {/* 1. PHYSICAL TAB */}
          {activeTab === 'physical' && (
            <div className="flex flex-col gap-4">
              
              {/* Power Alert Banner (Authentic Cisco Packet Tracer Warning) */}
              {powerAlertMessage && (
                <div className="p-3 bg-rose-950/80 border border-rose-500 rounded-lg text-rose-300 flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="font-semibold">{powerAlertMessage}</span>
                  </div>
                  <button
                    onClick={() => setPowerAlertMessage(null)}
                    className="text-rose-400 hover:text-white font-bold text-xs"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Physical Chassis with Expansion Slots */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg flex flex-col items-center justify-center min-h-[220px] relative">
                {/* Physical Chassis Representation */}
                <div className="w-full max-w-2xl bg-slate-800 border-4 border-slate-700 rounded-md p-4 shadow-inner flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                    <div>
                      <span className="font-mono font-bold text-slate-300 uppercase tracking-widest text-sm block">
                        CISCO {devData.model || devData.type.toUpperCase()} SERIES
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Modular Architecture · Expansion Slots with HWIC-2T Support
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-semibold">Rocker Power:</span>
                      <button
                        onClick={togglePower}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          devData.powerState === 'on'
                            ? 'bg-emerald-500 border-emerald-300 shadow-[0_0_12px_#10b981]'
                            : 'bg-rose-900 border-rose-600'
                        }`}
                        title="Click to Toggle Hardware Power Switch"
                      >
                        <Power className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                  </div>

                  {/* Ports / NIC visualization */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-mono">Onboard Interface Ports & Link LEDs:</span>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 py-1">
                      {devData.interfaces.map((iface) => (
                        <div
                          key={iface.id}
                          className="flex flex-col items-center p-2 rounded bg-slate-900 border border-slate-700"
                        >
                          <div className={`w-2.5 h-2.5 rounded-full mb-1 ${
                            devData.powerState === 'on' && iface.status === 'up'
                              ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]'
                              : 'bg-slate-700'
                          }`} />
                          <span className="font-mono text-[9px] text-slate-300">{iface.name}</span>
                          <span className="text-[8px] text-slate-500 uppercase">{iface.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Expansion Slots for Routers (HWIC-2T & WIC-1T) */}
                  {isRouter && (
                    <div className="pt-2 border-t border-slate-700 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider font-mono">
                          WAN Interface Card Slots (HWIC-2T / WIC-1T)
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {devData.powerState === 'off' ? 'Power OFF: Ready for Module Swap' : 'Power ON: Locked'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Slot 0: HWIC-2T */}
                        <div className="p-2.5 rounded bg-slate-900 border border-slate-700 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-mono">Slot 0:</span>
                            <span className="font-mono font-bold text-white text-xs">
                              {devData.interfaces.some(i => i.name.startsWith('Serial0/0')) ? 'HWIC-2T (2 Serial Ports)' : 'Empty Slot'}
                            </span>
                          </div>
                          <button
                            onClick={() => handleToggleModule(0, 'HWIC-2T')}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors ${
                              devData.interfaces.some(i => i.name.startsWith('Serial0/0'))
                                ? 'bg-rose-950 border border-rose-700 text-rose-300 hover:bg-rose-900'
                                : 'bg-emerald-950 border border-emerald-700 text-emerald-300 hover:bg-emerald-900'
                            }`}
                          >
                            {devData.interfaces.some(i => i.name.startsWith('Serial0/0')) ? 'Remove HWIC-2T' : 'Insert HWIC-2T'}
                          </button>
                        </div>

                        {/* Slot 1: WIC-1T */}
                        <div className="p-2.5 rounded bg-slate-900 border border-slate-700 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-mono">Slot 1:</span>
                            <span className="font-mono font-bold text-white text-xs">
                              {devData.interfaces.some(i => i.name === 'Serial0/1/0' || i.name === 'Serial0/2') ? 'WIC-1T (1 Serial Port)' : 'Empty Slot'}
                            </span>
                          </div>
                          <button
                            onClick={() => handleToggleModule(1, 'WIC-1T')}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors ${
                              devData.interfaces.some(i => i.name === 'Serial0/1/0' || i.name === 'Serial0/2')
                                ? 'bg-rose-950 border border-rose-700 text-rose-300 hover:bg-rose-900'
                                : 'bg-sky-950 border border-sky-700 text-sky-300 hover:bg-sky-900'
                            }`}
                          >
                            {devData.interfaces.some(i => i.name === 'Serial0/1/0' || i.name === 'Serial0/2') ? 'Remove WIC-1T' : 'Insert WIC-1T'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-700/60 pt-2 font-mono">
                    <span>SERIAL: SN-CSCO-{devData.id.slice(-6).toUpperCase()}</span>
                    <span>100-240V ~ 50/60Hz 1.5A</span>
                  </div>
                </div>
              </div>

              {/* Module Inventory List */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <h4 className="font-bold text-white mb-2 uppercase text-[11px] tracking-wider">
                  Installed Network Interface Modules
                </h4>
                <div className="space-y-1.5 font-mono text-[11px]">
                  {devData.interfaces.map(i => (
                    <div key={i.id} className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-sky-400 font-semibold">{i.name}</span>
                      <span className="text-slate-400">MAC: {i.mac}</span>
                      {i.clockRate && <span className="text-amber-400 text-[10px]">Clock: {i.clockRate} bps</span>}
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        i.status === 'up' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                      }`}>
                        {i.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. CONFIG TAB */}
          {activeTab === 'config' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Left Settings Navigation */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
                <div className="font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-2">
                  Global Settings
                </div>
                <button
                  onClick={() => setSelectedIfaceIdx(-1)}
                  className={`w-full text-left px-3 py-1.5 rounded transition-colors ${
                    selectedIfaceIdx === -1 ? 'bg-sky-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  Global & Routing
                </button>

                <div className="font-bold text-slate-400 uppercase text-[10px] tracking-wider mt-4 mb-2">
                  Interface Hardware
                </div>
                {devData.interfaces.map((iface, idx) => (
                  <button
                    key={iface.id}
                    onClick={() => setSelectedIfaceIdx(idx)}
                    className={`w-full text-left px-3 py-1.5 rounded font-mono transition-colors ${
                      selectedIfaceIdx === idx ? 'bg-sky-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    {iface.name}
                  </button>
                ))}
              </div>

              {/* Right Settings Configuration Form */}
              <div className="md:col-span-2 p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-4">
                {selectedIfaceIdx === -1 ? (
                  /* Global Settings */
                  <div className="space-y-4">
                    <h4 className="font-bold text-white text-sm border-b border-slate-800 pb-2">
                      Global Network Settings
                    </h4>
                    <div>
                      <label className="block text-slate-400 mb-1">Display Name</label>
                      <input
                        type="text"
                        value={devData.name}
                        onChange={(e) => handleCommit({ ...devData, name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Default Gateway (IPv4)</label>
                      <input
                        type="text"
                        placeholder="e.g. 192.168.1.1"
                        value={devData.defaultGateway || ''}
                        onChange={(e) => handleCommit({ ...devData, defaultGateway: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">DNS Server (IPv4)</label>
                      <input
                        type="text"
                        placeholder="e.g. 192.168.2.100"
                        value={devData.dnsServer || ''}
                        onChange={(e) => handleCommit({ ...devData, dnsServer: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Default Gateway (IPv6)</label>
                      <input
                        type="text"
                        placeholder="2001:db8:1::1"
                        value={devData.defaultGatewayV6 || ''}
                        onChange={(e) => handleCommit({ ...devData, defaultGatewayV6: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white font-mono"
                      />
                    </div>
                    {isRouter && (
                      <label className="flex items-center gap-2 rounded border border-slate-800 bg-slate-900 p-3 text-slate-200">
                        <input type="checkbox" checked={Boolean(devData.ipv6RoutingEnabled)} onChange={(event) => handleCommit({ ...devData, ipv6RoutingEnabled: event.target.checked })} />
                        Enable IPv6 unicast routing
                      </label>
                    )}
                    {isSwitch && (
                      <div>
                        <label className="block text-slate-400 mb-1">Spanning Tree Mode</label>
                        <select value={devData.spanningTreeMode || 'rapid-pvst'} onChange={(event) => handleCommit({ ...devData, spanningTreeMode: event.target.value as 'pvst' | 'rapid-pvst' | 'off' })} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white">
                          <option value="pvst">PVST</option><option value="rapid-pvst">Rapid-PVST (educational)</option><option value="off">Off</option>
                        </select>
                      </div>
                    )}
                    {isSwitch && (
                      <section className="space-y-2 rounded-lg border border-slate-800 bg-slate-900 p-3">
                        <div className="font-bold text-white">VTP VLAN Distribution</div>
                        <div className="grid grid-cols-2 gap-2">
                          <label className="text-slate-400">Domain
                            <input aria-label="VTP domain" maxLength={32} value={devData.vtpConfig?.domain || ''} onChange={event => handleCommit({ ...devData, vtpConfig: { mode: devData.vtpConfig?.mode || 'server', domain: event.target.value, version: devData.vtpConfig?.version || 1 } })} className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-white" placeholder="NETLEARN" />
                          </label>
                          <label className="text-slate-400">Mode
                            <select aria-label="VTP mode" value={devData.vtpConfig?.mode || 'server'} onChange={event => handleCommit({ ...devData, vtpConfig: { mode: event.target.value as 'server' | 'client' | 'transparent', domain: devData.vtpConfig?.domain || 'NETLEARN', version: devData.vtpConfig?.version || 1 } })} className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-white"><option value="server">Server</option><option value="client">Client</option><option value="transparent">Transparent</option></select>
                          </label>
                          <label className="text-slate-400">Version
                            <select aria-label="VTP version" value={devData.vtpConfig?.version || 1} onChange={event => handleCommit({ ...devData, vtpConfig: { mode: devData.vtpConfig?.mode || 'server', domain: devData.vtpConfig?.domain || 'NETLEARN', version: Number(event.target.value) as 1 | 2 | 3 } })} className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-white"><option value="1">Version 1</option><option value="2">Version 2</option><option value="3">Version 3 (modeled)</option></select>
                          </label>
                        </div>
                        <p className="text-[10px] text-slate-500">Matching domains share the server VLAN database across connected switches.</p>
                      </section>
                    )}
                    {isRouter && (
                      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900 p-3">
                        <div>
                          <h5 className="font-bold text-white">IPv4 Access Control Lists</h5>
                          <p className="mt-1 text-[10px] text-slate-400">Ordered first-match rules. Bind a list to an interface below; unmatched traffic is denied.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input aria-label="ACL number" value={aclDraft.number} onChange={event => setAclDraft({ ...aclDraft, number: event.target.value })} placeholder="101" className="rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-white font-mono" />
                          <select aria-label="ACL action" value={aclDraft.action} onChange={event => setAclDraft({ ...aclDraft, action: event.target.value as 'permit' | 'deny' })} className="rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-white"><option value="deny">Deny</option><option value="permit">Permit</option></select>
                          <select aria-label="ACL protocol" value={aclDraft.protocol} onChange={event => setAclDraft({ ...aclDraft, protocol: event.target.value as AccessListRule['protocol'] })} className="rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-white"><option value="ip">IP</option><option value="tcp">TCP</option><option value="udp">UDP</option><option value="icmp">ICMP</option></select>
                          <input aria-label="ACL destination port" inputMode="numeric" value={aclDraft.port} onChange={event => setAclDraft({ ...aclDraft, port: event.target.value })} placeholder="Destination port (optional)" className="rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-white font-mono" />
                          <input aria-label="ACL source address" value={aclDraft.source} onChange={event => setAclDraft({ ...aclDraft, source: event.target.value })} placeholder="Source: any or IPv4/prefix" className="rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-white font-mono" />
                          <input aria-label="ACL destination address" value={aclDraft.destination} onChange={event => setAclDraft({ ...aclDraft, destination: event.target.value })} placeholder="Destination: any or IPv4/prefix" className="rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-white font-mono" />
                        </div>
                        {aclError && <p role="alert" className="text-[10px] text-rose-300">{aclError}</p>}
                        <button onClick={addAccessRule} className="rounded bg-sky-600 px-3 py-1.5 font-bold text-white hover:bg-sky-500">Add ACL rule</button>
                        <div className="space-y-1">
                          {(devData.accessLists || []).map(rule => (
                            <div key={rule.id} className="flex items-center justify-between gap-2 rounded bg-slate-950 px-2 py-1.5 font-mono text-[10px] text-slate-300">
                              <span>{rule.number} {rule.action} {rule.protocol} {rule.source} → {rule.destination}{rule.destinationPort ? ` port ${rule.destinationPort}` : ''}</span>
                              <button aria-label={`Remove ACL rule ${rule.id}`} onClick={() => handleCommit({ ...devData, accessLists: (devData.accessLists || []).filter(item => item.id !== rule.id) })} className="text-rose-400 hover:text-rose-300">Remove</button>
                            </div>
                          ))}
                          {!devData.accessLists?.length && <p className="text-[10px] text-slate-500">No ACL rules configured.</p>}
                        </div>
                      </section>
                    )}
                    {isRouter && (
                      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900 p-3">
                        <div>
                          <h5 className="font-bold text-white">NAT Overload (PAT)</h5>
                          <p className="mt-1 text-[10px] text-slate-400">Uses a permitted IPv4 ACL to translate inside host addresses to the selected outside interface address.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <label className="text-xs text-slate-400">Source ACL
                            <select aria-label="NAT source ACL" value={devData.natOverload?.aclNumber || ''} onChange={event => {
                              const aclNumber = event.target.value;
                              handleCommit({ ...devData, natOverload: aclNumber && devData.natOverload?.outsideInterface ? { ...devData.natOverload, aclNumber } : undefined });
                            }} className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-white">
                              <option value="">Disabled</option>
                              {[...new Set((devData.accessLists || []).map(rule => rule.number))].map(number => <option key={number} value={number}>ACL {number}</option>)}
                            </select>
                          </label>
                          <label className="text-xs text-slate-400">Outside interface
                            <select aria-label="NAT outside interface" value={devData.natOverload?.outsideInterface || ''} onChange={event => {
                              const outsideInterface = event.target.value;
                              handleCommit({ ...devData, natOverload: outsideInterface && devData.natOverload?.aclNumber ? { ...devData.natOverload, outsideInterface } : undefined });
                            }} className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-white">
                              <option value="">Select interface</option>
                              {devData.interfaces.filter(iface => !iface.isConsole).map(iface => <option key={iface.id} value={iface.name}>{iface.name}</option>)}
                            </select>
                          </label>
                        </div>
                        {devData.natOverload && <p className="text-[10px] text-emerald-300">PAT configured: ACL {devData.natOverload.aclNumber} → {devData.natOverload.outsideInterface}. Mark ingress and egress interfaces below.</p>}
                      </section>
                    )}
                  </div>
                ) : (
                  /* Interface Settings */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h4 className="font-bold text-white text-sm font-mono">
                        Interface: {selectedIface?.name}
                      </h4>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedIface?.status === 'up'}
                          onChange={() => {
                            const updatedIfaces = [...devData.interfaces];
                            updatedIfaces[selectedIfaceIdx] = {
                              ...updatedIfaces[selectedIfaceIdx],
                              status: selectedIface?.status === 'up' ? 'down' : 'up'
                            };
                            handleCommit({ ...devData, interfaces: updatedIfaces });
                          }}
                          className="w-4 h-4 rounded text-sky-600 focus:ring-0"
                        />
                        <span className="font-semibold text-slate-200">Port Status [On]</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">MAC Address (Physical)</label>
                      <input
                        type="text"
                        readOnly
                        value={selectedIface?.mac || ''}
                        className="w-full px-3 py-1.5 bg-slate-900/60 border border-slate-800 rounded text-slate-400 font-mono"
                      />
                    </div>

                    <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-3">
                      {isSwitch && (
                        <label className="block text-slate-400">Switchport mode
                          <select aria-label="Switchport mode" value={selectedIface?.mode || 'access'} onChange={event => {
                            const mode = event.target.value as NonNullable<NetworkDevice['interfaces'][number]['mode']>;
                            const updatedIfaces = [...devData.interfaces];
                            updatedIfaces[selectedIfaceIdx] = { ...updatedIfaces[selectedIfaceIdx], mode, ...(mode === 'access' ? { allowedVlans: undefined } : {}) };
                            handleCommit({ ...devData, interfaces: updatedIfaces });
                          }} className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-white"><option value="access">Access</option><option value="trunk">Trunk</option><option value="dynamic-auto">DTP Dynamic Auto</option><option value="dynamic-desirable">DTP Dynamic Desirable</option></select>
                        </label>
                      )}
                      <div className="flex items-center gap-4 text-xs font-semibold">
                        <span>IP Configuration:</span>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name={`ip-mode-${selectedIface?.id}`}
                            checked={devData.configMode === 'dhcp'}
                            onChange={() => handleCommit({ ...devData, configMode: 'dhcp' })}
                          />
                          <span>DHCP</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name={`ip-mode-${selectedIface?.id}`}
                            checked={devData.configMode !== 'dhcp'}
                            onChange={() => handleCommit({ ...devData, configMode: 'static' })}
                          />
                          <span>Static</span>
                        </label>
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1">IPv4 Address</label>
                        <input
                          type="text"
                          placeholder="e.g. 192.168.1.10"
                          value={selectedIface?.ip || ''}
                          onChange={(e) => {
                            const updatedIfaces = [...devData.interfaces];
                            updatedIfaces[selectedIfaceIdx] = {
                              ...updatedIfaces[selectedIfaceIdx],
                              ip: e.target.value
                            };
                            handleCommit({ ...devData, interfaces: updatedIfaces });
                          }}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1">Subnet Mask</label>
                        <input
                          type="text"
                          placeholder="e.g. 255.255.255.0"
                          value={selectedIface?.subnetMask || ''}
                          onChange={(e) => {
                            const updatedIfaces = [...devData.interfaces];
                            updatedIfaces[selectedIfaceIdx] = {
                              ...updatedIfaces[selectedIfaceIdx],
                              subnetMask: e.target.value
                            };
                            handleCommit({ ...devData, interfaces: updatedIfaces });
                          }}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">IPv6 Address / Prefix</label>
                        <input
                          type="text"
                          placeholder="2001:db8:1::10/64"
                          value={selectedIface?.ipv6 ? (selectedIface.ipv6.includes('/') ? selectedIface.ipv6 : `${selectedIface.ipv6}/${selectedIface.ipv6Prefix ?? 64}`) : ''}
                          onChange={(event) => {
                            const [ipv6, prefixText] = event.target.value.split('/');
                            const updatedIfaces = [...devData.interfaces];
                            updatedIfaces[selectedIfaceIdx] = { ...updatedIfaces[selectedIfaceIdx], ipv6, ipv6Prefix: prefixText ? Number(prefixText) : undefined };
                            handleCommit({ ...devData, interfaces: updatedIfaces });
                          }}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-white font-mono"
                        />
                      </div>
                      {isRouter && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <label className="block text-slate-400">RIPng on this interface
                            <select aria-label="RIPng interface" value={devData.ripngConfig?.enabled && devData.ripngConfig.interfaces.includes(selectedIface?.id || '') ? 'enabled' : 'disabled'} onChange={event => {
                              const interfaceId = selectedIface?.id;
                              if (!interfaceId) return;
                              const enabled = event.target.value === 'enabled';
                              const current = devData.ripngConfig;
                              const processName = current?.processName || 'NETLEARN';
                              const interfaces = enabled ? [...new Set([...(current?.interfaces || []), interfaceId])] : (current?.interfaces || []).filter(id => id !== interfaceId);
                              handleCommit({ ...devData, ipv6RoutingEnabled: enabled ? true : devData.ipv6RoutingEnabled, ripngConfig: { enabled: true, processName, interfaces } });
                            }} className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-white">
                              <option value="disabled">Disabled</option><option value="enabled">Enabled (process NETLEARN)</option>
                            </select>
                          </label>
                          <label className="block text-slate-400">NAT interface role
                            <select aria-label="NAT interface role" value={selectedIface?.natRole || ''} onChange={(event) => {
                              const updatedIfaces = [...devData.interfaces];
                              updatedIfaces[selectedIfaceIdx] = { ...updatedIfaces[selectedIfaceIdx], natRole: (event.target.value || undefined) as 'inside' | 'outside' | undefined };
                              handleCommit({ ...devData, interfaces: updatedIfaces });
                            }} className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-white">
                              <option value="">Not configured</option><option value="inside">NAT inside</option><option value="outside">NAT outside</option>
                            </select>
                          </label>
                          {(['aclInbound', 'aclOutbound'] as const).map((direction) => (
                            <label key={direction} className="block text-slate-400">
                              {direction === 'aclInbound' ? 'Inbound IPv4 ACL' : 'Outbound IPv4 ACL'}
                              <select value={selectedIface?.[direction] || ''} onChange={(event) => {
                                const updatedIfaces = [...devData.interfaces];
                                updatedIfaces[selectedIfaceIdx] = { ...updatedIfaces[selectedIfaceIdx], [direction]: event.target.value || undefined };
                                handleCommit({ ...devData, interfaces: updatedIfaces });
                              }} className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-white">
                                <option value="">No ACL</option>
                                {[...new Set((devData.accessLists || []).map(rule => rule.number))].map(number => <option key={number} value={number}>ACL {number}</option>)}
                              </select>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. DESKTOP TAB (For PC / Laptop / Server) */}
          {activeTab === 'desktop' && (
            <div className="flex flex-col h-full min-h-[440px]">
              {openDesktopApp === 'none' && (
                /* Desktop Application Icons Grid (Packet Tracer Style) */
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 p-4">
                  
                  {/* IP Configuration App */}
                  <button
                    onClick={() => setOpenDesktopApp('ipconfig')}
                    className="flex flex-col items-center gap-2 p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-sky-500 rounded-xl transition-all group shadow-sm text-center"
                  >
                    <div className="w-12 h-12 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
                      <Settings className="w-6 h-6" />
                    </div>
                    <span className="font-semibold text-slate-200 group-hover:text-white">
                      IP Configuration
                    </span>
                  </button>

                  {/* Command Prompt (CMD) App */}
                  <button
                    onClick={() => setOpenDesktopApp('cmd')}
                    className="flex flex-col items-center gap-2 p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500 rounded-xl transition-all group shadow-sm text-center"
                  >
                    <div className="w-12 h-12 rounded-lg bg-black border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform font-mono font-bold text-sm">
                      {'>_'}
                    </div>
                    <span className="font-semibold text-slate-200 group-hover:text-white">
                      Command Prompt
                    </span>
                  </button>

                  {/* Web Browser App */}
                  <button
                    onClick={() => setOpenDesktopApp('browser')}
                    className="flex flex-col items-center gap-2 p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500 rounded-xl transition-all group shadow-sm text-center"
                  >
                    <div className="w-12 h-12 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                      <Globe className="w-6 h-6" />
                    </div>
                    <span className="font-semibold text-slate-200 group-hover:text-white">
                      Web Browser
                    </span>
                  </button>

                  {/* Terminal (Console) App */}
                  <button
                    onClick={() => setOpenDesktopApp('terminal')}
                    className="flex flex-col items-center gap-2 p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500 rounded-xl transition-all group shadow-sm text-center"
                  >
                    <div className="w-12 h-12 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                      <Terminal className="w-6 h-6" />
                    </div>
                    <span className="font-semibold text-slate-200 group-hover:text-white">
                      Terminal
                    </span>
                  </button>

                  {/* Text Editor App */}
                  <button
                    onClick={() => setOpenDesktopApp('textedit')}
                    className="flex flex-col items-center gap-2 p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-500 rounded-xl transition-all group shadow-sm text-center"
                  >
                    <div className="w-12 h-12 rounded-lg bg-slate-500/10 border border-slate-500/30 flex items-center justify-center text-slate-300 group-hover:scale-105 transition-transform">
                      <FileText className="w-6 h-6" />
                    </div>
                    <span className="font-semibold text-slate-200 group-hover:text-white">
                      Text Editor
                    </span>
                  </button>
                </div>
              )}

              {/* A. IP CONFIGURATION DESKTOP WINDOW */}
              {openDesktopApp === 'ipconfig' && (
                <div className="flex flex-col bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-4 max-w-xl mx-auto w-full">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <Settings className="w-4 h-4 text-sky-400" />
                      <span>IP Configuration</span>
                    </h3>
                    <button
                      onClick={() => setOpenDesktopApp('none')}
                      className="text-slate-400 hover:text-white font-bold px-2 py-0.5"
                    >
                      ✕ Close App
                    </button>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-semibold py-1">
                    <span>IP Configuration:</span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={devData.configMode === 'dhcp'}
                        onChange={() => {
                          // Automatic DHCP lookup
                          const dhcpServer = allDevices.find(d => d.serverServices?.dhcpEnabled && d.powerState !== 'off');
                          if (dhcpServer?.serverServices?.dhcpPool) {
                            const pool = dhcpServer.serverServices.dhcpPool;
                            const assignedIp = pool.startIp || '192.168.1.150';
                            const updatedIfaces = [...devData.interfaces];
                            updatedIfaces[0] = {
                              ...updatedIfaces[0],
                              ip: assignedIp,
                              subnetMask: pool.subnetMask || '255.255.255.0'
                            };
                            handleCommit({
                              ...devData,
                              configMode: 'dhcp',
                              defaultGateway: pool.gateway || '192.168.1.1',
                              dnsServer: pool.dnsServer || '8.8.8.8',
                              interfaces: updatedIfaces
                            });
                          } else {
                            handleCommit({ ...devData, configMode: 'dhcp' });
                          }
                        }}
                      />
                      <span>DHCP</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={devData.configMode !== 'dhcp'}
                        onChange={() => handleCommit({ ...devData, configMode: 'static' })}
                      />
                      <span>Static</span>
                    </label>
                  </div>

                  <div className="space-y-3 font-mono">
                    <div>
                      <label className="block text-slate-400 text-xs mb-1 font-sans">IPv4 Address</label>
                      <input
                        type="text"
                        value={devData.interfaces[0]?.ip || ''}
                        disabled={devData.configMode === 'dhcp'}
                        onChange={(e) => {
                          const updatedIfaces = [...devData.interfaces];
                          updatedIfaces[0] = { ...updatedIfaces[0], ip: e.target.value };
                          handleCommit({ ...devData, interfaces: updatedIfaces });
                        }}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white disabled:opacity-60"
                        placeholder="192.168.1.10"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 text-xs mb-1 font-sans">Subnet Mask</label>
                      <input
                        type="text"
                        value={devData.interfaces[0]?.subnetMask || ''}
                        disabled={devData.configMode === 'dhcp'}
                        onChange={(e) => {
                          const updatedIfaces = [...devData.interfaces];
                          updatedIfaces[0] = { ...updatedIfaces[0], subnetMask: e.target.value };
                          handleCommit({ ...devData, interfaces: updatedIfaces });
                        }}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white disabled:opacity-60"
                        placeholder="255.255.255.0"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 text-xs mb-1 font-sans">Default Gateway</label>
                      <input
                        type="text"
                        value={devData.defaultGateway || ''}
                        disabled={devData.configMode === 'dhcp'}
                        onChange={(e) => handleCommit({ ...devData, defaultGateway: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white disabled:opacity-60"
                        placeholder="192.168.1.1"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 text-xs mb-1 font-sans">DNS Server</label>
                      <input
                        type="text"
                        value={devData.dnsServer || ''}
                        disabled={devData.configMode === 'dhcp'}
                        onChange={(e) => handleCommit({ ...devData, dnsServer: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white disabled:opacity-60"
                        placeholder="192.168.2.100"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => setOpenDesktopApp('none')}
                      className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded font-bold transition-colors font-sans"
                    >
                      Save & Close
                    </button>
                  </div>
                </div>
              )}

              {/* B. COMMAND PROMPT (CMD) APP */}
              {openDesktopApp === 'cmd' && (
                <div className="flex flex-col h-full bg-black border border-slate-800 rounded-lg overflow-hidden font-mono text-xs">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950 border-b border-slate-800 text-slate-300">
                    <span className="font-bold flex items-center gap-2">
                      <span className="text-emerald-400">C:\&gt;</span> Command Prompt
                    </span>
                    <button
                      onClick={() => setOpenDesktopApp('none')}
                      className="text-slate-400 hover:text-white"
                    >
                      ✕ Close
                    </button>
                  </div>

                  <div className="flex-1 p-3 overflow-y-auto space-y-1 text-slate-200 select-text">
                    {cmdOutput.map((line, i) => (
                      <div key={i} className="whitespace-pre-wrap leading-relaxed">
                        {line}
                      </div>
                    ))}

                    <form onSubmit={handleCmdSubmit} className="flex items-center gap-1 mt-2">
                      <span className="text-emerald-400 font-bold">C:\&gt;</span>
                      <input
                        type="text"
                        value={cmdInput}
                        onChange={(e) => setCmdInput(e.target.value)}
                        autoFocus
                        className="flex-1 bg-transparent text-white focus:outline-none font-mono"
                        placeholder="Type 'help', 'ipconfig', 'ping 192.168.1.1'..."
                      />
                    </form>
                  </div>
                </div>
              )}

              {/* C. WEB BROWSER APP */}
              {openDesktopApp === 'browser' && (
                <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
                  {/* Address Bar */}
                  <div className="flex items-center gap-2 p-2 bg-slate-900 border-b border-slate-800">
                    <span className="font-bold text-slate-400 text-xs">URL:</span>
                    <input
                      type="text"
                      value={browserUrl}
                      onChange={(e) => setBrowserUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleBrowse()}
                      className="flex-1 px-3 py-1 bg-slate-950 border border-slate-700 rounded text-white font-mono text-xs"
                      placeholder="http://192.168.2.100 or http://www.cisco.lab"
                    />
                    <button
                      onClick={handleBrowse}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded text-xs transition-colors"
                    >
                      Go
                    </button>
                    <button
                      onClick={() => setOpenDesktopApp('none')}
                      className="text-slate-400 hover:text-white px-2"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Browser Viewport */}
                  <div className="flex-1 p-4 bg-white text-slate-900 overflow-y-auto">
                    {renderedWebPage ? (
                      <iframe
                        title="Simulated server page"
                        sandbox=""
                        referrerPolicy="no-referrer"
                        srcDoc={`<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; connect-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none';"></head><body>${renderedWebPage}</body></html>`}
                        className="h-full min-h-64 w-full border-0 bg-white"
                      />
                    ) : (
                      <div className="text-center text-slate-400 py-12">
                        <Globe className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="font-semibold">Cisco Packet Tracer Web Browser</p>
                        <p className="text-xs text-slate-500">
                          Enter URL in the address bar above and press Go.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* D. TERMINAL APP */}
              {openDesktopApp === 'terminal' && (
                <div className="flex flex-col h-full bg-black border border-slate-800 rounded-lg p-4 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                    <span className="font-bold text-amber-400">Terminal Configuration</span>
                    <button onClick={() => setOpenDesktopApp('none')} className="text-slate-400 hover:text-white">✕ Close</button>
                  </div>
                  <div className="space-y-2 text-slate-300">
                    <p>Bits per second: 9600</p>
                    <p>Data bits: 8</p>
                    <p>Parity: None</p>
                    <p>Stop bits: 1</p>
                    <p>Flow Control: None</p>
                    <p className="text-emerald-400 pt-3">
                      Connected to console port. Direct serial session established.
                    </p>
                  </div>
                </div>
              )}

              {/* E. TEXT EDITOR APP */}
              {openDesktopApp === 'textedit' && (
                <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-lg p-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                    <span className="font-bold text-slate-200">Text Editor - [Untitled.txt]</span>
                    <button onClick={() => setOpenDesktopApp('none')} className="text-slate-400 hover:text-white">✕ Close</button>
                  </div>
                  <textarea
                    className="flex-1 w-full p-2 bg-slate-900 border border-slate-800 rounded text-slate-200 font-mono text-xs resize-none"
                    placeholder="Type notes or commands here..."
                  />
                </div>
              )}
            </div>
          )}

          {/* 4. CLI TAB (Cisco IOS Terminal for Routers & Switches) */}
          {activeTab === 'cli' && (
            <div className="flex flex-col h-full min-h-[440px] bg-black border border-slate-800 rounded-lg overflow-hidden font-mono text-xs">
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950 border-b border-slate-800 text-slate-300">
                <span className="font-bold text-emerald-400">
                  {devData.name} - Cisco IOS Command Line Interface (CLI)
                </span>
                <button
                  onClick={() => setCliLog([])}
                  className="text-slate-400 hover:text-white text-[11px]"
                >
                  Clear Screen
                </button>
              </div>

              <div className="flex-1 p-3 overflow-y-auto space-y-1 text-slate-200 select-text">
                {cliLog.map((line, i) => (
                  <div key={i} className="whitespace-pre-wrap leading-relaxed">
                    {line}
                  </div>
                ))}

                {devData.powerState === 'off' ? (
                  <div className="mt-3 p-3 bg-rose-950/80 border border-rose-600 rounded flex items-center justify-between">
                    <div className="text-rose-200 text-xs">
                      <strong>Device is Powered OFF:</strong> Cisco IOS engine is halted. Press power switch to boot.
                    </div>
                    <button
                      type="button"
                      onClick={togglePower}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs transition-colors flex items-center gap-1.5 shadow-md"
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>Power ON Device</span>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleCliSubmit} className="flex items-center gap-1 mt-2">
                    <span className="text-emerald-400 font-bold whitespace-nowrap">
                      {getPrompt()}
                    </span>
                    <input
                      type="text"
                      value={cliInput}
                      onChange={(e) => setCliInput(e.target.value)}
                      autoFocus
                      className="flex-1 bg-transparent text-white focus:outline-none font-mono"
                      placeholder="Type 'enable', 'conf t', 'sh ip int br'..."
                    />
                  </form>
                )}
              </div>
            </div>
          )}

          {/* 5. SERVICES TAB (For Servers: HTTP, DHCP, DNS) */}
          {activeTab === 'services' && isServer && devData.serverServices && (
            <div className="space-y-6">
              {/* HTTP Service */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Globe className="w-4 h-4 text-indigo-400" />
                    <span>HTTP Web Service</span>
                  </h4>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold">
                    <input
                      type="checkbox"
                      checked={devData.serverServices.httpEnabled}
                      onChange={(e) => {
                        handleCommit({
                          ...devData,
                          serverServices: {
                            ...devData.serverServices!,
                            httpEnabled: e.target.checked
                          }
                        });
                      }}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-0"
                    />
                    <span>Service: [On]</span>
                  </label>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Web Page Content (index.html)</label>
                  <textarea
                    rows={4}
                    value={devData.serverServices.httpContent}
                    onChange={(e) => {
                      handleCommit({
                        ...devData,
                        serverServices: {
                          ...devData.serverServices!,
                          httpContent: e.target.value
                        }
                      });
                    }}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-slate-200 font-mono text-xs"
                  />
                </div>
              </div>

              {/* DHCP Service */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span>DHCP Service</span>
                  </h4>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold">
                    <input
                      type="checkbox"
                      checked={devData.serverServices.dhcpEnabled}
                      onChange={(e) => {
                        handleCommit({
                          ...devData,
                          serverServices: {
                            ...devData.serverServices!,
                            dhcpEnabled: e.target.checked
                          }
                        });
                      }}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-0"
                    />
                    <span>Service: [On]</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1 font-sans">Start IP Address</label>
                    <input
                      type="text"
                      value={devData.serverServices.dhcpPool.startIp}
                      onChange={(e) => {
                        handleCommit({
                          ...devData,
                          serverServices: {
                            ...devData.serverServices!,
                            dhcpPool: { ...devData.serverServices!.dhcpPool, startIp: e.target.value }
                          }
                        });
                      }}
                      className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-white"
                      placeholder="192.168.1.100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1 font-sans">Subnet Mask</label>
                    <input
                      type="text"
                      value={devData.serverServices.dhcpPool.subnetMask}
                      onChange={(e) => {
                        handleCommit({
                          ...devData,
                          serverServices: {
                            ...devData.serverServices!,
                            dhcpPool: { ...devData.serverServices!.dhcpPool, subnetMask: e.target.value }
                          }
                        });
                      }}
                      className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-white"
                      placeholder="255.255.255.0"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1 font-sans">Default Gateway</label>
                    <input
                      type="text"
                      value={devData.serverServices.dhcpPool.gateway}
                      onChange={(e) => {
                        handleCommit({
                          ...devData,
                          serverServices: {
                            ...devData.serverServices!,
                            dhcpPool: { ...devData.serverServices!.dhcpPool, gateway: e.target.value }
                          }
                        });
                      }}
                      className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-white"
                      placeholder="192.168.1.1"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1 font-sans">DNS Server</label>
                    <input
                      type="text"
                      value={devData.serverServices.dhcpPool.dnsServer}
                      onChange={(e) => {
                        handleCommit({
                          ...devData,
                          serverServices: {
                            ...devData.serverServices!,
                            dhcpPool: { ...devData.serverServices!.dhcpPool, dnsServer: e.target.value }
                          }
                        });
                      }}
                      className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-white"
                      placeholder="192.168.2.100"
                    />
                  </div>
                </div>
              </div>

              {/* DNS Service */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <span>DNS Service</span>
                  </h4>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold">
                    <input
                      type="checkbox"
                      checked={devData.serverServices.dnsEnabled}
                      onChange={(e) => {
                        handleCommit({
                          ...devData,
                          serverServices: {
                            ...devData.serverServices!,
                            dnsEnabled: e.target.checked
                          }
                        });
                      }}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-0"
                    />
                    <span>Service: [On]</span>
                  </label>
                </div>

                <div className="space-y-2">
                  <div className="text-slate-400 font-semibold text-xs">DNS Resource Records (A Record):</div>
                  <div className="space-y-1 font-mono text-xs">
                    {devData.serverServices.dnsRecords.map((rec, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                        <span className="text-sky-300 font-bold">{rec.domain}</span>
                        <span className="text-slate-400">Points to IP: {rec.ip}</span>
                        <span className="text-[10px] text-slate-500 uppercase">Type: A</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Status Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
          <span>Model: Cisco {devData.model || devData.type.toUpperCase()}</span>
          <div className="flex items-center gap-3">
            <span>FastEthernet0: {devData.interfaces[0]?.ip || 'Unconfigured'}</span>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded font-sans font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
