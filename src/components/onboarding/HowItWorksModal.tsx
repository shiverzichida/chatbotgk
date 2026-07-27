'use client';

import React from 'react';
import { Sparkles, Calculator, Target, Camera, Utensils, Dumbbell, Moon, Trophy, CheckCircle2, ArrowRight, X, HeartPulse } from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (path: string) => void;
}

export default function HowItWorksModal({ isOpen, onClose, onNavigate }: HowItWorksModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-zinc-900 via-zinc-950 to-black text-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-emerald-500/40 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 animate-in fade-in zoom-in-95 duration-200 relative">
        
        {/* Ambient Glow */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-black text-xl shadow-lg shadow-emerald-600/30">
              <Sparkles className="w-6 h-6 text-amber-300 animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/30">
                  PANDUAN PENGGUNA BARU
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                4 Langkah Mudah Transformasi Fisik Anda 🚀
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed relative z-10">
          Selamat datang di <b>Gizi Kebugaran AI Coach Mury</b>! Aplikasi ini dirancang untuk mendampingi program kebugaran Anda secara ilmiah, mudah, dan menyenangkan. Berikut cara kerjanya dalam 4 langkah:
        </p>

        {/* 4 Steps Timeline */}
        <div className="space-y-4 relative z-10">
          
          {/* Step 1 */}
          <div className="bg-zinc-900/90 p-4 sm:p-5 rounded-2xl border border-white/10 flex items-start gap-4 hover:border-emerald-500/50 transition-all group">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-black text-base flex-shrink-0 group-hover:scale-110 transition-transform">
              1
            </div>
            <div className="space-y-1 flex-1">
              <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-400" />
                <span>Hitung Kuota Kebutuhan Tubuhmu (TDEE)</span>
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Buka menu <b>Kalkulator TDEE</b> untuk mengetahui berapa pas kalori & protein yang dibutuhkan tubuhmu sesuai tinggi, berat, dan level aktivitasmu.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-zinc-900/90 p-4 sm:p-5 rounded-2xl border border-white/10 flex items-start gap-4 hover:border-emerald-500/50 transition-all group">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-black text-base flex-shrink-0 group-hover:scale-110 transition-transform">
              2
            </div>
            <div className="space-y-1 flex-1">
              <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-400" />
                <span>Pilih Program & Set Komitmen 3 Pilar</span>
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Tentukan sasaranmu: 🔥 <b>Fat Loss</b>, 💪 <b>Bulking</b>, ⚡ <b>Body Recomposition</b>, atau ⚖️ <b>Maintenance</b>. Lalu atur jam alarm pengingat rekap malammu.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-zinc-900/90 p-4 sm:p-5 rounded-2xl border border-white/10 flex items-start gap-4 hover:border-emerald-500/50 transition-all group">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/40 flex items-center justify-center font-black text-base flex-shrink-0 group-hover:scale-110 transition-transform">
              3
            </div>
            <div className="space-y-1 flex-1">
              <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-sky-400" />
                <span>Catat Keseharianmu (Jepret Foto AI, Olahraga & Tidur)</span>
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Cukup <b>jepret foto makananmu pakai AI Vision Scanner</b> untuk menghitung kalori otomatis, catat latihanmu di Jurnal Olahraga, dan lapor jam tidur semalam.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-zinc-900/90 p-4 sm:p-5 rounded-2xl border border-white/10 flex items-start gap-4 hover:border-emerald-500/50 transition-all group">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center font-black text-base flex-shrink-0 group-hover:scale-110 transition-transform">
              4
            </div>
            <div className="space-y-1 flex-1">
              <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-indigo-400" />
                <span>Kumpulkan XP, Naik Level & Terima Review Coach Mury</span>
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Nikmati petualangan game kebugaran (*Expedition Journey*), kumpulkan Badge prestasi, dan dapatkan evaluasi mingguan dari AI Coach Mury!
              </p>
            </div>
          </div>

        </div>

        {/* Footer Action Button */}
        <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
          <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
            <HeartPulse className="w-4 h-4 text-emerald-400" />
            <span>Siap memulai transformasi fisikmu hari ini?</span>
          </p>

          <button
            type="button"
            onClick={() => {
              onClose();
              if (onNavigate) onNavigate('/calculator');
              else window.location.href = '/calculator';
            }}
            className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 whitespace-nowrap"
          >
            <span>🚀 Hitung TDEE & Mulai Sekarang</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
