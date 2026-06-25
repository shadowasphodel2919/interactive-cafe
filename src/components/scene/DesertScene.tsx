'use client';

import React from 'react';
import { useDesertStore } from '@/store/desert-store';

export default function DesertScene() {
  const sounds = useDesertStore((s) => s.sounds);
  const toggleSound = useDesertStore((s) => s.toggleSound);

  const activeCount = Object.values(sounds).filter((s) => s.isActive).length;

  return (
    <div className="relative w-full h-screen overflow-hidden select-none">

      {/* Base Background Image */}
      <img
        src="/desert/bg.png"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

    </div>
  );
}
