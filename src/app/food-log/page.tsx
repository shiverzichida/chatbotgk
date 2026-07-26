'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import EditProfileModal from '@/components/profile/EditProfileModal';
import ProfileCompletionBanner from '@/components/profile/ProfileCompletionBanner';
import { HealthyMeal, HEALTHY_MEALS_DATABASE, getRecommendedMeals } from '@/lib/healthyMealsData';
import {
  Utensils,
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
  Dumbbell,
  Sparkles,
  Lightbulb,
  CheckCircle2,
  ChefHat,
  Bell,
  FastForward,
  Camera
} from 'lucide-react';
import MealAlarmSettingsModal, { MealAlarmSchedule } from '@/components/food-log/MealAlarmSettingsModal';
import MealAlarmReminderPopup from '@/components/food-log/MealAlarmReminderPopup';
import FoodVisionScannerModal from '@/components/food-log/FoodVisionScannerModal';

interface FoodLog {
  id: string;
  user_id?: string;
  date: string;
  meal_type: 'sarapan' | 'makan_siang' | 'makan_malam' | 'snack';
  food_name: string;
  calories: number;
  protein: number;
  carbs?: number;
  fat?: number;
}

interface UserTarget {
  id: string;
  daily_calories_target: number;
  daily_protein_target: number;
}

