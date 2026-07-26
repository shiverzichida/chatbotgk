'use client';

import React, { useState } from 'react';
import { Bell, Clock, Plus, FastForward, CheckCircle2, X, Sparkles, Utensils } from 'lucide-react';
import { HealthyMeal, HEALTHY_MEALS_DATABASE } from '@/lib/healthyMealsData';

interface MealAlarmReminderPopupProps {
  isOpen: boolean;
  onClose: () => void;
  mealType: 'sarapan' | 'makan_siang' | 'snack' | 'makan_malam';
  timeStr: string;
  onAddFood: (mealType: 'sarapan' | 'makan_siang' | 'makan_malam' | 'snack', foodName: string, calories: number, protein: number) => void;
  onSkipMeal: (mealType: string) => void;
}

export default function MealAlarmReminderPopup({
  isOpen,
  onClose,
  mealType,
  timeStr,
  onAddFood,
  onSkipMeal
}: MealAlarmReminderPopupProps) {
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');

  if (!isOpen) return null;

  const mealLabels: Record<string, { label: string; emoji: string }> = {
    sarapan: { label: 'Sarapan Pagi', emoji: '🌅' },
    makan_siang: { label: 'Makan Siang', emoji: '☀️' },
    snack: { label: 'Snack / Camilan Sore', emoji: '🍿' },
    makan_malam: { label: 'Makan Malam', emoji: '🌙' },
  };

  const currentMealMeta = mealLabels[mealType] || { label: 'Waktu Makan', emoji: '🍱' };

  // Sample 3 Recommended Meals for 1-click select
  const recommendedSamples = HEALTHY_MEALS_DATABASE.slice(0, 3);

  const handleSelectQuickMeal = (meal: HealthyMeal) => {
    setFoodName(meal.name);
    setCalories(String(meal.calories));
    setProtein(String(meal.protein));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName.trim() || !calories) return;

    onAddFood(
      mealType,
      foodName.trim(),
      parseInt(calories) || 0,
      parseInt(protein) || 0
    );

    setFoodName('');
    setCalories('');
    setProtein('');
    onClose();
  };

  const handleSkip = () => {
    onSkipMeal(currentMealMeta.label);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-lg shadow-2xl border-2 border-emerald-500/40 overflow-hidden flex flex-col max-h-[90vh] relative">
        
        {/* Animated Glow Accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-950 via-teal-950 to-zinc-900 text-white flex justify-between items-center flex-shrink-0 border-b border-emerald-900/50">
          <div className="flex items-center gap-3.5">
            <span className="text-3xl p-2 rounded-2xl bg-white/10 border border-white/20 animate-bounce">
              {currentMealMeta.emoji}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ⏰ WAKTU ALARM DITENTUKAN
                </span>
              </div>
              <h3 className="text-lg font-black text-white mt-0.5">Saatnya {currentMealMeta.label}!</h3>
              <p className="text-xs text-zinc-300">Pukul {timeStr} WIB • Catat makanan atau lewati (skip)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          
          {/* Quick Select Preset Healthy Meals */}
          <div className="space-y-2">
            <label className="font-bold text-zinc-900 dark:text-zinc-100 text-xs flex items-center justify-between">
              <span>Pilih Cepat Rekomendasi Menu Sehat:</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">1-Klik Isi</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {recommendedSamples.map((meal) => (
                <button
                  key={meal.id}
                  type="button"
                  onClick={() => handleSelectQuickMeal(meal)}
                  className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/50 hover:border-emerald-500/50 text-left flex flex-col justify-between transition-all group"
                >
                  <div className="flex items-center gap-1.5 font-bold text-[11px] text-zinc-800 dark:text-zinc-200">
                    <span>{meal.iconEmoji}</span>
                    <span className="truncate">{meal.name}</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                    {meal.calories} kcal • {meal.protein}g P
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Form Input Custom */}
          <form id="alarm-food-form" onSubmit={handleFormSubmit} className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Nama Makanan / Asupan</label>
              <input
                type="text"
                required
                placeholder="Contoh: Nasi Merah + Dada Ayam Panggang"
                value={foodName}
                onChange={e => setFoodName(e.target.value)}
                className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Kalori (kcal)</label>
                <input
                  type="number"
                  required
                  placeholder="350"
                  value={calories}
                  onChange={e => setCalories(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Protein (gram)</label>
                <input
                  type="number"
                  placeholder="25"
                  value={protein}
                  onChange={e => setProtein(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-col sm:flex-row gap-2.5 flex-shrink-0">
          <button
            type="button"
            onClick={handleSkip}
            className="flex-1 py-3 px-4 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <FastForward className="w-4 h-4 text-zinc-500" />
            <span>Skip / Tidak Makan</span>
          </button>
          
          <button
            type="submit"
            form="alarm-food-form"
            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Makanan Ini</span>
          </button>
        </div>

      </div>
    </div>
  );
}
