import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ URL'den `roomId` parametresini al
    const urlParts = request.nextUrl.pathname.split("/");
    const roomId = urlParts[urlParts.length - 2]; // `[roomId]` parametresi

    if (!roomId) {
      return NextResponse.json({ error: "Oda ID eksik" }, { status: 400 });
    }

    // Kullanıcı zaten üye mi kontrol et
    const memberCheck = await pool.query(
      `
      SELECT 1 FROM yellcord_room_members
      WHERE room_id = $1 AND user_id = $2
      `,
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
      `
      INSERT INTO yellcord_room_members (room_id, user_id)
      VALUES ($1, $2)
      `,
      [roomId, session.user.id]
    );

    return NextResponse.json(
      { message: "Odaya başarıyla katıldınız" },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Odaya katılma hatası:", error);
    return NextResponse.json(
      { error: "Odaya katılırken hata oluştu" },
      { status: 500 }
    );
  }
}
