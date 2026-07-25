'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Calculator, X, Sparkles, Check, ArrowRight } from 'lucide-react';

interface TdeeCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTarget?: (calories: number, protein: number) => void;
}

export default function TdeeCalculatorModal({ isOpen, onClose, onApplyTarget }: TdeeCalculatorModalProps) {
  const [gender, setGender] = useState('pria');
  const [age, setAge] = useState('25');
  const [heightCm, setHeightCm] = useState('175');
  const [weightKg, setWeightKg] = useState('75');
  const [activityLevel, setActivityLevel] = useState('sedang');
  const [goalType, setGoalType] = useState('fat_loss');

  const [bmr, setBmr] = useState(0);
  const [tdee, setTdee] = useState(0);
  const [targetCalories, setTargetCalories] = useState(0);
  const [targetProtein, setTargetProtein] = useState(0);
  const [targetCarbs, setTargetCarbs] = useState(0);
  const [targetFat, setTargetFat] = useState(0);

  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Load current profile & weight info from Supabase
    const loadProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) return;

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
        console.warn('Gagal memuat profil untuk kalkulator TDEE:', err);
      }
    };

    loadProfile();
  }, [isOpen]);

  // Recalculate BMR, TDEE, & Macros when inputs change
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

    // Fat target: ~25% of calories
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

  if (!isOpen) return null;

  const handleApply = async () => {
    setIsApplying(true);
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
              end_date: new Date(Date.now() + 60*24*60*60*1000).toISOString().split('T')[0],
              daily_calories_target: targetCalories,
              daily_protein_target: targetProtein,
              weekly_workouts_target: 4,
              is_active: true
            });
        }
      }

      if (onApplyTarget) {
        onApplyTarget(targetCalories, targetProtein);
      }

      onClose();
    } catch (err) {
      console.error('Gagal menerapkan target TDEE:', err);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">Kalkulator TDEE & Makronutrisi</h3>
              <p className="text-xs text-zinc-400">Estimasi Sains Mifflin-St Jeor</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Inputs Section */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Jenis Kelamin</label>
              <select 
                value={gender} 
                onChange={e => setGender(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="pria">Pria</option>
                <option value="wanita">Wanita</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Usia (Tahun)</label>
              <input 
                type="number" 
                value={age} 
                onChange={e => setAge(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Tinggi Badan (cm)</label>
              <input 
                type="number" 
                value={heightCm} 
                onChange={e => setHeightCm(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Berat Badan (kg)</label>
              <input 
                type="number" 
                step="0.1" 
                value={weightKg} 
                onChange={e => setWeightKg(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Aktivitas Fisik</label>
              <select 
                value={activityLevel} 
                onChange={e => setActivityLevel(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="sedentari">Sedentari (Banyak Duduk)</option>
                <option value="ringan">Ringan (1-2x Olahraga/mg)</option>
                <option value="sedang">Sedang (3-5x Olahraga/mg)</option>
                <option value="berat">Berat (6-7x Olahraga/mg)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Program Target</label>
              <select 
                value={goalType} 
                onChange={e => setGoalType(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="fat_loss">Fat Loss (-400 kcal)</option>
                <option value="muscle_gain">Muscle Gain (+300 kcal)</option>
                <option value="recomposition">Recomp (-200 kcal)</option>
                <option value="maintenance">Maintenance (+0)</option>
              </select>
            </div>
          </div>

          {/* Results Summary Box */}
          <div className="bg-gradient-to-br from-emerald-900 to-zinc-900 text-white p-5 rounded-2xl border border-emerald-800/40 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <p className="text-[10px] font-bold uppercase text-emerald-400 tracking-wider">Target Kalori Harian</p>
                <h4 className="text-3xl font-black text-white">{targetCalories} <span className="text-sm font-medium text-emerald-300">kcal / hari</span></h4>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-white/60">TDEE: <span className="font-bold text-white">{tdee}</span> kcal</p>
                <p className="text-[10px] text-white/60">BMR: <span className="font-bold text-white">{bmr}</span> kcal</p>
              </div>
            </div>

            {/* Macro Distribution */}
            <div>
              <p className="text-[10px] font-bold uppercase text-white/60 mb-2">Rekomendasi Distribusi Makronutrisi</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-black/30 p-3 rounded-xl border border-white/5 text-center">
                  <p className="text-[9px] font-bold text-emerald-400 uppercase">Protein</p>
                  <p className="text-lg font-black">{targetProtein} <span className="text-xs font-medium text-white/50">g</span></p>
                </div>
                <div className="bg-black/30 p-3 rounded-xl border border-white/5 text-center">
                  <p className="text-[9px] font-bold text-sky-400 uppercase">Karbohidrat</p>
                  <p className="text-lg font-black">{targetCarbs} <span className="text-xs font-medium text-white/50">g</span></p>
                </div>
                <div className="bg-black/30 p-3 rounded-xl border border-white/5 text-center">
                  <p className="text-[9px] font-bold text-amber-400 uppercase">Lemak</p>
                  <p className="text-lg font-black">{targetFat} <span className="text-xs font-medium text-white/50">g</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex justify-end gap-3 flex-shrink-0">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Batal
          </button>
          <button 
            type="button"
            onClick={handleApply}
            disabled={isApplying}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Terapkan ke Target Program</span>
          </button>
        </div>
      </div>
    </div>
  );
}
