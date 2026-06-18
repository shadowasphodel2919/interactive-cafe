'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCafeStore, SOUND_CONFIGS, PRESETS } from '@/store/cafe-store';

/* ─── Volume Slider ───────────────────────────────────────────── */
function VolumeSlider({
  value,
  onChange,
  label,
  compact = false,
}: {
  value: number;
  onChange: (v: number) => void;
  label?: string;
  compact?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 ${compact ? '' : 'w-full'}`}>
      {label && (
        <span className="text-xs text-white/50 min-w-[20px] text-right">{label}</span>
      )}
      <div className="relative flex-1 h-6 flex items-center group">
        <div className="absolute inset-y-0 left-0 right-0 flex items-center">
          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, #d97706, #f59e0b)',
                width: `${value * 100}%`,
              }}
              layout
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </div>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          aria-label={label ?? 'Volume'}
        />
        {/* Thumb indicator */}
        <div
          className="absolute w-3.5 h-3.5 rounded-full bg-white shadow-lg shadow-amber-500/30
            border-2 border-amber-400 pointer-events-none transition-opacity
            group-hover:opacity-100 opacity-70"
          style={{ left: `calc(${value * 100}% - 7px)` }}
        />
      </div>
      <span className="text-xs text-white/30 min-w-[28px] text-left tabular-nums">
        {Math.round(value * 100)}
      </span>
    </div>
  );
}

/* ─── Sound Row ───────────────────────────────────────────────── */
function SoundRow({ soundId }: { soundId: string }) {
  const config = SOUND_CONFIGS.find((s) => s.id === soundId);
  const sounds = useCafeStore((s) => s.sounds);
  const toggleSound = useCafeStore((s) => s.toggleSound);
  const setSoundVolume = useCafeStore((s) => s.setSoundVolume);
  const soundState = sounds[soundId];

  if (!config || !soundState) return null;

  return (
    <motion.div
      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors
        ${soundState.isActive ? 'bg-amber-500/10' : 'hover:bg-white/5'}`}
      layout
    >
      <button
        onClick={() => toggleSound(soundId)}
        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm
          transition-all duration-200 shrink-0
          ${soundState.isActive
            ? 'bg-amber-500/30 border border-amber-400/50 shadow-sm shadow-amber-500/20'
            : 'bg-white/5 border border-white/10 hover:bg-white/10'
          }`}
        aria-label={`Toggle ${config.name}`}
      >
        {config.icon}
      </button>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-white/70 truncate font-medium">{config.name}</div>
        <VolumeSlider
          value={soundState.volume}
          onChange={(v) => setSoundVolume(soundId, v)}
          compact
        />
      </div>
    </motion.div>
  );
}

/* ─── Preset Button ───────────────────────────────────────────── */
function PresetButton({
  preset,
  isActive,
  onClick,
}: {
  preset: (typeof PRESETS)[number];
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      className={`px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200
        border backdrop-blur-sm text-left
        ${isActive
          ? 'bg-amber-500/20 border-amber-400/40 text-amber-200'
          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white/80'
        }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="text-sm mr-1">{preset.icon}</span>
      <span>{preset.name}</span>
    </motion.button>
  );
}

