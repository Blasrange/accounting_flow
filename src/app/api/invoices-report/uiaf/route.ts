import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export async function GET(req: Request) {
  let connection;

  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: string[] = [];
    const params: any[] = [];

    // ✅ FILTRO DE FECHAS PROFESIONAL
    if (from) {
      where.push("i.created_at >= ?");
      params.push(`${from} 00:00:00`);
    }

    if (to) {
      where.push("i.created_at < DATE_ADD(?, INTERVAL 1 DAY)");
      params.push(`${to} 00:00:00`);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    connection = await getConnection();

    const [rows] = await connection.execute<RowDataPacket[]>(
      `
      SELECT 
        i.invoice_number,
        i.invoice_date,
        i.customer_name,
        i.customer_tax_id,
        i.customer_city,
        i.invoice_total,
        i.amount_due,
        i.payment_method,
        i.status,
        i.rejection_cause_code,
        i.created_at,
        i.voucher_number,
        i.voucher_amount,

        COALESCE(SUM(d.weight), 0) AS total_weight,
        COALESCE(SUM(d.quantity), 0) AS total_units_despachadas,

        COALESCE(SUM(
          CASE 
            WHEN d.novelty REGEXP '^[0-9]+$'
            THEN CAST(d.novelty AS UNSIGNED)
            ELSE 0
          END
        ), 0) AS total_units_con_novedad,

        COALESCE(SUM(d.received_units), 0) AS total_units_recibidas,
        COALESCE(SUM(d.received_value), 0) AS total_valor_recibido,
        COALESCE(SUM(d.returned_value), 0) AS total_valor_devuelto

      FROM invoices i
      LEFT JOIN invoice_details d ON d.invoice_id = i.id
      ${whereClause}
      GROUP BY i.id
      ORDER BY i.created_at ASC
      `,
      params
    );

    return NextResponse.json({
      success: true,
      data: rows,
    });
  } catch (error: any) {
    console.error("API resumen facturas error:", error?.sqlMessage || error);
    return NextResponse.json(
      { success: false, error: "Error al consultar facturas" },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}
