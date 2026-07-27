'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface MessageBubbleProps {
  text: string;
  isBot: boolean;
  referenceText?: string;
  delay?: number;
}

export default function MessageBubble({ text, isBot, referenceText, delay = 0 }: MessageBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, delay, ease: 'easeOut' }}
      className={`flex gap-2.5 items-start ${isBot ? 'self-start' : 'self-end flex-row-reverse'}`}
    >
      <div
        className={`w-6 h-6 rounded-full text-[10px] text-white flex items-center justify-center font-bold flex-shrink-0 ${
          isBot ? 'bg-emerald-600 shadow-sm shadow-emerald-600/30' : 'bg-zinc-700'
        }`}
      >
        {isBot ? 'AI' : 'U'}
      </div>
      <div
        className={`text-xs p-3 rounded-2xl ${
          isBot
            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40 rounded-tl-none'
            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tr-none'
        }`}
      >
        <span>{text}</span>
        {referenceText && (
          <p className="mt-1.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 opacity-90 border-t border-emerald-200/50 dark:border-emerald-900/50 pt-1">
            {referenceText}
          </p>
        )}
      </div>
    </motion.div>
  );
}
