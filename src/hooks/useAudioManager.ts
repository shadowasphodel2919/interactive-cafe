'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useCafeStore } from '@/store/cafe-store';
import type { AudioEngine } from '@/lib/audio-engine';

/**
 * Hook that bridges the Zustand store to the Web Audio API engine.
 * Watches for state changes and starts/stops/adjusts sounds accordingly.
 */
export function useAudioManager() {
  const engineRef = useRef<AudioEngine | null>(null);
  const initializedRef = useRef(false);
  const prevSoundsRef = useRef<Record<string, { isActive: boolean; volume: number }>>({});

  const sounds = useCafeStore((s) => s.sounds);
  const masterVolume = useCafeStore((s) => s.masterVolume);
  const isMuted = useCafeStore((s) => s.isMuted);

  // Initialize audio engine on first user interaction
  const initEngine = useCallback(async () => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    try {
      const { AudioEngine: AudioEngineClass } = await import('@/lib/audio-engine');
      const { SOUND_GENERATORS } = await import('@/lib/sound-generators');
      const engine = new AudioEngineClass();
      
      // Register all sound generators
      Object.entries(SOUND_GENERATORS).forEach(([id, generator]) => {
        engine.register(id, generator);
      });

      await engine.ensureResumed();
      engineRef.current = engine;

      // Apply current state
      const currentSounds = useCafeStore.getState().sounds;
      const currentMaster = useCafeStore.getState().masterVolume;
      engine.setMasterVolume(currentMaster);

      Object.entries(currentSounds).forEach(([id, state]) => {
        engine.setVolume(id, state.volume);
        if (state.isActive) {
          engine.play(id);
        }
      });
    } catch (err) {
      console.error('Failed to initialize audio engine:', err);
      initializedRef.current = false;
    }
  }, []);

  // Listen for first user interaction to init audio
  useEffect(() => {
    const events = ['click', 'touchstart', 'keydown'];
    const handler = () => {
      initEngine();
      events.forEach((e) => document.removeEventListener(e, handler));
    };
    events.forEach((e) => document.addEventListener(e, handler, { once: true }));
    return () => {
      events.forEach((e) => document.removeEventListener(e, handler));
    };
  }, [initEngine]);

  // Sync sound changes
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    const prevSounds = prevSoundsRef.current;

    Object.entries(sounds).forEach(([id, state]) => {
      const prev = prevSounds[id];

      if (!prev && state.isActive) {
        // New active sound
        engine.setVolume(id, state.volume);
        engine.play(id);
      } else if (prev && !state.isActive && prev.isActive) {
        // Sound deactivated
        engine.stop(id);
      } else if (!prev?.isActive && state.isActive) {
        // Sound activated
        engine.setVolume(id, state.volume);
        engine.play(id);
      } else if (state.isActive && prev && prev.volume !== state.volume) {
        // Volume changed
        engine.setVolume(id, state.volume);
      }
    });

    // Store previous state
    prevSoundsRef.current = Object.fromEntries(
      Object.entries(sounds).map(([id, s]) => [id, { isActive: s.isActive, volume: s.volume }])
    );
  }, [sounds]);

  // Sync master volume
  useEffect(() => {
    engineRef.current?.setMasterVolume(isMuted ? 0 : masterVolume);
  }, [masterVolume, isMuted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      engineRef.current?.dispose();
    };
  }, []);
}
