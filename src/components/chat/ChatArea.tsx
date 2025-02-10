"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Send, Edit2, Trash2, Phone, Video, Monitor } from "lucide-react";
import Image from "next/image";
import { useSocket } from "@/hooks/useSocket";
import { useWebRTC } from "@/hooks/useWebRTC";

interface Message {
  id: number;
  content: string;
  user_id: number;
  created_at: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    avatar_url: string | null;
    username: string | null;
  };
}

export default function ChatArea({ roomId }: { roomId: string }) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { socket, isConnected, joinRoom, leaveRoom, sendMessage } = useSocket();
  const {
    localStream,
    remoteStreams,
    startCall,
    stopCall,
    startScreenShare,
    isScreenSharing,
  } = useWebRTC(roomId, session?.user?.id || "");

  useEffect(() => {
    fetchMessages();

    // Socket bağlantısı kurulduğunda odaya katıl
    if (isConnected) {
      joinRoom(roomId);

      socket?.on("new-message", (message: Message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
        scrollToBottom();
      });

      socket?.on("error", (error) => {
        console.error("Socket hatası:", error);
        alert(error.message);
      });

      return () => {
        leaveRoom(roomId);
        socket?.off("new-message");
        socket?.off("error");
      };
    }
  }, [roomId, socket, isConnected]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/messages?roomId=${roomId}`);
      const data = await response.json();
      setMessages(data.messages);
      scrollToBottom();
    } catch (error) {
      console.error("Mesajlar yüklenirken hata oluştu:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === "") return;

    try {
      // Mesajı API üzerinden gönder
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newMessage,
          roomId: roomId,
        }),
      });

      if (!response.ok) {
        throw new Error("Mesaj gönderilemedi");
      }

      // Kaydedilen mesajı al
      const savedMessage = await response.json();

      // Mesajı ekrana ekle
      setMessages((prevMessages) => [...prevMessages, savedMessage]);
      scrollToBottom();

      // Input'u temizle
      setNewMessage("");
    } catch (error) {
      console.error("Mesaj gönderilirken hata:", error);
      alert("Mesaj gönderilemedi");
    }
  };

  const handleDeleteMessage = async (id: number) => {
    if (!window.confirm("Bu mesajı silmek istediğinizden emin misiniz?")) {
      return;
    }

    try {
      const response = await fetch(`/api/messages/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Mesaj silinemedi");
      }

      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.id !== id)
      );
    } catch (error) {
      console.error("Mesaj silinirken hata:", error);
      alert("Mesaj silinirken bir hata oluştu");
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Medya Kontrolleri */}
      <div className="bg-gray-800 p-4 flex items-center justify-end space-x-4 border-b border-gray-700 sticky top-0 z-10">
        <button
          onClick={() => (localStream ? stopCall() : startCall("audio"))}
          className={`p-2 rounded-full ${
            localStream?.getAudioTracks()?.length
              ? "bg-red-600 hover:bg-red-700"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
          title="Sesli Arama"
        >
          <Phone size={20} className="text-white" />
        </button>
        <button
          onClick={() => (localStream ? stopCall() : startCall("video"))}
          className={`p-2 rounded-full ${
            localStream?.getVideoTracks()?.length
              ? "bg-red-600 hover:bg-red-700"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
          title="Görüntülü Arama"
        >
          <Video size={20} className="text-white" />
        </button>
        <button
          onClick={() => (isScreenSharing ? stopCall() : startScreenShare())}
          className={`p-2 rounded-full ${
            isScreenSharing
              ? "bg-red-600 hover:bg-red-700"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
          title="Ekran Paylaşımı"
        >
          <Monitor size={20} className="text-white" />
        </button>
      </div>

      {/* Video Görüntüleri */}
      {((localStream?.getVideoTracks()?.length ?? 0) > 0 ||
        (remoteStreams?.size ?? 0) > 0) && (
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-900">
          {(localStream?.getVideoTracks()?.length ?? 0) > 0 && (
            <div className="relative">
              <video
                ref={(video) => {
                  if (video && localStream) {
                    video.srcObject = localStream;
                    video.play().catch(console.error);
                  }
                }}
                autoPlay
                muted
                playsInline
                className="w-full rounded-lg"
              />
              <span className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
                Sen
              </span>
            </div>
          )}
          {Array.from(remoteStreams?.entries() ?? []).map(
            ([userId, stream]) => (
              <div key={userId} className="relative">
                <video
                  ref={(video) => {
                    if (video && stream) {
                      video.srcObject = stream;
                      video.play().catch(console.error);
                    }
                  }}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg"
                />
                <span className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
                  Diğer Kullanıcı
                </span>
              </div>
            )
          )}
        </div>
      )}

      {/* Mesajlar */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${
              message.user_id === parseInt(session?.user?.id || "0")
                ? "flex-row-reverse space-x-reverse"
                : ""
            }`}
          >
            <div className="flex-shrink-0">
              {message.user?.avatar_url ? (
                <Image
                  src={message.user.avatar_url}
                  alt={message.user.username || message.user.email}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {message.user.username
                      ? message.user.username.substring(0, 2).toUpperCase()
                      : message.user.email.substring(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div
              className={`max-w-[70%] ${
                message.user_id === parseInt(session?.user?.id || "0")
                  ? "bg-indigo-600"
                  : "bg-gray-700"
              } rounded-lg p-3`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-300 text-sm font-medium">
                  {message.user.username || message.user.email.split("@")[0]}
                </span>
                <span className="text-gray-400 text-xs">
                  {new Date(message.created_at).toLocaleTimeString("tr-TR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-white">{message.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Mesaj Gönderme Formu */}
      <div className="p-4 bg-gray-800 border-t border-gray-700 sticky bottom-0">
        <form
          onSubmit={handleSendMessage}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Bir mesaj yaz..."
            className="flex-1 bg-gray-700 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
