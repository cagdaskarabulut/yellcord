import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const roomId = searchParams.get("roomId");

    if (!roomId) {
      return NextResponse.json(
        { error: "Oda ID'si gerekli" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
      SELECT 
        m.*,
        json_build_object(
          'id', u.id,
          'username', u.username,
          'name', u.username,
          'email', u.email,
          'avatar_url', u.avatar_url,
          'image', u.avatar_url
        ) as user
      FROM yellcord_messages m
      JOIN yellcord_users u ON m.user_id = u.id
      WHERE m.room_id = $1
      ORDER BY m.created_at ASC
      `,
      [roomId]
    );

    return NextResponse.json({ messages: result.rows });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Mesajlar yüklenirken hata oluştu" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content, roomId } = await request.json();

    if (!content || !roomId) {
      return NextResponse.json(
        { error: "Mesaj içeriği ve oda ID'si gerekli" },
        { status: 400 }
      );
    }

    // Kullanıcının odaya üye olup olmadığını kontrol et
    const memberCheck = await pool.query(
      `
      SELECT 1 FROM yellcord_room_members
      WHERE room_id = $1 AND user_id = $2
      `,
      [roomId, session.user.id]
    );

    if (memberCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Bu odaya mesaj gönderme yetkiniz yok" },
        { status: 403 }
      );
    }

    // Mesajı veritabanına kaydet ve kullanıcı bilgileriyle birlikte döndür
    const result = await pool.query(
      `
      WITH inserted_message AS (
        INSERT INTO yellcord_messages (content, room_id, user_id)
        VALUES ($1, $2, $3)
        RETURNING id, content, room_id, user_id, created_at
      )
      SELECT 
        m.*,
        json_build_object(
          'id', u.id,
          'username', u.username,
          'name', u.username,
          'email', u.email,
          'avatar_url', u.avatar_url,
          'image', u.avatar_url
        ) as user
      FROM inserted_message m
      JOIN yellcord_users u ON m.user_id = u.id
      `,
      [content, roomId, session.user.id]
    );

    const savedMessage = result.rows[0];
    console.log("Mesaj kaydedildi:", savedMessage);

    // @ts-ignore
    const res = request as any;
    if (res?.socket?.server?.io) {
      res.socket.server.io.to(roomId).emit('new-message', savedMessage);
      console.log("Mesaj socket üzerinden iletildi");
    }

    return NextResponse.json(savedMessage, { status: 201 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Mesaj gönderilirken hata oluştu" },
      { status: 500 }
    );
  }
} 