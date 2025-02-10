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

    let query = `
      SELECT 
        u.id, 
        u.username, 
        u.avatar_url,
        u.is_online
      FROM yellcord_users u
    `;

    if (roomId) {
      query = `
        SELECT 
          u.id, 
          u.username, 
          u.avatar_url,
          u.is_online,
          CASE WHEN rm.user_id IS NOT NULL THEN true ELSE false END as is_in_room
        FROM yellcord_users u
        LEFT JOIN yellcord_room_members rm ON u.id = rm.user_id AND rm.room_id = $1
      `;
    }

    query += " ORDER BY u.username ASC";

    const result = await pool.query(query, roomId ? [roomId] : []);

    return NextResponse.json({
      users: result.rows.map(user => ({
        ...user,
        is_online: true // Gerçek online durumu için Socket.IO kullanılacak
      }))
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Kullanıcılar yüklenirken hata oluştu" },
      { status: 500 }
    );
  }
} 