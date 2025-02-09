"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Mic, MicOff, Video, ScreenShare } from "lucide-react";

interface User {
  id: number;
  username: string;
  avatar_url: string | null;
  is_online: boolean;
  is_speaking: boolean;
  is_video_on: boolean;
  is_screen_sharing: boolean;
}

export default function UserList({ roomId }: { roomId: string }) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();

    // WebSocket bağlantısı için event listener'ları ekle
    const socket = new WebSocket(
      process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3000"
    );

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "user_joined":
          setUsers((prev) => [...prev, data.user]);
          break;
        case "user_left":
          setUsers((prev) => prev.filter((user) => user.id !== data.userId));
          break;
        case "user_updated":
          setUsers((prev) =>
            prev.map((user) =>
              user.id === data.user.id ? { ...user, ...data.user } : user
            )
          );
          break;
      }
    };

    return () => {
      socket.close();
    };
  }, [roomId]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/rooms/${roomId}/members`);
      const data = await response.json();
      setUsers(data.members);
    } catch (error) {
      console.error("Kullanıcılar yüklenirken hata oluştu:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onlineUsers = users ? users.filter((user) => user.is_online) : [];
  const offlineUsers = users ? users.filter((user) => !user.is_online) : [];

  if (isLoading) {
    return (
      <div className="w-64 bg-gray-800 p-4">
        <div className="text-gray-400">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-gray-800 flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-white font-semibold">
          Kullanıcılar - {users.length}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {/* Çevrimiçi Kullanıcılar */}
        {onlineUsers.length > 0 && (
          <div className="mb-4">
            <h3 className="text-gray-400 text-sm px-2 mb-2">
              Çevrimiçi - {onlineUsers.length}
            </h3>
            <div className="space-y-1">
              {onlineUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center space-x-2 p-2 rounded hover:bg-gray-700"
                >
                  <div className="relative">
                    {user.avatar_url ? (
                      <Image
                        src={user.avatar_url}
                        alt={user.username}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">
                          {user.username[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-800 ${
                        user.is_online ? "bg-green-500" : "bg-gray-500"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">{user.username}</p>
                    <div className="flex items-center space-x-2 text-xs">
                      {user.is_speaking && (
                        <div className="flex items-center text-green-400">
                          <Mic size={12} className="mr-1" />
                          <span>Konuşuyor</span>
                        </div>
                      )}
                      {user.is_video_on && (
                        <div className="flex items-center text-blue-400">
                          <Video size={12} className="mr-1" />
                          <span>Kamera Açık</span>
                        </div>
                      )}
                      {user.is_screen_sharing && (
                        <div className="flex items-center text-purple-400">
                          <ScreenShare size={12} className="mr-1" />
                          <span>Ekran Paylaşıyor</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Çevrimdışı Kullanıcılar */}
        {offlineUsers.length > 0 && (
          <div>
            <h3 className="text-gray-400 text-sm px-2 mb-2">
              Çevrimdışı - {offlineUsers.length}
            </h3>
            <div className="space-y-1">
              {offlineUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center space-x-2 p-2 rounded hover:bg-gray-700"
                >
                  <div className="relative">
                    {user.avatar_url ? (
                      <Image
                        src={user.avatar_url}
                        alt={user.username}
                        width={32}
                        height={32}
                        className="rounded-full opacity-50"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm opacity-50">
                          {user.username[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-400 text-sm">{user.username}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
