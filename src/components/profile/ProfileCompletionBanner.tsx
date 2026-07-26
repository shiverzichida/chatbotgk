'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, UserCheck, Edit3, X, ArrowRight, ShieldAlert } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ProfileCompletionBannerProps {
  onOpenEditProfile: () => void;
}

export default function ProfileCompletionBanner({ onOpenEditProfile }: ProfileCompletionBannerProps) {
  const [completionRate, setCompletionRate] = useState<number>(100);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkProfileCompletion = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) {
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, date_of_birth, gender, height_cm, goal_type, activity_level')
          .eq('id', userId)
          .maybeSingle();

        let score = 0;
        const missing: string[] = [];

        if (profile?.full_name && profile.full_name !== 'Pengguna') {
          score += 20;
        } else {
          missing.push('Nama Lengkap');
        }

        if (profile?.date_of_birth) {
          score += 20;
        } else {
          missing.push('Tanggal Lahir (Usia)');
        }

        if (profile?.gender) {
          score += 15;
        } else {
          missing.push('Jenis Kelamin');
        }

        if (profile?.height_cm && profile.height_cm > 0) {
          score += 15;
        } else {
          missing.push('Tinggi Badan');
        }

        if (profile?.goal_type) {
          score += 15;
        } else {
          missing.push('Target Utama');
        }

        if (profile?.activity_level) {
          score += 15;
        } else {
          missing.push('Level Aktivitas');
        }

        setCompletionRate(score);
        setMissingFields(missing);
      } catch (e) {
        console.warn('Gagal mengecek kelengkapan profil:', e);
      } finally {
        setLoading(false);
      }
    };

    checkProfileCompletion();
  }, []);

  if (loading || completionRate >= 100 || isDismissed) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-900 via-teal-950 to-zinc-900 text-white rounded-3xl p-5 shadow-xl border-2 border-emerald-500/40 relative overflow-hidden mb-6 animate-in fade-in slide-in-from-top-3 duration-300">
      
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>HIMBAUAN AKUN BARU</span>
            </span>
            <span className="text-xs font-bold text-emerald-400">
              Kelengkapan Profil: {completionRate}%
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-black text-white leading-tight">
            Selamat Datang! Lengkapi Profil Kamu Dulu Yuk 🎉
          </h3>

          <p className="text-xs text-zinc-300 leading-relaxed max-w-2xl">
            Profil fisik kamu baru terisi <b className="text-emerald-400">{completionRate}%</b>. Lengkapi {missingFields.slice(0, 3).join(', ')} agar <b>AI Coach Mury</b> dapat menyusun target kalori, protein, dan jurnal harian yang 100% presisi!
          </p>

          {/* Progress Bar */}
          <div className="w-full max-w-md bg-zinc-800/80 rounded-full h-2 overflow-hidden p-0.5 border border-white/10 mt-1">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500 shadow-sm" 
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 self-end md:self-center flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-2.5 text-zinc-400 hover:text-white transition-colors"
            title="Nanti Saja"
          >
            <X className="w-5 h-5" />
          </button>
          
          <button
            type="button"
            onClick={onOpenEditProfile}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-xs rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 active:scale-95 whitespace-nowrap"
          >
            <Edit3 className="w-4 h-4" />
            <span>Lengkapi Profil Sekarang</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
