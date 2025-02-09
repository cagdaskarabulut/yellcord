import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import pool from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await pool.query("BEGIN");

    // Daveti kontrol et
    const inviteResult = await pool.query(
      `
      SELECT room_id
      FROM yellcord_invites
      WHERE code = $1
        AND expires_at > NOW()
        AND used_at IS NULL
      `,
      [params.code]
    );

    if (inviteResult.rows.length === 0) {
      await pool.query("ROLLBACK");
      return NextResponse.json(
        { error: "Davet geçersiz veya süresi dolmuş" },
        { status: 404 }
      );
    }

    const roomId = inviteResult.rows[0].room_id;

    // Kullanıcı zaten odada mı kontrol et
    const memberCheck = await pool.query(
      `
      SELECT 1 FROM yellcord_room_members
      WHERE room_id = $1 AND user_id = $2
      `,
      [roomId, session.user.id]
    );

    if (memberCheck.rows.length > 0) {
      await pool.query("ROLLBACK");
      return NextResponse.json(
        { error: "Zaten bu odanın üyesisiniz" },
        { status: 400 }
      );
    }

    // Kullanıcıyı odaya ekle
    await pool.query(
      `
      INSERT INTO yellcord_room_members (room_id, user_id)
      VALUES ($1, $2)
      `,
      [roomId, session.user.id]
    );

    // Daveti kullanıldı olarak işaretle
    await pool.query(
      `
      UPDATE yellcord_invites
      SET used_at = NOW(), used_by = $1
      WHERE code = $2
      `,
      [session.user.id, params.code]
    );

    await pool.query("COMMIT");

    return NextResponse.json({ roomId });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error joining room:", error);
    return NextResponse.json(
      { error: "Odaya katılırken hata oluştu" },
      { status: 500 }
    );
  }
} 