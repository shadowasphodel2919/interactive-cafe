'use client';

import { useEffect, useCallback } from 'react';
import { connectSocket, getSocket } from '@/lib/socket';
import { useRoomStore } from '@/store/room-store';
import { useCafeStore } from '@/store/cafe-store';
import type { SceneMode, UserStatus } from '@server/types';

export function useRoom() {
  const store = useRoomStore();
  const setMode = useCafeStore((s) => s.setMode);

  // ── Connect socket & register listeners ──────────────────────────────────
  useEffect(() => {
    const socket = connectSocket();

    const handleConnect = () => {
      store.setConnected(true);
      socket.emit('room:list');
    };

    const handleDisconnect = () => {
      store.setConnected(false);
    };

    const handleRoomList = (rooms: Parameters<typeof store.setRooms>[0]) => {
      store.setRooms(rooms);
    };

    const handleRoomJoined = (room: Parameters<typeof store.setCurrentRoom>[0]) => {
      store.setCurrentRoom(room);
      if (room) setMode(room.scene as SceneMode);
    };

    const handleRoomLeft = () => {
      store.leaveRoom();
    };

    const handleRoomUpdated = (users: Parameters<typeof store.setRoomUsers>[0]) => {
      store.setRoomUsers(users);
    };

    const handleRoomMessage = (msg: Parameters<typeof store.addMessage>[0]) => {
      store.addMessage(msg);
    };

    const handleRoomError = (msg: string) => {
      console.error('[room error]', msg);
      // Could surface a toast here in future
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('room:list', handleRoomList);
    socket.on('room:joined', handleRoomJoined);
    socket.on('room:left', handleRoomLeft);
    socket.on('room:updated', handleRoomUpdated);
    socket.on('room:message', handleRoomMessage);
    socket.on('room:error', handleRoomError);

    // If already connected (hot-reload), trigger list immediately
    if (socket.connected) {
      store.setConnected(true);
      socket.emit('room:list');
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('room:list', handleRoomList);
      socket.off('room:joined', handleRoomJoined);
      socket.off('room:left', handleRoomLeft);
      socket.off('room:updated', handleRoomUpdated);
      socket.off('room:message', handleRoomMessage);
      socket.off('room:error', handleRoomError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Action helpers ────────────────────────────────────────────────────────
  const createRoom = useCallback(
    ({
      name,
      scene,
      isPrivate,
      inviteCode,
    }: {
      name: string;
      scene: SceneMode;
      isPrivate: boolean;
      inviteCode?: string;
    }) => {
      const { localUser } = useRoomStore.getState();
      if (!localUser) return;
      const socket = getSocket();
      socket.emit('room:create', {
        name,
        scene,
        isPrivate,
        inviteCode,
        user: {
          name: localUser.name,
          emoji: localUser.emoji,
          status: localUser.status,
          studyTopic: localUser.studyTopic,
        },
      });
    },
    []
  );

  const joinRoom = useCallback((roomId: string, inviteCode?: string) => {
    const { localUser } = useRoomStore.getState();
    if (!localUser) return;
    const socket = getSocket();
    socket.emit('room:join', {
      roomId,
      inviteCode,
      user: {
        name: localUser.name,
        emoji: localUser.emoji,
        status: localUser.status,
        studyTopic: localUser.studyTopic,
      },
    });
  }, []);

  const leaveRoom = useCallback(() => {
    getSocket().emit('room:leave');
  }, []);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    getSocket().emit('room:message', text.trim());
  }, []);

  const updateStatus = useCallback((status: UserStatus) => {
    getSocket().emit('user:status', status);
    // Optimistically update local user
    const { localUser, setLocalUser } = useRoomStore.getState();
    if (localUser) setLocalUser({ ...localUser, status });
  }, []);

  const updateTopic = useCallback((topic: string) => {
    getSocket().emit('user:topic', topic);
    const { localUser, setLocalUser } = useRoomStore.getState();
    if (localUser) setLocalUser({ ...localUser, studyTopic: topic });
  }, []);

  const refreshRooms = useCallback(() => {
    getSocket().emit('room:list');
  }, []);

  return { createRoom, joinRoom, leaveRoom, sendMessage, updateStatus, updateTopic, refreshRooms };
}
