import React, { useState } from 'react';
import { RefreshCw, Play, StepForward, RotateCcw, ShieldCheck } from 'lucide-react';

interface TcpPacketStep {
  step: number;
  direction: 'client-to-server' | 'server-to-client';
  type: string;
  flags: string;
  seq: number;
  ack: number;
  clientState: string;
  serverState: string;
  explanation: string;
}

export const TcpHandshakeVisualizer: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(0);

  const STEPS: TcpPacketStep[] = [
    {
      step: 0,
      direction: 'client-to-server',
      type: 'Ready',
      flags: 'None',
      seq: 0,
      ack: 0,
      clientState: 'CLOSED',
      serverState: 'LISTEN',
      explanation: 'Server socket is bound to Port 80/443 and in passive LISTEN state. Client initiates active open.',
    },
    {
      step: 1,
      direction: 'client-to-server',
      type: 'SYN',
      flags: 'SYN=1, ACK=0',
      seq: 1000,
      ack: 0,
      clientState: 'SYN_SENT',
      serverState: 'LISTEN',
      explanation: 'Client sends SYN packet with client Initial Sequence Number (ISN=1000). Tells the server: "I want to synchronize sequence numbers starting at 1000".',
    },
    {
      step: 2,
      direction: 'server-to-client',
      type: 'SYN + ACK',
      flags: 'SYN=1, ACK=1',
      seq: 5000,
      ack: 1001,
      clientState: 'SYN_SENT',
      serverState: 'SYN_RCVD',
      explanation: 'Server receives SYN, enters SYN_RCVD. Responds with its own ISN=5000 and acknowledges client\'s SYN with ACK = 1000 + 1 = 1001.',
    },
    {
      step: 3,
      direction: 'client-to-server',
      type: 'ACK',
      flags: 'SYN=0, ACK=1',
      seq: 1001,
      ack: 5001,
      clientState: 'ESTABLISHED',
      serverState: 'ESTABLISHED',
      explanation: 'Client acknowledges server\'s ISN with ACK = 5000 + 1 = 5001. Both endpoints reach ESTABLISHED state! Full-duplex application data can now flow.',
    },
    {
      step: 4,
      direction: 'client-to-server',
      type: 'DATA (HTTP GET)',
      flags: 'ACK=1, PSH=1',
      seq: 1001,
      ack: 5001,
      clientState: 'ESTABLISHED',
      serverState: 'ESTABLISHED',
      explanation: 'Client transmits 250 bytes of HTTP request data. Seq=1001, Payload length=250 bytes.',
    },
    {
      step: 5,
      direction: 'server-to-client',
      type: 'DATA ACK',
      flags: 'ACK=1',
      seq: 5001,
      ack: 1251,
      clientState: 'ESTABLISHED',
      serverState: 'ESTABLISHED',
      explanation: 'Server acknowledges receipt of all 250 bytes by incrementing ACK to 1001 + 250 = 1251.',
    },
    {
      step: 6,
      direction: 'client-to-server',
      type: 'FIN',
      flags: 'FIN=1, ACK=1',
      seq: 1251,
      ack: 5001,
      clientState: 'FIN_WAIT_1',
      serverState: 'ESTABLISHED',
      explanation: 'Connection teardown begins. Client sends FIN to signal it has no more data to transmit.',
    },
    {
      step: 7,
      direction: 'server-to-client',
      type: 'ACK',
      flags: 'ACK=1',
      seq: 5001,
      ack: 1252,
      clientState: 'FIN_WAIT_2',
      serverState: 'CLOSE_WAIT',
      explanation: 'Server acknowledges client\'s FIN (ACK = 1251 + 1 = 1252). Server enters CLOSE_WAIT.',
    },
    {
      step: 8,
      direction: 'server-to-client',
      type: 'FIN',
      flags: 'FIN=1, ACK=1',
      seq: 5001,
      ack: 1252,
      clientState: 'TIME_WAIT',
      serverState: 'LAST_ACK',
      explanation: 'Server finishes its own transmission and sends FIN. Client enters TIME_WAIT (2MSL timer).',
    },
    {
      step: 9,
      direction: 'client-to-server',
      type: 'ACK',
      flags: 'ACK=1',
      seq: 1252,
      ack: 5002,
      clientState: 'TIME_WAIT -> CLOSED',
      serverState: 'CLOSED',
      explanation: 'Client acknowledges server FIN (ACK = 5001 + 1 = 5002). Server closes immediately. Client waits 2MSL to guarantee final ACK arrived.',
    },
  ];

  const active = STEPS[currentStep];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-sky-400" />
            <span>TCP 3-Way Handshake, Data & 4-Way Teardown</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Trace exact Sequence and Acknowledgment numbers across client and server state transitions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1);
            }}
            disabled={currentStep >= STEPS.length - 1}
            className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <StepForward className="w-3.5 h-3.5" />
            <span>Step Forward ({currentStep}/{STEPS.length - 1})</span>
          </button>
          <button
            onClick={() => setCurrentStep(0)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Ladder Diagram & Protocol State Machine */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ladder Animation */}
        <div className="lg:col-span-7 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <div className="flex justify-between items-center px-4 py-2 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono font-bold">
            <div className="text-sky-400">
              CLIENT (State: <span className="text-white">{active.clientState}</span>)
            </div>
            <div className="text-emerald-400">
              SERVER (State: <span className="text-white">{active.serverState}</span>)
            </div>
          </div>

          {/* Ladder message steps */}
          <div className="space-y-3 py-2">
            {STEPS.slice(1, currentStep + 1).map((s) => {
              const isToRight = s.direction === 'client-to-server';
              return (
                <div
                  key={s.step}
                  className={`flex flex-col p-2.5 rounded-lg border text-xs font-mono transition-all ${
                    s.step === currentStep
                      ? 'bg-sky-950/40 border-sky-500 shadow-md shadow-sky-500/10 ring-1 ring-sky-500/50'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white">
                      Step {s.step}: {s.type}
                    </span>
                    <span className="text-[11px] text-slate-400">{s.flags}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`flex-1 flex items-center ${isToRight ? 'justify-end' : 'justify-start'}`}>
                      <div className="w-full border-t border-dashed border-sky-400 relative">
                        <span
                          className={`absolute -top-1.5 ${
                            isToRight ? 'right-0 text-sky-400' : 'left-0 text-emerald-400'
                          }`}
                        >
                          {isToRight ? '▶' : '◀'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between text-[11px] mt-1 text-slate-300">
                    <span>Seq = {s.seq}</span>
                    <span>Ack = {s.ack}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Deep Explanation */}
        <div className="lg:col-span-5 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Current Exchange Inspection
          </h3>

          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-3 text-xs leading-relaxed">
            <div className="text-sky-400 font-bold font-mono">
              Action: {active.type}
            </div>
            <p className="text-slate-300">{active.explanation}</p>

            <div className="pt-2 border-t border-slate-800 space-y-1 font-mono text-[11px] text-slate-400">
              <div>Control Flags: <b className="text-white">{active.flags}</b></div>
              <div>Sequence Number: <b className="text-amber-400">{active.seq}</b></div>
              <div>Acknowledgment Number: <b className="text-emerald-400">{active.ack}</b></div>
            </div>
          </div>

          {/* Key Rule Note */}
          <div className="p-3 bg-sky-950/30 rounded-lg border border-sky-500/20 text-xs text-slate-300 space-y-1">
            <span className="font-bold text-sky-400">Exam Principle:</span>
            <p>
              SYN and FIN flags consume exactly 1 sequence number space to guarantee reliable acknowledgement. Normal data packets consume sequence numbers equal to the payload byte length.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
