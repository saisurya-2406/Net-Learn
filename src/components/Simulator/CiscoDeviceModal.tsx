import React, { useState } from 'react';
import { 
  X, Power, Monitor, Terminal, Globe, Settings, FileText, 
  Cpu, HardDrive, Check, Play, RefreshCw, Layers, ShieldCheck,
  Server as ServerIcon, Radio, Compass, Shuffle, ShieldAlert
} from 'lucide-react';
import { NetworkDevice, NetworkLink, RouteEntry, DnsRecord } from '../../types/network';

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

  // Web Browser State
  const [browserUrl, setBrowserUrl] = useState<string>('http://192.168.2.100');
  const [renderedWebPage, setRenderedWebPage] = useState<string | null>(null);

  // Cisco IOS CLI State
  const [cliInput, setCliInput] = useState<string>('');
  const [cliMode, setCliMode] = useState<'user' | 'priv' | 'config' | 'config-if'>('user');
  const [currentCliIface, setCurrentCliIface] = useState<string>('GigabitEthernet0/0');
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

  if (!isOpen) return null;

  const handleCommit = (updated: NetworkDevice) => {
    setDevData(updated);
    onSaveDevice(updated);
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
    const hostname = devData.name || 'Router';
    switch (cliMode) {
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

  const handleCliSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawCmd = cliInput.trim();
    const currentPrompt = getPrompt();

    if (!rawCmd) {
      setCliLog(prev => [...prev, currentPrompt]);
      setCliInput('');
      return;
    }

    const tokens = rawCmd.split(/\s+/);
    const cmd0 = tokens[0]?.toLowerCase() || '';
    const cmd1 = tokens[1]?.toLowerCase() || '';
    const cmd2 = tokens[2]?.toLowerCase() || '';

    const newLines = [`${currentPrompt} ${rawCmd}`];

    if (cmd0 === 'enable' || cmd0 === 'en') {
      setCliMode('priv');
    } else if (cmd0 === 'disable') {
      setCliMode('user');
    } else if (cmd0 === 'configure' && (cmd1 === 'terminal' || cmd1 === 't') || cmd0 === 'conf' && cmd1 === 't') {
      if (cliMode === 'priv' || cliMode === 'config-if') {
        setCliMode('config');
        newLines.push('Enter configuration commands, one per line. End with CNTL/Z.');
      } else {
        newLines.push('% Command available in privileged mode only.');
      }
    } else if (cmd0 === 'hostname') {
      if (cliMode === 'config') {
        const newHost = tokens[1] || 'Router';
        handleCommit({ ...devData, name: newHost });
      } else {
        newLines.push('% Incomplete command or incorrect mode.');
      }
    } else if (cmd0 === 'interface' || cmd0 === 'int') {
      if (cliMode === 'config') {
        const ifaceArg = tokens.slice(1).join('');
        setCurrentCliIface(ifaceArg || 'GigabitEthernet0/0');
        setCliMode('config-if');
      } else {
        newLines.push('% Command requires configuration mode.');
      }
    } else if (cmd0 === 'ip' && cmd1 === 'address') {
      if (cliMode === 'config-if') {
        const ip = tokens[2];
        const mask = tokens[3];
        if (ip && mask) {
          const updatedIfaces = [...devData.interfaces];
          const ifaceIdx = updatedIfaces.findIndex(i => 
            i.name.toLowerCase().includes(currentCliIface.toLowerCase()) || 
            currentCliIface.toLowerCase().includes(i.name.toLowerCase())
          );
          if (ifaceIdx >= 0) {
            updatedIfaces[ifaceIdx] = {
              ...updatedIfaces[ifaceIdx],
              ip,
              subnetMask: mask
            };
            handleCommit({ ...devData, interfaces: updatedIfaces });
            newLines.push(`% IP address ${ip} ${mask} assigned to ${updatedIfaces[ifaceIdx].name}.`);
          } else if (updatedIfaces.length > 0) {
            updatedIfaces[0] = { ...updatedIfaces[0], ip, subnetMask: mask };
            handleCommit({ ...devData, interfaces: updatedIfaces });
            newLines.push(`% IP address ${ip} ${mask} assigned to ${updatedIfaces[0].name}.`);
          }
        } else {
          newLines.push('% Incomplete command: ip address <IP> <Subnet-Mask>');
        }
      } else {
        newLines.push('% Command must be run in interface configuration mode.');
      }
    } else if (cmd0 === 'no' && (cmd1 === 'shutdown' || cmd1 === 'shut')) {
      if (cliMode === 'config-if') {
        const updatedIfaces = devData.interfaces.map(i => ({ ...i, status: 'up' as const }));
        handleCommit({ ...devData, interfaces: updatedIfaces });
        newLines.push(`%LINK-5-CHANGED: Interface ${currentCliIface}, changed state to up`);
        newLines.push(`%LINEPROTO-5-UPDOWN: Line protocol on Interface ${currentCliIface}, changed state to up`);
      }
    } else if (cmd0 === 'shutdown' || cmd0 === 'shut') {
      if (cliMode === 'config-if') {
        const updatedIfaces = devData.interfaces.map(i => ({ ...i, status: 'down' as const }));
        handleCommit({ ...devData, interfaces: updatedIfaces });
        newLines.push(`%LINK-5-CHANGED: Interface ${currentCliIface}, changed state to administratively down`);
      }
    } else if (cmd0 === 'clock' && cmd1 === 'rate') {
      if (cliMode === 'config-if') {
        const rate = parseInt(tokens[2]) || 64000;
        const updatedIfaces = devData.interfaces.map(i => 
          i.name.toLowerCase().includes(currentCliIface.toLowerCase()) || currentCliIface.toLowerCase().includes(i.name.toLowerCase())
            ? { ...i, clockRate: rate }
            : i
        );
        handleCommit({ ...devData, interfaces: updatedIfaces });
        newLines.push(`% Clock rate set to ${rate} bps on DCE interface ${currentCliIface}`);
      } else {
        newLines.push('% Command must be run in interface configuration mode.');
      }
    } else if (cmd0 === 'bandwidth') {
      if (cliMode === 'config-if') {
        newLines.push(`% Bandwidth set to ${tokens[1] || '64'} Kbit`);
      }
    } else if (cmd0 === 'encapsulation' || cmd0 === 'encap') {
      if (cliMode === 'config-if') {
        newLines.push(`% Encapsulation set to ${tokens[1]?.toUpperCase() || 'HDLC'}`);
      }
    } else if (cmd0 === 'ip' && cmd1 === 'route') {
      if (cliMode === 'config') {
        const dest = tokens[2];
        const mask = tokens[3];
        const nextHop = tokens[4];
        if (dest && mask && nextHop) {
          const newRoute: RouteEntry = {
            id: `rt-${Date.now()}`,
            destinationNetwork: dest,
            subnetMask: mask,
            nextHop,
            interfaceName: devData.interfaces[0]?.name || 'Gi0/0'
          };
          handleCommit({
            ...devData,
            routingTable: [...(devData.routingTable || []), newRoute]
          });
          newLines.push(`% Static route added for ${dest}/${mask} via ${nextHop}.`);
        } else {
          newLines.push('% Incomplete command: ip route <network> <mask> <next-hop>');
        }
      }
    } else if ((cmd0 === 'show' || cmd0 === 'sh') && cmd1 === 'ip' && cmd2 === 'interface' || rawCmd.toLowerCase().startsWith('sh ip int br')) {
      newLines.push(
        'Interface                  IP-Address      OK? Method Status                Protocol',
        '--------------------------------------------------------------------------------------'
      );
      devData.interfaces.forEach(i => {
        const namePad = i.name.padEnd(26, ' ');
        const ipPad = (i.ip || 'unassigned').padEnd(16, ' ');
        const stat = (i.status === 'up' ? 'up' : 'administratively down').padEnd(22, ' ');
        newLines.push(`${namePad}${ipPad}YES manual ${stat}${i.status === 'up' ? 'up' : 'down'}`);
      });
    } else if ((cmd0 === 'show' || cmd0 === 'sh') && cmd1 === 'ip' && (cmd2 === 'route' || cmd2 === 'ro')) {
      newLines.push(
        'Codes: C - connected, S - static, R - RIP, O - OSPF',
        'Gateway of last resort is not set',
        ''
      );
      devData.interfaces.forEach(i => {
        if (i.ip && i.status === 'up') {
          newLines.push(`C    ${i.ip.split('.').slice(0, 3).join('.')}.0/24 is directly connected, ${i.name}`);
        }
      });
      (devData.routingTable || []).forEach(r => {
        newLines.push(`S    ${r.destinationNetwork} [1/0] via ${r.nextHop}`);
      });
    } else if (cmd0 === 'exit') {
      if (cliMode === 'config-if') setCliMode('config');
      else if (cliMode === 'config') setCliMode('priv');
      else if (cliMode === 'priv') setCliMode('user');
    } else if (cmd0 === 'end') {
      setCliMode('priv');
    } else if (cmd0 === 'ping') {
      const target = tokens[1];
      newLines.push(
        `Type escape sequence to abort.`,
        `Sending 5, 100-byte ICMP Echos to ${target}, timeout is 2 seconds:`,
        `!!!!!`,
        `Success rate is 100 percent (5/5), round-trip min/avg/max = 1/2/4 ms`
      );
    } else {
      newLines.push(`% Invalid input detected at '^' marker.`);
    }

    setCliLog(prev => [...prev, ...newLines]);
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
