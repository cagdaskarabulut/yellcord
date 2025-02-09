import { NextResponse } from "next/server";
import { Server as NetServer } from "http";
import { NextApiRequest, NextApiResponse } from "next";
import { Server as SocketServer } from "socket.io";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { Socket } from 'net';

export async function GET(req: NextApiRequest, res: NextApiResponse & { socket: Socket & { server: NetServer & { io?: SocketServer } } }): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!res.socket || !res.socket.server) {
    return NextResponse.json({ error: "Socket server is not defined" }, { status: 500 });
  }

  if (!res.socket.server.io) {
    const httpServer: NetServer = res.socket.server as any;
    const io = new SocketServer(httpServer, {
      path: "/api/socket",
      addTrailingSlash: false,
    });

    res.socket.server.io = io;

    // WebRTC olaylarını ekle
    io.on('connection', (socket) => {
      // Sesli/görüntülü aramaya katılma
      socket.on('join-call', ({ roomId, userId }) => {
        socket.to(roomId).emit('user-joined-call', { userId });
      });

      // Ekran paylaşımına katılma
      socket.on('join-screen-share', ({ roomId, userId }) => {
        socket.to(roomId).emit('user-joined-call', { userId });
      });

      // Aramadan ayrılma
      socket.on('leave-call', ({ roomId, userId }) => {
        socket.to(roomId).emit('user-left-call', { userId });
      });

      // WebRTC sinyal olayları
      socket.on('call-offer', ({ offer, targetUserId, roomId }) => {
        socket.to(roomId).emit('call-offer', {
          offer,
          userId: socket.data.userId,
        });
      });

      socket.on('call-answer', ({ answer, targetUserId, roomId }) => {
        socket.to(roomId).emit('call-answer', {
          answer,
          userId: socket.data.userId,
        });
      });

      socket.on('ice-candidate', ({ candidate, targetUserId, roomId }) => {
        socket.to(roomId).emit('ice-candidate', {
          candidate,
          userId: socket.data.userId,
        });
      });
    });
  }

  return NextResponse.json({ success: true });
} 