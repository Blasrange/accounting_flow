import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { parseISO, isValid, format as formatDateFns } from "date-fns";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

/* ================= UTILIDADES ================= */

function toMySQLDate(
  dateString?: string | number | Date | null
): string | null {
  if (!dateString) return null;

  if (dateString instanceof Date && !isNaN(dateString.getTime())) {
    return dateString.toISOString().slice(0, 10);
  }

  if (typeof dateString === "number") {
    let days = dateString;
    if (days >= 60) days -= 1;
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const parsed = new Date(excelEpoch.getTime() + days * 86400000);
    return isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
  }

  if (typeof dateString === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;

    const match = dateString.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
    if (match) {
      const [, dd, mm, yyyy] = match;
      return `${yyyy}-${mm}-${dd}`;
    }

    const d = new Date(dateString);
    return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  }

  return null;
}

function formatDateForFrontend(date: any): string {
  if (!date) return "";

  if (typeof date === "string" && date.length > 10) {
    const d = parseISO(date);
    if (isValid(d)) return formatDateFns(d, "dd/MM/yyyy");
  }

  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const d = new Date(date + "T00:00:00");
    if (isValid(d)) return formatDateFns(d, "dd/MM/yyyy");
  }

  if (date instanceof Date && isValid(date)) {
    return formatDateFns(date, "dd/MM/yyyy");
  }

  return String(date);
}

function mapStatusFromDB(status: string): string {
  const map: Record<string, string> = {
    Complete: "Completo",
    Incomplete: "Incompleto",
    Pending: "Pendiente",
    Cancelled: "Cancelado",
    Expired: "Vencido",
    Redispatch: "Redespacho",
  };
  return map[status] || status;
}

/* ================= GET ================= */

