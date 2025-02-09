import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import pool from "@/lib/db";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await pool.query(
      `
      UPDATE yellcord_notifications
      SET is_read = true
      WHERE user_id = $1 AND is_read = false
      `,
      [session.user.id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return NextResponse.json(
      { error: "Bildirimler işaretlenirken hata oluştu" },
      { status: 500 }
    );
  }
} 