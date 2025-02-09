import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import pool from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await pool.query(
      `
      UPDATE yellcord_notifications
      SET is_read = true
      WHERE id = $1 AND user_id = $2
      `,
      [params.id, session.user.id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { error: "Bildirim işaretlenirken hata oluştu" },
      { status: 500 }
    );
  }
} 