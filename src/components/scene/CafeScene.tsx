'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import InteractiveObject from './InteractiveObject';
import { useCafeStore, SOUND_CONFIGS } from '@/store/cafe-store';

function seedRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/* ─── Rain Animation ──────────────────────────────────────────── */
function RainEffect() {
  const drops = Array.from({ length: 120 }, (_, i) => {
    const r1 = seedRandom(i * 123.456 + 1.2);
    const r2 = seedRandom(i * 234.567 + 2.3);
    const r3 = seedRandom(i * 345.678 + 3.4);
    const r4 = seedRandom(i * 456.789 + 4.5);
    const r5 = seedRandom(i * 567.890 + 5.6);
    const r6 = seedRandom(i * 678.901 + 6.7);
    return {
      id: i,
      left: r1 * 100,
      delay: r2 * 2,
      duration: 0.6 + r3 * 0.4,
      opacity: 0.2 + r4 * 0.4,
      width: 1 + r5 * 1.5,
      height: 15 + r6 * 25,
    };
  });

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[2]" aria-hidden="true">
      {drops.map((drop) => (
        <div
          key={drop.id}
          className="rain-drop absolute"
          style={{
            left: `${drop.left}%`,
            top: '-30px',
            width: `${drop.width}px`,
            height: `${drop.height}px`,
            opacity: drop.opacity,
            background: 'linear-gradient(to bottom, transparent, rgba(174, 194, 224, 0.5))',
            borderRadius: '0 0 2px 2px',
            animation: `rainFall ${drop.duration}s linear ${drop.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Lightning Flash ─────────────────────────────────────────── */
function LightningEffect() {
  const [flash, setFlash] = React.useState(false);

  useEffect(() => {
    const triggerFlash = () => {
      setFlash(true);
      setTimeout(() => setFlash(false), 150);
      setTimeout(() => {
        setFlash(true);
        setTimeout(() => setFlash(false), 80);
      }, 200);
      // Schedule next flash randomly 15-45 seconds
      const next = 15000 + Math.random() * 30000;
      setTimeout(triggerFlash, next);
    };
    const timeout = setTimeout(triggerFlash, 8000 + Math.random() * 12000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none z-[3]"
      animate={{ opacity: flash ? 0.3 : 0 }}
      transition={{ duration: 0.05 }}
      style={{ background: 'rgba(255, 255, 255, 1)' }}
      aria-hidden="true"
    />
  );
}

/* ─── Steam Animation ─────────────────────────────────────────── */
function SteamParticles({ x, y }: { x: number; y: number }) {
  const particles = Array.from({ length: 5 }, (_, i) => ({
    id: i,
    delay: i * 0.8,
  }));

  return (
    <div
      className="absolute pointer-events-none z-[12]"
      style={{ left: `${x}%`, top: `${y}%` }}
      aria-hidden="true"
    >
      {particles.map((p) => (
        <div
          key={p.id}
          className="steam-particle absolute"
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            animation: `steamRise 3s ease-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Fireplace Glow ──────────────────────────────────────────── */
function FireplaceGlow({ isActive }: { isActive: boolean }) {
  return (
    <motion.div
      className="absolute pointer-events-none z-[4]"
      style={{
        right: '8%',
        top: '45%',
        width: '180px',
        height: '180px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,120,20,0.25) 0%, rgba(255,80,0,0.05) 50%, transparent 70%)',
        filter: 'blur(30px)',
      }}
      animate={{
        opacity: isActive ? [0.5, 0.8, 0.6, 0.9, 0.5] : 0.15,
        scale: isActive ? [1, 1.05, 0.98, 1.03, 1] : 1,
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      aria-hidden="true"
    />
  );
}

/* ─── Vinyl Record Spinning ───────────────────────────────────── */
function VinylDisc({ isActive }: { isActive: boolean }) {
  return (
    <motion.div
      className="absolute z-[11] pointer-events-none"
      style={{
        right: '7%',
        top: '44%',
        width: '42px',
        height: '42px',
      }}
      aria-hidden="true"
    >
      <motion.div
        className="w-full h-full rounded-full"
        style={{
          background: 'conic-gradient(from 0deg, #1a1a1a, #2a2a2a, #1a1a1a, #333, #1a1a1a)',
          boxShadow: isActive ? '0 0 15px rgba(255,183,77,0.3)' : 'none',
        }}
        animate={{ rotate: isActive ? 360 : 0 }}
        transition={{
          duration: 3,
          repeat: isActive ? Infinity : 0,
          ease: 'linear',
        }}
      >
        {/* Center label */}
        <div
          className="absolute rounded-full"
          style={{
            width: '14px',
            height: '14px',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, #e8a855, #c47f2c)',
          }}
        />
      </motion.div>
    </motion.div>
  );
}

/* ─── Ceiling Fan ─────────────────────────────────────────────── */
function CeilingFanAnim({ isActive }: { isActive: boolean }) {
  return (
    <motion.div
      className="absolute z-[11] pointer-events-none"
      style={{ left: '50%', top: '8%', transform: 'translateX(-50%)' }}
      aria-hidden="true"
    >
      <motion.div
        style={{
          width: 60,
          height: 60,
          position: 'relative',
        }}
        animate={{ rotate: isActive ? 360 : 0 }}
        transition={{
          duration: isActive ? 4 : 0,
          repeat: isActive ? Infinity : 0,
          ease: 'linear',
        }}
      >
        {[0, 72, 144, 216, 288].map((angle) => (
          <div
            key={angle}
            className="absolute"
            style={{
              width: '24px',
              height: '4px',
              background: 'rgba(120,100,80,0.6)',
              borderRadius: '2px',
              top: '50%',
              left: '50%',
              transformOrigin: '0 50%',
              transform: `rotate(${angle}deg)`,
            }}
          />
        ))}
        <div
          className="absolute w-3 h-3 rounded-full"
          style={{
            background: '#8B7355',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      </motion.div>
    </motion.div>
  );
}

/* ─── Car Lights ──────────────────────────────────────────────── */
function CarLights() {
  const [cars, setCars] = React.useState<Array<{ id: number; y: number; speed: number; delay: number }>>([]);

  useEffect(() => {
    let id = 0;
    const addCar = () => {
      setCars((prev) => [
        ...prev.slice(-4),
        {
          id: id++,
          y: 25 + Math.random() * 10,
          speed: 4 + Math.random() * 3,
          delay: 0,
        },
      ]);
      setTimeout(addCar, 3000 + Math.random() * 8000);
    };
    const t = setTimeout(addCar, 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden" aria-hidden="true">
      {cars.map((car) => (
        <motion.div
          key={car.id}
          className="absolute"
          style={{
            top: `${car.y}%`,
            width: '8px',
            height: '4px',
            borderRadius: '50%',
            background: 'rgba(255,220,150,0.6)',
            boxShadow: '0 0 20px 8px rgba(255,200,100,0.15)',
          }}
          initial={{ left: '-5%' }}
          animate={{ left: '105%' }}
          transition={{ duration: car.speed, ease: 'linear' }}
          onAnimationComplete={() => {
            setCars((prev) => prev.filter((c) => c.id !== car.id));
          }}
        />
      ))}
    </div>
  );
}

/* ─── Ambient Light Overlay ───────────────────────────────────── */
function AmbientLighting() {
  return (
    <div className="absolute inset-0 pointer-events-none z-[5]" aria-hidden="true">
      {/* Warm pendant lights */}
      {[
        { x: 30, y: 12, size: 200 },
        { x: 55, y: 14, size: 180 },
        { x: 75, y: 10, size: 160 },
      ].map((light, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: `${light.x}%`,
            top: `${light.y}%`,
            width: light.size,
            height: light.size,
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(255,183,77,0.12) 0%, rgba(255,150,50,0.03) 40%, transparent 70%)',
            filter: 'blur(20px)',
          }}
          animate={{
            opacity: [0.6, 0.8, 0.7, 0.9, 0.6],
          }}
          transition={{
            duration: 5 + i,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)',
        }}
      />
    </div>
  );
}

/* ─── Main Café Scene ─────────────────────────────────────────── */
export default function CafeScene() {
  const sounds = useCafeStore((s) => s.sounds);
  const isPlayMode = useCafeStore((s) => s.isPlayMode);
  const togglePlayMode = useCafeStore((s) => s.togglePlayMode);
  const discoveredSounds = useCafeStore((s) => s.discoveredSounds);
  const sceneRef = useRef<HTMLDivElement>(null);

  const hiddenSounds = SOUND_CONFIGS.filter((s) => s.category === 'hidden');
  const discoveredCount = discoveredSounds.length;
  const totalHidden = hiddenSounds.length;

  return (
    <div
      ref={sceneRef}
      className="relative w-full h-screen overflow-hidden select-none"
      style={{
        background: '#0a0a0f',
      }}
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 z-[0]"
        style={{
          backgroundImage: 'url(/cafe-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.75) saturate(0.9)',
        }}
      />

      {/* Atmospheric Overlays */}
      {/* <RainEffect /> */}
      {/* <LightningEffect /> */}
      <CarLights />
      <AmbientLighting />
      <FireplaceGlow isActive={sounds.fireplace?.isActive} />

      {/* Animated elements */}
      {/* <VinylDisc isActive={sounds.vinyl?.isActive || sounds.jazz?.isActive} />
      <CeilingFanAnim isActive={sounds['ceiling-fan']?.isActive} /> */}

      {/* Steam from coffee cups */}
      {/* <SteamParticles x={15} y={45} />
      <SteamParticles x={45} y={55} />
      <SteamParticles x={52} y={60} /> */}

      {/* ─── Interactive Sound Objects (desktop + play mode only) ─── */}
      {isPlayMode && (
        <div className="hidden md:contents">

          {/* Left Area - Coffee Counter */}
          <InteractiveObject soundId="espresso" size="md" />
          <InteractiveObject soundId="grinder" size="md" />
          <InteractiveObject soundId="barista" size="md" />
          <InteractiveObject soundId="tea-kettle" size="sm" />

          {/* Center Area - Seating */}
          <InteractiveObject soundId="keyboard" size="sm" />
          <InteractiveObject soundId="conversations" size="md" />
          <InteractiveObject soundId="page-turning" size="sm" />
          <InteractiveObject soundId="ceiling-fan" size="sm" />

          {/* Right Area - Fireplace Lounge */}
          <InteractiveObject soundId="fireplace" size="lg" />
          <InteractiveObject soundId="vinyl" size="md" />
          <InteractiveObject soundId="jazz" size="md" />

          {/* Background */}
          <InteractiveObject soundId="rain" size="lg" />
          <InteractiveObject soundId="traffic" size="md" />
          <InteractiveObject soundId="wind-chimes" size="sm" />

          {/* Hidden / Discovery Mode */}
          <InteractiveObject soundId="clock" size="sm" />
          <InteractiveObject soundId="cat-purring" size="sm" />
          <InteractiveObject soundId="neon-buzz" size="sm" />
          <InteractiveObject soundId="ice-cubes" size="sm" />
          <InteractiveObject soundId="train-horn" size="sm" />

        </div>
      )}

      {/* Bottom gradient for panel area */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none z-[6]"
        style={{
          background: 'linear-gradient(to top, rgba(10,10,15,0.8) 0%, transparent 100%)',
        }}
      />

      {/* Title */}
      <motion.div
        className="absolute top-6 left-1/2 -translate-x-1/2 z-[20] text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 1 }}
      >
        <h1 className="text-2xl md:text-3xl font-outfit font-bold text-white/80 tracking-wider"
          style={{ textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}
        >
          My Interactive Café
        </h1>
        <div className="hidden md:block">
          <AnimatePresence mode="wait">
            {isPlayMode ? (
              <motion.p
                key="play"
                className="text-xs md:text-sm text-purple-300/70 mt-1 font-inter tracking-wide"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                🎮 Explore the café — find {totalHidden} hidden sounds
              </motion.p>
            ) : (
              <motion.p
                key="normal"
                className="text-xs md:text-sm text-white/40 mt-1 font-inter tracking-wide"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Click the sounds around the café to create your ambience
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Play Mode Toggle — desktop only, sits below the ModeSelector */}
      <motion.div
        className="absolute top-[72px] left-6 z-[20] hidden md:flex items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <button
          onClick={togglePlayMode}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
            backdrop-blur-md border transition-all duration-300
            ${
              isPlayMode
                ? 'bg-purple-500/30 border-purple-400/60 text-purple-200 shadow-lg shadow-purple-500/20'
                : 'bg-black/50 border-white/20 text-white/70 hover:text-white hover:border-white/40 hover:bg-black/60'
            }`}
          title={isPlayMode ? 'Exit Play Mode' : 'Enter Play Mode — find hidden sounds'}
        >
          <span>{isPlayMode ? '🎮' : '🔍'}</span>
          <span>{isPlayMode ? 'Exit Play Mode' : 'Play Mode'}</span>
        </button>

        {/* Discovery counter — only in play mode */}
        <AnimatePresence>
          {isPlayMode && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="flex items-center gap-1.5"
            >
              {hiddenSounds.map((s) => (
                <motion.div
                  key={s.id}
                  title={discoveredSounds.includes(s.id) ? s.name : '???'}
                  className={`w-2 h-2 rounded-full transition-all duration-500 ${
                    discoveredSounds.includes(s.id)
                      ? 'bg-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.7)]'
                      : 'bg-white/15'
                  }`}
                  animate={{
                    scale: discoveredSounds.includes(s.id) ? [1, 1.4, 1] : 1,
                  }}
                  transition={{ duration: 0.4 }}
                />
              ))}
              {discoveredCount === totalHidden && totalHidden > 0 && (
                <motion.span
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-[10px] text-yellow-300/80 ml-1"
                >
                  🎉 All found!
                </motion.span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Active sounds count */}
      <motion.div
        className="absolute top-6 right-6 z-[20] flex items-center gap-2 px-3 py-1.5 rounded-full
          bg-black/40 backdrop-blur-md border border-white/10 text-xs text-white/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        {Object.values(sounds).filter((s) => s.isActive).length} active
      </motion.div>
    </div>
  );
}
