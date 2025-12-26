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

    // 👉 Desde (inclusive)
    if (from) {
      where.push("i.created_at >= ?");
      params.push(`${from} 00:00:00`);
    }

    // 👉 Hasta (inclusive, sin restar un día)
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

        d.sku,
        d.product_name,
        d.unit_of_measure,
        d.quantity,
        d.unit_price,
        d.vat_tax_amount,
        d.unit_discount_amount,
        d.net_amount,
        d.received_units,
        d.novelty,
        d.received_value,
        d.returned_value

      FROM invoices i
      INNER JOIN invoice_details d ON d.invoice_id = i.id
      ${whereClause}
      ORDER BY i.created_at ASC
      `,
      params
    );

    return NextResponse.json({
      success: true,
      data: rows,
    });
  } catch (error: any) {
    console.error("API líneas factura error:", error?.sqlMessage || error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al consultar líneas de factura",
      },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}
