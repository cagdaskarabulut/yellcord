import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import pool from "@/lib/db";

export async function GET(
  request: Request,
  context: { params: { roomId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = await Promise.resolve(context.params);

    const result = await pool.query(
      `
      SELECT 
        u.id,
        u.username,
        u.avatar_url,
        rm.joined_at,
        CASE WHEN r.created_by = u.id THEN true ELSE false END as is_creator
      FROM yellcord_room_members rm
      JOIN yellcord_users u ON rm.user_id = u.id
      JOIN yellcord_rooms r ON rm.room_id = r.id
      WHERE rm.room_id = $1
      ORDER BY 
        CASE WHEN r.created_by = u.id THEN 0 ELSE 1 END,
        u.username
      `,
      [roomId]
    );

    return NextResponse.json({ members: result.rows });
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Üyeler yüklenirken hata oluştu" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: { roomId: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId, memberId } = await Promise.resolve(context.params);

    // Odanın sahibi olup olmadığını kontrol et
    const roomCheck = await pool.query(
      "SELECT created_by FROM yellcord_rooms WHERE id = $1",
      [roomId]
    );

    if (roomCheck.rows[0]?.created_by !== parseInt(session.user.id)) {
      return NextResponse.json(
        { error: "Bu işlem için yetkiniz yok" },
        { status: 403 }
      );
    }

    // Üyeyi odadan çıkar
    await pool.query(
      "DELETE FROM yellcord_room_members WHERE room_id = $1 AND user_id = $2",
      [roomId, memberId]
    );

    return NextResponse.json({ message: "Üye odadan çıkarıldı" });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json(
      { error: "Üye çıkarılırken hata oluştu" },
      { status: 500 }
    );
  }
} 