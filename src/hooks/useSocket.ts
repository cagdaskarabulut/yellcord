"use client";

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = () => {
  const socket = useRef<Socket | undefined>(undefined);
  const [isConnected, setIsConnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initSocket = async () => {
      try {
        // Socket.io sunucusuna bağlan
        await fetch("/api/socket");

        socket.current = io({
          path: "/api/socket",
          addTrailingSlash: false,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 10000,
          transports: ["websocket", "polling"],
          withCredentials: true,
        });

        socket.current.on("connect", () => {
          console.log("Socket bağlantısı kuruldu");
          setIsConnected(true);
        });

        socket.current.on("connect_error", (error) => {
          console.error("Socket bağlantı hatası:", error);
          setIsConnected(false);
        });

        socket.current.on("error", (error) => {
          console.error("Socket hatası:", error);
        });

        socket.current.on("disconnect", (reason) => {
          console.log("Socket bağlantısı kesildi:", reason);
          setIsConnected(false);
        });

        socket.current.on("user-joined", (data) => {
          console.log("Kullanıcı odaya katıldı:", data);
        });

        socket.current.on("user-left", (data) => {
          console.log("Kullanıcı odadan ayrıldı:", data);
        });

        socket.current.on("new-message", (message) => {
          console.log("Yeni mesaj alındı:", message);
        });

        setIsInitialized(true);
      } catch (error) {
        console.error("Socket başlatma hatası:", error);
        setIsConnected(false);
      }
    };

    if (!socket.current && !isInitialized) {
      initSocket();
    }

    return () => {
      if (socket.current) {
        socket.current.disconnect();
        setIsConnected(false);
        setIsInitialized(false);
      }
    };
  }, [isInitialized]);

  const joinRoom = async (roomId: string) => {
    // Bağlantı yoksa ve socket başlatılmamışsa, başlatmayı dene
    if (!isConnected && !isInitialized) {
      try {
        await fetch("/api/socket");
        socket.current = io({
          path: "/api/socket",
          addTrailingSlash: false,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 10000,
          transports: ["websocket", "polling"],
          withCredentials: true,
        });
        setIsInitialized(true);
      } catch (error) {
        console.error("Socket başlatma hatası:", error);
        return;
      }
    }

    // Socket bağlantısını kontrol et
    if (socket.current?.connected) {
      socket.current.emit("join-room", roomId);
      console.log(`Odaya katılındı: ${roomId}`);
    } else {
      console.error("Socket bağlantısı yok - Odaya katılınamadı");
      // Bağlantıyı yeniden kurmayı dene
      socket.current?.connect();
    }
  };

  const leaveRoom = (roomId: string) => {
    if (socket.current?.connected) {
      socket.current.emit("leave-room", roomId);
      console.log(`Odadan çıkıldı: ${roomId}`);
    }
  };

  const sendMessage = (roomId: string, content: string) => {
    if (socket.current?.connected) {
      socket.current.emit("send-message", { roomId, content });
      console.log("Mesaj gönderildi:", { roomId, content });
    } else {
      console.error("Socket bağlantısı yok - Mesaj gönderilemedi");
      // Bağlantıyı yeniden kurmayı dene
      socket.current?.connect();
    }
  };

  const onNewMessage = (callback: (data: any) => void) => {
    if (socket.current) {
      socket.current.on('new-message', callback);
    }
  };

  const onUserJoined = (callback: (data: { userId: string; username: string }) => void) => {
    if (socket.current) {
      socket.current.on('user-joined', callback);
    }
  };

  const onUserLeft = (callback: (data: { userId: string; username: string }) => void) => {
    if (socket.current) {
      socket.current.on('user-left', callback);
    }
  };

  const startVoice = (roomId: string) => {
    if (socket.current) {
      socket.current.emit('start-voice', roomId);
    }
  };

  const stopVoice = (roomId: string) => {
    if (socket.current) {
      socket.current.emit('stop-voice', roomId);
    }
  };

  return {
    socket: socket.current,
    isConnected,
    joinRoom,
    leaveRoom,
    sendMessage,
    onNewMessage,
    onUserJoined,
    onUserLeft,
    startVoice,
    stopVoice,
  };
}; 