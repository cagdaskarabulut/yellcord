import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import pool from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");

    if (!roomId) {
      return NextResponse.json(
        { error: "Oda ID'si gerekli" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
      SELECT m.*, u.username, u.avatar_url
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

export async function POST(request: Request) {
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

    const result = await pool.query(
      `
      INSERT INTO yellcord_messages (content, room_id, user_id)
      VALUES ($1, $2, $3)
      RETURNING id, content, created_at
      `,
      [content, roomId, session.user.id]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Mesaj gönderilirken hata oluştu" },
      { status: 500 }
    );
  }
} 