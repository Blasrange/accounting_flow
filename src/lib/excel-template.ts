import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// Encabezado de factura (según tabla)
const invoiceHeaderFields = [
  "INVOICE_NUMBER",
  "DELIVERY_NUMBER",
  "INTERNAL_ORDER_NUMBER",
  "PURCHASE_ORDER_NUMBER",
  "INVOICE_DATE",
  "INVOICE_DUE_DATE",
  "CUSTOMER_CODE",
  "CUSTOMER_TAX_ID",
  "CUSTOMER_NAME",
  "CUSTOMER_PHONE",
  "CUSTOMER_ADDRESS",
  "CUSTOMER_CITY",
  "CUSTOMER_STATE",
  "ZIP_CODE",
  "INVOICE_TOTAL",
  "VAT_TAX_AMOUNT",
  "TOTAL_DISCOUNT",
  "AMOUNT_DUE",
  "PAYMENT_METHOD",
  "TOTAL_LINES",
  "TOTAL_UNITS",
  "NOTES",
];

// Detalles de factura (según tabla)
const invoiceDetailFields = [
  "INVOICE_NUMBER",
  "SKU",
  "PRODUCT_NAME",
  "UNIT_OF_MEASURE",
  "QUANTITY",
  "BATCH_NUMBER",
  "SERIAL_NUMBER",
  "UNIT_PRICE",
  "VAT_TAX_AMOUNT",
  "UNIT_DISCOUNT_AMOUNT",
  "NET_AMOUNT",
  "WEIGHT",
  "LENGTH",
  "HEIGHT",
  "WIDTH",
];

export const downloadExcelTemplate = () => {
  // Crear hojas de trabajo para encabezado y detalles
  const headerSheet = XLSX.utils.aoa_to_sheet([invoiceHeaderFields]);
  const detailSheet = XLSX.utils.aoa_to_sheet([invoiceDetailFields]);

  // Crear libro de trabajo
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, headerSheet, "Headers");
  XLSX.utils.book_append_sheet(workbook, detailSheet, "Details");

  // Escribir el libro de trabajo en un buffer
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

  // Crear un Blob
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
  });

  // Iniciar la descarga
  saveAs(blob, "plantilla_facturas.xlsx");
};
