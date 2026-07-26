// Shared types for the study rooms feature
// Used by both the Socket.io server (server/index.ts) and the client (src/lib/socket.ts)

export type SceneMode = 'city' | 'mountain' | 'train' | 'library' | 'cyberpunk' | 'desert';

export type UserStatus = 'focused' | 'break' | 'away';

export interface RoomUser {
  id: string;          // socket id
  name: string;        // display name
  emoji: string;       // avatar emoji
  status: UserStatus;
  studyTopic: string;  // what they're studying
  joinedAt: number;    // timestamp (ms)
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userEmoji: string;
  text: string;
  timestamp: number;
}

export interface Room {
  id: string;
  name: string;
  scene: SceneMode;
  isPrivate: boolean;
  inviteCode?: string;   // only set if isPrivate
  users: RoomUser[];
  messages: ChatMessage[];
  createdAt: number;
}

// Lightweight room info sent in lobby listing (no messages)
export interface RoomSummary {
  id: string;
  name: string;
  scene: SceneMode;
  isPrivate: boolean;
  userCount: number;
  users: Pick<RoomUser, 'id' | 'name' | 'emoji' | 'status'>[];
  createdAt: number;
}

// ─── Socket.io Event Map ───────────────────────────────────────────────────

export interface ServerToClientEvents {
  'room:list':     (rooms: RoomSummary[]) => void;
  'room:joined':   (room: Room) => void;
  'room:left':     () => void;
  'room:error':    (msg: string) => void;
  'room:updated':  (users: RoomUser[]) => void;
  'room:message':  (msg: ChatMessage) => void;
}

export interface ClientToServerEvents {
  'room:list':    () => void;
  'room:create':  (payload: {
    name: string;
    scene: SceneMode;
    isPrivate: boolean;
    inviteCode?: string;
    user: Omit<RoomUser, 'id' | 'joinedAt'>;
  }) => void;
  'room:join':    (payload: {
    roomId: string;
    inviteCode?: string;
    user: Omit<RoomUser, 'id' | 'joinedAt'>;
  }) => void;
  'room:leave':   () => void;
  'room:message': (text: string) => void;
  'user:status':  (status: UserStatus) => void;
  'user:topic':   (topic: string) => void;
}
