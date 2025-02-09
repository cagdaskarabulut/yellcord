"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { UserMinus, UserPlus } from "lucide-react";

interface Member {
  id: number;
  username: string;
  avatar_url: string | null;
  joined_at: string;
  is_creator: boolean;
}

interface MembersListProps {
  roomId: string;
  isCreator: boolean;
}

export default function MembersList({ roomId, isCreator }: MembersListProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteLink, setInviteLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/rooms/${roomId}/members`);
      const data = await response.json();
      setMembers(data.members);
    } catch (error) {
      console.error("Üyeler yüklenirken hata oluştu:", error);
    }
  };

  const generateInviteLink = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/rooms/${roomId}/invite`, {
        method: "POST",
      });
      const data = await response.json();
      setInviteLink(data.inviteLink);
    } catch (error) {
      console.error("Davet linki oluşturulamadı:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeMember = async (memberId: number) => {
    if (
      !window.confirm("Bu üyeyi odadan çıkarmak istediğinizden emin misiniz?")
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/rooms/${roomId}/members/${memberId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Üye çıkarılamadı");
      }

      fetchMembers();
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-500 text-white rounded">{error}</div>
      )}

      <div className="flex justify-between items-center">
        <h3 className="text-white font-semibold">Üyeler ({members.length})</h3>
        {isCreator && (
          <button
            onClick={generateInviteLink}
            disabled={isLoading}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            <UserPlus size={16} className="inline-block mr-2" />
            Davet Linki Oluştur
          </button>
        )}
      </div>

      {inviteLink && (
        <div className="p-4 bg-gray-700 rounded">
          <p className="text-sm text-gray-300 mb-2">Davet Linki:</p>
          <div className="flex">
            <input
              type="text"
              value={inviteLink}
              readOnly
              className="flex-1 bg-gray-600 text-white p-2 rounded-l"
            />
            <button
              onClick={() => navigator.clipboard.writeText(inviteLink)}
              className="bg-indigo-600 text-white px-4 rounded-r hover:bg-indigo-700"
            >
              Kopyala
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-2 rounded bg-gray-700"
          >
            <div className="flex items-center space-x-3">
              {member.avatar_url ? (
                <Image
                  src={member.avatar_url}
                  alt={member.username}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">
                    {member.username[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <p className="text-white text-sm">
                  {member.username}
                  {member.is_creator && (
                    <span className="ml-2 text-xs bg-indigo-600 text-white px-2 py-1 rounded">
                      Kurucu
                    </span>
                  )}
                </p>
                <p className="text-gray-400 text-xs">
                  Katılma: {new Date(member.joined_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {isCreator && !member.is_creator && (
              <button
                onClick={() => removeMember(member.id)}
                className="text-red-400 hover:text-red-500"
              >
                <UserMinus size={20} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
