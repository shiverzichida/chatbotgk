'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import ProgressChart from '@/components/metrics/ProgressChart';
import { supabase } from '@/lib/supabase';
import {
  TrendingUp,
  MessageSquare,
  BookOpen,
  LogOut,
  Bot,
  User as UserIcon,
  Plus,
  Trash2,
  Calendar,
  Layers,
  Flame,
  Award,
  Loader2,
  Target,
  Dumbbell,
  Activity,
  X,
  FileText,
  Menu
} from 'lucide-react';

interface LogEntry {
  id: string;
  date: string;
  weight: number;
  muscle: number;
  fat: number;
  calories?: number;
  protein?: number;
}

interface UserTarget {
  id: string;
  user_id: string;
  start_weight: number;
  target_weight: number;
  start_date: string;
  end_date: string;
  daily_calories_target: number;
  daily_protein_target: number;
  weekly_workouts_target: number;
  is_active: boolean;
}

interface WorkoutLog {
  id: string;
  user_id: string;
  date: string;
  workout_type: string;
  duration_minutes: number;
  intensity: string;
  notes?: string;
}

interface WeeklyReview {
  id: string;
  user_id: string;
  week_number: number;
  start_date: string;
  end_date: string;
  weight_change: number;
  compliance_score: number;
  ai_feedback?: string;
  coach_notes?: string;
}

// Data awal (Dummy InBody History selama 2 minggu)
const initialDummyData: LogEntry[] = [
  { id: '1', date: '2026-07-10', weight: 78.5, muscle: 32.1, fat: 21.3, calories: 2100, protein: 140 },
  { id: '2', date: '2026-07-13', weight: 77.8, muscle: 32.3, fat: 20.5, calories: 2050, protein: 145 },
  { id: '3', date: '2026-07-16', weight: 77.2, muscle: 32.5, fat: 19.8, calories: 1980, protein: 142 },
  { id: '4', date: '2026-07-20', weight: 76.9, muscle: 32.7, fat: 19.1, calories: 2000, protein: 150 },
  { id: '5', date: '2026-07-24', weight: 76.4, muscle: 33.0, fat: 18.2, calories: 2020, protein: 155 }
];

