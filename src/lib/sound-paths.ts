/**
 * sound-paths.ts
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║   CENTRALIZED SOUND FILE PATHS — change any path here and       ║
 * ║   it will update across every scene automatically.              ║
 * ║                                                                  ║
 * ║   All paths are relative to the /public directory.              ║
 * ║   e.g. '/sounds/rain.mp3' → public/sounds/rain.mp3              ║
 * ║                                                                  ║
 * ║   ⚠️  City Café sounds are PROCEDURALLY GENERATED via Web        ║
 * ║       Audio API (no files needed). See src/lib/sound-generators.ts ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

// ---------------------------------------------------------------------------
// Shared / Reused Files
// These files are used by multiple scenes. Change once → updates everywhere.
// ---------------------------------------------------------------------------
const SHARED = {
  RAIN:           '/sounds/relaxing-rain.mp3',
  WIND:           '/sounds/wind-blowing.mp3',
  WIND_CHIMES:    '/sounds/wind-chimes-bells.mp3',
  CONVERSATION:   '/sounds/conversation.mp3',
  KEYBOARD:       '/sounds/keyboard-typing.mp3',
  KEYBOARD_MECH:  '/sounds/computer-keyboard-typing.mp3',
  PAGES_TURNING:  '/sounds/turning-pages.mp3',
  STEAM:          '/sounds/steam-bubbler.mp3',
  COOKING:        '/sounds/cooking-frying-sizzling-food-free-kitchen.mp3',
  COFFEE_POUR:    '/sounds/coffee-pouring-into-a-cup.mp3',
  COFFEE_GRIND:   '/sounds/grinding-coffee-beans.mp3',
  ICE_IN_GLASS:   '/sounds/ice-in-a-glass.mp3',
  SHAKE:          '/sounds/shake.mp3',
  OVEN_DING:      '/sounds/oven-timer-ding.mp3',
} as const;

// ---------------------------------------------------------------------------
// 🌃 City Café  (procedural — no files)
// ---------------------------------------------------------------------------
// City Café sounds are synthesised live by the Web Audio API engine.
// See: src/lib/sound-generators.ts
// No file paths needed. To swap a sound, replace the generator function there.
export const CITY_CAFE_NOTE =
  'City Café uses procedural Web Audio synthesis — see src/lib/sound-generators.ts';

// ---------------------------------------------------------------------------
// 🏔️  Mountain Café
// ---------------------------------------------------------------------------
export const MOUNTAIN_PATHS = {
  /** ☕ Espresso Machine (proc) */   'mt-espresso':     '__procedural__' as const,
  /** ⚙️  Coffee Grinder */          'mt-grinder':      SHARED.COFFEE_GRIND,
  /** 👨‍🍳 Barista (proc) */           'mt-barista':      '__procedural__' as const,
  /** 🧊 Ice Cubes */                'mt-ice':          SHARED.ICE_IN_GLASS,
  /** 📖 Turning Pages */            'mt-pages':        SHARED.PAGES_TURNING,
  /** 💬 Quiet Talking */            'mt-conversation': SHARED.CONVERSATION,
  /** 🎵 Vinyl Record (proc) */      'mt-vinyl':        '__procedural__' as const,
  /** 🌀 Ceiling Fan (proc) */       'mt-fan':          '__procedural__' as const,
  /** 🎐 Wind Chimes */              'mt-chimes':       SHARED.WIND_CHIMES,
  /** 🌬️ Wind Blowing */             'mt-wind':         SHARED.WIND,
  /** 🔔 Distant Bell */             'mt-bell':         SHARED.OVEN_DING,
} as const;

// ---------------------------------------------------------------------------
// 🚉 Train Station
// ---------------------------------------------------------------------------
export const TRAIN_PATHS = {
  /** 🌧️ Rain on Roof */            'tr-rain':         SHARED.RAIN,
  /** 🚃 Distant Train (proc) */    'tr-train':        '__procedural__' as const,
  /** 🎐 Wind Chimes */             'tr-chimes':       SHARED.WIND_CHIMES,
  /** 🏮 Paper Lantern */           'tr-lantern':      SHARED.WIND,
  /** 🧃 Vending Machine */         'tr-vending':      SHARED.STEAM,
  /** 🌸 Cherry Blossoms */         'tr-leaves':       SHARED.WIND,
  /** 👤 Traveller */               'tr-traveller':    SHARED.PAGES_TURNING,
  /** 🐦 Sparrows (proc) */         'tr-birds':        '__procedural__' as const,
  /** 📢 PA Announcement */         'tr-announcement': SHARED.CONVERSATION,
  /** 🦗 Evening Crickets (proc) */ 'tr-crickets':     '__procedural__' as const,
} as const;

