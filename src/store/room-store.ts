'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Room, RoomSummary, ChatMessage, RoomUser, UserStatus } from '@server/types';

interface LocalUser {
  name: string;
  emoji: string;
  status: UserStatus;
  studyTopic: string;
}

interface RoomStore {
  // Lobby
  rooms: RoomSummary[];
  isLobbyOpen: boolean;

  // Current joined room
  currentRoom: Room | null;
  roomUsers: RoomUser[];

  // Chat
  messages: ChatMessage[];
  isChatOpen: boolean;
  unreadCount: number;

  // User profile (persisted)
  localUser: LocalUser | null;
  isUserSetupOpen: boolean;

  // Connection state
  isConnected: boolean;

  // ── Actions ──────────────────────────────────────────────────────────────
  setRooms: (rooms: RoomSummary[]) => void;
  setLobbyOpen: (open: boolean) => void;
  setCurrentRoom: (room: Room | null) => void;
  setRoomUsers: (users: RoomUser[]) => void;
  addMessage: (msg: ChatMessage) => void;
  setChatOpen: (open: boolean) => void;
  resetUnread: () => void;
  setLocalUser: (user: LocalUser) => void;
  setUserSetupOpen: (open: boolean) => void;
  setConnected: (v: boolean) => void;
  leaveRoom: () => void;
}

export const useRoomStore = create<RoomStore>()(
  persist(
    (set, get) => ({
      rooms: [],
      isLobbyOpen: false,
      currentRoom: null,
      roomUsers: [],
      messages: [],
      isChatOpen: false,
      unreadCount: 0,
      localUser: null,
      isUserSetupOpen: false,
      isConnected: false,

      setRooms: (rooms) => set({ rooms }),
      setLobbyOpen: (open) => set({ isLobbyOpen: open }),
      setCurrentRoom: (room) =>
        set({ currentRoom: room, roomUsers: room?.users ?? [], messages: room?.messages ?? [] }),
      setRoomUsers: (users) => set({ roomUsers: users }),
      addMessage: (msg) => {
        const { isChatOpen } = get();
        set((s) => ({
          messages: [...s.messages, msg],
          unreadCount: isChatOpen ? 0 : s.unreadCount + 1,
        }));
      },
      setChatOpen: (open) => set({ isChatOpen: open, unreadCount: open ? 0 : get().unreadCount }),
      resetUnread: () => set({ unreadCount: 0 }),
      setLocalUser: (user) => set({ localUser: user }),
      setUserSetupOpen: (open) => set({ isUserSetupOpen: open }),
      setConnected: (v) => set({ isConnected: v }),
      leaveRoom: () => set({ currentRoom: null, roomUsers: [], messages: [], isChatOpen: false, unreadCount: 0 }),
    }),
    {
      name: 'cafe-rooms',
      partialize: (s) => ({ localUser: s.localUser }),
    }
  )
);
