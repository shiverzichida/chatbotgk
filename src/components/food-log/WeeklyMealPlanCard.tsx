'use client';

import React, { useState } from 'react';
import { Utensils, Calendar, Sparkles, Plus, CheckCircle2, Flame, ShieldAlert, ChevronRight, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface MealPlanItem {
  type: 'sarapan' | 'makan_siang' | 'snack' | 'makan_malam';
  label: string;
  name: string;
  calories: number;
  protein: number;
  description: string;
}

interface DayPlan {
  dayName: string;
  meals: MealPlanItem[];
}

interface WeeklyMealPlanCardProps {
  targetCalories?: number;
  onMealLogged?: () => void;
}

export default function WeeklyMealPlanCard({ targetCalories = 1550, onMealLogged }: WeeklyMealPlanCardProps) {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [loggingMealName, setLoggingMealName] = useState<string | null>(null);
  const [loggedNotification, setLoggedNotification] = useState<string | null>(null);

  const days: DayPlan[] = [
    {
      dayName: 'Senin',
      meals: [
        { type: 'sarapan', label: '🌅 Sarapan', name: 'Oatmeal Pisang & Telur Rebus 2 Butir', calories: 340, protein: 22, description: 'Oatmeal (40g) diseduh air hangat + 2 butir telur rebus.' },
        { type: 'makan_siang', label: '☀️ Makan Siang', name: 'Dada Ayam Bakar Kunyit & Nasi Merah', calories: 520, protein: 44, description: 'Dada ayam tanpa kulit (150g) + nasi merah (100g) + tumis buncis.' },
        { type: 'snack', label: '🍵 Snack Sore', name: 'Smoothie Whey Protein & Kacang Almond', calories: 220, protein: 25, description: '1 scoop whey protein + 10 butir kacang almond.' },
        { type: 'makan_malam', label: '🌙 Makan Malam', name: 'Pepes Tahu Ikan Kakap & Sayur Bening', calories: 450, protein: 38, description: 'Ikan kakap pepes (120g) + pepes tahu + sayur bayam bening.' }
      ]
    },
    {
      dayName: 'Selasa',
      meals: [
        { type: 'sarapan', label: '🌅 Sarapan', name: 'Roti Gandum Panggang & Omelet Bayam', calories: 330, protein: 20, description: '2 lembar roti gandum + omelet 2 telur isi bayam.' },
        { type: 'makan_siang', label: '☀️ Makan Siang', name: 'Daging Sapi Tumis Brokoli & Nasi Jagung', calories: 540, protein: 42, description: 'Daging sapi tanpa lemak (120g) + nasi jagung (100g) + tumis brokoli.' },
        { type: 'snack', label: '🍵 Snack Sore', name: 'Yogurt Greek Low Fat & Buah Apel', calories: 180, protein: 15, description: '150g greek yogurt polos + 1 buah apel merah segar.' },
        { type: 'makan_malam', label: '🌙 Makan Malam', name: 'Dada Ayam Kukus Sambal Matah & Labu Siam', calories: 470, protein: 45, description: 'Dada ayam kukus (150g) + sambal matah minyak zaitun + rebusan labu siam.' }
      ]
    },
    {
      dayName: 'Rabu',
      meals: [
        { type: 'sarapan', label: '🌅 Sarapan', name: 'Nasi Merah Uduk Sehat & Telur Ceplok Air', calories: 350, protein: 21, description: 'Nasi merah (80g) uduk santan encer + telur ceplok tanpa minyak.' },
        { type: 'makan_siang', label: '☀️ Makan Siang', name: 'Ikan Gurame Panggang Bumbu Rujak & Kentang Rebus', calories: 510, protein: 40, description: 'Gurame panggang (150g) + 1 kentang rebus sedang + lalapan.' },
        { type: 'snack', label: '🍵 Snack Sore', name: 'Edamame Rebus (100g)', calories: 140, protein: 12, description: '100g edamame rebus kaya serat & protein nabati.' },
        { type: 'makan_malam', label: '🌙 Makan Malam', name: 'Tumis Tempe Tahu Dada Ayam Suwir', calories: 480, protein: 44, description: 'Tumis kecap low sodium isi tempe (50g), tahu (50g) & suwiran dada ayam (100g).' }
      ]
    },
    {
      dayName: 'Kamis',
      meals: [
        { type: 'sarapan', label: '🌅 Sarapan', name: 'Alpukat Shake & 2 Egg White Toast', calories: 340, protein: 24, description: 'Alpukat (80g) blended + 2 lembar putih telur panggang.' },
        { type: 'makan_siang', label: '☀️ Makan Siang', name: 'Ayam Pop Kuah Bening & Nasi Merah', calories: 530, protein: 46, description: 'Ayam tanpa kulit rebus bumbu aromatik (150g) + nasi merah (100g).' },
        { type: 'snack', label: '🍵 Snack Sore', name: 'Buah Naga & 1 Butir Telur Rebus', calories: 170, protein: 10, description: 'Potongan buah naga segar + 1 butir telur rebus.' },
        { type: 'makan_malam', label: '🌙 Makan Malam', name: 'Sup Ikan Batam Bening & Tahu Bakar', calories: 440, protein: 39, description: 'Sup ikan fillet bening asam segar + 2 potong tahu bakar.' }
      ]
    },
    {
      dayName: 'Jumat',
      meals: [
        { type: 'sarapan', label: '🌅 Sarapan', name: 'Bubur Manado Sehat (Tinutuan) & Telur Rebus', calories: 320, protein: 19, description: 'Bubur jagung bayam (150g) + 1 butir telur rebus.' },
        { type: 'makan_siang', label: '☀️ Makan Siang', name: 'Sate Ayam Dada Tanpa Bumbu Kacang (10 Tusuk)', calories: 550, protein: 50, description: 'Sate dada ayam tanpa lemak + sambal kecap encer + lontong (75g).' },
        { type: 'snack', label: '🍵 Snack Sore', name: 'Rebusan Ubi Manis & Teh Hijau Tanpa Gula', calories: 160, protein: 4, description: 'Ubi cilembu rebus (100g) + teh hijau hangat.' },
        { type: 'makan_malam', label: '🌙 Makan Malam', name: 'Daging Sapi Lada Hitam (Kecil Minyak) & Kangkung', calories: 490, protein: 41, description: 'Daging sapi sirloin tanpa lemak (120g) + tumis kangkung terasi.' }
      ]
    },
    {
      dayName: 'Sabtu',
      meals: [
        { type: 'sarapan', label: '🌅 Sarapan', name: 'Pancake Oats & Protein Powder', calories: 360, protein: 28, description: 'Pancake buatan sendiri dari 40g oats, 1 telur & 1 scoop protein.' },
        { type: 'makan_siang', label: '☀️ Makan Siang', name: 'Ikan Salmon Bakar Teriyaki & Nasi Merah', calories: 560, protein: 43, description: 'Salmon panggang (130g) + nasi merah (90g) + rebusan buncis wortel.' },
        { type: 'snack', label: '🍵 Snack Sore', name: 'Salad Buah Segar Yogurt', calories: 190, protein: 8, description: 'Potongan melon, apel, semangka dengan dressing yogurt Greek.' },
        { type: 'makan_malam', label: '🌙 Makan Malam', name: 'Dada Ayam Suwir Sambal Hijau & Sayur Asem', calories: 450, protein: 44, description: 'Dada ayam suwir (140g) + mangkuk sayur asem bening tanpa minyak.' }
      ]
    },
    {
      dayName: 'Minggu',
      meals: [
        { type: 'sarapan', label: '🌅 Sarapan', name: 'Lontong Sayur Bening & Telur Pindang', calories: 350, protein: 20, description: 'Lontong (80g) dengan kuah sayur labu bening + 1 telur pindang.' },
        { type: 'makan_siang', label: '☀️ Makan Siang', name: 'Ayam Pennyet Dada Bakar & Lalapan Segar', calories: 530, protein: 45, description: 'Dada ayam bakar geprek sambal tomat segar + nasi merah (100g).' },
        { type: 'snack', label: '🍵 Snack Sore', name: 'Nuts & Seeds Mix (30g)', calories: 180, protein: 7, description: 'Kacang mete & kuaci panggang tanpa garam tambahan.' },
        { type: 'makan_malam', label: '🌙 Makan Malam', name: 'Capcay Kuah Seafood (Udang & Cumi) & Tahu', calories: 460, protein: 38, description: 'Capcay kuah bening isi udang (75g), cumi (50g) dan potongan tahu putih.' }
      ]
    }
  ];

  const activeDay = days[selectedDayIndex];
  const dayTotalCalories = activeDay.meals.reduce((sum, m) => sum + m.calories, 0);
  const dayTotalProtein = activeDay.meals.reduce((sum, m) => sum + m.protein, 0);

  const handleLogMeal = async (meal: MealPlanItem) => {
    setLoggingMealName(meal.name);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      const todayStr = new Date().toISOString().split('T')[0];

      if (userId) {
        await supabase
          .from('food_logs')
          .insert({
            user_id: userId,
            date: todayStr,
            meal_type: meal.type,
            food_name: meal.name,
            calories: meal.calories,
            protein: meal.protein
          });
      }

      setLoggedNotification(`✅ Menu "${meal.name}" berhasil dicatat ke Jurnal Makanan!`);
      if (onMealLogged) onMealLogged();
      setTimeout(() => setLoggedNotification(null), 3500);

    } catch (e) {
      console.error('Gagal mencatat menu rekomendasi:', e);
    } finally {
      setLoggingMealName(null);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-7 shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-6 relative overflow-hidden">
      
      {/* Toast Notification */}
      {loggedNotification && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-2xl text-xs font-bold shadow-xl border border-emerald-400 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{loggedNotification}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Utensils className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                AI MEAL PLANNER
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Kuliner Sehat khas Indonesia
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white">Rencana Makan 7-Hari Berkalori Presisi</h3>
          </div>
        </div>

        <div className="bg-zinc-100 dark:bg-zinc-950 px-4 py-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 self-end sm:self-center text-right">
          <p className="text-[9px] uppercase font-bold text-zinc-400">Target Kalori Anda</p>
          <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">{targetCalories} kcal / hari</p>
        </div>
      </div>

      {/* 7 Days Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {days.map((day, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setSelectedDayIndex(idx)}
            className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-1.5 flex-shrink-0 ${
              selectedDayIndex === idx
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 scale-105'
                : 'bg-zinc-100 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{day.dayName}</span>
          </button>
        ))}
      </div>

      {/* Selected Day Summary Bar */}
      <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-black text-zinc-900 dark:text-white">Jadwal Menu Hari {activeDay.dayName}</h4>
          <p className="text-xs text-zinc-500">Estimasi total 4 sesi makan harian</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-xl border border-emerald-300 dark:border-emerald-800">
            🔥 {dayTotalCalories} kcal
          </span>
          <span className="text-xs font-bold px-3 py-1 bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 rounded-xl border border-sky-300 dark:border-sky-800">
            💪 {dayTotalProtein}g Protein
          </span>
        </div>
      </div>

      {/* Meals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeDay.meals.map((meal, idx) => (
          <div
            key={idx}
            className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-emerald-500/50 transition-all space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
                  {meal.label}
                </span>
                <span className="text-xs font-black text-zinc-700 dark:text-zinc-300">
                  {meal.calories} kcal | {meal.protein}g Protein
                </span>
              </div>
              
              <h5 className="font-bold text-sm text-zinc-900 dark:text-white leading-snug">{meal.name}</h5>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">{meal.description}</p>
            </div>

            {/* Catat Button */}
            <button
              type="button"
              onClick={() => handleLogMeal(meal)}
              disabled={loggingMealName === meal.name}
              className="w-full mt-2 py-2 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{loggingMealName === meal.name ? 'Mencatat...' : 'Catat Menu Ini ke Jurnal'}</span>
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
