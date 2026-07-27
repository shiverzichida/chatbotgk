'use client';

import React from 'react';
import { Award, Flame, Zap, Trophy, ShieldCheck, Dumbbell, Utensils, Activity, Lock } from 'lucide-react';

interface FitnessGamificationCardProps {
  foodLogsCount: number;
  completedWorkoutsCount: number;
  inbodyLogsCount: number;
}

export default function FitnessGamificationCard({
  foodLogsCount = 0,
  completedWorkoutsCount = 0,
  inbodyLogsCount = 0
}: FitnessGamificationCardProps) {
  // Calculate total XP
  const foodXP = foodLogsCount * 20;
  const workoutXP = completedWorkoutsCount * 50;
  const inbodyXP = inbodyLogsCount * 30;
  const totalXP = foodXP + workoutXP + inbodyXP;

  // Level milestones
  const levels = [
    { level: 1, name: 'Rookie Athlete 🥉', minXP: 0, maxXP: 100 },
    { level: 2, name: 'Fitness Explorer 🥈', minXP: 100, maxXP: 250 },
    { level: 3, name: 'Consistent Performer 🥇', minXP: 250, maxXP: 500 },
    { level: 4, name: 'Nutrition Warrior 💎', minXP: 500, maxXP: 900 },
    { level: 5, name: 'Body Recomp Pro 🔥', minXP: 900, maxXP: 1400 },
    { level: 6, name: 'Master Athlete 🏆', minXP: 1400, maxXP: 2000 }
  ];

  const currentLevelObj = levels.find(l => totalXP >= l.minXP && totalXP < l.maxXP) || levels[levels.length - 1];
  const nextLevelXP = currentLevelObj.maxXP;
  const currentXPInLevel = totalXP - currentLevelObj.minXP;
  const levelRange = currentLevelObj.maxXP - currentLevelObj.minXP;
  const levelProgress = Math.min(100, Math.max(0, Math.round((currentXPInLevel / levelRange) * 100)));

  // Badges Definitions
  const badges = [
    {
      id: 'badge1',
      title: 'Pencatat Pertama',
      desc: 'Catat makanan / olahraga 1x',
      icon: '🥇',
      unlocked: foodLogsCount > 0 || completedWorkoutsCount > 0 || inbodyLogsCount > 0
    },
    {
      id: 'badge2',
      title: 'Iron Will',
      desc: 'Selesaikan min. 3 sesi olahraga',
      icon: '🏋️‍♂️',
      unlocked: completedWorkoutsCount >= 3
    },
    {
      id: 'badge3',
      title: 'Nutri Master',
      desc: 'Catat 5+ jurnal makanan',
      icon: '🥗',
      unlocked: foodLogsCount >= 5
    },
    {
      id: 'badge4',
      title: 'InBody Pioneer',
      desc: 'Input 1+ metrik timbangan',
      icon: '⚡',
      unlocked: inbodyLogsCount >= 1
    },
    {
      id: 'badge5',
      title: 'Consistent Athlete',
      desc: 'Capai minimal 250 Total XP',
      icon: '🔥',
      unlocked: totalXP >= 250
    }
  ];

  const unlockedCount = badges.filter(b => b.unlocked).length;

  return (
    <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black text-white rounded-3xl p-6 shadow-xl border border-amber-500/30 space-y-6 relative overflow-hidden">
      
      {/* Glow Ambient Effect */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header & Level Badge */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-black text-xl shadow-lg shadow-amber-500/10">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-300 border border-amber-400/30">
                LEVEL {currentLevelObj.level}
              </span>
              <span className="text-xs font-bold text-amber-400">
                {unlockedCount} / {badges.length} Badges Unlocked
              </span>
            </div>
            <h3 className="text-lg font-black text-white">{currentLevelObj.name}</h3>
          </div>
        </div>

        {/* Total XP Display */}
        <div className="bg-zinc-800/80 px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-2 self-end sm:self-center">
          <Zap className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
          <div>
            <p className="text-[9px] uppercase font-bold text-zinc-400">Total Pengalaman</p>
            <p className="text-sm font-black text-amber-400">{totalXP} XP</p>
          </div>
        </div>
      </div>

      {/* Level XP Progress Bar */}
      <div className="space-y-2 relative z-10">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-zinc-300 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Progress Level {currentLevelObj.level}</span>
          </span>
          <span className="text-amber-400">{currentXPInLevel} / {levelRange} XP ({levelProgress}%)</span>
        </div>

        <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden p-0.5 border border-white/10 shadow-inner">
          <div 
            className="bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-300 h-full rounded-full transition-all duration-500 shadow-md"
            style={{ width: `${levelProgress}%` }}
          />
        </div>

        <p className="text-[10px] text-zinc-400 italic text-right">
          Butuh <b>{nextLevelXP - totalXP} XP lagi</b> untuk naik ke level berikutnya! (Catat Makanan: +20 XP | Olahraga: +50 XP)
        </p>
      </div>

      {/* Badges Showcase Grid */}
      <div className="relative z-10 pt-2">
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>Lencana Kebugaran Anda (*Badges Showcase*)</span>
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {badges.map(badge => (
            <div
              key={badge.id}
              className={`p-3 rounded-2xl border text-center transition-all relative overflow-hidden flex flex-col items-center justify-between ${
                badge.unlocked
                  ? 'bg-zinc-800/80 border-amber-500/50 text-white shadow-lg shadow-amber-500/5 hover:border-amber-400'
                  : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 opacity-60'
              }`}
            >
              <div className="text-2xl mb-1">{badge.icon}</div>
              <h4 className="text-xs font-bold text-white mb-0.5 line-clamp-1">{badge.title}</h4>
              <p className="text-[9px] text-zinc-400 leading-tight line-clamp-2">{badge.desc}</p>
              
              {!badge.unlocked && (
                <div className="absolute top-2 right-2 text-zinc-500">
                  <Lock className="w-3 h-3" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
