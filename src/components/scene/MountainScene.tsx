'use client';

import React from 'react';
import { useMountainStore } from '@/store/mountain-store';


export default function MountainScene() {
  const sounds = useMountainStore((s) => s.sounds);
  const toggleSound = useMountainStore((s) => s.toggleSound);

  const activeCount = Object.values(sounds).filter((s) => s.isActive).length;

  return (
    <div className="relative w-full h-screen overflow-hidden select-none">
      {/* ── Full-screen background ── */}
      <img
        src="/mountain-cafe/bg.png"
        alt="Mountain Cafe"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />
    </div>
  );
}