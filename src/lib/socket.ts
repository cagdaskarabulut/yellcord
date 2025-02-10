import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { NextApiRequest } from "next";
import { NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import pool from "./db";

export type NextApiResponseServerIO = NextApiResponse & {
  socket: any & {
    server: any & {
      io: SocketIOServer;
    };
  };
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function SocketHandler(
  req: NextApiRequest,
  res: NextApiResponseServerIO
) {
  if (!res.socket.server.io) {
    const httpServer: NetServer = res.socket.server as any;
    const io = new SocketIOServer(httpServer, {
      path: "/api/socket",
      addTrailingSlash: false,
    });

    io.on("connection", async (socket) => {
      const session = await getSession({ req });
      if (!session?.user) {
        socket.disconnect();
        return;
      }

      const userId = session.user.id;

      // Kullanıcı durumunu çevrimiçi olarak güncelle
      await pool.query(
        `UPDATE yellcord_users SET is_online = true WHERE id = $1`,
        [userId]
      );

      // Kullanıcının odalarına katıl
      const rooms = await pool.query(
        `SELECT room_id FROM yellcord_room_members WHERE user_id = $1`,
        [userId]
      );

      rooms.rows.forEach((room) => {
        socket.join(`room:${room.room_id}`);
      });

      // Mesaj gönderme
      socket.on("send-message", async (data: { roomId: string; content: string }) => {
        try {
          const result = await pool.query(
            `
            INSERT INTO yellcord_messages (room_id, user_id, content)
            VALUES ($1, $2, $3)
            RETURNING id, content, created_at
            `,
            [data.roomId, userId, data.content]
          );

          const message = result.rows[0];
          const userResult = await pool.query(
            `SELECT id, username as name, avatar_url as image FROM yellcord_users WHERE id = $1`,
            [userId]
          );

          const fullMessage = {
            ...message,
            user: userResult.rows[0],
          };

          io.to(`room:${data.roomId}`).emit("new-message", fullMessage);
        } catch (error) {
          console.error("Mesaj gönderilirken hata:", error);
        }
      });

      // Medya durumu değişiklikleri
      socket.on(
        "media-state-change",
        async (data: { roomId: string; type: string; active: boolean }) => {
          try {
            let updateField = "";
            switch (data.type) {
              case "voice":
                updateField = "is_speaking";
                break;
              case "video":
                updateField = "is_video_on";
                break;
              case "screen":
                updateField = "is_screen_sharing";
                break;
            }

            if (updateField) {
              await pool.query(
                `UPDATE yellcord_room_members SET ${updateField} = $1 WHERE room_id = $2 AND user_id = $3`,
                [data.active, data.roomId, userId]
              );

              io.to(`room:${data.roomId}`).emit("user-media-state-changed", {
                userId,
                type: data.type,
                active: data.active,
              });
            }
          } catch (error) {
            console.error("Medya durumu güncellenirken hata:", error);
          }
        }
      );

      // WebRTC sinyalleri
      socket.on("offer", (data: { offer: any; userId: string; roomId: string }) => {
        socket.to(`room:${data.roomId}`).emit("offer", {
          offer: data.offer,
          userId,
        });
      });

      socket.on("answer", (data: { answer: any; userId: string; roomId: string }) => {
        socket.to(`room:${data.roomId}`).emit("answer", {
          answer: data.answer,
          userId,
        });
      });

      socket.on(
        "ice-candidate",
        (data: { candidate: any; userId: string; roomId: string }) => {
          socket.to(`room:${data.roomId}`).emit("ice-candidate", {
            candidate: data.candidate,
            userId,
          });
        }
      );

      // Kullanıcı çevrimdışı olduğunda
      socket.on("disconnect", async () => {
        try {
          // Kullanıcının tüm medya durumlarını sıfırla
          await pool.query(
            `
            UPDATE yellcord_room_members 
            SET is_speaking = false, is_video_on = false, is_screen_sharing = false 
            WHERE user_id = $1
            `,
            [userId]
          );

          // Kullanıcıyı çevrimdışı olarak işaretle
          await pool.query(
            `UPDATE yellcord_users SET is_online = false WHERE id = $1`,
            [userId]
          );

          io.emit("user-offline", userId);
        } catch (error) {
          console.error("Kullanıcı çıkışı işlenirken hata:", error);
        }
      });
    });

    res.socket.server.io = io;
  }

  res.end();
}
