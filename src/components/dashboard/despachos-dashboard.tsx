"use client";

import { useMemo } from "react";
import type { Invoice } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Package, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type DespachosDashboardProps = {
  initialDespachos: Invoice[];
};

const COLORS = {
  completo: "hsl(var(--primary))",
  incompleto: "hsl(var(--destructive))",
  pendiente: "hsl(var(--secondary-foreground))",
};

export default function DespachosDashboard({
  initialDespachos,
}: DespachosDashboardProps) {
  const kpis = useMemo(() => {
    const totalDespachos = initialDespachos.length;
    const completos = initialDespachos.filter(
      (d) => d.status === "Completo"
    ).length;
    const incompletos = initialDespachos.filter(
      (d) => d.status === "Incompleto"
    ).length;
    const pendientes = initialDespachos.filter(
      (d) => d.status === "Pendiente"
    ).length;
    return { totalDespachos, completos, incompletos, pendientes };
  }, [initialDespachos]);

  const productStatusData = useMemo(() => {
    let despachado = 0;
    let recibido = 0;
    initialDespachos.forEach((d) => {
      d.details.forEach((p) => {
        despachado += p.quantity;
        recibido += p.receivedUnits ?? 0;
      });
    });
    return [
      {
        name: "Unidades Despachadas",
        cantidad: despachado,
        fill: "hsl(var(--muted-foreground))",
      },
      {
        name: "Unidades Recibidas",
        cantidad: recibido,
        fill: "hsl(var(--primary))",
      },
    ];
  }, [initialDespachos]);

  const statusDistributionData = useMemo(() => {
    return [
      { name: "Completo", value: kpis.completos, fill: COLORS.completo },
      { name: "Incompleto", value: kpis.incompletos, fill: COLORS.incompleto },
      { name: "Pendiente", value: kpis.pendientes, fill: COLORS.pendiente },
    ].filter((item) => item.value > 0);
  }, [kpis]);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow duration-300 bg-gradient-to-br from-white to-blue-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              Despachos Totales
            </CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">
              {kpis.totalDespachos}
            </div>
            <p className="text-xs text-muted-foreground">en el último mes</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow duration-300 bg-gradient-to-br from-white to-green-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              Despachos Completos
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">
              {kpis.completos}
            </div>
            <p className="text-xs text-muted-foreground">
              {((kpis.completos / kpis.totalDespachos) * 100).toFixed(0)}% del
              total
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-shadow duration-300 bg-gradient-to-br from-white to-red-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">
              Despachos Incompletos
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-800">
              {kpis.incompletos}
            </div>
            <p className="text-xs text-muted-foreground">
              {((kpis.incompletos / kpis.totalDespachos) * 100).toFixed(0)}% con
              devoluciones
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500 hover:shadow-lg transition-shadow duration-300 bg-gradient-to-br from-white to-yellow-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">
              Despachos Pendientes
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-800">
              {kpis.pendientes}
            </div>
            <p className="text-xs text-muted-foreground">
              {((kpis.pendientes / kpis.totalDespachos) * 100).toFixed(0)}% sin
              legalizar
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Estados</CardTitle>
            <CardDescription>
              Visualización de los estados de todos los despachos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {statusDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    borderColor: "hsl(var(--border))",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Unidades Despachadas vs. Recibidas</CardTitle>
            <CardDescription>
              Comparativa total de unidades de productos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productStatusData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border) / 0.5)"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--accent))" }}
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    borderColor: "hsl(var(--border))",
                  }}
                />
                <Bar dataKey="cantidad" name="Unidades" barSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
