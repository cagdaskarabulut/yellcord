import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    // Kullanıcının oturumunu kontrol et
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Davet kodunu al
    const { code } = params;
    if (!code) {
      return NextResponse.json({ error: "Davet kodu eksik" }, { status: 400 });
    }

    // Davet kodunun geçerli olup olmadığını kontrol et
    const inviteResult = await pool.query(
      `SELECT * FROM yellcord_invites WHERE code = $1 AND expires_at > NOW()`,
      [code]
    );

    if (inviteResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Geçersiz veya süresi dolmuş davet kodu" },
        { status: 404 }
      );
    }

    const invite = inviteResult.rows[0];

    // Kullanıcının zaten odada olup olmadığını kontrol et
    const memberCheck = await pool.query(
      `SELECT 1 FROM yellcord_room_members WHERE room_id = $1 AND user_id = $2`,
      [invite.room_id, session.user.id]
    );

    if (memberCheck.rows.length > 0) {
      return NextResponse.json(
        { error: "Zaten bu odanın üyesisiniz" },
        { status: 400 }
      );
    }

    // Kullanıcıyı odaya ekle
    await pool.query(
      `INSERT INTO yellcord_room_members (room_id, user_id) VALUES ($1, $2)`,
      [invite.room_id, session.user.id]
    );

    return NextResponse.json(
      { message: "Odaya başarıyla katıldınız", roomId: invite.room_id },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Odaya katılma hatası:", error);
    return NextResponse.json(
      { error: "Odaya katılırken bir hata oluştu" },
      { status: 500 }
    );
  }
}
