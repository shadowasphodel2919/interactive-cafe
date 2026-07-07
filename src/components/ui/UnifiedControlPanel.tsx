'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { useCafeStore, SOUND_CONFIGS } from '@/store/cafe-store';
import { useMountainStore, MOUNTAIN_SOUND_CONFIGS } from '@/store/mountain-store';
import { useTrainStore, TRAIN_SOUND_CONFIGS } from '@/store/train-store';
import { useLibraryStore, LIBRARY_SOUND_CONFIGS } from '@/store/library-store';
import { useCyberpunkStore, CYBERPUNK_SOUND_CONFIGS } from '@/store/cyberpunk-store';
import { useDesertStore, DESERT_SOUND_CONFIGS } from '@/store/desert-store';

import PanelHeader from './sound-panel/PanelHeader';
import MasterVolumeControl from './sound-panel/MasterVolumeControl';
import PlayModeDiscovery from './sound-panel/PlayModeDiscovery';
import SoundRow from './sound-panel/SoundRow';

export default function UnifiedControlPanel() {
  const currentMode = useCafeStore((s) => s.currentMode);
  const isPlayMode = useCafeStore((s) => s.isPlayMode);
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
      configs = SOUND_CONFIGS.filter(s => s.category !== 'hidden' || cafeDiscoveredSounds.includes(s.id));
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

  const hiddenSounds = SOUND_CONFIGS.filter(s => s.category === 'hidden');

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        className="fixed bottom-6 right-6 z-[46] w-12 h-12 rounded-full
          bg-neutral-950/65 backdrop-blur-xl border border-white/10
          flex items-center justify-center text-lg
          shadow-lg hover:border-white/20 transition-colors cursor-pointer"
        onClick={togglePanel}
        animate={{
          x: isPanelOpen ? -360 : 0,
        }}
        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Toggle sound panel"
      >
        <motion.span
          animate={{ rotate: isPanelOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="relative flex items-center justify-center text-white"
        >
          {isPanelOpen ? '✕' : '🎛️'}
          {!isPanelOpen && activeCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-white/10 border border-white/20 text-[9px]
              text-white font-bold flex items-center justify-center backdrop-blur-md">
              {activeCount}
            </span>
          )}
        </motion.span>
      </motion.button>

      {/* Spacious, Subtle Docked Glass Panel */}
      <AnimatePresence>
        {isPanelOpen && (
          <motion.div
            className="fixed top-0 right-0 h-full w-[360px] z-[45] flex flex-col
              border-l border-white/5 shadow-2xl overflow-hidden"
            style={{
              background: panelBg,
              backdropFilter: 'blur(30px) saturate(1.2)',
            }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
          >
            {/* Header */}
            <PanelHeader
              modeLabel={modeLabel}
              currentMode={currentMode}
              isPlayMode={isPlayMode}
              isMuted={isMuted}
              toggleMute={toggleMute}
              clearAll={clearAll}
              togglePanel={togglePanel}
            />

            {/* Master Volume Slider */}
            <MasterVolumeControl
              masterVolume={masterVolume}
              setMasterVolume={setMasterVolume}
              accentColor={accentColor}
            />

            {/* Play Mode Discovery Progress — City Café only */}
            {currentMode === 'city' && isPlayMode && (
              <PlayModeDiscovery
                discoveredSounds={cafeDiscoveredSounds}
                resetPlayMode={resetPlayMode}
                hiddenSounds={hiddenSounds}
              />
            )}

            {/* Sound Grid / List with Space */}
            <div className="flex-1 overflow-y-auto p-6 space-y-10 scrollbar-none">
              {Object.entries(categories).map(([cat, catConfigs]) => (
                <div key={cat} className="space-y-3">
                  <h4 className="text-[10px] uppercase tracking-widest text-white/35 font-bold font-zurich mb-3">
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
            <div className="p-4 bg-black/15 border-t border-white/5 text-center">
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