export default function FoodLogPage() {
  const { user, loading, logout } = useAuth();
  const [authorized, setAuthorized] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [activeTarget, setActiveTarget] = useState<UserTarget | null>(null);

  const [foodForm, setFoodForm] = useState({
    date: new Date().toISOString().split('T')[0],
    mealType: 'makan_siang' as 'sarapan' | 'makan_siang' | 'makan_malam' | 'snack',
    foodName: '',
    calories: '',
    protein: ''
  });

  // Meal Alarm States
  const [showAlarmSettingsModal, setShowAlarmSettingsModal] = useState(false);
  const [showAlarmReminderPopup, setShowAlarmReminderPopup] = useState(false);
  const [showVisionModal, setShowVisionModal] = useState(false);
  const [popupMealType, setPopupMealType] = useState<'sarapan' | 'makan_siang' | 'snack' | 'makan_malam'>('makan_siang');
  const [popupTimeStr, setPopupTimeStr] = useState('12:30');
  const [skipNotification, setSkipNotification] = useState<string | null>(null);

  // Alarm Schedule Checker Timer (Runs every 30 seconds)
  useEffect(() => {
    const checkAlarm = () => {
      const saved = localStorage.getItem('gk_meal_alarms');
      if (!saved) return;
      try {
        const schedules: MealAlarmSchedule[] = JSON.parse(saved);
        const now = new Date();
        const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        const triggered = schedules.find(s => s.enabled && s.time === currentHHMM);
        if (triggered) {
          setPopupMealType(triggered.id);
          setPopupTimeStr(triggered.time);
          setShowAlarmReminderPopup(true);

          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(`⏰ Waktu ${triggered.label}!`, {
              body: `Pukul ${triggered.time} WIB. Saatnya catat makanan Anda atau pilih lewati (skip meal)!`,
              icon: '/logo-gk.jpg'
            });
          }
        }
      } catch (e) {}
    };

    const interval = setInterval(checkAlarm, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleTestAlarm = (mealType: 'sarapan' | 'makan_siang' | 'snack' | 'makan_malam', timeStr: string) => {
    setPopupMealType(mealType);
    setPopupTimeStr(timeStr);
    setShowAlarmReminderPopup(true);

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('⏰ Tes Alarm Catat Makanan', {
        body: `Pukul ${timeStr} WIB. Saatnya catat makanan Anda atau pilih lewati (skip meal)!`,
        icon: '/logo-gk.jpg'
      });
    }
  };

  const handleSkipMeal = (mealLabel: string) => {
    setSkipNotification(`Jadwal ${mealLabel} dilewati (Skip Meal). Kuota kalori Anda dihemat untuk waktu makan berikutnya!`);
    setTimeout(() => setSkipNotification(null), 5000);
  };

  const handleAddFoodFromAlarm = async (mealType: 'sarapan' | 'makan_siang' | 'makan_malam' | 'snack', foodName: string, calories: number, protein: number) => {
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (userId) {
        const { data, error } = await supabase
          .from('food_logs')
          .insert({
            user_id: userId,
            date: todayStr,
            meal_type: mealType,
            food_name: foodName,
            calories,
            protein
          })
          .select()
          .single();

        if (!error && data) {
          const updated = [...foodLogs, data];
          setFoodLogs(updated);
          localStorage.setItem(`gk_food_logs_${todayStr}`, JSON.stringify(updated));
          return;
        }
      }
    } catch (e) {}

    const fallbackEntry: FoodLog = {
      id: String(Date.now()),
      date: todayStr,
      meal_type: mealType,
      food_name: foodName,
      calories,
      protein
    };
    const updated = [...foodLogs, fallbackEntry];
    setFoodLogs(updated);
    localStorage.setItem(`gk_food_logs_${todayStr}`, JSON.stringify(updated));
  };

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

    const fetchFoodData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) return;

        // Fetch active target
        const { data: target } = await supabase
          .from('user_targets')
          .select('id, daily_calories_target, daily_protein_target')
          .eq('user_id', userId)
          .eq('is_active', true)
          .maybeSingle();

        if (target) setActiveTarget(target);

        // Fetch Today's food logs
        const todayStr = foodForm.date;
        const { data: foodData, error: foodErr } = await supabase
          .from('food_logs')
          .select('*')
          .eq('user_id', userId)
          .eq('date', todayStr)
          .order('created_at', { ascending: true });

        if (!foodErr && foodData) {
          setFoodLogs(foodData);
          localStorage.setItem(`gk_food_logs_${todayStr}`, JSON.stringify(foodData));
        } else {
          const fallbackFood = localStorage.getItem(`gk_food_logs_${todayStr}`);
          if (fallbackFood) {
            try { setFoodLogs(JSON.parse(fallbackFood)); } catch (e) {}
          }
        }
      } catch (err) {
        console.warn('Error fetching food logs:', err);
      }
    };

    fetchFoodData();
  }, [authorized, foodForm.date]);

  const handleFoodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodForm.foodName.trim() || !foodForm.calories) return;

    const calVal = parseInt(foodForm.calories) || 0;
    const protVal = parseInt(foodForm.protein) || 0;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;

      const newFood = {
        user_id: userId,
        date: foodForm.date,
        meal_type: foodForm.mealType,
        food_name: foodForm.foodName.trim(),
        calories: calVal,
        protein: protVal
      };

      const { data, error } = await supabase
        .from('food_logs')
        .insert(newFood)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const updated = [...foodLogs, data];
        setFoodLogs(updated);
        localStorage.setItem(`gk_food_logs_${foodForm.date}`, JSON.stringify(updated));
      }
    } catch (err) {
      console.warn('Fallback ke penyimpanan lokal:', err);
      const fallbackEntry: FoodLog = {
        id: String(Date.now()),
        date: foodForm.date,
        meal_type: foodForm.mealType,
        food_name: foodForm.foodName.trim(),
        calories: calVal,
        protein: protVal
      };
      const updated = [...foodLogs, fallbackEntry];
      setFoodLogs(updated);
      localStorage.setItem(`gk_food_logs_${foodForm.date}`, JSON.stringify(updated));
    }

    setFoodForm(prev => ({
      ...prev,
      foodName: '',
      calories: '',
      protein: ''
    }));
  };

  const handleDeleteFood = async (id: string) => {
    try {
      if (id.length === 36) {
        await supabase.from('food_logs').delete().eq('id', id);
      }
    } catch (err) {}
    const updated = foodLogs.filter(f => f.id !== id);
    setFoodLogs(updated);
    localStorage.setItem(`gk_food_logs_${foodForm.date}`, JSON.stringify(updated));
  };

  // Recommendation Engine States & Handlers
  const [recommendationCategory, setRecommendationCategory] = useState<'all' | 'high_protein' | 'low_calorie' | 'healthy_snack'>('all');
  const [addedMealId, setAddedMealId] = useState<string | null>(null);

  const [showAiModal, setShowAiModal] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiRecipeResult, setAiRecipeResult] = useState<string | null>(null);

  const todayCaloriesConsumed = foodLogs.reduce((acc, f) => acc + (f.calories || 0), 0);
  const todayProteinConsumed = foodLogs.reduce((acc, f) => acc + (f.protein || 0), 0);
  const dailyCaloriesTarget = activeTarget?.daily_calories_target || 2000;
  const dailyProteinTarget = activeTarget?.daily_protein_target || 140;

  const remainingCalories = Math.max(0, dailyCaloriesTarget - todayCaloriesConsumed);
  const remainingProtein = Math.max(0, dailyProteinTarget - todayProteinConsumed);

  const recommendedMeals = getRecommendedMeals(remainingCalories, remainingProtein, recommendationCategory);

  const handleQuickAddMeal = async (meal: HealthyMeal) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;

      const newFood = {
        user_id: userId,
        date: foodForm.date,
        meal_type: meal.mealType,
        food_name: meal.name,
        calories: meal.calories,
        protein: meal.protein
      };

      const { data, error } = await supabase
        .from('food_logs')
        .insert(newFood)
        .select()
        .single();

      if (!error && data) {
        const updated = [...foodLogs, data];
        setFoodLogs(updated);
        localStorage.setItem(`gk_food_logs_${foodForm.date}`, JSON.stringify(updated));
      } else {
        const fallbackEntry: FoodLog = {
          id: String(Date.now()),
          date: foodForm.date,
          meal_type: meal.mealType,
          food_name: meal.name,
          calories: meal.calories,
          protein: meal.protein
        };
        const updated = [...foodLogs, fallbackEntry];
        setFoodLogs(updated);
        localStorage.setItem(`gk_food_logs_${foodForm.date}`, JSON.stringify(updated));
      }
    } catch (err) {
      const fallbackEntry: FoodLog = {
        id: String(Date.now()),
        date: foodForm.date,
        meal_type: meal.mealType,
        food_name: meal.name,
        calories: meal.calories,
        protein: meal.protein
      };
      const updated = [...foodLogs, fallbackEntry];
      setFoodLogs(updated);
      localStorage.setItem(`gk_food_logs_${foodForm.date}`, JSON.stringify(updated));
    }

    setAddedMealId(meal.id);
    setTimeout(() => setAddedMealId(null), 2500);
  };

  const handleAskAiRecipe = async () => {
    setShowAiModal(true);
    setIsAiLoading(true);
    setAiRecipeResult(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Sisa kuota kalori saya hari ini adalah ${remainingCalories} kcal dan sisa protein ${remainingProtein}g. Tolong rekomendasikan 2 ide masakan lokal Indonesia yang sehat, tinggi protein, praktis dimasak, lengkap dengan porsi kalori dan proteinnya.`
            }
          ]
        })
      });

      const data = await res.json();
      if (data && data.text) {
        setAiRecipeResult(data.text);
      } else {
        setAiRecipeResult('Gagal mendapatkan resep AI. Silakan coba lagi.');
      }
    } catch (err) {
      setAiRecipeResult('Terjadi kendala koneksi saat meminta rekomendasi resep AI.');
    } finally {
      setIsAiLoading(false);
    }
  };

  if (loading || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-zinc-500">Memuat Jurnal Makanan...</p>
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
          <Link href="/chat" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-800/40 text-sm transition-colors">
            <MessageSquare className="w-4 h-4" />
            <span>Chatbot AI</span>
          </Link>
          <Link href="/food-log" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-zinc-800 text-white font-medium text-sm transition-colors">
            <Utensils className="w-4 h-4 text-emerald-500" />
            <span>Jurnal Makanan</span>
          </Link>
          <Link href="/workout-log" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-800/40 text-sm transition-colors">
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

      {/* Mobile Menu Drawer */}
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
              <Link href="/food-log" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 bg-zinc-800 text-white font-medium text-sm rounded-xl transition-colors">
                <Utensils className="w-4 h-4 text-emerald-500" />
                <span>Jurnal Makanan</span>
              </Link>
              <Link href="/workout-log" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-800/40 text-sm transition-colors">
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
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Jurnal Makanan Harian</h2>
              <p className="text-xs text-zinc-400">Pantau Asupan Kalori & Protein Anda</p>
            </div>
          </div>

          {/* Meal Alarm Button */}
          <button
            onClick={() => setShowAlarmSettingsModal(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 transition-all rounded-xl text-xs font-bold shadow-sm active:scale-95"
          >
            <Bell className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span className="hidden sm:inline">Atur Alarm Makan</span>
            <span className="sm:hidden">Alarm</span>
          </button>
        </header>

        {/* Content Area */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl w-full mx-auto pb-24">
          <ProfileCompletionBanner onOpenEditProfile={() => setShowProfileModal(true)} />
          
          {/* Toast Notification when a Meal is Skipped */}
          {skipNotification && (
            <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-md animate-in fade-in slide-in-from-top-3 duration-200">
              <div className="flex items-center gap-2.5">
                <FastForward className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <p className="text-xs font-bold">{skipNotification}</p>
              </div>
              <button onClick={() => setSkipNotification(null)} className="p-1 text-amber-500 hover:text-amber-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {/* Header Banner & Macro Progress Bars */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                  <Utensils className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Ringkasan Makro Hari Ini</h3>
                  <p className="text-xs text-zinc-400">Target Harian: {dailyCaloriesTarget} kcal • {dailyProteinTarget}g protein</p>
                </div>
              </div>

              <Link
                href="/calculator"
                className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-emerald-100 transition-all flex items-center justify-center gap-2"
              >
                <Calculator className="w-4 h-4" />
                <span>Hitung Ulang TDEE</span>
              </Link>
            </div>

            {/* Progress Bars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Kalori */}
              <div className="bg-zinc-50 dark:bg-zinc-950 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-zinc-400">Asupan Kalori Hari Ini</p>
                    <h4 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-0.5">
                      {todayCaloriesConsumed} <span className="text-xs font-normal text-zinc-400">/ {dailyCaloriesTarget} kcal</span>
                    </h4>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    todayCaloriesConsumed <= dailyCaloriesTarget
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400'
                  }`}>
                    {todayCaloriesConsumed <= dailyCaloriesTarget
                      ? `Sisa ${dailyCaloriesTarget - todayCaloriesConsumed} kcal`
                      : `Surplus +${todayCaloriesConsumed - dailyCaloriesTarget} kcal`}
                  </span>
                </div>
                <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      todayCaloriesConsumed <= dailyCaloriesTarget ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.round((todayCaloriesConsumed / (dailyCaloriesTarget || 1)) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Protein */}
              <div className="bg-zinc-50 dark:bg-zinc-950 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-zinc-400">Asupan Protein Hari Ini</p>
                    <h4 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {todayProteinConsumed} <span className="text-xs font-normal text-zinc-400">/ {dailyProteinTarget} gram</span>
                    </h4>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    todayProteinConsumed >= dailyProteinTarget
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400'
                      : 'bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-400'
                  }`}>
                    {todayProteinConsumed >= dailyProteinTarget
                      ? 'Target Protein Tercapai 🎉'
                      : `Kurang ${dailyProteinTarget - todayProteinConsumed} g`}
                  </span>
                </div>
                <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((todayProteinConsumed / (dailyProteinTarget || 1)) * 100))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Smart Meal & Recipe Recommendation Engine */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                    <span>Rekomendasi Makanan Sehat Khas Indonesia</span>
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                      Pas Sisa Kuota
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400">Sisa Kuota Hari Ini: <span className="font-bold text-zinc-700 dark:text-zinc-300">{remainingCalories} kcal</span> • <span className="font-bold text-emerald-600 dark:text-emerald-400">{remainingProtein}g protein</span></p>
                </div>
              </div>

              {/* Filter Tabs & AI Button */}
              <div className="flex flex-wrap items-center gap-2">
                <button 
                  type="button"
                  onClick={() => setRecommendationCategory('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    recommendationCategory === 'all'
                      ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  Semua
                </button>
                <button 
                  type="button"
                  onClick={() => setRecommendationCategory('high_protein')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    recommendationCategory === 'high_protein'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  🥩 Tinggi Protein
                </button>
                <button 
                  type="button"
                  onClick={() => setRecommendationCategory('healthy_snack')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    recommendationCategory === 'healthy_snack'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  🍿 Camilan Sehat
                </button>
                
                <button
                  type="button"
                  onClick={handleAskAiRecipe}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 active:scale-95 ml-auto"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Saran AI</span>
                </button>
              </div>
            </div>

            {/* Recommendation Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedMeals.length > 0 ? (
                recommendedMeals.slice(0, 6).map((meal) => (
                  <div 
                    key={meal.id} 
                    className="bg-zinc-50/70 dark:bg-zinc-950/40 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between space-y-3 hover:border-emerald-500/50 transition-all group overflow-hidden"
                  >
                    {/* Pollinations AI Dynamic Food Photo */}
                    {meal.imageUrl && (
                      <div className="relative w-full h-36 rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 -mt-1 shadow-inner">
                        <img 
                          src={meal.imageUrl} 
                          alt={meal.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-white/20">
                          <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                          <span>AI Photo</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl group-hover:scale-110 transition-transform">{meal.iconEmoji}</span>
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-snug">{meal.name}</h4>
                        </div>
                        <span className="text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md flex-shrink-0">
                          {meal.calories} kcal
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                        {meal.description}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-400 pt-1">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md">
                          {meal.protein}g Protein
                        </span>
                        <span>•</span>
                        <span>{meal.carbs}g Karbo</span>
                        <span>•</span>
                        <span>{meal.fat}g Lemak</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleQuickAddMeal(meal)}
                      className={`w-full py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                        addedMealId === meal.id
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white dark:bg-zinc-900 hover:bg-emerald-600 hover:text-white border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 shadow-sm'
                      }`}
                    >
                      {addedMealId === meal.id ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Berhasil Dicatat! 🎉</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5 text-emerald-500 group-hover:text-white" />
                          <span>+ Catat Langsung</span>
                        </>
                      )}
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-8 text-center text-zinc-400">
                  <ChefHat className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Tidak ada menu yang cocok untuk filter ini. Coba ubah kategori filter.</p>
                </div>
              )}
            </div>
          </div>

          {/* Form & List Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Form */}
            <div className="lg:col-span-1 bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-4">
              
              {/* AI Vision Scanner Button */}
              <button
                type="button"
                onClick={() => setShowVisionModal(true)}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-extrabold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2.5 active:scale-95 group border border-emerald-400/30"
              >
                <Camera className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>📸 Scan Foto Makanan (AI Vision)</span>
              </button>

              <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-3">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Catat Asupan Manual</h4>
                </div>
              </div>
              <form onSubmit={handleFoodSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Tanggal</label>
                  <input 
                    type="date" 
                    required 
                    value={foodForm.date} 
                    onChange={e => setFoodForm({ ...foodForm, date: e.target.value })}
                    className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Waktu Makan</label>
                  <select 
                    value={foodForm.mealType} 
                    onChange={e => setFoodForm({ ...foodForm, mealType: e.target.value as any })}
                    className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 capitalize"
                  >
                    <option value="sarapan">🌅 Sarapan</option>
                    <option value="makan_siang">☀️ Makan Siang</option>
                    <option value="makan_malam">🌙 Makan Malam</option>
                    <option value="snack">🍿 Snack / Camilan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Nama Makanan & Porsi</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Contoh: Dada Ayam 150g & Nasi Merah" 
                    value={foodForm.foodName} 
                    onChange={e => setFoodForm({ ...foodForm, foodName: e.target.value })}
                    className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Kalori (kcal)</label>
                    <input 
                      type="number" 
                      required 
                      placeholder="350" 
                      value={foodForm.calories} 
                      onChange={e => setFoodForm({ ...foodForm, calories: e.target.value })}
                      className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Protein (gram)</label>
                    <input 
                      type="number" 
                      placeholder="30" 
                      value={foodForm.protein} 
                      onChange={e => setFoodForm({ ...foodForm, protein: e.target.value })}
                      className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold text-sm transition-all shadow-md mt-2 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambahkan Makanan</span>
                </button>
              </form>
            </div>

            {/* List Makanan */}
            <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-50">Daftar Makanan Terkonsumsi Hari Ini</h4>
                  <span className="text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full text-zinc-500">
                    {foodLogs.length} Menu
                  </span>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {foodLogs.length > 0 ? (
                    foodLogs.map((item) => (
                      <div 
                        key={item.id} 
                        className="p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/40 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">
                            {item.meal_type === 'sarapan' ? '🌅' : item.meal_type === 'makan_siang' ? '☀️' : item.meal_type === 'makan_malam' ? '🌙' : '🍿'}
                          </span>
                          <div>
                            <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 capitalize">{item.food_name}</h5>
                            <p className="text-[10px] text-zinc-400 capitalize">
                              {item.meal_type.replace('_', ' ')} • <span className="font-semibold text-emerald-600 dark:text-emerald-400">{item.protein || 0}g protein</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black text-zinc-800 dark:text-zinc-200">
                            {item.calories} kcal
                          </span>
                          <button 
                            onClick={() => handleDeleteFood(item.id)}
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
                      <Utensils className="w-10 h-10 mx-auto mb-2 opacity-20" />
                      <p className="text-xs">Belum ada makanan yang dicatat hari ini.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center text-xs text-zinc-500">
                <span>Total Hari Ini:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  {todayCaloriesConsumed} kcal / {todayProteinConsumed}g protein
                </span>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Modal Edit Profil */}
      <EditProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />

      {/* Modal Resep AI */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-lg shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-r from-emerald-900 to-zinc-900 text-white">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm">Rekomendasi Resep AI</h3>
                  <p className="text-[10px] text-emerald-300">Disesuaikan persis dengan sisa kuota Anda ({remainingCalories} kcal • {remainingProtein}g P)</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowAiModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
              {isAiLoading ? (
                <div className="py-12 flex flex-col items-center gap-3 text-center">
                  <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                  <p className="text-zinc-500 font-medium">AI sedang menyusun ide resep sehat khas Indonesia sesuai kuota Anda...</p>
                </div>
              ) : (
                <div className="whitespace-pre-wrap space-y-2">
                  {aiRecipeResult}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end bg-zinc-50 dark:bg-zinc-950">
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pengaturan Alarm Makan */}
      <MealAlarmSettingsModal
        isOpen={showAlarmSettingsModal}
        onClose={() => setShowAlarmSettingsModal(false)}
        onSave={() => {}}
        onTestAlarm={handleTestAlarm}
      />

      {/* Modal Pop-up Pengingat Alarm Makan */}
      <MealAlarmReminderPopup
        isOpen={showAlarmReminderPopup}
        onClose={() => setShowAlarmReminderPopup(false)}
        mealType={popupMealType}
        timeStr={popupTimeStr}
        onAddFood={handleAddFoodFromAlarm}
        onSkipMeal={handleSkipMeal}
      />

      {/* Modal AI Vision Scanner */}
      <FoodVisionScannerModal
        isOpen={showVisionModal}
        onClose={() => setShowVisionModal(false)}
        onScanComplete={(data) => {
          handleAddFoodFromAlarm(data.mealType, data.foodName, data.calories, data.protein);
        }}
      />
    </div>
  );
}
