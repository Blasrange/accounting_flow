import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export const exportToExcel = (
  data: any[],
  fileName: string,
  sheetName: string,
  bookType: "xlsx" | "xls" = "xlsx"
) => {
  // 1️⃣ Crear hoja desde JSON
  const worksheet = XLSX.utils.json_to_sheet(data);

  // 2️⃣ Detectar rango de la hoja
  const range = XLSX.utils.decode_range(worksheet["!ref"]!);

  // 3️⃣ Aplicar formato contabilidad a celdas de valor
  // Detectar columnas de valor por nombre
  const valorColumnas = [
    "Valor Factura",
    "Valor Neto",
    "Precio Unitario",
    "IVA",
    "Descuento",
    "Valor Recibido",
    "Valor Devuelto",
    "Valor Comprobante",
    "unit_price",
    "vat_tax_amount",
    "unit_discount_amount",
    "net_amount",
    "received_value",
    "returned_value",
    "voucher_amount",
    "invoice_total",
    "amount_due",
    "PRICE",
    "TAXES",
  ];
  // Obtener nombres de columnas
  const headers = Object.keys(data[0] || {});
  for (let C = range.s.c; C <= range.e.c; C++) {
    const headerCellRef = XLSX.utils.encode_cell({ r: range.s.r, c: C });
    const headerCell = worksheet[headerCellRef];
    const header = headerCell ? headerCell.v : null;
    if (header && valorColumnas.includes(header)) {
      // Aplicar formato contabilidad a toda la columna (excepto header)
      for (let R = range.s.r + 1; R <= range.e.r; R++) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = worksheet[cellRef];
        if (cell) {
          // Forzar conversión a número si viene como string
          if (typeof cell.v === "string") {
            // Eliminar símbolos y separadores
            const num = Number(cell.v.replace(/[^\d.-]/g, ""));
            if (!isNaN(num)) {
              cell.v = num;
              cell.t = "n";
            }
          }
          if (typeof cell.v === "number") {
            cell.t = "n";
            // Formato contabilidad estándar Excel (COP)
            cell.z = '_($* #,##0_);_($* (#,##0);_($* "-"??_);_(@_)';
          }
        }
      }
    }
  }

  // 4️⃣ Crear workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // 5️⃣ Exportar
  const excelBuffer = XLSX.write(workbook, {
    bookType,
    type: "array",
  });

  const mimeType =
    bookType === "xls"
      ? "application/vnd.ms-excel"
      : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";

  const extension = bookType === "xls" ? "xls" : "xlsx";

  const blob = new Blob([excelBuffer], {
    type: mimeType,
  });

  saveAs(blob, `${fileName}.${extension}`);
};
