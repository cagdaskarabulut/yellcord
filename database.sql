-- Kullanıcılar tablosu
CREATE TABLE yellcord_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    is_online BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Odalar tablosu
CREATE TABLE yellcord_rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    logo_url TEXT,
    created_by INTEGER REFERENCES yellcord_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Oda üyelikleri tablosu
CREATE TABLE yellcord_room_members (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES yellcord_rooms(id),
    user_id INTEGER REFERENCES yellcord_users(id),
    is_speaking BOOLEAN DEFAULT false,
    is_video_on BOOLEAN DEFAULT false,
    is_screen_sharing BOOLEAN DEFAULT false,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(room_id, user_id)
);

-- Mesajlar tablosu
CREATE TABLE yellcord_messages (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES yellcord_rooms(id),
    user_id INTEGER REFERENCES yellcord_users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Davetler tablosu
CREATE TABLE yellcord_invites (
    id SERIAL PRIMARY KEY,
    code VARCHAR(36) NOT NULL UNIQUE,
    room_id INTEGER REFERENCES yellcord_rooms(id),
    created_by INTEGER REFERENCES yellcord_users(id),
    used_by INTEGER REFERENCES yellcord_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE
);

-- Bildirimler tablosu
CREATE TABLE yellcord_notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES yellcord_users(id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
); 