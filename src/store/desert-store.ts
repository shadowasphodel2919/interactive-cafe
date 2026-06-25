'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DesertSoundConfig {
  id: string;
  name: string;
  icon: string;
  category: 'nature' | 'people' | 'activity';
  description: string;
  defaultVolume: number;
  filePath: string;
  loop: boolean;
}

export interface DesertSoundState {
  isActive: boolean;
  volume: number;
}

export const DESERT_SOUND_CONFIGS: DesertSoundConfig[] = [
  {
    id: 'de-campfire',
    name: 'Campfire Crackle',
    icon: '🔥',
    category: 'nature',
    description: 'Warm roaring campfire',
    defaultVolume: 0.6,
    filePath: '__procedural__',
    loop: true,
  },
  {
    id: 'de-guitar',
    name: 'Acoustic Guitar',
    icon: '🎸',
    category: 'activity',
    description: 'Soft guitar chord tones',
    defaultVolume: 0.5,
    filePath: '__procedural__',
    loop: true,
  },
  {
    id: 'de-coffee',
    name: 'Coffee Pot',
    icon: '☕',
    category: 'activity',
    description: 'Hot coffee percolating on the embers',
    defaultVolume: 0.4,
    filePath: '/sounds/coffee-pouring-into-a-cup.mp3',
    loop: true,
  },
  {
    id: 'de-coyote',
    name: 'Coyote Howl',
    icon: '🐺',
    category: 'nature',
    description: 'Distant desert coyote calls',
    defaultVolume: 0.35,
    filePath: '__procedural__',
    loop: true,
  },
  {
    id: 'de-crickets',
    name: 'Desert Crickets',
    icon: '🦗',
    category: 'nature',
    description: 'Evening insects and crickets in the brush',
    defaultVolume: 0.4,
    filePath: '__procedural__',
    loop: true,
  },
  {
    id: 'de-tent',
    name: 'Tent Flapping',
    icon: '⛺',
    category: 'activity',
    description: 'Wind blowing the tent canvas flap',
    defaultVolume: 0.3,
    filePath: '/sounds/wind-blowing.mp3',
    loop: true,
  },
  {
    id: 'de-wind',
    name: 'Desert Wind',
    icon: '🌬️',
    category: 'nature',
    description: 'Low whistling desert wind',
    defaultVolume: 0.5,
    filePath: '/sounds/wind-blowing.mp3',
    loop: true,
  },
  {
    id: 'de-crackle',
    name: 'Log Crackle',
    icon: '🪵',
    category: 'nature',
    description: 'Embers popping and shifting in the fire',
    defaultVolume: 0.45,
    filePath: '__procedural__',
    loop: true,
  },
  {
    id: 'de-owl',
    name: 'Desert Owl',
    icon: '🦉',
    category: 'nature',
    description: 'Distant owl hoots in the cool night',
    defaultVolume: 0.3,
    filePath: '__procedural__',
    loop: true,
  },
  {
    id: 'de-lantern',
    name: 'Camp Lantern',
    icon: '🏮',
    category: 'activity',
    description: 'Creaking glass camp lantern swinging',
    defaultVolume: 0.3,
    filePath: '/sounds/wind-chimes-bells.mp3',
    loop: true,
  },
  {
    id: 'de-star',
    name: 'Shooting Star',
    icon: '⭐',
    category: 'activity',
    description: 'Mystical celestial shimmer sound',
    defaultVolume: 0.4,
    filePath: '__procedural__',
    loop: true,
  },
];

interface DesertStore {
  sounds: Record<string, DesertSoundState>;
  masterVolume: number;
  isMuted: boolean;
  isPanelOpen: boolean;

  toggleSound: (id: string) => void;
  setSoundVolume: (id: string, volume: number) => void;
  setMasterVolume: (volume: number) => void;
  toggleMute: () => void;
  clearAll: () => void;
  togglePanel: () => void;
}

const initialDesertSounds: Record<string, DesertSoundState> = {};
DESERT_SOUND_CONFIGS.forEach((config) => {
  initialDesertSounds[config.id] = {
    isActive: false,
    volume: config.defaultVolume,
  };
});

export const useDesertStore = create<DesertStore>()(
  persist(
    (set, get) => ({
      sounds: initialDesertSounds,
      masterVolume: 0.7,
      isMuted: false,
      isPanelOpen: true,

      toggleSound: (id: string) =>
        set((state) => ({
          sounds: {
            ...state.sounds,
            [id]: {
              ...state.sounds[id],
              isActive: !state.sounds[id]?.isActive,
            },
          },
        })),

      setSoundVolume: (id: string, volume: number) =>
        set((state) => ({
          sounds: {
            ...state.sounds,
            [id]: {
              ...state.sounds[id],
              volume: Math.max(0, Math.min(1, volume)),
            },
          },
        })),

      setMasterVolume: (volume: number) =>
        set({ masterVolume: Math.max(0, Math.min(1, volume)) }),

      toggleMute: () =>
        set((state) => ({ isMuted: !state.isMuted })),

      clearAll: () => {
        const newSounds = { ...get().sounds };
        Object.keys(newSounds).forEach((key) => {
          newSounds[key] = { ...newSounds[key], isActive: false };
        });
        set({ sounds: newSounds });
      },

      togglePanel: () =>
        set((state) => ({ isPanelOpen: !state.isPanelOpen })),
    }),
    {
      name: 'desert-campfire-store',
      partialize: (state) => ({
        sounds: state.sounds,
        masterVolume: state.masterVolume,
      }),
    }
  )
);
