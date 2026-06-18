'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SoundConfig {
  id: string;
  name: string;
  icon: string;
  category: 'left' | 'center' | 'right' | 'background' | 'hidden';
  description: string;
  defaultVolume: number;
  position: { x: number; y: number }; // percentage position in scene
}

export interface SoundState {
  isActive: boolean;
  volume: number;
}

export interface Preset {
  id: string;
  name: string;
  icon: string;
  description: string;
  sounds: Record<string, { active: boolean; volume: number }>;
}

export const SOUND_CONFIGS: SoundConfig[] = [
  // Left Area - Coffee Counter
  { id: 'espresso', name: 'Espresso Machine', icon: '☕', category: 'left', description: 'Rich espresso extraction hiss', defaultVolume: 0.6, position: { x: 14, y: 52 } },
  { id: 'grinder', name: 'Coffee Grinder', icon: '⚙️', category: 'left', description: 'Fresh beans grinding', defaultVolume: 0.4, position: { x: 8, y: 48 } },
  { id: 'barista', name: 'Barista Working', icon: '👨‍🍳', category: 'left', description: 'Cups clinking, steaming milk', defaultVolume: 0.5, position: { x: 18, y: 58 } },

  // Center Area - Seating
  { id: 'keyboard', name: 'Keyboard Typing', icon: '⌨️', category: 'center', description: 'Customer working on laptop', defaultVolume: 0.3, position: { x: 42, y: 62 } },
  { id: 'conversations', name: 'Quiet Conversations', icon: '💬', category: 'center', description: 'Gentle café murmur', defaultVolume: 0.4, position: { x: 50, y: 58 } },
  { id: 'page-turning', name: 'Turning Pages', icon: '📖', category: 'center', description: 'Someone reading a book', defaultVolume: 0.2, position: { x: 55, y: 66 } },
  { id: 'ceiling-fan', name: 'Ceiling Fan', icon: '🌀', category: 'center', description: 'Slow whooshing overhead', defaultVolume: 0.2, position: { x: 50, y: 15 } },

  // Right Area - Fireplace Lounge
  { id: 'fireplace', name: 'Fireplace', icon: '🔥', category: 'right', description: 'Crackling warm fire', defaultVolume: 0.6, position: { x: 82, y: 55 } },
  { id: 'vinyl', name: 'Vinyl Record', icon: '🎵', category: 'right', description: 'Warm vinyl crackle', defaultVolume: 0.3, position: { x: 90, y: 50 } },
  { id: 'jazz', name: 'Jazz Speaker', icon: '🎷', category: 'right', description: 'Soft jazz melodies', defaultVolume: 0.4, position: { x: 88, y: 42 } },

  // Background - Window/Atmosphere
  { id: 'rain', name: 'Rain', icon: '🌧️', category: 'background', description: 'Steady rainfall outside', defaultVolume: 0.7, position: { x: 50, y: 30 } },
  { id: 'traffic', name: 'Street Traffic', icon: '🚗', category: 'background', description: 'Distant cars passing', defaultVolume: 0.3, position: { x: 35, y: 28 } },
  { id: 'wind-chimes', name: 'Wind Chimes', icon: '🎐', category: 'background', description: 'Tinkling near the door', defaultVolume: 0.25, position: { x: 5, y: 30 } },
  { id: 'tea-kettle', name: 'Tea Kettle', icon: '🫖', category: 'background', description: 'Gentle whistling kettle', defaultVolume: 0.3, position: { x: 22, y: 46 } },

  // Hidden / Discovery Mode
  { id: 'clock', name: 'Clock Ticking', icon: '🕐', category: 'hidden', description: 'Antique wall clock', defaultVolume: 0.2, position: { x: 70, y: 20 } },
  { id: 'cat-purring', name: 'Cat Purring', icon: '🐱', category: 'hidden', description: 'Hidden cat under table', defaultVolume: 0.3, position: { x: 62, y: 78 } },
  { id: 'neon-buzz', name: 'Neon Sign', icon: '✨', category: 'hidden', description: 'Buzzing neon sign', defaultVolume: 0.15, position: { x: 25, y: 22 } },
  { id: 'ice-cubes', name: 'Ice Cubes', icon: '🧊', category: 'hidden', description: 'Clinking in a glass', defaultVolume: 0.2, position: { x: 46, y: 70 } },
  { id: 'train-horn', name: 'Distant Train', icon: '🚂', category: 'hidden', description: 'Far-away train horn', defaultVolume: 0.15, position: { x: 20, y: 12 } },
];

