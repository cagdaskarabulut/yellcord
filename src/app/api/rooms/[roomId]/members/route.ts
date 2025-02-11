import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

export async function GET(request: NextRequest, context: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = context.params;
    if (!roomId) {
      return NextResponse.json({ error: "Oda ID eksik" }, { status: 400 });
    }

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

export async function DELETE(request: NextRequest, context: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = context.params;
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");

    if (!roomId) {
      return NextResponse.json({ error: "Oda ID eksik" }, { status: 400 });
    }

    if (!memberId) {
      return NextResponse.json(
        { error: "Üye ID'si gerekli" },
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
