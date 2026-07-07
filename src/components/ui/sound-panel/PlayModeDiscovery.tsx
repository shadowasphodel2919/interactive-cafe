'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface HiddenSoundConfig {
  id: string;
  name: string;
  icon: string;
  category: string;
}

interface PlayModeDiscoveryProps {
  discoveredSounds: string[];
  resetPlayMode: () => void;
  hiddenSounds: HiddenSoundConfig[];
}

export default function PlayModeDiscovery({
  discoveredSounds,
  resetPlayMode,
  hiddenSounds,
}: PlayModeDiscoveryProps) {
  const discoveredCount = discoveredSounds.length;
  const totalHiddenCount = hiddenSounds.length;
  const progressPercent = totalHiddenCount > 0 ? (discoveredCount / totalHiddenCount) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="px-6 py-4 border-b border-white/5 overflow-hidden"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] uppercase tracking-widest text-purple-300/60 font-bold font-zurich">
          🔍 Discovered
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono tabular-nums text-white/30">
            {discoveredCount} / {totalHiddenCount}
          </span>
          <button
            onClick={resetPlayMode}
            className="text-[10px] font-zurich-cond text-white/25 hover:text-white/50 transition-colors px-1.5 py-0.5 rounded border border-transparent hover:border-white/10 cursor-pointer"
            title="Reset discoveries"
          >
            RESET
          </button>
        </div>
      </div>
      {/* Progress bar */}
      <div className="w-full h-[2px] rounded-full bg-white/5 mb-3">
        <motion.div
          className="h-full rounded-full bg-purple-400"
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      {/* Dots/tags for each hidden sound */}
      <div className="flex gap-2 flex-wrap">
        {hiddenSounds.map((s) => {
          const isDiscovered = discoveredSounds.includes(s.id);
          return (
            <motion.div
              key={s.id}
              title={isDiscovered ? s.name : '??? hidden sound'}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-zurich-cond transition-all duration-500 ${
                isDiscovered
                  ? 'bg-purple-500/15 text-purple-300 border border-purple-500/20'
                  : 'bg-white/3 text-white/15 border border-white/5'
              }`}
              animate={{
                scale: isDiscovered ? [1, 1.05, 1] : 1,
              }}
            >
              <span>{isDiscovered ? s.icon : '❓'}</span>
              <span>{isDiscovered ? s.name : '???'}</span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
