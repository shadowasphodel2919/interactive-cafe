'use client';

import CafeScene from '@/components/scene/CafeScene';
import ControlPanel from '@/components/ui/ControlPanel';
import { useAudioManager } from '@/hooks/useAudioManager';

export default function Home() {
  // Initialize the audio manager to sync store state with Web Audio API
  useAudioManager();

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#0a0a0f] noise-overlay">
      <CafeScene />
      <ControlPanel />
    </main>
  );
}

