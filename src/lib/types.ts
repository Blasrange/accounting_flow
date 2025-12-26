export type InvoiceDetail = {
  id: string;
  sku: string;
  productName: string;
  unitOfMeasure: string;
  quantity: number;
  batchNumber?: string;
  serialNumber?: string;
  unitPrice: number;
  vatTaxAmount: number;
  unitDiscountAmount: number;
  netAmount: number;
  weight?: number;
  length?: number;
  height?: number;
  width?: number;
  receivedUnits?: number; // Unidades recibidas
  novelty?: number; // Novedad (diferencia)
  receivedValue?: number; // Valor recibido
  returnedValue?: number; // Valor devuelto
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  deliveryNumber?: string;
  internalOrderNumber?: string;
  purchaseOrderNumber?: string;
  invoiceDate: string;
  invoiceDueDate: string;
  customerCode: string;
  customerTaxId: string;
  customerName: string;
  customerPhone?: string;
  customerAddress: string;
  customerCity: string;
  customerState?: string;
  zipCode: string;
  invoiceTotal: number;
  vatTaxAmount: number;
  totalDiscount: number;
  amountDue: number;
  paymentMethod: string;
  status:
    | "Completo"
    | "Complete"
    | "Incompleto"
    | "Incomplete"
    | "Pendiente"
    | "Pending"
    | "Cancelado"
    | "Cancelled"
    | "Vencido"
    | "Expired"
    | "Redespacho"
    | "Redispatch";
  rejection_cause_code?:
    | "OE" // No Solicitado
    | "TI" // Avería en Transporte
    | "WC" // Error en Cliente
    | "DU" // Duplicado
    | "RO" // Cobro a Transportadora
    | "FQ" // Avería Calidad
    | "CB" // Sin Dinero
    | "WH" // Faltante
    | "CH" // Fecha Corta
    | "SC" // Sin Causal
    | ""; // Sin Causal Seleccionada
  invoiceFileUrl?: string;
  voucherFileUrl?: string;
  voucherNumber?: string;
  voucherAmount?: number;
  notes?: string;
  totalLines: number;
  totalUnits: number;
  createdAt: string;
  updatedAt?: string;
  details: InvoiceDetail[];
};

export type User = {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: "Administrador" | "Auditor";
  status: "Activo" | "Inactivo";
  createdAt: string;
};
