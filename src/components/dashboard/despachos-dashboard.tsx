"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
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

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  BarChart3,
  ListChecks,
  CalendarDays,
  UserRoundSearch,
} from "lucide-react";

export default function DespachosDashboard({
  initialDespachos,
}: DespachosDashboardProps) {
  // Estado para filtro de cliente
  const [clienteSeleccionado, setClienteSeleccionado] =
    useState<string>("__all__");

  // Estado para filtro de rango de fechas
  const [rangoFechas, setRangoFechas] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [popoverAbierto, setPopoverAbierto] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Cerrar popover al hacer click fuera
  useEffect(() => {
    if (!popoverAbierto) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        // Solo cerrar si el rango está completo
        if (rangoFechas.from && rangoFechas.to) {
          setPopoverAbierto(false);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [popoverAbierto, rangoFechas]);

  // --- Calendario embebido tipo popover ---
  function formatRangeLabel(range: {
    from: Date | undefined;
    to: Date | undefined;
  }) {
    if (range.from && range.to) {
      return `Del ${range.from.toLocaleDateString()} al ${range.to.toLocaleDateString()}`;
    }
    if (range.from) {
      return `Desde ${range.from.toLocaleDateString()}`;
    }
    return "Seleccionar fechas";
  }

  // Calendario compacto reutilizable
  function InlineDateRangePicker({
    value,
    onChange,
  }: {
    value: { from: Date | undefined; to: Date | undefined };
    onChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
  }) {
    const [currentMonth, setCurrentMonth] = useState<number>(
      value.from ? value.from.getMonth() + 1 : new Date().getMonth() + 1
    );
    const [currentYear, setCurrentYear] = useState<number>(
      value.from ? value.from.getFullYear() : new Date().getFullYear()
    );
    // Generar días del mes
    const generateMonthDays = () => {
      const days = [];
      const firstDay = new Date(currentYear, currentMonth - 1, 1);
      const lastDay = new Date(currentYear, currentMonth, 0);
      const daysInMonth = lastDay.getDate();
      const startingDay = firstDay.getDay();
      const adjustedStartingDay = startingDay === 0 ? 6 : startingDay - 1;
      for (let i = 0; i < adjustedStartingDay; i++) days.push(null);
      for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(currentYear, currentMonth - 1, i));
      }
      const weeks = [];
      for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
      return weeks;
    };
    const weeks = generateMonthDays();
    const isInRange = (date: Date) => {
      if (!value.from || !value.to) return false;
      return date >= value.from && date <= value.to;
    };
    const isSelected = (date: Date) => {
      if (!value.from) return false;
      return (
        date.toDateString() === value.from?.toDateString() ||
        (value.to && date.toDateString() === value.to.toDateString())
      );
    };
    const handleDayClick = (date: Date) => {
      if (!value.from || (value.from && value.to)) {
        onChange({ from: date, to: undefined });
      } else if (value.from && !value.to) {
        if (date < value.from) {
          onChange({ from: date, to: value.from });
        } else {
          onChange({ from: value.from, to: date });
        }
      }
    };
    const monthNames = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];
    return (
      <div className="inline-block bg-white border rounded-md shadow p-2 w-[320px]">
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            className="px-2 py-1 text-xs"
            onClick={() => {
              if (currentMonth === 1) {
                setCurrentMonth(12);
                setCurrentYear((y) => y - 1);
              } else {
                setCurrentMonth((m) => m - 1);
              }
            }}
          >
            «
          </button>
          <span className="font-semibold text-sm">
            {monthNames[currentMonth - 1]} {currentYear}
          </span>
          <button
            type="button"
            className="px-2 py-1 text-xs"
            onClick={() => {
              if (currentMonth === 12) {
                setCurrentMonth(1);
                setCurrentYear((y) => y + 1);
              } else {
                setCurrentMonth((m) => m + 1);
              }
            }}
          >
            »
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-xs text-center mb-1">
          {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
            <div key={d} className="font-medium text-gray-500">
              {d}
            </div>
          ))}
        </div>
        <div className="space-y-0.5">
          {weeks.map((week, i) => (
            <div key={i} className="grid grid-cols-7 gap-1">
              {week.map((day, j) =>
                day ? (
                  <button
                    key={j}
                    type="button"
                    className={`rounded-md w-8 h-8 text-xs transition-colors
                      ${
                        isSelected(day)
                          ? "bg-blue-500 text-white"
                          : isInRange(day)
                          ? "bg-blue-100 text-blue-700"
                          : "hover:bg-blue-50"
                      }
                    `}
                    onClick={() => handleDayClick(day)}
                  >
                    {day.getDate()}
                  </button>
                ) : (
                  <div key={j} />
                )
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 font-medium text-[rgba(41,72,107,1)] text-sm">
          {value.from && value.to
            ? `Del ${value.from.toLocaleDateString()} al ${value.to.toLocaleDateString()}`
            : value.from
            ? `Desde ${value.from.toLocaleDateString()}`
            : "Selecciona un rango de fechas"}
        </div>
        {(value.from || value.to) && (
          <button
            type="button"
            className="mt-2 text-xs text-blue-600 underline"
            onClick={() => onChange({ from: undefined, to: undefined })}
          >
            Limpiar selección
          </button>
        )}
      </div>
    );
  }

  // Obtener lista única de clientes
  const clientes = useMemo(() => {
    const set = new Set(initialDespachos.map((d) => d.customerName));
    return Array.from(set).sort();
  }, [initialDespachos]);

  // Filtrar despachos según cliente y rango de fechas (validando formato YYYY-MM-DD)
  const despachosFiltrados = useMemo(() => {
    let filtrados = initialDespachos;
    if (clienteSeleccionado !== "__all__") {
      filtrados = filtrados.filter(
        (d) => d.customerName === clienteSeleccionado
      );
    }
    if (rangoFechas.from && rangoFechas.to) {
      // Normalizar fechas a zona local (inicio y fin del día local)
      const fromDate = new Date(
        rangoFechas.from.getFullYear(),
        rangoFechas.from.getMonth(),
        rangoFechas.from.getDate(),
        0,
        0,
        0,
        0
      );
      const toDate = new Date(
        rangoFechas.to.getFullYear(),
        rangoFechas.to.getMonth(),
        rangoFechas.to.getDate(),
        23,
        59,
        59,
        999
      );
      filtrados = filtrados.filter((d) => {
        if (!d.createdAt) return false;
        let fecha: Date | null = null;
        if (/^\d{4}-\d{2}-\d{2}( |T)\d{2}:\d{2}:\d{2}/.test(d.createdAt)) {
          // Formato DATETIME o ISO
          // Forzar a local si es posible
          const str = d.createdAt.replace(" ", "T");
          fecha = new Date(str);
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(d.createdAt)) {
          // Solo fecha
          const [year, month, day] = d.createdAt.split("-").map(Number);
          fecha = new Date(year, month - 1, day);
        }
        if (!fecha || isNaN(fecha.getTime())) return false;
        // Comparar usando la hora local
        return fecha >= fromDate && fecha <= toDate;
      });
    }
    return filtrados;
  }, [initialDespachos, clienteSeleccionado, rangoFechas]);
  const kpis = useMemo(() => {
    const totalDespachos = despachosFiltrados.length;
    const completos = despachosFiltrados.filter(
      (d) => d.status === "Completo"
    ).length;
    const incompletos = despachosFiltrados.filter(
      (d) => d.status === "Incompleto"
    ).length;
    const pendientes = despachosFiltrados.filter(
      (d) => d.status === "Pendiente"
    ).length;
    return { totalDespachos, completos, incompletos, pendientes };
  }, [despachosFiltrados]);

  // Agrupación de facturas próximas a vencer por días hasta vencimiento
  // Función para parsear fechas en formato DD/MM/YYYY o YYYY-MM-DD
  interface ParseFecha {
    (fechaStr: string): Date | null;
  }

  const parseFecha: ParseFecha = (fechaStr) => {
    if (!fechaStr) return null;
    // Si es YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
      return new Date(fechaStr);
    }
    // Si es DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(fechaStr)) {
      const [dia, mes, anio] = fechaStr.split("/").map(Number);
      return new Date(anio, mes - 1, dia);
    }
    // Si es otro formato, intentar parsear normal
    return new Date(fechaStr);
  };

  const facturasProximasAVencerData = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    let menosDeUnDia = 0;
    let entre2y3Dias = 0;
    let cuatroDiasOMas = 0;
    despachosFiltrados.forEach((d) => {
      // Solo facturas en estado pendiente
      if (!d.status || (d.status !== "Pendiente" && d.status !== "Pending"))
        return;
      if (!d.invoiceDueDate) return;
      const dueDate = parseFecha(d.invoiceDueDate);
      if (!dueDate || isNaN(dueDate.getTime())) return;
      dueDate.setHours(0, 0, 0, 0);
      // Diferencia en días
      const diffMs = dueDate.getTime() - hoy.getTime();
      const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDias < 0) return; // Solo futuras
      if (diffDias < 1) {
        menosDeUnDia++;
      } else if (diffDias >= 1 && diffDias < 4) {
        entre2y3Dias++;
      } else if (diffDias >= 4) {
        cuatroDiasOMas++;
      }
    });
    const result = [
      { name: "Menos de 1 día", cantidad: menosDeUnDia, fill: "#fbbf24" },
      { name: "2 a 3 días", cantidad: entre2y3Dias, fill: "#60a5fa" },
      { name: "4 días o más", cantidad: cuatroDiasOMas, fill: "#34d399" },
    ];
    return result;
  }, [despachosFiltrados]);

  // Distribución: solo Complete, Pendiente, Incompleto (ignorando Cancelado)
  const statusDistributionData = useMemo(() => {
    const completos = despachosFiltrados.filter(
      (d) => d.status === "Completo" || d.status === "Complete"
    ).length;
    const pendientes = despachosFiltrados.filter(
      (d) => d.status === "Pendiente" || d.status === "Pending"
    ).length;
    const incompletos = despachosFiltrados.filter(
      (d) => d.status === "Incompleto" || d.status === "Incomplete"
    ).length;
    // Solo sumar los que no sean cancelados
    const total = completos + pendientes + incompletos;
    return [
      { name: "Completas", value: completos, fill: COLORS.completo },
      { name: "Pendientes", value: pendientes, fill: COLORS.pendiente },
      { name: "Incompletas", value: incompletos, fill: COLORS.incompleto },
    ].filter((item) => item.value > 0);
  }, [despachosFiltrados]);

  // Sistema de tabs
  return (
    <Tabs defaultValue="dashboard" className="w-full">
      <div className="mb-8 flex flex-wrap justify-center gap-4 items-center bg-transparent border-0">
        <TabsList className="flex gap-2 bg-transparent border-0">
          <TabsTrigger
            value="dashboard"
            className="relative flex items-center gap-2 px-2 py-1 rounded-md font-semibold text-base transition-all duration-200 border border-[rgba(41,72,107,1)] bg-[rgba(41,72,107,1)] text-white hover:bg-[rgba(30,52,80,1)] hover:text-white data-[state=active]:bg-white data-[state=active]:text-[rgba(41,72,107,1)] data-[state=active]:border-[rgba(41,72,107,1)] data-[state=active]:shadow-md"
          >
            <BarChart3 className="w-5 h-5 mr-1" /> Dashboard
          </TabsTrigger>
          <TabsTrigger
            value="causales"
            className="relative flex items-center gap-2 px-2 py-1 rounded-md font-semibold text-base transition-all duration-200 border border-[rgba(41,72,107,1)] bg-[rgba(41,72,107,1)] text-white hover:bg-[rgba(30,52,80,1)] hover:text-white data-[state=active]:bg-white data-[state=active]:text-[rgba(41,72,107,1)] data-[state=active]:border-[rgba(41,72,107,1)] data-[state=active]:shadow-md"
          >
            <ListChecks className="w-5 h-5 mr-1" /> Causales de Rechazo
          </TabsTrigger>
        </TabsList>
        {/* Filtro por cliente y rango de fechas */}
        <div className="flex items-center gap-4">
          {/* Selector de cliente con icono */}
          <div className="relative">
            <Select
              value={clienteSeleccionado}
              onValueChange={setClienteSeleccionado}
            >
              <SelectTrigger className="w-56 h-9 border border-[rgba(41,72,107,1)] bg-white text-[rgba(41,72,107,1)] font-medium focus:ring-2 focus:ring-blue-300 flex items-center gap-2 pl-3">
                <UserRoundSearch className="w-4 h-4 mr-1 text-[rgba(41,72,107,1)]" />
                <span className="truncate">
                  {clientes.find((c) => c === clienteSeleccionado) ||
                    "Todos los clientes"}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos los clientes</SelectItem>
                {clientes.map((cliente) => (
                  <SelectItem key={cliente} value={cliente}>
                    {cliente}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Selector de fechas con icono */}
          <div ref={popoverRef} className="relative">
            <button
              type="button"
              className="w-64 h-8 border border-[rgba(41,72,107,1)] bg-white text-[rgba(41,72,107,1)] text-sm focus:ring-2 focus:ring-blue-300 flex items-center px-3 rounded-md transition-colors min-w-[180px] text-left font-normal truncate overflow-hidden whitespace-nowrap gap-2"
              onClick={() => setPopoverAbierto((v) => !v)}
              style={{ height: "32px" }}
              title={formatRangeLabel(rangoFechas)}
            >
              <CalendarDays className="w-4 h-4 mr-1 text-[rgba(41,72,107,1)]" />
              <span className="truncate">{formatRangeLabel(rangoFechas)}</span>
            </button>
            {popoverAbierto && (
              <div className="absolute z-50 mt-2 right-0">
                <InlineDateRangePicker
                  value={rangoFechas}
                  onChange={(range) => {
                    setRangoFechas(range);
                    // Solo cerrar si el rango está completo
                    if (range.from && range.to) {
                      setPopoverAbierto(false);
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <TabsContent value="dashboard">
        <div className="flex flex-col gap-8">
          {/* ...existing code... */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* ...tarjetas de KPIs... */}
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
                <p className="text-xs text-muted-foreground">
                  en el último mes
                </p>
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
                  {kpis.totalDespachos > 0
                    ? ((kpis.completos / kpis.totalDespachos) * 100).toFixed(0)
                    : 0}
                  % del total
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
                  {kpis.totalDespachos > 0
                    ? ((kpis.incompletos / kpis.totalDespachos) * 100).toFixed(
                        0
                      )
                    : 0}
                  % con devoluciones
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
                  {kpis.totalDespachos > 0
                    ? ((kpis.pendientes / kpis.totalDespachos) * 100).toFixed(0)
                    : 0}
                  % sin legalizar
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Estados</CardTitle>
                <CardDescription>
                  Visualización de despachos Legalizado, Sin Legalizar y
                  Legalizado Incompletos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value, percent, x, y, fill }) => (
                        <g>
                          <text
                            x={x}
                            y={y - 10}
                            textAnchor="middle"
                            dominantBaseline="central"
                            style={{
                              fontSize: "1rem",
                              fontWeight: 600,
                              fill: fill || "#29486b",
                              textShadow: "0 1px 4px #fff",
                            }}
                          >
                            {`${name}`}
                          </text>
                          <text
                            x={x}
                            y={y + 10}
                            textAnchor="middle"
                            dominantBaseline="central"
                            style={{
                              fontSize: "0.95rem",
                              fontWeight: 400,
                              fill: "#29486b",
                            }}
                          >
                            {`${(percent * 100).toFixed(0)}% (${value})`}
                          </text>
                        </g>
                      )}
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
                    <Legend
                      align="center"
                      verticalAlign="bottom"
                      iconType="circle"
                      payload={statusDistributionData.map((entry, idx, arr) => {
                        const total = arr.reduce((acc, e) => acc + e.value, 0);
                        const percent =
                          total > 0
                            ? ((entry.value / total) * 100).toFixed(0)
                            : "0";
                        return {
                          value: `${entry.name} ${percent}% (${entry.value})`,
                          type: "circle",
                          color: entry.fill,
                        };
                      })}
                      wrapperStyle={{
                        marginTop: 16,
                        fontSize: "1rem",
                        fontWeight: 500,
                        display: "flex",
                        justifyContent: "center",
                        gap: "2rem",
                        flexWrap: "wrap",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Facturas Próximas a Vencer</CardTitle>
                <CardDescription>
                  Total de facturas agrupadas por días hasta vencimiento.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={facturasProximasAVencerData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border) / 0.5)"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{
                        fill: "hsl(var(--muted-foreground))",
                        fontSize: 12,
                      }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{
                        fill: "hsl(var(--muted-foreground))",
                        fontSize: 12,
                      }}
                    />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--accent))" }}
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        borderColor: "hsl(var(--border))",
                      }}
                    />
                    <Bar
                      dataKey="cantidad"
                      name="Facturas"
                      barSize={60}
                      label={{ position: "top", fill: "#333", fontSize: 14 }}
                    >
                      {facturasProximasAVencerData.map((entry, index) => (
                        <Cell key={`cell-bar-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="causales">
        <div className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumen por Causal de Rechazo</CardTitle>
              <CardDescription>
                Total de facturas agrupadas por causal de rechazo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PivotCausalesTable initialDespachos={despachosFiltrados} />
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}

// Tabla dinámica de causales
function PivotCausalesTable({
  initialDespachos,
}: {
  initialDespachos: Invoice[];
}) {
  // Agrupar por causal
  const resumen = React.useMemo(() => {
    const counts: Record<string, number> = {};
    initialDespachos.forEach((d) => {
      const code = d.rejection_cause_code || "Sin causal";
      counts[code] = (counts[code] || 0) + 1;
    });
    // Convertir a array ordenado por cantidad descendente
    return Object.entries(counts)
      .map(([causal, total]) => ({ causal, total }))
      .sort((a, b) => b.total - a.total);
  }, [initialDespachos]);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border text-sm">
        <thead>
          <tr className="bg-muted">
            <th className="px-4 py-2 border">Causal</th>
            <th className="px-4 py-2 border">Total de Facturas</th>
          </tr>
        </thead>
        <tbody>
          {resumen.map((row) => (
            <tr key={row.causal}>
              <td className="px-4 py-2 border">{row.causal}</td>
              <td className="px-4 py-2 border text-center">{row.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
