'use client';

import React from 'react';
import { Shield, Sparkles, Award, CheckCircle2, Lock, X, ChevronRight, Zap } from 'lucide-react';

export interface ChapterInfo {
  id: number;
  title: string;
  subtitle: string;
  weeks: string;
  themeColor: 'amber' | 'emerald' | 'purple';
  iconEmoji: string;
  description: string;
  coachMessage: string;
  rewardBadge: {
    title: string;
    xp: number;
    icon: string;
  };
  quests: {
    id: string;
    title: string;
    target: string;
    completed: boolean;
  }[];
}

interface ChapterDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapter: ChapterInfo | null;
  isCurrentChapter: boolean;
  isUnlocked: boolean;
  progressPercent: number;
}

export default function ChapterDetailModal({
  isOpen,
  onClose,
  chapter,
  isCurrentChapter,
  isUnlocked,
  progressPercent
}: ChapterDetailModalProps) {
  if (!isOpen || !chapter) return null;

  const getThemeBadgeClass = () => {
    if (chapter.themeColor === 'amber') {
      return 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800';
    }
    if (chapter.themeColor === 'emerald') {
      return 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
    }
    return 'bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800';
  };

  const getThemeHeaderClass = () => {
    if (chapter.themeColor === 'amber') {
      return 'from-amber-900 via-amber-950 to-zinc-900';
    }
    if (chapter.themeColor === 'emerald') {
      return 'from-emerald-900 via-teal-950 to-zinc-900';
    }
    return 'from-purple-900 via-indigo-950 to-zinc-900';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-lg shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className={`p-6 bg-gradient-to-r ${getThemeHeaderClass()} text-white flex-shrink-0 relative overflow-hidden`}>
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 text-8xl pointer-events-none">
            {chapter.iconEmoji}
          </div>

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <span className="text-3xl bg-white/10 backdrop-blur-md p-2.5 rounded-2xl border border-white/20">
                {chapter.iconEmoji}
              </span>
              <div>
                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${getThemeBadgeClass()}`}>
                  Babak {chapter.id} • {chapter.weeks}
                </span>
                <h3 className="text-lg font-black text-white mt-1 leading-snug">{chapter.title}</h3>
                <p className="text-xs text-zinc-300">{chapter.subtitle}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chapter Status Banner */}
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-zinc-300">Status Babak:</span>
            {isUnlocked ? (
              isCurrentChapter ? (
                <span className="font-bold text-amber-300 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 fill-amber-300" /> Babak Aktif Saat Ini
                </span>
              ) : (
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Babak Selesai
                </span>
              )
            ) : (
              <span className="font-bold text-zinc-400 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> Terkunci (Selesaikan Babak {chapter.id - 1})
              </span>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          
          {/* Progress Bar inside Chapter */}
          <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-zinc-700 dark:text-zinc-300">Progress Babak {chapter.id}</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400">{progressPercent}%</span>
            </div>
            <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs uppercase tracking-wider text-zinc-400">Deskripsi Petualangan</h4>
            <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">{chapter.description}</p>
          </div>

          {/* Coach Motivation Box */}
          <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 flex items-start gap-3">
            <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="font-bold text-emerald-900 dark:text-emerald-300 text-xs">Pesan Pelatih (Coach Mury)</h5>
              <p className="text-emerald-800 dark:text-emerald-400/90 text-xs italic mt-0.5 leading-relaxed">
                "{chapter.coachMessage}"
              </p>
            </div>
          </div>

          {/* Quests List */}
          <div className="space-y-3">
            <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs uppercase tracking-wider text-zinc-400 flex items-center justify-between">
              <span>Misi Pertempuran Babak Ini</span>
              <span className="text-[10px] text-emerald-600 font-bold">Auto-Sync</span>
            </h4>
            <div className="space-y-2">
              {chapter.quests.map((q) => (
                <div 
                  key={q.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                    q.completed 
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40' 
                      : 'bg-zinc-50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-full ${q.completed ? 'bg-emerald-500 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400'}`}>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className={`font-bold text-xs ${q.completed ? 'line-through text-zinc-400 dark:text-zinc-500' : 'text-zinc-800 dark:text-zinc-200'}`}>
                        {q.title}
                      </h5>
                      <p className="text-[10px] text-zinc-400">{q.target}</p>
                    </div>
                  </div>
                  {q.completed && (
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 font-bold px-2 py-0.5 rounded">
                      Tuntas ✓
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Reward Badge */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{chapter.rewardBadge.icon}</span>
              <div>
                <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">Reward Hadiah Babak</span>
                <h5 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">{chapter.rewardBadge.title}</h5>
              </div>
            </div>
            <div className="bg-amber-500 text-white text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>+{chapter.rewardBadge.xp} XP</span>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <span>Tutup & Lanjutkan Quest</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
