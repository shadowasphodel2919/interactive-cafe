'use client';

import React from 'react';

interface PanelHeaderProps {
  modeLabel: string;
  currentMode: string;
  isPlayMode: boolean;
  isMuted: boolean;
  toggleMute: () => void;
  clearAll: () => void;
  togglePanel: () => void;
}

export default function PanelHeader({
  modeLabel,
  currentMode,
  isPlayMode,
  isMuted,
  toggleMute,
  clearAll,
  togglePanel,
}: PanelHeaderProps) {
  return (
    <div className="p-6 pb-5 border-b border-white/5">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xs font-bold tracking-widest uppercase text-white/40 font-zurich flex items-center gap-2">
            {modeLabel}
            {currentMode === 'city' && isPlayMode && (
              <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[8px] font-bold tracking-widest font-zurich">
                PLAY
              </span>
            )}
          </h2>
          <h3 className="text-base font-semibold text-white/95 font-zurich-cond tracking-wide">
            AMBIENCE MIXER
          </h3>
        </div>
        <div className="flex items-center gap-2">
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
    </div>
  );
}
