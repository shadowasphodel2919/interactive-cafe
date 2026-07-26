'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SceneMode } from '@server/types';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; scene: SceneMode; isPrivate: boolean; inviteCode?: string }) => void;
}

const SCENES: { key: SceneMode; label: string; icon: string }[] = [
  { key: 'city', label: 'City Café', icon: '🌃' },
  { key: 'mountain', label: 'Mountain', icon: '🏔️' },
  { key: 'train', label: 'Train Station', icon: '🚉' },
  { key: 'library', label: 'Cozy Library', icon: '📚' },
  { key: 'cyberpunk', label: 'Cyberpunk', icon: '🌆' },
  { key: 'desert', label: 'Desert Camp', icon: '🏜️' },
];

export default function CreateRoomModal({ isOpen, onClose, onCreate }: CreateRoomModalProps) {
  const [name, setName] = useState('');
  const [scene, setScene] = useState<SceneMode>('city');
  const [isPrivate, setIsPrivate] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');

  const handleCreate = () => {
    if (!name.trim()) { setError('Room name is required'); return; }
    onCreate({
      name: name.trim(),
      scene,
      isPrivate,
      inviteCode: isPrivate ? inviteCode.trim() : undefined,
    });
    // Reset
    setName(''); setScene('city'); setIsPrivate(false); setInviteCode(''); setError('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[300] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="relative z-10 w-full max-w-md mx-4 rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(18,18,28,0.99) 0%, rgba(12,12,20,0.99) 100%)',
            }}
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/5">
              <h2 className="text-sm font-bold text-white font-zurich tracking-wider">Create a Room</h2>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40
                  hover:text-white hover:bg-white/8 transition-all cursor-pointer text-xs"
              >✕</button>
            </div>

            <div className="p-6 space-y-5">
              {/* Room name */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2 block">
                  Room name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(''); }}
                  placeholder="e.g. Late Night UPSC Grind"
                  maxLength={48}
                  autoFocus
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3
                    text-sm text-white placeholder-white/25 outline-none
                    focus:border-white/25 transition-all"
                />
                {error && <p className="text-red-400/80 text-xs mt-1.5">{error}</p>}
              </div>

              {/* Scene picker */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2.5 block">
                  Scene
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {SCENES.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setScene(s.key)}
                      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border
                        text-xs font-medium transition-all cursor-pointer
                        ${scene === s.key
                          ? 'bg-white/12 border-white/25 text-white'
                          : 'bg-white/3 border-white/8 text-white/50 hover:bg-white/8 hover:text-white/80'
                        }`}
                    >
                      <span className="text-xl">{s.icon}</span>
                      <span className="font-zurich-cond text-[10px] tracking-wide">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Privacy toggle */}
              <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/4 border border-white/8">
                <div>
                  <p className="text-sm text-white/80 font-medium">Private room</p>
                  <p className="text-[11px] text-white/35 mt-0.5">Require an invite code to join</p>
                </div>
                <button
                  onClick={() => setIsPrivate(!isPrivate)}
                  className={`relative w-11 h-6 rounded-full border transition-all cursor-pointer
                    ${isPrivate ? 'bg-white/20 border-white/30' : 'bg-white/6 border-white/12'}`}
                >
                  <motion.div
                    className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white/80"
                    animate={{ x: isPrivate ? 20 : 0 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  />
                </button>
              </div>

              {/* Invite code (only if private) */}
              <AnimatePresence>
                {isPrivate && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2 block">
                      Invite code <span className="text-white/20">(leave blank to auto-generate)</span>
                    </label>
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase().slice(0, 8))}
                      placeholder="e.g. STUDY42"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3
                        text-sm text-white placeholder-white/25 outline-none uppercase tracking-widest
                        focus:border-white/25 transition-all"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Create button */}
              <motion.button
                onClick={handleCreate}
                className="w-full py-3.5 rounded-xl bg-white/10 border border-white/15
                  text-sm font-semibold text-white hover:bg-white/16 hover:border-white/25
                  transition-all cursor-pointer"
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
              >
                Create Room →
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
