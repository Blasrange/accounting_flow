"use client";

import { ReportesCards } from "@/components/dashboard/reportes-cards";
import { exportToExcel } from "@/lib/excel-export";
import { useToast } from "@/hooks/use-toast";

type DateRange = { from: Date; to: Date; type?: "day" | "month" | "year" };

// Helpers
function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildUrl(base: string, range?: DateRange) {
  let url = base;
  if (range?.from) url += `?from=${formatLocalDate(range.from)}`;
  if (range?.to)
    url += `${url.includes("?") ? "&" : "?"}to=${formatLocalDate(range.to)}`;
  return url;
}

function getDetalle(range?: DateRange) {
  if (!range) return "";
  if (range.type === "month") {
    const mes = (
      range.from?.toLocaleString("es-ES", { month: "long" }) || ""
    ).replace(/^./, (m) => m.toUpperCase());
    const from = range.from ? range.from.toLocaleDateString("es-ES") : "";
    const to = range.to ? range.to.toLocaleDateString("es-ES") : "";
    return `Mes de ${mes} ${range.from?.getFullYear()} (${from} al ${to})`;
  }
  if (range.type === "year") {
    const from = range.from ? range.from.toLocaleDateString("es-ES") : "";
    const to = range.to ? range.to.toLocaleDateString("es-ES") : "";
    return `Año ${range.from?.getFullYear()} (${from} al ${to})`;
  }
  if (range.type === "day") {
    return `Día ${range.from?.toLocaleDateString("es-ES")}`;
  }
  return "";
}

// Mappings
const statusMap = {
  Complete: "Completado",
  Incomplete: "Incompleto",
  Pending: "Pendiente",
  Cancelled: "Cancelado",
  Expired: "Vencido",
  Redispatch: "Re-despachado",
};

const rejection_cause_codeMap = {
  OE: "OE - No solicitado",
  TI: "TI - Avería en transporte",
  WC: "WC- Error en cliente",
  DU: "DU - Duplicado",
  RO: "RO - Cobro a transportadora",
  FQ: "FQ - Avería calidad ",
  CB: "CB - Sin dinero",
  WH: "WH - Faltante",
  CH: "CH - Fecha corta",
  SC: "SC - Sin Novedad",
};

const rejection_cause_codelineMap = {
  OE: "OE - No solicitado",
  TI: "TI - Avería en transporte",
  WC: "WC- Error en cliente",
  DU: "DU - Duplicado",
  RO: "RO - Cobro a transportadora",
  FQ: "FQ - Avería calidad ",
  CB: "CB - Sin dinero",
  WH: "WH - Faltante",
  CH: "CH - Fecha corta",
  SC: "SC - Sin Novedad",
};

const toCOP = (v: number) =>
  typeof v === "number"
    ? v.toLocaleString("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
      })
    : v;

