import React, { useState } from 'react';
import { ShieldCheck, Play, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { calculateCrc, CrcResult } from '../../utils/networkingMath';

export const ErrorDetectionVisualizer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'crc' | 'hamming' | 'checksum'>('crc');

  // CRC States
  const [dataBits, setDataBits] = useState<string>('11010011101100');
  const [generatorBits, setGeneratorBits] = useState<string>('1011');
  const [crcResult, setCrcResult] = useState<CrcResult>(() => calculateCrc('11010011101100', '1011'));

  const handleComputeCrc = () => {
    setCrcResult(calculateCrc(dataBits, generatorBits));
  };

  // Hamming (7,4) Code States
  // 4 data bits: d3, d5, d6, d7
  // 3 parity bits: p1, p2, p4
  const [hammingData, setHammingData] = useState<[number, number, number, number]>([1, 0, 1, 1]); // [d3, d5, d6, d7]
  const [transmittedCode, setTransmittedCode] = useState<number[]>([]);
  const [receivedCode, setReceivedCode] = useState<number[]>([]);

  // Compute Hamming (7,4) code
  // Positions: 1(p1), 2(p2), 3(d3), 4(p4), 5(d5), 6(d6), 7(d7)
  // p1 covers 1, 3, 5, 7 -> p1 = d3 ^ d5 ^ d7
  // p2 covers 2, 3, 6, 7 -> p2 = d3 ^ d6 ^ d7
  // p4 covers 4, 5, 6, 7 -> p4 = d5 ^ d6 ^ d7
  const computeHamming = (d: [number, number, number, number]) => {
    const [d3, d5, d6, d7] = d;
    const p1 = d3 ^ d5 ^ d7;
    const p2 = d3 ^ d6 ^ d7;
    const p4 = d5 ^ d6 ^ d7;
    // 1-indexed array: [dummy, p1, p2, d3, p4, d5, d6, d7]
    const code = [0, p1, p2, d3, p4, d5, d6, d7];
    setTransmittedCode(code);
    setReceivedCode([...code]);
  };

  React.useEffect(() => {
    computeHamming(hammingData);
  }, [hammingData]);

  // Toggle bit flip error in received codeword
  const toggleReceivedBit = (pos: number) => {
    const updated = [...receivedCode];
    updated[pos] = updated[pos] === 1 ? 0 : 1;
    setReceivedCode(updated);
  };

  // Calculate syndrome
  // s1 = r1 ^ r3 ^ r5 ^ r7
  // s2 = r2 ^ r3 ^ r6 ^ r7
  // s4 = r4 ^ r5 ^ r6 ^ r7
  // errorPosition = s4*4 + s2*2 + s1*1
  const s1 = receivedCode[1] ^ receivedCode[3] ^ receivedCode[5] ^ receivedCode[7];
  const s2 = receivedCode[2] ^ receivedCode[3] ^ receivedCode[6] ^ receivedCode[7];
  const s4 = receivedCode[4] ^ receivedCode[5] ^ receivedCode[6] ^ receivedCode[7];
  const errorPosition = s4 * 4 + s2 * 2 + s1 * 1;

  // Internet Checksum Calculator
  const [chunk1, setChunk1] = useState('1001110001011001');
  const [chunk2, setChunk2] = useState('1010101100011110');

  const computeChecksum = () => {
    const val1 = parseInt(chunk1, 2) || 0;
    const val2 = parseInt(chunk2, 2) || 0;
    let sum = val1 + val2;
    // Handle carry wrap-around
    while (sum > 0xffff) {
      sum = (sum & 0xffff) + (sum >> 16);
    }
    const checksum = (~sum) & 0xffff;
    return {
      sum16: sum.toString(2).padStart(16, '0'),
      checksum16: checksum.toString(2).padStart(16, '0'),
    };
  };

  const chkResult = computeChecksum();

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Error Detection & Correction Algorithms</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Experience step-by-step mathematical verification: CRC polynomial division, Hamming single error correction, and 1's complement Internet checksums.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveTab('crc')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'crc' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            CRC Division
          </button>
          <button
            onClick={() => setActiveTab('hamming')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'hamming' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Hamming (7,4) Code
          </button>
          <button
            onClick={() => setActiveTab('checksum')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'checksum' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Internet Checksum
          </button>
        </div>
      </div>

      {/* Tab 1: CRC Division Visualizer */}
      {activeTab === 'crc' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                CRC Parameters
              </h3>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Data Word (Binary Bits $D$)
                </label>
                <input
                  type="text"
                  value={dataBits}
                  onChange={(e) => setDataBits(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg font-mono text-sm text-sky-400 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Generator Polynomial ($G$) (e.g. 1011 = $x^3 + x + 1$)
                </label>
                <input
                  type="text"
                  value={generatorBits}
                  onChange={(e) => setGeneratorBits(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg font-mono text-sm text-emerald-400 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleComputeCrc}
                  className="flex-1 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Compute Long Division</span>
                </button>
                <button
                  onClick={() => {
                    setDataBits('11010011101100');
                    setGeneratorBits('1011');
                    setCrcResult(calculateCrc('11010011101100', '1011'));
                  }}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* CRC Summary Card */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Generator Degree ($r$):</span>
                  <span className="text-white">{generatorBits.length - 1} zeros appended</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Calculated Remainder ($R$):</span>
                  <span className="text-amber-400 font-bold">{crcResult.crcRemainder}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 text-slate-300">
                  <span className="block text-slate-500 text-[11px] mb-1">Transmitted Codeword ($D + R$):</span>
                  <span className="text-emerald-400 font-bold break-all">
                    {crcResult.codewordTransmitted}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Step-by-Step Long Division Trace */}
          <div className="lg:col-span-8 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Modulo-2 Binary Long Division Trace (XOR Logic)</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {crcResult.steps.length} Steps
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              At each step, if the leftmost bit is <span className="text-emerald-400 font-bold">1</span>, the divisor polynomial is XORed; if <span className="text-amber-400 font-bold">0</span>, all zeros are subtracted.
            </p>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs overflow-x-auto max-h-[460px] space-y-1">
              <div className="text-slate-500 pb-1 border-b border-slate-800">
                Divisor: <span className="text-emerald-400">{generatorBits}</span> | Dividend with padded zeros: <span className="text-sky-400">{crcResult.paddedData}</span>
              </div>

              {crcResult.steps.slice(0, 14).map((step, idx) => (
                <div key={idx} className="py-1 text-slate-300">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-600 text-[11px] w-12">Step {idx + 1}</span>
                    <span className="text-sky-300 font-bold">{step.currentDividend}</span>
                    <span className="text-slate-600">XOR</span>
                    <span className="text-slate-400">{step.subtrahend}</span>
                    <span className="text-slate-600">=</span>
                    <span className="text-amber-300">{step.remainder}</span>
                  </div>
                </div>
              ))}
              {crcResult.steps.length > 14 && (
                <div className="text-slate-500 italic text-[11px] pt-2">
                  ... ({crcResult.steps.length - 14} additional steps executed to remainder)
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Final FCS Remainder:</span>
                <span className="text-amber-400 font-bold text-sm bg-slate-900 px-3 py-1 rounded border border-amber-500/40">
                  {crcResult.crcRemainder}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Hamming Code (7,4) */}
      {activeTab === 'hamming' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              1. Sender: 4 Data Bits Input
            </h3>
            <p className="text-xs text-slate-400">
              Set the 4 data bits ($d_3, d_5, d_6, d_7$). NetLearn calculates 3 parity bits ($p_1, p_2, p_4$) using even parity.
            </p>

            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'd3 (bit 3)', idx: 0 },
                { label: 'd5 (bit 5)', idx: 1 },
                { label: 'd6 (bit 6)', idx: 2 },
                { label: 'd7 (bit 7)', idx: 3 },
              ].map(({ label, idx }) => (
                <button
                  key={label}
                  onClick={() => {
                    const next: [number, number, number, number] = [...hammingData];
                    next[idx] = next[idx] === 1 ? 0 : 1;
                    setHammingData(next);
                  }}
                  className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-center hover:border-sky-500 transition-colors"
                >
                  <div className="text-[11px] text-slate-400 mb-1">{label}</div>
                  <div className="text-xl font-mono font-bold text-sky-400">
                    {hammingData[idx]}
                  </div>
                </button>
              ))}
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono space-y-1">
              <div className="text-slate-400 font-semibold mb-1">Generated Parity Bits:</div>
              <div>p1 = d3 ⊕ d5 ⊕ d7 = {transmittedCode[1]}</div>
              <div>p2 = d3 ⊕ d6 ⊕ d7 = {transmittedCode[2]}</div>
              <div>p4 = d5 ⊕ d6 ⊕ d7 = {transmittedCode[4]}</div>
            </div>
          </div>

          <div className="lg:col-span-7 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                2. Receiver: Bit-Flip Error Injector
              </h3>
              <button
                onClick={() => setReceivedCode([...transmittedCode])}
                className="text-xs text-sky-400 hover:text-white flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Clean</span>
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Click any of the 7 bits below to simulate a single bit transmission error. Watch the syndrome math detect and pinpoint the exact error position!
            </p>

            <div className="grid grid-cols-7 gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map((pos) => {
                const isParity = pos === 1 || pos === 2 || pos === 4;
                const isCorrupted = receivedCode[pos] !== transmittedCode[pos];
                return (
                  <button
                    key={pos}
                    onClick={() => toggleReceivedBit(pos)}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      isCorrupted
                        ? 'bg-rose-950/60 border-rose-500 shadow-md shadow-rose-500/20'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-[10px] text-slate-400 font-mono mb-1">
                      {isParity ? `P${pos}` : `D${pos}`}
                    </div>
                    <div
                      className={`text-xl font-mono font-bold ${
                        isCorrupted ? 'text-rose-400 animate-pulse' : 'text-white'
                      }`}
                    >
                      {receivedCode[pos]}
                    </div>
                    <div className="text-[9px] text-slate-500 mt-1">Bit {pos}</div>
                  </button>
                );
              })}
            </div>

            {/* Syndrome Calculation Result */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Syndrome Bits ($s_4, s_2, s_1$):</span>
                <span className="text-white font-bold">{s4}{s2}{s1}</span>
              </div>

              {errorPosition === 0 ? (
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-950/30 p-2.5 rounded border border-emerald-500/30">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>No Error Detected! Syndrome is 000. Data verified pristine.</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-rose-400 font-semibold bg-rose-950/30 p-2.5 rounded border border-rose-500/30">
                  <AlertTriangle className="w-4 h-4" />
                  <span>
                    Error Detected at Bit Position {errorPosition}! ({s4}*4 + {s2}*2 + {s1}*1 = {errorPosition}). The hardware flips Bit {errorPosition} to correct it.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Internet Checksum */}
      {activeTab === 'checksum' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              16-Bit Word Inputs
            </h3>
            <p className="text-xs text-slate-400">
              Used in IPv4, TCP, and UDP headers. Words are summed using 1's complement arithmetic where carries wrap around to the least significant bit.
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Word 1 (16-bit binary)
              </label>
              <input
                type="text"
                value={chunk1}
                onChange={(e) => setChunk1(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg font-mono text-sm text-sky-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Word 2 (16-bit binary)
              </label>
              <input
                type="text"
                value={chunk2}
                onChange={(e) => setChunk2(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg font-mono text-sm text-emerald-400"
              />
            </div>
          </div>

          <div className="lg:col-span-7 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              1's Complement Summation & Checksum
            </h3>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Word 1:</span>
                <span className="text-sky-400">{chunk1}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Word 2:</span>
                <span className="text-emerald-400">+ {chunk2}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between text-slate-300">
                <span>Sum with carry wrap:</span>
                <span className="text-white font-bold">{chkResult.sum16}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between text-amber-400 font-bold">
                <span>1's Complement Checksum:</span>
                <span className="bg-slate-900 px-2 py-0.5 rounded border border-amber-500/40">
                  {chkResult.checksum16}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              When the receiver receives both words and the checksum, it adds all three together. If the channel was noiseless, the sum will evaluate to all 1s (0xFFFF).
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
