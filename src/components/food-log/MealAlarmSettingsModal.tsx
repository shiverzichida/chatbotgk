'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Clock, Save, X, CheckCircle2, Zap, Play } from 'lucide-react';

export interface MealAlarmSchedule {
  id: 'sarapan' | 'makan_siang' | 'snack' | 'makan_malam';
  label: string;
  emoji: string;
  time: string;
  enabled: boolean;
}

interface MealAlarmSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (schedules: MealAlarmSchedule[]) => void;
  onTestAlarm: (mealType: 'sarapan' | 'makan_siang' | 'snack' | 'makan_malam', timeStr: string) => void;
}

const DEFAULT_SCHEDULES: MealAlarmSchedule[] = [
  { id: 'sarapan', label: 'Sarapan Pagi', emoji: '🌅', time: '07:30', enabled: true },
  { id: 'makan_siang', label: 'Makan Siang', emoji: '☀️', time: '12:30', enabled: true },
  { id: 'snack', label: 'Snack / Camilan Sore', emoji: '🍿', time: '16:00', enabled: false },
  { id: 'makan_malam', label: 'Makan Malam', emoji: '🌙', time: '19:30', enabled: true },
];

export default function MealAlarmSettingsModal({
  isOpen,
  onClose,
  onSave,
  onTestAlarm
}: MealAlarmSettingsModalProps) {
  const [schedules, setSchedules] = useState<MealAlarmSchedule[]>(DEFAULT_SCHEDULES);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [notificationPermission, setNotificationPermission] = useState<string>('default');

  useEffect(() => {
    if (!isOpen) return;
    const saved = localStorage.getItem('gk_meal_alarms');
    if (saved) {
      try {
        setSchedules(JSON.parse(saved));
      } catch (e) {
        setSchedules(DEFAULT_SCHEDULES);
      }
    }
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    } else {
      setNotificationPermission('unsupported');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const res = await Notification.requestPermission();
      setNotificationPermission(res);
      if (res === 'granted') {
        new Notification('🔔 Gizi Kebugaran AI', {
          body: 'Notifikasi Alarm Catat Makanan Berhasil Diaktifkan!',
          icon: '/logo-gk.jpg'
        });
      }
    }
  };

  const handleToggle = (id: string) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const handleTimeChange = (id: string, newTime: string) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, time: newTime } : s));
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('gk_meal_alarms', JSON.stringify(schedules));
    onSave(schedules);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-lg shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-900 via-teal-950 to-zinc-900 text-white flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400">
              <Bell className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight text-white">Pengaturan Alarm Catat Makanan</h3>
              <p className="text-xs text-emerald-300">Setel jadwal 3-4x makan harian Anda</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSaveSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          
          {savedSuccess && (
            <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 p-3 rounded-2xl flex items-center gap-2 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Pengaturan Alarm Berhasil Disimpan!</span>
            </div>
          )}

          <p className="text-zinc-600 dark:text-zinc-400 text-xs">
            Saat waktu alarm yang diaktifkan tiba, sistem akan memunculkan <b>Pop-up Pengingat Makan</b> untuk langsung mencatat makanan atau memilih <i>skip</i>.
          </p>

          {/* Browser Notification Permission Banner */}
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3.5 rounded-2xl flex items-center justify-between gap-3">
            <div>
              <h5 className="font-bold text-emerald-900 dark:text-emerald-300 text-xs">Izin Notifikasi Desktop / Browser:</h5>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                {notificationPermission === 'granted'
                  ? '🟢 Sudah Diizinkan! Notifikasi OS/Browser akan otomatis aktif.'
                  : notificationPermission === 'denied'
                  ? '🔴 Di-blokir di Browser. Silakan izinkan di setelan browser Anda.'
                  : '🟡 Belum diizinkan. Klik tombol di kanan untuk mengaktifkan izin pop-up browser!'}
              </p>
            </div>
            {notificationPermission !== 'granted' && notificationPermission !== 'unsupported' && (
              <button
                type="button"
                onClick={handleRequestNotificationPermission}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all whitespace-nowrap active:scale-95 flex-shrink-0"
              >
                Minta Izin Notifikasi
              </button>
            )}
          </div>

          {/* Alarm Item Cards */}
          <div className="space-y-3 pt-1">
            {schedules.map((item) => (
              <div 
                key={item.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  item.enabled 
                    ? 'bg-zinc-50 dark:bg-zinc-950 border-emerald-500/40 shadow-sm' 
                    : 'bg-zinc-100/50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    {item.emoji}
                  </span>
                  <div>
                    <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">{item.label}</h4>
                    <span className="text-[10px] text-zinc-400">
                      Status: {item.enabled ? '🟢 Alarm Aktif' : '⚪ Matikan'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  {/* Time Selector */}
                  <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-xl">
                    <Clock className="w-3.5 h-3.5 text-emerald-500" />
                    <input 
                      type="time" 
                      required
                      value={item.time}
                      onChange={e => handleTimeChange(item.id, e.target.value)}
                      className="bg-transparent font-black text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    />
                  </div>

                  {/* Toggle Button */}
                  <button
                    type="button"
                    onClick={() => handleToggle(item.id)}
                    className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                      item.enabled ? 'bg-emerald-600' : 'bg-zinc-300 dark:bg-zinc-700'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                      item.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Test Alarm Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                onTestAlarm('makan_siang', '12:30');
                onClose();
              }}
              className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 text-amber-500" />
              <span>🔔 Tes Tampilan Pop-up Alarm Sekarang</span>
            </button>
          </div>

          {/* Modal Footer Submit */}
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pengaturan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
