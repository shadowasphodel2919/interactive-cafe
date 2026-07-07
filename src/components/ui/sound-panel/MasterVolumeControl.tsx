'use client';

import React from 'react';
import MiniVolumeSlider from './MiniVolumeSlider';

interface MasterVolumeControlProps {
  masterVolume: number;
  setMasterVolume: (vol: number) => void;
  accentColor: string;
}

export default function MasterVolumeControl({
  masterVolume,
  setMasterVolume,
  accentColor,
}: MasterVolumeControlProps) {
  return (
    <div className="px-6 py-5 border-b border-white/5 bg-black/5">
      <div className="flex items-center gap-4">
        <span className="text-xs uppercase tracking-widest text-white/30 font-bold font-zurich select-none">
          Master
        </span>
        <MiniVolumeSlider
          value={masterVolume}
          onChange={setMasterVolume}
          accentColor={accentColor}
        />
        <span className="text-xs font-semibold font-mono tabular-nums text-white/40 min-w-[24px] text-right">
          {Math.round(masterVolume * 100)}
        </span>
      </div>
    </div>
  );
}
