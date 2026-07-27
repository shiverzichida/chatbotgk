'use client';

import React, { useState, useEffect } from 'react';
import { Moon, Sun, Sparkles, CheckCircle2, HeartPulse, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function SleepTrackerCard() {
  const [sleepTime, setSleepTime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('06:30');
  const [quality, setQuality] = useState<'nyenyak' | 'cukup' | 'kurang'>('nyenyak');
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load saved sleep log exclusively from Supabase
  const fetchSleepLog = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      const todayStr = new Date().toISOString().split('T')[0];

      if (userId) {
        const { data } = await supabase
          .from('sleep_logs')
          .select('*')
          .eq('user_id', userId)
          .eq('date', todayStr)
          .maybeSingle();

        if (data) {
          if (data.sleep_time) setSleepTime(data.sleep_time);
          if (data.wake_time) setWakeTime(data.wake_time);
          if (data.quality) setQuality(data.quality);
        }
      }
    } catch (e) {
      console.error('Gagal mengambil data tidur dari Supabase:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSleepLog();
  }, []);

  // Calculate sleep duration in hours
  const calculateDuration = () => {
    const [sH, sM] = sleepTime.split(':').map(Number);
    const [wH, wM] = wakeTime.split(':').map(Number);

    let startMinutes = sH * 60 + sM;
    let endMinutes = wH * 60 + wM;

    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60; // Next day
    }

    const diffMinutes = endMinutes - startMinutes;
    const hours = (diffMinutes / 60).toFixed(1);
    return parseFloat(hours);
  };

  const durationHours = calculateDuration();

  // Calculate Recovery Score (0-100%)
  let recoveryScore = 80;
  if (durationHours >= 7.5 && durationHours <= 9.0) {
    recoveryScore = quality === 'nyenyak' ? 100 : quality === 'cukup' ? 85 : 70;
  } else if (durationHours >= 6.0 && durationHours < 7.5) {
    recoveryScore = quality === 'nyenyak' ? 80 : quality === 'cukup' ? 70 : 55;
  } else {
    recoveryScore = quality === 'nyenyak' ? 60 : quality === 'cukup' ? 50 : 35;
  }

  const handleSaveSleep = async (e: React.FormEvent) => {
    e.preventDefault();
    const todayStr = new Date().toISOString().split('T')[0];

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (userId) {
        await supabase.from('sleep_logs').upsert({
          user_id: userId,
          date: todayStr,
          sleep_time: sleepTime,
          wake_time: wakeTime,
          duration_hours: durationHours,
          quality: quality,
          recovery_score: recoveryScore
        }, { onConflict: 'user_id,date' });

        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      } else {
        alert('Silakan login terlebih dahulu untuk menyimpan data tidur ke Supabase.');
      }
    } catch (e) {
      console.error('Error saving sleep log to Supabase:', e);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-7 shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-6 relative overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Moon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                PEMULIHAN ORGANIK & TIDUR
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white">Laporan Jam Tidur & Recovery</h3>
          </div>
        </div>

        {/* Recovery Score Pill */}
        <div className="bg-zinc-100 dark:bg-zinc-950 px-4 py-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 self-end sm:self-center text-right">
          <p className="text-[9px] uppercase font-bold text-zinc-400">Skor Pemulihan Otot</p>
          <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">{recoveryScore}% Recovery</p>
        </div>
      </div>

      {/* Main Grid: Form Inputs & Recovery Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* Form Inputs */}
        <form onSubmit={handleSaveSleep} className="md:col-span-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1">
                <Moon className="w-3.5 h-3.5 text-indigo-500" />
                <span>Jam Tidur</span>
              </label>
              <input
                type="time"
                value={sleepTime}
                onChange={e => setSleepTime(e.target.value)}
                className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm font-bold text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Jam Bangun</span>
              </label>
              <input
                type="time"
                value={wakeTime}
                onChange={e => setWakeTime(e.target.value)}
                className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm font-bold text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300 mb-1.5">Kualitas Tidur</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'nyenyak', label: '😴 Nyenyak' },
                { id: 'cukup', label: '🙂 Cukup' },
                { id: 'kurang', label: '🥱 Kurang' }
              ].map(q => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setQuality(q.id as any)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    quality === q.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                      : 'bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-indigo-400'
                  }`}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
          >
            <HeartPulse className="w-4 h-4" />
            <span>Simpan Laporan Tidur</span>
          </button>

          {isSaved && (
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 text-center flex items-center justify-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Laporan jam tidur berhasil disimpan!</span>
            </p>
          )}
        </form>

        {/* Right Panel: Recovery Score Display & Analysis */}
        <div className="md:col-span-6 bg-zinc-50 dark:bg-zinc-950 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-zinc-400">Total Durasi Tidur Semalam</p>
              <h4 className="text-2xl font-black text-zinc-900 dark:text-white mt-0.5">
                {durationHours} <span className="text-xs font-normal text-zinc-400">Jam / Hari</span>
              </h4>
            </div>
            
            <div className={`px-3 py-1 rounded-xl text-xs font-black border ${
              recoveryScore >= 85
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                : recoveryScore >= 65
                ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-300 dark:border-sky-800'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800'
            }`}>
              {recoveryScore >= 85 ? '🌟 Optimal Recovery' : recoveryScore >= 65 ? '👍 Pemulihan Sedang' : '⚠️ Butuh Istirahat Ekstra'}
            </div>
          </div>

          <div className="text-xs text-zinc-600 dark:text-zinc-300 space-y-2 leading-relaxed pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <p className="font-bold flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Analisis Gizi & Hormonal Coach Mury:</span>
            </p>
            {durationHours >= 7.5 ? (
              <p>
                Tidur <b>{durationHours} jam</b> berada dalam rentang ideal! Hormon Pertumbuhan (HGH) dilepaskan secara maksimal untuk memperbaiki serat otot dan menekan kadar hormon stres kortisol.
              </p>
            ) : (
              <p>
                Durasi tidur <b>{durationHours} jam</b> sedikit di bawah rekomendasi ideal (7.5-9 jam). Usahakan tidur 30 menit lebih awal malam ini untuk mencegah kelelahan dan mempertahankan laju pembakaran lemak!
              </p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
