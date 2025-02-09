import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import pool from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Kullanıcı zaten üye mi kontrol et
    const memberCheck = await pool.query(
      `
      SELECT 1 FROM yellcord_room_members
      WHERE room_id = $1 AND user_id = $2
      `,
      [params.roomId, session.user.id]
    );

    if (memberCheck.rows.length > 0) {
      return NextResponse.json({ message: "Zaten odanın üyesisiniz" });
    }

    // Odaya üye yap
    await pool.query(
      `
      INSERT INTO yellcord_room_members (room_id, user_id)
      VALUES ($1, $2)
      `,
      [params.roomId, session.user.id]
    );

    return NextResponse.json({ message: "Odaya başarıyla katıldınız" });
  } catch (error) {
    console.error("Error joining room:", error);
    return NextResponse.json(
      { error: "Odaya katılırken hata oluştu" },
      { status: 500 }
    );
  }
} 