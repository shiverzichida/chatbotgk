'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import EditProfileModal from '@/components/profile/EditProfileModal';
import {
  Dumbbell,
  TrendingUp,
  MessageSquare,
  BookOpen,
  LogOut,
  Bot,
  User as UserIcon,
  User,
  Plus,
  Trash2,
  Calendar,
  Calculator,
  Loader2,
  X,
  Menu,
  Utensils,
  Camera,
  Award,
  Activity
} from 'lucide-react';

interface WorkoutLog {
  id: string;
  user_id: string;
  date: string;
  workout_type: string;
  duration_minutes: number;
  intensity: string;
  notes?: string;
}

interface UserTarget {
  id: string;
  weekly_workouts_target: number;
}

export default function WorkoutLogPage() {
  const { user, loading, logout } = useAuth();
  const [authorized, setAuthorized] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [activeTarget, setActiveTarget] = useState<UserTarget | null>(null);

  const [workoutForm, setWorkoutForm] = useState({
    date: new Date().toISOString().split('T')[0],
    workoutType: 'Latihan Beban',
    duration: '',
    intensity: 'sedang',
    notes: ''
  });

  useEffect(() => {
    if (!loading) {
      if (!user) {
        window.location.href = '/login';
      } else {
        setAuthorized(true);
      }
    }
  }, [user, loading]);

  useEffect(() => {
    if (!authorized) return;

    const fetchWorkoutData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) return;

        // Fetch active target
        const { data: target } = await supabase
          .from('user_targets')
          .select('id, weekly_workouts_target')
          .eq('user_id', userId)
          .eq('is_active', true)
          .maybeSingle();

        if (target) setActiveTarget(target);

        // Fetch Workouts (this week)
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

        const { data: workoutsData } = await supabase
          .from('workout_logs')
          .select('*')
          .eq('user_id', userId)
          .gte('date', startOfWeekStr)
          .order('date', { ascending: false });

        if (workoutsData) setWorkoutLogs(workoutsData);
      } catch (err) {
        console.warn('Error fetching workout logs:', err);
      }
    };

    fetchWorkoutData();
  }, [authorized]);

  const handleWorkoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workoutForm.duration) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;

      const newLog = {
        user_id: userId,
        date: workoutForm.date,
        workout_type: workoutForm.workoutType,
        duration_minutes: parseInt(workoutForm.duration) || 0,
        intensity: workoutForm.intensity,
        notes: workoutForm.notes
      };

      const { data, error } = await supabase
        .from('workout_logs')
        .insert(newLog)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setWorkoutLogs([data, ...workoutLogs]);
      }
    } catch (err) {
      console.warn('Fallback ke state lokal:', err);
      setWorkoutLogs([{
        id: String(Date.now()),
        user_id: 'local',
        date: workoutForm.date,
        workout_type: workoutForm.workoutType,
        duration_minutes: parseInt(workoutForm.duration) || 0,
        intensity: workoutForm.intensity,
        notes: workoutForm.notes
      }, ...workoutLogs]);
    }

    setWorkoutForm({
      date: new Date().toISOString().split('T')[0],
      workoutType: 'Latihan Beban',
      duration: '',
      intensity: 'sedang',
      notes: ''
    });
  };

  const handleDeleteWorkout = async (id: string) => {
    try {
      if (id.length === 36) {
        await supabase.from('workout_logs').delete().eq('id', id);
      }
    } catch (err) {}
    setWorkoutLogs(workoutLogs.filter(w => w.id !== id));
  };

  const weeklyWorkoutTarget = activeTarget?.weekly_workouts_target || 4;

  if (loading || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-zinc-500">Memuat Jurnal Olahraga...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans overflow-hidden">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-72 w-72 h-screen bg-zinc-900 text-zinc-100 flex-col border-r border-zinc-800 flex-shrink-0 overflow-hidden sticky top-0 z-20">
        <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
          <img src="/logo-gk.jpg" alt="Logo Gizi Kebugaran" className="w-10 h-10 rounded-xl object-cover border border-emerald-500/30 shadow-sm" />
          <div>
            <h1 className="text-sm font-bold tracking-tight">Gizi Kebugaran</h1>
            <p className="text-xs text-emerald-500 font-medium">Gizi Kebugaran AI</p>
          </div>
        </div>

        {/* User Card */}
        <div 
          onClick={() => setShowProfileModal(true)}
          className="p-4 mx-4 my-6 bg-zinc-800/50 hover:bg-zinc-800/80 rounded-2xl border border-zinc-800 flex items-center gap-3 cursor-pointer transition-all group"
          title="Klik untuk ubah profil"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-white uppercase flex-shrink-0 group-hover:scale-105 transition-transform">
            {user?.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold truncate group-hover:text-emerald-400 transition-colors">{user?.name}</p>
              <User className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
            </div>
            <p className="text-xs text-zinc-400 truncate">{user?.email}</p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          <p className="px-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Menu Utama</p>
          <Link href="/chat" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 text-sm transition-colors">
            <MessageSquare className="w-4 h-4 text-emerald-500" />
            <span>Chatbot AI</span>
          </Link>
          <Link href="/vision" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 text-sm transition-colors">
            <Camera className="w-4 h-4 text-emerald-500" />
            <span>📸 AI Food Scanner</span>
          </Link>
          <Link href="/food-log" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-800/40 text-sm transition-colors">
            <Utensils className="w-4 h-4 text-emerald-500" />
            <span>Jurnal Makanan</span>
          </Link>
          <Link href="/workout-log" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-zinc-800 text-white font-medium text-sm transition-colors">
            <Dumbbell className="w-4 h-4 text-emerald-500" />
            <span>Jurnal Olahraga</span>
          </Link>
          <Link href="/metrics" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-800/40 text-sm transition-colors">
            <TrendingUp className="w-4 h-4" />
            <span>Komposisi Tubuh & Target</span>
          </Link>
          <Link href="/calculator" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-800/40 text-sm transition-colors">
            <Calculator className="w-4 h-4 text-emerald-500" />
            <span>Kalkulator TDEE & Makro</span>
          </Link>
          {user?.role === 'admin' && (
            <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-800/40 text-sm transition-colors">
              <BookOpen className="w-4 h-4 text-emerald-500" />
              <span>Knowledge Base</span>
            </Link>
          )}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-zinc-800">
          <button onClick={logout} className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 bg-zinc-800 text-zinc-400 rounded-xl text-sm font-semibold">
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-zinc-900 text-zinc-100 flex flex-col justify-between shadow-2xl border-r border-zinc-800 z-50 overflow-hidden">
            
            {/* Header & User Info */}
            <div className="flex flex-col border-b border-zinc-800">
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src="/logo-gk.jpg" alt="Logo Gizi Kebugaran" className="w-8 h-8 rounded-xl object-cover border border-emerald-500/30 shadow-sm" />
                  <div>
                    <h1 className="text-sm font-bold text-white">Gizi Kebugaran</h1>
                    <p className="text-[10px] text-emerald-500 font-semibold">Gizi Kebugaran AI</p>
                  </div>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-1.5 bg-zinc-800 text-zinc-400 rounded-lg hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* User Profile Card */}
              <div 
                onClick={() => { setIsMobileMenuOpen(false); setShowProfileModal(true); }}
                className="mx-4 mb-4 p-3 bg-zinc-800/60 hover:bg-zinc-800 rounded-2xl border border-zinc-700/50 flex items-center gap-3 cursor-pointer transition-all group"
                title="Klik untuk ubah profil"
              >
                <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white uppercase flex-shrink-0">
                  {user?.name ? user.name.charAt(0) : 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-white truncate group-hover:text-emerald-400">{user?.name || 'User'}</p>
                    <User className="w-3 h-3 text-zinc-400 group-hover:text-emerald-400" />
                  </div>
                  <p className="text-[10px] text-zinc-400 truncate">{user?.email || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto py-4">
              <p className="px-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Menu Utama</p>
              <Link href="/chat" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-800/40 text-sm transition-colors">
                <MessageSquare className="w-4 h-4" />
                <span>Chatbot AI</span>
              </Link>
              <Link href="/food-log" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-800/40 text-sm transition-colors">
                <Utensils className="w-4 h-4 text-emerald-500" />
                <span>Jurnal Makanan</span>
              </Link>
              <Link href="/workout-log" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 bg-zinc-800 text-white font-medium text-sm rounded-xl transition-colors">
                <Dumbbell className="w-4 h-4 text-emerald-500" />
                <span>Jurnal Olahraga</span>
              </Link>
              <Link href="/metrics" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-800/40 text-sm transition-colors">
                <TrendingUp className="w-4 h-4" />
                <span>Komposisi Tubuh & Target</span>
              </Link>
              <Link href="/calculator" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-800/40 text-sm transition-colors">
                <Calculator className="w-4 h-4 text-emerald-500" />
                <span>Kalkulator TDEE & Makro</span>
              </Link>
              {user?.role === 'admin' && (
                <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-800/40 text-sm transition-colors">
                  <BookOpen className="w-4 h-4 text-emerald-500" />
                  <span>Knowledge Base</span>
                </Link>
              )}
            </nav>

            {/* Logout Footer Block */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex-shrink-0">
              <button 
                onClick={logout} 
                className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 bg-zinc-800/80 hover:bg-red-950/40 text-zinc-300 hover:text-red-400 rounded-xl text-xs font-bold transition-all border border-zinc-700/40"
              >
                <LogOut className="w-4 h-4 text-red-400" />
                <span>Log Out</span>
              </button>
            </div>

          </aside>
        </div>
      )}

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative">
        <header className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 h-16 flex items-center justify-between px-6 flex-shrink-0 z-10 sticky top-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden bg-emerald-600 p-2 rounded-xl text-white active:scale-95"><Menu className="w-5 h-5" /></button>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Jurnal Olahraga & Latihan</h2>
              <p className="text-xs text-zinc-400">Catat & Pantau Konsistensi Latihan Fisik Anda</p>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl w-full mx-auto pb-24">
          
          {/* Workout Summary Banner */}
          <div className="bg-gradient-to-br from-zinc-900 to-black text-white rounded-3xl p-6 shadow-xl border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <Dumbbell className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-emerald-400 tracking-wider">Konsistensi Olahraga Minggu Ini</p>
                <h3 className="text-2xl font-black text-white">
                  {workoutLogs.length} <span className="text-sm font-medium text-zinc-400">dari {weeklyWorkoutTarget} Sesi Tercapai</span>
                </h3>
              </div>
            </div>
            <div className="hidden sm:block text-right">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
                workoutLogs.length >= weeklyWorkoutTarget
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-400'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-300'
              }`}>
                {workoutLogs.length >= weeklyWorkoutTarget ? 'Target Sesi Tercapai! 🔥' : `${weeklyWorkoutTarget - workoutLogs.length} Sesi Lagi`}
              </span>
            </div>
          </div>

          {/* Form & Workout History List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Form */}
            <div className="lg:col-span-1 bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2 mb-4">
                <Plus className="w-5 h-5 text-emerald-600" />
                <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-50">Catat Olahraga</h4>
              </div>
              <form onSubmit={handleWorkoutSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Tanggal</label>
                  <input 
                    type="date" 
                    required 
                    value={workoutForm.date} 
                    onChange={e => setWorkoutForm({ ...workoutForm, date: e.target.value })}
                    className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Jenis Olahraga</label>
                  <select 
                    value={workoutForm.workoutType} 
                    onChange={e => setWorkoutForm({ ...workoutForm, workoutType: e.target.value })}
                    className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Latihan Beban">🏋️ Latihan Beban (Gym / Calisthenics)</option>
                    <option value="Kardio / Lari">🏃 Kardio / Lari / Sepeda</option>
                    <option value="Renang">🏊 Renang</option>
                    <option value="Yoga / Stretching">🧘 Yoga / Stretching</option>
                    <option value="Olahraga Tim">⚽ Olahraga Tim (Futsal, Basket, Badm.)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Durasi (Menit)</label>
                    <input 
                      type="number" 
                      required 
                      placeholder="45" 
                      value={workoutForm.duration} 
                      onChange={e => setWorkoutForm({ ...workoutForm, duration: e.target.value })}
                      className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Intensitas</label>
                    <select 
                      value={workoutForm.intensity} 
                      onChange={e => setWorkoutForm({ ...workoutForm, intensity: e.target.value })}
                      className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 capitalize"
                    >
                      <option value="ringan">Ringan</option>
                      <option value="sedang">Sedang</option>
                      <option value="berat">Berat</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Catatan / Detail Latihan</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Chest & Triceps (Bench Press 4 set)" 
                    value={workoutForm.notes} 
                    onChange={e => setWorkoutForm({ ...workoutForm, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold text-sm transition-all shadow-md mt-2 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Simpan Sesi Olahraga</span>
                </button>
              </form>
            </div>

            {/* List Olahraga */}
            <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-50">Riwayat Latihan Minggu Ini</h4>
                  <span className="text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full text-zinc-500">
                    {workoutLogs.length} Sesi Terdaftar
                  </span>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {workoutLogs.length > 0 ? (
                    workoutLogs.map((item) => (
                      <div 
                        key={item.id} 
                        className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/40 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                            <Dumbbell className="w-5 h-5" />
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{item.workout_type}</h5>
                            <p className="text-[10px] text-zinc-400">
                              {item.date} • {item.duration_minutes} Menit {item.notes ? `• "${item.notes}"` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${
                            item.intensity === 'berat' 
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-400'
                              : item.intensity === 'sedang'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400'
                          }`}>
                            {item.intensity}
                          </span>
                          <button 
                            onClick={() => handleDeleteWorkout(item.id)}
                            className="text-zinc-400 hover:text-red-500 p-1 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-16 text-center text-zinc-400">
                      <Dumbbell className="w-10 h-10 mx-auto mb-2 opacity-20" />
                      <p className="text-xs">Belum ada sesi olahraga yang dicatat minggu ini.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Modal Edit Profil */}
      <EditProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
    </div>
  );
}