// ---------------------------------------------------------------------------
// 📚 Cozy Library
// ---------------------------------------------------------------------------
export const LIBRARY_PATHS = {
  /** ⛈️  Storm Window */            'lib-storm':       SHARED.RAIN,
  /** 💡 Banker's Lamp */           'lib-lamp':        SHARED.STEAM,
  /** 📖 Open Book */               'lib-book':        SHARED.PAGES_TURNING,
  /** 🐱 Sleeping Cat (proc) */     'lib-cat':         '__procedural__' as const,
  /** 🕰️  Grandfather Clock (proc)*/'lib-clock':       '__procedural__' as const,
  /** ☕ Tea Cup */                  'lib-tea':         SHARED.ICE_IN_GLASS,
  /** 🪵 Fireplace (proc) */        'lib-fireplace':   '__procedural__' as const,
  /** ✒️  Fountain Pen */            'lib-pen':         SHARED.KEYBOARD,
  /** 🪜 Rolling Ladder */          'lib-ladder':      SHARED.WIND,
  /** 🎵 Record Player (proc) */    'lib-record':      '__procedural__' as const,
  /** 🌧️ Rain on Glass */           'lib-glass-rain':  SHARED.RAIN,
} as const;

// ---------------------------------------------------------------------------
// 🌃 Cyberpunk Rooftop
// ---------------------------------------------------------------------------
export const CYBERPUNK_PATHS = {
  /** 🌧️ Heavy Rain */              'cy-rain':         SHARED.RAIN,
  /** 🍜 Ramen Pot */               'cy-ramen':        SHARED.COOKING,
  /** 📺 Holographic Ad (proc) */   'cy-hologram':     '__procedural__' as const,
  /** 🚁 Drone Buzz (proc) */       'cy-drone':        '__procedural__' as const,
  /** ⚡ Neon Sign (proc) */        'cy-neon':         '__procedural__' as const,
  /** 🚗 Traffic Below */           'cy-traffic':      SHARED.WIND,
  /** 📻 Lo-Fi Radio (proc) */      'cy-radio':        '__procedural__' as const,
  /** 💧 Puddle Drips */            'cy-drips':        SHARED.COFFEE_POUR,
  /** 🐈 Stray Cat (proc) */        'cy-cat':          '__procedural__' as const,
  /** 🔧 AC Compressor */           'cy-ac':           SHARED.STEAM,
  /** 🎸 Distant Club (proc) */     'cy-music':        '__procedural__' as const,
  /** 📡 Satellite Static (proc) */ 'cy-satellite':    '__procedural__' as const,
} as const;

// ---------------------------------------------------------------------------
// 🏜️  Desert Campfire
// ---------------------------------------------------------------------------
export const DESERT_PATHS = {
  /** 🔥 Campfire Crackle (proc) */ 'de-campfire':     '__procedural__' as const,
  /** 🎸 Acoustic Guitar (proc) */  'de-guitar':       '__procedural__' as const,
  /** ☕ Coffee Pot */              'de-coffee':       SHARED.COFFEE_POUR,
  /** 🐺 Coyote Howl (proc) */     'de-coyote':       '__procedural__' as const,
  /** 🦗 Desert Crickets (proc) */ 'de-crickets':     '__procedural__' as const,
  /** ⛺ Tent Flapping */           'de-tent':         SHARED.WIND,
  /** 🌬️ Desert Wind */             'de-wind':         SHARED.WIND,
  /** 🪵 Log Crackle (proc) */      'de-crackle':      '__procedural__' as const,
  /** 🦉 Desert Owl (proc) */       'de-owl':          '__procedural__' as const,
  /** 🏮 Camp Lantern */            'de-lantern':      SHARED.WIND_CHIMES,
  /** ⭐ Shooting Star (proc) */    'de-star':         '__procedural__' as const,
} as const;

// ---------------------------------------------------------------------------
// Master export — all paths in one object for reference
// ---------------------------------------------------------------------------
export const ALL_SOUND_PATHS = {
  mountain:  MOUNTAIN_PATHS,
  train:     TRAIN_PATHS,
  library:   LIBRARY_PATHS,
  cyberpunk: CYBERPUNK_PATHS,
  desert:    DESERT_PATHS,
} as const;

export { SHARED };
