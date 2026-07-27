'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, ArrowLeft, CheckCircle2, Loader2, KeyRound } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setIsLoading(true);

    try {
      const redirectToUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/reset-password` 
        : 'https://chatbotgk.vercel.app/reset-password';

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectToUrl,
      });

      if (error) throw error;

      setStatus({
        type: 'success',
        message: 'Tautan reset password telah dikirim ke email Anda! Silakan periksa kotak masuk (inbox) atau folder spam Anda.'
      });
      setEmail('');
    } catch (err: any) {
      console.error('Error requesting password reset:', err);
      setStatus({
        type: 'error',
        message: err.message || 'Gagal mengirim instruksi reset password. Pastikan email Anda telah terdaftar.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1000"
          alt="Gym Background"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/95 to-teal-950/95 mix-blend-multiply" />
        <div className="absolute inset-0 bg-emerald-900/40 backdrop-blur-[2px]" />
      </div>

      {/* Card Container */}
      <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-3xl shadow-2xl p-6 md:p-8 w-full max-w-md relative z-10 border border-white/20">
        
        {/* Back Link */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Login</span>
        </Link>

        {/* Top Icon Badge */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-500 border border-amber-500/40 flex items-center justify-center font-black shadow-lg">
            <KeyRound className="w-8 h-8 animate-pulse" />
          </div>
        </div>

        {/* Headings */}
        <h1 className="text-2xl font-black text-center mb-1 text-zinc-900 dark:text-zinc-50 tracking-tight">
          Lupa Password Anda?
        </h1>
        <p className="text-center text-zinc-500 dark:text-zinc-400 mb-6 text-xs sm:text-sm leading-relaxed">
          Masukkan email terdaftar Anda di bawah ini. Kami akan mengirimkan tautan untuk menyetel ulang password Anda.
        </p>

        {/* Status Alert */}
        {status && (
          <div className={`p-4 rounded-2xl text-xs font-bold mb-6 border flex items-start gap-2.5 ${
            status.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
              : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800'
          }`}>
            {status.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            ) : null}
            <span className="leading-relaxed">{status.message}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleResetRequest} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300 mb-2">
              Email Terdaftar
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="athlete@example.com"
                className="w-full pl-10 pr-4 py-3 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-sm font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Mengirim Tautan...</span>
              </>
            ) : (
              <span>Kirim Tautan Reset Password</span>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
