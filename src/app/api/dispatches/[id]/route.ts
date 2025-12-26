import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { format as formatDateFns, isValid } from "date-fns";

function formatDateForFrontend(date: any) {
  if (!date) return "";
  const d = new Date(date);
  if (isValid(d)) return formatDateFns(d, "yyyy-MM-dd");
  return String(date);
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  let connection;
  try {
    connection = await getConnection();
    const [invoiceRows] = (await connection.execute(
      "SELECT * FROM invoices WHERE id = ?",
      [params.id]
    )) as [any[], any];
    if (!invoiceRows || invoiceRows.length === 0) {
      return NextResponse.json(
        { message: "Factura no encontrada" },
        { status: 404 }
      );
    }
    const invoice = invoiceRows[0];
    const [detailRows] = (await connection.execute(
      "SELECT * FROM invoice_details WHERE invoice_id = ?",
      [params.id]
    )) as [any[], any];
    return NextResponse.json({
      id: invoice.id.toString(),
      invoiceNumber: invoice.invoice_number,
      invoiceDate: formatDateForFrontend(invoice.invoice_date),
      invoiceDueDate: formatDateForFrontend(invoice.invoice_due_date),
      customerName: invoice.customer_name,
      customerTaxId: invoice.customer_tax_id,
      customerCity: invoice.customer_city,
      invoiceTotal: invoice.invoice_total,
      amountDue: invoice.amount_due,
      status: invoice.status,
      invoiceFileUrl: invoice.invoice_file_url,
      voucherFileUrl: invoice.voucher_file_url,
      voucherNumber: invoice.voucher_number,
      voucherAmount: invoice.voucher_amount,
      details: detailRows.map((d: any) => ({
        id: d.id.toString(),
        sku: d.sku,
        productName: d.product_name,
        unitOfMeasure: d.unit_of_measure,
        quantity: d.quantity,
        unitPrice: Number(d.unit_price) || 0,
        vatTaxAmount: Number(d.vat_tax_amount) || 0,
        unitDiscountAmount: Number(d.unit_discount_amount) || 0,
        netAmount: Number(d.net_amount) || 0,
        receivedUnits: d.received_units ?? 0,
        novelty: d.novelty ?? 0,
        receivedValue: Number(d.received_value) || 0,
        returnedValue: Number(d.returned_value) || 0,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error consultando factura" },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}
