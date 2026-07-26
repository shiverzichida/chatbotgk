'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { User, X, Loader2, Save, CheckCircle2 } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { user, updateProfileName } = useAuth();
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('2000-01-01');
  const [gender, setGender] = useState('pria');
  const [heightCm, setHeightCm] = useState('175');
  const [goalType, setGoalType] = useState('fat_loss');
  const [activityLevel, setActivityLevel] = useState('sedang');
  const [avatarUrl, setAvatarUrl] = useState('🏋️‍♂️');
  
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Load initial profile data from Supabase
    const fetchProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) return;

        // Set default name from session/context
        setFullName(user?.name || (session.user.user_metadata?.name as string) || '');
        
        // Fetch extended details from profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (!error && data) {
          if (data.full_name) setFullName(data.full_name);
          if (data.date_of_birth) setDateOfBirth(data.date_of_birth);
          if (data.gender) setGender(data.gender);
          if (data.height_cm) setHeightCm(String(data.height_cm));
          if (data.goal_type) setGoalType(data.goal_type);
          if (data.activity_level) setActivityLevel(data.activity_level);
          if (data.avatar_url) setAvatarUrl(data.avatar_url);
        }
      } catch (err) {
        console.warn('Gagal memuat detail profil:', err);
      }
    };

    fetchProfile();
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (userId) {
        // 1. Update public.profiles table in Supabase
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            full_name: fullName,
            email: session.user.email || '',
            date_of_birth: dateOfBirth,
            gender,
            height_cm: parseFloat(heightCm) || 175,
            goal_type: goalType,
            activity_level: activityLevel,
            avatar_url: avatarUrl
          });

        if (profileError) throw profileError;

        // 2. Update user metadata in Supabase Auth
        await supabase.auth.updateUser({
          data: {
            name: fullName,
            goal_type: goalType,
            avatar_url: avatarUrl
          }
        });
      }

      // Update AuthContext name state dynamically across UI
      updateProfileName(fullName);

      setStatusMessage({ type: 'success', message: 'Profil Anda berhasil diperbarui!' });
      setTimeout(() => {
        onClose();
        setStatusMessage(null);
      }, 1200);

    } catch (err: any) {
      console.error('Error saving profile:', err);
      setStatusMessage({ type: 'error', message: err.message || 'Gagal memperbarui profil.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">Ubah Data Profil</h3>
              <p className="text-xs text-zinc-400">Pengaturan akun & target kebugaran</p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Avatar / Foto Profil Selector */}
          <div>
            <label className="block text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300 mb-2">Pilih Avatar / Foto Profil</label>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {['🏋️‍♂️', '🥗', '🏃', '⚡', '🧘', '🥊', '🔥', '🚴'].map((avatar, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatarUrl(avatar)}
                  className={`w-11 h-11 rounded-2xl text-xl flex items-center justify-center border-2 transition-all flex-shrink-0 ${
                    avatarUrl === avatar
                      ? 'border-emerald-500 bg-emerald-500/20 scale-105 shadow-md'
                      : 'border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 hover:border-emerald-400'
                  }`}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300 mb-1.5">Nama Lengkap</label>
            <input 
              type="text" 
              required 
              value={fullName} 
              onChange={e => setFullName(e.target.value)} 
              placeholder="Nama Anda..." 
              className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-500" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-zinc-400 mb-1.5">Tanggal Lahir</label>
            <input 
              type="date" 
              required 
              value={dateOfBirth} 
              onChange={e => setDateOfBirth(e.target.value)} 
              className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-500" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-400 mb-1.5">Jenis Kelamin</label>
              <select 
                value={gender} 
                onChange={e => setGender(e.target.value)} 
                className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 capitalize"
              >
                <option value="pria">Pria</option>
                <option value="wanita">Wanita</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-400 mb-1.5">Tinggi Badan (cm)</label>
              <input 
                type="number" 
                step="0.5" 
                required 
                value={heightCm} 
                onChange={e => setHeightCm(e.target.value)} 
                placeholder="175" 
                className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-500" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-zinc-400 mb-1.5">Program Target Utama</label>
            <select 
              value={goalType} 
              onChange={e => setGoalType(e.target.value)} 
              className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="fat_loss">🔥 Fat Loss / Potong Lemak</option>
              <option value="muscle_gain">💪 Muscle Gain / Tambah Massa Otot</option>
              <option value="recomposition">⚡ Body Recomposition (Otot ↑ Lemak ↓)</option>
              <option value="maintenance">⚖️ Maintenance / Jaga Kebugaran</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-zinc-400 mb-1.5">Level Aktivitas Fisik</label>
            <select 
              value={activityLevel} 
              onChange={e => setActivityLevel(e.target.value)} 
              className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 capitalize"
            >
              <option value="sedentari">Sedentari (Banyak Duduk)</option>
              <option value="ringan">Ringan (Olahraga 1-2x / minggu)</option>
              <option value="sedang">Sedang (Olahraga 3-5x / minggu)</option>
              <option value="berat">Berat (Olahraga 6-7x / minggu)</option>
            </select>
          </div>

          {statusMessage && (
            <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50' 
                : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/50'
            }`}>
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{statusMessage.message}</span>
            </div>
          )}

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={isSaving}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
