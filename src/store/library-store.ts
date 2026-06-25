'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LibrarySoundConfig {
  id: string;
  name: string;
  icon: string;
  category: 'nature' | 'people' | 'activity';
  description: string;
  defaultVolume: number;
  filePath: string;
  loop: boolean;
}

export interface LibrarySoundState {
  isActive: boolean;
  volume: number;
}

export const LIBRARY_SOUND_CONFIGS: LibrarySoundConfig[] = [
  {
    id: 'lib-storm',
    name: 'Storm Window',
    icon: '⛈️',
    category: 'nature',
    description: 'Heavy rain and thunder outside',
    defaultVolume: 0.6,
    filePath: '/sounds/relaxing-rain.mp3',
    loop: true,
  },
  {
    id: 'lib-lamp',
    name: 'Banker\'s Lamp',
    icon: '💡',
    category: 'activity',
    description: 'Warm electrical hum of the lamp',
    defaultVolume: 0.4,
    filePath: '/sounds/steam-bubbler.mp3',
    loop: true,
  },
  {
    id: 'lib-book',
    name: 'Open Book',
    icon: '📖',
    category: 'people',
    description: 'Subtle sound of pages turning',
    defaultVolume: 0.3,
    filePath: '/sounds/turning-pages.mp3',
    loop: true,
  },
  {
    id: 'lib-cat',
    name: 'Sleeping Cat',
    icon: '🐱',
    category: 'nature',
    description: 'A cozy cat purring nearby',
    defaultVolume: 0.4,
    filePath: '__procedural__',
    loop: true,
  },
  {
    id: 'lib-clock',
    name: 'Grandfather Clock',
    icon: '🕰️',
    category: 'activity',
    description: 'Rhythmic mechanical ticking of a clock',
    defaultVolume: 0.35,
    filePath: '__procedural__',
    loop: true,
  },
  {
    id: 'lib-tea',
    name: 'Tea Cup',
    icon: '☕',
    category: 'people',
    description: 'Stirring a warm cup of tea',
    defaultVolume: 0.4,
    filePath: '/sounds/ice-in-a-glass.mp3',
    loop: true,
  },
  {
    id: 'lib-fireplace',
    name: 'Fireplace',
    icon: '🪵',
    category: 'nature',
    description: 'Crackling and warmth of logs burning',
    defaultVolume: 0.5,
    filePath: '__procedural__',
    loop: true,
  },
  {
    id: 'lib-pen',
    name: 'Fountain Pen',
    icon: '✒️',
    category: 'people',
    description: 'Scratching sound of writing on paper',
    defaultVolume: 0.3,
    filePath: '/sounds/keyboard-typing.mp3',
    loop: true,
  },
  {
    id: 'lib-ladder',
    name: 'Rolling Ladder',
    icon: '🪜',
    category: 'activity',
    description: 'Wooden library ladder rolling along tracks',
    defaultVolume: 0.3,
    filePath: '/sounds/wind-blowing.mp3',
    loop: true,
  },
  {
    id: 'lib-record',
    name: 'Record Player',
    icon: '🎵',
    category: 'activity',
    description: 'Crackling lo-fi record player music',
    defaultVolume: 0.4,
    filePath: '__procedural__',
    loop: true,
  },
  {
    id: 'lib-glass-rain',
    name: 'Rain on Glass',
    icon: '🌧️',
    category: 'nature',
    description: 'Rain streaking down window glass',
    defaultVolume: 0.5,
    filePath: '/sounds/relaxing-rain.mp3',
    loop: true,
  },
];

interface LibraryStore {
  sounds: Record<string, LibrarySoundState>;
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

const initialLibrarySounds: Record<string, LibrarySoundState> = {};
LIBRARY_SOUND_CONFIGS.forEach((config) => {
  initialLibrarySounds[config.id] = {
    isActive: false,
    volume: config.defaultVolume,
  };
});

export const useLibraryStore = create<LibraryStore>()(
  persist(
    (set, get) => ({
      sounds: initialLibrarySounds,
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
      name: 'cozy-library-store',
      partialize: (state) => ({
        sounds: state.sounds,
        masterVolume: state.masterVolume,
      }),
    }
  )
);
