"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Room {
  id: number;
  name: string;
  type: "text" | "voice";
  logo_url: string | null;
}

export default function RoomList() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
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

  if (isLoading) {
    return (
      <div className="flex-1 p-4">
        <p className="text-gray-400">Odalar yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {rooms.length === 0 ? (
        <div className="p-4">
          <p className="text-gray-400">Henüz hiç oda yok</p>
        </div>
      ) : (
        <div className="p-2 space-y-2">
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
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
