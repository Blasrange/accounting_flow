import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export async function GET(req: Request) {
  let connection;

  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: string[] = [
      "d.novelty IS NOT NULL",
      "TRIM(d.novelty) <> ''",
      "d.novelty REGEXP '^[0-9]+$'",
      "CAST(d.novelty AS UNSIGNED) > 0",
    ];

    const params: any[] = [];

    // ✅ FILTRO DE FECHAS CORRECTO (ESTÁNDAR)
    if (from) {
      where.push("i.created_at >= ?");
      params.push(`${from} 00:00:00`);
    }

    if (to) {
      where.push("i.created_at < DATE_ADD(?, INTERVAL 1 DAY)");
      params.push(`${to} 00:00:00`);
    }

    const whereClause = `WHERE ${where.join(" AND ")}`;

    // Debug opcional
    console.log("WMS filtros:", { from, to, whereClause, params });

    connection = await getConnection();

    const [rows] = await connection.execute<RowDataPacket[]>(
      `
      SELECT 
        i.delivery_number        AS N_ORDER,
        i.internal_order_number  AS ORDER2,
        i.purchase_order_number  AS PURCHASE_ORDER,
        i.invoice_number         AS INVOICE,
        i.customer_tax_id        AS PROVIDER_UID,
        i.invoice_date           AS ORDER_DATE,
        i.invoice_due_date       AS SERVICE_DATE,
        i.created_at             AS CREATED_AT,
        i.updated_at             AS UPDATED_AT,
        '657'                    AS INBOUNDTYPE_CODE,
        i.notes                  AS NOTE,

        d.sku                    AS SKU,
        d.batch_number           AS LOTE,
        d.serial_number          AS SERIAL,
        ''                        AS FECHA_VENCIMIENTO,
        ''                        AS FECHA_FABRICACION,
        'Q'                       AS ESTADO_CALIDAD,
        CAST(d.novelty AS UNSIGNED) AS QTY,
        d.unit_of_measure        AS UOM_CODE,
        ''                        AS REFERENCE,
        d.unit_price             AS PRICE,
        d.vat_tax_amount         AS TAXES,
        ''                        AS IBL_LPN_CODE,
        d.weight                 AS IBL_WEIGHT

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
    console.error("API WMS error:", error?.sqlMessage || error);
    return NextResponse.json(
      { success: false, error: "Error al consultar WMS" },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}
