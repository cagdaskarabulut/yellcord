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

    const { code } = context.params;
    if (!code) {
      return NextResponse.json(
        { error: "Davet kodu eksik" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
      SELECT 
        r.id,
        r.name,
        r.type,
        r.logo_url,
        COUNT(rm.user_id) as member_count
      FROM yellcord_invites i
      JOIN yellcord_rooms r ON i.room_id = r.id
      LEFT JOIN yellcord_room_members rm ON r.id = rm.room_id
      WHERE i.code = $1
        AND i.expires_at > NOW()
        AND i.used_at IS NULL
      GROUP BY r.id
      `,
      [code]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Davet geçersiz veya süresi dolmuş" },
        { status: 404 }
      );
    }

    return NextResponse.json({ room: result.rows[0] });
  } catch (error) {
    console.error("Error fetching invite:", error);
    return NextResponse.json(
      { error: "Davet bilgileri alınamadı" },
      { status: 500 }
    );
  }
}
