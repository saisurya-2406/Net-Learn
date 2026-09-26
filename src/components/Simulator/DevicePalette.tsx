import React from 'react';
import { Monitor, Laptop, Shuffle, Compass, Server, Radio, Shield, Box } from 'lucide-react';
import { DeviceType } from '../../types/network';

interface DevicePaletteProps {
  onAddDevice: (type: DeviceType) => void;
}

const PALETTE_ITEMS: Array<{
  type: DeviceType;
  label: string;
  category: 'End Devices' | 'Intermediary Devices' | 'Security';
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}> = [
  {
    type: 'pc',
    label: 'Workstation PC',
    category: 'End Devices',
    icon: Monitor,
    description: 'Host with 1 FastEthernet NIC and full IPv4/IPv6 stack',
  },
  {
    type: 'laptop',
    label: 'Laptop',
    category: 'End Devices',
    icon: Laptop,
    description: 'Portable client host with Ethernet and Wi-Fi interface',
  },
  {
    type: 'server',
    label: 'Multiservice Server',
    category: 'End Devices',
    icon: Server,
    description: 'Hosts HTTP Web, DNS, and DHCP services',
  },
  {
    type: 'switch',
    label: 'Layer 2 Switch',
    category: 'Intermediary Devices',
    icon: Shuffle,
    description: '24-port switch with MAC learning and VLAN 802.1Q support',
  },
  {
    type: 'router',
    label: 'Enterprise Router',
    category: 'Intermediary Devices',
    icon: Compass,
    description: 'Dual-Gigabit modular router with static & dynamic routing',
  },
  {
    type: 'hub',
    label: 'Legacy Hub',
    category: 'Intermediary Devices',
    icon: Box,
    description: 'Multi-port physical layer repeater (single collision domain)',
  },
  {
    type: 'access_point',
    label: 'Access Point',
    category: 'Intermediary Devices',
    icon: Radio,
    description: '802.11ax wireless bridge extending local wired LAN',
  },
  {
    type: 'firewall',
    label: 'Firewall Appliance',
    category: 'Security',
    icon: Shield,
    description: 'Stateful packet inspection with configurable ACL rules',
  },
];

export const DevicePalette: React.FC<DevicePaletteProps> = ({ onAddDevice }) => {
  return (
    <div className="flex flex-col gap-3 p-4 bg-slate-900 border border-slate-800 rounded-xl">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
          Device Palette
        </h3>
        <span className="text-[11px] text-slate-500 font-mono">Click to spawn</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-1 gap-2">
        {PALETTE_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.type}
              onClick={() => onAddDevice(item.type)}
              className="group flex items-center gap-3 p-2.5 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/80 rounded-lg text-left transition-all"
            >
              <div className="p-2 rounded-md bg-slate-900 text-sky-400 group-hover:bg-sky-500/20 group-hover:text-sky-300 transition-colors">
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                  {item.label}
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  {item.category}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
