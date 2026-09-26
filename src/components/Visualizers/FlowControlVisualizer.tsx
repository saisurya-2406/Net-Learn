import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeftRight, Play, Pause, RotateCcw, StepForward, AlertOctagon } from 'lucide-react';

interface FrameState {
  id: number;
  status: 'unsent' | 'in-flight' | 'acked' | 'lost' | 'buffered';
}

export const FlowControlVisualizer: React.FC = () => {
  const [protocol, setProtocol] = useState<'stop-and-wait' | 'go-back-n' | 'selective-repeat'>('go-back-n');
  const [windowSize, setWindowSize] = useState<number>(4);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [dropNextFrame, setDropNextFrame] = useState<boolean>(false);
  const [dropNextAck, setDropNextAck] = useState<boolean>(false);

  // Sender & Receiver State
  const [base, setBase] = useState<number>(0);
  const [nextSeqNum, setNextSeqNum] = useState<number>(0);
  const [receiverExpected, setReceiverExpected] = useState<number>(0);
  const [receivedFrames, setReceivedFrames] = useState<number[]>([]);
  const [logEvents, setLogEvents] = useState<string[]>([
    'System initialized. Ready to transmit frames.',
  ]);

  const totalFrames = 10;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetSimulation = () => {
    setIsPlaying(false);
    setBase(0);
    setNextSeqNum(0);
    setReceiverExpected(0);
    setReceivedFrames([]);
    setDropNextFrame(false);
    setDropNextAck(false);
    setLogEvents(['Simulation reset to initial state.']);
  };

  const stepSimulation = () => {
    // Check if everything is ACKed
    if (base >= totalFrames) {
      setIsPlaying(false);
      setLogEvents(prev => ['All frames delivered and acknowledged successfully!', ...prev]);
      return;
    }

    const currentWindowLimit = protocol === 'stop-and-wait' ? base + 1 : base + windowSize;

    // Can we send a new frame in the current window?
    if (nextSeqNum < currentWindowLimit && nextSeqNum < totalFrames) {
      const frameToSend = nextSeqNum;

      if (dropNextFrame) {
        setDropNextFrame(false);
        setLogEvents(prev => [
          `[LOST] Frame ${frameToSend} was dropped on the wire due to simulated channel noise!`,
          ...prev,
        ]);
        setNextSeqNum(n => n + 1);
        return;
      }

      setLogEvents(prev => [
        `[SENT] Sender transmitted Frame ${frameToSend} (Seq: ${frameToSend}).`,
        ...prev,
      ]);

      // Receiver processing
      if (protocol === 'go-back-n') {
        if (frameToSend === receiverExpected) {
          // In order
          if (dropNextAck) {
            setDropNextAck(false);
            setLogEvents(prev => [
              `[ACK LOST] Receiver got Frame ${frameToSend}, but ACK ${frameToSend + 1} was lost!`,
              ...prev,
            ]);
            setReceiverExpected(e => e + 1);
            setReceivedFrames(rf => [...rf, frameToSend]);
          } else {
            setReceiverExpected(e => e + 1);
            setReceivedFrames(rf => [...rf, frameToSend]);
            setBase(b => Math.max(b, frameToSend + 1));
            setLogEvents(prev => [
              `[ACK RECEIVED] Receiver accepted Frame ${frameToSend}, sent cumulative ACK ${frameToSend + 1}. Sender advances window base to ${frameToSend + 1}.`,
              ...prev,
            ]);
          }
        } else {
          // Out of order in GBN -> discarded
          setLogEvents(prev => [
            `[DISCARDED] Receiver got Frame ${frameToSend} out of order (expected ${receiverExpected}). Discarded. Repeated ACK ${receiverExpected}.`,
            ...prev,
          ]);
        }
      } else if (protocol === 'selective-repeat') {
        // Selective Repeat buffers out-of-order frames
        setReceivedFrames(rf => [...new Set([...rf, frameToSend])]);
        setBase(b => {
          let newBase = b;
          while (receivedFrames.includes(newBase) || newBase === frameToSend) {
            newBase++;
          }
          return newBase;
        });
        setLogEvents(prev => [
          `[SR ACCEPTED] Receiver buffered Frame ${frameToSend} and sent individual ACK ${frameToSend}.`,
          ...prev,
        ]);
      } else {
        // Stop and Wait
        setReceivedFrames(rf => [...rf, frameToSend]);
        setReceiverExpected(e => e + 1);
        setBase(frameToSend + 1);
        setLogEvents(prev => [
          `[S&W ACK] Receiver sent ACK ${frameToSend}. Sender received ACK, advancing window.`,
          ...prev,
        ]);
      }

      setNextSeqNum(n => n + 1);
    } else {
      // Window is full! Timeout occurs if frames are pending
      if (protocol === 'go-back-n' && base < receiverExpected) {
        setBase(receiverExpected);
      } else if (protocol === 'go-back-n' && base >= receiverExpected) {
        // Retransmission in GBN
        setLogEvents(prev => [
          `[TIMEOUT] Sender timer expired for Frame ${base}! Go-Back-N retransmitting all frames from ${base} to ${nextSeqNum - 1}.`,
          ...prev,
        ]);
        setNextSeqNum(base);
      }
    }
  };

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        stepSimulation();
      }, 1200);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, base, nextSeqNum, receiverExpected, dropNextFrame, dropNextAck, protocol]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-sky-400" />
            <span>Flow Control & ARQ Protocol Simulator</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Compare Stop-and-Wait, Go-Back-N, and Selective Repeat sliding window behaviors with frame drops and cumulative vs individual acknowledgments.
          </p>
        </div>

        {/* Protocol Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold">
          {(['stop-and-wait', 'go-back-n', 'selective-repeat'] as const).map((p) => (
            <button
              key={p}
              onClick={() => {
                setProtocol(p);
                resetSimulation();
              }}
              className={`px-3 py-1.5 rounded-md capitalize transition-colors ${
                protocol === p ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {p.replace(/-/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Pause' : 'Play Simulation'}</span>
              </button>
              <button
                onClick={stepSimulation}
                disabled={isPlaying}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-lg font-medium flex items-center gap-1.5 transition-colors"
              >
                <StepForward className="w-3.5 h-3.5" />
                <span>Step Forward</span>
              </button>
              <button
                onClick={resetSimulation}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setDropNextFrame(true)}
                disabled={dropNextFrame}
                className={`px-2.5 py-1 rounded-lg border font-medium transition-colors flex items-center gap-1 ${
                  dropNextFrame
                    ? 'bg-rose-950/60 border-rose-500 text-rose-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <AlertOctagon className="w-3 h-3 text-rose-400" />
                <span>Drop Next Frame</span>
              </button>

              <button
                onClick={() => setDropNextAck(true)}
                disabled={dropNextAck}
                className={`px-2.5 py-1 rounded-lg border font-medium transition-colors flex items-center gap-1 ${
                  dropNextAck
                    ? 'bg-amber-950/60 border-amber-500 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <AlertOctagon className="w-3 h-3 text-amber-400" />
                <span>Drop Next ACK</span>
              </button>
            </div>
          </div>

          {/* Sender Sliding Window */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white uppercase tracking-wider">
                Sender Frame Buffer (Window Size $N = {protocol === 'stop-and-wait' ? 1 : windowSize}$)
              </span>
              <div className="flex items-center gap-3 font-mono text-slate-400">
                <span>Base: <b className="text-sky-400">{base}</b></span>
                <span>NextSeqNum: <b className="text-emerald-400">{nextSeqNum}</b></span>
              </div>
            </div>

            <div className="grid grid-cols-10 gap-2">
              {Array.from({ length: totalFrames }).map((_, idx) => {
                const isAcked = idx < base;
                const isSentWaiting = idx >= base && idx < nextSeqNum;
                const isInWindow = protocol === 'stop-and-wait' 
                  ? idx === base 
                  : (idx >= base && idx < base + windowSize);

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      isAcked
                        ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-400'
                        : isSentWaiting
                        ? 'bg-sky-950/60 border-sky-400 text-sky-200 animate-pulse'
                        : isInWindow
                        ? 'bg-slate-950 border-sky-500/40 text-white'
                        : 'bg-slate-950/50 border-slate-800/80 text-slate-600'
                    }`}
                  >
                    <div className="text-[10px] text-slate-500 font-mono">Seq</div>
                    <div className="text-lg font-bold font-mono">{idx}</div>
                    <div className="text-[9px] mt-1 font-semibold truncate">
                      {isAcked ? 'ACKED' : isSentWaiting ? 'SENT' : isInWindow ? 'USABLE' : 'LOCKED'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Receiver Buffer */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white uppercase tracking-wider">
                Receiver Window Buffer
              </span>
              <span className="font-mono text-slate-400">
                Expecting Frame: <b className="text-amber-400">{receiverExpected}</b>
              </span>
            </div>

            <div className="grid grid-cols-10 gap-2">
              {Array.from({ length: totalFrames }).map((_, idx) => {
                const isReceived = receivedFrames.includes(idx);
                const isExpected = idx === receiverExpected;

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      isReceived
                        ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-400'
                        : isExpected
                        ? 'bg-amber-950/40 border-amber-500 text-amber-300 ring-1 ring-amber-500/50'
                        : 'bg-slate-950/50 border-slate-800 text-slate-600'
                    }`}
                  >
                    <div className="text-[10px] text-slate-500 font-mono">Frame</div>
                    <div className="text-lg font-bold font-mono">{idx}</div>
                    <div className="text-[9px] mt-1 font-semibold truncate">
                      {isReceived ? 'STORED' : isExpected ? 'EXPECTED' : 'WAITING'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Protocol Event Log */}
        <div className="lg:col-span-4 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3 flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Event Audit Trail
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              {logEvents.length} Events
            </span>
          </div>

          <div className="flex-1 max-h-[380px] overflow-y-auto space-y-2 pr-1 text-xs font-mono">
            {logEvents.map((log, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded bg-slate-950 border border-slate-800/80 text-slate-300 leading-relaxed"
              >
                {log}
              </div>
            ))}
          </div>

          {/* Efficiency Math Card */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-1">
            <div className="text-slate-400 font-semibold mb-1">Theoretical Channel Efficiency:</div>
            <div className="font-mono text-slate-300">
              {protocol === 'stop-and-wait' ? (
                <>Efficiency η = T_trans / (T_trans + 2 * T_prop) (Low channel utilization)</>
              ) : (
                <>Efficiency η = (N * T_trans) / (T_trans + 2 * T_prop) = min(1, N * U)</>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
