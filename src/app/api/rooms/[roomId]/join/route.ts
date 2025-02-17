import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

export async function POST(request: NextRequest, context: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = context.params;
    if (!roomId) {
      return NextResponse.json({ error: "Oda ID eksik" }, { status: 400 });
    }

    // Odanın public olup olmadığını kontrol et
    const roomCheck = await pool.query(
      "SELECT is_public FROM yellcord_rooms WHERE id = $1",
      [roomId]
    );

    if (roomCheck.rows.length === 0) {
      return NextResponse.json({ error: "Oda bulunamadı" }, { status: 404 });
    }

    const isPublic = roomCheck.rows[0].is_public;

    if (!isPublic) {
      // Kullanıcının davetli olup olmadığını kontrol et
      const inviteCheck = await pool.query(
        "SELECT 1 FROM yellcord_invites WHERE room_id = $1 AND used_by = $2",
        [roomId, session.user.id]
      );

      if (inviteCheck.rows.length === 0) {
        return NextResponse.json(
          { error: "Bu odaya katılma yetkiniz yok" },
          { status: 403 }
        );
      }
    }

    // Kullanıcı zaten üye mi kontrol et
    const memberCheck = await pool.query(
      "SELECT 1 FROM yellcord_room_members WHERE room_id = $1 AND user_id = $2",
      [roomId, session.user.id]
    );

    if (memberCheck.rows.length > 0) {
      return NextResponse.json(
        { message: "Zaten odanın üyesisiniz" },
        { status: 400 }
      );
    }

    // Odaya üye yap
    await pool.query(
      "INSERT INTO yellcord_room_members (room_id, user_id) VALUES ($1, $2)",
      [roomId, session.user.id]
    );

    return NextResponse.json(
      { message: "Odaya başarıyla katıldınız" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error joining room:", error);
    return NextResponse.json(
      { error: "Odaya katılırken hata oluştu" },
      { status: 500 }
    );
  }
}
