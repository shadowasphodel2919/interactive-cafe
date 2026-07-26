import { createServer } from 'http';
import { Server } from 'socket.io';
import { nanoid } from 'nanoid';
import type {
  Room,
  RoomUser,
  RoomSummary,
  ChatMessage,
  ServerToClientEvents,
  ClientToServerEvents,
  SceneMode,
} from './types';

const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';

// Strict origin whitelist — default to your Vercel app and local dev URLs
const ALLOWED_ORIGINS = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
  : [
      'https://interactive-cafe.vercel.app',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ];

function isOriginAllowed(origin?: string): boolean {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.includes('*')) return true;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (origin.endsWith('.vercel.app')) return true;
  return false;
}

// ─── In-memory store ──────────────────────────────────────────────────────
const rooms = new Map<string, Room>();
// Map: socketId → roomId (for tracking which room each socket is in)
const socketRoomMap = new Map<string, string>();

// ─── Helpers ─────────────────────────────────────────────────────────────

function toSummary(room: Room): RoomSummary {
  return {
    id: room.id,
    name: room.name,
    scene: room.scene,
    isPrivate: room.isPrivate,
    userCount: room.users.length,
    users: room.users.map(({ id, name, emoji, status }) => ({ id, name, emoji, status })),
    createdAt: room.createdAt,
  };
}

function broadcastRoomList(io: Server) {
  const list = Array.from(rooms.values()).map(toSummary);
  io.emit('room:list', list);
}

function removeUserFromCurrentRoom(io: Server, socketId: string) {
  const roomId = socketRoomMap.get(socketId);
  if (!roomId) return;

  const room = rooms.get(roomId);
  if (!room) return;

  room.users = room.users.filter((u) => u.id !== socketId);
  socketRoomMap.delete(socketId);

  if (room.users.length === 0) {
    // Empty room — delete it
    rooms.delete(roomId);
  } else {
    // Notify remaining users
    io.to(roomId).emit('room:updated', room.users);
  }

  broadcastRoomList(io);
}

// ─── Server Boot ─────────────────────────────────────────────────────────

const httpServer = createServer((req, res) => {
  // Always set CORS headers on raw HTTP requests (polling, preflight, health checks)
  const reqOrigin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', reqOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check endpoint for Railway/cloud platforms
  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', server: 'Study Rooms Socket Server' }));
    return;
  }
});

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: (requestOrigin, callback) => {
      // Echo requestOrigin or allow all
      callback(null, requestOrigin || true);
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
  },
  transports: ['polling', 'websocket'],
});

io.on('connection', (socket) => {
  console.log(`[socket] connected: ${socket.id}`);

  // ── Room list ──────────────────────────────────────────────────────────
  socket.on('room:list', () => {
    const list = Array.from(rooms.values()).map(toSummary);
    socket.emit('room:list', list);
  });

  // ── Create room ────────────────────────────────────────────────────────
  socket.on('room:create', ({ name, scene, isPrivate, inviteCode, user }) => {
    const roomId = nanoid(8);

    const newUser: RoomUser = {
      ...user,
      id: socket.id,
      joinedAt: Date.now(),
    };

    const room: Room = {
      id: roomId,
      name,
      scene,
      isPrivate,
      inviteCode: isPrivate ? (inviteCode || nanoid(6).toUpperCase()) : undefined,
      users: [newUser],
      messages: [],
      createdAt: Date.now(),
    };

    rooms.set(roomId, room);
    socketRoomMap.set(socket.id, roomId);

    socket.join(roomId);
    socket.emit('room:joined', room);

    broadcastRoomList(io);
    console.log(`[room] created: "${name}" (${roomId})`);
  });

  // ── Join room ──────────────────────────────────────────────────────────
  socket.on('room:join', ({ roomId, inviteCode, user }) => {
    const room = rooms.get(roomId);

    if (!room) {
      socket.emit('room:error', 'Room not found');
      return;
    }

    if (room.isPrivate && room.inviteCode && room.inviteCode !== inviteCode?.toUpperCase()) {
      socket.emit('room:error', 'Invalid invite code');
      return;
    }

    // If already in a room, leave it first
    removeUserFromCurrentRoom(io, socket.id);

    const newUser: RoomUser = {
      ...user,
      id: socket.id,
      joinedAt: Date.now(),
    };

    room.users.push(newUser);
    socketRoomMap.set(socket.id, roomId);

    socket.join(roomId);
    socket.emit('room:joined', room);

    // Notify other members
    io.to(roomId).emit('room:updated', room.users);
    broadcastRoomList(io);

    console.log(`[room] "${user.name}" joined "${room.name}" (${roomId})`);
  });

  // ── Leave room ─────────────────────────────────────────────────────────
  socket.on('room:leave', () => {
    const roomId = socketRoomMap.get(socket.id);
    if (roomId) {
      socket.leave(roomId);
      removeUserFromCurrentRoom(io, socket.id);
      socket.emit('room:left');
    }
  });

  // ── Chat message ───────────────────────────────────────────────────────
  socket.on('room:message', (text) => {
    const roomId = socketRoomMap.get(socket.id);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    const sender = room.users.find((u) => u.id === socket.id);
    if (!sender) return;

    const msg: ChatMessage = {
      id: nanoid(),
      userId: socket.id,
      userName: sender.name,
      userEmoji: sender.emoji,
      text: text.slice(0, 300),
      timestamp: Date.now(),
    };

    room.messages = [...room.messages.slice(-199), msg]; // keep last 200
    io.to(roomId).emit('room:message', msg);
  });

  // ── Status update ──────────────────────────────────────────────────────
  socket.on('user:status', (status) => {
    const roomId = socketRoomMap.get(socket.id);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    const user = room.users.find((u) => u.id === socket.id);
    if (user) {
      user.status = status;
      io.to(roomId).emit('room:updated', room.users);
    }
  });

  // ── Study topic update ─────────────────────────────────────────────────
  socket.on('user:topic', (topic) => {
    const roomId = socketRoomMap.get(socket.id);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    const user = room.users.find((u) => u.id === socket.id);
    if (user) {
      user.studyTopic = topic.slice(0, 60);
      io.to(roomId).emit('room:updated', room.users);
    }
  });

  // ── Disconnect ─────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[socket] disconnected: ${socket.id}`);
    const roomId = socketRoomMap.get(socket.id);
    if (roomId) {
      removeUserFromCurrentRoom(io, socket.id);
    }
  });
});

httpServer.listen(Number(PORT), HOST, () => {
  console.log(`\n🚀 Study Rooms Socket.io server running on http://${HOST}:${PORT}\n`);
});