export const PRESETS: Preset[] = [
  {
    id: 'morning-rush',
    name: 'Morning Rush',
    icon: '🌅',
    description: 'Bustling morning energy',
    sounds: {
      grinder: { active: true, volume: 0.6 },
      conversations: { active: true, volume: 0.5 },
      espresso: { active: true, volume: 0.7 },
      barista: { active: true, volume: 0.5 },
      keyboard: { active: true, volume: 0.3 },
    },
  },
  {
    id: 'rainy-evening',
    name: 'Rainy Evening',
    icon: '🌧️',
    description: 'Perfect rainy night ambience',
    sounds: {
      rain: { active: true, volume: 0.8 },
      fireplace: { active: true, volume: 0.6 },
      jazz: { active: true, volume: 0.4 },
      vinyl: { active: true, volume: 0.2 },
      traffic: { active: true, volume: 0.15 },
    },
  },
  {
    id: 'deep-focus',
    name: 'Deep Focus',
    icon: '🎯',
    description: 'Minimal distractions',
    sounds: {
      rain: { active: true, volume: 0.6 },
      vinyl: { active: true, volume: 0.15 },
      conversations: { active: true, volume: 0.15 },
      'ceiling-fan': { active: true, volume: 0.2 },
    },
  },
  {
    id: 'late-night',
    name: 'Late Night',
    icon: '🌙',
    description: 'Quiet late-night vibes',
    sounds: {
      fireplace: { active: true, volume: 0.5 },
      traffic: { active: true, volume: 0.2 },
      jazz: { active: true, volume: 0.3 },
      clock: { active: true, volume: 0.2 },
      rain: { active: true, volume: 0.4 },
    },
  },
];

interface CafeStore {
  // Sound states
  sounds: Record<string, SoundState>;
  masterVolume: number;
  isMuted: boolean;
  activePreset: string | null;
  theme: 'dark' | 'warm';
  discoveredSounds: string[];
  isPanelOpen: boolean;
  customMixes: Record<string, Record<string, SoundState>>;

  // Actions
  toggleSound: (id: string) => void;
  setSoundVolume: (id: string, volume: number) => void;
  setMasterVolume: (volume: number) => void;
  toggleMute: () => void;
  applyPreset: (presetId: string) => void;
  clearAll: () => void;
  setTheme: (theme: 'dark' | 'warm') => void;
  discoverSound: (id: string) => void;
  togglePanel: () => void;
  saveCustomMix: (name: string) => void;
  loadCustomMix: (name: string) => void;
  deleteCustomMix: (name: string) => void;
}

const initialSounds: Record<string, SoundState> = {};
SOUND_CONFIGS.forEach((config) => {
  initialSounds[config.id] = {
    isActive: false,
    volume: config.defaultVolume,
  };
});

export const useCafeStore = create<CafeStore>()(
  persist(
    (set, get) => ({
      sounds: initialSounds,
      masterVolume: 0.7,
      isMuted: false,
      activePreset: null,
      theme: 'dark',
      discoveredSounds: [],
      isPanelOpen: false,
      customMixes: {},

      toggleSound: (id: string) =>
        set((state) => ({
          sounds: {
            ...state.sounds,
            [id]: {
              ...state.sounds[id],
              isActive: !state.sounds[id]?.isActive,
            },
          },
          activePreset: null,
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

      applyPreset: (presetId: string) => {
        const preset = PRESETS.find((p) => p.id === presetId);
        if (!preset) return;

        const newSounds = { ...get().sounds };
        // First deactivate all
        Object.keys(newSounds).forEach((key) => {
          newSounds[key] = { ...newSounds[key], isActive: false };
        });
        // Then activate preset sounds
        Object.entries(preset.sounds).forEach(([id, config]) => {
          if (newSounds[id]) {
            newSounds[id] = { isActive: config.active, volume: config.volume };
          }
        });

        set({ sounds: newSounds, activePreset: presetId });
      },

      clearAll: () => {
        const newSounds = { ...get().sounds };
        Object.keys(newSounds).forEach((key) => {
          newSounds[key] = { ...newSounds[key], isActive: false };
        });
        set({ sounds: newSounds, activePreset: null });
      },

      setTheme: (theme: 'dark' | 'warm') => set({ theme }),

      discoverSound: (id: string) =>
        set((state) => ({
          discoveredSounds: state.discoveredSounds.includes(id)
            ? state.discoveredSounds
            : [...state.discoveredSounds, id],
        })),

      togglePanel: () =>
        set((state) => ({ isPanelOpen: !state.isPanelOpen })),

      saveCustomMix: (name: string) => {
        const { sounds } = get();
        set((state) => ({
          customMixes: { ...state.customMixes, [name]: { ...sounds } },
        }));
      },

      loadCustomMix: (name: string) => {
        const mix = get().customMixes[name];
        if (mix) {
          set({ sounds: { ...mix }, activePreset: null });
        }
      },

      deleteCustomMix: (name: string) => {
        set((state) => {
          const newMixes = { ...state.customMixes };
          delete newMixes[name];
          return { customMixes: newMixes };
        });
      },
    }),
    {
      name: 'my-interactive-cafe',
      partialize: (state) => ({
        sounds: state.sounds,
        masterVolume: state.masterVolume,
        theme: state.theme,
        discoveredSounds: state.discoveredSounds,
        customMixes: state.customMixes,
      }),
    }
  )
);
