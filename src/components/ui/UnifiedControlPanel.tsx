'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { useCafeStore, SOUND_CONFIGS } from '@/store/cafe-store';
import { useMountainStore, MOUNTAIN_SOUND_CONFIGS } from '@/store/mountain-store';
import { useTrainStore, TRAIN_SOUND_CONFIGS } from '@/store/train-store';
import { useLibraryStore, LIBRARY_SOUND_CONFIGS } from '@/store/library-store';
import { useCyberpunkStore, CYBERPUNK_SOUND_CONFIGS } from '@/store/cyberpunk-store';
import { useDesertStore, DESERT_SOUND_CONFIGS } from '@/store/desert-store';

/* ─── Minimal Volume Slider ────────────────────────────────────── */
function MiniVolumeSlider({
  value,
  onChange,
  accentColor = '#f59e0b',
}: {
  value: number;
  onChange: (v: number) => void;
  accentColor?: string;
}) {
  return (
    <div className="relative flex-1 h-5 flex items-center group">
      <div className="w-full h-[2px] rounded-full bg-white/5 group-hover:bg-white/10 transition-colors overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-150"
          style={{
            background: accentColor,
            width: `${value * 100}%`,
          }}
        />
      </div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        aria-label="Volume"
      />
      <div
        className="absolute w-2 h-2 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{ left: `calc(${value * 100}% - 4px)` }}
      />
    </div>
  );
}

