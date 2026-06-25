'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MOUNTAIN_PATHS } from '@/lib/sound-paths';

export interface MountainSoundConfig {
  id: string;
  name: string;
  icon: string;
  category: 'coffee' | 'nature' | 'people';
  description: string;
  defaultVolume: number;
  filePath: string;
  loop: boolean;
}

export interface MountainSoundState {
  isActive: boolean;
  volume: number;
}

export const MOUNTAIN_SOUND_CONFIGS: MountainSoundConfig[] = [
  // ☕ Coffee & Kitchen
  {
    id: 'mt-coffee-pour',
    name: 'Coffee Pouring',
    icon: '☕',
    category: 'coffee',
    description: 'Fresh coffee pouring into a cup',
    defaultVolume: 0.5,
    filePath: '/sounds/coffee-pouring-into-a-cup.mp3',
    loop: true,
  },
  {
    id: 'mt-grinder',
    name: 'Coffee Grinder',
    icon: '⚙️',
    category: 'coffee',
    description: 'Grinding fresh mountain beans',
    defaultVolume: 0.4,
    filePath: '/sounds/grinding-coffee-beans.mp3',
    loop: true,
  },
  {
    id: 'mt-cooking',
    name: 'Kitchen Sizzle',
    icon: '🍳',
    category: 'coffee',
    description: 'Frying and sizzling from the kitchen',
    defaultVolume: 0.3,
    filePath: '/sounds/cooking-frying-sizzling-food-free-kitchen.mp3',
    loop: true,
  },
  {
    id: 'mt-steam',
    name: 'Steam Bubbler',
    icon: '♨️',
    category: 'coffee',
    description: 'Hot steam from the espresso machine',
    defaultVolume: 0.4,
    filePath: '/sounds/steam-bubbler.mp3',
    loop: true,
  },
  {
    id: 'mt-shake',
    name: 'Cocktail Shake',
    icon: '🍹',
    category: 'coffee',
    description: 'Shaking a fresh drink',
    defaultVolume: 0.35,
    filePath: '/sounds/shake.mp3',
    loop: true,
  },
  {
    id: 'mt-oven',
    name: 'Oven Timer',
    icon: '🔔',
    category: 'coffee',
    description: 'Oven timer ding from the bakery',
    defaultVolume: 0.3,
    filePath: '/sounds/oven-timer-ding.mp3',
    loop: true,
  },
  {
    id: 'mt-ice',
    name: 'Ice Clinking',
    icon: '🧊',
    category: 'coffee',
    description: 'Ice cubes in a cold glass',
    defaultVolume: 0.35,
    filePath: '/sounds/ice-in-a-glass.mp3',
    loop: true,
  },

  // 🌿 Nature & Wind
  {
    id: 'mt-rain',
    name: 'Mountain Rain',
    icon: '🌧️',
    category: 'nature',
    description: 'Gentle rain against the window',
    defaultVolume: 0.6,
    filePath: '/sounds/relaxing-rain.mp3',
    loop: true,
  },
  {
    id: 'mt-wind',
    name: 'Mountain Wind',
    icon: '🌬️',
    category: 'nature',
    description: 'Cool breeze through the peaks',
    defaultVolume: 0.5,
    filePath: '/sounds/wind-blowing.mp3',
    loop: true,
  },
  {
    id: 'mt-chimes',
    name: 'Wind Chimes',
    icon: '🎐',
    category: 'nature',
    description: 'Gentle chimes on the porch',
    defaultVolume: 0.4,
    filePath: '/sounds/wind-chimes-bells.mp3',
    loop: true,
  },

  // 💬 People & Activity
  {
    id: 'mt-conversation',
    name: 'Quiet Chatter',
    icon: '💬',
    category: 'people',
    description: 'Soft conversations around you',
    defaultVolume: 0.4,
    filePath: '/sounds/conversation.mp3',
    loop: true,
  },
  {
    id: 'mt-keyboard',
    name: 'Keyboard Typing',
    icon: '⌨️',
    category: 'people',
    description: 'Someone working on their laptop',
    defaultVolume: 0.3,
    filePath: '/sounds/keyboard-typing.mp3',
    loop: true,
  },
  {
    id: 'mt-typing',
    name: 'Mechanical Keys',
    icon: '💻',
    category: 'people',
    description: 'Rhythmic mechanical keyboard',
    defaultVolume: 0.25,
    filePath: '/sounds/computer-keyboard-typing.mp3',
    loop: true,
  },
  {
    id: 'mt-pages',
    name: 'Turning Pages',
    icon: '📖',
    category: 'people',
    description: 'Someone reading by the window',
    defaultVolume: 0.3,
    filePath: '/sounds/turning-pages.mp3',
    loop: true,
  },
];

interface MountainStore {
  sounds: Record<string, MountainSoundState>;
  masterVolume: number;
  isMuted: boolean;
  isPanelOpen: boolean;
  isWindowOpen: boolean;

  toggleSound: (id: string) => void;
  setSoundVolume: (id: string, volume: number) => void;
  setMasterVolume: (volume: number) => void;
  toggleMute: () => void;
  clearAll: () => void;
  togglePanel: () => void;
  toggleWindow: () => void;
}

const initialMountainSounds: Record<string, MountainSoundState> = {};
MOUNTAIN_SOUND_CONFIGS.forEach((config) => {
  initialMountainSounds[config.id] = {
    isActive: false,
    volume: config.defaultVolume,
  };
});

export const useMountainStore = create<MountainStore>()(
  persist(
    (set, get) => ({
      sounds: initialMountainSounds,
      masterVolume: 0.7,
      isMuted: false,
      isPanelOpen: true,
      isWindowOpen: true,

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

      toggleWindow: () =>
          set((state) => ({ isWindowOpen: !state.isWindowOpen })),
    }),
    {
      name: 'mountain-cafe-store',
      partialize: (state) => ({
        sounds: state.sounds,
        masterVolume: state.masterVolume,
        isWindowOpen: state.isWindowOpen,
      }),
    }
  )
);
