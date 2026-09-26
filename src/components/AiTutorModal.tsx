import React, { useState } from 'react';
import { X, Sparkles, Send, BookOpen, Terminal, Check, Bot } from 'lucide-react';

interface AiTutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialContext?: string;
}

export const AiTutorModal: React.FC<AiTutorModalProps> = ({
  isOpen,
  onClose,
  initialContext = '',
}) => {
  const [level, setLevel] = useState<'Beginner' | 'College' | 'Advanced'>('College');
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string; source?: string }>>([
    {
      role: 'assistant',
      text: 'Hello! I am your **NetLearn AI Tutor**. You can ask me anything about Computer Networks: protocol internals, packet traces, subnetting steps, or troubleshooting why a link is down.',
      source: 'NetLearn System',
    },
  ]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleSend = async (customPrompt?: string) => {
    const query = customPrompt || question;
    if (!query.trim() || loading) return;

    const newHistory = [...chatHistory, { role: 'user' as const, text: query }];
    setChatHistory(newHistory);
    setQuestion('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: query,
          context: initialContext,
          level,
        }),
      });

      if (!res.ok) throw new Error('Network response failed');
      const data = await res.json();
      setChatHistory([...newHistory, { role: 'assistant', text: data.reply, source: data.source }]);
    } catch {
      setChatHistory([
        ...newHistory,
        {
          role: 'assistant',
          text: `### Networking Concept Breakdown\n\nWhen analyzing **${query}**, always trace the encapsulation path across the OSI model: Layer 2 handles MAC addressing & local framing, Layer 3 governs logical IPv4/IPv6 routing and default gateways, and Layer 4 coordinates reliable TCP or low-latency UDP streams. Try testing this in the **NetLearn Simulator** to inspect the live packet headers!`,
          source: 'Offline Fallback',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const samplePrompts = [
    'Explain VLSM calculation step-by-step with an example',
    'Why does my ping give "Destination Host Unreachable"?',
    'Explain TCP 3-way handshake Sequence and Ack numbers',
    'What is the difference between CSMA/CD and CSMA/CA?',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-3xl h-[85vh] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <span>NetLearn AI Networking Tutor</span>
                <span className="text-xs text-sky-400 font-mono">Gemini 3.8 Flash</span>
              </h2>
              <p className="text-xs text-slate-400">
                Interactive explanations, packet debugging, and numerical solving
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Level Selector */}
            <div className="flex items-center p-1 bg-slate-800 rounded-lg text-xs">
              {(['Beginner', 'College', 'Advanced'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    level === l ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Prompt Bar */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-950/30 border-b border-slate-800/60 overflow-x-auto text-xs">
          <span className="text-slate-500 shrink-0 font-medium">Quick Prompts:</span>
          {samplePrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSend(p)}
              disabled={loading}
              className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 whitespace-nowrap transition-colors"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {chatHistory.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div className="flex items-center gap-2 mb-1 text-xs text-slate-500">
                <span>{msg.role === 'user' ? 'You' : 'NetLearn Tutor'}</span>
                {msg.source && <span>· {msg.source}</span>}
              </div>

              <div
                className={`max-w-[88%] p-4 rounded-xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-sky-600 text-white font-medium rounded-br-none'
                    : 'bg-slate-800/90 text-slate-100 border border-slate-700/80 rounded-bl-none shadow-sm'
                }`}
              >
                <div className="prose prose-invert prose-sm max-w-none space-y-2 whitespace-pre-wrap">
                  {msg.text}
                </div>

                {msg.role === 'assistant' && (
                  <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                    <span>Targeting: {level} Level</span>
                    <button
                      onClick={() => handleCopy(msg.text, idx)}
                      className="inline-flex items-center gap-1 hover:text-white transition-colors"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <span>Copy Response</span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex flex-col items-start">
              <div className="text-xs text-slate-500 mb-1">NetLearn Tutor · Thinking...</div>
              <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700/80 text-sm text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                <span>Consulting RFCs, protocol standards, and packet traces...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask anything (e.g. 'Why did my ping fail?', 'How does ARP work?', 'Solve 192.168.1.0/24 for 4 subnets')..."
              className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>Ask</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
