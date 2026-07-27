'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Clock, Utensils, Dumbbell, Moon, CheckCircle2, AlertCircle, X, Sparkles, HeartPulse } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface DailyRecapAlarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: 'log' | 'workout' | 'sleep') => void;
}

export default function DailyRecapAlarmModal({ isOpen, onClose, onNavigateToTab }: DailyRecapAlarmModalProps) {
  const [alarmTime, setAlarmTime] = useState('21:00');
  const [remindFood, setRemindFood] = useState(true);
  const [remindWorkout, setRemindWorkout] = useState(true);
  const [remindSleep, setRemindSleep] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  // Status Checklist Hari Ini
  const [foodLoggedToday, setFoodLoggedToday] = useState(false);
  const [workoutLoggedToday, setWorkoutLoggedToday] = useState(false);
  const [sleepLoggedToday, setSleepLoggedToday] = useState(false);

  // Load alarm settings and today's 3 pillars status from Supabase
  useEffect(() => {
    if (!isOpen) return;

    const fetch3PillarsStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        const todayStr = new Date().toISOString().split('T')[0];

        if (userId) {
          // 1. Check Food Logs
          const { count: foodCount } = await supabase
            .from('food_logs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('date', todayStr);

          setFoodLoggedToday((foodCount || 0) > 0);

          // 2. Check Workout Logs
          const { count: workoutCount } = await supabase
            .from('workout_logs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('date', todayStr);

          setWorkoutLoggedToday((workoutCount || 0) > 0);

          // 3. Check Sleep Logs
          const { count: sleepCount } = await supabase
            .from('sleep_logs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('date', todayStr);

          setSleepLoggedToday((sleepCount || 0) > 0);
        }
      } catch (e) {
        console.error('Gagal mengambil status 3 pilar hari ini:', e);
      }
    };

    fetch3PillarsStatus();
  }, [isOpen]);

  const handleSaveAlarmSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (userId) {
        // Save alarm preferences in user_settings table
        await supabase.from('user_settings').upsert({
          user_id: userId,
          alarm_time: alarmTime,
          remind_food: remindFood,
          remind_workout: remindWorkout,
          remind_sleep: remindSleep,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      }
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        onClose();
      }, 1500);
    } catch (e) {
      console.error('Error saving alarm settings:', e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">Alarm & Rekap Laporan Harian</h3>
              <p className="text-xs text-zinc-400">Pastikan 3 Pilar Keseharian Terisi Setiap Hari</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Checklist Status 3 Pilar Hari Ini */}
        <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
            Checklist 3 Pilar Hari Ini ({new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })})
          </p>

          <div className="space-y-2">
            {/* Pilar 1: Makanan */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs">
              <div className="flex items-center gap-2.5">
                <Utensils className="w-4 h-4 text-emerald-500" />
                <span className="font-bold text-zinc-800 dark:text-zinc-200">1. Asupan Makanan</span>
              </div>
              {foodLoggedToday ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Sudah Dicatat
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => { onClose(); if (onNavigateToTab) onNavigateToTab('log'); }}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold transition-all"
                >
                  + Catat Makanan
                </button>
              )}
            </div>

            {/* Pilar 2: Olahraga */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs">
              <div className="flex items-center gap-2.5">
                <Dumbbell className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-zinc-800 dark:text-zinc-200">2. Sesi Olahraga</span>
              </div>
              {workoutLoggedToday ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Sudah Dicatat
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => { onClose(); if (onNavigateToTab) onNavigateToTab('workout'); }}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[10px] font-bold transition-all"
                >
                  + Catat Olahraga
                </button>
              )}
            </div>

            {/* Pilar 3: Tidur */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs">
              <div className="flex items-center gap-2.5">
                <Moon className="w-4 h-4 text-indigo-500" />
                <span className="font-bold text-zinc-800 dark:text-zinc-200">3. Jam Tidur & Recovery</span>
              </div>
              {sleepLoggedToday ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Sudah Dilaporkan
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => { onClose(); if (onNavigateToTab) onNavigateToTab('sleep'); }}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold transition-all"
                >
                  + Lapor Jam Tidur
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Form Setting Jam Alarm Malam */}
        <form onSubmit={handleSaveAlarmSettings} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Jam Alarm Rekap Harian (Setiap Malam)</span>
            </label>
            <input
              type="time"
              value={alarmTime}
              onChange={e => setAlarmTime(e.target.value)}
              className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50 dark:bg-zinc-950 font-black text-lg text-zinc-900 dark:text-white focus:ring-2 focus:ring-amber-500 text-center"
            />
            <p className="text-[10px] text-zinc-400 text-center mt-1">Rekomendasi: Pukul 21:00 (Jam 9 Malam) sebelum istirahat malam.</p>
          </div>

          <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Pilihan Pengingat Rekap:</p>
            
            <label className="flex items-center justify-between text-xs p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer">
              <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-semibold">
                <Utensils className="w-3.5 h-3.5 text-emerald-500" /> Pengingat Asupan Makanan
              </span>
              <input type="checkbox" checked={remindFood} onChange={e => setRemindFood(e.target.checked)} className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500" />
            </label>

            <label className="flex items-center justify-between text-xs p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer">
              <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-semibold">
                <Dumbbell className="w-3.5 h-3.5 text-amber-500" /> Pengingat Sesi Olahraga
              </span>
              <input type="checkbox" checked={remindWorkout} onChange={e => setRemindWorkout(e.target.checked)} className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500" />
            </label>

            <label className="flex items-center justify-between text-xs p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer">
              <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-semibold">
                <Moon className="w-3.5 h-3.5 text-indigo-500" /> Pengingat Jam Tidur & Recovery
              </span>
              <input type="checkbox" checked={remindSleep} onChange={e => setRemindSleep(e.target.checked)} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" />
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
          >
            <Bell className="w-4 h-4" />
            <span>Simpan Jam Alarm Rekap Harian</span>
          </button>

          {isSaved && (
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 text-center flex items-center justify-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Pengaturan jam alarm rekap harian berhasil disimpan!</span>
            </p>
          )}
        </form>

      </div>
    </div>
  );
}
