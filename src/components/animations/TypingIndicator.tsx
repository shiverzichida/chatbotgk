'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface TypingIndicatorProps {
  className?: string;
}

export default function TypingIndicator({ className = '' }: TypingIndicatorProps) {
  const dotVariants = {
    initial: { y: 0, opacity: 0.4 },
    animate: { y: -5, opacity: 1 }
  };

  const transitionStyle = {
    duration: 0.4,
    repeat: Infinity,
    repeatType: "reverse" as const,
    ease: "easeInOut" as const
  };

  return (
    <div className={`flex items-center space-x-1.5 p-3 bg-zinc-100 dark:bg-zinc-850 rounded-2xl rounded-tl-none w-fit border border-zinc-200/50 dark:border-zinc-800/50 ${className}`}>
      <motion.div
        variants={dotVariants}
        initial="initial"
        animate="animate"
        transition={{ ...transitionStyle, delay: 0 }}
        className="w-2 h-2 bg-emerald-500 rounded-full"
      />
      <motion.div
        variants={dotVariants}
        initial="initial"
        animate="animate"
        transition={{ ...transitionStyle, delay: 0.15 }}
        className="w-2 h-2 bg-emerald-500 rounded-full"
      />
      <motion.div
        variants={dotVariants}
        initial="initial"
        animate="animate"
        transition={{ ...transitionStyle, delay: 0.3 }}
        className="w-2 h-2 bg-emerald-500 rounded-full"
      />
    </div>
  );
}
