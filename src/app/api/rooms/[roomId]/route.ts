import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

const s3 = new S3Client({
  region: process.env.AWS_S3_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY!,
  },
});

export async function PATCH(request: NextRequest, context: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = context.params;
    if (!roomId) {
      return NextResponse.json({ error: "Oda ID eksik" }, { status: 400 });
    }

    // Odanın sahibi olup olmadığını kontrol et
    const roomCheck = await pool.query(
      "SELECT created_by, logo_url FROM yellcord_rooms WHERE id = $1",
      [roomId]
    );

    if (roomCheck.rows.length === 0) {
      return NextResponse.json({ error: "Oda bulunamadı" }, { status: 404 });
    }

    if (roomCheck.rows[0]?.created_by !== parseInt(session.user.id)) {
      return NextResponse.json(
        { error: "Bu odayı düzenleme yetkiniz yok" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const logo = formData.get("logo") as File | null;

    let logoUrl = null;
    if (logo) {
      const fileExtension = logo.name.split(".").pop();
      const fileName = `yellcord/${uuidv4()}.${fileExtension}`;

      const uploadCommand = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: fileName,
        Body: Buffer.from(await logo.arrayBuffer()),
        ContentType: logo.type,
      });

      await s3.send(uploadCommand);
      logoUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${fileName}`;

      // Eski logoyu sil
      if (roomCheck.rows[0].logo_url) {
        const oldKey = roomCheck.rows[0].logo_url.split("/").pop();
        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME!,
            Key: `yellcord/${oldKey}`,
          })
        );
      }
    }

    const updateQuery = logoUrl
      ? "UPDATE yellcord_rooms SET name = $1, logo_url = $2 WHERE id = $3"
      : "UPDATE yellcord_rooms SET name = $1 WHERE id = $2";
    const updateValues = logoUrl
      ? [name, logoUrl, roomId]
      : [name, roomId];

    await pool.query(updateQuery, updateValues);

    return NextResponse.json({ message: "Oda güncellendi" });
  } catch (error) {
    console.error("Error updating room:", error);
    return NextResponse.json(
      { error: "Oda güncellenirken hata oluştu" },
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
    if (!roomId) {
      return NextResponse.json({ error: "Oda ID eksik" }, { status: 400 });
    }

    // Odanın sahibi olup olmadığını kontrol et
    const roomCheck = await pool.query(
      "SELECT created_by, logo_url FROM yellcord_rooms WHERE id = $1",
      [roomId]
    );

    if (roomCheck.rows.length === 0) {
      return NextResponse.json({ error: "Oda bulunamadı" }, { status: 404 });
    }

    if (roomCheck.rows[0]?.created_by !== parseInt(session.user.id)) {
      return NextResponse.json(
        { error: "Bu odayı silme yetkiniz yok" },
        { status: 403 }
      );
    }

    // S3'ten logoyu sil
    if (roomCheck.rows[0].logo_url) {
      const key = roomCheck.rows[0].logo_url.split("/").pop();
      await s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME!,
          Key: `yellcord/${key}`,
        })
      );
    }

    // Odayı ve ilişkili verileri sil
    await pool.query("BEGIN");
    await pool.query("DELETE FROM yellcord_messages WHERE room_id = $1", [roomId]);
    await pool.query("DELETE FROM yellcord_room_members WHERE room_id = $1", [roomId]);
    await pool.query("DELETE FROM yellcord_rooms WHERE id = $1", [roomId]);
    await pool.query("COMMIT");

    return NextResponse.json({ message: "Oda silindi" });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error deleting room:", error);
    return NextResponse.json(
      { error: "Oda silinirken hata oluştu" },
      { status: 500 }
    );
  }
}

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
      SELECT r.*, u.username as creator_name
      FROM yellcord_rooms r
      JOIN yellcord_users u ON r.created_by = u.id
      WHERE r.id = $1
      `,
      [roomId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Oda bulunamadı" }, { status: 404 });
    }

    return NextResponse.json({ room: result.rows[0] });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "İç sunucu hatası" },
      { status: 500 }
    );
  }
}
