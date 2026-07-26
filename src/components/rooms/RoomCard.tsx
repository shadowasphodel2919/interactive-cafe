'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RoomSummary } from '@server/types';

const SCENE_ICONS: Record<string, string> = {
  city: '🌃', mountain: '🏔️', train: '🚉', library: '📚', cyberpunk: '🌆', desert: '🏜️',
};

interface RoomCardProps {
  room: RoomSummary;
  onJoin: (roomId: string, inviteCode?: string) => void;
  isCurrentRoom?: boolean;
}

export default function RoomCard({ room, onJoin, isCurrentRoom }: RoomCardProps) {
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [code, setCode] = useState('');

  const elapsed = Math.floor((Date.now() - room.createdAt) / 60000); // minutes
  const elapsedStr = elapsed < 60
    ? `${elapsed}m`
    : `${Math.floor(elapsed / 60)}h ${elapsed % 60}m`;

  const handleJoin = () => {
    if (room.isPrivate && !showCodeInput) {
      setShowCodeInput(true);
      return;
    }
    onJoin(room.id, room.isPrivate ? code : undefined);
    setShowCodeInput(false);
    setCode('');
  };

  return (
    <motion.div
      className={`relative rounded-2xl border p-4 overflow-hidden transition-all
        ${isCurrentRoom
          ? 'border-white/25 bg-white/8'
          : 'border-white/8 bg-white/3 hover:bg-white/6 hover:border-white/14'
        }`}
      layout
      whileHover={{ y: -1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xl flex-shrink-0">{SCENE_ICONS[room.scene] ?? '🎵'}</span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white/90 font-zurich tracking-wide truncate">{room.name}</p>
            <p className="text-[10px] text-white/35 mt-0.5 font-zurich-cond tracking-wide capitalize">{room.scene} · {elapsedStr} ago</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {room.isPrivate && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-yellow-500/10 border border-yellow-500/20 text-yellow-300/70 font-bold tracking-wider uppercase">
              private
            </span>
          )}
          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/6 border border-white/10 text-white/50 font-bold tracking-wider uppercase">
            {room.userCount} {room.userCount === 1 ? 'user' : 'users'}
          </span>
        </div>
      </div>

      {/* User avatars */}
      {room.users.length > 0 && (
        <div className="flex items-center gap-1.5 mb-3.5 flex-wrap">
          {room.users.slice(0, 5).map((u) => (
            <div key={u.id} className="flex items-center gap-1 bg-white/6 rounded-full px-2 py-0.5">
              <span className="text-sm">{u.emoji}</span>
              <span className="text-[10px] text-white/60 font-zurich-cond tracking-wide">{u.name}</span>
              <span
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  u.status === 'focused' ? 'bg-green-400' : u.status === 'break' ? 'bg-yellow-400' : 'bg-white/30'
                }`}
              />
            </div>
          ))}
          {room.users.length > 5 && (
            <span className="text-[10px] text-white/30">+{room.users.length - 5} more</span>
          )}
        </div>
      )}

      {/* Invite code input (private rooms) */}
      <AnimatePresence>
        {showCodeInput && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-3"
          >
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              placeholder="Enter invite code"
              className="w-full bg-white/5 border border-white/12 rounded-xl px-3 py-2.5
                text-xs text-white placeholder-white/25 outline-none uppercase tracking-widest
                focus:border-white/25 transition-all"
              autoFocus
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Join button */}
      {!isCurrentRoom && (
        <motion.button
          onClick={handleJoin}
          className="w-full py-2 rounded-xl text-xs font-semibold font-zurich tracking-wider
            bg-white/8 border border-white/12 text-white/70 hover:bg-white/14 hover:text-white
            hover:border-white/22 transition-all cursor-pointer"
          whileTap={{ scale: 0.97 }}
        >
          {showCodeInput ? 'Enter →' : room.isPrivate ? '🔒 Enter code' : 'Join →'}
        </motion.button>
      )}
      {isCurrentRoom && (
        <div className="flex items-center gap-1.5 justify-center py-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] text-green-400/80 font-zurich-cond tracking-widest uppercase">You're here</span>
        </div>
      )}
    </motion.div>
  );
}
