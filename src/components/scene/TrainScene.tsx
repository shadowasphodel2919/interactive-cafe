'use client';

import React from 'react';
import { useTrainStore } from '@/store/train-store';

export default function TrainScene() {
  const sounds = useTrainStore((s) => s.sounds);
  const toggleSound = useTrainStore((s) => s.toggleSound);

  const activeCount = Object.values(sounds).filter((s) => s.isActive).length;

  return (
    <div className="relative w-full h-screen overflow-hidden select-none">
      <img
        src="/train-station/bg.png"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />
    </div>
  );
}
