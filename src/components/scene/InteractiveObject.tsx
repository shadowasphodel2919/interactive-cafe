'use client';

import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCafeStore, SOUND_CONFIGS } from '@/store/cafe-store';


interface InteractiveObjectProps {
  soundId: string;
  className?: string;
  style?: React.CSSProperties;
  onToggle?: (id: string, isActive: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function InteractiveObject({
  soundId,
  className = '',
  style,
  onToggle,
  size = 'md',
}: InteractiveObjectProps) {
  const config = SOUND_CONFIGS.find((s) => s.id === soundId);

  const sounds = useCafeStore((s) => s.sounds);
  const toggleSound = useCafeStore((s) => s.toggleSound);
  const discoverSound = useCafeStore((s) => s.discoverSound);
  const discoveredSounds = useCafeStore((s) => s.discoveredSounds);
  const isPlayMode = useCafeStore((s) => s.isPlayMode);
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [justDiscovered, setJustDiscovered] = useState(false);

  const soundState = sounds[soundId];
  const isActive = soundState?.isActive ?? false;
  const isHidden = config?.category === 'hidden';
  const isDiscovered = discoveredSounds.includes(soundId);

  const sizeMap = {
    sm: { w: 40, h: 40, glow: 20 },
    md: { w: 56, h: 56, glow: 30 },
    lg: { w: 72, h: 72, glow: 40 },
  };
  const s = sizeMap[size];

  const handleClick = useCallback(() => {
    if (isHidden && !isDiscovered) {
      discoverSound(soundId);
      setJustDiscovered(true);
      setTimeout(() => setJustDiscovered(false), 2000);
    }
    toggleSound(soundId);
    onToggle?.(soundId, !isActive);
  }, [soundId, isActive, isHidden, isDiscovered, toggleSound, discoverSound, onToggle]);

  // In Play Mode: undiscovered hidden items = completely invisible hit area
  // Hover reveals a faint shimmer so users can sense something is there
  if (isPlayMode && isHidden && !isDiscovered) {
    return (
      <motion.div
        className={`interactive-object ${className}`}
        style={{
          position: 'absolute',
          left: `${config?.position.x ?? 50}%`,
          top: `${config?.position.y ?? 50}%`,
          width: s.w,
          height: s.h,
          transform: 'translate(-50%, -50%)',
          cursor: isHovered ? 'pointer' : 'default',
          zIndex: 10,
          ...style,
        }}
        onMouseEnter={() => { setIsHovered(true); setShowTooltip(true); }}
        onMouseLeave={() => { setIsHovered(false); setShowTooltip(false); }}
        onClick={handleClick}
      >
        {/* Invisible hit area — faint shimmer only on hover */}
        <motion.div
          className="w-full h-full rounded-full"
          animate={{
            background: isHovered
              ? 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)'
              : 'transparent',
            boxShadow: isHovered ? '0 0 20px 4px rgba(255,255,255,0.04)' : 'none',
          }}
          transition={{ duration: 0.3 }}
        />
        {/* Minimal tooltip hinting "something's here" */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap
                px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10
                text-[10px] text-white/50 pointer-events-none z-50 italic"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
            >
              ✨ something&apos;s here...
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // Non-play mode: undiscovered hidden items show an invisible hit area with hover reveal
  if (!isPlayMode && isHidden && !isDiscovered && !isHovered) {
    return (
      <motion.div
        className={`interactive-object hidden-object ${className}`}
        style={{
          position: 'absolute',
          left: `${config?.position.x ?? 50}%`,
          top: `${config?.position.y ?? 50}%`,
          width: s.w,
          height: s.h,
          transform: 'translate(-50%, -50%)',
          cursor: 'pointer',
          zIndex: 10,
          ...style,
        }}
        onMouseEnter={() => {
          setIsHovered(true);
          setShowTooltip(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          setShowTooltip(false);
        }}
        onClick={handleClick}
        whileHover={{ scale: 1.1 }}
      >
        {/* Invisible hit area for discovery */}
        <div className="w-full h-full rounded-full" />
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`interactive-object ${className}`}
      style={{
        position: 'absolute',
        left: `${config?.position.x ?? 50}%`,
        top: `${config?.position.y ?? 50}%`,
        width: s.w,
        height: s.h,
        transform: 'translate(-50%, -50%)',
        cursor: 'pointer',
        zIndex: 15,
        ...style,
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={handleClick}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.95 }}
      initial={isHidden && !isDiscovered ? { opacity: 0, scale: 0 } : { opacity: 1 }}
      animate={{ opacity: 1, scale: 1 }}
    >

      {/* Glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: isActive
            ? 'radial-gradient(circle, rgba(255,183,77,0.4) 0%, rgba(255,183,77,0) 70%)'
            : 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          filter: isActive ? `blur(${s.glow / 2}px)` : 'blur(5px)',
        }}
        animate={{
          scale: isActive ? [1, 1.3, 1] : 1,
          opacity: isActive ? [0.6, 1, 0.6] : isHovered ? 0.5 : 0,
        }}
        transition={{
          duration: 2,
          repeat: isActive ? Infinity : 0,
          ease: 'easeInOut',
        }}
      />

      {/* Discovery burst — shown briefly when first discovered in Play Mode */}
      <AnimatePresence>
        {justDiscovered && (
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            initial={{ scale: 0.5, opacity: 1 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              background: 'radial-gradient(circle, rgba(168,85,247,0.5) 0%, transparent 70%)',
              filter: 'blur(8px)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Object button */}
      <motion.button
        className={`relative w-full h-full rounded-full flex items-center justify-center text-lg
          backdrop-blur-md border transition-all duration-300
          ${isActive
            ? 'bg-amber-500/30 border-amber-400/60 shadow-lg shadow-amber-500/20'
            : 'bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/30'
          }
          ${isHidden && isDiscovered ? 'ring-2 ring-purple-400/40' : ''}
        `}
        aria-label={`Toggle ${config?.name ?? soundId}`}
        aria-pressed={isActive}
      >
        <span className="select-none" style={{ fontSize: size === 'sm' ? '1rem' : size === 'md' ? '1.25rem' : '1.5rem' }}>
          {config?.icon ?? '🔊'}
        </span>

        {/* Active indicator dot */}
        {isActive && (
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400 border-2 border-gray-900"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          />
        )}

        {/* Discovery sparkle */}
        <AnimatePresence>
          {isHidden && isDiscovered && !isActive && (
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-purple-400 border-2 border-gray-900"
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </AnimatePresence>
      </motion.button>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap
              px-3 py-1.5 rounded-lg bg-gray-900/90 backdrop-blur-sm border border-white/10
              text-xs text-white/90 font-medium pointer-events-none z-50"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
          >
            {config?.name ?? soundId}
            {isHidden && !isDiscovered && (
              <span className="ml-1 text-purple-300">✨ New!</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
