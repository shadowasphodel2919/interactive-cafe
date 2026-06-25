'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TrainSoundConfig {
  id: string;
  name: string;
  icon: string;
  category: 'nature' | 'people' | 'activity';
  description: string;
  defaultVolume: number;
  filePath: string;
  loop: boolean;
}

export interface TrainSoundState {
  isActive: boolean;
  volume: number;
}

export const TRAIN_SOUND_CONFIGS: TrainSoundConfig[] = [
  {
    id: 'tr-rain',
    name: 'Rain on Roof',
    icon: '🌧️',
    category: 'nature',
    description: 'Gentle rain on the platform roof',
    defaultVolume: 0.6,
    filePath: '/sounds/relaxing-rain.mp3',
    loop: true,
  },
  {
    id: 'tr-train',
    name: 'Distant Train',
    icon: '🚃',
    category: 'activity',
    description: 'Rushing sound of a passing train',
    defaultVolume: 0.5,
    filePath: '__procedural__',
    loop: true,
  },
  {
    id: 'tr-chimes',
    name: 'Wind Chimes',
    icon: '🎐',
    category: 'nature',
    description: 'Japanese furin bell bells',
    defaultVolume: 0.4,
    filePath: '/sounds/wind-chimes-bells.mp3',
    loop: true,
  },
  {
    id: 'tr-lantern',
    name: 'Paper Lantern',
    icon: '🏮',
    category: 'nature',
    description: 'Creaking lantern in the wind',
    defaultVolume: 0.3,
    filePath: '/sounds/wind-blowing.mp3',
    loop: true,
  },
  {
    id: 'tr-vending',
    name: 'Vending Machine',
    icon: '🧃',
    category: 'activity',
    description: 'Glowing vending machine hum',
    defaultVolume: 0.4,
    filePath: '/sounds/steam-bubbler.mp3',
    loop: true,
  },
  {
    id: 'tr-leaves',
    name: 'Cherry Blossoms',
    icon: '🌸',
    category: 'nature',
    description: 'Wind blowing through blossom trees',
    defaultVolume: 0.3,
    filePath: '/sounds/wind-blowing.mp3',
    loop: true,
  },
  {
    id: 'tr-traveller',
    name: 'Traveller',
    icon: '👤',
    category: 'people',
    description: 'Quiet movements of a waiting traveler',
    defaultVolume: 0.35,
    filePath: '/sounds/turning-pages.mp3',
    loop: true,
  },
  {
    id: 'tr-birds',
    name: 'Sparrows',
    icon: '🐦',
    category: 'nature',
    description: 'Birds chirping on the power lines',
    defaultVolume: 0.3,
    filePath: '__procedural__',
    loop: true,
  },
  {
    id: 'tr-announcement',
    name: 'PA Announcement',
    icon: '📢',
    category: 'people',
    description: 'Muffled station PA announcements',
    defaultVolume: 0.4,
    filePath: '/sounds/conversation.mp3',
    loop: true,
  },
  {
    id: 'tr-crickets',
    name: 'Evening Crickets',
    icon: '🦗',
    category: 'nature',
    description: 'Crickets chirping near the tracks',
    defaultVolume: 0.35,
    filePath: '__procedural__',
    loop: true,
  },
];

interface TrainStore {
  sounds: Record<string, TrainSoundState>;
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

const initialTrainSounds: Record<string, TrainSoundState> = {};
TRAIN_SOUND_CONFIGS.forEach((config) => {
  initialTrainSounds[config.id] = {
    isActive: false,
    volume: config.defaultVolume,
  };
});

export const useTrainStore = create<TrainStore>()(
  persist(
    (set, get) => ({
      sounds: initialTrainSounds,
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
      name: 'train-station-store',
      partialize: (state) => ({
        sounds: state.sounds,
        masterVolume: state.masterVolume,
      }),
    }
  )
);
