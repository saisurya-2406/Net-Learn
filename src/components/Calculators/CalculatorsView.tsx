import React, { useState } from 'react';
import { Calculator, Binary, Plus, Trash2, Cpu, BarChart2 } from 'lucide-react';
import { 
  calculateIpv4Subnet, calculateFlsm, calculateVlsm, calculateNodalDelay,
  SubnetResult, FlsmSubnet, VlsmAllocation, NodalDelayResult 
} from '../../utils/networkingMath';

export const CalculatorsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'subnet' | 'flsm' | 'vlsm' | 'delay'>('subnet');

  // 1. IPv4 & CIDR Calculator State
  const [ipInput, setIpInput] = useState<string>('192.168.10.75');
  const [prefixInput, setPrefixInput] = useState<number>(26);
  const subnetResult: SubnetResult | null = calculateIpv4Subnet(ipInput, prefixInput);

  // 2. FLSM State
  const [flsmBaseIp, setFlsmBaseIp] = useState<string>('192.168.1.0');
  const [flsmPrefix, setFlsmPrefix] = useState<number>(24);
  const [flsmSubnetCount, setFlsmSubnetCount] = useState<number>(4);
  const flsmResults: FlsmSubnet[] = calculateFlsm(flsmBaseIp, flsmPrefix, flsmSubnetCount);

  // 3. VLSM State
  const [vlsmBaseIp, setVlsmBaseIp] = useState<string>('192.168.1.0');
  const [vlsmPrefix, setVlsmPrefix] = useState<number>(24);
  const [vlsmRequirements, setVlsmRequirements] = useState<Array<{ name: string; hosts: number }>>([
    { name: 'Engineering LAN', hosts: 60 },
    { name: 'Sales LAN', hosts: 28 },
    { name: 'Support LAN', hosts: 12 },
    { name: 'Point-to-Point WAN', hosts: 2 },
  ]);

  const vlsmResult = calculateVlsm(vlsmBaseIp, vlsmPrefix, vlsmRequirements);

  // 4. Delay Math State
  const [packetBytes, setPacketBytes] = useState<number>(1500);
  const [bandwidthMbps, setBandwidthMbps] = useState<number>(100);
  const [distanceKm, setDistanceKm] = useState<number>(2000);
  const delayResult: NodalDelayResult = calculateNodalDelay(packetBytes, bandwidthMbps, distanceKm);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-sky-400" />
            <span>Networking Numerical & Subnetting Engines</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Perform precision IPv4 subnetting, fixed & variable length subnet allocations (FLSM/VLSM), and physical propagation/transmission delay calculations.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveTab('subnet')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'subnet' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            IPv4 & CIDR
          </button>
          <button
            onClick={() => setActiveTab('flsm')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'flsm' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            FLSM Calculator
          </button>
          <button
            onClick={() => setActiveTab('vlsm')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'vlsm' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            VLSM Allocator
          </button>
          <button
            onClick={() => setActiveTab('delay')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'delay' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Nodal Delay & BDP
          </button>
        </div>
      </div>

      {/* TAB 1: IPv4 & CIDR Calculator */}
      {activeTab === 'subnet' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls */}
          <div className="lg:col-span-4 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              IP & Prefix Input
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                IPv4 Host Address
              </label>
              <input
                type="text"
                value={ipInput}
                onChange={(e) => setIpInput(e.target.value)}
                placeholder="192.168.1.10"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg font-mono text-sm text-sky-400 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-medium text-slate-400 mb-1">
                <span>CIDR Prefix Length:</span>
                <span className="font-mono text-white font-bold">/{prefixInput}</span>
              </div>
              <input
                type="range"
                min={8}
                max={32}
                value={prefixInput}
                onChange={(e) => setPrefixInput(parseInt(e.target.value, 10))}
                className="w-full accent-sky-500"
              />
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Class:</span>
                <span className="text-white font-bold">Class {subnetResult?.ipClass}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">RFC 1918 Scope:</span>
                <span className={subnetResult?.isPrivate ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {subnetResult?.isPrivate ? 'Private (RFC 1918)' : 'Public Internet'}
                </span>
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="lg:col-span-8 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Subnet Calculation Breakdown
            </h3>

            {subnetResult ? (
              <div className="overflow-x-auto border border-slate-800 rounded-lg">
                <table className="w-full text-left text-xs font-mono">
                  <tbody className="divide-y divide-slate-800">
                    <tr className="hover:bg-slate-850">
                      <td className="py-2.5 px-3 text-slate-400 font-sans font-medium w-48">Network Address:</td>
                      <td className="py-2.5 px-3 text-sky-400 font-bold text-sm">{subnetResult.networkAddress}/{subnetResult.prefix}</td>
                      <td className="py-2.5 px-3 text-slate-500">{subnetResult.networkAddressBinary}</td>
                    </tr>
                    <tr className="hover:bg-slate-850">
                      <td className="py-2.5 px-3 text-slate-400 font-sans font-medium">Subnet Mask:</td>
                      <td className="py-2.5 px-3 text-white font-bold">{subnetResult.subnetMask}</td>
                      <td className="py-2.5 px-3 text-slate-500">{subnetResult.subnetMaskBinary}</td>
                    </tr>
                    <tr className="hover:bg-slate-850">
                      <td className="py-2.5 px-3 text-slate-400 font-sans font-medium">Wildcard Mask:</td>
                      <td className="py-2.5 px-3 text-slate-300">{subnetResult.wildcardMask}</td>
                      <td className="py-2.5 px-3 text-slate-500">Inverted for ACLs</td>
                    </tr>
                    <tr className="hover:bg-slate-850">
                      <td className="py-2.5 px-3 text-slate-400 font-sans font-medium">Usable Host Range:</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-bold" colSpan={2}>
                        {subnetResult.firstUsableIp} ──► {subnetResult.lastUsableIp}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-850">
                      <td className="py-2.5 px-3 text-slate-400 font-sans font-medium">Broadcast Address:</td>
                      <td className="py-2.5 px-3 text-amber-400 font-bold">{subnetResult.broadcastAddress}</td>
                      <td className="py-2.5 px-3 text-slate-500">{subnetResult.broadcastAddressBinary}</td>
                    </tr>
                    <tr className="hover:bg-slate-850">
                      <td className="py-2.5 px-3 text-slate-400 font-sans font-medium">Total / Usable Hosts:</td>
                      <td className="py-2.5 px-3 text-white font-bold" colSpan={2}>
                        {subnetResult.totalHosts.toLocaleString()} Total / <span className="text-emerald-400 font-bold">{subnetResult.usableHosts.toLocaleString()} Usable</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 bg-slate-950 text-slate-500 text-xs italic">
                Please enter a valid IPv4 address (e.g. 192.168.1.1).
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: FLSM Calculator */}
      {activeTab === 'flsm' && (
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Base Network Address
              </label>
              <input
                type="text"
                value={flsmBaseIp}
                onChange={(e) => setFlsmBaseIp(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg font-mono text-sm text-sky-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Base Prefix Length
              </label>
              <input
                type="number"
                min={8}
                max={28}
                value={flsmPrefix}
                onChange={(e) => setFlsmPrefix(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg font-mono text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Required Equal Subnets
              </label>
              <select
                value={flsmSubnetCount}
                onChange={(e) => setFlsmSubnetCount(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg font-mono text-sm text-white"
              >
                {[2, 4, 8, 16, 32].map((num) => (
                  <option key={num} value={num}>
                    Split into {num} equal subnets
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">#</th>
                  <th className="py-2 px-3">Subnet Network ID</th>
                  <th className="py-2 px-3">First Usable IP</th>
                  <th className="py-2 px-3">Last Usable IP</th>
                  <th className="py-2 px-3">Broadcast IP</th>
                  <th className="py-2 px-3 text-right">Usable Hosts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {flsmResults.map((sub) => (
                  <tr key={sub.index} className="hover:bg-slate-850">
                    <td className="py-2.5 px-3 text-slate-500">{sub.index}</td>
                    <td className="py-2.5 px-3 text-sky-400 font-bold">{sub.networkId}</td>
                    <td className="py-2.5 px-3 text-emerald-400">{sub.firstUsable}</td>
                    <td className="py-2.5 px-3 text-emerald-400">{sub.lastUsable}</td>
                    <td className="py-2.5 px-3 text-amber-400">{sub.broadcast}</td>
                    <td className="py-2.5 px-3 text-right text-white font-bold">{sub.usableHosts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: VLSM Allocator & Memory Map */}
      {activeTab === 'vlsm' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Department Requirements */}
          <div className="lg:col-span-5 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Department Host Requirements
              </h3>
              <button
                onClick={() =>
                  setVlsmRequirements([
                    ...vlsmRequirements,
                    { name: `Subnet ${vlsmRequirements.length + 1}`, hosts: 10 },
                  ])
                }
                className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Subnet</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Base Address</label>
                <input
                  type="text"
                  value={vlsmBaseIp}
                  onChange={(e) => setVlsmBaseIp(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded font-mono text-xs text-sky-400"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Prefix</label>
                <input
                  type="number"
                  value={vlsmPrefix}
                  onChange={(e) => setVlsmPrefix(parseInt(e.target.value, 10))}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded font-mono text-xs text-white"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {vlsmRequirements.map((req, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs"
                >
                  <input
                    type="text"
                    value={req.name}
                    onChange={(e) => {
                      const updated = [...vlsmRequirements];
                      updated[idx].name = e.target.value;
                      setVlsmRequirements(updated);
                    }}
                    className="flex-1 bg-slate-900 border border-slate-700 px-2 py-1 rounded text-white"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={req.hosts}
                      onChange={(e) => {
                        const updated = [...vlsmRequirements];
                        updated[idx].hosts = parseInt(e.target.value, 10) || 2;
                        setVlsmRequirements(updated);
                      }}
                      className="w-16 bg-slate-900 border border-slate-700 px-2 py-1 rounded font-mono text-white text-right"
                    />
                    <span className="text-[11px] text-slate-500">hosts</span>
                  </div>
                  <button
                    onClick={() => setVlsmRequirements(vlsmRequirements.filter((_, i) => i !== idx))}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* VLSM Output & Visual Address Space Allocation Bar */}
          <div className="lg:col-span-7 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Visual Address Space Map (Base: {vlsmBaseIp}/{vlsmPrefix})
            </h3>

            {/* Visual Allocation Bar */}
            <div className="space-y-1">
              <div className="w-full h-8 bg-slate-950 rounded-lg border border-slate-800 flex overflow-hidden p-0.5">
                {vlsmResult.allocations.map((alloc, idx) => {
                  const colors = ['bg-sky-600', 'bg-indigo-600', 'bg-emerald-600', 'bg-amber-600', 'bg-purple-600'];
                  const color = colors[idx % colors.length];
                  return (
                    <div
                      key={idx}
                      className={`${color} h-full text-white text-[10px] font-mono font-bold flex items-center justify-center truncate px-1 transition-all`}
                      style={{ width: `${alloc.percentageOfBase}%` }}
                      title={`${alloc.name}: ${alloc.allocatedHosts} hosts (${alloc.percentageOfBase}%)`}
                    >
                      {alloc.name}
                    </div>
                  );
                })}
                {vlsmResult.remainingSpacePercent > 0 && (
                  <div
                    className="bg-slate-800 h-full text-slate-500 text-[10px] font-mono flex items-center justify-center truncate px-1"
                    style={{ width: `${vlsmResult.remainingSpacePercent}%` }}
                    title={`Free Unallocated Space: ${vlsmResult.remainingSpacePercent}%`}
                  >
                    Free ({vlsmResult.remainingSpacePercent}%)
                  </div>
                )}
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-500 px-1">
                <span>Start: {vlsmBaseIp}</span>
                <span>Unused Capacity: {vlsmResult.remainingSpacePercent}%</span>
              </div>
            </div>

            {/* Allocation Table */}
            <div className="overflow-x-auto border border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Subnet</th>
                    <th className="py-2 px-3">Needed</th>
                    <th className="py-2 px-3">Allocated</th>
                    <th className="py-2 px-3">Network ID</th>
                    <th className="py-2 px-3">Usable Range</th>
                    <th className="py-2 px-3">Broadcast</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {vlsmResult.allocations.map((a, i) => (
                    <tr key={i} className="hover:bg-slate-850">
                      <td className="py-2 px-3 font-bold text-white">{a.name}</td>
                      <td className="py-2 px-3 text-slate-400">{a.neededHosts}</td>
                      <td className="py-2 px-3 text-emerald-400 font-bold">{a.allocatedHosts} (/{a.prefix})</td>
                      <td className="py-2 px-3 text-sky-400">{a.networkId}</td>
                      <td className="py-2 px-3 text-slate-300">{a.firstUsable} - {a.lastUsable}</td>
                      <td className="py-2 px-3 text-amber-400">{a.broadcastId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Nodal Delay & BDP */}
      {activeTab === 'delay' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Network Physics Parameters
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Packet Size (Bytes $L$)
              </label>
              <input
                type="number"
                value={packetBytes}
                onChange={(e) => setPacketBytes(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg font-mono text-sm text-sky-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Link Bandwidth ($R$ in Mbps)
              </label>
              <input
                type="number"
                value={bandwidthMbps}
                onChange={(e) => setBandwidthMbps(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg font-mono text-sm text-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Cable Length ($d$ in Kilometers)
              </label>
              <input
                type="number"
                value={distanceKm}
                onChange={(e) => setDistanceKm(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg font-mono text-sm text-amber-400"
              />
            </div>
          </div>

          <div className="lg:col-span-7 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Calculated Delay Breakdown & Buffer Sizing
            </h3>

            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-500 block">Transmission Delay ($L/R$):</span>
                <span className="text-sky-400 font-bold text-sm">{delayResult.transmissionDelayMs} ms</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-500 block">Propagation Delay ($d/s$):</span>
                <span className="text-amber-400 font-bold text-sm">{delayResult.propagationDelayMs} ms</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-500 block">Total One-Way Nodal Delay:</span>
                <span className="text-emerald-400 font-bold text-sm">{delayResult.totalDelayMs} ms</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-500 block">Bandwidth-Delay Product:</span>
                <span className="text-white font-bold text-sm">{delayResult.bandwidthDelayProductBits.toLocaleString()} bits</span>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono space-y-1.5">
              <div className="text-slate-400 font-semibold">Mathematical Steps:</div>
              {delayResult.steps.map((st, i) => (
                <div key={i} className="text-slate-300">
                  {st}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
