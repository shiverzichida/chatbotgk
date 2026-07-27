'use client';

import React, { useState } from 'react';
import { Target, Utensils, Dumbbell, Moon, Bell, CheckCircle2, X, Sparkles, Flame, ShieldCheck } from 'lucide-react';

interface DailyCommitmentBannerProps {
  onOpenAlarmModal: () => void;
}

export default function DailyCommitmentBanner({ onOpenAlarmModal }: DailyCommitmentBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-zinc-900 text-white p-6 sm:p-7 rounded-3xl shadow-xl border border-emerald-500/40 relative overflow-hidden space-y-5">
      
      {/* Ambient Glow */}
      <div className="absolute -top-10 -right-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Dismiss Button */}
      <div className="flex items-start justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center font-black shadow-lg">
            <Target className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                KOMITMEN PROGRAM BARU
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white mt-0.5">
              Komitmen Keseharian: 3 Pilar Utama Program Anda
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="text-zinc-400 hover:text-white p-1 rounded-xl hover:bg-white/10 transition-colors"
          title="Tutup banner"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <p className="text-xs text-zinc-300 leading-relaxed max-w-3xl relative z-10">
        Selamat atas dimulainya program kebugaran Anda! Kunci keberhasilan transformasi fisik secara terukur adalah konsistensi pencatatan. Selama program berjalan, Anda dianjurkan untuk memantau <b>3 Pilar Keseharian</b> berikut:
      </p>

      {/* 3 Pillars Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 relative z-10">
        
        {/* Pilar 1: Makanan */}
        <div className="bg-zinc-900/80 p-4 rounded-2xl border border-white/10 space-y-1.5 hover:border-emerald-400/50 transition-all">
          <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs">
            <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-300">
              <Utensils className="w-4 h-4" />
            </div>
            <span>1. Catat Asupan Makanan</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Laporkan makanan & minuman harian Anda untuk menjaga ketersediaan kuota kalori & target protein harian.
          </p>
        </div>

        {/* Pilar 2: Olahraga */}
        <div className="bg-zinc-900/80 p-4 rounded-2xl border border-white/10 space-y-1.5 hover:border-emerald-400/50 transition-all">
          <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs">
            <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-300">
              <Dumbbell className="w-4 h-4" />
            </div>
            <span>2. Sesi Olahraga</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Rekap jenis latihan fisik, durasi (menit), dan tingkat intensitas untuk mengukur pembakaran kalori ekstra.
          </p>
        </div>

        {/* Pilar 3: Tidur */}
        <div className="bg-zinc-900/80 p-4 rounded-2xl border border-white/10 space-y-1.5 hover:border-emerald-400/50 transition-all">
          <div className="flex items-center gap-2 text-indigo-400 font-extrabold text-xs">
            <div className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-300">
              <Moon className="w-4 h-4" />
            </div>
            <span>3. Laporan Jam Tidur</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Laporkan jam tidur & bangun semalam untuk menghitung <i>Recovery Score</i> dan sintesis pemulihan otot.
          </p>
        </div>

      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-white/10 relative z-10">
        <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Rekap harian dapat Anda atur melalui alarm pengingat malam.</span>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={onOpenAlarmModal}
            className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 whitespace-nowrap"
          >
            <Bell className="w-4 h-4" />
            <span>⏰ Atur Alarm Rekap Harian</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 whitespace-nowrap"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>🚀 Saya Siap Berkomitmen!</span>
          </button>
        </div>
      </div>

    </div>
  );
}
