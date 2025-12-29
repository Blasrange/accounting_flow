"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import type { JSX } from "react";
import type { Invoice, InvoiceDetail } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MoreHorizontal,
  Search,
  FilePenLine,
  Upload,
  X,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { EditDespachoDialog } from "./edit-despacho-dialog";
import { Input } from "../ui/input";
import { DataTablePagination } from "./data-table-pagination";
import { useToast } from "@/hooks/use-toast";
import {
  differenceInDays,
  parse,
  isValid,
  format as formatDateFns,
  parseISO,
} from "date-fns";
// Función robusta para parsear fechas desde Excel
function parseExcelDate(value: any): string {
  if (!value) return "";
  // Si es un objeto Date
  if (value instanceof Date && isValid(value)) {
    return formatDateFns(value, "yyyy-MM-dd");
  }
  // Si es un número (serial Excel)
  if (typeof value === "number") {
    // Excel serial date: días desde 1899-12-30
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const parsed = new Date(excelEpoch.getTime() + value * 86400000);
    if (isValid(parsed)) {
      return formatDateFns(parsed, "yyyy-MM-dd");
    }
  }
  // Si es string, probar varios formatos y normalizar separadores
  if (typeof value === "string") {
    // Normalizar separadores a '-'
    let normalized = value.replace(/\//g, "-");
    // Probar todos los formatos posibles de día, mes y año
    const formats = [
      "dd-MM-yyyy",
      "MM-dd-yyyy",
      "yyyy-MM-dd",
      "d-M-yyyy",
      "M-d-yyyy",
      "yyyy-M-d",
      "yyyy-d-M",
      "dd-MM-yy",
      "MM-dd-yy",
      "d-M-yy",
      "M-d-yy",
      "yy-MM-dd",
      "yy-dd-MM",
    ];
    for (const fmt of formats) {
      const parsed = parse(normalized, fmt, new Date());
      if (isValid(parsed)) {
        return formatDateFns(parsed, "yyyy-MM-dd");
      }
    }
    // Si es ISO
    const isoParsed = new Date(value);
    if (isValid(isoParsed)) {
      return formatDateFns(isoParsed, "yyyy-MM-dd");
    }
  }
  return "";
}
import * as XLSX from "xlsx";
import { UploadDialog } from "./upload-dialog";

type FacturasDashboardProps = {
  initialInvoices: Invoice[];
};

export function FacturasDashboard({ initialInvoices }: FacturasDashboardProps) {
  const [invoices, setInvoices] = useState<Invoice[]>(
    Array.isArray(initialInvoices) ? initialInvoices : []
  );
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    setPageIndex(0);
  }, [searchTerm, statusFilter]);

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (invoiceId: string) => {
    setInvoices(invoices.filter((invoice) => invoice.id !== invoiceId));
    toast({
      title: "Factura Eliminada",
      description: `La factura ha sido eliminada correctamente.`,
      className: "bg-green-100 text-green-800 border-green-300",
    });
  };

  const handleSave = async (updatedInvoice: Invoice) => {
    try {
      let response;
      if (updatedInvoice.id) {
        // Normalizar status a inglés para el backend
        const statusMap: Record<string, string> = {
          Pendiente: "Pending",
          Completo: "Complete",
          Incompleto: "Incomplete",
          Cancelado: "Cancelled",
          Vencido: "Expired",
          Redespacho: "Redispatch",
        };
        const status =
          statusMap[updatedInvoice.status] || updatedInvoice.status;
        // Convertir undefined a null en los campos opcionales
        const cleanInvoice = (obj: any): any => {
          if (Array.isArray(obj)) {
            return obj.map(cleanInvoice);
          } else if (obj && typeof obj === "object") {
            const newObj: any = {};
            for (const key in obj) {
              if (obj[key] === undefined) {
                newObj[key] = null;
              } else {
                newObj[key] = cleanInvoice(obj[key]);
              }
            }
            return newObj;
          }
          return obj;
        };
        const cleaned = cleanInvoice({
          ...updatedInvoice,
          id: Number(updatedInvoice.id),
          status,
        });
        response = await fetch("/api/dispatches", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cleaned),
        });
      } else {
        response = await fetch("/api/dispatches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedInvoice),
        });
      }
      if (!response.ok) throw new Error("Error al guardar en la base de datos");
      toast({
        title: "Factura actualizada",
        description: "Los cambios se guardaron correctamente.",
        className: "bg-green-100 text-green-800 border-green-300",
      });
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la factura en la base de datos.",
        className: "bg-red-100 text-red-800 border-red-300",
      });
    }
  };

  const handleCloseDialogs = () => {
    setEditingInvoice(null);
    setIsEditDialogOpen(false);
    setIsUploadDialogOpen(false);
  };

  const getDynamicStatus = (
    invoice: Invoice
  ): {
    label: string;
    variant: "default";
    className: string;
    icon: JSX.Element | null;
  } => {
    // Usar invoiceDate para cálculo de días
    const daysDiff = differenceInDays(
      new Date(),
      new Date(invoice.invoiceDate)
    );

    switch (invoice.status) {
      case "Completo":
        return {
          label: "Legalizado",
          variant: "default",
          className: "bg-green-100 text-green-800 border border-green-200",
          icon: (
            <CheckCircle className="inline mr-1 h-4 w-4 text-green-600 align-text-bottom" />
          ),
        };
      case "Incompleto":
        return {
          label: "Legalizado con Novedad",
          variant: "default",
          className: "bg-yellow-100 text-yellow-800 border border-yellow-200",
          icon: (
            <AlertTriangle className="inline mr-1 h-4 w-4 text-yellow-600 align-text-bottom" />
          ),
        };
      case "Pendiente":
        if (daysDiff > 3) {
          return {
            label: "Pendiente Crítico",
            variant: "default",
            className: "bg-red-100 text-red-800 border border-red-200",
            icon: (
              <XCircle className="inline mr-1 h-4 w-4 text-red-600 align-text-bottom" />
            ),
          };
        }
        return {
          label: "En Proceso",
          variant: "default",
          className: "bg-blue-100 text-blue-800 border border-blue-200",
          icon: (
            <Clock className="inline mr-1 h-4 w-4 text-blue-600 align-text-bottom" />
          ),
        };
      case "Redespacho":
        return {
          label: "Redespacho",
          variant: "default",
          className: "bg-purple-100 text-purple-800 border border-purple-200",
          icon: (
            <RefreshCw className="inline mr-1 h-4 w-4 text-purple-600 align-text-bottom" />
          ),
        };
      case "Cancelado":
        return {
          label: "Cancelado",
          variant: "default",
          className: "bg-gray-200 text-gray-800 border border-gray-300",
          icon: (
            <XCircle className="inline mr-1 h-4 w-4 text-gray-600 align-text-bottom" />
          ),
        };
      default:
        return {
          label: invoice.status,
          variant: "default",
          className: "",
          icon: null,
        };
    }
  };

  const filteredInvoices = useMemo(() => {
    if (!Array.isArray(invoices)) return [];
    return invoices.filter((invoice) => {
      const searchLower = searchTerm.toLowerCase();
      const dynamicStatus = getDynamicStatus(invoice).label;

      const matchesSearch =
        (invoice.invoiceNumber || "").toLowerCase().includes(searchLower) ||
        invoice.customerName.toLowerCase().includes(searchLower) ||
        invoice.customerCity.toLowerCase().includes(searchLower) ||
        (invoice.customerTaxId || "").toLowerCase().includes(searchLower);

      const matchesStatus =
        statusFilter === "all" ||
        dynamicStatus.toLowerCase().replace(/ /g, "") === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  // Mostrar las facturas más recientes primero
  const paginatedInvoices = useMemo(() => {
    // Orden ascendente: las primeras cargadas primero
    const startIndex = pageIndex * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredInvoices.slice(startIndex, endIndex);
  }, [filteredInvoices, pageIndex, pageSize]);

  const pageCount = Math.ceil(filteredInvoices.length / pageSize);

  const calculateTotalUnits = (details: InvoiceDetail[]) => {
    return details.reduce((total, d) => total + d.quantity, 0);
  };

  const calculateFacturaAmount = (details: InvoiceDetail[]) => {
    return details.reduce((total, d) => total + d.netAmount, 0);
  };

  // Aquí deberás adaptar la lógica para procesar dos hojas: Headers y Details
  // y asociar los detalles a cada factura
  const handleProcessFile = (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const headersSheet = workbook.Sheets["Headers"];
          const detailsSheet = workbook.Sheets["Details"];
          if (!headersSheet || !detailsSheet) {
            throw new Error(
              "El archivo debe tener dos hojas: Headers y Details"
            );
          }
          const headersData = XLSX.utils.sheet_to_json(headersSheet) as any[];
          const detailsData = XLSX.utils.sheet_to_json(detailsSheet) as any[];

          // Validar y mapear facturas y detalles
          const invoicesMap: Record<string, Invoice> = {};
          const errors: { row: number; error: string; data: any }[] = [];

          headersData.forEach((row, index) => {
            try {
              if (!row["INVOICE_NUMBER"])
                throw new Error("Falta INVOICE_NUMBER");
              const invoiceNumber = row["INVOICE_NUMBER"].toString();
              const invoiceDate = parseExcelDate(row["INVOICE_DATE"] || "");
              let invoice_due_date = parseExcelDate(
                row["INVOICE_DUE_DATE"] || ""
              );
              // Si no hay fecha de vencimiento, usar la fecha de factura o una fecha por defecto
              if (!invoice_due_date) {
                invoice_due_date =
                  invoiceDate || new Date().toISOString().slice(0, 10);
              }
              invoicesMap[invoiceNumber] = {
                id: "",
                invoiceNumber,
                deliveryNumber: row["DELIVERY_NUMBER"] || "",
                internalOrderNumber: row["INTERNAL_ORDER_NUMBER"] || "",
                purchaseOrderNumber: row["PURCHASE_ORDER_NUMBER"] || "",
                invoiceDate,
                invoiceDueDate: invoice_due_date,
                customerCode: row["CUSTOMER_CODE"] || "",
                customerTaxId: row["CUSTOMER_TAX_ID"] || "",
                customerName: row["CUSTOMER_NAME"] || "",
                customerPhone: row["CUSTOMER_PHONE"] || "",
                customerAddress: row["CUSTOMER_ADDRESS"] || "",
                customerCity: row["CUSTOMER_CITY"] || "",
                customerState: row["CUSTOMER_STATE"] || "",
                zipCode: row["ZIP_CODE"] || "",
                invoiceTotal: Number(row["INVOICE_TOTAL"] || 0),
                vatTaxAmount: Number(row["VAT_TAX_AMOUNT"] || 0),
                totalDiscount: Number(row["TOTAL_DISCOUNT"] || 0),
                amountDue: Number(row["AMOUNT_DUE"] || 0),
                paymentMethod: row["PAYMENT_METHOD"] || "",
                status: "Pending", // Debe ser en inglés para el backend
                invoiceFileUrl: "",
                voucherFileUrl: "",
                voucherNumber: row["VOUCHER_NUMBER"] || "",
                voucherAmount: Number(row["VOUCHER_AMOUNT"] || 0),
                notes: row["NOTES"] || "",
                totalLines: Number(row["TOTAL_LINES"] || 0),
                totalUnits: Number(row["TOTAL_UNITS"] || 0),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                rejection_cause_code: row["REJECTION_CAUSE_CODE"] || "SC",
                details: [],
              };
            } catch (error: any) {
              errors.push({ row: index + 2, error: error.message, data: row });
            }
          });

          detailsData.forEach((row, index) => {
            try {
              if (!row["INVOICE_NUMBER"])
                throw new Error("Falta INVOICE_NUMBER en Details");
              const invoiceNumber = row["INVOICE_NUMBER"].toString();
              if (!invoicesMap[invoiceNumber]) return;
              const detail: InvoiceDetail = {
                id: "",
                sku: row["SKU"] || "",
                productName: row["PRODUCT_NAME"] || "",
                unitOfMeasure: row["UNIT_OF_MEASURE"] || "",
                quantity: Number(row["QUANTITY"] || 0),
                batchNumber: row["BATCH_NUMBER"] || "",
                serialNumber: row["SERIAL_NUMBER"] || "",
                unitPrice: Number(row["UNIT_PRICE"] || 0),
                vatTaxAmount: Number(row["VAT_TAX_AMOUNT"] || 0),
                unitDiscountAmount: Number(row["UNIT_DISCOUNT_AMOUNT"] || 0),
                netAmount: Number(row["NET_AMOUNT"] || 0),
                weight: Number(row["WEIGHT"] || 0),
                length: Number(row["LENGTH"] || 0),
                height: Number(row["HEIGHT"] || 0),
                width: Number(row["WIDTH"] || 0),
                rejection_cause_code_line:
                  row["REJECTION_CAUSE_CODE_LINE"] || "SC",
              };
              invoicesMap[invoiceNumber].details.push(detail);
            } catch (error: any) {
              errors.push({ row: index + 2, error: error.message, data: row });
            }
          });

          // Validar que cada factura tenga al menos un detalle
          Object.values(invoicesMap).forEach((invoice, idx) => {
            if (!invoice.details || invoice.details.length === 0) {
              errors.push({
                row:
                  headersData.findIndex(
                    (r) =>
                      r["INVOICE_NUMBER"]?.toString() === invoice.invoiceNumber
                  ) + 2,
                error: `La factura #${invoice.invoiceNumber} no tiene detalles asociados y no se cargó.`,
                data: invoice,
              });
              // Marcar para no guardar
              (invoice as any).__skip = true;
            }
          });

          // Guardar cada factura en la base de datos usando la API
          for (const invoice of Object.values(invoicesMap)) {
            try {
              // Saltar si no tiene detalles
              if ((invoice as any).__skip) continue;
              // Verificar si ya existe una factura con el mismo número
              const existe = invoices.some(
                (inv) => inv.invoiceNumber === invoice.invoiceNumber
              );
              if (existe) {
                errors.push({
                  row:
                    headersData.findIndex(
                      (r) =>
                        r["INVOICE_NUMBER"]?.toString() ===
                        invoice.invoiceNumber
                    ) + 2,
                  error: `Factura duplicada: La factura #${invoice.invoiceNumber} ya existe y no se cargó.`,
                  data: invoice,
                });
                continue;
              }
              const response = await fetch("/api/dispatches", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(invoice),
              });
              if (!response.ok) {
                throw new Error("Error al guardar en la base de datos");
              }
            } catch (err) {
              // Puedes agregar manejo de errores por factura si lo deseas
            }
          }

          // Refrescar la lista desde la base de datos
          const res = await fetch("/api/dispatches");
          const invoicesActualizadas = await res.json();
          setInvoices(invoicesActualizadas);

          // Solo cuenta como éxito las facturas realmente insertadas (no duplicadas ni sin detalles)
          const totalIntentos = Object.keys(invoicesMap).length;
          const facturasDuplicadas = errors.filter((e) =>
            e.error.includes("Factura duplicada")
          ).length;
          const facturasSinDetalles = errors.filter((e) =>
            e.error.includes("no tiene detalles asociados")
          ).length;
          const successCount =
            totalIntentos - facturasDuplicadas - facturasSinDetalles;

          resolve({
            successCount,
            errorCount: errors.length,
            errors,
          });
        } catch (error: any) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(file);
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de búsqueda y botón */}
      <div className="bg-white rounded-xl shadow p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-gray-100">
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </span>
          <Input
            placeholder="Buscar por Factura, Cliente, NIT, Ciudad, Placa..."
            className="pl-10 rounded-full border-gray-200 focus:border-primary/50 focus:ring-0 h-9 text-base bg-gray-50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          variant="default"
          className="h-9 bg-[#5b8fd7] hover:bg-[#4477be] text-white font-semibold rounded-md flex items-center gap-2"
          onClick={() => setIsUploadDialogOpen(true)}
        >
          <Upload className="mr-2 h-4 w-4" />
          Cargar Excel
        </Button>
      </div>

      {/* Tabla de facturas */}
      <div className="bg-white rounded-xl shadow border border-gray-100">
        <div className="overflow-x-auto w-full">
          <Table className="w-full min-w-max">
            <TableHeader>
              <TableRow>
                <TableHead>Factura #</TableHead>
                <TableHead>Cliente / NIT</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>Fecha Emisión</TableHead>
                <TableHead>Fecha Vencimiento</TableHead>
                <TableHead className="text-center">Uds. Facturadas</TableHead>
                <TableHead className="text-center">Novedad</TableHead>
                <TableHead className="text-right">Valor Factura</TableHead>
                <TableHead className="text-center">Valor Devuelto</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedInvoices.map((invoice) => {
                const {
                  label: statusLabel,
                  variant: statusVariant,
                  className: statusClassName,
                  icon: statusIcon,
                } = getDynamicStatus(invoice);

                // Calcular totales de Novedad y Valor Devuelto
                let totalNovedad = 0;
                let totalValorDevuelto = 0;
                if (Array.isArray(invoice.details)) {
                  invoice.details.forEach((detail) => {
                    const receivedUnits =
                      typeof detail.receivedUnits === "number"
                        ? detail.receivedUnits
                        : detail.quantity ?? 0;
                    const novelty = (detail.quantity ?? 0) - receivedUnits;
                    // Usar el valor real de la base de datos
                    const returnedValue =
                      typeof detail.returnedValue === "number"
                        ? detail.returnedValue
                        : 0;
                    totalNovedad += novelty;
                    totalValorDevuelto += returnedValue;
                  });
                }

                return (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{invoice.customerName}</div>
                      <div className="text-sm text-muted-foreground">
                        {invoice.customerTaxId}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {invoice.customerCity}
                    </TableCell>
                    <TableCell>
                      {invoice.invoiceDate
                        ? (() => {
                            // Si viene como ISO, usar parseISO
                            let parsed;
                            if (
                              typeof invoice.invoiceDate === "string" &&
                              invoice.invoiceDate.length > 10
                            ) {
                              parsed = parseISO(invoice.invoiceDate);
                              if (isValid(parsed))
                                return formatDateFns(parsed, "dd/MM/yyyy");
                            }
                            // Si viene como yyyy-MM-dd
                            parsed = parse(
                              invoice.invoiceDate,
                              "yyyy-MM-dd",
                              new Date()
                            );
                            if (isValid(parsed))
                              return formatDateFns(parsed, "dd/MM/yyyy");
                            // Si viene como dd/MM/yyyy
                            parsed = parse(
                              invoice.invoiceDate,
                              "dd/MM/yyyy",
                              new Date()
                            );
                            if (isValid(parsed))
                              return formatDateFns(parsed, "dd/MM/yyyy");
                            // Si viene como Date
                            if (
                              (invoice.invoiceDate as any) instanceof Date &&
                              isValid(invoice.invoiceDate as any)
                            ) {
                              return formatDateFns(
                                invoice.invoiceDate,
                                "dd/MM/yyyy"
                              );
                            }
                            return invoice.invoiceDate;
                          })()
                        : ""}
                    </TableCell>
                    <TableCell>
                      {invoice.invoiceDueDate
                        ? (() => {
                            // Si viene como ISO, usar parseISO
                            let parsed;
                            if (
                              typeof invoice.invoiceDueDate === "string" &&
                              invoice.invoiceDueDate.length > 10
                            ) {
                              parsed = parseISO(invoice.invoiceDueDate);
                              if (isValid(parsed))
                                return formatDateFns(parsed, "dd/MM/yyyy");
                            }
                            // Si viene como yyyy-MM-dd
                            parsed = parse(
                              invoice.invoiceDueDate,
                              "yyyy-MM-dd",
                              new Date()
                            );
                            if (isValid(parsed))
                              return formatDateFns(parsed, "dd/MM/yyyy");
                            // Si viene como dd/MM/yyyy
                            parsed = parse(
                              invoice.invoiceDueDate,
                              "dd/MM/yyyy",
                              new Date()
                            );
                            if (isValid(parsed))
                              return formatDateFns(parsed, "dd/MM/yyyy");
                            // Si viene como Date
                            if (
                              (invoice.invoiceDueDate as any) instanceof Date &&
                              isValid(invoice.invoiceDueDate as any)
                            ) {
                              return formatDateFns(
                                invoice.invoiceDueDate,
                                "dd/MM/yyyy"
                              );
                            }
                            return invoice.invoiceDueDate;
                          })()
                        : ""}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {invoice.totalUnits}
                    </TableCell>
                    <TableCell className="text-center font-medium text-red-700">
                      {totalNovedad.toLocaleString("es-CO")}
                    </TableCell>
                    <TableCell className="text-center font-medium text-indigo-700">
                      {new Intl.NumberFormat("es-CO", {
                        style: "currency",
                        currency: "COP",
                        minimumFractionDigits: 0,
                      }).format(invoice.amountDue)}
                    </TableCell>
                    <TableCell className="text-center font-medium text-red-700">
                      {new Intl.NumberFormat("es-CO", {
                        style: "currency",
                        currency: "COP",
                        minimumFractionDigits: 0,
                      }).format(totalValorDevuelto)}
                    </TableCell>
                    <TableCell
                      style={{
                        maxWidth: 140,
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                        lineHeight: 1.2,
                        paddingTop: 6,
                        paddingBottom: 6,
                      }}
                    >
                      <Badge
                        variant={statusVariant}
                        className={`capitalize rounded-md flex items-center gap-1 text-wrap break-words whitespace-normal ${statusClassName}`}
                        style={{
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                          lineHeight: 1.2,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          maxWidth: 120,
                          paddingTop: 2,
                          paddingBottom: 2,
                        }}
                      >
                        <span className="flex items-center gap-1 w-full">
                          {statusIcon}
                          <span className="block w-full break-words whitespace-normal text-left">
                            {statusLabel}
                          </span>
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {invoice.status !== "Cancelado" && (
                            <DropdownMenuItem
                              onClick={() => handleEdit(invoice)}
                            >
                              <FilePenLine className="mr-2 h-4 w-4" />
                              <span>Legalizar / Editar</span>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={async () => {
                              try {
                                // Normalizar status a inglés y limpiar undefined/null igual que en handleSave
                                const statusMap = {
                                  Pendiente: "Pending",
                                  Completo: "Complete",
                                  Incompleto: "Incomplete",
                                  Cancelado: "Cancelled",
                                  Vencido: "Expired",
                                  Redespacho: "Redispatch",
                                };
                                const status = statusMap["Cancelado"];
                                // Convertir undefined a null en los campos opcionales
                                const cleanInvoice = (obj: any): any => {
                                  if (Array.isArray(obj)) {
                                    return obj.map(cleanInvoice);
                                  } else if (obj && typeof obj === "object") {
                                    const newObj: any = {};
                                    for (const key in obj) {
                                      if (obj[key] === undefined) {
                                        newObj[key] = null;
                                      } else {
                                        newObj[key] = cleanInvoice(obj[key]);
                                      }
                                    }
                                    return newObj;
                                  }
                                  return obj;
                                };
                                const patchInvoice = cleanInvoice({
                                  ...invoice,
                                  id: Number(invoice.id),
                                  status,
                                  rejection_cause_code:
                                    invoice.rejection_cause_code || "SC",
                                });
                                const response = await fetch(
                                  "/api/dispatches",
                                  {
                                    method: "PATCH",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify(patchInvoice),
                                  }
                                );
                                if (!response.ok)
                                  throw new Error(
                                    "Error al cancelar la factura"
                                  );
                                const res = await fetch("/api/dispatches");
                                const invoicesActualizadas = await res.json();
                                setInvoices(invoicesActualizadas);
                                toast({
                                  title: "Factura cancelada",
                                  description: `La factura #${invoice.invoiceNumber} ha sido cancelada.`,
                                  className:
                                    "bg-green-100 text-green-800 border-green-300",
                                });
                              } catch (error) {
                                toast({
                                  title: "Error",
                                  description:
                                    "No se pudo cancelar la factura.",
                                  className:
                                    "bg-red-100 text-red-800 border-red-300",
                                });
                              }
                            }}
                          >
                            <X className="mr-2 h-4 w-4 text-destructive" />
                            <span>Cancelar factura</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Paginador */}
      <div className="bg-white rounded-xl shadow border border-gray-100 px-4 py-2 flex items-center justify-between">
        <DataTablePagination
          count={filteredInvoices.length}
          pageIndex={pageIndex}
          pageSize={pageSize}
          setPageIndex={setPageIndex}
          setPageSize={setPageSize}
          pageCount={pageCount}
          rowsInPage={paginatedInvoices.length}
        />
      </div>

      <UploadDialog
        isOpen={isUploadDialogOpen}
        onClose={handleCloseDialogs}
        onProcessFile={handleProcessFile}
      />

      {/* Modal de edición de factura */}
      <EditDespachoDialog
        isOpen={isEditDialogOpen}
        invoice={editingInvoice}
        onSave={handleSave}
        onClose={handleCloseDialogs}
      />
    </div>
  );
}
