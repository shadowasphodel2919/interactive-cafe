'use client';

import { useEffect, useRef } from 'react';
import { useTrainStore, TRAIN_SOUND_CONFIGS } from '@/store/train-store';
import type { SoundGeneratorResult } from '@/lib/sound-generators';

interface ProceduralChannel {
  ctx: AudioContext;
  result: SoundGeneratorResult;
  gainNode: GainNode;
}

/**
 * Hybrid audio hook for Train Station.
 * Sounds with filePath '__procedural__' use Web Audio generators;
 * all others use HTMLAudioElement.
 */
export function useTrainAudio() {
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const proceduralRefs = useRef<Record<string, ProceduralChannel>>({});
  const fileInitedRef = useRef(false);

  const sounds = useTrainStore((s) => s.sounds);
  const masterVolume = useTrainStore((s) => s.masterVolume);
  const isMuted = useTrainStore((s) => s.isMuted);

  // Initialize file-based audio elements on first user interaction
  useEffect(() => {
    if (fileInitedRef.current) return;

    const initFileAudio = () => {
      if (fileInitedRef.current) return;
      fileInitedRef.current = true;

      TRAIN_SOUND_CONFIGS.forEach((config) => {
        if (config.filePath !== '__procedural__' && !audioRefs.current[config.id]) {
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
      initFileAudio();
      events.forEach((e) => document.removeEventListener(e, handler));
    };
    events.forEach((e) => document.addEventListener(e, handler, { once: true }));

    return () => {
      events.forEach((e) => document.removeEventListener(e, handler));
    };
  }, []);

  // Sync all sound states (both file-based and procedural)
  useEffect(() => {
    const syncSounds = async () => {
      const { SOUND_GENERATORS } = await import('@/lib/sound-generators');

      Object.entries(sounds).forEach(([id, state]) => {
        const effectiveVolume = isMuted ? 0 : state.volume * masterVolume;
        const audio = audioRefs.current[id];
        const generator = SOUND_GENERATORS[id];

        if (audio) {
          // ─── File-based sound ───
          if (state.isActive) {
            audio.volume = effectiveVolume;
            if (audio.paused) {
              audio.play().catch(() => {});
            }
          } else {
            if (!audio.paused) {
              audio.volume = 0;
              setTimeout(() => {
                audio.pause();
                audio.currentTime = 0;
              }, 100);
            }
          }
        } else if (generator) {
          // ─── Procedural sound ───
          const channel = proceduralRefs.current[id];

          if (state.isActive) {
            if (!channel) {
              const ctx = new AudioContext();
              const gainNode = ctx.createGain();
              gainNode.gain.value = effectiveVolume;
              gainNode.connect(ctx.destination);
              const result = generator(ctx);
              result.node.connect(gainNode);
              proceduralRefs.current[id] = { ctx, result, gainNode };
            } else {
              channel.gainNode.gain.setTargetAtTime(
                effectiveVolume, channel.ctx.currentTime, 0.1
              );
            }
          } else if (channel) {
            channel.result.cleanup();
            try { channel.result.node.disconnect(); } catch { /* ok */ }
            channel.gainNode.disconnect();
            channel.ctx.close().catch(() => {});
            delete proceduralRefs.current[id];
          }
        }
      });
    };

    syncSounds();
  }, [sounds, masterVolume, isMuted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach((audio) => {
        audio.pause();
        audio.src = '';
      });
      audioRefs.current = {};

      Object.values(proceduralRefs.current).forEach((channel) => {
        channel.result.cleanup();
        try { channel.result.node.disconnect(); } catch { /* ok */ }
        channel.gainNode.disconnect();
        channel.ctx.close().catch(() => {});
      });
      proceduralRefs.current = {};
      fileInitedRef.current = false;
    };
  }, []);
}
