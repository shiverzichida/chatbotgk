'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import EditProfileModal from '@/components/profile/EditProfileModal';
import { 
  Bot, 
  Send, 
  User as UserIcon, 
  User,
  LogOut, 
  MessageSquare, 
  BookOpen, 
  TrendingUp, 
  ChevronRight, 
  Loader2,
  Trash2,
  Menu,
  X,
  Calculator,
  Utensils,
  Dumbbell
} from 'lucide-react';

export default function ChatPage() {
  const { user, loading, logout } = useAuth();
  const [authorized, setAuthorized] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string; time: string }>>([
    { sender: 'bot', text: 'Halo! Saya asisten AI Gizi Kebugaran Anda. Ada yang bisa saya bantu hari ini terkait program diet, latihan, atau nutrisi Anda?', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        window.location.href = '/login';
      } else {
        setAuthorized(true);
      }
    }
  }, [user, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Fetch atau buat Sesi Chat di Supabase
  useEffect(() => {
    const fetchOrCreateSession = async () => {
      if (!authorized || !user) return;
      try {
        // Ambil ID session user login dari auth
        const { data: { session: authSession } } = await supabase.auth.getSession();
        const userId = authSession?.user?.id;

        if (!userId) {
          throw new Error('Sesi user auth tidak ditemukan');
        }

        // Cari sesi chat aktif terakhir
        const { data: sessions, error } = await supabase
          .from('chat_sessions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) throw error;

        let activeSession = sessions?.[0];

        // Jika belum ada sesi, buat sesi default baru
        if (!activeSession) {
          const { data: newSession, error: createError } = await supabase
            .from('chat_sessions')
            .insert({
              user_id: userId,
              title: 'Percakapan Gizi Kebugaran'
            })
            .select()
            .single();

          if (createError) throw createError;
          activeSession = newSession;
        }

        setSessionId(activeSession.id);

        // Ambil riwayat pesan dari database untuk sesi ini
        const { data: messagesData, error: msgError } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('session_id', activeSession.id)
          .order('created_at', { ascending: true });

        if (msgError) throw msgError;

        if (messagesData && messagesData.length > 0) {
          setMessages(messagesData.map(m => ({
            sender: (m.sender === 'assistant' ? 'bot' : 'user') as 'user' | 'bot',
            text: m.content,
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          })));
        }
      } catch (err) {
        console.warn('Gagal memuat sesi chat dari Supabase, beralih ke LocalStorage fallback:', err);
        // Fallback ke localStorage
        const savedMessages = localStorage.getItem(`gk_chat_history_${user.email}`);
        if (savedMessages) {
          try {
            setMessages(JSON.parse(savedMessages));
          } catch (e) {
            // Keep default
          }
        }
      }
    };

    fetchOrCreateSession();
  }, [authorized, user]);

  // 2. Polling 5 Detik untuk mendeteksi intervensi Admin/Coach
  useEffect(() => {
    if (!sessionId || !authorized) return;

    const interval = setInterval(async () => {
      try {
        const { data: messagesData, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true });

        if (!error && messagesData) {
          const mapped = messagesData.map(m => ({
            sender: (m.sender === 'assistant' ? 'bot' : 'user') as 'user' | 'bot',
            text: m.content,
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
          
          // Hanya update state jika jumlah pesan bertambah (mencegah loop rendering)
          setMessages((prev) => {
            if (prev.length !== mapped.length) {
              return mapped;
            }
            return prev;
          });
        }
      } catch (e) {
        // ignore polling errors
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [sessionId, authorized]);

  const handleClearChat = async () => {
    if (window.confirm('Apakah Anda yakin ingin mereset seluruh riwayat percakapan ini?')) {
      try {
        if (sessionId) {
          // Hapus semua pesan di database untuk sesi ini
          const { error } = await supabase
            .from('chat_messages')
            .delete()
            .eq('session_id', sessionId);
          if (error) throw error;
        }
      } catch (err) {
        console.warn('Gagal mereset chat di Supabase, menghapus lokal:', err);
      }
      
      const initialMsg = [{ 
        sender: 'bot' as const, 
        text: 'Halo! Saya asisten AI Gizi Kebugaran Anda. Ada yang bisa saya bantu hari ini terkait program diet, latihan, atau nutrisi Anda?', 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }];
      setMessages(initialMsg);
      if (user) {
        localStorage.setItem(`gk_chat_history_${user.email}`, JSON.stringify(initialMsg));
      }
    }
  };

  // Hanya scroll ke bawah saat pertama kali memuat histori chat
  useEffect(() => {
    if (authorized) {
      scrollToBottom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input;
    const userMsg = { 
      sender: 'user' as const, 
      text: userText, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };
    
    // Simpan pesan user di UI
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);
    
    // Scroll ke bawah agar pesan user & indikator mengetik terlihat
    setTimeout(scrollToBottom, 50);

    try {
      // Panggil API route Next.js kita, kirim sessionId
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userText,
          history: messages,
          sessionId: sessionId // Kirim sessionId untuk logging DB
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal menghubungi AI Server');
      }

      const data = await response.json();

      let citationText = '';
      if (data.citations && data.citations.length > 0) {
        const uniqueCitations = Array.from(new Set(data.citations.map((c: any) => `${c.title} Hal. ${c.page}`)));
        citationText = '\n\n' + uniqueCitations.map((c: any) => `[Rujukan: ${c}]`).join(' ');
      }

      const botMsg = {
        sender: 'bot' as const,
        text: data.text + citationText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMsg]);

      // Backup ke local storage
      if (user) {
        localStorage.setItem(`gk_chat_history_${user.email}`, JSON.stringify([...updatedMessages, botMsg]));
      }

    } catch (error: any) {
      const errorMsg = {
        sender: 'bot' as const,
        text: `Koneksi terganggu. Gagal menghubungi AI Server: ${error.message || 'Error internal'}. Pastikan koneksi internet aktif dan GROQ_API_KEY sudah dikonfigurasi di file .env.local`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-zinc-600 dark:text-zinc-400 font-medium">Memuat sistem autentikasi...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null; // Akan dialihkan oleh useEffect
  }

  return (
    <div className="h-[100dvh] w-screen bg-zinc-50 dark:bg-zinc-950 flex font-sans overflow-hidden">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:w-80 h-full bg-zinc-900 text-zinc-100 flex-col border-r border-zinc-800 flex-shrink-0 overflow-hidden">
        {/* Header/Logo */}
        <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
          <img src="/logo-gk.jpg" alt="Logo Gizi Kebugaran" className="w-10 h-10 rounded-xl object-cover border border-emerald-500/30 shadow-sm" />
          <div>
            <h1 className="text-sm font-bold tracking-tight">Gizi Kebugaran</h1>
            <p className="text-xs text-emerald-500 font-medium">Gizi Kebugaran AI</p>
          </div>
        </div>

        {/* User Card */}
        <div 
          onClick={() => setShowProfileModal(true)}
          className="p-4 mx-4 my-6 bg-zinc-800/50 hover:bg-zinc-800/80 rounded-2xl border border-zinc-800 flex items-center gap-3 cursor-pointer transition-all group"
          title="Klik untuk ubah profil"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-white uppercase flex-shrink-0 group-hover:scale-105 transition-transform">
            {user?.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold truncate group-hover:text-emerald-400 transition-colors">{user?.name}</p>
              <User className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
            </div>
            <p className="text-xs text-zinc-400 truncate">{user?.email}</p>
          </div>
        </div>

        {/* Navigation / Sessions */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          <p className="px-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Menu Utama</p>
          <Link href="/chat" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-zinc-800 text-white font-medium text-sm transition-colors">
            <MessageSquare className="w-4 h-4 text-emerald-500" />
            <span>Chatbot AI</span>
          </Link>
          <Link href="/food-log" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 text-sm transition-colors">
            <Utensils className="w-4 h-4 text-emerald-500" />
            <span>Jurnal Makanan</span>
          </Link>
          <Link href="/workout-log" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 text-sm transition-colors">
            <Dumbbell className="w-4 h-4 text-emerald-500" />
            <span>Jurnal Olahraga</span>
          </Link>
          <Link href="/metrics" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 text-sm transition-colors">
            <TrendingUp className="w-4 h-4" />
            <span>Komposisi Tubuh & Target</span>
          </Link>
          <Link href="/calculator" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 text-sm transition-colors">
            <Calculator className="w-4 h-4 text-emerald-500" />
            <span>Kalkulator TDEE & Makro</span>
          </Link>
          {user?.role === 'admin' && (
            <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 text-sm transition-colors">
              <BookOpen className="w-4 h-4 text-emerald-500" />
              <span>Knowledge Base</span>
            </Link>
          )}
        </nav>

        {/* Footer Logout */}
        <div className="p-4 border-t border-zinc-800">
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 bg-zinc-800 hover:bg-red-950/30 hover:text-red-400 text-zinc-400 border border-zinc-800 rounded-xl text-sm font-semibold transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop overlay */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Sidebar content drawer */}
          <aside className="absolute inset-y-0 left-0 w-80 bg-zinc-900 text-zinc-100 flex flex-col shadow-2xl border-r border-zinc-800 animate-slide-in z-10">
            {/* Drawer Header */}
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-600 p-2 rounded-xl text-white">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-sm font-bold tracking-tight">Gizi Kebugaran</h1>
                  <p className="text-[10px] text-emerald-500 font-medium">Gizi Kebugaran AI</p>
                </div>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User Card */}
            <div 
              onClick={() => {
                setIsMobileMenuOpen(false);
                setShowProfileModal(true);
              }}
              className="p-4 mx-4 my-6 bg-zinc-800/50 hover:bg-zinc-800/80 rounded-2xl border border-zinc-800 flex items-center gap-3 cursor-pointer transition-all group"
              title="Klik untuk ubah profil"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-white uppercase flex-shrink-0 group-hover:scale-105 transition-transform">
                {user?.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold truncate group-hover:text-emerald-400 transition-colors">{user?.name}</p>
                  <User className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                </div>
                <p className="text-xs text-zinc-400 truncate">{user?.email}</p>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
              <p className="px-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Menu Utama</p>
              <Link 
                href="/chat" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-zinc-800 text-white font-medium text-sm transition-colors"
              >
                <MessageSquare className="w-4 h-4 text-emerald-500" />
                <span>Chatbot AI</span>
              </Link>
              <Link 
                href="/food-log" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 text-sm transition-colors"
              >
                <Utensils className="w-4 h-4 text-emerald-500" />
                <span>Jurnal Makanan</span>
              </Link>
              <Link 
                href="/workout-log" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 text-sm transition-colors"
              >
                <Dumbbell className="w-4 h-4 text-emerald-500" />
                <span>Jurnal Olahraga</span>
              </Link>
              <Link 
                href="/metrics" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 text-sm transition-colors"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Komposisi Tubuh & Target</span>
              </Link>
              <Link 
                href="/calculator" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 text-sm transition-colors"
              >
                <Calculator className="w-4 h-4 text-emerald-500" />
                <span>Kalkulator TDEE & Makro</span>
              </Link>
              {user?.role === 'admin' && (
                <Link 
                  href="/admin" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 text-sm transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-emerald-500" />
                  <span>Knowledge Base</span>
                </Link>
              )}
            </nav>

            {/* Footer Logout */}
            <div className="p-4 border-t border-zinc-800">
              <button 
                onClick={logout}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 bg-zinc-800 hover:bg-red-950/30 hover:text-red-400 text-zinc-400 border border-zinc-800 rounded-xl text-sm font-semibold transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Chat Workspace */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 h-16 flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-3">
            {/* Hamburger Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden bg-emerald-600 hover:bg-emerald-700 p-2 rounded-xl text-white transition-all active:scale-95 flex items-center justify-center"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Sesi Chat Aktif</h2>
              <p className="text-xs text-zinc-400">RAG AI Nutritionist Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleClearChat}
              className="text-xs font-semibold px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 rounded-xl flex items-center gap-1.5 text-zinc-650 dark:text-zinc-450 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Chat</span>
            </button>
            {user?.role === 'admin' && (
              <Link 
                href="/admin" 
                className="text-xs font-semibold px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-xl flex items-center gap-1 hover:bg-emerald-100 transition-colors"
              >
                <span>Console Admin</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </header>

        {/* Chat History Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-zinc-50/50 dark:bg-zinc-900/10">
          {messages.map((msg, index) => (
            <div 
              key={index}
              className={`flex items-start gap-3.5 max-w-3xl ${
                msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs uppercase ${
                msg.sender === 'user' ? 'bg-zinc-700' : 'bg-emerald-600'
              }`}>
                {msg.sender === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Bubble */}
              <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                msg.sender === 'user' 
                  ? 'bg-zinc-800 text-white rounded-tr-none' 
                  : 'bg-white dark:bg-zinc-900 text-zinc-850 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-800 rounded-tl-none'
              }`}>
                {renderMessageText(msg.text)}
                <span className="block text-[10px] mt-1.5 text-right opacity-60">
                  {msg.time}
                </span>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-start gap-3.5 max-w-3xl">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0 text-white">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl rounded-tl-none shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-1">
                <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          {/* Scroll Anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <footer className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 p-4">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tanyakan tentang nutrisi olahraga, porsi makan, dll..."
              className="flex-1 px-4 py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
            />
            <button 
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl transition-all shadow-md active:scale-95"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </footer>
      </main>

      {/* Modal Edit Profil */}
      <EditProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
      />

    </div>
  );
}

// Fungsi pembantu untuk memparsing markdown sederhana & Tombol Aksi Interaktif (Action Cards)
const renderMessageText = (text: string) => {
  if (!text) return null;

  // Extract explicit ACTION_BUTTON tags: [ACTION_BUTTON: /path | Label]
  const actionButtonRegex = /\[ACTION_BUTTON:\s*([^|]+)\s*\|\s*([^\]]+)\]/g;
  const actionButtons: { url: string; label: string }[] = [];
  let match;

  while ((match = actionButtonRegex.exec(text)) !== null) {
    actionButtons.push({
      url: match[1].trim(),
      label: match[2].trim()
    });
  }

  // Clean text from raw ACTION_BUTTON code tags
  const cleanText = text.replace(actionButtonRegex, '').trim();

  const lines = cleanText.split('\n');

  return (
    <div className="space-y-2">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        
        // Headers
        if (trimmed.startsWith('###')) {
          return (
            <h3 key={idx} className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 mt-4 mb-2 tracking-tight">
              {parseBold(trimmed.replace(/^###\s*/, ''))}
            </h3>
          );
        }
        if (trimmed.startsWith('##')) {
          return (
            <h2 key={idx} className="text-base font-black text-zinc-950 dark:text-zinc-50 mt-5 mb-2.5 tracking-tight">
              {parseBold(trimmed.replace(/^##\s*/, ''))}
            </h2>
          );
        }
        if (trimmed.startsWith('#')) {
          return (
            <h1 key={idx} className="text-lg font-black text-zinc-950 dark:text-zinc-50 mt-6 mb-3 tracking-tight">
              {parseBold(trimmed.replace(/^#\s*/, ''))}
            </h1>
          );
        }
        
        // Bullet points
        if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
          return (
            <ul key={idx} className="list-disc pl-5 my-0.5 text-zinc-800 dark:text-zinc-200">
              <li className="leading-relaxed">
                {parseBold(trimmed.replace(/^[*|-]\s*/, ''))}
              </li>
            </ul>
          );
        }
        
        // Empty lines
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }
        
        // Normal paragraph
        return (
          <p key={idx} className="leading-relaxed text-zinc-850 dark:text-zinc-150">
            {parseBold(line)}
          </p>
        );
      })}

      {/* Render Action Buttons / Interactive Cards */}
      {actionButtons.length > 0 && (
        <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800/80 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <span>🚀 Akses Langsung Fitur Program Anda:</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            {actionButtons.map((btn, bIdx) => (
              <Link
                key={bIdx}
                href={btn.url}
                className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md border border-emerald-400/30 transition-all active:scale-95 group"
              >
                <span className="truncate pr-1">{btn.label}</span>
                <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const parseBold = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-extrabold text-zinc-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
};
