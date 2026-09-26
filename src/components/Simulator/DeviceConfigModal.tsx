import React, { useState } from 'react';
import { X, Save, Plus, Trash2, Globe, Settings, ShieldAlert, Cpu } from 'lucide-react';
import { NetworkDevice, RouteEntry, MacTableEntry } from '../../types/network';

interface DeviceConfigModalProps {
  device: NetworkDevice;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: NetworkDevice) => void;
}

export const DeviceConfigModal: React.FC<DeviceConfigModalProps> = ({
  device,
  isOpen,
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'ip' | 'interfaces' | 'routing' | 'switch-vlans' | 'services'>('ip');
  const [devData, setDevData] = useState<NetworkDevice>({ ...device });

  if (!isOpen) return null;

  const isHost = devData.type === 'pc' || devData.type === 'laptop';
  const isRouter = devData.type === 'router';
  const isSwitch = devData.type === 'switch';
  const isServer = devData.type === 'server';

  const handleSave = () => {
    onSave(devData);
    onClose();
  };

  const updateFirstIface = (field: 'ip' | 'subnetMask', value: string) => {
    const updatedIfaces = [...devData.interfaces];
    if (updatedIfaces.length > 0) {
      updatedIfaces[0] = { ...updatedIfaces[0], [field]: value };
      setDevData({ ...devData, interfaces: updatedIfaces });
    }
  };

  const toggleIfaceStatus = (index: number) => {
    const updatedIfaces = [...devData.interfaces];
    updatedIfaces[index] = {
      ...updatedIfaces[index],
      status: updatedIfaces[index].status === 'up' ? 'down' : 'up',
    };
    setDevData({ ...devData, interfaces: updatedIfaces });
  };

  const updateIfaceField = (index: number, field: string, value: string) => {
    const updatedIfaces = [...devData.interfaces];
    updatedIfaces[index] = { ...updatedIfaces[index], [field]: value };
    setDevData({ ...devData, interfaces: updatedIfaces });
  };

  const addStaticRoute = () => {
    const newRoute: RouteEntry = {
      id: `rt-${Date.now()}`,
      destinationNetwork: '192.168.2.0',
      subnetMask: '255.255.255.0',
      nextHop: '10.0.0.2',
      interfaceName: devData.interfaces[0]?.name || 'Gi0/0',
    };
    setDevData({
      ...devData,
      routingTable: [...(devData.routingTable || []), newRoute],
    });
  };

  const removeStaticRoute = (id: string) => {
    setDevData({
      ...devData,
      routingTable: (devData.routingTable || []).filter((r) => r.id !== id),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={devData.name}
                  onChange={(e) => setDevData({ ...devData, name: e.target.value })}
                  className="bg-transparent font-bold text-base text-white border-b border-dashed border-slate-700 focus:outline-none focus:border-sky-500"
                />
                <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  {devData.type}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Device Configuration & Network Stack
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-nav Tabs */}
        <div className="flex items-center gap-2 px-6 py-2 bg-slate-950/40 border-b border-slate-800/80 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('ip')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'ip' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {isRouter || isSwitch ? 'Interface Addressing' : 'IP Configuration'}
          </button>

          {isRouter && (
            <button
              onClick={() => setActiveTab('routing')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'routing' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Routing Table (Static/Connected)
            </button>
          )}

          {isSwitch && (
            <button
              onClick={() => setActiveTab('switch-vlans')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'switch-vlans' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              VLANs & MAC Table
            </button>
          )}

          {isServer && (
            <button
              onClick={() => setActiveTab('services')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'services' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Services (HTTP / DNS / DHCP)
            </button>
          )}
        </div>

        {/* Tab Contents */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 text-xs">
          {/* TAB 1: Host IP or Router Interface Addressing */}
          {activeTab === 'ip' && (
            <>
              {isHost || isServer ? (
                <div className="space-y-4">
                  {/* Mode switch */}
                  <div className="flex items-center gap-4 p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-400 font-medium">IP Configuration Mode:</span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={devData.configMode !== 'dhcp'}
                        onChange={() => setDevData({ ...devData, configMode: 'static' })}
                        className="text-sky-500"
                      />
                      <span className="text-white">Static</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={devData.configMode === 'dhcp'}
                        onChange={() => setDevData({ ...devData, configMode: 'dhcp' })}
                        className="text-sky-500"
                      />
                      <span className="text-white">DHCP (Automatic)</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 font-medium mb-1">
                        IPv4 Address
                      </label>
                      <input
                        type="text"
                        disabled={devData.configMode === 'dhcp'}
                        value={devData.interfaces[0]?.ip || ''}
                        onChange={(e) => updateFirstIface('ip', e.target.value)}
                        placeholder="e.g. 192.168.1.10"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg font-mono text-white focus:outline-none focus:border-sky-500 disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-medium mb-1">
                        Subnet Mask
                      </label>
                      <input
                        type="text"
                        disabled={devData.configMode === 'dhcp'}
                        value={devData.interfaces[0]?.subnetMask || ''}
                        onChange={(e) => updateFirstIface('subnetMask', e.target.value)}
                        placeholder="e.g. 255.255.255.0"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg font-mono text-white focus:outline-none focus:border-sky-500 disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-medium mb-1">
                        Default Gateway (Router Interface)
                      </label>
                      <input
                        type="text"
                        disabled={devData.configMode === 'dhcp'}
                        value={devData.defaultGateway || ''}
                        onChange={(e) => setDevData({ ...devData, defaultGateway: e.target.value })}
                        placeholder="e.g. 192.168.1.1"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg font-mono text-white focus:outline-none focus:border-sky-500 disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-medium mb-1">
                        DNS Server
                      </label>
                      <input
                        type="text"
                        disabled={devData.configMode === 'dhcp'}
                        value={devData.dnsServer || ''}
                        onChange={(e) => setDevData({ ...devData, dnsServer: e.target.value })}
                        placeholder="e.g. 192.168.1.100 or 8.8.8.8"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg font-mono text-white focus:outline-none focus:border-sky-500 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-slate-400 font-mono text-[11px]">
                    <div>Physical MAC Address: <b className="text-sky-400">{devData.interfaces[0]?.mac}</b></div>
                    <div>Port: <b className="text-white">{devData.interfaces[0]?.name}</b></div>
                  </div>
                </div>
              ) : (
                /* Router or Switch Interfaces */
                <div className="space-y-4">
                  <div className="text-slate-400 mb-2">
                    Configure port addressing, subnet masks, and interface administrative status (UP/DOWN).
                  </div>

                  <div className="space-y-3">
                    {devData.interfaces.map((iface, idx) => (
                      <div
                        key={iface.id}
                        className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{iface.name}</span>
                            <span className="text-[11px] font-mono text-slate-500">
                              ({iface.mac})
                            </span>
                          </div>

                          <button
                            onClick={() => toggleIfaceStatus(idx)}
                            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                              iface.status === 'up'
                                ? 'bg-emerald-950 border border-emerald-500/60 text-emerald-400'
                                : 'bg-rose-950 border border-rose-500/60 text-rose-400'
                            }`}
                          >
                            {iface.status === 'up' ? 'Port UP (no shutdown)' : 'Port DOWN (shutdown)'}
                          </button>
                        </div>

                        {isRouter && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-slate-400 text-[11px] mb-1">
                                Interface IP Address
                              </label>
                              <input
                                type="text"
                                value={iface.ip || ''}
                                onChange={(e) => updateIfaceField(idx, 'ip', e.target.value)}
                                placeholder="e.g. 192.168.1.1"
                                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-md font-mono text-white text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-slate-400 text-[11px] mb-1">
                                Subnet Mask
                              </label>
                              <input
                                type="text"
                                value={iface.subnetMask || ''}
                                onChange={(e) => updateIfaceField(idx, 'subnetMask', e.target.value)}
                                placeholder="e.g. 255.255.255.0"
                                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-md font-mono text-white text-xs"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 2: Router Static Routing Table */}
          {activeTab === 'routing' && isRouter && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">
                  Configured IP Routes & Directly Connected Networks
                </span>
                <button
                  onClick={addStaticRoute}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-md text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Static Route</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-800 rounded-lg">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">Network</th>
                      <th className="py-2 px-3">Mask</th>
                      <th className="py-2 px-3">Next Hop / Gateway</th>
                      <th className="py-2 px-3">Interface</th>
                      <th className="py-2 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {(devData.routingTable || []).map((route) => (
                      <tr key={route.id} className="hover:bg-slate-850">
                        <td className="py-2 px-3 text-sky-400 font-bold">{route.destinationNetwork}</td>
                        <td className="py-2 px-3 text-slate-300">{route.subnetMask}</td>
                        <td className="py-2 px-3 text-emerald-400">{route.nextHop}</td>
                        <td className="py-2 px-3 text-slate-400">{route.interfaceName}</td>
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => removeStaticRoute(route.id)}
                            className="text-slate-500 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Switch VLANs & MAC Address Table */}
          {activeTab === 'switch-vlans' && isSwitch && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-white mb-2">Switch Port VLAN Memberships</h4>
                <div className="grid grid-cols-2 gap-2">
                  {devData.interfaces.map((iface, idx) => (
                    <div
                      key={iface.id}
                      className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between"
                    >
                      <span className="font-bold text-white">{iface.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">VLAN:</span>
                        <select
                          value={iface.vlan || 1}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            const updated = [...devData.interfaces];
                            updated[idx] = { ...updated[idx], vlan: val };
                            setDevData({ ...devData, interfaces: updated });
                          }}
                          className="bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs"
                        >
                          <option value={1}>VLAN 1 (Default)</option>
                          <option value={10}>VLAN 10 (Sales)</option>
                          <option value={20}>VLAN 20 (Engineering)</option>
                          <option value={30}>VLAN 30 (Servers)</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-white mb-2">Learned MAC Address Table (CAM)</h4>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-slate-400">
                  {devData.macTable && devData.macTable.length > 0 ? (
                    <div className="space-y-1">
                      {devData.macTable.map((m, i) => (
                        <div key={i} className="flex justify-between text-slate-300">
                          <span>VLAN {m.vlan} · {m.mac}</span>
                          <span className="text-sky-400">{m.port} ({m.type})</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="italic text-slate-600">
                      MAC table currently empty. Send packets in the simulator to watch the switch learn MAC addresses dynamically!
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Server Services */}
          {activeTab === 'services' && isServer && (
            <div className="space-y-5">
              {/* HTTP Web Server */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-sky-400" />
                    <span>HTTP Web Server Service (Port 80)</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={devData.serverServices?.httpEnabled ?? true}
                      onChange={(e) =>
                        setDevData({
                          ...devData,
                          serverServices: {
                            ...(devData.serverServices || {
                              httpEnabled: true,
                              httpContent: '',
                              dnsEnabled: false,
                              dnsRecords: [],
                              dhcpEnabled: false,
                              dhcpPool: { startIp: '', endIp: '', subnetMask: '', gateway: '', dnsServer: '' },
                            }),
                            httpEnabled: e.target.checked,
                          },
                        })
                      }
                      className="text-sky-500 rounded"
                    />
                    <span className="text-slate-300">Enabled</span>
                  </label>
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">
                    HTML Index Document (index.html):
                  </label>
                  <textarea
                    rows={3}
                    value={devData.serverServices?.httpContent || '<html><body><h1>Welcome to NetLearn Server</h1></body></html>'}
                    onChange={(e) =>
                      setDevData({
                        ...devData,
                        serverServices: {
                          ...(devData.serverServices || {
                            httpEnabled: true,
                            httpContent: '',
                            dnsEnabled: false,
                            dnsRecords: [],
                            dhcpEnabled: false,
                            dhcpPool: { startIp: '', endIp: '', subnetMask: '', gateway: '', dnsServer: '' },
                          }),
                          httpContent: e.target.value,
                        },
                      })
                    }
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-md font-mono text-xs text-emerald-400"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Apply Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