export async function GET() {
  let connection;

  try {
    connection = await getConnection();

    const [invoiceRows] = await connection.execute<RowDataPacket[]>(
      "SELECT * FROM invoices ORDER BY created_at DESC"
    );

    const [detailRows] = await connection.execute<RowDataPacket[]>(
      "SELECT * FROM invoice_details"
    );

    const invoices = invoiceRows.map((inv) => ({
      id: inv.id.toString(),
      invoiceNumber: inv.invoice_number,

      invoiceDateRaw: inv.invoice_date,
      invoiceDueDateRaw: inv.invoice_due_date,
      invoiceDate: formatDateForFrontend(inv.invoice_date),
      invoiceDueDate: formatDateForFrontend(inv.invoice_due_date),

      customerName: inv.customer_name,
      customerTaxId: inv.customer_tax_id,
      customerCity: inv.customer_city,
      invoiceTotal: inv.invoice_total,
      amountDue: inv.amount_due,

      paymentMethod: inv.payment_method,

      status: mapStatusFromDB(inv.status),

      createdAt: inv.created_at,
      totalUnits: inv.total_units ?? 0,

      invoiceFileUrl: inv.invoice_file_url ?? null,
      voucherFileUrl: inv.voucher_file_url ?? null,
      voucherNumber: inv.voucher_number ?? null,
      voucherAmount: inv.voucher_amount ?? null,
      voucherDate: inv.voucher_date
        ? formatDateForFrontend(inv.voucher_date)
        : null,

      rejection_cause_code: inv.rejection_cause_code ?? "",
      details: detailRows
        .filter((d) => d.invoice_id === inv.id)
        .map((d) => ({
          id: d.id.toString(),
          sku: d.sku,
          productName: d.product_name,
          unitOfMeasure: d.unit_of_measure,
          quantity: d.quantity,
          unitPrice: Number(d.unit_price) || 0,
          vatTaxAmount: Number(d.vat_tax_amount) || 0,
          unitDiscountAmount: Number(d.unit_discount_amount) || 0,
          netAmount: Number(d.net_amount) || 0,
          receivedUnits: d.received_units, // deja pasar null
          novelty: d.novelty ?? 0,
          receivedValue: Number(d.received_value) || 0,
          returnedValue: Number(d.returned_value) || 0,
          rejection_cause_code_line: d.rejection_cause_code_line ?? "SC",
        })),
    }));

    return NextResponse.json(invoices);
  } catch (error: any) {
    console.error("GET invoices error:", error?.sqlMessage || error);
    return NextResponse.json(
      { message: "Error consultando facturas" },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}

/* ================= POST ================= */

export async function POST(request: Request) {
  let connection;

  try {
    const data = await request.json();

    const allowedStatus = [
      "Complete",
      "Incomplete",
      "Pending",
      "Cancelled",
      "Expired",
      "Redispatch",
    ];

    if (!allowedStatus.includes(data.status)) {
      return NextResponse.json(
        { message: `Status '${data.status}' no permitido` },
        { status: 400 }
      );
    }

    connection = await getConnection();

    const [result] = await connection.execute<ResultSetHeader>(
      `
      INSERT INTO invoices (
        invoice_number,
        delivery_number,
        internal_order_number,
        purchase_order_number,
        invoice_date,
        invoice_due_date,
        customer_code,
        customer_tax_id,
        customer_name,
        customer_phone,
        customer_address,
        customer_city,
        customer_state,
        zip_code,
        invoice_total,
        vat_tax_amount,
        total_discount,
        amount_due,
        payment_method,
        status,
        rejection_cause_code,
        invoice_file_url,
        voucher_file_url,
        voucher_number,
        voucher_amount,
        voucher_date,
        notes,
        total_lines,
        total_units,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [
        data.invoiceNumber,
        data.deliveryNumber,
        data.internalOrderNumber,
        data.purchaseOrderNumber,
        toMySQLDate(data.invoiceDate),
        toMySQLDate(data.invoiceDueDate),
        data.customerCode,
        data.customerTaxId,
        data.customerName,
        data.customerPhone,
        data.customerAddress,
        data.customerCity,
        data.customerState,
        data.zipCode,
        data.invoiceTotal,
        data.vatTaxAmount,
        data.totalDiscount,
        data.amountDue,
        data.paymentMethod,
        data.status,
        data.rejection_cause_code ?? "",
        data.invoiceFileUrl,
        data.voucherFileUrl,
        data.voucherNumber,
        data.voucherAmount,
        toMySQLDate(data.voucherDate),
        data.notes,
        data.totalLines,
        data.totalUnits,
      ]
    );

    if (Array.isArray(data.details)) {
      for (const d of data.details) {
        await connection.execute(
          `
          INSERT INTO invoice_details (
            invoice_id,
            sku,
            product_name,
            unit_of_measure,
            quantity,
            batch_number,
            serial_number,
            unit_price,
            vat_tax_amount,
            unit_discount_amount,
            net_amount,
            weight,
            length,
            height,
            width,
            rejection_cause_code_line
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            result.insertId,
            d.sku,
            d.productName,
            d.unitOfMeasure,
            d.quantity,
            d.batchNumber,
            d.serialNumber,
            d.unitPrice,
            d.vatTaxAmount,
            d.unitDiscountAmount,
            d.netAmount,
            d.weight,
            d.length,
            d.height,
            d.width,
            d.rejection_cause_code_line ?? "SC",
          ]
        );
      }
    }

    return NextResponse.json({ id: result.insertId });
  } catch (error: any) {
    console.error("POST invoice error:", error?.sqlMessage || error);
    return NextResponse.json(
      { message: "Error creando factura" },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}

/* ================= PATCH ================= */

export async function PATCH(request: Request) {
  let connection;

  try {
    const data = await request.json();

    /* ======================================================
       🔥 NUEVO: PATCH SOLO CAUSAL DE DETALLE
       ====================================================== */
    if (data.detail_id && "rejection_cause_code_line" in data) {
      connection = await getConnection();

      const [result] = await connection.execute<ResultSetHeader>(
        `
        UPDATE invoice_details
        SET rejection_cause_code_line = ?
        WHERE id = ?
        `,
        [data.rejection_cause_code_line ?? null, data.detail_id]
      );

      if (result.affectedRows === 0) {
        return NextResponse.json(
          { message: "Detalle no encontrado" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Causal del detalle actualizada correctamente",
      });
    }

    /* ======================================================
       ⬇️ TODO LO DEMÁS QUEDA IGUAL
       ====================================================== */

    if (!data.id) {
      return NextResponse.json(
        { message: "ID requerido para actualizar" },
        { status: 400 }
      );
    }

    const allowedStatus = [
      "Complete",
      "Incomplete",
      "Pending",
      "Cancelled",
      "Expired",
      "Redispatch",
    ];

    if (data.status && !allowedStatus.includes(data.status)) {
      return NextResponse.json(
        { message: `Status '${data.status}' no permitido` },
        { status: 400 }
      );
    }

    connection = await getConnection();
    await connection.beginTransaction();

    /* ================= VERIFICAR FACTURA ================= */

    const [invoiceRows] = await connection.execute<RowDataPacket[]>(
      "SELECT * FROM invoices WHERE id = ?",
      [data.id]
    );

    if (invoiceRows.length === 0) {
      await connection.rollback();
      return NextResponse.json(
        { message: "Factura no encontrada" },
        { status: 404 }
      );
    }

    const currentInvoice = invoiceRows[0];

    /* ================= ACTUALIZAR FACTURA PRINCIPAL ================= */

    await connection.execute(
      `UPDATE invoices SET
        invoice_file_url = COALESCE(?, invoice_file_url),
        voucher_file_url = COALESCE(?, voucher_file_url),
        voucher_number = COALESCE(?, voucher_number),
        voucher_amount = COALESCE(?, voucher_amount),
        voucher_date = COALESCE(?, voucher_date),
        status = COALESCE(?, status),
        rejection_cause_code = COALESCE(?, rejection_cause_code),
        updated_at = NOW()
      WHERE id = ?`,
      [
        data.invoiceFileUrl,
        data.voucherFileUrl,
        data.voucherNumber,
        data.voucherAmount,
        toMySQLDate(data.voucherDate),
        data.status,
        data.rejection_cause_code ?? "",
        data.id,
      ]
    );

    /* ================= ACTUALIZAR DETALLES ================= */

    if (Array.isArray(data.details)) {
      console.log(
        "Detalles recibidos en PATCH:",
        JSON.stringify(data.details, null, 2)
      );

      for (const d of data.details) {
        // Verificar si el detalle existe
        const [detailRows] = await connection.execute<RowDataPacket[]>(
          "SELECT * FROM invoice_details WHERE id = ? AND invoice_id = ?",
          [d.id, data.id]
        );

        if (detailRows.length === 0) {
          console.log(`Detalle ${d.id} no encontrado, continuando...`);
          continue;
        }

        const currentDetail = detailRows[0];

        // Obtener valores actuales
        const currentQuantity = Number(currentDetail.quantity || 0);
        const currentReceivedUnits = Number(currentDetail.received_units || 0);

        // Valores del payload
        const payloadQuantity = Number(d.quantity || currentQuantity);
        const payloadReceivedUnits =
          d.receivedUnits !== undefined
            ? Number(d.receivedUnits)
            : currentReceivedUnits;

        // Validar que receivedUnits no sea negativo
        const validatedReceivedUnits = Math.max(0, payloadReceivedUnits);

        // Calcular novelty
        const novelty = Math.max(0, payloadQuantity - validatedReceivedUnits);

        // Calcular valores monetarios
        const unitPrice = Number(d.unitPrice || currentDetail.unit_price || 0);
        const vatTaxAmount = Number(
          d.vatTaxAmount || currentDetail.vat_tax_amount || 0
        );
        const unitDiscountAmount = Number(
          d.unitDiscountAmount || currentDetail.unit_discount_amount || 0
        );

        const receivedValue =
          validatedReceivedUnits *
          (unitPrice + vatTaxAmount - unitDiscountAmount);
        const netAmount = Number(d.netAmount || currentDetail.net_amount || 0);
        const returnedValue = Math.max(0, netAmount - receivedValue);

        console.log(`Actualizando detalle ${d.id}:`, {
          currentQuantity,
          currentReceivedUnits,
          payloadQuantity,
          payloadReceivedUnits,
          validatedReceivedUnits,
          novelty,
          receivedValue,
          returnedValue,
        });

        await connection.execute(
          `UPDATE invoice_details SET
            quantity = ?,
            received_units = ?,
            novelty = ?,
            received_value = ?,
            returned_value = ?,
            unit_price = ?,
            vat_tax_amount = ?,
            unit_discount_amount = ?,
            net_amount = ?,
            rejection_cause_code_line = COALESCE(?, rejection_cause_code_line)
          WHERE id = ?`,
          [
            payloadQuantity,
            validatedReceivedUnits,
            novelty,
            receivedValue,
            returnedValue,
            unitPrice,
            vatTaxAmount,
            unitDiscountAmount,
            netAmount,
            d.rejection_cause_code_line ?? null,
            d.id,
          ]
        );
      }

      // Recalcular totales de la factura
      const [updatedDetails] = await connection.execute<RowDataPacket[]>(
        "SELECT * FROM invoice_details WHERE invoice_id = ?",
        [data.id]
      );

      const totalUnits = updatedDetails.reduce(
        (sum, detail) => sum + Number(detail.quantity || 0),
        0
      );

      const totalReceivedUnits = updatedDetails.reduce(
        (sum, detail) => sum + Number(detail.received_units || 0),
        0
      );

      const totalReceivedValue = updatedDetails.reduce(
        (sum, detail) => sum + Number(detail.received_value || 0),
        0
      );

      await connection.execute(
        `UPDATE invoices SET
          total_units = ?,
          updated_at = NOW()
        WHERE id = ?`,
        [totalUnits, data.id]
      );
    }

    await connection.commit();

    // Obtener la factura actualizada para retornar voucherDate en dos formatos
    const [updatedInvoiceRows] = await connection.execute<RowDataPacket[]>(
      "SELECT voucher_date FROM invoices WHERE id = ?",
      [data.id]
    );
    let voucherDate = null;
    let voucherDateRaw = null;
    if (updatedInvoiceRows.length > 0 && updatedInvoiceRows[0].voucher_date) {
      // yyyy-MM-dd para el input tipo date
      const d = new Date(updatedInvoiceRows[0].voucher_date);
      voucherDateRaw = d.toISOString().slice(0, 10);
      voucherDate = formatDateForFrontend(updatedInvoiceRows[0].voucher_date);
    }

    console.log("Factura actualizada exitosamente");

    return NextResponse.json({
      message: "Factura legalizada correctamente",
      success: true,
      voucherDate, // dd/MM/yyyy para mostrar
      voucherDateRaw, // yyyy-MM-dd para el input tipo date
    });
  } catch (error: any) {
    if (connection) await connection.rollback();

    console.error("PATCH invoice error:", error?.sqlMessage || error);

    return NextResponse.json(
      {
        message: "Error actualizando factura",
        error: error?.message || "Error desconocido",
      },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}
