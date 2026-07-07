'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type TimerMode = 'work' | 'break' | 'longBreak';

const MODE_CONFIGS = {
  work: { label: 'Work Focus', duration: 25 * 60, accent: '#ef4444', icon: '🍅' },
  break: { label: 'Short Break', duration: 5 * 60, accent: '#10b981', icon: '☕' },
  longBreak: { label: 'Long Break', duration: 15 * 60, accent: '#3b82f6', icon: '🍃' },
};

export default function PomodoroClock() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(MODE_CONFIGS.work.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio('/sounds/oven-timer-ding.mp3');
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Set duration on mode change
  useEffect(() => {
    setTimeLeft(MODE_CONFIGS[mode].duration);
    setIsRunning(false);
  }, [mode]);

  // Timer countdown effect
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (isRunning) {
      intervalId = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Trigger completion
            setIsRunning(false);
            if (audioRef.current && !isMuted) {
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch((err) => console.log('Audio playback blocked: ', err));
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRunning, isMuted]);

  const toggleTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRunning(!isRunning);
  };

  const resetTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRunning(false);
    setTimeLeft(MODE_CONFIGS[mode].duration);
  };

  const skipMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRunning(false);
    // Cycle modes: work -> break -> longBreak -> work
    if (mode === 'work') setMode('break');
    else if (mode === 'break') setMode('longBreak');
    else setMode('work');
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentConfig = MODE_CONFIGS[mode];
  const progress = (timeLeft / MODE_CONFIGS[mode].duration) * 100;

  return (
    <motion.div
      layout
      transition={{ type: 'spring', damping: 25, stiffness: 220 }}
      className={`fixed bottom-6 left-6 z-[40] overflow-hidden rounded-2xl
        border border-white/5 shadow-2xl flex flex-col cursor-pointer select-none
        bg-neutral-950/70 backdrop-blur-2xl text-white/90`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          /* ─── Compact State ────────────────────────────────────── */
          <motion.div
            key="compact"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3.5 px-4.5 py-3 h-12.5"
          >
            <span className="text-base animate-pulse">{currentConfig.icon}</span>
            <span className="text-sm font-semibold tracking-wider font-zurich">
              {formatTime(timeLeft)}
            </span>
            <div className="w-[1.5px] h-3 bg-white/10" />
            <button
              onClick={toggleTimer}
              className="text-xs hover:text-white transition-colors cursor-pointer"
              aria-label={isRunning ? 'Pause' : 'Start'}
            >
              {isRunning ? '⏸' : '▶'}
            </button>
          </motion.div>
        ) : (
          /* ─── Expanded State ────────────────────────────────────── */
          <motion.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-6 w-[290px]"
            onClick={(e) => e.stopPropagation()} // Prevent collapse when clicking inside container
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-bold tracking-widest uppercase text-white/40 font-zurich flex items-center gap-1.5">
                ⏱️ Pomodoro Timer
              </span>
              <button
                onClick={() => setIsExpanded(false)}
                className="w-5 h-5 rounded flex items-center justify-center text-xs text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors cursor-pointer"
                title="Collapse"
              >
                ✕
              </button>
            </div>

            {/* Mode Selector Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-white/5 mb-8 border border-white/5">
              {(Object.keys(MODE_CONFIGS) as TimerMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`py-1.5 rounded-lg text-[9px] font-bold tracking-widest uppercase font-zurich-cond transition-all duration-300 cursor-pointer ${
                    mode === m
                      ? 'bg-white/10 text-white shadow-sm border border-white/10'
                      : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                  }`}
                >
                  {m === 'work' ? 'Focus' : m === 'break' ? 'Break' : 'Long'}
                </button>
              ))}
            </div>

            {/* Timer Display Circle */}
            <div className="relative flex flex-col items-center justify-center py-5 mb-6">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="58"
                    className="stroke-white/5 fill-transparent"
                    strokeWidth="4"
                  />
                  <motion.circle
                    cx="64"
                    cy="64"
                    r="58"
                    className="fill-transparent"
                    stroke={currentConfig.accent}
                    strokeWidth="4"
                    strokeDasharray={2 * Math.PI * 58}
                    animate={{
                      strokeDashoffset: (2 * Math.PI * 58) * (1 - progress / 100),
                    }}
                    transition={{ duration: 1, ease: 'linear' }}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="text-center flex flex-col items-center z-10">
                  <span className="text-3xl font-bold font-zurich tracking-widest">
                    {formatTime(timeLeft)}
                  </span>
                  <span
                    className="text-[9px] uppercase tracking-widest font-bold font-zurich mt-1.5"
                    style={{ color: currentConfig.accent }}
                  >
                    {currentConfig.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Controls Bar */}
            <div className="flex items-center justify-center gap-5 border-t border-white/5 pt-5">
              <button
                onClick={toggleMute}
                className="w-8.5 h-8.5 rounded-lg flex items-center justify-center bg-white/5 text-white/50
                  hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                title={isMuted ? 'Unmute alert' : 'Mute alert'}
              >
                {isMuted ? '🔇' : '🔊'}
              </button>

              <button
                onClick={toggleTimer}
                className="w-10.5 h-10.5 rounded-full flex items-center justify-center text-lg bg-white/10 text-white
                  hover:bg-white/20 hover:scale-105 transition-all shadow-md cursor-pointer"
                title={isRunning ? 'Pause' : 'Start'}
              >
                {isRunning ? '⏸' : '▶'}
              </button>

              <button
                onClick={resetTimer}
                className="w-8.5 h-8.5 rounded-lg flex items-center justify-center bg-white/5 text-white/50
                  hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                title="Reset timer"
              >
                🔄
              </button>

              <button
                onClick={skipMode}
                className="w-8.5 h-8.5 rounded-lg flex items-center justify-center bg-white/5 text-white/50
                  hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                title="Skip mode"
              >
                ⏭
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
