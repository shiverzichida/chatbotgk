'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Award, 
  Flame, 
  Zap, 
  Lock, 
  CheckCircle2, 
  Flag, 
  ChevronRight, 
  Trophy, 
  ShieldCheck, 
  Info,
  PartyPopper
} from 'lucide-react';
import ChapterDetailModal, { ChapterInfo } from './ChapterDetailModal';

interface UserTarget {
  id: string;
  start_weight: number;
  target_weight: number;
  start_date: string;
  end_date: string;
  daily_calories_target: number;
  daily_protein_target: number;
  weekly_workouts_target: number;
}

interface ExpeditionJourneyMapProps {
  userTarget: UserTarget | null;
  currentWeight: number;
  completedWorkoutsCount: number;
  foodLogsCount: number;
  onOpenTargetModal?: () => void;
}

export default function ExpeditionJourneyMap({
  userTarget,
  currentWeight,
  completedWorkoutsCount,
  foodLogsCount,
  onOpenTargetModal
}: ExpeditionJourneyMapProps) {
  const [selectedChapter, setSelectedChapter] = useState<ChapterInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Hitung persentase progress keseluruhan
  const startWeight = userTarget?.start_weight || 75;
  const targetWeight = userTarget?.target_weight || 70;
  const totalWeightDiff = Math.abs(startWeight - targetWeight) || 5;
  const currentWeightDiff = Math.abs(startWeight - currentWeight);

  let progressPercent = Math.min(100, Math.max(0, Math.round((currentWeightDiff / totalWeightDiff) * 100)));
  if (!userTarget) progressPercent = 0;

  // Tentukan Babak mana yang sedang aktif
  // Chapter 1: 0% - 33%
  // Chapter 2: 34% - 75%
  // Chapter 3: 76% - 100%
  let activeChapterId = 1;
  if (progressPercent >= 75) {
    activeChapterId = 3;
  } else if (progressPercent >= 33) {
    activeChapterId = 2;
  }

  // Hitung XP pengguna
  const baseXP = foodLogsCount * 15 + completedWorkoutsCount * 50;
  const progressBonusXP = Math.round(progressPercent * 10);
  const totalXP = baseXP + progressBonusXP;
  
  // Level Pengguna (tiap 300 XP naik level)
  const userLevel = Math.max(1, Math.floor(totalXP / 300) + 1);
  const xpCurrentLevel = totalXP % 300;

  // Data 3 Babak (Chapters Data)
  const chaptersData: ChapterInfo[] = [
    {
      id: 1,
      title: "The Ignition & Habit Launch",
      subtitle: "Fase Pembentukan Kebiasaan Awal",
      weeks: "Minggu 1 - 2",
      themeColor: "amber",
      iconEmoji: "🚩",
      description: "Fase penting untuk mengunci kebiasaan pencatatan makanan & jadwal olahraga. Fokus utama adalah konsistensi harian daripada penurunan drastis.",
      coachMessage: "Fokus pada konsistensi 7 hari pertama! Jangan khawatir jika timbangan belum turun drastis, yang terpenting adalah jurnal tidak terputus.",
      rewardBadge: {
        title: "Badge Habit Initiator",
        xp: 250,
        icon: "🛡️"
      },
      quests: [
        { id: 'q1', title: 'Catat Jurnal Makanan 5 Hari', target: 'Asupan terdata', completed: foodLogsCount >= 5 },
        { id: 'q2', title: 'Selesaikan 3 Sesi Olahraga Pertama', target: 'Latihan fisik', completed: completedWorkoutsCount >= 3 },
        { id: 'q3', title: 'Timbang Berat Badan Awal Program', target: 'InBody / Scale Log', completed: !!userTarget }
      ]
    },
    {
      id: 2,
      title: "The Body Recomposition Forge",
      subtitle: "Fase Pembakaran Lemak & Pembentukan Otot",
      weeks: "Minggu 3 - 6",
      themeColor: "emerald",
      iconEmoji: "⚡",
      description: "Tubuh Anda mulai beradaptasi! Di fase ini lemak tubuh akan berkurang signifikan dan massa otot mulai terbentuk dari konsistensi latihan.",
      coachMessage: "Fase ini adalah zona perubahan nyata. Jaga asupan protein harian Anda tetap tercapai untuk melindungi jaringan otot!",
      rewardBadge: {
        title: "Badge Iron Disciplinarian",
        xp: 500,
        icon: "⚡"
      },
      quests: [
        { id: 'q4', title: 'Capai 50% Target Berat Badan', target: 'Progress timbangan', completed: progressPercent >= 50 },
        { id: 'q5', title: 'Jaga Kepatuhan Protein > 80%', target: 'Daily Macro target', completed: foodLogsCount >= 10 },
        { id: 'q6', title: 'Tuntas 8 Sesi Olahraga Total', target: 'Konsistensi gym/kardio', completed: completedWorkoutsCount >= 8 }
      ]
    },
    {
      id: 3,
      title: "The Peak Fitness Mastery",
      subtitle: "Fase Transformasi Akhir & Puncak Performa",
      weeks: "Minggu 7 - 12",
      themeColor: "purple",
      iconEmoji: "👑",
      description: "Babak akhir menuju transformasi bentuk tubuh impian Anda! Pertahankan ritme hingga garis finish.",
      coachMessage: "Selamat! Anda sudah di garis akhir. Pertahankan gaya hidup sehat ini menjadi bagian tak terpisahkan dari identitas Anda!",
      rewardBadge: {
        title: "Trophy Fitness Legend",
        xp: 1000,
        icon: "👑"
      },
      quests: [
        { id: 'q7', title: 'Tuntaskan Target Berat Akhir', target: 'Goal Weight Tercapai', completed: progressPercent >= 95 },
        { id: 'q8', title: 'Tuntas 15 Sesi Olahraga Total', target: 'Total Olahraga Program', completed: completedWorkoutsCount >= 15 },
        { id: 'q9', title: 'Dapatkan Review Mingguan Coach', target: 'Weekly Coach Review', completed: progressPercent >= 90 }
      ]
    }
  ];

  const handleOpenChapterModal = (chapter: ChapterInfo) => {
    setSelectedChapter(chapter);
    setIsModalOpen(true);
  };

  // Hitung posisi horizontal Avatar Pin di lintasan SVG (0% -> 100%)
  const pinLeftPercent = Math.min(92, Math.max(5, progressPercent));

  return (
    <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-3xl p-6 shadow-xl border border-zinc-800 text-white space-y-6 relative overflow-hidden">
      
      {/* Background Subtle Glows */}
      <div className="absolute top-0 right-1/4 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header: Gamification User Profile & XP Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 p-0.5 shadow-lg">
              <div className="w-full h-full bg-zinc-900 rounded-[14px] flex items-center justify-center font-black text-amber-400 text-lg">
                {userLevel}
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 bg-amber-500 text-zinc-950 font-black text-[9px] px-1.5 py-0.2 rounded-full border border-zinc-900">
              LVL
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Petualang Fitnes (Level {userLevel})</h3>
              <span className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                {totalXP} XP Total
              </span>
            </div>
            {/* XP Progress Bar to Next Level */}
            <div className="w-48 sm:w-56 mt-2 space-y-1">
              <div className="flex justify-between text-[10px] text-zinc-400 font-semibold">
                <span>XP Level {userLevel}</span>
                <span>{xpCurrentLevel} / 300 XP</span>
              </div>
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round((xpCurrentLevel / 300) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Button / Active Status Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-zinc-800/80 px-3 py-1.5 rounded-xl border border-zinc-700/60 text-xs font-bold text-amber-300">
            <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
            <span>{foodLogsCount + completedWorkoutsCount} Misi Tuntas</span>
          </div>

          {userTarget ? (
            <button
              onClick={() => handleOpenChapterModal(chaptersData[activeChapterId - 1])}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 active:scale-95"
            >
              <span>Detail Babak {activeChapterId}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onOpenTargetModal}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 active:scale-95"
            >
              <Flag className="w-4 h-4" />
              <span>Mulai Petualangan Target</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Expedition Map Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h4 className="font-bold text-zinc-100">Peta Lintasan Petualangan Transformation</h4>
          </div>
          <span className="text-zinc-400">Total Progres: <span className="font-black text-emerald-400">{progressPercent}%</span></span>
        </div>

        {/* Interactive Expedition Path Visualization */}
        <div className="relative pt-8 pb-10 px-4 bg-zinc-950/60 rounded-2xl border border-zinc-800/80 overflow-hidden">
          
          {/* Progress Bar Track Background (SVG / CSS Line) */}
          <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-3 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 via-emerald-500 to-purple-500 rounded-full transition-all duration-700 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Animated Avatar Pin Moving Along the Path */}
          {userTarget && (
            <div 
              className="absolute top-2 -translate-x-1/2 flex flex-col items-center transition-all duration-700 z-20 group cursor-pointer"
              style={{ left: `${pinLeftPercent}%` }}
              onClick={() => handleOpenChapterModal(chaptersData[activeChapterId - 1])}
            >
              <div className="bg-gradient-to-r from-amber-500 to-emerald-500 text-zinc-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow-lg border border-white/40 animate-pulse whitespace-nowrap mb-1">
                Anda di Sini 🚀
              </div>
              <div className="w-10 h-10 rounded-full bg-zinc-900 border-2 border-emerald-400 flex items-center justify-center text-xl shadow-xl shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                🏃‍♂️
              </div>
            </div>
          )}

          {/* 3 Node Markers (Chapters 1, 2, 3) */}
          <div className="relative z-10 flex justify-between items-center px-2">
            
            {chaptersData.map((chap, idx) => {
              const isUnlocked = idx + 1 <= activeChapterId;
              const isCurrent = idx + 1 === activeChapterId;
              const isCompleted = idx + 1 < activeChapterId || (idx === 2 && progressPercent >= 95);

              return (
                <div 
                  key={chap.id}
                  onClick={() => handleOpenChapterModal(chap)}
                  className="flex flex-col items-center cursor-pointer group"
                >
                  {/* Node Icon Circle */}
                  <div className="relative mb-2">
                    {isCurrent && (
                      <span className="absolute -inset-2 rounded-full bg-emerald-500/30 animate-ping" />
                    )}
                    
                    <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold text-lg transition-all duration-300 border-2 shadow-lg group-hover:scale-105 ${
                      isCompleted
                        ? 'bg-emerald-600 border-emerald-400 text-white shadow-emerald-900/50'
                        : isCurrent
                        ? 'bg-zinc-900 border-amber-400 text-amber-400 shadow-amber-900/50'
                        : 'bg-zinc-900/90 border-zinc-700 text-zinc-500'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-7 h-7 text-white" />
                      ) : isUnlocked ? (
                        <span>{chap.iconEmoji}</span>
                      ) : (
                        <Lock className="w-5 h-5 text-zinc-500" />
                      )}
                    </div>
                  </div>

                  {/* Chapter Label Below Node */}
                  <div className="text-center space-y-0.5 max-w-[100px] sm:max-w-[140px]">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      isCurrent
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-500'
                    }`}>
                      Babak {chap.id}
                    </span>
                    <h5 className={`text-xs font-bold truncate mt-1 ${isCurrent ? 'text-white' : 'text-zinc-400'}`}>
                      {chap.title}
                    </h5>
                    <p className="text-[9px] text-zinc-500 hidden sm:block">{chap.weeks}</p>
                  </div>
                </div>
              );
            })}

          </div>
        </div>
      </div>

      {/* Chapter Quest Inspection Modal */}
      <ChapterDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        chapter={selectedChapter}
        isCurrentChapter={selectedChapter?.id === activeChapterId}
        isUnlocked={selectedChapter ? selectedChapter.id <= activeChapterId : false}
        progressPercent={
          selectedChapter?.id === 1
            ? Math.min(100, Math.round((progressPercent / 33) * 100))
            : selectedChapter?.id === 2
            ? Math.min(100, Math.max(0, Math.round(((progressPercent - 33) / 42) * 100)))
            : Math.min(100, Math.max(0, Math.round(((progressPercent - 75) / 25) * 100)))
        }
      />
    </div>
  );
}
