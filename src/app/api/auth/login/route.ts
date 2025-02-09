import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Kullanıcıyı bul
    const query = `
      SELECT id, username, email, password, avatar_url
      FROM yellcord_users
      WHERE email = $1
    `;

    const result = await pool.query(query, [email]);
    const user = result.rows[0];

    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 401 }
      );
    }

    // Şifreyi kontrol et
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return NextResponse.json(
        { error: 'Geçersiz şifre' },
        { status: 401 }
      );
    }

    // JWT token oluştur
    const token = jwt.sign(
      { userId: user.id },
      process.env.NEXTAUTH_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    // Password'ü response'dan çıkar
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Giriş işlemi başarısız oldu' },
      { status: 500 }
    );
  }
} 