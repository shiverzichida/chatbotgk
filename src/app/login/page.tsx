'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Dumbbell, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  React.useEffect(() => {
    if (typeof window !== 'undefined' && (window.location.hash.includes('type=recovery') || window.location.hash.includes('access_token'))) {
      window.location.href = `/reset-password${window.location.hash}`;
    }
  }, []);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 1. Coba login via Supabase
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        // Fallback akun lokal simulator jika offline atau database belum siap
        if (email === 'admin@gizikebugaran.com' && password === 'admin123') {
          login(email, 'admin', 'Administrator');
          window.location.href = '/admin';
          return;
        } else if (email === 'user@gizikebugaran.com' && password === 'user123') {
          login(email, 'user', 'User Gizi Kebugaran');
          window.location.href = '/chat';
          return;
        }
        throw authError;
      }

      // Login berhasil via Supabase
      if (data.user) {
        const role = data.user.email === 'admin@gizikebugaran.com' 
          ? 'admin' 
          : (data.user.user_metadata?.role || 'user');
        
        if (role === 'admin') {
          window.location.href = '/admin';
        } else {
          // Cek kelengkapan profil pengguna
          const { data: profile } = await supabase
            .from('profiles')
            .select('date_of_birth, gender, height_cm, goal_type')
            .eq('id', data.user.id)
            .maybeSingle();

          const isIncomplete = !profile || !profile.date_of_birth || !profile.gender || !profile.height_cm || !profile.goal_type;
          
          if (isIncomplete) {
            // Arahkan ke /metrics dan buka modal update profil otomatis
            window.location.href = '/metrics?openProfile=true';
          } else {
            // Profil sudah 100% lengkap -> arahkan ke /metrics
            window.location.href = '/metrics';
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Gagal masuk. Periksa kembali kredensial atau koneksi Anda.');
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
      <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-3xl shadow-2xl p-5 sm:p-7 w-full max-w-sm sm:max-w-md relative z-10 border border-white/20 transition-all duration-300">
        
        {/* Brand Avatar */}
        <div className="flex justify-center mb-3">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-lg bg-zinc-100">
            <Image
              src="/logo-gk.jpg"
              alt="Gizi Kebugaran Logo"
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
        </div>

        {/* Headings */}
        <h1 className="text-xl sm:text-2xl font-black text-center mb-0.5 text-zinc-900 dark:text-zinc-50 tracking-tight">
          Selamat Datang
        </h1>
        <p className="text-center text-emerald-600 dark:text-emerald-400 font-bold mb-4 text-xs sm:text-sm">
          Masuk ke Gizi Kebugaran AI Coach
        </p>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm mb-6 animate-shake">
            {error}
          </div>
        )}



        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <Mail className="w-5 h-5" />
              </div>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="athlete@example.com"
                className="w-full pl-11 pr-4 py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-sm"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-11 py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
            >
              Lupa Password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <p className="text-center text-zinc-500 dark:text-zinc-400 mt-6 text-sm">
          Belum punya akun?{' '}
          <Link
            href="/signup"
            className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold transition-colors"
          >
            Daftar Sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}