/* ─── Main Control Panel ─────────────────────────────────────── */
export default function ControlPanel() {
  const {
    sounds,
    masterVolume,
    isMuted,
    activePreset,
    isPanelOpen,
    customMixes,
    setMasterVolume,
    toggleMute,
    applyPreset,
    clearAll,
    togglePanel,
    saveCustomMix,
    loadCustomMix,
    deleteCustomMix,
    discoveredSounds,
  } = useCafeStore();

  const [activeTab, setActiveTab] = useState<'sounds' | 'presets' | 'custom'>('sounds');
  const [saveName, setSaveName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);

  const activeSoundsCount = Object.values(sounds).filter((s) => s.isActive).length;

  const categories = [
    { key: 'left', label: '☕ Counter', ids: SOUND_CONFIGS.filter((s) => s.category === 'left').map((s) => s.id) },
    { key: 'center', label: '💺 Seating', ids: SOUND_CONFIGS.filter((s) => s.category === 'center').map((s) => s.id) },
    { key: 'right', label: '🔥 Lounge', ids: SOUND_CONFIGS.filter((s) => s.category === 'right').map((s) => s.id) },
    { key: 'background', label: '🌧️ Atmosphere', ids: SOUND_CONFIGS.filter((s) => s.category === 'background').map((s) => s.id) },
  ];

  const discoveredHidden = SOUND_CONFIGS.filter(
    (s) => s.category === 'hidden' && discoveredSounds.includes(s.id)
  );

  if (discoveredHidden.length > 0) {
    categories.push({
      key: 'hidden',
      label: '✨ Discovered',
      ids: discoveredHidden.map((s) => s.id),
    });
  }

  return (
    <>
      {/* Toggle button */}
      <motion.button
        className="fixed bottom-6 right-6 z-[50] w-14 h-14 rounded-2xl
          bg-black/60 backdrop-blur-xl border border-white/15
          flex items-center justify-center text-xl
          shadow-xl shadow-black/30 hover:bg-black/70
          transition-colors"
        onClick={togglePanel}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Toggle control panel"
      >
        {isPanelOpen ? (
          <span className="text-white/70">✕</span>
        ) : (
          <span className="relative">
            🎛️
            {activeSoundsCount > 0 && (
              <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-amber-500 text-[10px]
                text-white font-bold flex items-center justify-center">
                {activeSoundsCount}
              </span>
            )}
          </span>
        )}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {isPanelOpen && (
          <motion.div
            className="fixed bottom-24 right-6 z-[45] w-[340px] max-h-[70vh]
              rounded-2xl overflow-hidden
              border border-white/10"
            style={{
              background: 'linear-gradient(135deg, rgba(20,20,30,0.85) 0%, rgba(15,15,25,0.92) 100%)',
              backdropFilter: 'blur(40px) saturate(1.5)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {/* Header */}
            <div className="px-4 pt-4 pb-3 border-b border-white/5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-outfit font-semibold text-white/80">Sound Mixer</h2>
                <div className="flex items-center gap-1">
                  <button
                    onClick={toggleMute}
                    className={`px-2.5 py-1 rounded-lg text-xs transition-all
                      ${isMuted
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                      }`}
                  >
                    {isMuted ? '🔇 Muted' : '🔊'}
                  </button>
                  <button
                    onClick={clearAll}
                    className="px-2.5 py-1 rounded-lg text-xs bg-white/5 text-white/50
                      border border-white/10 hover:bg-white/10 transition-all"
                  >
                    ⏹ Clear
                  </button>
                </div>
              </div>

              {/* Master Volume */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/40 shrink-0">Master</span>
                <VolumeSlider value={masterVolume} onChange={setMasterVolume} />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/5">
              {[
                { key: 'sounds' as const, label: 'Sounds' },
                { key: 'presets' as const, label: 'Presets' },
                { key: 'custom' as const, label: 'My Mixes' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 py-2.5 text-xs font-medium transition-all relative
                    ${activeTab === tab.key ? 'text-amber-300' : 'text-white/40 hover:text-white/60'}`}
                >
                  {tab.label}
                  {activeTab === tab.key && (
                    <motion.div
                      className="absolute bottom-0 left-2 right-2 h-0.5 bg-amber-400 rounded-full"
                      layoutId="tab-indicator"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(70vh-160px)] scrollbar-thin">
              <AnimatePresence mode="wait">
                {activeTab === 'sounds' && (
                  <motion.div
                    key="sounds"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="p-3 space-y-3"
                  >
                    {categories.map((cat) => (
                      <div key={cat.key}>
                        <div className="text-[10px] uppercase tracking-wider text-white/30 font-semibold mb-1.5 px-1">
                          {cat.label}
                        </div>
                        <div className="space-y-0.5">
                          {cat.ids.map((id) => (
                            <SoundRow key={id} soundId={id} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'presets' && (
                  <motion.div
                    key="presets"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="p-3 space-y-2"
                  >
                    {PRESETS.map((preset) => (
                      <PresetButton
                        key={preset.id}
                        preset={preset}
                        isActive={activePreset === preset.id}
                        onClick={() => applyPreset(preset.id)}
                      />
                    ))}
                    <p className="text-[10px] text-white/20 text-center pt-2">
                      Click a preset to instantly set the mood
                    </p>
                  </motion.div>
                )}

                {activeTab === 'custom' && (
                  <motion.div
                    key="custom"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="p-3 space-y-2"
                  >
                    {/* Save current mix */}
                    {!showSaveInput ? (
                      <button
                        onClick={() => setShowSaveInput(true)}
                        className="w-full px-3 py-2.5 rounded-xl text-xs font-medium
                          bg-amber-500/10 border border-amber-500/20 text-amber-300
                          hover:bg-amber-500/20 transition-all flex items-center justify-center gap-2"
                      >
                        💾 Save Current Mix
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={saveName}
                          onChange={(e) => setSaveName(e.target.value)}
                          placeholder="Mix name..."
                          className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10
                            text-xs text-white/80 placeholder:text-white/20 outline-none
                            focus:border-amber-500/30"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && saveName.trim()) {
                              saveCustomMix(saveName.trim());
                              setSaveName('');
                              setShowSaveInput(false);
                            }
                            if (e.key === 'Escape') {
                              setShowSaveInput(false);
                              setSaveName('');
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            if (saveName.trim()) {
                              saveCustomMix(saveName.trim());
                              setSaveName('');
                              setShowSaveInput(false);
                            }
                          }}
                          className="px-3 py-2 rounded-lg bg-amber-500/20 text-amber-300 text-xs
                            border border-amber-500/30 hover:bg-amber-500/30"
                        >
                          Save
                        </button>
                      </div>
                    )}

                    {/* Saved mixes */}
                    {Object.keys(customMixes).length === 0 ? (
                      <p className="text-[10px] text-white/20 text-center py-4">
                        No saved mixes yet. Create your perfect ambience and save it!
                      </p>
                    ) : (
                      Object.keys(customMixes).map((name) => (
                        <div
                          key={name}
                          className="flex items-center justify-between px-3 py-2 rounded-xl
                            bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                        >
                          <button
                            onClick={() => loadCustomMix(name)}
                            className="text-xs text-white/70 hover:text-white flex-1 text-left"
                          >
                            🎵 {name}
                          </button>
                          <button
                            onClick={() => deleteCustomMix(name)}
                            className="text-xs text-red-400/50 hover:text-red-400 ml-2 px-1"
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
