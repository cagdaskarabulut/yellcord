import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import pool from "@/lib/db";

export async function POST(request: NextRequest, context: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = context.params;
    if (!roomId) {
      return NextResponse.json(
        { error: "Oda ID eksik" },
        { status: 400 }
      );
    }

    // Odanın sahibi olup olmadığını kontrol et
    const roomCheck = await pool.query(
      "SELECT created_by FROM yellcord_rooms WHERE id = $1",
      [roomId]
    );

    if (roomCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Oda bulunamadı" },
        { status: 404 }
      );
    }

    if (roomCheck.rows[0]?.created_by !== parseInt(session.user.id)) {
      return NextResponse.json(
        { error: "Davet linki oluşturma yetkiniz yok" },
        { status: 403 }
      );
    }

    const inviteCode = uuidv4();
    const inviteLink = `${process.env.NEXTAUTH_URL}/invite/${inviteCode}`;

    // Davet kodunu veritabanına kaydet
    await pool.query(
      `
      INSERT INTO yellcord_invites (code, room_id, created_by, expires_at)
      VALUES ($1, $2, $3, NOW() + INTERVAL '24 hours')
      `,
      [inviteCode, roomId, session.user.id]
    );

    return NextResponse.json({ inviteLink });
  } catch (error) {
    console.error("Error creating invite:", error);
    return NextResponse.json(
      { error: "Davet linki oluşturulamadı" },
      { status: 500 }
    );
  }
}
