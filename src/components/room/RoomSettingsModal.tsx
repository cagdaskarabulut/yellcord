"use client";

import { useState } from "react";
import { X, Settings, Users, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface RoomSettingsModalProps {
  room: {
    id: string;
    name: string;
    logo_url: string | null;
    created_by: string;
  };
  onClose: () => void;
  isCreator: boolean;
}

export default function RoomSettingsModal({
  room,
  onClose,
  isCreator,
}: RoomSettingsModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"general" | "members" | "danger">(
    "general"
  );
  const [formData, setFormData] = useState({
    name: room.name,
    logo: null as File | null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setIsLoading(true);
    setError("");

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      if (formData.logo) {
        formDataToSend.append("logo", formData.logo);
      }

      const res = await fetch(`/api/rooms/${room.id}`, {
        method: "PATCH",
        body: formDataToSend,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Oda güncellenemedi");
      }

      router.refresh();
      onClose();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!window.confirm("Bu odayı silmek istediğinizden emin misiniz?")) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/rooms/${room.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Oda silinemedi");
      }

      router.push("/");
      router.refresh();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Oda Ayarları</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="flex">
          {/* Sol sidebar - Menü */}
          <div className="w-48 border-r border-gray-700 p-4">
            <button
              onClick={() => setActiveTab("general")}
              className={`w-full text-left px-4 py-2 rounded-md ${
                activeTab === "general"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:bg-gray-700"
              }`}
            >
              <Settings size={16} className="inline-block mr-2" />
              Genel
            </button>
            <button
              onClick={() => setActiveTab("members")}
              className={`w-full text-left px-4 py-2 rounded-md mt-2 ${
                activeTab === "members"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:bg-gray-700"
              }`}
            >
              <Users size={16} className="inline-block mr-2" />
              Üyeler
            </button>
            {isCreator && (
              <button
                onClick={() => setActiveTab("danger")}
                className={`w-full text-left px-4 py-2 rounded-md mt-2 ${
                  activeTab === "danger"
                    ? "bg-red-600 text-white"
                    : "text-red-400 hover:bg-red-900"
                }`}
              >
                <Trash2 size={16} className="inline-block mr-2" />
                Tehlikeli Bölge
              </button>
            )}
          </div>

          {/* Sağ taraf - İçerik */}
          <div className="flex-1 p-4">
            {error && (
              <div className="mb-4 p-3 bg-red-500 text-white rounded">
                {error}
              </div>
            )}

            {activeTab === "general" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Oda Adı
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full p-2 bg-gray-700 text-white rounded"
                    disabled={!isCreator}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Logo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        logo: e.target.files ? e.target.files[0] : null,
                      })
                    }
                    className="w-full p-2 bg-gray-700 text-white rounded"
                    disabled={!isCreator}
                  />
                </div>

                {isCreator && (
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isLoading ? "Kaydediliyor..." : "Kaydet"}
                  </button>
                )}
              </div>
            )}

            {activeTab === "members" && (
              <MembersList roomId={room.id} isCreator={isCreator} />
            )}

            {activeTab === "danger" && isCreator && (
              <div className="space-y-4">
                <div className="p-4 bg-red-900 text-white rounded">
                  <h3 className="text-lg font-semibold mb-2">
                    Tehlikeli Bölge
                  </h3>
                  <p className="text-sm">
                    Bu bölgedeki işlemler geri alınamaz. Dikkatli olun!
                  </p>
                </div>

                <button
                  onClick={handleDeleteRoom}
                  disabled={isLoading}
                  className="w-full bg-red-600 text-white p-2 rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {isLoading ? "Siliniyor..." : "Odayı Sil"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
