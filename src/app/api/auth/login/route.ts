import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getConnection } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export async function POST(request: Request) {
  let connection;

  try {
    const { email, password } = await request.json();

    // Validación básica
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email y contraseña requeridos" },
        { status: 400 }
      );
    }

    connection = await getConnection();

    // Buscar usuario por email
    const [rows] = await connection.execute<RowDataPacket[]>(
      `
      SELECT 
        id,
        name,
        email,
        role,
        password
      FROM users
      WHERE email = ?
      LIMIT 1
      `,
      [email]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Usuario no existe" },
        { status: 401 }
      );
    }

    const user = rows[0];

    // Comparar contraseña
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, message: "Contraseña incorrecta" },
        { status: 401 }
      );
    }

    // Quitar contraseña antes de responder
    const { password: _, ...safeUser } = user;

    return NextResponse.json({
      success: true,
      user: safeUser,
    });
  } catch (error) {
    console.error("ERROR LOGIN:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}
