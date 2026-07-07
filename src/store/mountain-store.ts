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
    id: 'mt-espresso',
    name: 'Espresso Machine',
    icon: '☕',
    category: 'coffee',
    description: 'Rich espresso extraction hiss',
    defaultVolume: 0.6,
    filePath: '__procedural__',
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
    id: 'mt-barista',
    name: 'Barista',
    icon: '👨‍🍳',
    category: 'coffee',
    description: 'Cups clinking, steaming milk',
    defaultVolume: 0.5,
    filePath: '__procedural__',
    loop: true,
  },
  {
    id: 'mt-ice',
    name: 'Ice Cubes',
    icon: '🧊',
    category: 'coffee',
    description: 'Ice cubes clinking in a cold glass',
    defaultVolume: 0.35,
    filePath: '/sounds/ice-in-a-glass.mp3',
    loop: true,
  },

  // 💬 People & Activity
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
  {
    id: 'mt-conversation',
    name: 'Quiet Talking',
    icon: '💬',
    category: 'people',
    description: 'Soft conversations around you',
    defaultVolume: 0.4,
    filePath: '/sounds/conversation.mp3',
    loop: true,
  },
  {
    id: 'mt-vinyl',
    name: 'Vinyl Record',
    icon: '🎵',
    category: 'people',
    description: 'Warm vinyl crackle and music',
    defaultVolume: 0.3,
    filePath: '__procedural__',
    loop: true,
  },
  {
    id: 'mt-fan',
    name: 'Ceiling Fan',
    icon: '🌀',
    category: 'people',
    description: 'Slow whooshing overhead',
    defaultVolume: 0.2,
    filePath: '__procedural__',
    loop: true,
  },

  // 🌿 Nature & Atmosphere
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
  {
    id: 'mt-wind',
    name: 'Wind Blowing',
    icon: '🌬️',
    category: 'nature',
    description: 'Cool breeze through the peaks',
    defaultVolume: 0.5,
    filePath: '/sounds/wind-blowing.mp3',
    loop: true,
  },
  {
    id: 'mt-bell',
    name: 'Distant Bell',
    icon: '🔔',
    category: 'nature',
    description: 'A distant bell echoing through the valley',
    defaultVolume: 0.3,
    filePath: '/sounds/oven-timer-ding.mp3',
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
      version: 2,
      migrate: (persistedState: any) => persistedState,
      partialize: (state) => ({
        sounds: state.sounds,
        masterVolume: state.masterVolume,
        isWindowOpen: state.isWindowOpen,
      }),
      merge: (persisted: any, current: MountainStore): MountainStore => {
        if (!persisted) return current;

        // Build a sounds object that uses current config as the baseline,
        // then overlays any persisted values for IDs that still exist.
        const validIds = new Set(MOUNTAIN_SOUND_CONFIGS.map((c) => c.id));
        const mergedSounds: Record<string, MountainSoundState> = { ...initialMountainSounds };

        if (persisted.sounds) {
          for (const id of Object.keys(persisted.sounds)) {
            if (validIds.has(id)) {
              mergedSounds[id] = persisted.sounds[id];
            }
          }
        }

        return {
          ...current,
          sounds: mergedSounds,
          masterVolume: persisted.masterVolume ?? current.masterVolume,
          isWindowOpen: persisted.isWindowOpen ?? current.isWindowOpen,
        };
      },
    }
  )
);
