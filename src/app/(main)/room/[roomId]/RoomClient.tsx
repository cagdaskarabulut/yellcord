"use client";

import { useState, useEffect } from "react";
import { Session } from "next-auth";
import Image from "next/image";
import { Settings } from "lucide-react";
import ChatArea from "@/components/chat/ChatArea";
import UserList from "@/components/users/UserList";
import RoomSettingsModal from "@/components/room/RoomSettingsModal";

interface Room {
  id: string;
  name: string;
  type: "text" | "voice";
  logo_url: string | null;
  created_by: string;
  creator_name: string;
}

interface RoomClientProps {
  room: Room;
  session: Session;
}

export default function RoomClient({ room, session }: RoomClientProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const isCreator = room.created_by === session.user.id;

  useEffect(() => {
    // Odaya otomatik katıl
    const joinRoom = async () => {
      try {
        const response = await fetch(`/api/rooms/${room.id}/join`, {
          method: "POST",
        });
        if (!response.ok) {
          const data = await response.json();
          console.error("Odaya katılırken hata:", data.error);
        }
      } catch (error) {
        console.error("Odaya katılırken hata:", error);
      }
    };

    joinRoom();
  }, [room.id]);

  return (
    <div className="flex h-full">
      {/* Mesajlaşma alanı */}
      <div className="flex-1">
        <div className="h-14 bg-gray-800 border-b border-gray-900 px-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {room.logo_url ? (
              <Image
                src={room.logo_url}
                alt={room.name}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {room.name[0].toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-white font-semibold">{room.name}</h1>
              <p className="text-gray-400 text-sm">
                İletişim Kanalı •{" "}
                <span className="text-indigo-400">{room.creator_name}</span>
              </p>
            </div>
          </div>

          {isCreator && (
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="text-gray-400 hover:text-white"
            >
              <Settings size={20} />
            </button>
          )}
        </div>

        <ChatArea roomId={room.id} />
      </div>

      {/* Sağ sidebar - Kullanıcı listesi */}
      <UserList roomId={room.id} />

      {/* Oda ayarları modalı */}
      {isSettingsOpen && (
        <RoomSettingsModal
          room={room}
          onClose={() => setIsSettingsOpen(false)}
          isCreator={isCreator}
        />
      )}
    </div>
  );
}
