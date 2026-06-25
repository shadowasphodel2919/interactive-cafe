'use client';

import React from 'react';
import { useCyberpunkStore } from '@/store/cyberpunk-store';

export default function CyberpunkScene() {
  const sounds = useCyberpunkStore((s) => s.sounds);
  const toggleSound = useCyberpunkStore((s) => s.toggleSound);

  const activeCount = Object.values(sounds).filter((s) => s.isActive).length;

  return (
    <div className="relative w-full h-screen overflow-hidden select-none">

      {/* Base Background Image */}
      <img
        src="/cyberpunk/bg.png"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />
    </div>
  );
}