export default function MetricsPage() {
  const { user, loading, logout } = useAuth();
  const [authorized, setAuthorized] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Data states
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTarget, setActiveTarget] = useState<UserTarget | null>(null);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [weeklyReviews, setWeeklyReviews] = useState<WeeklyReview[]>([]);
  
  // Form inputs for InBody
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [weight, setWeight] = useState('');
  const [muscle, setMuscle] = useState('');
  const [fat, setFat] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');

  // Form states for Target
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [targetForm, setTargetForm] = useState({
    targetWeight: '',
    startWeight: '',
    durationWeeks: '4',
    dailyCalories: '',
    dailyProtein: '',
    weeklyWorkouts: ''
  });

  // Form states for Workout
  const [workoutForm, setWorkoutForm] = useState({
    date: new Date().toISOString().split('T')[0],
    workoutType: 'Latihan Beban',
    duration: '',
    intensity: 'sedang',
    notes: ''
  });

  // Status metrics
  const [stats, setStats] = useState({
    weightDiff: 0,
    muscleDiff: 0,
    fatDiff: 0,
    latestWeight: 0,
    latestMuscle: 0,
    latestFat: 0
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

  // Load all data
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) return;

        // Fetch progress logs
        const { data: logsData, error: logsError } = await supabase
          .from('progress_logs')
          .select('*')
          .order('date', { ascending: false });

        if (!logsError && logsData && logsData.length > 0) {
          const mapped: LogEntry[] = logsData.map((item: any) => ({
            id: item.id,
            date: item.date,
            weight: parseFloat(item.weight),
            muscle: parseFloat(item.muscle),
            fat: parseFloat(item.fat),
            calories: item.calories || undefined,
            protein: item.protein || undefined
          }));
          setLogs(mapped);
          localStorage.setItem('gk_metrics_logs', JSON.stringify(mapped));
        } else {
          const savedLogs = localStorage.getItem('gk_metrics_logs');
          if (savedLogs) {
            setLogs(JSON.parse(savedLogs));
          } else {
            setLogs(initialDummyData);
          }
        }

        // Fetch User Targets
        const { data: targetData } = await supabase
          .from('user_targets')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .single();
        if (targetData) {
          setActiveTarget(targetData);
        }

        // Fetch Workouts (this week)
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
        
        const { data: workoutsData } = await supabase
          .from('workout_logs')
          .select('*')
          .eq('user_id', userId)
          .gte('date', startOfWeekStr);
        if (workoutsData) setWorkoutLogs(workoutsData);

        // Fetch Weekly Reviews
        const { data: reviewsData } = await supabase
          .from('weekly_reviews')
          .select('*')
          .eq('user_id', userId)
          .order('start_date', { ascending: false });
        if (reviewsData) setWeeklyReviews(reviewsData);

      } catch (err) {
        console.warn('Error fetching some data:', err);
      }
    };

    if (authorized) {
      fetchAllData();
    }
  }, [authorized]);

  // Calculate statistics
  useEffect(() => {
    if (logs.length > 0) {
      const sorted = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const first = sorted[0];
      const latest = sorted[sorted.length - 1];

      setStats({
        weightDiff: parseFloat((latest.weight - first.weight).toFixed(1)),
        muscleDiff: parseFloat((latest.muscle - first.muscle).toFixed(1)),
        fatDiff: parseFloat((latest.fat - first.fat).toFixed(1)),
        latestWeight: latest.weight,
        latestMuscle: latest.muscle,
        latestFat: latest.fat
      });
      
      // Auto-fill start weight for target form if empty
      if (!targetForm.startWeight) {
        setTargetForm(prev => ({ ...prev, startWeight: String(latest.weight) }));
      }
    } else {
      setStats({ weightDiff: 0, muscleDiff: 0, fatDiff: 0, latestWeight: 0, latestMuscle: 0, latestFat: 0 });
    }
  }, [logs]);

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight || !muscle || !fat) return;

    const weightVal = parseFloat(weight);
    const muscleVal = parseFloat(muscle);
    const fatVal = parseFloat(fat);
    const calVal = calories ? parseInt(calories) : null;
    const protVal = protein ? parseInt(protein) : null;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error('User session not found');

      const { error } = await supabase
        .from('progress_logs')
        .upsert({
          user_id: userId,
          date,
          weight: weightVal,
          muscle: muscleVal,
          fat: fatVal,
          calories: calVal,
          protein: protVal
        }, {
          onConflict: 'user_id,date'
        });

      if (error) throw error;

      const { data: updatedData } = await supabase
        .from('progress_logs')
        .select('*')
        .order('date', { ascending: false });

      if (updatedData) {
        const mapped: LogEntry[] = updatedData.map((item: any) => ({
          id: item.id,
          date: item.date,
          weight: parseFloat(item.weight),
          muscle: parseFloat(item.muscle),
          fat: parseFloat(item.fat),
          calories: item.calories || undefined,
          protein: item.protein || undefined
        }));
         setLogs(mapped);
         localStorage.setItem('gk_metrics_logs', JSON.stringify(mapped));
      }
    } catch (err) {
      console.warn('Gagal menyimpan ke Supabase. Menyimpan ke LocalStorage fallback:', err);
      
      const newEntry: LogEntry = {
        id: String(Date.now()),
        date,
        weight: weightVal,
        muscle: muscleVal,
        fat: fatVal,
        calories: calVal || undefined,
        protein: protVal || undefined
      };

      const filtered = logs.filter(item => item.date !== date);
      const updated = [newEntry, ...filtered];
      setLogs(updated);
      localStorage.setItem('gk_metrics_logs', JSON.stringify(updated));
    }

    setWeight('');
    setMuscle('');
    setFat('');
    setCalories('');
    setProtein('');
  };

  const handleDeleteLog = async (id: string) => {
    try {
      if (id.length === 36) {
        const { error } = await supabase
          .from('progress_logs')
          .delete()
          .eq('id', id);
        if (error) throw error;
      }
    } catch (err) {
      console.warn('Gagal menghapus log di Supabase:', err);
    }
    const updated = logs.filter(item => item.id !== id);
    setLogs(updated);
    localStorage.setItem('gk_metrics_logs', JSON.stringify(updated));
  };

  const handleTargetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (parseInt(targetForm.durationWeeks) * 7));

      const newTarget = {
        user_id: userId,
        start_weight: parseFloat(targetForm.startWeight),
        target_weight: parseFloat(targetForm.targetWeight),
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        daily_calories_target: parseInt(targetForm.dailyCalories),
        daily_protein_target: parseInt(targetForm.dailyProtein),
        weekly_workouts_target: parseInt(targetForm.weeklyWorkouts),
        is_active: true
      };

      const { data, error } = await supabase
        .from('user_targets')
        .insert(newTarget)
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        setActiveTarget(data);
        setShowTargetModal(false);
      }
    } catch (err) {
      console.error('Error creating target:', err);
      // Fallback for demo purposes
      setActiveTarget({
        id: 'temp',
        user_id: 'temp',
        start_weight: parseFloat(targetForm.startWeight),
        target_weight: parseFloat(targetForm.targetWeight),
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + parseInt(targetForm.durationWeeks)*7*24*60*60*1000).toISOString().split('T')[0],
        daily_calories_target: parseInt(targetForm.dailyCalories),
        daily_protein_target: parseInt(targetForm.dailyProtein),
        weekly_workouts_target: parseInt(targetForm.weeklyWorkouts),
        is_active: true
      });
      setShowTargetModal(false);
    }
  };

  const handleWorkoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;

      const newWorkout = {
        user_id: userId,
        date: workoutForm.date,
        workout_type: workoutForm.workoutType,
        duration_minutes: parseInt(workoutForm.duration),
        intensity: workoutForm.intensity,
        notes: workoutForm.notes
      };

      const { data, error } = await supabase
        .from('workout_logs')
        .insert(newWorkout)
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        setWorkoutLogs([...workoutLogs, data]);
      }
    } catch (err) {
      console.error('Error logging workout:', err);
      // Fallback
      setWorkoutLogs([...workoutLogs, {
        id: String(Date.now()),
        user_id: 'temp',
        date: workoutForm.date,
        workout_type: workoutForm.workoutType,
        duration_minutes: parseInt(workoutForm.duration),
        intensity: workoutForm.intensity,
        notes: workoutForm.notes
      }]);
    }
    
    setWorkoutForm({
      date: new Date().toISOString().split('T')[0],
      workoutType: 'Latihan Beban',
      duration: '',
      intensity: 'sedang',
      notes: ''
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-zinc-600 dark:text-zinc-400 font-medium">Memuat metrik kebugaran...</p>
        </div>
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex font-sans">
      
      {/* Target Modal */}
      {showTargetModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-500" /> Buat Program Target Baru
              </h3>
              <button onClick={() => setShowTargetModal(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleTargetSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1.5">Berat Awal (kg)</label>
                  <input type="number" step="0.1" required value={targetForm.startWeight} onChange={e => setTargetForm({...targetForm, startWeight: e.target.value})} className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1.5">Target Berat (kg)</label>
                  <input type="number" step="0.1" required value={targetForm.targetWeight} onChange={e => setTargetForm({...targetForm, targetWeight: e.target.value})} className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-500 mb-1.5">Durasi Program (Minggu)</label>
                <select required value={targetForm.durationWeeks} onChange={e => setTargetForm({...targetForm, durationWeeks: e.target.value})} className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100">
                  <option value="4">4 Minggu</option>
                  <option value="8">8 Minggu</option>
                  <option value="12">12 Minggu</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1.5">Target Kalori Harian</label>
                  <input type="number" required placeholder="kcal" value={targetForm.dailyCalories} onChange={e => setTargetForm({...targetForm, dailyCalories: e.target.value})} className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1.5">Target Protein Harian (g)</label>
                  <input type="number" required placeholder="gram" value={targetForm.dailyProtein} onChange={e => setTargetForm({...targetForm, dailyProtein: e.target.value})} className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-500 mb-1.5">Target Olahraga Mingguan (Sesi)</label>
                <input type="number" required placeholder="Contoh: 4" value={targetForm.weeklyWorkouts} onChange={e => setTargetForm({...targetForm, weeklyWorkouts: e.target.value})} className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>

              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-md mt-4">
                Mulai Program
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:w-80 bg-zinc-900 text-zinc-100 flex-col border-r border-zinc-800 flex-shrink-0">
        <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
          <div className="bg-emerald-600 p-2 rounded-xl text-white">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">Gizi Kebugaran</h1>
            <p className="text-xs text-emerald-500 font-medium">Gizi Kebugaran AI</p>
          </div>
        </div>

        <div className="p-4 mx-4 my-6 bg-zinc-800/50 rounded-2xl border border-zinc-800 flex items-center gap-3">
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
          <Link href="/chat" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 text-sm transition-colors">
            <MessageSquare className="w-4 h-4" />
            <span>Chatbot AI</span>
          </Link>
          <Link href="/metrics" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-zinc-800 text-white font-medium text-sm transition-colors">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>Log Metrik & Gizi</span>
          </Link>
          {user?.role === 'admin' && (
            <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 text-sm transition-colors">
              <BookOpen className="w-4 h-4 text-emerald-500" />
              <span>Knowledge Base</span>
            </Link>
          )}
        </nav>

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

      {/* Mobile Sidebar Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop overlay */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Sidebar content drawer */}
          <aside className="absolute inset-y-0 left-0 w-80 bg-zinc-900 text-zinc-100 flex flex-col shadow-2xl border-r border-zinc-800 animate-slide-in z-10">
            {/* Drawer Header */}
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
                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User Card */}
            <div className="p-4 mx-4 my-6 bg-zinc-800/50 rounded-2xl border border-zinc-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-white uppercase">
                {user?.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user?.name}</p>
                <p className="text-xs text-zinc-400 truncate">{user?.email}</p>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
              <p className="px-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Menu Utama</p>
              <Link 
                href="/chat" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 text-sm transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chatbot AI</span>
              </Link>
              <Link 
                href="/metrics" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-zinc-800 text-white font-medium text-sm transition-colors"
              >
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span>Log Metrik & Gizi</span>
              </Link>
              {user?.role === 'admin' && (
                <Link 
                  href="/admin" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 text-sm transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-emerald-500" />
                  <span>Knowledge Base</span>
                </Link>
              )}
            </nav>

            {/* Footer Logout */}
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
        </div>
      )}

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative">
        <header className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 h-16 flex items-center justify-between px-6 flex-shrink-0 z-10 sticky top-0">
          <div className="flex items-center gap-3">
            {/* Hamburger Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden bg-emerald-600 hover:bg-emerald-700 p-2 rounded-xl text-white transition-all active:scale-95 flex items-center justify-center"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Log Metrik Komposisi Tubuh</h2>
              <p className="text-xs text-zinc-400">Analisis Komposisi Otot & Lemak ala InBody</p>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-6xl w-full mx-auto pb-24">
          
          {/* Section: Target Setting */}
          <section>
            {activeTarget ? (
              <div className="bg-gradient-to-br from-emerald-900 to-zinc-900 p-6 sm:p-8 rounded-3xl shadow-xl border border-emerald-800/30 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Target className="w-32 h-32" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-black mb-1">Target Program Anda</h2>
                      <p className="text-emerald-400/80 text-sm font-medium">Berlangsung hingga {new Date(activeTarget.end_date).toLocaleDateString('id-ID', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                    <div className="bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 rounded-full flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Aktif</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                      <p className="text-xs text-white/50 font-semibold uppercase mb-1">Berat Saat Ini</p>
                      <p className="text-xl font-bold">{stats.latestWeight || activeTarget.start_weight} <span className="text-sm text-white/50">kg</span></p>
                    </div>
                    <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                      <p className="text-xs text-white/50 font-semibold uppercase mb-1">Target Berat</p>
                      <p className="text-xl font-bold text-emerald-400">{activeTarget.target_weight} <span className="text-sm text-white/50">kg</span></p>
                    </div>
                    <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                      <p className="text-xs text-white/50 font-semibold uppercase mb-1">Target Kalori</p>
                      <p className="text-xl font-bold">{activeTarget.daily_calories_target} <span className="text-sm text-white/50">kcal/hr</span></p>
                    </div>
                    <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                      <p className="text-xs text-white/50 font-semibold uppercase mb-1">Target Protein</p>
                      <p className="text-xl font-bold">{activeTarget.daily_protein_target} <span className="text-sm text-white/50">g/hr</span></p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Progres Berat Badan</span>
                      <span>
                        {Math.abs((stats.latestWeight || activeTarget.start_weight) - activeTarget.start_weight).toFixed(1)} kg 
                        / {Math.abs(activeTarget.target_weight - activeTarget.start_weight).toFixed(1)} kg
                      </span>
                    </div>
                    <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden border border-white/10">
                      <div 
                        className="h-full bg-emerald-500 rounded-full" 
                        style={{ 
                          width: `${Math.min(100, Math.max(0, (Math.abs((stats.latestWeight || activeTarget.start_weight) - activeTarget.start_weight) / Math.abs(activeTarget.target_weight - activeTarget.start_weight)) * 100))}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 rounded-full flex items-center justify-center mb-4">
                  <Target className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Belum Ada Program Aktif</h2>
                <p className="text-zinc-500 dark:text-zinc-400 mb-6 max-w-md text-sm">Tetapkan target berat badan dan nutrisi Anda untuk mendapatkan panduan dan tracking yang lebih terarah bersama Gizi Kebugaran AI.</p>
                <button 
                  onClick={() => setShowTargetModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95 shadow-md flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Buat Program Target Baru
                </button>
              </div>
            )}
          </section>

          {/* Section: Daily Workout Logger */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2 mb-6">
                <Dumbbell className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Log Olahraga</h3>
              </div>
              <form onSubmit={handleWorkoutSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1.5">Tanggal</label>
                  <input type="date" required value={workoutForm.date} onChange={e => setWorkoutForm({...workoutForm, date: e.target.value})} className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1.5">Jenis Olahraga</label>
                  <select required value={workoutForm.workoutType} onChange={e => setWorkoutForm({...workoutForm, workoutType: e.target.value})} className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100">
                    <option value="Latihan Beban">Latihan Beban</option>
                    <option value="Kardio">Kardio (Lari, Sepeda, dll)</option>
                    <option value="HIIT">HIIT / Crossfit</option>
                    <option value="Yoga/Pilates">Yoga / Pilates</option>
                    <option value="Olahraga Permainan">Olahraga Permainan</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-500 mb-1.5">Durasi (Menit)</label>
                    <input type="number" required placeholder="45" value={workoutForm.duration} onChange={e => setWorkoutForm({...workoutForm, duration: e.target.value})} className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-500 mb-1.5">Intensitas</label>
                    <select required value={workoutForm.intensity} onChange={e => setWorkoutForm({...workoutForm, intensity: e.target.value})} className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100">
                      <option value="ringan">Ringan</option>
                      <option value="sedang">Sedang</option>
                      <option value="berat">Berat</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1.5">Catatan (Opsional)</label>
                  <input type="text" placeholder="Misal: Latihan dada dan triceps" value={workoutForm.notes} onChange={e => setWorkoutForm({...workoutForm, notes: e.target.value})} className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <button type="submit" className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:bg-zinc-800 dark:hover:bg-zinc-200 mt-2">
                  Catat Olahraga
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Olahraga Minggu Ini</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {workoutLogs.length} dari {activeTarget ? activeTarget.weekly_workouts_target : 3} Sesi Tercapai
                  </p>
                </div>
                {activeTarget && (
                  <div className="w-12 h-12 rounded-full border-4 border-emerald-100 dark:border-emerald-950 flex items-center justify-center relative">
                    <svg className="w-full h-full absolute -rotate-90 transform" viewBox="0 0 36 36">
                      <path className="text-emerald-500" strokeDasharray={`${Math.min(100, (workoutLogs.length / activeTarget.weekly_workouts_target) * 100)}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                    </svg>
                    <span className="text-xs font-bold">{Math.round(Math.min(100, (workoutLogs.length / (activeTarget.weekly_workouts_target || 1)) * 100))}%</span>
                  </div>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                {workoutLogs.length > 0 ? workoutLogs.map(log => (
                  <div key={log.id} className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 flex items-start gap-4">
                    <div className={`p-2.5 rounded-lg ${
                      log.intensity === 'berat' ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400' :
                      log.intensity === 'sedang' ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400' :
                      'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                    }`}>
                      <Flame className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-white">{log.workout_type}</h4>
                        <span className="text-[10px] uppercase font-bold text-zinc-400">{log.duration_minutes} Menit</span>
                      </div>
                      <p className="text-xs text-zinc-500">{new Date(log.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })} • Intensitas: <span className="capitalize">{log.intensity}</span></p>
                      {log.notes && <p className="text-xs text-zinc-400 mt-2 bg-zinc-100 dark:bg-zinc-900 p-2 rounded-md border border-zinc-200 dark:border-zinc-800 italic">"{log.notes}"</p>}
                    </div>
                  </div>
                )) : (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-400 py-10">
                    <Dumbbell className="w-8 h-8 mb-3 opacity-20" />
                    <p className="text-sm">Belum ada olahraga yang dicatat minggu ini.</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Section: InBody C-S-D Muscle-Fat Analysis Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
              <p className="text-xs font-semibold text-zinc-500 uppercase">Berat Badan</p>
              <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-1">{stats.latestWeight} kg</h3>
              <div className="mt-2 flex items-center gap-1.5 text-xs">
                <span className={`font-semibold px-2 py-0.5 rounded-full ${stats.weightDiff <= 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400'}`}>
                  {stats.weightDiff > 0 ? `+${stats.weightDiff}` : stats.weightDiff} kg
                </span>
                <span className="text-zinc-400 font-medium">sejak entri pertama</span>
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
              <p className="text-xs font-semibold text-zinc-500 uppercase">Massa Otot (SMM)</p>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.latestMuscle} kg</h3>
              <div className="mt-2 flex items-center gap-1.5 text-xs">
                <span className={`font-semibold px-2 py-0.5 rounded-full ${stats.muscleDiff >= 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400'}`}>
                  {stats.muscleDiff > 0 ? `+${stats.muscleDiff}` : stats.muscleDiff} kg
                </span>
                <span className="text-zinc-400 font-medium">sejak entri pertama</span>
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
              <p className="text-xs font-semibold text-zinc-500 uppercase">Massa Lemak (BFM)</p>
              <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{stats.latestFat} kg</h3>
              <div className="mt-2 flex items-center gap-1.5 text-xs">
                <span className={`font-semibold px-2 py-0.5 rounded-full ${stats.fatDiff <= 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400'}`}>
                  {stats.fatDiff > 0 ? `+${stats.fatDiff}` : stats.fatDiff} kg
                </span>
                <span className="text-zinc-400 font-medium">sejak entri pertama</span>
              </div>
            </div>
          </div>

          {/* Section: Chart & Form Wrapper */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 h-fit">
              <div className="flex items-center gap-2 mb-6">
                <Plus className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Catat Log InBody</h3>
              </div>
              <form onSubmit={handleAddLog} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1.5">Tanggal</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1.5">Berat Badan (kg)</label>
                  <input type="number" step="0.1" required placeholder="Contoh: 75.2" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1.5">Massa Otot / SMM (kg)</label>
                  <input type="number" step="0.1" required placeholder="Contoh: 33.1" value={muscle} onChange={(e) => setMuscle(e.target.value)} className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1.5">Massa Lemak / BFM (kg)</label>
                  <input type="number" step="0.1" required placeholder="Contoh: 18.5" value={fat} onChange={(e) => setFat(e.target.value)} className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Kalori (kcal)</label>
                    <input type="number" placeholder="2000" value={calories} onChange={(e) => setCalories(e.target.value)} className="w-full px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Protein (g)</label>
                    <input type="number" placeholder="140" value={protein} onChange={(e) => setProtein(e.target.value)} className="w-full px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95 shadow-md flex items-center justify-center gap-2 mt-2">
                  <Plus className="w-4 h-4" />
                  <span>Simpan Log</span>
                </button>
              </form>
            </div>
            <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Grafik Komposisi Tubuh</h3>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full">InBody Format</span>
                </div>
                <ProgressChart data={logs} />
              </div>
              <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl flex items-start gap-3">
                <Award className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-800 dark:text-emerald-400 leading-relaxed">
                  <span className="font-bold block mb-0.5">Tips Recomposition:</span>
                  Untuk hasil terbaik, jaga garis <b>Massa Otot (SMM)</b> stabil/meningkat dan <b>Massa Lemak (BFM)</b> menurun. Konsumsi protein harian Anda terpantau sangat membantu proses pemulihan otot rangka.
                </div>
              </div>
            </div>
          </div>

          {/* Section: Weekly Review Feed */}
          <section className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex items-center gap-2 mb-6">
              <FileText className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Laporan Mingguan (Weekly Review)</h3>
            </div>
            
            <div className="space-y-4">
              {weeklyReviews.length > 0 ? weeklyReviews.map(review => (
                <div key={review.id} className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                  <div className="bg-zinc-50 dark:bg-zinc-950 px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Minggu ke-{review.week_number}</h4>
                      <p className="text-xs text-zinc-500">{new Date(review.start_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})} - {new Date(review.end_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-[10px] uppercase font-bold text-zinc-400 mb-0.5">Compliance</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${review.compliance_score >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'}`}>
                          {review.compliance_score}%
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase font-bold text-zinc-400 mb-0.5">Perubahan</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${review.weight_change <= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400'}`}>
                          {review.weight_change > 0 ? '+' : ''}{review.weight_change} kg
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-zinc-900">
                    <div>
                      <h5 className="text-xs font-bold uppercase text-zinc-500 mb-2 flex items-center gap-1.5"><Bot className="w-3.5 h-3.5" /> AI Feedback</h5>
                      <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-950/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">{review.ai_feedback || "Belum ada feedback AI untuk minggu ini."}</p>
                    </div>
                    <div>
                      <h5 className="text-xs font-bold uppercase text-zinc-500 mb-2 flex items-center gap-1.5"><UserIcon className="w-3.5 h-3.5" /> Catatan Coach</h5>
                      <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-950/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 italic">"{review.coach_notes || "Coach belum memberikan catatan."}"</p>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                  <FileText className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">Belum Ada Review</h4>
                  <p className="text-xs text-zinc-500">Laporan mingguan Anda akan muncul di sini.</p>
                </div>
              )}
            </div>
          </section>

          {/* Section: Logs History Table */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Riwayat Catatan Timbangan</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400">
                    <th className="px-6 py-3.5">Tanggal</th>
                    <th className="px-6 py-3.5">Berat Badan</th>
                    <th className="px-6 py-3.5">Massa Otot (SMM)</th>
                    <th className="px-6 py-3.5">Massa Lemak (BFM)</th>
                    <th className="px-6 py-3.5">Asupan Kalori</th>
                    <th className="px-6 py-3.5">Asupan Protein</th>
                    <th className="px-6 py-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
                  {[...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                      <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-50">
                        {new Date(log.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-sky-600 dark:text-sky-400 font-semibold">{log.weight} kg</td>
                      <td className="px-6 py-4 text-emerald-600 dark:text-emerald-400 font-semibold">{log.muscle} kg</td>
                      <td className="px-6 py-4 text-rose-600 dark:text-rose-400 font-semibold">{log.fat} kg</td>
                      <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{log.calories ? `${log.calories} kcal` : '-'}</td>
                      <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{log.protein ? `${log.protein} g` : '-'}</td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => handleDeleteLog(log.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-zinc-400 hover:text-red-500 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4 text-zinc-400 hover:text-red-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-zinc-400">
                        Tidak ada log tersimpan. Silakan masukkan data timbangan di atas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>

    </div>
  );
}
