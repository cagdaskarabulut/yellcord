"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ChatArea from "@/components/chat/ChatArea";

interface Props {
  roomId: string;
}

export default function RoomPage({ roomId }: Props) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    const fetchRoom = async () => {
      try {
        const response = await fetch(`/api/rooms/${roomId}`);
        if (!response.ok) {
          throw new Error("Oda bulunamadı");
        }
        const data = await response.json();
        setRoom(data.room);
      } catch (error) {
        console.error("Oda yüklenirken hata:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchRoom();
    }
  }, [roomId, status, router]);

  if (loading || !room) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1">
        <ChatArea roomId={roomId} />
      </div>
    </div>
  );
}
