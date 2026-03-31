"use client";

import { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Lock, Coins, Volume2, VolumeX, Mic, Square, Loader2, BrainCircuit, Bot } from 'lucide-react';
import { useUserStore } from '../../../../store/userStore';
import { tokenService } from '../../../../lib/tokenService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function AIMentorPage() {
  const currentUser = useUserStore(state => state.users[0]);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([
    { role: 'ai', content: 'Hello! I am your MedEduAI Mentor. How can I help you with your medical studies today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const tokenCheck = currentUser ? tokenService.checkAvailability(currentUser.id, 'AI Mentor') : { allowed: false, required: 0, remaining: 0 };

  useEffect(() => {
      setMounted(true);
      if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
          const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.continuous = true;
          recognitionRef.current.interimResults = true;

          recognitionRef.current.onresult = (event: any) => {
              let currentTranscript = '';
              for (let i = event.resultIndex; i < event.results.length; ++i) {
                  currentTranscript += event.results[i][0].transcript;
              }
              setInput(currentTranscript);
          };

          recognitionRef.current.onerror = (event: any) => {
              console.error("Speech recognition error", event.error);
              setIsListening(false);
          };
      }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleToggleListening = () => {
      if (isListening) {
          recognitionRef.current?.stop();
          setIsListening(false);
      } else {
          setInput('');
          recognitionRef.current?.start();
          setIsListening(true);
      }
  };

  const playAudio = (text: string) => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text.replace(/[*#]/g, ''));
          const voices = window.speechSynthesis.getVoices();
          const preferredVoice = voices.find(v => v.lang.includes('en-GB') || v.lang.includes('en-US'));
          if (preferredVoice) utterance.voice = preferredVoice;

          utterance.onstart = () => setIsPlayingAudio(true);
          utterance.onend = () => setIsPlayingAudio(false);
          utterance.onerror = () => setIsPlayingAudio(false);

          window.speechSynthesis.speak(utterance);
      }
  };

  const stopAudio = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          setIsPlayingAudio(false);
      }
  };

  const handleSend = async () => {
    if ((!input.trim() && !isListening) || !tokenCheck.allowed) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    const userInput = input;
    const newMessages = [...messages, { role: 'user', content: userInput }];
    setMessages(newMessages as any);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/mentor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: newMessages })
      });
      const data = await res.json();
      
      if (currentUser) {
        tokenService.processTransaction(currentUser.id, 'AI Mentor', 'gemini-2.5-flash');
      }

      const aiText = data.response;
      setMessages(prev => [...prev, { role: 'ai', content: aiText }]);
      playAudio(aiText);
    } catch(err) {
      setMessages(prev => [...prev, { role: 'ai', content: "Failed to fetch response. Try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-7rem)]">
      {/* Premium Header */}
      <div className="relative mb-6 flex-shrink-0">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900 rounded-3xl p-6 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <BrainCircuit className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">AI MentorPro</h2>
                <p className="text-emerald-300/80 text-sm font-medium">24/7 AI-powered medical study companion</p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-xl flex items-center gap-2 backdrop-blur-sm border ${!mounted ? 'bg-white/5 border-white/10 text-white/50' : tokenCheck.allowed ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300' : 'bg-red-500/15 border-red-400/30 text-red-300'}`}>
              <Coins className="w-4 h-4" />
              <span className="font-bold text-sm">
                {!mounted ? '...' : tokenCheck.allowed ? `${tokenCheck.remaining} Tokens` : 'No Tokens'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-200/80 shadow-lg flex flex-col overflow-hidden backdrop-blur-sm">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                {msg.role === 'ai' ? (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/20">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-500/20">
                    <span className="text-white text-xs font-bold">You</span>
                  </div>
                )}

                {/* Message Bubble */}
                <div className="relative group">
                  <div className={`rounded-2xl px-5 py-3.5 ${msg.role === 'user'
                    ? 'bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-md shadow-indigo-500/15'
                    : 'bg-slate-50 text-slate-700 border border-slate-100 shadow-sm prose prose-sm prose-slate max-w-none'
                    }`}>
                    {msg.role === 'user' ? (
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    ) : (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    )}
                  </div>
                  
                  {msg.role === 'ai' && (
                    <button 
                       onClick={() => playAudio(msg.content)} 
                       className="absolute -right-11 bottom-1 p-2 text-slate-300 hover:text-emerald-500 bg-white border border-slate-200 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                       title="Read aloud"
                    >
                        <Volume2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && (
             <div className="flex justify-start animate-in fade-in duration-300">
               <div className="flex gap-3">
                 <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/20">
                   <Bot className="w-5 h-5 text-white animate-pulse" />
                 </div>
                 <div className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 shadow-sm">
                   <div className="flex items-center gap-2">
                     <div className="flex gap-1">
                       <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                       <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                       <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                     </div>
                     <span className="text-sm text-slate-500 font-medium ml-2">Thinking...</span>
                   </div>
                 </div>
               </div>
             </div>
          )}

          {isPlayingAudio && (
              <div className="flex justify-center sticky bottom-2 z-10 animate-in fade-in zoom-in duration-300">
                  <button 
                      onClick={stopAudio}
                      className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-5 py-2.5 rounded-full font-bold shadow-lg flex items-center gap-2 transition-all text-sm border border-slate-700 hover:shadow-xl hover:scale-105"
                  >
                      <VolumeX className="w-4 h-4" /> Stop Audio
                  </button>
              </div>
          )}

          {mounted && !tokenCheck.allowed && (
            <div className="flex justify-center mt-8 p-4">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-8 text-center max-w-md w-full shadow-lg">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
                  <Lock className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-amber-900 mb-2 text-lg">Token Limit Reached</h3>
                <p className="text-sm text-amber-700/80 mb-5">You have exhausted your available tokens. Each query costs {tokenCheck.required} tokens.</p>
                <button className="bg-gradient-to-r from-slate-800 to-slate-900 text-white font-bold px-6 py-3 rounded-xl hover:shadow-lg transition-all w-full">
                  Purchase Token Pack
                </button>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-gradient-to-t from-slate-50 to-white border-t border-slate-100">
          <div className="flex items-end gap-3 relative max-w-4xl mx-auto">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={!mounted ? "Loading..." : tokenCheck.allowed ? (isListening ? "🎙️ Listening... speak now..." : "Ask a medical question...") : "Tokens exhausted..."}
                className={`w-full resize-none h-14 rounded-2xl border p-4 pr-14 outline-none text-sm transition-all font-medium ${isListening ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200 shadow-emerald-100 shadow-lg' : 'bg-white border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 shadow-sm focus:shadow-md'}`}
                disabled={!mounted || !tokenCheck.allowed}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                }}
              />
              
              <button
                  onClick={handleToggleListening}
                  disabled={!tokenCheck.allowed}
                  className={`absolute right-3 bottom-2 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isListening ? 'bg-red-500 text-white shadow-lg shadow-red-500/25 scale-110' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                  title={isListening ? "Stop Listening" : "Start Voice Input"}
              >
                  {isListening ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-5 h-5" />}
              </button>
            </div>

            <button
              onClick={handleSend}
              disabled={!mounted || (!input.trim() && !isListening) || !tokenCheck.allowed || loading}
              className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl flex items-center justify-center hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 hover:scale-105 active:scale-95"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
