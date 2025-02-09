"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Camera, Key, Save } from "lucide-react";

interface ProfileFormData {
  username: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  avatar: File | null;
}

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [formData, setFormData] = useState<ProfileFormData>({
    username: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    avatar: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      setFormData((prev) => ({
        ...prev,
        username: session.user.name || "",
        email: session.user.email || "",
      }));
    }
  }, [session]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, avatar: file }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("username", formData.username);
      formDataToSend.append("email", formData.email);
      if (formData.currentPassword) {
        formDataToSend.append("currentPassword", formData.currentPassword);
      }
      if (formData.newPassword) {
        formDataToSend.append("newPassword", formData.newPassword);
      }
      if (formData.avatar) {
        formDataToSend.append("avatar", formData.avatar);
      }

      const response = await fetch("/api/users/profile", {
        method: "PATCH",
        body: formDataToSend,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      const data = await response.json();
      await update({
        ...session,
        user: {
          ...session?.user,
          name: data.user.username,
          email: data.user.email,
          image: data.user.avatar_url,
        },
      });

      setSuccess("Profil başarıyla güncellendi");
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <div className="max-w-2xl mx-auto bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Profil Ayarları</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-500 text-white rounded">{error}</div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-500 text-white rounded">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Bölümü */}
          <div className="flex items-center space-x-6">
            <div className="relative">
              {previewUrl || session?.user?.image ? (
                <Image
                  src={previewUrl || session?.user?.image || ""}
                  alt="Profil"
                  width={100}
                  height={100}
                  className="rounded-full"
                />
              ) : (
                <div className="w-24 h-24 bg-indigo-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl">
                    {session?.user?.name?.[0].toUpperCase()}
                  </span>
                </div>
              )}
              <label className="absolute bottom-0 right-0 bg-indigo-600 p-2 rounded-full cursor-pointer hover:bg-indigo-700">
                <Camera size={16} className="text-white" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </label>
            </div>
            <div>
              <h2 className="text-xl text-white">{session?.user?.name}</h2>
              <p className="text-gray-400">{session?.user?.email}</p>
            </div>
          </div>

          {/* Kullanıcı Bilgileri */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Kullanıcı Adı
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className="w-full p-2 bg-gray-700 text-white rounded focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full p-2 bg-gray-700 text-white rounded focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Şifre Değiştirme */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center">
              <Key size={20} className="mr-2" />
              Şifre Değiştir
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Mevcut Şifre
                </label>
                <input
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      currentPassword: e.target.value,
                    })
                  }
                  className="w-full p-2 bg-gray-700 text-white rounded focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Yeni Şifre
                </label>
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, newPassword: e.target.value })
                  }
                  className="w-full p-2 bg-gray-700 text-white rounded focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Yeni Şifre (Tekrar)
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full p-2 bg-gray-700 text-white rounded focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Kaydet Butonu */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center"
          >
            <Save size={20} className="mr-2" />
            {isLoading ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
          </button>
        </form>
      </div>
    </div>
  );
}
