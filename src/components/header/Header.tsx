"use client";

import { User } from "next-auth";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";
import { LogOut, Settings, User as UserIcon } from "lucide-react";
import NotificationDropdown from "../notifications/NotificationDropdown";
import { useRouter } from "next/navigation";

interface HeaderProps {
  user: User;
}

export default function Header({ user }: HeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="h-full px-4 flex items-center justify-between">
      <h1
        className="text-white font-semibold cursor-pointer"
        onClick={() => router.push("/")}
      >
        Yellcord
      </h1>

      <div className="flex items-center space-x-4">
        <NotificationDropdown />

        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center space-x-2 hover:bg-gray-700 p-2 rounded-md"
          >
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name || ""}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white">
                {user.name?.[0].toUpperCase()}
              </div>
            )}
            <span className="text-white">{user.name}</span>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-gray-800 rounded-md shadow-lg py-1 z-50">
              <button
                onClick={() => {
                  /* Profil ayarları */
                }}
                className="w-full flex items-center px-4 py-2 text-sm text-white hover:bg-gray-700"
              >
                <Settings size={16} className="mr-2" />
                Profil Ayarları
              </button>
              <button
                onClick={() => signOut()}
                className="w-full flex items-center px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
              >
                <LogOut size={16} className="mr-2" />
                Çıkış Yap
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
