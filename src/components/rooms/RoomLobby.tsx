'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoomStore } from '@/store/room-store';
import { getSocket } from '@/lib/socket';
import RoomCard from './RoomCard';
import CreateRoomModal from './CreateRoomModal';
import type { SceneMode } from '@server/types';

export default function RoomLobby() {
  const isLobbyOpen = useRoomStore((s) => s.isLobbyOpen);
  const setLobbyOpen = useRoomStore((s) => s.setLobbyOpen);
  const rooms = useRoomStore((s) => s.rooms);
  const currentRoom = useRoomStore((s) => s.currentRoom);
  const isConnected = useRoomStore((s) => s.isConnected);
  const localUser = useRoomStore((s) => s.localUser);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');

  const refreshRooms = useCallback(() => { getSocket().emit('room:list'); }, []);

  const joinRoom = useCallback((roomId: string, inviteCode?: string) => {
    const { localUser } = useRoomStore.getState();
    if (!localUser) return;
    getSocket().emit('room:join', {
      roomId, inviteCode,
      user: { name: localUser.name, emoji: localUser.emoji, status: localUser.status, studyTopic: localUser.studyTopic },
    });
  }, []);

  const createRoom = useCallback((data: { name: string; scene: SceneMode; isPrivate: boolean; inviteCode?: string }) => {
    const { localUser } = useRoomStore.getState();
    if (!localUser) return;
    getSocket().emit('room:create', {
      ...data,
      user: { name: localUser.name, emoji: localUser.emoji, status: localUser.status, studyTopic: localUser.studyTopic },
    });
  }, []);

  // Refresh list when lobby opens
  useEffect(() => {
    if (isLobbyOpen && isConnected) refreshRooms();
  }, [isLobbyOpen, isConnected, refreshRooms]);

  const filtered = rooms.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleJoin = (roomId: string, inviteCode?: string) => {
    joinRoom(roomId, inviteCode);
    setLobbyOpen(false);
  };

  const handleCreate = (data: { name: string; scene: SceneMode; isPrivate: boolean; inviteCode?: string }) => {
    createRoom(data);
    setLobbyOpen(false);
  };

  return (
    <>
      <AnimatePresence>
        {isLobbyOpen && (
          <motion.div
            className="fixed inset-0 z-[150] flex"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/75 backdrop-blur-md"
              onClick={() => setLobbyOpen(false)}
            />

            {/* Panel */}
            <motion.div
              className="relative z-10 ml-auto h-full w-full max-w-lg flex flex-col border-l border-white/8 shadow-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, rgba(14,14,22,0.98) 0%, rgba(10,10,16,0.99) 100%)',
              }}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 240 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/6 flex-shrink-0">
                <div>
                  <h1 className="text-base font-bold text-white font-zurich tracking-wider">Study Rooms</h1>
                  <p className="text-[11px] text-white/35 mt-0.5">
                    {isConnected
                      ? `${rooms.length} room${rooms.length !== 1 ? 's' : ''} active`
                      : '⚡ Connecting…'
                    }
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={() => setShowCreate(true)}
                    disabled={!localUser}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/15
                      text-xs font-semibold text-white hover:bg-white/15 hover:border-white/25
                      transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    + Create
                  </motion.button>
                  <button
                    onClick={() => setLobbyOpen(false)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white/40
                      hover:text-white hover:bg-white/8 transition-all cursor-pointer text-sm"
                  >✕</button>
                </div>
              </div>

              {/* Search */}
              <div className="px-6 py-4 border-b border-white/4 flex-shrink-0">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search rooms…"
                  className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-2.5
                    text-sm text-white placeholder-white/25 outline-none focus:border-white/20 transition-all"
                />
              </div>

              {/* Room list */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3 scrollbar-thin">
                <AnimatePresence mode="popLayout">
                  {!isConnected ? (
                    <motion.div
                      key="connecting"
                      className="flex flex-col items-center justify-center py-20 text-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white/60 animate-spin mb-4" />
                      <p className="text-sm text-white/40">Connecting to server…</p>
                      <p className="text-xs text-white/20 mt-1">Make sure npm run dev:all is running</p>
                    </motion.div>
                  ) : filtered.length === 0 ? (
                    <motion.div
                      key="empty"
                      className="flex flex-col items-center justify-center py-20 text-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <span className="text-5xl mb-4">☕</span>
                      <p className="text-sm text-white/50 font-zurich tracking-wide">No rooms yet</p>
                      <p className="text-xs text-white/25 mt-1 mb-6">Be the first to create one!</p>
                      <motion.button
                        onClick={() => setShowCreate(true)}
                        disabled={!localUser}
                        className="px-6 py-2.5 rounded-xl bg-white/10 border border-white/15
                          text-xs font-semibold text-white hover:bg-white/15 transition-all cursor-pointer
                          disabled:opacity-40 disabled:cursor-not-allowed"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        + Create a Room
                      </motion.button>
                    </motion.div>
                  ) : (
                    filtered.map((room) => (
                      <motion.div
                        key={room.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 260 }}
                      >
                        <RoomCard
                          room={room}
                          onJoin={handleJoin}
                          isCurrentRoom={currentRoom?.id === room.id}
                        />
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="px-6 py-3 border-t border-white/5 flex-shrink-0">
                <p className="text-[9px] text-white/20 text-center tracking-wider">
                  Rooms are ephemeral — they disappear when everyone leaves
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CreateRoomModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
      />
    </>
  );
}
