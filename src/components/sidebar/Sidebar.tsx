"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import Image from "next/image";
import CreateRoomModal from "./CreateRoomModal";

interface Room {
  id: number;
  name: string;
  type: "text" | "voice";
  logo_url: string | null;
  member_count: number;
}

export default function Sidebar() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch("/api/rooms");
      const data = await response.json();
      setRooms(data.rooms);
    } catch (error) {
      console.error("Odalar yüklenirken hata oluştu:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Üst kısım - Yeni Oda Oluştur */}
      <div className="p-4 border-b border-gray-700">
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-md"
        >
          <Plus size={20} />
          <span>Yeni Oda Oluştur</span>
        </button>
      </div>

      {/* Odalar Listesi */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {isLoading ? (
          <div className="text-gray-400 text-center p-4">Yükleniyor...</div>
        ) : !rooms || rooms.length === 0 ? (
          <div className="text-gray-400 text-center p-4">Henüz hiç oda yok</div>
        ) : (
          <>
            <span>ODALAR ({rooms?.length || 0})</span>
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => router.push(`/room/${room.id}`)}
                className="w-full flex items-center space-x-3 p-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                {room.logo_url ? (
                  <Image
                    src={room.logo_url}
                    alt={room.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {room.name[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 text-left">
                  <h3 className="text-white font-medium">{room.name}</h3>
                  <p className="text-sm text-gray-400">
                    {room.member_count} üye
                  </p>
                </div>
              </button>
            ))}
          </>
        )}
      </div>

      {isCreateModalOpen && (
        <CreateRoomModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={fetchRooms}
        />
      )}
    </div>
  );
}
