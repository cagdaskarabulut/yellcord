"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";

interface Room {
  id: number;
  name: string;
  type: "text" | "voice";
  logo_url: string | null;
  member_count: number;
}

export default function InvitePage() {
  const router = useRouter();
  const params = useParams(); // Next.js 15 için doğru kullanım
  const { data: session, status } = useSession();
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push(`/login?redirect=/invite/${params.code}`);
      return;
    }

    fetchInviteDetails();
  }, [session, status, params.code]);

  const fetchInviteDetails = async () => {
    try {
      const response = await fetch(`/api/invites/${params.code}`);
      if (!response.ok) {
        throw new Error("Davet geçersiz veya süresi dolmuş");
      }
      const data = await response.json();
      setRoom(data.room);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      const response = await fetch(`/api/invites/${params.code}/join`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Odaya katılırken bir hata oluştu");
      }

      const data = await response.json();
      router.push(`/room/${data.roomId}`);
    } catch (error: any) {
      setError(error.message);
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Yükleniyor...</div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-white mb-4">Hata</h1>
          <p className="text-red-400">{error || "Davet bulunamadı"}</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="flex items-center space-x-4 mb-6">
          {room.logo_url ? (
            <Image
              src={room.logo_url}
              alt={room.name}
              width={64}
              height={64}
              className="rounded-full"
            />
          ) : (
            <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl">
                {room.name[0].toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white">{room.name}</h1>
            <p className="text-gray-400">{room.member_count} üye</p>
          </div>
        </div>
        <p className="text-gray-300 mb-6">
          {session?.user?.name}, {room.name} odasına davet edildiniz.
        </p>

        <div className="space-y-4">
          <button
            onClick={handleJoin}
            disabled={isJoining}
            className="w-full bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {isJoining ? "Katılınıyor..." : "Odaya Katıl"}
          </button>
          <button
            onClick={() => router.push("/")}
            className="w-full bg-gray-700 text-white p-3 rounded-lg hover:bg-gray-600"
          >
            Vazgeç
          </button>
        </div>
      </div>
    </div>
  );
}
