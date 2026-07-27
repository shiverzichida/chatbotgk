'use client';

import React from 'react';
import { Target, Utensils, Dumbbell, Moon, Bell, CheckCircle2, X, Sparkles, ShieldCheck } from 'lucide-react';

interface DailyCommitmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAlarmModal: () => void;
}

export default function DailyCommitmentModal({ isOpen, onClose, onOpenAlarmModal }: DailyCommitmentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-zinc-950 text-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-emerald-500/50 max-w-2xl w-full relative overflow-hidden space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Ambient Glow */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 relative z-10 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 flex items-center justify-center font-black shadow-xl">
              <Target className="w-6 h-6 animate-bounce text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                  KOMITMEN MULAI PROGRAM
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                Komitmen Keseharian: 3 Pilar Utama Program Anda
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed relative z-10">
          Selamat! Anda telah berkomitmen untuk memulai program target kebugaran Anda. Untuk hasil transformasi fisik yang presisi dan konsisten, Anda diwajibkan untuk mencatat <b>3 Pilar Keseharian</b> berikut:
        </p>

        {/* 3 Pillars Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 relative z-10">
          
          {/* Pilar 1: Makanan */}
          <div className="bg-zinc-900/90 p-4 rounded-2xl border border-white/10 space-y-1.5 hover:border-emerald-400/50 transition-all">
            <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs">
              <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-300">
                <Utensils className="w-4 h-4" />
              </div>
              <span>1. Catat Asupan Makanan</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Laporkan makanan & minuman harian Anda untuk menjaga kuota kalori & target protein.
            </p>
          </div>

          {/* Pilar 2: Olahraga */}
          <div className="bg-zinc-900/90 p-4 rounded-2xl border border-white/10 space-y-1.5 hover:border-emerald-400/50 transition-all">
            <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs">
              <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-300">
                <Dumbbell className="w-4 h-4" />
              </div>
              <span>2. Sesi Olahraga</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Rekap jenis latihan fisik, durasi (menit), dan tingkat intensitas harian.
            </p>
          </div>

          {/* Pilar 3: Tidur */}
          <div className="bg-zinc-900/90 p-4 rounded-2xl border border-white/10 space-y-1.5 hover:border-emerald-400/50 transition-all">
            <div className="flex items-center gap-2 text-indigo-400 font-extrabold text-xs">
              <div className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-300">
                <Moon className="w-4 h-4" />
              </div>
              <span>3. Laporan Jam Tidur</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Laporkan jam tidur semalam untuk menghitung <i>Recovery Score</i> & pemulihan otot.
            </p>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/10 relative z-10">
          <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Aktifkan alarm rekap malam agar tidak terlewat.</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => { onClose(); onOpenAlarmModal(); }}
              className="w-full sm:w-auto px-4 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 whitespace-nowrap"
            >
              <Bell className="w-4 h-4" />
              <span>⏰ Atur Alarm Rekap Harian</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 whitespace-nowrap"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>🚀 Saya Siap Berkomitmen!</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
