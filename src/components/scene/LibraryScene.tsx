'use client';

import React from 'react';
import { useLibraryStore } from '@/store/library-store';

interface InteractiveLayer {
  id: string;
  soundId: string;
  label: string;
  points: string;
}

const LAYERS: InteractiveLayer[] = [
  {
    id: 'storm',
    soundId: 'lib-storm',
    label: 'Storm Window',
    points: '320,150 704,150 704,500 320,500',
  },
  {
    id: 'lamp',
    soundId: 'lib-lamp',
    label: 'Banker\'s Lamp',
    points: '720,550 820,550 820,700 720,700',
  },
  {
    id: 'book',
    soundId: 'lib-book',
    label: 'Open Book',
    points: '520,720 680,720 680,820 520,820',
  },
  {
    id: 'cat',
    soundId: 'lib-cat',
    label: 'Sleeping Cat',
    points: '200,680 350,680 350,820 200,820',
  },
  {
    id: 'clock',
    soundId: 'lib-clock',
    label: 'Grandfather Clock',
    points: '80,200 200,200 200,750 80,750',
  },
  {
    id: 'tea',
    soundId: 'lib-tea',
    label: 'Tea Cup',
    points: '440,750 510,750 510,830 440,830',
  },
  {
    id: 'fireplace',
    soundId: 'lib-fireplace',
    label: 'Fireplace',
    points: '780,580 980,580 980,850 780,850',
  },
  {
    id: 'pen',
    soundId: 'lib-pen',
    label: 'Fountain Pen',
    points: '480,700 550,700 550,770 480,770',
  },
  {
    id: 'ladder',
    soundId: 'lib-ladder',
    label: 'Rolling Ladder',
    points: '220,150 310,150 310,850 220,850',
  },
  {
    id: 'record',
    soundId: 'lib-record',
    label: 'Record Player',
    points: '840,400 950,400 950,540 840,540',
  },
  {
    id: 'glass-rain',
    soundId: 'lib-glass-rain',
    label: 'Rain on Glass',
    points: '320,150 704,150 704,500 320,500',
  },
];

export default function LibraryScene() {
  const sounds = useLibraryStore((s) => s.sounds);
  const toggleSound = useLibraryStore((s) => s.toggleSound);

  const activeCount = Object.values(sounds).filter((s) => s.isActive).length;

  return (
    <div className="relative w-full h-screen overflow-hidden select-none">
      {/* Base Background Image */}
      <img
        src="/library/bg.png"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />
    </div>
  );
}
