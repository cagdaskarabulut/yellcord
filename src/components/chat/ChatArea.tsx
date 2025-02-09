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
    image: string | null;
  };
}

export default function ChatArea({ roomId }: { roomId: string }) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { socket, joinRoom, leaveRoom, sendMessage, onNewMessage } =
    useSocket();
  const {
    localStream,
    remoteStreams,
    startCall,
    stopCall,
    startScreenShare,
    isScreenSharing,
  } = useWebRTC(roomId, session?.user?.id || "");

  // Odaya katıl ve mesajları yükle
  useEffect(() => {
    fetchMessages();

    if (socket) {
      joinRoom(roomId);

      // Yeni mesaj dinleyicisi
      socket.on("new-message", (message: Message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
        scrollToBottom();
      });

      // Component unmount olduğunda
      return () => {
        leaveRoom(roomId);
        socket.off("new-message");
      };
    }
  }, [roomId, socket]);

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
    if (!newMessage.trim() || !session?.user) return;

    try {
      if (editingMessage) {
        // Mesaj düzenleme
        const response = await fetch(`/api/messages/${editingMessage.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newMessage }),
        });

        if (!response.ok) throw new Error("Mesaj düzenlenemedi");

        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === editingMessage.id ? { ...msg, content: newMessage } : msg
          )
        );
        setEditingMessage(null);
      } else {
        // Önce socket üzerinden gönder
        sendMessage(roomId, newMessage);

        // Geçici mesajı state'e ekle
        const tempMessage: Message = {
          id: Date.now(),
          content: newMessage,
          user_id: parseInt(session.user.id),
          created_at: new Date().toISOString(),
          user: {
            id: session.user.id,
            name: session.user.name || "",
            image: session.user.image || null,
          },
        };

        setMessages((prevMessages) => [...prevMessages, tempMessage]);
        scrollToBottom();

        // Sonra veritabanına kaydet
        const response = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newMessage, roomId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          // Hata durumunda geçici mesajı kaldır
          setMessages((prevMessages) =>
            prevMessages.filter((msg) => msg.id !== tempMessage.id)
          );
          throw new Error(errorData.error || "Mesaj gönderilemedi");
        }
      }

      setNewMessage("");
    } catch (error: any) {
      console.error("Mesaj gönderilirken hata:", error);
      alert(error.message || "Mesaj gönderilemedi");
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!window.confirm("Bu mesajı silmek istediğinizden emin misiniz?"))
      return;

    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Mesaj silinemedi");

      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.id !== messageId)
      );
    } catch (error) {
      console.error("Mesaj silinirken hata:", error);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Medya Kontrolleri */}
      <div className="bg-gray-800 p-4 flex items-center justify-end space-x-4 border-b border-gray-700">
        <button
          onClick={() => (localStream ? stopCall() : startCall("audio"))}
          className={`p-2 rounded-full ${
            localStream?.getAudioTracks().length
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
            localStream?.getVideoTracks().length
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
      {(localStream?.getVideoTracks().length > 0 || remoteStreams.size > 0) && (
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-900">
          {localStream?.getVideoTracks().length > 0 && (
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
          {Array.from(remoteStreams.entries()).map(([userId, stream]) => (
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
          ))}
        </div>
      )}

      {/* Mesajlar */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${
              message.user?.id === session?.user?.id ? "justify-end" : ""
            }`}
          >
            {message.user?.id !== session?.user?.id && (
              <div className="flex-shrink-0">
                {message.user?.image ? (
                  <Image
                    src={message.user.image}
                    alt={message.user.name || ""}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">
                      {message.user?.name?.[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            )}
            <div
              className={`max-w-[70%] ${
                message.user?.id === session?.user?.id
                  ? "bg-indigo-600"
                  : "bg-gray-700"
              } rounded-lg p-3`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-300 text-sm">
                  {message.user?.name}
                </span>
                <span className="text-gray-400 text-xs">
                  {new Date(message.created_at).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-white">{message.content}</p>
              {message.user?.id === session?.user?.id && (
                <div className="flex items-center justify-end mt-2 space-x-2">
                  <button
                    onClick={() => {
                      setEditingMessage(message);
                      setNewMessage(message.content);
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteMessage(message.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Mesaj gönderme formu */}
      <form onSubmit={handleSendMessage} className="p-4 bg-gray-800">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={
              editingMessage ? "Mesajı düzenle..." : "Bir mesaj yaz..."
            }
            className="flex-1 bg-gray-700 text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}
