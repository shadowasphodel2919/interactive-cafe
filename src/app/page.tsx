'use client';

import { useEffect, useRef } from 'react';

import CafeScene from '@/components/scene/CafeScene';
import MountainScene from '@/components/scene/MountainScene';
import TrainScene from '@/components/scene/TrainScene';
import LibraryScene from '@/components/scene/LibraryScene';
import CyberpunkScene from '@/components/scene/CyberpunkScene';
import DesertScene from '@/components/scene/DesertScene';

import UnifiedControlPanel from '@/components/ui/UnifiedControlPanel';
import ModeSelector from '@/components/ui/ModeSelector';
import PomodoroClock from '@/components/ui/PomodoroClock';

// Rooms
import RoomButton from '@/components/rooms/RoomButton';
import RoomLobby from '@/components/rooms/RoomLobby';
import RoomPresencePanel from '@/components/rooms/RoomPresencePanel';
import RoomChat from '@/components/rooms/RoomChat';
import UserSetup from '@/components/rooms/UserSetup';

import { useAudioManager } from '@/hooks/useAudioManager';
import { useMountainAudio } from '@/hooks/useMountainAudio';
import { useTrainAudio } from '@/hooks/useTrainAudio';
import { useLibraryAudio } from '@/hooks/useLibraryAudio';
import { useCyberpunkAudio } from '@/hooks/useCyberpunkAudio';
import { useDesertAudio } from '@/hooks/useDesertAudio';
import { useRoom } from '@/hooks/useRoom';

import { useCafeStore } from '@/store/cafe-store';
import { useMountainStore } from '@/store/mountain-store';
import { useTrainStore } from '@/store/train-store';
import { useLibraryStore } from '@/store/library-store';
import { useCyberpunkStore } from '@/store/cyberpunk-store';
import { useDesertStore } from '@/store/desert-store';
import { useRoomStore } from '@/store/room-store';

export default function Home() {
  const currentMode = useCafeStore((s) => s.currentMode);

  // Reset all active sounds when switching modes
  const prevModeRef = useRef(currentMode);

  useEffect(() => {
    if (prevModeRef.current !== currentMode) {
      useCafeStore.getState().clearAll();
      useMountainStore.getState().clearAll();
      useTrainStore.getState().clearAll();
      useLibraryStore.getState().clearAll();
      useCyberpunkStore.getState().clearAll();
      useDesertStore.getState().clearAll();
      prevModeRef.current = currentMode;
    }
  }, [currentMode]);

  // Initialize all audio managers — they only play when their respective sounds are active
  useAudioManager();
  useMountainAudio();
  useTrainAudio();
  useLibraryAudio();
  useCyberpunkAudio();
  useDesertAudio();

  // Initialize rooms (socket connection + listeners)
  useRoom();

  // After user setup, auto-open lobby
  const { setLobbyOpen, setUserSetupOpen } = useRoomStore();
  const handleSetupComplete = () => setLobbyOpen(true);

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

      {/* Existing UI */}
      <UnifiedControlPanel />
      <ModeSelector />
      <PomodoroClock />

      {/* Rooms UI */}
      <RoomButton />
      <RoomPresencePanel />
      <RoomChat />
      <RoomLobby />
      <UserSetup onComplete={handleSetupComplete} />
    </main>
  );
}
