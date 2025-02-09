import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

export function useSocket() {
  const { data: session } = useSession();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (session?.user) {
      socketRef.current = io({
        path: '/api/socket',
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [session]);

  const joinRoom = (roomId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('join-room', roomId);
    }
  };

  const leaveRoom = (roomId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('leave-room', roomId);
    }
  };

  const sendMessage = (roomId: string, content: string) => {
    if (socketRef.current) {
      socketRef.current.emit('send-message', { roomId, content });
    }
  };

  const onNewMessage = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('new-message', callback);
    }
  };

  const startVoice = (roomId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('start-voice', roomId);
    }
  };

  const stopVoice = (roomId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('stop-voice', roomId);
    }
  };

  return {
    socket: socketRef.current,
    joinRoom,
    leaveRoom,
    sendMessage,
    onNewMessage,
    startVoice,
    stopVoice,
  };
} 