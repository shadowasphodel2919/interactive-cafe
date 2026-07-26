'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoomStore } from '@/store/room-store';
import { getSocket } from '@/lib/socket';
import type { UserStatus } from '@server/types';

const STATUS_LABELS: Record<UserStatus, { label: string; dot: string; icon: string }> = {
  focused: { label: 'Focused', dot: 'bg-green-400', icon: '🟢' },
  break:   { label: 'On Break', dot: 'bg-yellow-400', icon: '🟡' },
  away:    { label: 'Away',    dot: 'bg-white/30',   icon: '⚫' },
};

function useSessionDuration(joinedAt: number) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const update = () => setElapsed(Math.floor((Date.now() - joinedAt) / 1000));
    update();
    const id = setInterval(update, 30000); // update every 30s
    return () => clearInterval(id);
  }, [joinedAt]);

  const mins = Math.floor(elapsed / 60);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h${mins % 60 > 0 ? ` ${mins % 60}m` : ''}`;
}

function UserRow({ user, isMe }: { user: any; isMe: boolean }) {
  const duration = useSessionDuration(user.joinedAt);
  const status = STATUS_LABELS[user.status as UserStatus] ?? STATUS_LABELS.focused;

  return (
    <motion.div
      className="flex items-center gap-2.5 py-2"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      layout
    >
      <span className="text-xl flex-shrink-0">{user.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-white/80 font-medium truncate">{user.name}</span>
          {isMe && (
            <span className="text-[8px] text-white/30 bg-white/8 rounded-full px-1.5 py-0.5 flex-shrink-0">you</span>
          )}
        </div>
        {user.studyTopic && (
          <p className="text-[10px] text-white/35 truncate font-zurich-cond tracking-wide">{user.studyTopic}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="text-[9px] text-white/30 font-zurich-cond">{duration}</span>
        <div className={`w-2 h-2 rounded-full ${status.dot}`} title={status.label} />
      </div>
    </motion.div>
  );
}

export default function RoomPresencePanel() {
  const currentRoom = useRoomStore((s) => s.currentRoom);
  const roomUsers = useRoomStore((s) => s.roomUsers);
  const localUser = useRoomStore((s) => s.localUser);
  const setLocalUser = useRoomStore((s) => s.setLocalUser);
  const isChatOpen = useRoomStore((s) => s.isChatOpen);
  const setChatOpen = useRoomStore((s) => s.setChatOpen);
  const unreadCount = useRoomStore((s) => s.unreadCount);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  const leaveRoom = () => {
    getSocket().emit('room:leave');
  };

  const updateStatus = (status: UserStatus) => {
    getSocket().emit('user:status', status);
    if (localUser) setLocalUser({ ...localUser, status });
  };

  if (!currentRoom) return null;

  const myStatus = localUser?.status ?? 'focused';

  return (
    <motion.div
      className="fixed top-[130px] left-6 z-[45] w-[200px]"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: 'spring', damping: 25, stiffness: 250 }}
    >
      <div
        className="rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(14,14,22,0.88) 0%, rgba(10,10,16,0.92) 100%)',
          backdropFilter: 'blur(24px)',
        }}
      >
        {/* Room name header */}
        <div className="px-3.5 pt-3 pb-2 border-b border-white/5">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
            <span className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Live now</span>
          </div>
          <p className="text-xs font-bold text-white/80 font-zurich tracking-wide truncate">{currentRoom.name}</p>
        </div>

        {/* User list */}
        <div className="px-3.5 py-1 max-h-[220px] overflow-y-auto scrollbar-none divide-y divide-white/[0.03]">
          <AnimatePresence mode="popLayout">
            {roomUsers.map((u) => (
              <UserRow key={u.id} user={u} isMe={u.name === localUser?.name} />
            ))}
          </AnimatePresence>
        </div>

        {/* Footer: status + leave */}
        <div className="px-3.5 py-2.5 border-t border-white/5 space-y-2">
          {/* Status picker */}
          <div className="relative">
            <button
              onClick={() => setStatusMenuOpen(!statusMenuOpen)}
              className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                bg-white/5 border border-white/8 text-[10px] text-white/50
                hover:bg-white/8 hover:text-white/70 transition-all cursor-pointer"
            >
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_LABELS[myStatus].dot}`} />
              <span className="flex-1 text-left font-zurich-cond tracking-wide">{STATUS_LABELS[myStatus].label}</span>
              <span className="text-white/20 text-[8px]">▼</span>
            </button>
            <AnimatePresence>
              {statusMenuOpen && (
                <motion.div
                  className="absolute bottom-full mb-1.5 left-0 w-full rounded-xl border border-white/10 overflow-hidden shadow-xl z-10"
                  style={{ background: 'rgba(18,18,28,0.98)', backdropFilter: 'blur(20px)' }}
                  initial={{ opacity: 0, y: 4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.95 }}
                >
                  {(Object.entries(STATUS_LABELS) as [UserStatus, typeof STATUS_LABELS[UserStatus]][]).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => { updateStatus(key); setStatusMenuOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-[10px]
                        hover:bg-white/8 transition-all cursor-pointer
                        ${myStatus === key ? 'text-white/80' : 'text-white/40'}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${val.dot}`} />
                      <span className="font-zurich-cond tracking-wide">{val.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Chat button */}
          <button
            onClick={() => setChatOpen(!isChatOpen)}
            className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg
              bg-white/8 border border-white/12 text-[10px] text-white/80 font-semibold
              hover:bg-white/16 hover:text-white transition-all cursor-pointer"
          >
            💬 {isChatOpen ? 'Close Chat' : 'Open Room Chat'}
            {unreadCount > 0 && !isChatOpen && (
              <span className="ml-auto bg-red-500 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Leave */}
          <button
            onClick={leaveRoom}
            className="w-full text-[10px] text-white/25 hover:text-red-400/70
              transition-colors cursor-pointer py-0.5 font-zurich-cond tracking-wide"
          >
            Leave room →
          </button>
        </div>
      </div>
    </motion.div>
  );
}
