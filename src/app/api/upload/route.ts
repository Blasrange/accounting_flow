import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

// Usar runtime Node.js para permitir uso de fs y path
export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json(
      { success: false, message: "Archivo no recibido" },
      { status: 400 }
    );
  }

  // Crear carpeta uploads si no existe
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });

  // Guardar archivo con el nombre original (sanitizado) y timestamp
  const originalName = (file as File).name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const fileName = `${Date.now()}-${originalName}`;
  const filePath = path.join(uploadDir, fileName);
  const arrayBuffer = await (file as File).arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(arrayBuffer));

  // Retornar la URL pública
  const publicUrl = `/uploads/${fileName}`;
  return NextResponse.json({ success: true, url: publicUrl });
}
