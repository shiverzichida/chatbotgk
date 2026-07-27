'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Play, Square, Flame } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function FastingTrackerCard() {
  const [protocol, setProtocol] = useState<'16:8' | '18:6' | '14:10'>('16:8');
  const [isFasting, setIsFasting] = useState(false);
  const [activeLogId, setActiveLogId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Fetch active fasting log exclusively from Supabase
  const fetchFastingState = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (userId) {
        const { data } = await supabase
          .from('fasting_logs')
          .select('*')
          .eq('user_id', userId)
          .eq('is_fasting', true)
          .order('created_at', { ascending: false })
          .maybeSingle();

        if (data) {
          setActiveLogId(data.id);
          setProtocol(data.protocol || '16:8');
          setIsFasting(data.is_fasting);
          setStartTime(new Date(data.start_time).getTime());
        } else {
          setActiveLogId(null);
          setIsFasting(false);
          setStartTime(null);
        }
      }
    } catch (e) {
      console.error('Gagal mengambil data puasa dari Supabase:', e);
    }
  };

  useEffect(() => {
    fetchFastingState();
  }, []);

  // Timer Interval
  useEffect(() => {
    let interval: any = null;
    if (isFasting && startTime) {
      const updateTimer = () => {
        const now = Date.now();
        const diffInSec = Math.max(0, Math.floor((now - startTime) / 1000));
        setElapsedSeconds(diffInSec);
      };
      updateTimer();
      interval = setInterval(updateTimer, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isFasting, startTime]);

  const handleStartFasting = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;

      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from('fasting_logs')
        .insert({
          user_id: userId,
          protocol: protocol,
          start_time: nowIso,
          is_fasting: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error insert fasting_logs:', error);
        return;
      }

      if (data) {
        setActiveLogId(data.id);
        setIsFasting(true);
        setStartTime(new Date(nowIso).getTime());
      }
    } catch (e) {
      console.error('Exception starting fasting:', e);
    }
  };

  const handleStopFasting = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;

      const nowIso = new Date().toISOString();
      if (activeLogId) {
        await supabase
          .from('fasting_logs')
          .update({ is_fasting: false, end_time: nowIso })
          .eq('id', activeLogId);
      } else {
        await supabase
          .from('fasting_logs')
          .update({ is_fasting: false, end_time: nowIso })
          .eq('user_id', userId)
          .eq('is_fasting', true);
      }

      setIsFasting(false);
      setStartTime(null);
      setActiveLogId(null);
    } catch (e) {
      console.error('Exception stopping fasting:', e);
    }
  };

  const handleProtocolChange = (p: '16:8' | '18:6' | '14:10') => {
    setProtocol(p);
  };

  // Calculations
  const fastingHours = protocol === '16:8' ? 16 : protocol === '18:6' ? 18 : 14;
  const targetTotalSeconds = fastingHours * 3600;
  const progressPercent = Math.min(100, Math.round((elapsedSeconds / targetTotalSeconds) * 100));

  const hoursElapsed = Math.floor(elapsedSeconds / 3600);
  const minutesElapsed = Math.floor((elapsedSeconds % 3600) / 60);
  const secondsElapsed = elapsedSeconds % 60;

  const remainingSec = Math.max(0, targetTotalSeconds - elapsedSeconds);
  const hoursRemaining = Math.floor(remainingSec / 3600);
  const minutesRemaining = Math.floor((remainingSec % 3600) / 60);

  return (
    <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-emerald-500/30 space-y-6 relative overflow-hidden">
      
      {/* Ambient Glow */}
      <div className="absolute -top-12 -right-12 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Protocol Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-black text-xl shadow-lg shadow-emerald-500/10">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/30">
                MODE PUASA INTERMITEN
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white">Intermittent Fasting Tracker</h3>
          </div>
        </div>

        {/* Protocol Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-zinc-800/80 p-1 rounded-2xl border border-white/10 self-end sm:self-center">
          {(['16:8', '18:6', '14:10'] as const).map(p => (
            <button
              key={p}
              type="button"
              onClick={() => handleProtocolChange(p)}
              disabled={isFasting}
              className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all ${
                protocol === p
                  ? 'bg-emerald-500 text-zinc-950 shadow-md scale-105'
                  : 'text-zinc-400 hover:text-white disabled:opacity-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Main Timer Ring & Status */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10">
        
        {/* Ring Timer Visual */}
        <div className="md:col-span-5 flex flex-col items-center justify-center space-y-3">
          <div className="relative w-44 h-44 rounded-full border-4 border-zinc-800 flex flex-col items-center justify-center shadow-2xl p-4 bg-zinc-900/60">
            
            {/* SVG Ring Progress */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="88"
                cy="88"
                r="80"
                className="stroke-zinc-800"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="88"
                cy="88"
                r="80"
                className="stroke-emerald-500 transition-all duration-1000"
                strokeWidth="8"
                strokeDasharray={502}
                strokeDashoffset={502 - (502 * progressPercent) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Live Clock Display */}
            <div className="relative z-10 text-center space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                {isFasting ? 'Mode Puasa Aktif' : 'Status: Siap Puasa'}
              </span>
              <h4 className="text-2xl font-black text-white tracking-tight">
                {isFasting ? (
                  `${String(hoursElapsed).padStart(2, '0')}:${String(minutesElapsed).padStart(2, '0')}:${String(secondsElapsed).padStart(2, '0')}`
                ) : (
                  `${fastingHours}:00:00`
                )}
              </h4>
              <p className="text-[10px] font-bold text-zinc-400">
                {isFasting ? `Tersisa ${hoursRemaining}j ${minutesRemaining}m` : `Target ${fastingHours} Jam Puasa`}
              </p>
            </div>
          </div>
        </div>

        {/* Status Explanation & Control Button */}
        <div className="md:col-span-7 space-y-4">
          <div className="bg-zinc-800/50 p-4 rounded-2xl border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
              <span className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-emerald-400" />
                <span>Status Metabolisme Tubuh</span>
              </span>
              <span>{progressPercent}% Terlampaui</span>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              {isFasting ? (
                progressPercent >= 100 ? (
                  <span className="text-emerald-400 font-bold">🎉 Target Puasa Selesai! Tubuh Anda berada dalam fase Autofagi & pembakaran lemak optimal. Jendela makan Anda sekarang terbuka!</span>
                ) : (
                  <span>🔥 Tubuh sedang dalam mode pembersihan seluler dan pembakaran cadangan glikogen/lemak. Pertahankan dengan minum air putih atau teh pahit!</span>
                )
              ) : (
                <span>Mode <b>{protocol}</b> mengharuskan Anda berpuasa kalori selama <b>{fastingHours} jam</b> dan menyantap makanan dalam jendela <b>{24 - fastingHours} jam</b>.</span>
              )}
            </p>
          </div>

          {/* Control Button */}
          <div>
            {!isFasting ? (
              <button
                type="button"
                onClick={handleStartFasting}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-sm rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95"
              >
                <Play className="w-4 h-4 fill-zinc-950" />
                <span>🚀 Mulai Jam Puasa ({protocol})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStopFasting}
                className="w-full py-3.5 bg-zinc-800 hover:bg-red-950/50 hover:border-red-500/50 border border-zinc-700 text-zinc-200 hover:text-red-400 font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Square className="w-4 h-4 fill-red-400" />
                <span>🍽️ Akhiri Puasa & Buka Jendela Makan</span>
              </button>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
