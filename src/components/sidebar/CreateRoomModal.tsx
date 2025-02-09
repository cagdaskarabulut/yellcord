"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface CreateRoomModalProps {
  onClose: () => void;
  onCreated?: () => void;
}

export default function CreateRoomModal({
  onClose,
  onCreated,
}: CreateRoomModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    logo: null as File | null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      if (formData.logo) {
        formDataToSend.append("logo", formData.logo);
      }

      const res = await fetch("/api/rooms", {
        method: "POST",
        body: formDataToSend,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Oda oluşturulamadı");
      }

      onCreated?.();
      onClose();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Yeni Oda Oluştur</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-500 text-white rounded">
              {error}
            </div>
          )}

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
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Logo (İsteğe bağlı)
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
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {isLoading ? "Oluşturuluyor..." : "Oda Oluştur"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
