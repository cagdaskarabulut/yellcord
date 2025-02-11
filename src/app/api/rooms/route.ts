import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

const s3 = new S3Client({
  region: process.env.AWS_S3_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY!,
  },
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await pool.query(`
      SELECT r.*, COUNT(rm.user_id) as member_count
      FROM yellcord_rooms r
      LEFT JOIN yellcord_room_members rm ON r.id = rm.room_id
      WHERE r.is_public = true
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `);

    return NextResponse.json({ rooms: result.rows });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json(
      { error: "Odalar yüklenirken hata oluştu" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    }

    // Odayı oluştur
    const roomResult = await pool.query(
      `
      INSERT INTO yellcord_rooms (name, logo_url, created_by)
      VALUES ($1, $2, $3)
      RETURNING id
      `,
      [name, logoUrl, session.user.id]
    );

    // Oda sahibini otomatik olarak üye yap
    await pool.query(
      `
      INSERT INTO yellcord_room_members (room_id, user_id)
      VALUES ($1, $2)
      `,
      [roomResult.rows[0].id, session.user.id]
    );

    return NextResponse.json(
      { message: "Oda başarıyla oluşturuldu" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating room:", error);
    return NextResponse.json(
      { error: "Oda oluşturulurken hata oluştu" },
      { status: 500 }
    );
  }
} 