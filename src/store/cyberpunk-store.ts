'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CyberpunkSoundConfig {
  id: string;
  name: string;
  icon: string;
  category: 'nature' | 'people' | 'activity';
  description: string;
  defaultVolume: number;
  filePath: string;
  loop: boolean;
}

export interface CyberpunkSoundState {
  isActive: boolean;
  volume: number;
}

export const CYBERPUNK_SOUND_CONFIGS: CyberpunkSoundConfig[] = [
  {
    id: 'cy-rain',
    name: 'Heavy Rain',
    icon: '🌧️',
    category: 'nature',
    description: 'Pouring neon rain storm',
    defaultVolume: 0.6,
    filePath: '/sounds/relaxing-rain.mp3',
    loop: true,
  },
  {
    id: 'cy-ramen',
    name: 'Ramen Pot',
    icon: '🍜',
    category: 'activity',
    description: 'Bubbling hot broth in the cooker',
    defaultVolume: 0.5,
    filePath: '/sounds/cooking-frying-sizzling-food-free-kitchen.mp3',
    loop: true,
  },
  {
    id: 'cy-hologram',
    name: 'Holographic Ad',
    icon: '📺',
    category: 'activity',
    description: 'Glitchy electronic advertising sound',
    defaultVolume: 0.4,
    filePath: '__procedural__',
    loop: true,
  },
  {
    id: 'cy-drone',
    name: 'Drone Buzz',
    icon: '🚁',
    category: 'activity',
    description: 'Buzzing hum of a surveillance quadcopter',
    defaultVolume: 0.35,
    filePath: '__procedural__',
    loop: true,
  },
  {
    id: 'cy-neon',
    name: 'Neon Sign',
    icon: '⚡',
    category: 'activity',
    description: 'Flickering electrical neon buzz',
    defaultVolume: 0.3,
    filePath: '__procedural__',
    loop: true,
  },
  {
    id: 'cy-traffic',
    name: 'Traffic Below',
    icon: '🚗',
    category: 'nature',
    description: 'Distant hyper-city street sounds',
    defaultVolume: 0.4,
    filePath: '/sounds/wind-blowing.mp3',
    loop: true,
  },
  {
    id: 'cy-radio',
    name: 'Lo-Fi Radio',
    icon: '📻',
    category: 'people',
    description: 'Warm low-fidelity beats on the counter',
    defaultVolume: 0.5,
    filePath: '__procedural__',
    loop: true,
  },
  {
    id: 'cy-drips',
    name: 'Puddle Drips',
    icon: '💧',
    category: 'nature',
    description: 'Water dripping off a wet metal awning',
    defaultVolume: 0.35,
    filePath: '/sounds/coffee-pouring-into-a-cup.mp3',
    loop: true,
  },
  {
    id: 'cy-cat',
    name: 'Stray Cat',
    icon: '🐈',
    category: 'people',
    description: 'Mewing stray cat in the shadows',
    defaultVolume: 0.3,
    filePath: '__procedural__',
    loop: true,
  },
  {
    id: 'cy-ac',
    name: 'AC Compressor',
    icon: '🔧',
    category: 'activity',
    description: 'Steady hum of a heavy rooftop AC unit',
    defaultVolume: 0.35,
    filePath: '/sounds/steam-bubbler.mp3',
    loop: true,
  },
  {
    id: 'cy-music',
    name: 'Distant Club',
    icon: '🎸',
    category: 'people',
    description: 'Muffled bass rhythm from a club down below',
    defaultVolume: 0.4,
    filePath: '__procedural__',
    loop: true,
  },
  {
    id: 'cy-satellite',
    name: 'Satellite Static',
    icon: '📡',
    category: 'activity',
    description: 'Faint static and radio transmission clicks',
    defaultVolume: 0.3,
    filePath: '__procedural__',
    loop: true,
  },
];

interface CyberpunkStore {
  sounds: Record<string, CyberpunkSoundState>;
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

const initialCyberpunkSounds: Record<string, CyberpunkSoundState> = {};
CYBERPUNK_SOUND_CONFIGS.forEach((config) => {
  initialCyberpunkSounds[config.id] = {
    isActive: false,
    volume: config.defaultVolume,
  };
});

export const useCyberpunkStore = create<CyberpunkStore>()(
  persist(
    (set, get) => ({
      sounds: initialCyberpunkSounds,
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
      name: 'cyberpunk-store',
      partialize: (state) => ({
        sounds: state.sounds,
        masterVolume: state.masterVolume,
      }),
    }
  )
);
