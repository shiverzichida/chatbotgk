'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Dumbbell, ShieldCheck, Zap, MessageSquare, ArrowRight, User, TrendingUp } from 'lucide-react';
import MessageBubble from '@/components/animations/MessageBubble';
import TypingIndicator from '@/components/animations/TypingIndicator';

export default function LandingPage() {
  React.useEffect(() => {
    if (typeof window !== 'undefined' && (window.location.hash.includes('type=recovery') || window.location.hash.includes('access_token'))) {
      window.location.href = `/reset-password${window.location.hash}`;
    }
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col font-sans text-zinc-900 dark:text-zinc-50 overflow-x-hidden">
      
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200/50 dark:border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          
          {/* Logo & Title */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <img 
              src="/logo-gk.jpg" 
              alt="Logo Gizi Kebugaran" 
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover border border-emerald-500/30 shadow-sm flex-shrink-0" 
            />
            <div className="leading-tight">
              <span className="text-xs sm:text-sm font-extrabold tracking-tight block">Gizi Kebugaran</span>
              <p className="text-[9px] sm:text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">Gizi Kebugaran AI</p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
            <a href="#fitur" className="hover:text-emerald-600 transition-colors">Fitur Utama</a>
            <a href="#fitur" className="hover:text-emerald-600 transition-colors">Keunggulan AI</a>
            <a href="#panduan" className="hover:text-emerald-600 transition-colors">Panduan Gizi</a>
          </nav>

          {/* CTA Buttons - Mobile Optimized with Framer Motion Micro-interactions */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Link 
                href="/login" 
                className="flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-xl text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 transition-all"
              >
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Masuk</span>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Link 
                href="/signup" 
                className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-md shadow-emerald-600/10 whitespace-nowrap block"
              >
                Daftar
              </Link>
            </motion.div>
          </div>

        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden flex-1 flex items-center">
        {/* Hero Background Image with Thick Dark Gradient Overlay */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <Image
            src="/images/hero_transformation.png"
            alt="Fitness Body Transformation Background"
            fill
            priority
            className="object-cover opacity-15 dark:opacity-20 filter blur-[1px]"
          />
          {/* Thick Radial & Linear Dark Overlay to Ensure 100% Text Legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-50 via-zinc-50/95 to-zinc-50/70 dark:from-zinc-950 dark:via-zinc-950/95 dark:to-zinc-950/70" />
        </div>

        {/* Decorative background ambient glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none z-0" />
        <div className="absolute top-1/2 right-1/4 w-[350px] h-[350px] bg-teal-500/10 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none z-0" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content with Framer Motion Entrance Animations */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="lg:col-span-7 space-y-6 text-center lg:text-left drop-shadow-sm"
            >
              <motion.span
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-black uppercase tracking-wider border border-emerald-300 dark:border-emerald-800 shadow-sm"
              >
                <Zap className="w-3.5 h-3.5 fill-current text-amber-400 animate-pulse" />
                AI NUTRITION & FITNESS ASSISTANT
              </motion.span>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-black text-zinc-900 dark:text-white leading-[1.1] tracking-tight"
              >
                Optimalkan Nutrisi & Kebugaran Anda Bersama <span className="text-emerald-600 dark:text-emerald-400">AI Trainer</span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-zinc-700 dark:text-zinc-300 text-base sm:text-lg max-w-2xl leading-relaxed mx-auto lg:mx-0 font-medium"
              >
                Konsultasi gizi, penyusunan meal plan, serta pemantauan latihan fisik secara instan. Sistem kecerdasan buatan kami terhubung langsung dengan basis pengetahuan ilmiah buku panduan Gizi Kebugaran resmi.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2"
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                  <Link 
                    href="/login" 
                    className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 flex items-center justify-center gap-2 group"
                  >
                    <span>Coba Chatbot Sekarang</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </motion.div>
                
                <motion.a 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }}
                  href="#fitur" 
                  className="w-full sm:w-auto px-8 py-3.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 rounded-xl font-bold text-center text-zinc-700 dark:text-zinc-300 transition-all block"
                >
                  Pelajari Selengkapnya
                </motion.a>
              </motion.div>
            </motion.div>

            {/* Right Interactive Chatbot Mockup with Animated Entrance & Live Bubbles */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
              className="lg:col-span-5 flex justify-center"
            >
              <div className="relative w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-900 p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-red-400" />
                    <div className="w-3.5 h-3.5 rounded-full bg-yellow-400" />
                    <div className="w-3.5 h-3.5 rounded-full bg-green-400" />
                  </div>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold font-mono flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    chatbot.active
                  </span>
                </div>
                
                {/* Animated Simulated Conversation */}
                <div className="flex-1 flex flex-col justify-center space-y-3.5 my-3 overflow-hidden">
                  <MessageBubble
                    isBot={false}
                    text="Bagaimana cara mencukupi protein harian untuk fat loss?"
                    delay={0.5}
                  />
                  <MessageBubble
                    isBot={true}
                    text="Cukupi protein sebesar 1.6–2.2g per kg berat badan."
                    referenceText="[Rujukan: Buku Gizi Kebugaran Hal. 42]"
                    delay={0.8}
                  />
                </div>

                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 flex items-center justify-between gap-2">
                  <div className="flex-1 h-9 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl px-3 flex items-center text-xs text-zinc-400 font-medium">
                    <span>Tanyakan nutrisi olahraga...</span>
                  </div>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <div className="w-9 h-9 bg-emerald-600 hover:bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-md cursor-pointer transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="fitur" className="py-20 bg-white dark:bg-zinc-900 border-y border-zinc-200/50 dark:border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 sm:text-4xl">
              Teknologi AI untuk Hasil Optimal
            </h2>
            <p className="mt-4 text-zinc-500 dark:text-zinc-400">
              Menghubungkan sains kebugaran dengan kepraktisan asisten kecerdasan buatan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/40 dark:border-zinc-800/40 hover:border-emerald-500/40 transition-all group">
              <div className="p-3 bg-emerald-600 text-white rounded-xl w-fit mb-6 shadow-md shadow-emerald-600/10">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-zinc-900 dark:text-zinc-50">Interaksi Real-time</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Tanyakan apa saja secara bebas dan terima respon instan dari model AI kami yang di-host menggunakan teknologi AI berkecepatan tinggi.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/40 dark:border-zinc-800/40 hover:border-emerald-500/40 transition-all group">
              <div className="p-3 bg-emerald-600 text-white rounded-xl w-fit mb-6 shadow-md shadow-emerald-600/10">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-zinc-900 dark:text-zinc-50">Pengetahuan Berbasis Sains</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Jawaban yang diberikan AI bersumber dari basis data ilmiah panduan gizi dan kebugaran olahraga terverifikasi.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/40 dark:border-zinc-800/40 hover:border-emerald-500/40 transition-all group">
              <div className="p-3 bg-emerald-600 text-white rounded-xl w-fit mb-6 shadow-md shadow-emerald-600/10">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-zinc-900 dark:text-zinc-50">Log Metrik Personal</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Simpan berat badan, porsi kalori, dan protein harian Anda. Lihat grafik kemajuan secara berkala langsung dari dashboard pribadi Anda.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-100 dark:bg-zinc-950 py-10 border-t border-zinc-200/50 dark:border-zinc-900/50 text-center text-xs text-zinc-500 dark:text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p>© 2026 Gizi Kebugaran - Gizi Kebugaran. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
