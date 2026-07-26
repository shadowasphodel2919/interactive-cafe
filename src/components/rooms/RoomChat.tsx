'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoomStore } from '@/store/room-store';
import { useCafeStore } from '@/store/cafe-store';
import { getSocket } from '@/lib/socket';

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function RoomChat() {
  const isChatOpen = useRoomStore((s) => s.isChatOpen);
  const setChatOpen = useRoomStore((s) => s.setChatOpen);
  const messages = useRoomStore((s) => s.messages);
  const currentRoom = useRoomStore((s) => s.currentRoom);
  const unreadCount = useRoomStore((s) => s.unreadCount);
  const resetUnread = useRoomStore((s) => s.resetUnread);
  const isSoundPanelOpen = useCafeStore((s) => s.isPanelOpen);

  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const messageCount = messages.length;

  // Auto-scroll to bottom on new messages or when chat opens
  useEffect(() => {
    if (isChatOpen && currentRoom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      resetUnread();
    }
  }, [messageCount, isChatOpen]);

  // Focus input when chat opens
  useEffect(() => {
    if (isChatOpen && currentRoom) {
      inputRef.current?.focus();
    }
  }, [isChatOpen]);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    getSocket().emit('room:message', text.trim());
  }, []);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  }, [input, sendMessage]);

  if (!currentRoom) return null;

  return (
    <>
      {/* Chat Toggle Button */}
      <motion.button
        className="fixed bottom-6 right-20 z-[46] w-12 h-12 rounded-full
          bg-neutral-950/65 backdrop-blur-xl border border-white/10
          flex items-center justify-center text-lg relative
          shadow-lg hover:border-white/20 transition-colors cursor-pointer"
        onClick={() => setChatOpen(!isChatOpen)}
        animate={{ x: isChatOpen || isSoundPanelOpen ? -360 : 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Toggle room chat"
      >
        💬
        {unreadCount > 0 && !isChatOpen && (
          <motion.span
            className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full
              bg-red-500 border border-red-400/50 text-[9px] text-white font-bold
              flex items-center justify-center px-1"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            className="fixed bottom-0 right-0 z-[44] w-[360px] h-[460px] flex flex-col
              border-l border-t border-white/5 shadow-2xl overflow-hidden rounded-tl-2xl"
            style={{
              background: 'linear-gradient(180deg, rgba(12,13,18,0.95) 0%, rgba(8,9,12,0.98) 100%)',
              backdropFilter: 'blur(30px)',
            }}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0">
              <div>
                <p className="text-xs font-bold text-white/80 font-zurich tracking-wider">Room Chat</p>
                <p className="text-[10px] text-white/30 font-zurich-cond">{currentRoom.name}</p>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30
                  hover:text-white hover:bg-white/8 transition-all cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
              <AnimatePresence initial={false}>
                {messages.length === 0 ? (
                  <motion.div
                    key="empty"
                    className="flex flex-col items-center justify-center h-full text-center py-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <span className="text-3xl mb-2">💬</span>
                    <p className="text-xs text-white/30">No messages yet</p>
                    <p className="text-[10px] text-white/20 mt-0.5">Say hi to the room!</p>
                  </motion.div>
                ) : (
                  messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      className="flex items-start gap-2.5"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: 'spring', damping: 20, stiffness: 280 }}
                    >
                      <span className="text-lg flex-shrink-0 leading-none mt-0.5">{msg.userEmoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-1.5 mb-0.5">
                          <span className="text-[11px] font-semibold text-white/70">{msg.userName}</span>
                          <span className="text-[9px] text-white/25">{formatTime(msg.timestamp)}</span>
                        </div>
                        <p className="text-xs text-white/60 leading-relaxed break-words">{msg.text}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 px-3 py-3 border-t border-white/5 flex-shrink-0">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Send a message…"
                maxLength={300}
                className="flex-1 bg-white/5 border border-white/8 rounded-xl px-3.5 py-2.5
                  text-xs text-white placeholder-white/25 outline-none
                  focus:border-white/20 transition-all"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="w-9 h-9 rounded-xl flex items-center justify-center
                  bg-white/8 border border-white/12 text-white/50
                  hover:bg-white/14 hover:text-white transition-all cursor-pointer
                  disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ↑
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
