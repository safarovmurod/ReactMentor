'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import { X, Send, Sparkles, HelpCircle, Layers } from 'lucide-react';

interface ChatMsg {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  isDeep?: boolean;
}

export function TutorDrawer() {
  const { tutorDrawerOpen, setTutorDrawerOpen } = useAppStore();
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Салом! Ман ментори шахсии ту дар React ва JavaScript ҳастам. Ҳар саволе дорӣ, бпурс ё коди нофаҳморо нишон те, кӯтоҳ ва сода мефаҳмонам.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!tutorDrawerOpen) return null;

  async function handleSend(isDeep = false) {
    if (!input.trim() && !isDeep) return;

    const userText = isDeep ? 'Чуқур фаҳмон' : input;
    const userMsg: ChatMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!isDeep) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ask',
          userText,
          isDeep,
        }),
      });

      const data = await res.json();
      const assistantMsg: ChatMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: data.reply || 'Савол фаҳмо шуд.',
        isDeep,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: 'Дар пайвастшавӣ хатогӣ шуд. Кӯшиши дигар кун.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm lg:bg-transparent lg:backdrop-blur-none pointer-events-auto">
      <div
        className="fixed inset-y-0 right-0 flex max-w-full pl-0 lg:pl-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-screen max-w-md border-l border-slate-800 bg-slate-950 p-4 shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Ментори React (Local)</h3>
                <span className="text-[11px] text-slate-400">Шарҳи сода бо лаҳҷаи фаҳмо</span>
              </div>
            </div>
            <button
              onClick={() => setTutorDrawerOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${
                  m.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-cyan-600 text-white font-medium'
                      : 'border border-slate-800 bg-slate-900/90 text-slate-200'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                <Sparkles className="h-3.5 w-3.5 animate-spin text-cyan-400" />
                <span>Ментор дар ҳоли навиштан...</span>
              </div>
            )}
          </div>

          {/* Quick prompts & Actions */}
          <div className="space-y-2 border-t border-slate-800 pt-3">
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => {
                  setInput('useState чиба даркорай?');
                }}
                className="flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900/80 px-2 py-1 text-[11px] text-slate-300 hover:border-slate-700"
              >
                <HelpCircle className="h-3 w-3 text-cyan-400" />
                useState чиба даркорай?
              </button>
              <button
                onClick={() => handleSend(true)}
                className="flex items-center gap-1 rounded-md border border-cyan-800/60 bg-cyan-950/40 px-2 py-1 text-[11px] text-cyan-300 hover:bg-cyan-900/50"
              >
                <Layers className="h-3 w-3 text-cyan-400" />
                Чуқур фаҳмон
              </button>
            </div>

            {/* Input area */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Саволатро навис..."
                className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-50 transition-colors"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
