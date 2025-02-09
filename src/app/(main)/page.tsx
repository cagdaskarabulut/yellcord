"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MessageSquare, Mic, Users, Plus, Hash, Settings } from "lucide-react";

interface Room {
  id: number;
  name: string;
  type: "text" | "voice";
  logo_url: string | null;
  member_count: number;
  last_message?: string;
}

interface User {
  id: number;
  username: string;
  avatar_url: string | null;
  is_online: boolean;
}

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [recentRooms, setRecentRooms] = useState<Room[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roomsRes, usersRes] = await Promise.all([
          fetch("/api/rooms"),
          fetch("/api/users"),
        ]);

        const [roomsData, usersData] = await Promise.all([
          roomsRes.json(),
          usersRes.json(),
        ]);

        setRecentRooms(roomsData.rooms || []);
        setOnlineUsers(usersData.users || []);
      } catch (error) {
        console.error("Veri yüklenirken hata oluştu:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (!session) return null;

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sol Sidebar - Odalar */}

      {/* Ana İçerik */}
      <div className="flex-1 flex flex-col">
        {/* Üst Bar */}
        <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center px-4">
          <h2 className="text-white font-medium">Ana Sayfa</h2>
        </div>

        {/* İçerik Alanı */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Hoş Geldin Kartı */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">
              Hoş geldin, {session.user?.name}!
            </h1>
            <p className="text-gray-400">
              Yellcord'da sohbet etmeye başlamak için bir oda seç veya yeni bir
              oda oluştur.
            </p>
          </div>

          {/* Aktif Kullanıcılar */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <Users className="mr-2" size={20} />
                Çevrimiçi Kullanıcılar
              </h2>
              <span className="text-gray-400 text-sm">
                {onlineUsers?.filter((u) => u.is_online)?.length || 0} aktif
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {onlineUsers?.map((user) => (
                <div
                  key={user.id}
                  className="bg-gray-700 rounded-lg p-4 flex items-center space-x-3"
                >
                  {user.avatar_url ? (
                    <Image
                      src={user.avatar_url}
                      alt={user.username}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">
                        {user.username[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-white font-medium">{user.username}</p>
                    <div className="flex items-center space-x-1">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          user.is_online ? "bg-green-500" : "bg-gray-500"
                        }`}
                      />
                      <span className="text-gray-400 text-sm">
                        {user.is_online ? "Çevrimiçi" : "Çevrimdışı"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
