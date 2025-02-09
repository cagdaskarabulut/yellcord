"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload } from "lucide-react";
import Image from "next/image";

export default function CreateRoomPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    logo: null as File | null,
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, logo: file }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

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

      router.push("/");
      router.refresh();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Üst Bar */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white mr-4"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-white">Yeni Oda Oluştur</h1>
        </div>

        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo Yükleme */}
          <div className="flex items-center justify-center">
            <div className="relative">
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt="Oda logosu"
                  width={128}
                  height={128}
                  className="rounded-full"
                />
              ) : (
                <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center">
                  <Upload size={32} className="text-gray-400" />
                </div>
              )}
              <label className="absolute bottom-0 right-0 bg-indigo-600 p-2 rounded-full cursor-pointer hover:bg-indigo-700">
                <Upload size={16} className="text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Oda Bilgileri */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Oda Adı
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full p-3 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Örn: Genel Sohbet"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white p-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? "Oluşturuluyor..." : "Oda Oluştur"}
          </button>
        </form>
      </div>
    </div>
  );
}
