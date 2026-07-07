'use client';

import React from 'react';

interface MiniVolumeSliderProps {
  value: number;
  onChange: (v: number) => void;
  accentColor?: string;
}

export default function MiniVolumeSlider({
  value,
  onChange,
  accentColor = '#f59e0b',
}: MiniVolumeSliderProps) {
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
