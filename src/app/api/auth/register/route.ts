import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getConnection } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export async function POST(request: Request) {
  let connection;

  try {
    const { email, password, name } = await request.json();

    // Validaciones
    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, message: "Datos incompletos" },
        { status: 400 }
      );
    }

    connection = await getConnection();

    // Verificar si el usuario ya existe
    const [rows] = await connection.execute<RowDataPacket[]>(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (rows.length > 0) {
      return NextResponse.json(
        { success: false, message: "El usuario ya existe" },
        { status: 409 }
      );
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar usuario
    await connection.execute(
      `
      INSERT INTO users (email, password, name)
      VALUES (?, ?, ?)
      `,
      [email, hashedPassword, name]
    );

    return NextResponse.json({
      success: true,
      message: "Usuario registrado correctamente",
    });
  } catch (error) {
    console.error("ERROR REGISTER:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}
