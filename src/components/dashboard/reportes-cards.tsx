import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SimpleDateModal } from "./date-range-modal";
import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

type DateRange = { from: Date; to: Date };

export function ReportesCards({
  onUIAF,
  onVehiculos,
  onManifiesto,
  onTarifas,
  onOrdenes,
}: {
  onUIAF: (range: DateRange) => void;
  onVehiculos: (range: DateRange) => void;
  onManifiesto: (range: DateRange) => void;
  onTarifas: (range: DateRange) => void;
  onOrdenes: (range: DateRange) => void;
}) {
  const [modal, setModal] = React.useState<
    null | "uiaf" | "vehiculos" | "manifiesto" | "tarifas" | "ordenes"
  >(null);

  const handleConfirm = (range?: {
    from: Date;
    to: Date;
    type: "day" | "month" | "year";
  }) => {
    if (!range || !modal) return;

    const { from, to } = range;

    const handlers: Record<typeof modal, (r: DateRange) => void> = {
      uiaf: onUIAF,
      vehiculos: onVehiculos,
      manifiesto: onManifiesto,
      tarifas: onTarifas,
      ordenes: onOrdenes,
    };

    handlers[modal]?.({ from, to });
    setModal(null);
  };

  return (
    <>
      <SimpleDateModal
        open={!!modal}
        onClose={() => setModal(null)}
        onConfirm={handleConfirm}
      />

      <div className="flex flex-col gap-8">
        {/* Financiero */}
        <div>
          <h2 className="text-2xl font-bold mb-2">Financiero</h2>
          <Card className="max-w-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-10 h-10 text-blue-600 bg-blue-100 rounded-lg p-2" />
                <div>
                  <CardTitle>Resumen de Recaudos</CardTitle>
                  <CardDescription>
                    Facturación, pagos y devoluciones
                  </CardDescription>
                </div>
              </div>
              <Button onClick={() => setModal("uiaf")}>
                <Download className="mr-2 h-4 w-4" />
                Generar
              </Button>
            </CardHeader>
          </Card>
        </div>

        {/* General */}
        <div>
          <h2 className="text-2xl font-bold mb-2">General</h2>
          <div className="flex gap-6 flex-wrap">
            <Card className="max-w-lg flex-1">
              <CardHeader className="flex flex-row items-center justify-between">
                <FileText className="w-10 h-10 text-blue-600 bg-blue-100 rounded-lg p-2" />
                <div>
                  <CardTitle>Detalle de Transacciones</CardTitle>
                  <CardDescription>Detalle por línea</CardDescription>
                </div>
                <Button onClick={() => setModal("vehiculos")}>
                  <Download className="mr-2 h-4 w-4" />
                  Generar
                </Button>
              </CardHeader>
            </Card>

            <Card className="max-w-lg flex-1">
              <CardHeader className="flex flex-row items-center justify-between">
                <FileText className="w-10 h-10 text-blue-600 bg-blue-100 rounded-lg p-2" />
                <div>
                  <CardTitle>Manifiesto Logístico</CardTitle>
                  <CardDescription>Exportación WMS</CardDescription>
                </div>
                <Button onClick={() => setModal("manifiesto")}>
                  <Download className="mr-2 h-4 w-4" />
                  Generar
                </Button>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
