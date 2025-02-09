"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface Notification {
  id: number;
  type: string;
  title: string;
  content: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export default function NotificationDropdown() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications");
      const data = await response.json();
      setNotifications(data.notifications);
      setUnreadCount(
        data.notifications.filter((n: Notification) => !n.is_read).length
      );
    } catch (error) {
      console.error("Bildirimler yüklenirken hata oluştu:", error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (!notification.is_read) {
        await fetch(`/api/notifications/${notification.id}/read`, {
          method: "POST",
        });
        setUnreadCount((prev) => prev - 1);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, is_read: true } : n
          )
        );
      }

      if (notification.link) {
        router.push(notification.link);
      }
      setIsOpen(false);
    } catch (error) {
      console.error("Bildirim işaretlenirken hata oluştu:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Bildirimler işaretlenirken hata oluştu:", error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <h3 className="text-white font-medium">Bildirimler</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-indigo-400 hover:text-indigo-300"
              >
                Tümünü Okundu İşaretle
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-gray-400 text-center">
                Henüz bildirim yok
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full text-left p-4 hover:bg-gray-700 border-b border-gray-700 ${
                    !notification.is_read ? "bg-gray-750" : ""
                  }`}
                >
                  <div className="flex items-start">
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 mr-2" />
                    )}
                    <div className="flex-1">
                      <h4 className="text-white text-sm font-medium">
                        {notification.title}
                      </h4>
                      <p className="text-gray-400 text-sm mt-1">
                        {notification.content}
                      </p>
                      <p className="text-gray-500 text-xs mt-2">
                        {formatDistanceToNow(
                          new Date(notification.created_at),
                          {
                            addSuffix: true,
                            locale: tr,
                          }
                        )}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
