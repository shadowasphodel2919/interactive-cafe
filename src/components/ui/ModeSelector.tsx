'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCafeStore } from '@/store/cafe-store';

const MODES = [
  {
    key: 'city' as const,
    label: 'City Café',
    icon: '🌃',
    description: 'Rainy night ambience',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    bg: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.3)',
  },
  {
    key: 'mountain' as const,
    label: 'Mountain Café',
    icon: '🏔️',
    description: 'Peaceful mountain retreat',
    gradient: 'linear-gradient(135deg, #34d399, #059669)',
    bg: 'rgba(52,211,153,0.1)',
    border: 'rgba(52,211,153,0.3)',
  },
  {
    key: 'train' as const,
    label: 'Train Station',
    icon: '🚉',
    description: 'Rural station in light rain',
    gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    bg: 'rgba(99,102,241,0.1)',
    border: 'rgba(99,102,241,0.3)',
  },
  {
    key: 'library' as const,
    label: 'Cozy Library',
    icon: '📚',
    description: 'Grand study in a storm',
    gradient: 'linear-gradient(135deg, #fbbf24, #d97706)',
    bg: 'rgba(251,191,36,0.1)',
    border: 'rgba(251,191,36,0.3)',
  },
  {
    key: 'cyberpunk' as const,
    label: 'Cyberpunk Rooftop',
    icon: '🌃',
    description: 'Neon rainy megacity',
    gradient: 'linear-gradient(135deg, #ec4899, #06b6d4)',
    bg: 'rgba(236,72,153,0.1)',
    border: 'rgba(236,72,153,0.3)',
  },
  {
    key: 'desert' as const,
    label: 'Desert Campfire',
    icon: '🏜️',
    description: 'Serene star-filled night',
    gradient: 'linear-gradient(135deg, #f97316, #ea580c)',
    bg: 'rgba(249,115,22,0.1)',
    border: 'rgba(249,115,22,0.3)',
  },
];

export default function ModeSelector() {
  const currentMode = useCafeStore((s) => s.currentMode);
  const setMode = useCafeStore((s) => s.setMode);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeMode = MODES.find((m) => m.key === currentMode) ?? MODES[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="fixed top-6 left-6 z-[50]">
      {/* Current Mode Button */}
      <motion.button
        className="flex items-center gap-2 px-3 py-2 rounded-xl
          bg-black/50 backdrop-blur-xl border border-white/10
          hover:bg-black/60 hover:border-white/15
          transition-all duration-200 shadow-lg shadow-black/20"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        aria-label="Switch cafe mode"
        aria-expanded={isOpen}
      >
        <span className="text-base">{activeMode.icon}</span>
        <span className="text-xs font-outfit font-medium text-white/70">{activeMode.label}</span>
        <motion.span
          className="text-white/30 text-[10px]"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          ▼
        </motion.span>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute top-full mt-2 left-0 w-56 rounded-xl overflow-hidden
              border border-white/10 shadow-2xl shadow-black/40"
            style={{
              background: 'linear-gradient(135deg, rgba(20,20,30,0.95) 0%, rgba(15,15,25,0.98) 100%)',
              backdropFilter: 'blur(40px) saturate(1.5)',
            }}
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <div className="p-2 space-y-1">
              {MODES.map((mode) => {
                const isActive = currentMode === mode.key;
                return (
                  <motion.button
                    key={mode.key}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left
                      transition-all duration-200
                      ${isActive
                        ? 'border'
                        : 'hover:bg-white/5 border border-transparent'
                      }`}
                    style={isActive ? {
                      background: mode.bg,
                      borderColor: mode.border,
                    } : {}}
                    onClick={() => {
                      setMode(mode.key);
                      setIsOpen(false);
                    }}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-xl">{mode.icon}</span>
                    <div>
                      <div className="text-xs font-outfit font-semibold text-white/80">{mode.label}</div>
                      <div className="text-[10px] text-white/35">{mode.description}</div>
                    </div>
                    {isActive && (
                      <motion.div
                        className="ml-auto w-2 h-2 rounded-full"
                        style={{ background: mode.gradient }}
                        layoutId="mode-indicator"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Footer hint */}
            <div className="px-3 py-2 border-t border-white/5">
              <p className="text-[9px] text-white/20 text-center">
                Switch modes to change the scene & sounds
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
