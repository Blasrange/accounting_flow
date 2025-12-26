import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import bcrypt from "bcryptjs";
import type { RowDataPacket } from "mysql2";

// Utilidades para traducción de roles y estados
function statusToUI(status: string) {
  if (status === "Active") return "Activo";
  if (status === "Inactive") return "Inactivo";
  return status;
}
function roleToUI(role: string) {
  if (role === "Administrator") return "Administrador";
  if (role === "Auditor") return "Auditor";
  return role;
}

export async function POST(request: Request) {
  let connection;
  try {
    const data = await request.json();
    const { email, password } = data;
    if (!email || !password) {
      return NextResponse.json(
        { message: "Email y contraseña requeridos" },
        { status: 400 }
      );
    }
    connection = await getConnection();
    const [rows] = await connection.execute<RowDataPacket[]>(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    if (!rows.length) {
      return NextResponse.json(
        { message: "Usuario o contraseña incorrectos" },
        { status: 401 }
      );
    }
    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { message: "Usuario o contraseña incorrectos" },
        { status: 401 }
      );
    }
    if (user.status === "Inactive") {
      return NextResponse.json(
        { message: "El usuario está inactivo. Contacte al administrador." },
        { status: 403 }
      );
    }
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: roleToUI(user.role),
      status: statusToUI(user.status),
      createdAt: user.created_at,
    });
  } catch (error: any) {
    console.error("LOGIN user error:", error?.sqlMessage || error);
    return NextResponse.json(
      { message: "Error autenticando usuario" },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}