// Handlers
export default function ReportesPage() {
  const { toast } = useToast();

  async function handleUIAF(range?: DateRange) {
    try {
      const url = buildUrl("/api/invoices-report/uiaf", range);
      const res = await fetch(url);
      const json = await res.json();

      if (!json.success) throw new Error("Error en la API UIAF");
      if (!json.data || json.data.length === 0) {
        let msg = `No hay información para el rango seleccionado.`;
        if (range?.type) msg += `\nTipo de selección: ${range.type}`;
        if (range?.from && range?.to) {
          msg += `\nDesde: ${range.from.toLocaleDateString(
            "es-ES"
          )} Hasta: ${range.to.toLocaleDateString("es-ES")}`;
        }
        toast({
          title: "Sin datos para el rango seleccionado",
          description: msg,
          className: "bg-red-100 text-red-800 border-red-300",
        });
        return;
      }

      const data = json.data.map((f: any) => ({
        "# Factura": f.invoice_number,
        Fecha: f.invoice_date
          ? new Date(f.invoice_date).toLocaleDateString("es-CO")
          : "",
        Cliente: f.customer_name,
        NIT: f.customer_tax_id,
        Ciudad: f.customer_city,
        "Valor Factura": toCOP(f.invoice_total),
        "Valor Neto": toCOP(f.amount_due),
        "Método de Pago": f.payment_method,
        Estado: statusMap[f.status as keyof typeof statusMap] || f.status,
        "Código Causa Rechazo":
          rejection_cause_codeMap[
            f.rejection_cause_code as keyof typeof rejection_cause_codeMap
          ] || f.rejection_cause_code,
        Creada: f.created_at
          ? new Date(f.created_at).toLocaleDateString("es-CO")
          : "",
        Peso: f.total_weight,
        "Unidades Despachadas": f.total_units_despachadas,
        "Unidades con Novedad": f.total_units_con_novedad,
        "Unidades Recibidas": f.total_units_recibidas,
        "Valor Recibido": toCOP(f.total_valor_recibido),
        "Valor Devuelto": toCOP(f.total_valor_devuelto),
        "Número Comprobante": f.voucher_number,
        "Valor Comprobante": toCOP(f.voucher_amount),
      }));

      exportToExcel(data, "Resumen de Recaudos", "UIAF");
      toast({
        title: "Reporte descargado",
        description: `${
          getDetalle(range) ? getDetalle(range) + "\n" : ""
        }Archivo: Resumen de Recaudos_UIAF.xlsx`,
        className: "bg-green-100 text-green-800 border-green-300",
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "Error generando reporte UIAF",
        description:
          "Ocurrió un problema al generar o descargar el reporte. Intenta nuevamente.",
        className: "bg-red-100 text-red-800 border-red-300",
      });
    }
  }

  async function handleVehiculos(range?: DateRange) {
    try {
      const url = buildUrl("/api/invoices-report/lineas", range);
      const res = await fetch(url);
      const json = await res.json();

      if (!json.success) throw new Error("Error en la API de líneas");
      if (!json.data || json.data.length === 0) {
        let msg = `No hay información para el rango seleccionado.`;
        if (range?.type) msg += `\nTipo de selección: ${range.type}`;
        if (range?.from && range?.to) {
          msg += `\nDesde: ${range.from.toLocaleDateString(
            "es-ES"
          )} Hasta: ${range.to.toLocaleDateString("es-ES")}`;
        }
        toast({
          title: "Sin datos para el rango seleccionado",
          description: msg,
          className: "bg-red-100 text-red-800 border-red-300",
        });
        return;
      }

      const data = json.data.map((f: any) => ({
        "# Factura": f.invoice_number,
        Fecha: f.invoice_date
          ? new Date(f.invoice_date).toLocaleDateString("es-CO")
          : "",
        Cliente: f.customer_name,
        NIT: f.customer_tax_id,
        Ciudad: f.customer_city,
        "Material / SKU": f.sku,
        Producto: f.product_name,
        "U.Medida": f.unit_of_measure,
        Cantidad: f.quantity,
        "Precio Unitario": f.unit_price,
        IVA: f.vat_tax_amount,
        Descuento: f.unit_discount_amount,
        "Valor Neto": f.net_amount,
        "Unidades Recibidas": f.received_units ?? 0,
        Novedad: f.novelty ?? 0,
        "Valor Recibido": f.received_value ?? 0,
        "Valor Devuelto": f.returned_value ?? 0,
        "Número Comprobante": f.voucher_number,
        "Valor Comprobante": f.voucher_amount,
        "Método de Pago": f.payment_method,
        Estado: statusMap[f.status as keyof typeof statusMap] || f.status,
        "Causa Rechazo Factura":
          rejection_cause_codeMap[
            f.rejection_cause_code as keyof typeof rejection_cause_codeMap
          ] || f.rejection_cause_code,
        "Causa Rechazo Líneas":
          rejection_cause_codelineMap[
            f.rejection_cause_code_line as keyof typeof rejection_cause_codelineMap
          ] || f.rejection_cause_code_line,
        Creada: f.created_at
          ? new Date(f.created_at).toLocaleDateString("es-CO")
          : "",
      }));

      exportToExcel(data, "Reporte Facturas por Líneas", "Facturas_Lineas");
      toast({
        title: "Reporte descargado",
        description: `${
          getDetalle(range) ? getDetalle(range) + "\n" : ""
        }Archivo: Reporte Facturas por Líneas_Facturas_Lineas.xlsx`,
        className: "bg-green-100 text-green-800 border-green-300",
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "Error generando reporte de líneas",
        description:
          "Ocurrió un problema al generar o descargar el reporte. Intenta nuevamente.",
        className: "bg-red-100 text-red-800 border-red-300",
      });
    }
  }

  async function handleManifiesto(range?: DateRange) {
    try {
      const url = buildUrl("/api/invoices-report/wms", range);
      const res = await fetch(url);
      const json = await res.json();

      if (!json.success) throw new Error("Error en la API WMS");
      if (!json.data || json.data.length === 0) {
        let msg = `No hay información para el rango seleccionado.`;
        if (range?.type) msg += `\nTipo de selección: ${range.type}`;
        if (range?.from && range?.to) {
          msg += `\nDesde: ${range.from.toLocaleDateString(
            "es-ES"
          )} Hasta: ${range.to.toLocaleDateString("es-ES")}`;
        }
        toast({
          title: "Sin datos para el rango seleccionado",
          description: msg,
          className: "bg-red-100 text-red-800 border-red-300",
        });
        return;
      }

      const formatFecha = (fecha?: string | Date | null) => {
        if (!fecha) return "";
        const d = new Date(fecha);
        return isNaN(d.getTime()) ? "" : d.toLocaleDateString("es-CO");
      };

      const data = json.data.map((f: any) => ({
        N_ORDER: f.N_ORDER,
        ORDER2: f.ORDER2,
        PURCHASE_ORDER: f.PURCHASE_ORDER,
        INVOICE: f.INVOICE,
        PROVIDER_UID: f.PROVIDER_UID,
        ORDER_DATE: formatFecha(f.UPDATED_AT),
        SERVICE_DATE: formatFecha(f.UPDATED_AT),
        INBOUNDTYPE_CODE: f.INBOUNDTYPE_CODE,
        NOTE: f.NOTE,
        SKU: f.SKU,
        LOTE: f.LOTE,
        "FECHA DE VENCIMIE": f["FECHA DE VENCIMIE"],
        "FECHA DE FABRICA": f["FECHA DE FABRICA"],
        SERIAL: f.SERIAL,
        ESTADO_CALIDAD: f.ESTADO_CALIDAD,
        QTY: f.QTY,
        UOM_CODE: f.UOM_CODE,
        REFERENCE: f.REFERENCE,
        PRICE: f.PRICE,
        TAXES: f.TAXES,
        IBL_LPN_CODE: f.IBL_LPN_CODE,
        IBL_WEIGHT: f.IBL_WEIGHT,
      }));

      exportToExcel(data, "Reporte_WMS", "WMS", "xls");
      toast({
        title: "Reporte descargado",
        description: `${
          getDetalle(range) ? getDetalle(range) + "\n" : ""
        }Archivo: Reporte_WMS_WMS.xls`,
        className: "bg-green-100 text-green-800 border-green-300",
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "Error generando reporte WMS",
        description:
          "Ocurrió un problema al generar o descargar el reporte. Intenta nuevamente.",
        className: "bg-red-100 text-red-800 border-red-300",
      });
    }
  }

  const handleTarifas = () => alert("Generar reporte Tarifas (pendiente)");
  const handleOrdenes = () =>
    alert("Generar reporte Órdenes de cargue (pendiente)");

  return (
    <div className="p-6">
      <ReportesCards
        onUIAF={handleUIAF}
        onVehiculos={handleVehiculos}
        onManifiesto={handleManifiesto}
        onTarifas={handleTarifas}
        onOrdenes={handleOrdenes}
      />
    </div>
  );
}
