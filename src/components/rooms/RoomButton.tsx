'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRoomStore } from '@/store/room-store';

export default function RoomButton() {
  const isLobbyOpen = useRoomStore((s) => s.isLobbyOpen);
  const setLobbyOpen = useRoomStore((s) => s.setLobbyOpen);
  const currentRoom = useRoomStore((s) => s.currentRoom);
  const localUser = useRoomStore((s) => s.localUser);
  const setUserSetupOpen = useRoomStore((s) => s.setUserSetupOpen);

  const handleClick = () => {
    if (!localUser) {
      // Prompt user setup first, then open lobby after
      setUserSetupOpen(true);
    } else {
      setLobbyOpen(!isLobbyOpen);
    }
  };

  return (
    <motion.button
      id="room-lobby-btn"
      className={`fixed top-6 right-16 z-[50] flex items-center gap-2 px-4 py-2.5 rounded-xl
        backdrop-blur-xl border shadow-lg transition-all cursor-pointer select-none
        ${currentRoom
          ? 'bg-green-500/12 border-green-400/25 hover:bg-green-500/18 hover:border-green-400/35'
          : 'bg-black/50 border-white/10 hover:bg-black/60 hover:border-white/15'
        }`}
      onClick={handleClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      aria-label={currentRoom ? `In room: ${currentRoom.name}` : 'Open study rooms'}
    >
      {currentRoom ? (
        <>
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
          <span className="text-xs font-zurich font-semibold tracking-wider text-white/80 truncate max-w-[120px]">
            {currentRoom.name}
          </span>
          <span className="text-[10px] text-white/40 font-zurich-cond flex-shrink-0">
            {currentRoom.users?.length ?? 0}
          </span>
        </>
      ) : (
        <>
          <span className="text-base">🚪</span>
          <span className="text-xs font-zurich font-semibold tracking-wider text-white/70">Rooms</span>
        </>
      )}
    </motion.button>
  );
}
