'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoomStore } from '@/store/room-store';

const AVATAR_EMOJIS = ['🦊', '🐼', '🐻', '🦁', '🐺', '🐨', '🦋', '🐙', '🦉', '🐸', '🦄', '🐯', '🐧', '🦩', '🐬', '🦖', '🦝', '🐮', '🦙', '🐳'];

export default function UserSetup({ onComplete }: { onComplete?: () => void }) {
  const { isUserSetupOpen, setUserSetupOpen, setLocalUser } = useRoomStore();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🦊');
  const [topic, setTopic] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Please enter a display name');
      return;
    }
    setLocalUser({
      name: name.trim(),
      emoji,
      status: 'focused',
      studyTopic: topic.trim(),
    });
    setUserSetupOpen(false);
    onComplete?.();
  };

  return (
    <AnimatePresence>
      {isUserSetupOpen && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setUserSetupOpen(false)}
          />

          {/* Modal */}
          <motion.div
            className="relative z-10 w-full max-w-sm mx-4 rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(18,18,28,0.98) 0%, rgba(12,12,20,0.99) 100%)',
              backdropFilter: 'blur(40px)',
            }}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-white/5">
              <h2 className="text-base font-bold text-white font-zurich tracking-wider">
                Set up your profile
              </h2>
              <p className="text-xs text-white/40 mt-1">Others in the room will see this</p>
            </div>

            <div className="p-6 space-y-5">
              {/* Avatar picker */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2.5 block">
                  Pick an avatar
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setEmoji(e)}
                      className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all cursor-pointer
                        ${emoji === e
                          ? 'bg-white/15 border border-white/30 scale-110'
                          : 'bg-white/5 border border-transparent hover:bg-white/10'
                        }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2 block">
                  Display name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder="e.g. rahul"
                  maxLength={24}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3
                    text-sm text-white placeholder-white/25 outline-none
                    focus:border-white/30 focus:bg-white/8 transition-all"
                  autoFocus
                />
                {error && <p className="text-red-400/80 text-xs mt-1.5">{error}</p>}
              </div>

              {/* Study topic */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2 block">
                  What are you studying? <span className="text-white/20">(optional)</span>
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. UPSC 2027, React, Calculus…"
                  maxLength={60}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3
                    text-sm text-white placeholder-white/25 outline-none
                    focus:border-white/30 focus:bg-white/8 transition-all"
                />
              </div>

              {/* Submit */}
              <motion.button
                onClick={handleSubmit}
                className="w-full py-3 rounded-xl bg-white/10 border border-white/15
                  text-sm font-semibold text-white hover:bg-white/15 hover:border-white/25
                  transition-all cursor-pointer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {emoji} Save &amp; Continue
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
