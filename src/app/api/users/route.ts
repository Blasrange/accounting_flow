/* =========================
   POST /login → AUTENTICAR USUARIO
========================= */
export async function POST_login(request: Request) {
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
    // Opcional: devolver datos del usuario (sin contraseña)
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
import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import bcrypt from "bcryptjs";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

/* =========================
   UTILIDADES
========================= */

// ISO → MySQL DATETIME
function toMySQLDatetime(dateString?: string): string {
  const d = dateString ? new Date(dateString) : new Date();
  return d.toISOString().slice(0, 19).replace("T", " ");
}

// Español → Inglés
function statusToDB(status: string) {
  if (status === "Activo") return "Active";
  if (status === "Inactivo") return "Inactive";
  return status;
}

function roleToDB(role: string) {
  if (role === "Administrador") return "Administrator";
  if (role === "Auditor") return "Auditor";
  return role;
}

// Inglés → Español
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

/* =========================
   GET → LISTAR USUARIOS
   ⚠️ DEVUELVE ARRAY PLANO
========================= */
export async function GET() {
  let connection;

  try {
    connection = await getConnection();

    const [rows] = await connection.execute<RowDataPacket[]>(
      "SELECT * FROM users ORDER BY created_at DESC"
    );

    const users = rows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: roleToUI(u.role),
      status: statusToUI(u.status),
      createdAt: u.created_at,
    }));

    // ✅ CLAVE: ARRAY DIRECTO
    return NextResponse.json(users);
  } catch (error: any) {
    console.error("GET users error:", error?.sqlMessage || error);
    return NextResponse.json(
      { message: "Error consultando usuarios" },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}

/* =========================
   POST → CREAR USUARIO
========================= */
export async function POST(request: Request) {
  let connection;

  try {
    const data = await request.json();
    connection = await getConnection();

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const [result] = await connection.execute<ResultSetHeader>(
      `
      INSERT INTO users (name, email, password, role, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        data.name,
        data.email,
        hashedPassword,
        roleToDB(data.role),
        statusToDB(data.status ?? "Activo"),
        toMySQLDatetime(data.createdAt),
      ]
    );

    const [rows] = await connection.execute<RowDataPacket[]>(
      "SELECT * FROM users WHERE id = ?",
      [result.insertId]
    );

    const user = rows[0];

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: roleToUI(user.role),
      status: statusToUI(user.status),
      createdAt: user.created_at,
    });
  } catch (error: any) {
    console.error("POST user error:", error?.sqlMessage || error);
    return NextResponse.json(
      { message: "Error creando usuario" },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}

/* =========================
   PATCH → EDITAR USUARIO
========================= */
export async function PATCH(request: Request) {
  let connection;

  try {
    const data = await request.json();

    if (!data.id) {
      return NextResponse.json({ message: "ID requerido" }, { status: 400 });
    }

    connection = await getConnection();

    let passwordToSave: string | null = null;

    if (data.password && data.password.length > 0) {
      passwordToSave = await bcrypt.hash(data.password, 10);
    }

    await connection.execute(
      `
      UPDATE users
      SET
        name = ?,
        email = ?,
        password = COALESCE(?, password),
        role = ?,
        status = ?
      WHERE id = ?
      `,
      [
        data.name,
        data.email,
        passwordToSave,
        roleToDB(data.role),
        statusToDB(data.status),
        data.id,
      ]
    );

    const [rows] = await connection.execute<RowDataPacket[]>(
      "SELECT * FROM users WHERE id = ?",
      [data.id]
    );

    const user = rows[0];

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: roleToUI(user.role),
      status: statusToUI(user.status),
      createdAt: user.created_at,
    });
  } catch (error: any) {
    console.error("PATCH user error:", error?.sqlMessage || error);
    return NextResponse.json(
      { message: "Error actualizando usuario" },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}