/* ─── Sound Row ────────────────────────────────────────────────── */
function SoundRow({
  soundId,
  config,
  soundState,
  toggleSound,
  setSoundVolume,
  accentColor,
}: {
  soundId: string;
  config: any;
  soundState: any;
  toggleSound: (id: string) => void;
  setSoundVolume: (id: string, vol: number) => void;
  accentColor: string;
}) {
  if (!config || !soundState) return null;

  return (
    <div className="flex items-center gap-4 py-2 group">
      {/* Dynamic Toggle Button */}
      <button
        onClick={() => toggleSound(soundId)}
        className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all duration-300
          ${soundState.isActive
            ? 'bg-white/10 text-white shadow-sm border border-white/10'
            : 'bg-transparent text-white/30 border border-transparent hover:text-white/60 hover:bg-white/5'
          }`}
        aria-label={`Toggle ${config.name}`}
      >
        <span>{config.icon}</span>
      </button>

      {/* Name and Slider */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span
            className={`text-xs tracking-wide transition-colors duration-300 truncate
              ${soundState.isActive ? 'text-white/80 font-medium' : 'text-white/45'}`}
          >
            {config.name}
          </span>
          {soundState.isActive && (
            <span className="text-[10px] tabular-nums text-white/30">
              {Math.round(soundState.volume * 100)}
            </span>
          )}
        </div>
        <MiniVolumeSlider
          value={soundState.volume}
          onChange={(v) => setSoundVolume(soundId, v)}
          accentColor={soundState.isActive ? accentColor : 'rgba(255,255,255,0.2)'}
        />
      </div>
    </div>
  );
}

export default function UnifiedControlPanel() {
  const currentMode = useCafeStore((s) => s.currentMode);
  const isPlayMode = useCafeStore((s) => s.isPlayMode);
  const togglePlayMode = useCafeStore((s) => s.togglePlayMode);
  const resetPlayMode = useCafeStore((s) => s.resetPlayMode);
  const cafeDiscoveredSounds = useCafeStore((s) => s.discoveredSounds);

  // Read all states unconditionally (React Hooks rules)
  const cafeState = useCafeStore();
  const mountainState = useMountainStore();
  const trainState = useTrainStore();
  const libraryState = useLibraryStore();
  const cyberpunkState = useCyberpunkStore();
  const desertState = useDesertStore();

  let state: any;
  let configs: any[] = [];
  let accentColor = '#f59e0b';
  let panelBg = 'linear-gradient(180deg, rgba(12,13,18,0.7) 0%, rgba(8,9,12,0.85) 100%)';
  let modeLabel = '';

  switch (currentMode) {
    case 'city':
      state = cafeState;
      // In play mode, only show non-hidden sounds + discovered hidden sounds
      configs = isPlayMode
        ? SOUND_CONFIGS.filter(s => s.category !== 'hidden' || cafeDiscoveredSounds.includes(s.id))
        : SOUND_CONFIGS.filter(s => s.category !== 'hidden' || cafeDiscoveredSounds.includes(s.id));
      accentColor = '#f59e0b';
      panelBg = 'linear-gradient(180deg, rgba(20,15,10,0.7) 0%, rgba(10,5,2,0.85) 100%)';
      modeLabel = 'City Café';
      break;
    case 'mountain':
      state = mountainState;
      configs = MOUNTAIN_SOUND_CONFIGS;
      accentColor = '#34d399';
      panelBg = 'linear-gradient(180deg, rgba(15,20,15,0.7) 0%, rgba(5,10,5,0.85) 100%)';
      modeLabel = 'Mountain Café';
      break;
    case 'train':
      state = trainState;
      configs = TRAIN_SOUND_CONFIGS;
      accentColor = '#818cf8';
      panelBg = 'linear-gradient(180deg, rgba(15,15,25,0.7) 0%, rgba(5,5,15,0.85) 100%)';
      modeLabel = 'Train Platform';
      break;
    case 'library':
      state = libraryState;
      configs = LIBRARY_SOUND_CONFIGS;
      accentColor = '#fbbf24';
      panelBg = 'linear-gradient(180deg, rgba(20,15,10,0.7) 0%, rgba(10,5,2,0.85) 100%)';
      modeLabel = 'Cozy Library';
      break;
    case 'cyberpunk':
      state = cyberpunkState;
      configs = CYBERPUNK_SOUND_CONFIGS;
      accentColor = '#ec4899';
      panelBg = 'linear-gradient(180deg, rgba(20,10,20,0.7) 0%, rgba(10,2,10,0.85) 100%)';
      modeLabel = 'Rooftop';
      break;
    case 'desert':
      state = desertState;
      configs = DESERT_SOUND_CONFIGS;
      accentColor = '#f97316';
      panelBg = 'linear-gradient(180deg, rgba(25,15,10,0.7) 0%, rgba(15,5,2,0.85) 100%)';
      modeLabel = 'Desert Camp';
      break;
    default:
      state = cafeState;
      configs = SOUND_CONFIGS;
      accentColor = '#f59e0b';
      modeLabel = 'Sounds';
  }

  const {
    sounds,
    masterVolume,
    isMuted,
    isPanelOpen,
    toggleSound,
    setSoundVolume,
    setMasterVolume,
    toggleMute,
    clearAll,
    togglePanel,
  } = state;

  const activeCount = Object.values(sounds).filter((s: any) => s.isActive).length;

  // Group sound configs by category
  const categories = configs.reduce((acc: Record<string, any[]>, config) => {
    const cat = config.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(config);
    return acc;
  }, {});

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'left': return '☕ Counter';
      case 'center': return '💺 Seating';
      case 'right': return '🔥 Lounge';
      case 'background': return '🌧️ Atmosphere';
      case 'hidden': return '✨ Discovered';
      case 'coffee': return '☕ Counter';
      case 'nature': return '🌿 Nature';
      case 'people': return '💬 Activity';
      case 'activity': return '🚃 Ambient';
      default: return cat.charAt(0).toUpperCase() + cat.slice(1);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        className="fixed bottom-6 right-6 z-[45] w-12 h-12 rounded-full
          bg-neutral-950/65 backdrop-blur-xl border border-white/10
          flex items-center justify-center text-lg
          shadow-lg hover:border-white/20 transition-colors"
        onClick={togglePanel}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Toggle sound panel"
        style={{ display: isPanelOpen ? 'none' : 'flex' }}
      >
        <span className="relative">
          🎛️
          {activeCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-white/10 border border-white/20 text-[9px]
              text-white font-bold flex items-center justify-center backdrop-blur-md">
              {activeCount}
            </span>
          )}
        </span>
      </motion.button>

      {/* Spacious, Subtle Glass Panel */}
      <AnimatePresence>
        {isPanelOpen && (
          <motion.div
            className="fixed bottom-6 right-6 z-[45] w-[340px] max-h-[75vh] rounded-2xl overflow-hidden
              border border-white/5 shadow-2xl flex flex-col"
            style={{
              background: panelBg,
              backdropFilter: 'blur(30px) saturate(1.2)',
            }}
            initial={{ opacity: 0, y: 15, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.96 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {/* Header */}
            <div className="p-5 pb-4 border-b border-white/5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-xs font-semibold tracking-wider uppercase text-white/40 font-outfit flex items-center gap-1.5">
                    {modeLabel}
                    {currentMode === 'city' && isPlayMode && (
                      <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[9px] font-bold tracking-wider">PLAY</span>
                    )}
                  </h2>
                  <h3 className="text-sm font-medium text-white/95 mt-0.5">
                    Ambience Mixer
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={toggleMute}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors
                      ${isMuted
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-transparent'
                      }`}
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? '🔇' : '🔊'}
                  </button>
                  <button
                    onClick={clearAll}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs bg-white/5 text-white/60
                      hover:bg-white/10 hover:text-white transition-colors"
                    title="Clear All"
                  >
                    ⏹
                  </button>
                  <button
                    onClick={togglePanel}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs bg-white/5 text-white/60
                      hover:bg-white/10 hover:text-white transition-colors"
                    title="Close"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Master Volume Slider */}
              <div className="flex items-center gap-3 mt-4 pt-1">
                <span className="text-[10px] uppercase tracking-wider text-white/30 font-medium">Master</span>
                <MiniVolumeSlider
                  value={masterVolume}
                  onChange={setMasterVolume}
                  accentColor={accentColor}
                />
                <span className="text-[10px] tabular-nums text-white/35 min-w-[20px] text-right">
                  {Math.round(masterVolume * 100)}
                </span>
              </div>
            </div>

            {/* Play Mode Discovery Progress — City Café only */}
            <AnimatePresence>
              {currentMode === 'city' && isPlayMode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-5 py-3 border-b border-white/5 overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] uppercase tracking-widest text-purple-300/60 font-bold">
                      🔍 Discovered
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] tabular-nums text-white/30">
                        {cafeDiscoveredSounds.length} / {SOUND_CONFIGS.filter(s => s.category === 'hidden').length}
                      </span>
                      <button
                        onClick={resetPlayMode}
                        className="text-[9px] text-white/25 hover:text-white/50 transition-colors px-1.5 py-0.5 rounded border border-transparent hover:border-white/10"
                        title="Reset discoveries"
                      >
                        reset
                      </button>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-[2px] rounded-full bg-white/5 mb-2">
                    <motion.div
                      className="h-full rounded-full bg-purple-400"
                      animate={{ width: `${(cafeDiscoveredSounds.length / SOUND_CONFIGS.filter(s => s.category === 'hidden').length) * 100}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                  {/* Dots for each hidden sound */}
                  <div className="flex gap-1.5 flex-wrap">
                    {SOUND_CONFIGS.filter(s => s.category === 'hidden').map(s => (
                      <motion.div
                        key={s.id}
                        title={cafeDiscoveredSounds.includes(s.id) ? s.name : '??? hidden sound'}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] transition-all duration-500 ${
                          cafeDiscoveredSounds.includes(s.id)
                            ? 'bg-purple-500/15 text-purple-300 border border-purple-500/20'
                            : 'bg-white/3 text-white/15 border border-white/5'
                        }`}
                        animate={{
                          scale: cafeDiscoveredSounds.includes(s.id) ? [1, 1.05, 1] : 1,
                        }}
                      >
                        <span>{cafeDiscoveredSounds.includes(s.id) ? s.icon : '❓'}</span>
                        <span>{cafeDiscoveredSounds.includes(s.id) ? s.name : '???'}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sound Grid / List with Space */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-none max-h-[50vh]">
              {Object.entries(categories).map(([cat, catConfigs]) => (
                <div key={cat} className="space-y-1">
                  <h4 className="text-[9px] uppercase tracking-widest text-white/25 font-bold mb-1">
                    {getCategoryLabel(cat)}
                  </h4>
                  <div className="divide-y divide-white/[0.02]">
                    {catConfigs.map((config) => (
                      <SoundRow
                        key={config.id}
                        soundId={config.id}
                        config={config}
                        soundState={sounds[config.id]}
                        toggleSound={toggleSound}
                        setSoundVolume={setSoundVolume}
                        accentColor={accentColor}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-3 bg-black/15 border-t border-white/5 text-center">
              <span className="text-[9px] text-white/20 tracking-wider">
                Procedural Sound Synthesis & Mixing
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
