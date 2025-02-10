import { Server, Socket } from "socket.io";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

const ioHandler = async (req: NextRequest) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // @ts-ignore
    if (!global.io) {
      console.log("Socket.IO sunucusu başlatılıyor...");
      // @ts-ignore
      global.io = new Server({
        path: "/api/socket",
        addTrailingSlash: false,
        cors: {
          origin: process.env.NEXTAUTH_URL,
          methods: ["GET", "POST"],
          credentials: true,
        },
        transports: ["websocket", "polling"],
        pingTimeout: 60000,
        pingInterval: 25000,
      });
    }

    // @ts-ignore
    const io = global.io;

    io.on("connection", async (socket: Socket) => {
      console.log("Yeni bağlantı:", socket.id);
      socket.data.userId = session.user.id;

      socket.on("join-room", async (roomId: string) => {
        try {
          // Kullanıcının odaya üye olup olmadığını kontrol et
          const result = await pool.query(
            "SELECT * FROM yellcord_room_members WHERE room_id = $1 AND user_id = $2",
            [roomId, parseInt(session.user.id)]
          );

          if (result.rows.length === 0) {
            socket.emit("error", "Bu odaya erişim izniniz yok");
            return;
          }

          socket.join(roomId);
          console.log(`Kullanıcı ${socket.id} oda ${roomId}'ye katıldı`);

          // Odaya katıldığını diğer kullanıcılara bildir
          socket.to(roomId).emit("user-joined", {
            userId: session.user.id,
            username: session.user.name,
          });
        } catch (error) {
          console.error("Odaya katılma hatası:", error);
          socket.emit("error", "Odaya katılırken bir hata oluştu");
        }
      });

      socket.on("leave-room", (roomId: string) => {
        socket.leave(roomId);
        console.log(`Kullanıcı ${socket.id} oda ${roomId}'den ayrıldı`);

        // Odadan ayrıldığını diğer kullanıcılara bildir
        socket.to(roomId).emit("user-left", {
          userId: session.user.id,
          username: session.user.name,
        });
      });

      socket.on("send-message", async (data: { roomId: string; content: string }) => {
        try {
          // Kullanıcının odaya üye olup olmadığını kontrol et
          const memberCheck = await pool.query(
            "SELECT * FROM yellcord_room_members WHERE room_id = $1 AND user_id = $2",
            [data.roomId, parseInt(session.user.id)]
          );

          if (memberCheck.rows.length === 0) {
            socket.emit("error", "Bu odaya mesaj gönderme yetkiniz yok");
            return;
          }

          // Mesajı veritabanına kaydet
          const result = await pool.query(
            `INSERT INTO yellcord_messages (room_id, user_id, content)
             VALUES ($1, $2, $3)
             RETURNING id, content, created_at,
             (SELECT json_build_object(
               'id', u.id,
               'username', u.username,
               'name', u.username,
               'email', u.email,
               'avatar_url', u.avatar_url,
               'image', u.avatar_url
             ) FROM yellcord_users u WHERE u.id = $2) as user`,
            [data.roomId, parseInt(session.user.id), data.content]
          );

          const savedMessage = result.rows[0];
          console.log("Mesaj kaydedildi:", savedMessage);

          // Mesajı odadaki tüm kullanıcılara gönder
          io.to(data.roomId).emit("new-message", savedMessage);
        } catch (error) {
          console.error("Mesaj gönderme hatası:", error);
          socket.emit("error", "Mesaj gönderilirken bir hata oluştu");
        }
      });

      socket.on("disconnect", () => {
        console.log("Bağlantı kesildi:", socket.id);
      });

      // Hata yakalama
      socket.on("error", (error) => {
        console.error("Socket hatası:", error);
      });
    });

    return new Response("Socket.IO sunucusu başlatıldı", { status: 200 });
  } catch (error) {
    console.error("Socket.IO sunucusu başlatma hatası:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};

export const GET = ioHandler;
export const POST = ioHandler;
