'use client';

import { useEffect, useRef } from 'react';
import { useMountainStore, MOUNTAIN_SOUND_CONFIGS } from '@/store/mountain-store';

/**
 * Hook that manages HTML5 Audio elements for the Mountain Cafe mode.
 * Watches the mountain store and creates/controls audio elements accordingly.
 */
export function useMountainAudio() {
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const initializedRef = useRef(false);

  const sounds = useMountainStore((s) => s.sounds);
  const masterVolume = useMountainStore((s) => s.masterVolume);
  const isMuted = useMountainStore((s) => s.isMuted);

  // Initialize audio elements on first user interaction
  useEffect(() => {
    if (initializedRef.current) return;

    const initAudio = () => {
      if (initializedRef.current) return;
      initializedRef.current = true;

      MOUNTAIN_SOUND_CONFIGS.forEach((config) => {
        if (!audioRefs.current[config.id]) {
          const audio = new Audio(config.filePath);
          audio.loop = config.loop;
          audio.preload = 'auto';
          audio.volume = 0;
          audioRefs.current[config.id] = audio;
        }
      });
    };

    const events = ['click', 'touchstart', 'keydown'] as const;
    const handler = () => {
      initAudio();
      events.forEach((e) => document.removeEventListener(e, handler));
    };
    events.forEach((e) => document.addEventListener(e, handler, { once: true }));

    return () => {
      events.forEach((e) => document.removeEventListener(e, handler));
    };
  }, []);

  // Sync sound states
  useEffect(() => {
    if (!initializedRef.current) return;

    Object.entries(sounds).forEach(([id, state]) => {
      const audio = audioRefs.current[id];
      if (!audio) return;

      const effectiveVolume = isMuted ? 0 : state.volume * masterVolume;

      if (state.isActive) {
        audio.volume = effectiveVolume;
        if (audio.paused) {
          audio.play().catch(() => {
            // Auto-play might be blocked; will resume on next user gesture
          });
        }
      } else {
        if (!audio.paused) {
          // Fade out briefly then pause
          audio.volume = 0;
          setTimeout(() => {
            audio.pause();
            audio.currentTime = 0;
          }, 100);
        }
      }
    });
  }, [sounds, masterVolume, isMuted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach((audio) => {
        audio.pause();
        audio.src = '';
      });
      audioRefs.current = {};
      initializedRef.current = false;
    };
  }, []);
}
