import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { username, email, password } = await request.json();

    // Basit validasyon
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Tüm alanlar zorunludur' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Şifre en az 6 karakter olmalıdır' },
        { status: 400 }
      );
    }

    // Email formatı kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Geçerli bir email adresi giriniz' },
        { status: 400 }
      );
    }

    // Şifreyi hash'le
    const hashedPassword = await bcrypt.hash(password, 10);

    // Kullanıcıyı veritabanına ekle
    const query = `
      INSERT INTO yellcord_users (username, email, password)
      VALUES ($1, $2, $3)
      RETURNING id, username, email, avatar_url
    `;

    const result = await pool.query(query, [username, email, hashedPassword]);
    const user = result.rows[0];

    return NextResponse.json(
      {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar_url: user.avatar_url,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.code === '23505') {
      // Unique constraint violation
      if (error.constraint === 'yellcord_users_email_key') {
        return NextResponse.json(
          { error: 'Bu email adresi zaten kullanımda' },
          { status: 400 }
        );
      }
      if (error.constraint === 'yellcord_users_username_key') {
        return NextResponse.json(
          { error: 'Bu kullanıcı adı zaten kullanımda' },
          { status: 400 }
        );
      }
    }

    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Kayıt işlemi başarısız oldu' },
      { status: 500 }
    );
  }
} 