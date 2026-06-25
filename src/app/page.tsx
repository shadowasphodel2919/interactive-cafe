'use client';

import CafeScene from '@/components/scene/CafeScene';
import MountainScene from '@/components/scene/MountainScene';
import TrainScene from '@/components/scene/TrainScene';
import LibraryScene from '@/components/scene/LibraryScene';
import CyberpunkScene from '@/components/scene/CyberpunkScene';
import DesertScene from '@/components/scene/DesertScene';

import UnifiedControlPanel from '@/components/ui/UnifiedControlPanel';
import ModeSelector from '@/components/ui/ModeSelector';

import { useAudioManager } from '@/hooks/useAudioManager';
import { useMountainAudio } from '@/hooks/useMountainAudio';
import { useTrainAudio } from '@/hooks/useTrainAudio';
import { useLibraryAudio } from '@/hooks/useLibraryAudio';
import { useCyberpunkAudio } from '@/hooks/useCyberpunkAudio';
import { useDesertAudio } from '@/hooks/useDesertAudio';

import { useCafeStore } from '@/store/cafe-store';

export default function Home() {
  const currentMode = useCafeStore((s) => s.currentMode);

  // Initialize all audio managers — they only play when their respective sounds are active
  useAudioManager();
  useMountainAudio();
  useTrainAudio();
  useLibraryAudio();
  useCyberpunkAudio();
  useDesertAudio();

  const renderSceneContent = () => {
    switch (currentMode) {
      case 'city':
        return <CafeScene />;
      case 'mountain':
        return <MountainScene />;
      case 'train':
        return <TrainScene />;
      case 'library':
        return <LibraryScene />;
      case 'cyberpunk':
        return <CyberpunkScene />;
      case 'desert':
        return <DesertScene />;
      default:
        return <CafeScene />;
    }
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#0a0a0f] noise-overlay">
      {renderSceneContent()}
      <UnifiedControlPanel />
      <ModeSelector />
    </main>
  );
}
