'use client';

import React from 'react';
import MiniVolumeSlider from './MiniVolumeSlider';

interface SoundConfig {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  defaultVolume: number;
}

interface SoundState {
  isActive: boolean;
  volume: number;
}

interface SoundRowProps {
  soundId: string;
  config: SoundConfig;
  soundState: SoundState;
  toggleSound: (id: string) => void;
  setSoundVolume: (id: string, vol: number) => void;
  accentColor: string;
}

export default function SoundRow({
  soundId,
  config,
  soundState,
  toggleSound,
  setSoundVolume,
  accentColor,
}: SoundRowProps) {
  if (!config || !soundState) return null;

  return (
    <div className="flex items-center gap-4 py-3 group">
      {/* Dynamic Toggle Button */}
      <button
        onClick={() => toggleSound(soundId)}
        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all duration-300 cursor-pointer
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
        <div className="flex items-center justify-between mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span
            className={`text-xs tracking-wide font-medium font-zurich-cond truncate
              ${soundState.isActive ? 'text-white/90' : 'text-white/45'}`}
          >
            {config.name}
          </span>
          {soundState.isActive && (
            <span className="text-[10px] font-mono tabular-nums text-white/40">
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
