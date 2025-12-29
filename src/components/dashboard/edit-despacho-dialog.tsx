"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import type { Invoice } from "@/lib/types";
import { useEffect, useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  File,
  X,
  Save,
  Eye,
  User,
  Package,
  FileText,
  Search,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

type EditDespachoDialogProps = {
  isOpen: boolean;
  invoice: Invoice | null;
  onSave: (invoice: Invoice) => void;
  onClose: () => void;
};

export function EditDespachoDialog({
  isOpen,
  invoice,
  onSave,
  onClose,
}: EditDespachoDialogProps) {
  // Estado para controlar qué modal de causal está abierto (por id de detalle)
  const [showCausalModalId, setShowCausalModalId] = useState<string | null>(
    null
  );
  const { register, handleSubmit, reset, watch, control } = useForm<Invoice>({
    defaultValues: {
      status: undefined,
    },
  });

  // Para manipular detalles de la factura
  const { fields: detailsFields, update: updateDetail } = useFieldArray({
    control,
    name: "details",
  });
  // Estado para causal seleccionada temporalmente en el modal
  const [tempCausal, setTempCausal] = useState<string>("");
  const [savingCausal, setSavingCausal] = useState(false);
  const { toast } = useToast();
  const [facturaFileName, setFacturaFileName] = useState<string | null>(null);
  const [baucherFileName, setBaucherFileName] = useState<string | null>(null);
  const [skuFilter, setSkuFilter] = useState<string>("");

  // State for receivedUnits by detail
  const [receivedUnitsState, setReceivedUnitsState] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    if (invoice) {
      // voucherDate debe venir en formato yyyy-MM-dd desde el backend
      let voucherDate = invoice.voucherDate || "";
      // Si viene en formato dd/MM/yyyy, lo convertimos a yyyy-MM-dd
      if (voucherDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [dd, mm, yyyy] = voucherDate.split("/");
        voucherDate = `${yyyy}-${mm}-${dd}`;
      }
      reset({
        ...invoice,
        voucherDate,
        status: invoice.status || "",
        rejection_cause_code: invoice.rejection_cause_code ?? "SC",
      });
      setFacturaFileName(
        invoice.invoiceFileUrl
          ? invoice.invoiceFileUrl.split("/").pop() ?? null
          : null
      );
      setBaucherFileName(
        invoice.voucherFileUrl
          ? invoice.voucherFileUrl.split("/").pop() ?? null
          : null
      );

      // Inicializar receivedUnitsState con quantity solo si receivedUnits es null o undefined
      const initialReceivedUnits: Record<string, number> = {};
      if (invoice.details && invoice.details.length > 0) {
        invoice.details.forEach((detail) => {
          let value = detail.receivedUnits;
          if (value === null || value === undefined) {
            value = detail.quantity || 0;
          }
          initialReceivedUnits[detail.id] = Number(value);
        });
        setReceivedUnitsState(initialReceivedUnits);
      }
    }
  }, [invoice, reset]);

  const watchedDetails = watch("details");

  const onSubmit = async (data: Invoice) => {
    if (!invoice) return;

    const updatedInvoice: Invoice = {
      ...invoice,
      ...data,
      details: data.details.map((d) => {
        const quantity = Number(d.quantity ?? 0);

        // IMPORTANTE: Obtener receivedUnits del estado, no del detalle original
        const receivedUnitsFromState = receivedUnitsState[d.id];
        const usedReceivedUnits =
          receivedUnitsFromState !== undefined
            ? Number(receivedUnitsFromState)
            : Number(d.quantity ?? 0); // Si no hay estado, usar quantity

        const novelty = Math.max(0, quantity - usedReceivedUnits);
        const unitPrice = Number(d.unitPrice ?? 0);
        const vatTaxAmount = Number(d.vatTaxAmount ?? 0);
        const unitDiscountAmount = Number(d.unitDiscountAmount ?? 0);
        const receivedValue =
          usedReceivedUnits * (unitPrice + vatTaxAmount - unitDiscountAmount);
        const netAmount = Number(d.netAmount ?? 0);
        const returnedValue = Math.max(0, netAmount - receivedValue);

        return {
          ...d,
          quantity,
          unitPrice,
          vatTaxAmount,
          unitDiscountAmount,
          netAmount,
          novelty,
          receivedValue,
          returnedValue,
          receivedUnits: usedReceivedUnits, // ¡Esto es lo que se envía a la API!
        };
      }),
    };

    console.log("Enviando a la API:", updatedInvoice);
    await onSave(updatedInvoice);
    onClose();
  };

  const [facturaFile, setFacturaFile] = useState<File | null>(null);
  const [baucherFile, setBaucherFile] = useState<File | null>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "factura" | "baucher"
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.success && data.url) {
          if (type === "factura") {
            setFacturaFileName(file.name);
            setFacturaFile(file);
            reset((prev) => ({ ...prev, invoiceFileUrl: data.url }));
          } else {
            setBaucherFileName(file.name);
            setBaucherFile(file);
            reset((prev) => ({ ...prev, voucherFileUrl: data.url }));
          }
          toast({
            title: "Archivo subido",
            description: `Se ha subido "${file.name}" correctamente.`,
            className: "bg-green-100 text-green-800 border-green-300",
          });
        } else {
          toast({
            title: "Error al subir archivo",
            description: data.message || "No se pudo subir el archivo.",
            className: "bg-red-100 text-red-800 border-red-300",
          });
        }
      } catch (err) {
        toast({
          title: "Error al subir archivo",
          description: "No se pudo subir el archivo.",
          className: "bg-red-100 text-red-800 border-red-300",
        });
      }
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const { valorTotalFactura, unidadesTotalFactura } = useMemo(() => {
    if (!watchedDetails) {
      return {
        valorTotalFactura: 0,
        unidadesTotalFactura: 0,
      };
    }
    const unidadesTotalFactura = watchedDetails.reduce(
      (sum, d) => sum + (d.quantity || 0),
      0
    );
    const valorTotalFactura = watchedDetails.reduce(
      (sum, d) => sum + (Number(d.netAmount) || 0),
      0
    );
    return {
      valorTotalFactura,
      unidadesTotalFactura,
    };
  }, [watchedDetails]);

  if (!invoice) return null;

  const formatCurrency = (value: number) => `$${value.toLocaleString("es-CO")}`;

  const handleReceivedChange = (id: string, value: number) => {
    setReceivedUnitsState((prev) => ({
      ...prev,
      [id]: Math.max(0, value),
    }));
  };

  const formatCOP = (value: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <DialogContent className="max-w-[96vw] w-[90vw] min-w-[600px] font-sans mx-auto">
          <DialogHeader className="flex flex-col items-center gap-2 pb-2 font-sans">
            <div className="flex items-center gap-2 font-sans">
              <FileText className="w-7 h-7 text-primary" />
              <DialogTitle className="text-2xl font-sans">
                Legalizar Factura #{invoice.invoiceNumber}
              </DialogTitle>
            </div>
            <DialogDescription className="text-center font-sans">
              Actualiza cantidades, estado y adjunta documentos para legalizar
              la factura.
            </DialogDescription>
          </DialogHeader>
          <Accordion
            type="single"
            collapsible
            defaultValue="cliente"
            className="mb-4 font-sans"
          >
            <AccordionItem value="cliente">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" /> Información del
                  Cliente
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="p-4 bg-white rounded-xl shadow border border-gray-100 font-sans">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">
                        Cliente
                      </Label>
                      <p className="font-semibold">{invoice.customerName}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">
                        NIT / ID
                      </Label>
                      <p className="font-semibold">{invoice.customerTaxId}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">
                        Ciudad
                      </Label>
                      <p className="font-semibold">{invoice.customerCity}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">
                        Fecha de Factura
                      </Label>
                      <p className="font-semibold">
                        {(() => {
                          if (!invoice.invoiceDate) return "";
                          if (
                            (invoice.invoiceDate as any) instanceof Date &&
                            !isNaN(invoice.invoiceDate as any)
                          ) {
                            return (
                              invoice.invoiceDate as unknown as Date
                            ).toLocaleDateString("es-CO", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            });
                          }
                          if (
                            typeof invoice.invoiceDate === "string" &&
                            invoice.invoiceDate.length > 10
                          ) {
                            const d = new Date(invoice.invoiceDate);
                            if (!isNaN(d.getTime()))
                              return d.toLocaleDateString("es-CO", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              });
                          }
                          if (
                            typeof invoice.invoiceDate === "string" &&
                            invoice.invoiceDate.match(/^\d{4}-\d{2}-\d{2}$/)
                          ) {
                            const [y, m, d] = invoice.invoiceDate.split("-");
                            const dateObj = new Date(
                              Number(y),
                              Number(m) - 1,
                              Number(d)
                            );
                            if (!isNaN(dateObj.getTime()))
                              return dateObj.toLocaleDateString("es-CO", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              });
                          }
                          if (
                            typeof invoice.invoiceDate === "string" &&
                            invoice.invoiceDate.match(/^\d{2}\/\d{2}\/\d{4}$/)
                          ) {
                            const [d, m, y] = invoice.invoiceDate.split("/");
                            const dateObj = new Date(
                              Number(y),
                              Number(m) - 1,
                              Number(d)
                            );
                            if (!isNaN(dateObj.getTime()))
                              return dateObj.toLocaleDateString("es-CO", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              });
                          }
                          return invoice.invoiceDate;
                        })()}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">
                        Fecha Vencimiento
                      </Label>
                      <p className="font-semibold">
                        {(() => {
                          if (!invoice.invoiceDueDate) return "";
                          if (
                            (invoice.invoiceDueDate as any) instanceof Date &&
                            !isNaN(invoice.invoiceDueDate as any)
                          ) {
                            return (
                              invoice.invoiceDueDate as unknown as Date
                            ).toLocaleDateString("es-CO", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            });
                          }
                          if (
                            typeof invoice.invoiceDueDate === "string" &&
                            invoice.invoiceDueDate.length > 10
                          ) {
                            const d = new Date(invoice.invoiceDueDate);
                            if (!isNaN(d.getTime()))
                              return d.toLocaleDateString("es-CO", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              });
                          }
                          if (
                            typeof invoice.invoiceDueDate === "string" &&
                            invoice.invoiceDueDate.match(/^\d{4}-\d{2}-\d{2}$/)
                          ) {
                            const [y, m, d] = invoice.invoiceDueDate.split("-");
                            const dateObj = new Date(
                              Number(y),
                              Number(m) - 1,
                              Number(d)
                            );
                            if (!isNaN(dateObj.getTime()))
                              return dateObj.toLocaleDateString("es-CO", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              });
                          }
                          if (
                            typeof invoice.invoiceDueDate === "string" &&
                            invoice.invoiceDueDate.match(
                              /^\d{2}\/\d{2}\/\d{4}$/
                            )
                          ) {
                            const [d, m, y] = invoice.invoiceDueDate.split("/");
                            const dateObj = new Date(
                              Number(y),
                              Number(m) - 1,
                              Number(d)
                            );
                            if (!isNaN(dateObj.getTime()))
                              return dateObj.toLocaleDateString("es-CO", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              });
                          }
                          return invoice.invoiceDueDate;
                        })()}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor="payment-method"
                        className="text-sm text-muted-foreground"
                      >
                        Forma de Pago Utilizada
                      </Label>
                      <p className="font-semibold">{invoice.paymentMethod}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 items-center mt-2">
                      <div>
                        <Label
                          htmlFor="status"
                          className="text-sm text-muted-foreground mb-1"
                        >
                          Estado de la Factura
                        </Label>
                        <Controller
                          name="status"
                          control={control}
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger className="h-9 rounded-lg border-gray-300 shadow-sm bg-white text-base font-semibold flex items-center gap-2 focus:ring-2 focus:ring-primary/30">
                                <SelectValue placeholder="Seleccionar estado" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Pendiente">
                                  <Clock className="inline mr-2 h-5 w-5 text-gray-400" />{" "}
                                  Pendiente
                                </SelectItem>
                                <SelectItem value="Completo">
                                  <CheckCircle className="inline mr-2 h-5 w-5 text-green-500" />{" "}
                                  Completo
                                </SelectItem>
                                <SelectItem value="Incompleto">
                                  <AlertTriangle className="inline mr-2 h-5 w-5 text-yellow-500" />{" "}
                                  Incompleto
                                </SelectItem>
                                <SelectItem value="Redespacho">
                                  <RefreshCw className="inline mr-2 h-5 w-5 text-blue-500" />{" "}
                                  Redespacho
                                </SelectItem>
                                <SelectItem value="Cancelado">
                                  <XCircle className="inline mr-2 h-5 w-5 text-red-500" />{" "}
                                  Cancelado
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    </div>

                    {/* Campo de selección para Causal de Rechazo */}
                    <div className="space-y-1">
                      <Label
                        htmlFor="rejection_cause_code"
                        className="text-sm text-muted-foreground mb-1"
                      >
                        Causal de Rechazo
                      </Label>
                      <Controller
                        name="rejection_cause_code"
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="h-9 rounded-lg border-gray-300 shadow-sm bg-white text-base font-semibold flex items-center gap-2 focus:ring-2 focus:ring-primary/30">
                              <SelectValue placeholder="Seleccionar causal" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SC">
                                <span className="flex items-center gap-2">
                                  <CheckCircle className="text-gray-400 w-4 h-4" />
                                  Sin Novedad
                                </span>
                              </SelectItem>
                              <SelectItem value="OE">
                                <span className="flex items-center gap-2">
                                  <AlertTriangle className="text-red-500 w-4 h-4" />
                                  OE - No Solicitado
                                </span>
                              </SelectItem>
                              <SelectItem value="TI">
                                <span className="flex items-center gap-2">
                                  <XCircle className="text-orange-500 w-4 h-4" />
                                  TI - Avería en Transporte
                                </span>
                              </SelectItem>
                              <SelectItem value="WC">
                                <span className="flex items-center gap-2">
                                  <User className="text-blue-500 w-4 h-4" />
                                  WC - Error en Cliente
                                </span>
                              </SelectItem>
                              <SelectItem value="DU">
                                <span className="flex items-center gap-2">
                                  <FileText className="text-yellow-500 w-4 h-4" />
                                  DU - Duplicado
                                </span>
                              </SelectItem>
                              <SelectItem value="RO">
                                <span className="flex items-center gap-2">
                                  <Package className="text-purple-500 w-4 h-4" />
                                  RO - Cobro a Transportadora
                                </span>
                              </SelectItem>
                              <SelectItem value="FQ">
                                <span className="flex items-center gap-2">
                                  <Package className="text-purple-700 w-4 h-4" />
                                  FQ - Avería Calidad
                                </span>
                              </SelectItem>
                              <SelectItem value="CB">
                                <span className="flex items-center gap-2">
                                  <Package className="text-indigo-500 w-4 h-4" />
                                  CB - Sin Dinero
                                </span>
                              </SelectItem>
                              <SelectItem value="WH">
                                <span className="flex items-center gap-2">
                                  <Clock className="text-pink-500 w-4 h-4" />
                                  WH - Faltante
                                </span>
                              </SelectItem>
                              <SelectItem value="CH">
                                <span className="flex items-center gap-2">
                                  <FileText className="text-red-400 w-4 h-4" />
                                  CH - Fecha Corta
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="productos">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" /> Detalle de la
                  Factura
                </span>
              </AccordionTrigger>

              <AccordionContent>
                <div className="p-4 bg-white rounded-xl shadow border border-gray-100 font-sans">
                  {/* ===== FILTRO ===== */}
                  <div className="mb-2 flex items-center justify-start gap-2">
                    <div className="relative w-72">
                      <Input
                        type="text"
                        placeholder="Filtrar por SKU o producto..."
                        className="pl-10 rounded-full border-gray-300 shadow-sm focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
                        value={skuFilter}
                        onChange={(e) => setSkuFilter(e.target.value)}
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        <Search className="h-5 w-5" />
                      </span>
                    </div>
                  </div>
                  <div className="relative border rounded-md max-h-[30vh] overflow-auto">
                    <Table>
                      <TableHeader className="bg-muted/50 sticky top-0">
                        <TableRow>
                          <TableHead>SKU</TableHead>
                          <TableHead>Producto</TableHead>
                          <TableHead className="text-center">
                            Und. Factura
                          </TableHead>
                          <TableHead className="text-center">
                            Und. Recibidas
                          </TableHead>
                          <TableHead className="text-center">
                            Und. Novedad
                          </TableHead>
                          <TableHead className="text-center">
                            Vr. Material
                          </TableHead>
                          <TableHead className="text-center">IVA</TableHead>
                          <TableHead className="text-center">
                            Descuento
                          </TableHead>
                          <TableHead className="text-center">Neto</TableHead>
                          <TableHead className="text-center">
                            Vr. Recibido
                          </TableHead>
                          <TableHead className="text-center">
                            Vr. Devuelto
                          </TableHead>
                          <TableHead
                            className="text-center"
                            style={{ minWidth: 80 }}
                          >
                            Opciones
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(
                          watchedDetails?.filter(
                            (detail) =>
                              detail.sku
                                .toString()
                                .toLowerCase()
                                .includes(skuFilter.toLowerCase()) ||
                              detail.productName
                                .toLowerCase()
                                .includes(skuFilter.toLowerCase())
                          ) ?? []
                        ).map((detail) => {
                          const receivedUnits =
                            receivedUnitsState[detail.id] !== undefined
                              ? receivedUnitsState[detail.id]
                              : 0;

                          const quantity = detail.quantity ?? 0;
                          const novelty = Math.max(0, quantity - receivedUnits);
                          const receivedValue =
                            receivedUnits *
                            (Number(detail.unitPrice || 0) +
                              Number(detail.vatTaxAmount || 0) -
                              Number(detail.unitDiscountAmount || 0));
                          const netAmount = Number(detail.netAmount || 0);
                          const returnedValue = Math.max(
                            0,
                            netAmount - receivedValue
                          );

                          const idx = watchedDetails.findIndex(
                            (d) => d.id === detail.id
                          );
                          // Mapeo de causales para mostrar texto
                          const causalesMap = {
                            SC: "Sin Novedad",
                            OE: "OE - No Solicitado",
                            TI: "TI - Avería en Transporte",
                            WC: "WC - Error en Cliente",
                            DU: "DU - Duplicado",
                            RO: "RO - Cobro a Transportadora",
                            FQ: "FQ - Avería Calidad",
                            CB: "CB - Sin Dinero",
                            WH: "WH - Faltante",
                            CH: "CH - Fecha Corta",
                          };

                          return (
                            <TableRow key={detail.id}>
                              <TableCell className="font-medium">
                                {detail.sku}
                              </TableCell>
                              <TableCell className="font-medium">
                                {detail.productName}
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="font-semibold text-blue-700">
                                  {quantity.toLocaleString("es-CO")}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <input
                                  type="number"
                                  min={0}
                                  max={quantity}
                                  className="w-20 text-center border rounded px-2 py-1 font-semibold text-blue-900 bg-white"
                                  value={receivedUnits}
                                  onChange={(e) => {
                                    const newValue = Math.max(
                                      0,
                                      Math.min(Number(e.target.value), quantity)
                                    );
                                    handleReceivedChange(detail.id, newValue);
                                  }}
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <span
                                  className={
                                    novelty > 0
                                      ? "font-semibold text-red-700"
                                      : "font-semibold text-gray-700"
                                  }
                                >
                                  {novelty.toLocaleString("es-CO")}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="font-semibold text-green-700">
                                  {formatCOP(Number(detail.unitPrice || 0))}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="font-semibold text-purple-700">
                                  {formatCOP(Number(detail.vatTaxAmount || 0))}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="font-semibold text-orange-700">
                                  {formatCOP(
                                    Number(detail.unitDiscountAmount || 0)
                                  )}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="font-semibold text-pink-700">
                                  {formatCOP(netAmount)}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="font-semibold text-indigo-700">
                                  {formatCOP(receivedValue)}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="font-semibold text-red-700">
                                  {formatCOP(returnedValue)}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                {/* Tooltip para mostrar el nombre de la causal al pasar el mouse */}
                                <div className="relative group inline-block">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Ver causal"
                                    onClick={() => {
                                      setShowCausalModalId(detail.id);
                                      setTempCausal(
                                        detail.rejection_cause_code_line || "SC"
                                      );
                                    }}
                                  >
                                    <span className="sr-only">Ver causal</span>
                                    {(() => {
                                      const code =
                                        detail.rejection_cause_code_line;
                                      const colorMap: Record<string, string> = {
                                        SC: "text-gray-400",
                                        OE: "text-red-500",
                                        TI: "text-orange-500",
                                        WC: "text-blue-500",
                                        DU: "text-yellow-500",
                                        RO: "text-purple-500",
                                        FQ: "text-purple-700",
                                        CB: "text-indigo-500",
                                        WH: "text-pink-500",
                                        CH: "text-red-400",
                                      };
                                      if (code && colorMap[code]) {
                                        return (
                                          <span
                                            className={
                                              "font-bold " + colorMap[code]
                                            }
                                          >
                                            {code}
                                          </span>
                                        );
                                      }
                                      return (
                                        <span className="text-gray-400 font-bold">
                                          ...
                                        </span>
                                      );
                                    })()}
                                  </Button>
                                  {/* Tooltip visible al hacer hover */}
                                  <span
                                    className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 hidden group-hover:block bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg"
                                    style={{ minWidth: 120 }}
                                  >
                                    {(() => {
                                      const code =
                                        detail.rejection_cause_code_line ||
                                        "SC";
                                      const causalesMap: Record<
                                        string,
                                        string
                                      > = {
                                        SC: "Sin Novedad",
                                        OE: "No Solicitado",
                                        TI: "Avería en Transporte",
                                        WC: "Error en Cliente",
                                        DU: "Duplicado",
                                        RO: "Cobro a Transportadora",
                                        FQ: "Avería Calidad",
                                        CB: "Sin Dinero",
                                        WH: "Faltante",
                                        CH: "Fecha Corta",
                                      };
                                      return causalesMap[code] || "Sin Novedad";
                                    })()}
                                  </span>
                                </div>
                                {showCausalModalId === detail.id && (
                                  <Dialog
                                    open={true}
                                    onOpenChange={() =>
                                      setShowCausalModalId(null)
                                    }
                                  >
                                    <DialogContent className="max-w-md mx-auto text-center">
                                      <DialogHeader>
                                        <DialogTitle>
                                          Causal de Rechazo
                                        </DialogTitle>
                                      </DialogHeader>
                                      <div className="py-4 flex flex-col gap-4 items-center">
                                        <Select
                                          value={tempCausal}
                                          onValueChange={(value) => {
                                            setTempCausal(value);
                                            // Actualizar estado local del detalle al seleccionar causal
                                            updateDetail(idx, {
                                              ...detail,
                                              rejection_cause_code_line:
                                                value as
                                                  | ""
                                                  | "OE"
                                                  | "TI"
                                                  | "WC"
                                                  | "DU"
                                                  | "RO"
                                                  | "FQ"
                                                  | "CB"
                                                  | "WH"
                                                  | "CH"
                                                  | "SC"
                                                  | undefined,
                                            });
                                            setShowCausalModalId(null);
                                          }}
                                        >
                                          <SelectTrigger className="h-12 rounded-lg border-gray-300 shadow-sm bg-white text-base font-semibold flex items-center gap-2 focus:ring-2 focus:ring-primary/30 w-64 mx-auto">
                                            <SelectValue placeholder="Seleccionar causal" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="SC">
                                              <span className="flex items-center gap-2">
                                                <CheckCircle className="text-gray-400 w-4 h-4" />
                                                Sin Novedad
                                              </span>
                                            </SelectItem>
                                            <SelectItem value="OE">
                                              <span className="flex items-center gap-2">
                                                <AlertTriangle className="text-red-500 w-4 h-4" />
                                                OE - No Solicitado
                                              </span>
                                            </SelectItem>
                                            <SelectItem value="TI">
                                              <span className="flex items-center gap-2">
                                                <XCircle className="text-orange-500 w-4 h-4" />
                                                TI - Avería en Transporte
                                              </span>
                                            </SelectItem>
                                            <SelectItem value="WC">
                                              <span className="flex items-center gap-2">
                                                <User className="text-blue-500 w-4 h-4" />
                                                WC - Error en Cliente
                                              </span>
                                            </SelectItem>
                                            <SelectItem value="DU">
                                              <span className="flex items-center gap-2">
                                                <FileText className="text-yellow-500 w-4 h-4" />
                                                DU - Duplicado
                                              </span>
                                            </SelectItem>
                                            <SelectItem value="RO">
                                              <span className="flex items-center gap-2">
                                                <Package className="text-purple-500 w-4 h-4" />
                                                RO - Cobro a Transportadora
                                              </span>
                                            </SelectItem>
                                            <SelectItem value="FQ">
                                              <span className="flex items-center gap-2">
                                                <Package className="text-purple-700 w-4 h-4" />
                                                FQ - Avería Calidad
                                              </span>
                                            </SelectItem>
                                            <SelectItem value="CB">
                                              <span className="flex items-center gap-2">
                                                <Package className="text-indigo-500 w-4 h-4" />
                                                CB - Sin Dinero
                                              </span>
                                            </SelectItem>
                                            <SelectItem value="WH">
                                              <span className="flex items-center gap-2">
                                                <Clock className="text-pink-500 w-4 h-4" />
                                                WH - Faltante
                                              </span>
                                            </SelectItem>
                                            <SelectItem value="CH">
                                              <span className="flex items-center gap-2">
                                                <FileText className="text-red-400 w-4 h-4" />
                                                CH - Fecha Corta
                                              </span>
                                            </SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="detalle">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" /> Documentos y
                  Detalles
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="p-4 bg-white rounded-xl shadow border border-gray-100 font-sans">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="lg:col-span-2 space-y-3 max-w-md">
                      <div className="space-y-1">
                        <Label htmlFor="factura-upload">Factura</Label>
                        <Button
                          type="button"
                          variant="outline"
                          asChild
                          size="sm"
                          className="w-full"
                        >
                          <label
                            htmlFor="factura-upload"
                            className="cursor-pointer w-full flex items-center justify-center gap-2"
                          >
                            <Upload />
                            <span>
                              {facturaFileName
                                ? "Cambiar Factura"
                                : "Cargar Factura"}
                            </span>
                          </label>
                        </Button>
                        <Input
                          id="factura-upload"
                          type="file"
                          accept="image/*,.pdf"
                          className="sr-only"
                          onChange={(e) => handleFileChange(e, "factura")}
                        />
                        {(facturaFileName || invoice.invoiceFileUrl) && (
                          <div className="text-sm text-muted-foreground flex items-center justify-center gap-2 pt-1">
                            {invoice.invoiceFileUrl &&
                            (invoice.invoiceFileUrl.endsWith(".jpg") ||
                              invoice.invoiceFileUrl.endsWith(".jpeg") ||
                              invoice.invoiceFileUrl.endsWith(".png") ||
                              invoice.invoiceFileUrl.endsWith(".gif")) ? (
                              <img
                                src={invoice.invoiceFileUrl}
                                alt="Factura"
                                className="w-10 h-10 object-contain border rounded"
                              />
                            ) : (
                              <File className="w-4 h-4 flex-shrink-0" />
                            )}
                            <span className="truncate max-w-xs text-xs">
                              {facturaFileName ||
                                (invoice.invoiceFileUrl
                                  ? invoice.invoiceFileUrl.split("/").pop()
                                  : "")}
                            </span>
                            {invoice.invoiceFileUrl && (
                              <a
                                href={invoice.invoiceFileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 text-blue-600 hover:text-blue-800"
                                title="Ver archivo"
                              >
                                <Eye className="w-5 h-5" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="baucher-upload">
                          Comprobante de Pago
                        </Label>
                        <Button
                          type="button"
                          variant="outline"
                          asChild
                          size="sm"
                          className="w-full"
                        >
                          <label
                            htmlFor="baucher-upload"
                            className="cursor-pointer w-full flex items-center justify-center gap-2"
                          >
                            <Upload />
                            <span>
                              {baucherFileName
                                ? "Cambiar Comprobante"
                                : "Cargar Comprobante"}
                            </span>
                          </label>
                        </Button>
                        <Input
                          id="baucher-upload"
                          type="file"
                          accept="image/*,.pdf"
                          className="sr-only"
                          onChange={(e) => handleFileChange(e, "baucher")}
                        />
                        {(baucherFileName || invoice.voucherFileUrl) && (
                          <div className="text-sm text-muted-foreground flex items-center justify-center gap-2 pt-1">
                            {invoice.voucherFileUrl &&
                            (invoice.voucherFileUrl.endsWith(".jpg") ||
                              invoice.voucherFileUrl.endsWith(".jpeg") ||
                              invoice.voucherFileUrl.endsWith(".png") ||
                              invoice.voucherFileUrl.endsWith(".gif")) ? (
                              <img
                                src={invoice.voucherFileUrl}
                                alt="Comprobante"
                                className="w-10 h-10 object-contain border rounded"
                              />
                            ) : (
                              <File className="w-4 h-4 flex-shrink-0" />
                            )}
                            <span className="truncate max-w-xs text-xs">
                              {baucherFileName ||
                                (invoice.voucherFileUrl
                                  ? invoice.voucherFileUrl.split("/").pop()
                                  : "")}
                            </span>
                            {invoice.voucherFileUrl && (
                              <a
                                href={invoice.voucherFileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 text-blue-600 hover:text-blue-800"
                                title="Ver archivo"
                              >
                                <Eye className="w-5 h-5" />
                              </a>
                            )}
                          </div>
                        )}
                        <div className="space-y-1 pt-1">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="space-y-1">
                              <Label htmlFor="voucher-number">
                                Número Voucher
                              </Label>
                              <div className="relative">
                                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  id="voucher-number"
                                  type="text"
                                  placeholder="Ej: BCH-000123"
                                  className="pl-9 h-9 text-sm font-medium"
                                  {...register("voucherNumber")}
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="voucher-amount">
                                Valor de Pago
                              </Label>
                              <div className="relative">
                                <Input
                                  id="voucher-amount"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="Ej: 50000"
                                  className="h-9 text-sm font-medium pl-4"
                                  {...register("voucherAmount", {
                                    valueAsNumber: true,
                                  })}
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="voucher-date">
                                Fecha de Pago
                              </Label>
                              <div className="relative">
                                <Input
                                  id="voucher-date"
                                  type="date"
                                  className="h-9 text-sm font-medium pl-4"
                                  {...register("voucherDate")}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-lg border p-4">
                      {/* Total Factura */}
                      <div className="space-y-2 flex flex-col items-center justify-center pb-12">
                        <Label className="text-sm text-muted-foreground">
                          Total Factura
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          ({unidadesTotalFactura} unidades)
                        </p>
                        <div className="text-xl font-bold">
                          {formatCurrency(valorTotalFactura)}
                        </div>
                      </div>
                      {/* Unidades Recibidas y Valor Recibido */}
                      <div className="relative space-y-2 flex flex-col items-center justify-center pb-12">
                        <Label className="text-sm text-muted-foreground">
                          Total Unidades Recibidas
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {(() => {
                            if (!watchedDetails) return "(0 unidades)";
                            let total = 0;
                            watchedDetails.forEach((detail) => {
                              const receivedUnits =
                                receivedUnitsState[detail.id] !== undefined
                                  ? receivedUnitsState[detail.id]
                                  : detail.receivedUnits ??
                                    detail.quantity ??
                                    0;
                              total += receivedUnits;
                            });
                            return `(${total.toLocaleString(
                              "es-CO"
                            )} unidades)`;
                          })()}
                        </p>
                        <div className="text-xl font-bold text-blue-700">
                          {(() => {
                            if (!watchedDetails) return formatCurrency(0);
                            let total = 0;
                            watchedDetails.forEach((detail) => {
                              const receivedUnits =
                                receivedUnitsState[detail.id] !== undefined
                                  ? receivedUnitsState[detail.id]
                                  : detail.receivedUnits ??
                                    detail.quantity ??
                                    0;
                              total +=
                                receivedUnits *
                                (Number(detail.unitPrice || 0) +
                                  Number(detail.vatTaxAmount || 0) -
                                  Number(detail.unitDiscountAmount || 0));
                            });
                            return formatCurrency(total);
                          })()}
                        </div>
                        {/* Campo moderno: Valor de Pago / Total Unidades Recibidas pegado abajo */}
                        {(() => {
                          const valorPagado =
                            watch("voucherAmount") ??
                            invoice.voucherAmount ??
                            0;

                          let totalEsperado = 0;

                          if (watchedDetails) {
                            watchedDetails.forEach((detail) => {
                              const receivedUnits =
                                receivedUnitsState[detail.id] !== undefined
                                  ? receivedUnitsState[detail.id]
                                  : detail.receivedUnits ??
                                    detail.quantity ??
                                    0;

                              totalEsperado +=
                                receivedUnits *
                                (Number(detail.unitPrice || 0) +
                                  Number(detail.vatTaxAmount || 0) -
                                  Number(detail.unitDiscountAmount || 0));
                            });
                          }

                          if (!valorPagado && !totalEsperado) return null;

                          const diferencia = totalEsperado - valorPagado;
                          const esOk = Math.abs(diferencia) < 1;

                          return (
                            <div className="absolute left-0 right-0 bottom-0 flex flex-col items-center">
                              <div
                                className={`rounded-lg px-4 py-2 text-center font-semibold text-base shadow border transition-colors w-full max-w-xs mx-auto ${
                                  esOk
                                    ? "bg-green-50 border-green-400 text-green-700"
                                    : "bg-red-50 border-red-400 text-red-700"
                                }`}
                                title={
                                  esOk
                                    ? "El valor pagado coincide con el total esperado"
                                    : "Existe diferencia entre el total esperado y el valor pagado"
                                }
                              >
                                <span className="font-bold">
                                  Diferencia: {formatCOP(diferencia)}
                                </span>
                                <span className="ml-2 text-xs font-normal">
                                  {esOk ? "OK" : "Revisar"}
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                      {/* Novedad y Valor Devuelto */}
                      <div className="space-y-2 flex flex-col items-center justify-center pb-12">
                        <Label className="text-sm text-muted-foreground">
                          Total Novedad
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {(() => {
                            if (!watchedDetails) return "(0 unidades)";
                            let total = 0;
                            watchedDetails.forEach((detail) => {
                              const quantity = detail.quantity ?? 0;
                              const receivedUnits =
                                receivedUnitsState[detail.id] !== undefined
                                  ? receivedUnitsState[detail.id]
                                  : detail.receivedUnits ??
                                    detail.quantity ??
                                    0;
                              total += Math.max(0, quantity - receivedUnits);
                            });
                            return `(${total.toLocaleString(
                              "es-CO"
                            )} unidades)`;
                          })()}
                        </p>
                        <div className="text-xl font-bold text-red-700">
                          {(() => {
                            if (!watchedDetails) return formatCurrency(0);
                            let total = 0;
                            watchedDetails.forEach((detail) => {
                              const quantity = detail.quantity ?? 0;
                              const receivedUnits =
                                receivedUnitsState[detail.id] !== undefined
                                  ? receivedUnitsState[detail.id]
                                  : detail.receivedUnits ??
                                    detail.quantity ??
                                    0;
                              const receivedValue =
                                receivedUnits *
                                (Number(detail.unitPrice || 0) +
                                  Number(detail.vatTaxAmount || 0) -
                                  Number(detail.unitDiscountAmount || 0));
                              const netAmount = Number(detail.netAmount || 0);
                              total += Math.max(0, netAmount - receivedValue);
                            });
                            return formatCurrency(total);
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <form id="invoice-form" onSubmit={handleSubmit(onSubmit)}>
            {/* El contenido de los accordions ya está arriba */}
          </form>
          <DialogFooter className="pt-4 flex flex-row items-center justify-between gap-2 font-sans">
            <div className="flex-1 flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors rounded-lg px-4 py-2 shadow-sm"
                onClick={() => {
                  onClose();
                  window.location.reload();
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
            </div>
            <div className="flex-1 flex items-center justify-end gap-2">
              <Button
                type="submit"
                form="invoice-form"
                className="bg-primary text-white hover:bg-primary/90 transition-colors rounded-lg px-4 py-2 shadow-md flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Legalizar y Guardar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </div>
    </Dialog>
  );
}

// Trae la lista de facturas actualizada desde el backend
async function fetchInvoices() {
  try {
    const response = await fetch("/api/dispatches");
    if (!response.ok) {
      throw new Error("No se pudo obtener la lista de facturas.");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al obtener facturas:", error);
  }
}

function setSelectedInvoice(invoice: Invoice | null) {
  // Esta función debe ser implementada por el componente padre
  console.log("setSelectedInvoice called with:", invoice);
}
