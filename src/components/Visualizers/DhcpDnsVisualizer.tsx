import React, { useState } from 'react';
import { Globe, Server, Laptop, StepForward, RotateCcw, CheckCircle2 } from 'lucide-react';

export const DhcpDnsVisualizer: React.FC = () => {
  const [mode, setMode] = useState<'dhcp' | 'dns'>('dhcp');
  const [dhcpStep, setDhcpStep] = useState<number>(0);
  const [dnsStep, setDnsStep] = useState<number>(0);

  const DHCP_STEPS = [
    {
      title: 'Initial State',
      from: 'Client',
      to: 'Network',
      srcIp: '0.0.0.0',
      dstIp: '255.255.255.255',
      srcPort: 68,
      dstPort: 67,
      type: 'Ready',
      detail: 'Client workstation boots up with no IP address. DHCP client daemon initializes.',
    },
    {
      title: '1. DHCP DISCOVER (Broadcast)',
      from: 'Client (0.0.0.0)',
      to: 'Broadcast (255.255.255.255)',
      srcIp: '0.0.0.0',
      dstIp: '255.255.255.255',
      srcPort: 68,
      dstPort: 67,
      type: 'DISCOVER',
      detail: 'Client broadcasts looking for any available DHCP servers on the local LAN. Layer 2 Dest MAC is FF:FF:FF:FF:FF:FF.',
    },
    {
      title: '2. DHCP OFFER (Unicast/Broadcast)',
      from: 'DHCP Server (192.168.1.1)',
      to: 'Client',
      srcIp: '192.168.1.1',
      dstIp: '255.255.255.255',
      srcPort: 67,
      dstPort: 68,
      type: 'OFFER',
      detail: 'DHCP server reserves an available IP (192.168.1.100) from its pool and offers it along with Subnet Mask 255.255.255.0, Default Gateway 192.168.1.1, and Lease Time 86400s.',
    },
    {
      title: '3. DHCP REQUEST (Broadcast)',
      from: 'Client',
      to: 'Broadcast (255.255.255.255)',
      srcIp: '0.0.0.0',
      dstIp: '255.255.255.255',
      srcPort: 68,
      dstPort: 67,
      type: 'REQUEST',
      detail: 'Client broadcasts: "I formally accept the offer from server 192.168.1.1 for IP 192.168.1.100". Broadcasting allows other competing DHCP servers to reclaim their offers.',
    },
    {
      title: '4. DHCP ACK (Acknowledgment)',
      from: 'DHCP Server (192.168.1.1)',
      to: 'Client',
      srcIp: '192.168.1.1',
      dstIp: '192.168.1.100',
      srcPort: 67,
      dstPort: 68,
      type: 'ACK',
      detail: 'DHCP server commits the lease to its database and acknowledges the assignment. Client applies 192.168.1.100 to its NIC and begins network operation!',
    },
  ];

  const DNS_STEPS = [
    {
      step: 1,
      server: 'Local Recursive Resolver (e.g. 8.8.8.8)',
      action: 'Client queries "www.example.com". Resolver checks local cache (Cache Miss).',
    },
    {
      step: 2,
      server: 'Root Nameserver (.)',
      action: 'Resolver queries Root server. Root responds with Referral to .com Top-Level Domain (TLD) server IP.',
    },
    {
      step: 3,
      server: '.com TLD Nameserver',
      action: 'Resolver queries .com TLD server. TLD responds with Referral to example.com Authoritative Nameserver IP.',
    },
    {
      step: 4,
      server: 'Authoritative Nameserver (ns1.example.com)',
      action: 'Resolver queries Authoritative server for A record. Authoritative server returns exact IP: 93.184.216.34 (TTL: 3600s).',
    },
    {
      step: 5,
      server: 'Client Workstation',
      action: 'Resolver caches the IP mapping and delivers 93.184.216.34 to the browser. Browser initiates HTTP/TCP connection!',
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-sky-400" />
            <span>DHCP DORA Process & DNS Recursive Resolution</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Explore how modern client devices dynamically acquire IP addresses and resolve human-readable domains.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setMode('dhcp')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              mode === 'dhcp' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            DHCP DORA (4-Way)
          </button>
          <button
            onClick={() => setMode('dns')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              mode === 'dns' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            DNS Recursive Resolution
          </button>
        </div>
      </div>

      {mode === 'dhcp' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                DORA Packet Sequence Trace
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (dhcpStep < DHCP_STEPS.length - 1) setDhcpStep(dhcpStep + 1);
                  }}
                  disabled={dhcpStep >= DHCP_STEPS.length - 1}
                  className="px-3 py-1 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <StepForward className="w-3.5 h-3.5" />
                  <span>Next Step ({dhcpStep}/{DHCP_STEPS.length - 1})</span>
                </button>
                <button
                  onClick={() => setDhcpStep(0)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {DHCP_STEPS.map((s, idx) => {
                const isActive = idx === dhcpStep;
                const isPassed = idx < dhcpStep;
                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-lg border text-xs font-mono transition-all ${
                      isActive
                        ? 'bg-sky-950/40 border-sky-500 shadow-md shadow-sky-500/10'
                        : isPassed
                        ? 'bg-slate-950/90 border-slate-800 text-slate-300'
                        : 'bg-slate-950/40 border-slate-900 text-slate-600 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-sm mb-1 text-white">
                      <span>{s.title}</span>
                      <span className="text-xs text-sky-400">{s.type}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 py-1.5 border-y border-slate-800/80 my-1">
                      <div>Src: {s.srcIp}:{s.srcPort}</div>
                      <div>Dst: {s.dstIp}:{s.dstPort}</div>
                    </div>

                    <p className="text-xs text-slate-300 font-sans mt-1">{s.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-4 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Network Device View
            </h3>

            <div className="flex flex-col items-center justify-around h-[340px] bg-slate-950 p-4 rounded-lg border border-slate-800">
              <div className="flex flex-col items-center p-3 rounded-lg bg-slate-900 border border-slate-800 w-full text-center">
                <Laptop className="w-8 h-8 text-sky-400 mb-1" />
                <span className="text-xs font-bold text-white">Client Workstation</span>
                <span className="text-[11px] font-mono text-slate-400">
                  {dhcpStep >= 4 ? 'IP: 192.168.1.100' : 'IP: 0.0.0.0 (Unconfigured)'}
                </span>
              </div>

              <div className="text-xs font-mono text-amber-400 font-bold animate-pulse">
                {dhcpStep === 0 && 'Awaiting Discover...'}
                {dhcpStep === 1 && 'DISCOVER ─── broadcast ───►'}
                {dhcpStep === 2 && '◄─── OFFER (192.168.1.100) ───'}
                {dhcpStep === 3 && 'REQUEST ─── broadcast ───►'}
                {dhcpStep === 4 && '◄─── ACK (Lease: 86400s) ───'}
              </div>

              <div className="flex flex-col items-center p-3 rounded-lg bg-slate-900 border border-slate-800 w-full text-center">
                <Server className="w-8 h-8 text-emerald-400 mb-1" />
                <span className="text-xs font-bold text-white">DHCP Server Gateway</span>
                <span className="text-[11px] font-mono text-slate-400">IP: 192.168.1.1</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Recursive vs Iterative Lookup Hierarchy (Target: "www.example.com")
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (dnsStep < DNS_STEPS.length - 1) setDnsStep(dnsStep + 1);
                }}
                disabled={dnsStep >= DNS_STEPS.length - 1}
                className="px-3 py-1 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
              >
                <StepForward className="w-3.5 h-3.5" />
                <span>Next Hop ({dnsStep + 1}/{DNS_STEPS.length})</span>
              </button>
              <button
                onClick={() => setDnsStep(0)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {DNS_STEPS.map((step, idx) => {
              const isCurrent = idx === dnsStep;
              const isDone = idx < dnsStep;
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                    isCurrent
                      ? 'bg-sky-950/50 border-sky-500 shadow-md ring-1 ring-sky-500'
                      : isDone
                      ? 'bg-slate-950 border-emerald-500/40 text-slate-200'
                      : 'bg-slate-950/40 border-slate-800 text-slate-500'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono mb-2">
                      <span className="font-bold text-sky-400">Step {step.step}</span>
                      {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <div className="font-bold text-sm text-white mb-2">{step.server}</div>
                    <p className="text-xs text-slate-300 leading-relaxed">{step.action}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">DNS Query Result (A Record):</span>
            <span className="text-emerald-400 font-bold bg-slate-900 px-3 py-1 rounded border border-emerald-500/30">
              www.example.com ──► 93.184.216.34 (TTL: 3600s)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
