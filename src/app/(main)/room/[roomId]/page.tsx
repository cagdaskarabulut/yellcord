// import { getServerSession } from "next-auth";
// import { redirect } from "next/navigation";
// import { authOptions } from "@/app/api/auth/[...nextauth]/route";
// import RoomClient from "../[roomId]/RoomClient";
// import pool from "@/lib/db";

// export default async function RoomPage({
//   params,
// }: {
//   params: { roomId: string };
// }) {
//   const session = await getServerSession(authOptions);

//   if (!session) {
//     redirect("/login");
//   }

//   try {
//     const result = await pool.query(
//       `
//       SELECT r.*, u.username as creator_name
//       FROM yellcord_rooms r
//       JOIN yellcord_users u ON r.created_by = u.id
//       WHERE r.id = $1
//       `,
//       [params.roomId]
//     );

//     if (result.rows.length === 0) {
//       redirect("/");
//     }

//     const room = result.rows[0];

//     return <RoomClient room={room} session={session} />;
//   } catch (error) {
//     redirect("/");
//   }
// }

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import RoomClient from "../[roomId]/RoomClient";
import pool from "@/lib/db";

export default async function RoomPage({
  params,
}: {
  params: { roomId: string };
}) {
  const { roomId } = await Promise.resolve(params);
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  try {
    if (!roomId) {
      redirect("/");
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
      redirect("/");
    }

    const room = result.rows[0];

    return <RoomClient room={room} session={session} />;
  } catch (error) {
    console.error("Veritabanı hatası:", error);
    redirect("/");
  }
}
