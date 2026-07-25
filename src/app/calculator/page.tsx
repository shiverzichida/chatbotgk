'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import EditProfileModal from '@/components/profile/EditProfileModal';
import {
  Calculator,
  TrendingUp,
  MessageSquare,
  BookOpen,
  LogOut,
  Bot,
  User as UserIcon,
  User,
  Sparkles,
  Flame,
  Award,
  Activity,
  CheckCircle2,
  Menu,
  X,
  Info,
  ChevronRight,
  Utensils,
  Dumbbell
} from 'lucide-react';

export default function CalculatorPage() {
  const { user, loading, logout } = useAuth();
  const [authorized, setAuthorized] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Form Parameters
  const [gender, setGender] = useState('pria');
  const [age, setAge] = useState('25');
  const [heightCm, setHeightCm] = useState('175');
  const [weightKg, setWeightKg] = useState('75');
  const [activityLevel, setActivityLevel] = useState('sedang');
  const [goalType, setGoalType] = useState('fat_loss');

  // Calculated States
  const [bmr, setBmr] = useState(0);
  const [tdee, setTdee] = useState(0);
  const [targetCalories, setTargetCalories] = useState(0);
  const [targetProtein, setTargetProtein] = useState(0);
  const [targetCarbs, setTargetCarbs] = useState(0);
  const [targetFat, setTargetFat] = useState(0);

  const [isApplying, setIsApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        window.location.href = '/login';
      } else {
        setAuthorized(true);
      }
    }
  }, [user, loading]);

  // Fetch initial profile & latest weight log from Supabase
  useEffect(() => {
    if (!authorized) return;

    const loadUserData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) return;

        // Fetch Profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (profile) {
          if (profile.gender) setGender(profile.gender);
          if (profile.height_cm) setHeightCm(String(profile.height_cm));
          if (profile.goal_type) setGoalType(profile.goal_type);
          if (profile.activity_level) setActivityLevel(profile.activity_level);
          if (profile.date_of_birth) {
            const birth = new Date(profile.date_of_birth);
            const today = new Date();
            let calculatedAge = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
              calculatedAge--;
            }
            setAge(String(Math.max(10, calculatedAge)));
          }
        }

        // Fetch latest weight from progress_logs
        const { data: logs } = await supabase
          .from('progress_logs')
          .select('weight')
          .eq('user_id', userId)
          .order('date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (logs && logs.weight) {
          setWeightKg(String(logs.weight));
        }
      } catch (err) {
        console.warn('Gagal memuat data profil di Kalkulator:', err);
      }
    };

    loadUserData();
  }, [authorized]);

  // Recalculate BMR, TDEE, & Macros when parameters change
  useEffect(() => {
    const w = parseFloat(weightKg) || 75;
    const h = parseFloat(heightCm) || 175;
    const a = parseInt(age) || 25;

    // Mifflin-St Jeor Formula
    let calculatedBmr = (10 * w) + (6.25 * h) - (5 * a);
    if (gender === 'pria') {
      calculatedBmr += 5;
    } else {
      calculatedBmr -= 161;
    }

    let actMult = 1.55;
    if (activityLevel === 'sedentari') actMult = 1.2;
    if (activityLevel === 'ringan') actMult = 1.375;
    if (activityLevel === 'sedang') actMult = 1.55;
    if (activityLevel === 'berat') actMult = 1.725;

    const calculatedTdee = Math.round(calculatedBmr * actMult);

    let goalAdj = -400;
    if (goalType === 'fat_loss') goalAdj = -400;
    if (goalType === 'muscle_gain') goalAdj = 300;
    if (goalType === 'recomposition') goalAdj = -200;
    if (goalType === 'maintenance') goalAdj = 0;

    const targetCal = Math.max(1200, calculatedTdee + goalAdj);

    // Protein target: ~2.0g per kg body weight
    const targetProt = Math.round(w * 2.0);

    // Fat target: ~25% of total target calories
    const targetFatGrams = Math.round((targetCal * 0.25) / 9);

    // Carbs target: remaining calories
    const remainingCals = targetCal - (targetProt * 4 + targetFatGrams * 9);
    const targetCarbsGrams = Math.round(Math.max(50, remainingCals / 4));

    setBmr(Math.round(calculatedBmr));
    setTdee(calculatedTdee);
    setTargetCalories(targetCal);
    setTargetProtein(targetProt);
    setTargetFat(targetFatGrams);
    setTargetCarbs(targetCarbsGrams);
  }, [gender, age, heightCm, weightKg, activityLevel, goalType]);

  const handleApplyTarget = async () => {
    setIsApplying(true);
    setApplySuccess(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (userId) {
        // Upsert active target in user_targets table
        const { data: activeTarget } = await supabase
          .from('user_targets')
          .select('id')
          .eq('user_id', userId)
          .eq('is_active', true)
          .maybeSingle();

        if (activeTarget) {
          await supabase
            .from('user_targets')
            .update({
              daily_calories_target: targetCalories,
              daily_protein_target: targetProtein
            })
            .eq('id', activeTarget.id);
        } else {
          await supabase
            .from('user_targets')
            .insert({
              user_id: userId,
              start_weight: parseFloat(weightKg) || 75,
              target_weight: (parseFloat(weightKg) || 75) + (goalType === 'fat_loss' ? -5 : 3),
              start_date: new Date().toISOString().split('T')[0],
              end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              daily_calories_target: targetCalories,
              daily_protein_target: targetProtein,
              weekly_workouts_target: 4,
              is_active: true
            });
        }
      }

      setApplySuccess(true);
      setTimeout(() => setApplySuccess(false), 3000);
    } catch (err) {
      console.error('Gagal menerapkan target dari Kalkulator:', err);
    } finally {
      setIsApplying(false);
    }
  };

  if (loading || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-zinc-500">Memuat Kalkulator Nutrisi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans overflow-hidden">
      
      {/* Sidebar Navigation - Desktop */}
      <aside className="w-64 bg-zinc-900 text-zinc-100 flex flex-col hidden md:flex border-r border-zinc-800 flex-shrink-0">
        <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
          <div className="bg-emerald-600 p-2 rounded-xl text-white">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">Gizi Kebugaran</h1>
            <p className="text-xs text-emerald-500 font-medium">Gizi Kebugaran AI</p>
          </div>
        </div>

        {/* User Profile Card */}
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

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          <p className="px-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Menu Utama</p>
          <Link href="/chat" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 text-sm transition-colors">
            <MessageSquare className="w-4 h-4" />
            <span>Chatbot AI</span>
          </Link>
          <Link href="/food-log" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 text-sm transition-colors">
            <Utensils className="w-4 h-4 text-emerald-500" />
            <span>Jurnal Makanan</span>
          </Link>
          <Link href="/workout-log" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 text-sm transition-colors">
            <Dumbbell className="w-4 h-4 text-emerald-500" />
            <span>Jurnal Olahraga</span>
          </Link>
          <Link href="/metrics" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 text-sm transition-colors">
            <TrendingUp className="w-4 h-4" />
            <span>Komposisi Tubuh & Target</span>
          </Link>
          <Link href="/calculator" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-zinc-800 text-white font-medium text-sm transition-colors">
            <Calculator className="w-4 h-4 text-emerald-500" />
            <span>Kalkulator TDEE & Makro</span>
          </Link>
          {user?.role === 'admin' && (
            <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 text-sm transition-colors">
              <BookOpen className="w-4 h-4 text-emerald-500" />
              <span>Knowledge Base</span>
            </Link>
          )}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-zinc-800">
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 bg-zinc-800 hover:bg-red-950/30 hover:text-red-400 text-zinc-400 border border-zinc-800 rounded-xl text-sm font-semibold transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-80 bg-zinc-900 text-zinc-100 flex flex-col shadow-2xl border-r border-zinc-800 z-10">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-600 p-2 rounded-xl text-white">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-sm font-bold tracking-tight">Gizi Kebugaran</h1>
                  <p className="text-[10px] text-emerald-500 font-medium">Gizi Kebugaran AI</p>
                </div>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 bg-zinc-800 text-zinc-400 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div 
              onClick={() => {
                setIsMobileMenuOpen(false);
                setShowProfileModal(true);
              }}
              className="p-4 mx-4 my-6 bg-zinc-800/50 rounded-2xl border border-zinc-800 flex items-center gap-3 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-white uppercase">
                {user?.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user?.name}</p>
                <p className="text-xs text-zinc-400 truncate">{user?.email}</p>
              </div>
            </div>

            <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
              <p className="px-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Menu Utama</p>
              <Link href="/chat" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 text-sm">
                <MessageSquare className="w-4 h-4" />
                <span>Chatbot AI</span>
              </Link>
              <Link href="/food-log" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 text-sm">
                <Utensils className="w-4 h-4 text-emerald-500" />
                <span>Jurnal Makanan</span>
              </Link>
              <Link href="/workout-log" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 text-sm">
                <Dumbbell className="w-4 h-4 text-emerald-500" />
                <span>Jurnal Olahraga</span>
              </Link>
              <Link href="/metrics" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 text-sm">
                <TrendingUp className="w-4 h-4" />
                <span>Komposisi Tubuh & Target</span>
              </Link>
              <Link href="/calculator" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-zinc-800 text-white font-medium text-sm">
                <Calculator className="w-4 h-4 text-emerald-500" />
                <span>Kalkulator TDEE & Makro</span>
              </Link>
            </nav>

            <div className="p-4 border-t border-zinc-800">
              <button onClick={logout} className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 bg-zinc-800 text-zinc-400 rounded-xl text-sm font-semibold">
                <LogOut className="w-4 h-4" />
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
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden bg-emerald-600 p-2 rounded-xl text-white active:scale-95"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Kalkulator TDEE & Makronutrisi</h2>
              <p className="text-xs text-zinc-400">Analisis Kebutuhan Energi & Nutrisi Berbasis Sains</p>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-6xl w-full mx-auto pb-24">
          
          {/* Main Grid: Parameters Form & Results Display */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Panel: Input Parameters */}
            <div className="lg:col-span-5 bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-6">
              <div className="flex items-center gap-2.5 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">Parameter Fisik Anda</h3>
                  <p className="text-xs text-zinc-400">Dimuat otomatis dari profil pengguna</p>
                </div>
              </div>

              <form className="space-y-4" onSubmit={e => e.preventDefault()}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-400 mb-1.5">Jenis Kelamin</label>
                    <select 
                      value={gender} 
                      onChange={e => setGender(e.target.value)}
                      className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-emerald-500 capitalize"
                    >
                      <option value="pria">Pria</option>
                      <option value="wanita">Wanita</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-400 mb-1.5">Usia (Tahun)</label>
                    <input 
                      type="number" 
                      value={age} 
                      onChange={e => setAge(e.target.value)}
                      className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-400 mb-1.5">Tinggi Badan (cm)</label>
                    <input 
                      type="number" 
                      value={heightCm} 
                      onChange={e => setHeightCm(e.target.value)}
                      className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-400 mb-1.5">Berat Badan (kg)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      value={weightKg} 
                      onChange={e => setWeightKg(e.target.value)}
                      className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-400 mb-1.5">Level Aktivitas Fisik</label>
                  <select 
                    value={activityLevel} 
                    onChange={e => setActivityLevel(e.target.value)}
                    className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="sedentari">Sedentari (Banyak Duduk / Minim Olahraga)</option>
                    <option value="ringan">Ringan (Olahraga 1-2x per minggu)</option>
                    <option value="sedang">Sedang (Olahraga 3-5x per minggu)</option>
                    <option value="berat">Berat (Olahraga Intensif 6-7x per minggu)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-400 mb-1.5">Program Target Utama</label>
                  <select 
                    value={goalType} 
                    onChange={e => setGoalType(e.target.value)}
                    className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="fat_loss">🔥 Fat Loss / Potong Lemak (-400 kcal)</option>
                    <option value="muscle_gain">💪 Muscle Gain / Tambah Massa Otot (+300 kcal)</option>
                    <option value="recomposition">⚡ Body Recomposition (Otot ↑ Lemak ↓ -200 kcal)</option>
                    <option value="maintenance">⚖️ Maintenance / Jaga Kebugaran (+0 kcal)</option>
                  </select>
                </div>
              </form>
            </div>

            {/* Right Panel: Results & Scientific Breakdown */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Target Banner */}
              <div className="bg-gradient-to-br from-emerald-900 via-zinc-900 to-black text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-emerald-800/40 space-y-6 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                  <div>
                    <p className="text-xs font-bold uppercase text-emerald-400 tracking-wider mb-1">Rekomendasi Target Kalori Harian</p>
                    <h3 className="text-4xl font-black text-white">{targetCalories} <span className="text-lg font-medium text-emerald-300">kcal / hari</span></h3>
                  </div>

                  <div className="flex items-center gap-3 bg-black/40 p-3 rounded-2xl border border-white/10">
                    <div className="text-right">
                      <p className="text-[10px] uppercase text-white/50 font-bold">TDEE</p>
                      <p className="text-sm font-bold text-white">{tdee} kcal</p>
                    </div>
                    <div className="h-8 w-px bg-white/10" />
                    <div className="text-right">
                      <p className="text-[10px] uppercase text-white/50 font-bold">BMR</p>
                      <p className="text-sm font-bold text-white">{bmr} kcal</p>
                    </div>
                  </div>
                </div>

                {/* Macro Breakdown Cards */}
                <div>
                  <p className="text-xs font-bold uppercase text-white/60 mb-3">Distribusi Pembagian Makronutrisi Harian</p>
                  <div className="grid grid-cols-3 gap-4">
                    
                    {/* Protein */}
                    <div className="bg-black/40 p-4 rounded-2xl border border-emerald-500/30 text-center space-y-1">
                      <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Protein</p>
                      <h4 className="text-2xl font-black text-white">{targetProtein} <span className="text-xs font-normal text-white/60">g</span></h4>
                      <p className="text-[10px] text-white/40">{targetProtein * 4} kcal (~2.0g/kg)</p>
                    </div>

                    {/* Carbs */}
                    <div className="bg-black/40 p-4 rounded-2xl border border-sky-500/30 text-center space-y-1">
                      <p className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">Karbohidrat</p>
                      <h4 className="text-2xl font-black text-white">{targetCarbs} <span className="text-xs font-normal text-white/60">g</span></h4>
                      <p className="text-[10px] text-white/40">{targetCarbs * 4} kcal</p>
                    </div>

                    {/* Fat */}
                    <div className="bg-black/40 p-4 rounded-2xl border border-amber-500/30 text-center space-y-1">
                      <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Lemak</p>
                      <h4 className="text-2xl font-black text-white">{targetFat} <span className="text-xs font-normal text-white/60">g</span></h4>
                      <p className="text-[10px] text-white/40">{targetFat * 9} kcal (25%)</p>
                    </div>

                  </div>
                </div>

                {/* Apply Button */}
                <div className="pt-2 flex items-center justify-between gap-4">
                  {applySuccess && (
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold bg-emerald-950/80 px-3.5 py-2 rounded-xl border border-emerald-800">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Target berhasil diterapkan ke profil Anda!</span>
                    </div>
                  )}

                  <button 
                    type="button"
                    onClick={handleApplyTarget}
                    disabled={isApplying}
                    className="ml-auto bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg flex items-center gap-2.5 active:scale-95 disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isApplying ? 'Menyimpan Target...' : 'Terapkan ke Target Program Saya'}</span>
                  </button>
                </div>
              </div>

              {/* Scientific Explanation Box */}
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-4">
                <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-50 font-bold text-sm">
                  <Info className="w-4 h-4 text-emerald-600" />
                  <span>Bagaimana Rumus Sains Mifflin-St Jeor Bekerja?</span>
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-2 leading-relaxed">
                  <p>
                    <strong>BMR (Basal Metabolic Rate):</strong> Jumlah kalori minimal yang dibakar tubuh Anda per hari dalam keadaan istirahat total hanya untuk mempertahankan fungsi organ vital (jantung, otak, paru-paru).
                  </p>
                  <p>
                    <strong>TDEE (Total Daily Energy Expenditure):</strong> Total energi harian yang dibakar tubuh setelah memperhitungkan seluruh aktivitas fisik dan olahraga harian Anda.
                  </p>
                  <p>
                    <strong>Penyesuaian Program:</strong> Untuk menurunkan lemak (*Fat Loss*), disarankan membuat defisit kalori terukur (sekitar 300–500 kcal di bawah TDEE) sambil menjaga asupan protein tinggi (~2.0 gram per kg berat badan) agar massa otot tidak habis terbuang.
                  </p>
                </div>
              </div>

            </div>

          </div>

        </div>
      </main>

      {/* Modal Edit Profil */}
      <EditProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
      />

    </div>
  );
}
