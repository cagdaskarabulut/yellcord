import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import pool from "@/lib/db";
import bcrypt from "bcrypt";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

const s3 = new S3Client({
  region: process.env.AWS_S3_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY!,
  },
});

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const username = formData.get("username") as string;
    const email = formData.get("email") as string;
    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const avatar = formData.get("avatar") as File | null;

    // Kullanıcıyı bul
    const userResult = await pool.query(
      "SELECT * FROM yellcord_users WHERE id = $1",
      [session.user.id]
    );
    const user = userResult.rows[0];

    // Şifre değişikliği varsa kontrol et
    if (currentPassword && newPassword) {
      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return NextResponse.json(
          { error: "Mevcut şifre yanlış" },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "Yeni şifre en az 6 karakter olmalıdır" },
          { status: 400 }
        );
      }
    }

    let avatarUrl = user.avatar_url;
    if (avatar) {
      const fileExtension = avatar.name.split(".").pop();
      const fileName = `avatars/${uuidv4()}.${fileExtension}`;

      const uploadCommand = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: fileName,
        Body: Buffer.from(await avatar.arrayBuffer()),
        ContentType: avatar.type,
      });

      await s3.send(uploadCommand);
      avatarUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${fileName}`;

      // Eski avatarı sil
      if (user.avatar_url) {
        const oldKey = user.avatar_url.split("/").pop();
        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME!,
            Key: `avatars/${oldKey}`,
          })
        );
      }
    }

    // Kullanıcıyı güncelle
    const updateFields = [];
    const updateValues = [];
    let valueIndex = 1;

    if (username) {
      updateFields.push(`username = $${valueIndex}`);
      updateValues.push(username);
      valueIndex++;
    }

    if (email) {
      updateFields.push(`email = $${valueIndex}`);
      updateValues.push(email);
      valueIndex++;
    }

    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateFields.push(`password = $${valueIndex}`);
      updateValues.push(hashedPassword);
      valueIndex++;
    }

    if (avatarUrl) {
      updateFields.push(`avatar_url = $${valueIndex}`);
      updateValues.push(avatarUrl);
      valueIndex++;
    }

    updateValues.push(session.user.id);
    const updateQuery = `
      UPDATE yellcord_users 
      SET ${updateFields.join(", ")}
      WHERE id = $${valueIndex}
      RETURNING id, username, email, avatar_url
    `;

    const result = await pool.query(updateQuery, updateValues);
    const updatedUser = result.rows[0];

    return NextResponse.json({ user: updatedUser });
  } catch (error: any) {
    if (error.code === "23505") {
      if (error.constraint === "yellcord_users_email_key") {
        return NextResponse.json(
          { error: "Bu email adresi zaten kullanımda" },
          { status: 400 }
        );
      }
      if (error.constraint === "yellcord_users_username_key") {
        return NextResponse.json(
          { error: "Bu kullanıcı adı zaten kullanımda" },
          { status: 400 }
        );
      }
    }

    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Profil güncellenirken hata oluştu" },
      { status: 500 }
    );
  }
} 