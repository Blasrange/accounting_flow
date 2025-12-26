import * as React from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  CalendarDays,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SimpleDateModalProps {
  open: boolean;
  onClose: () => void;
  // Cambiamos el tipo de onConfirm para enviar rango y tipo
  onConfirm: (range?: {
    from: Date;
    to: Date;
    type: "day" | "month" | "year";
  }) => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function SimpleDateModal({
  open,
  onClose,
  onConfirm,
  title = "Seleccionar fecha",
  description = "Elige una fecha para continuar",
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
}: SimpleDateModalProps) {
  const { toast } = useToast();
  // Estado para resaltar el botón seleccionado ("mes" o "año")
  const [highlighted, setHighlighted] = React.useState<"mes" | "año" | null>(
    null
  );
  // Estado inicial basado en la fecha actual
  const [date, setDate] = React.useState<string>("");
  const [currentMonth, setCurrentMonth] = React.useState<number>(
    new Date().getMonth() + 1
  );
  const [currentYear, setCurrentYear] = React.useState<number>(
    new Date().getFullYear()
  );
  const [view, setView] = React.useState<"input" | "calendar">("input");
  // Estado para selección de mes y año
  const [selectedMonth, setSelectedMonth] = React.useState<number>(
    new Date().getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = React.useState<number>(() => {
    // Siempre usar el año actual por defecto
    const now = new Date();
    return now.getFullYear();
  });

  const inputRef = React.useRef<HTMLInputElement>(null);

  // Fecha actual real (sin horas/minutos/segundos para comparación)
  const getToday = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  };

  // Obtener fecha de ayer
  const getYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate()
    );
  };

  const today = getToday();
  const yesterday = getYesterday();

  // Función para formatear fecha YYYY-MM-DD
  const formatDateToInput = (dateObj: Date): string => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Función para formatear fecha corta (ej: "22 Dic")
  const formatShortDate = (dateObj: Date): string => {
    const months = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];
    return `${dateObj.getDate()} ${months[dateObj.getMonth()]}`;
  };

  // Generar días del mes
  const generateMonthDays = () => {
    const days = [];
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(currentYear, currentMonth, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    // Ajustar el día de inicio para que la semana empiece en Lunes (0=Lunes, 6=Domingo)
    const adjustedStartingDay = startingDay === 0 ? 6 : startingDay - 1;

    // Rellenar días del mes anterior
    for (let i = 0; i < adjustedStartingDay; i++) {
      days.push(null);
    }

    // Días del mes actual
    for (let i = 1; i <= daysInMonth; i++) {
      const dateObj = new Date(currentYear, currentMonth - 1, i);
      const dateStr = formatDateToInput(dateObj);
      const todayFormatted = formatDateToInput(today);
      const isToday = dateStr === todayFormatted;
      const isSelected = date === dateStr;

      days.push({
        day: i,
        date: dateStr,
        dateObj,
        isToday,
        isSelected,
        isWeekend: dateObj.getDay() === 0 || dateObj.getDay() === 6,
      });
    }

    // Agrupar en semanas
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return weeks;
  };

  const weeks = generateMonthDays();
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

  // Detectar tipo de selección y armar rango
  const handleConfirm = () => {
    if (!date) {
      inputRef.current?.focus();
      inputRef.current?.classList.add("ring-2", "ring-red-500");
      setTimeout(() => {
        inputRef.current?.classList.remove("ring-2", "ring-red-500");
      }, 1000);
      toast({
        title: "Fecha requerida",
        description: "Por favor selecciona una fecha para continuar.",
        variant: "destructive",
      });
      return;
    }

    // Día seleccionado
    const [year, month, day] = date.split("-").map(Number);
    const selected = new Date(year, month - 1, day);
    let from = selected;
    let to = selected;
    let type: "day" | "month" | "year" = "day";

    // Si la fecha seleccionada corresponde al primer día de enero, es año completo
    if (selected.getDate() === 1 && selected.getMonth() === 0) {
      type = "year";
      from = new Date(selected.getFullYear(), 0, 1, 0, 0, 0);
      to = new Date(selected.getFullYear(), 11, 31, 23, 59, 59);
    }
    // Si la fecha seleccionada corresponde al primer día de cualquier mes, es mes completo
    else if (selected.getDate() === 1) {
      type = "month";
      from = new Date(selected.getFullYear(), selected.getMonth(), 1, 0, 0, 0);
      to = new Date(
        selected.getFullYear(),
        selected.getMonth() + 1,
        0,
        23,
        59,
        59
      );
    } else {
      // Día único
      from = new Date(
        selected.getFullYear(),
        selected.getMonth(),
        selected.getDate(),
        0,
        0,
        0
      );
      to = new Date(
        selected.getFullYear(),
        selected.getMonth(),
        selected.getDate(),
        23,
        59,
        59
      );
    }

    onConfirm({ from, to, type });
    setDate("");
  };

  const handleClose = () => {
    setDate("");
    onClose();
  };

  // Formatear fecha para mostrar preview
  const formatPreviewDate = () => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const setToday = () => {
    // Usar la fecha local actual, no la de UTC
    const now = new Date();
    const localToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const formatted = formatDateToInput(localToday);
    setDate(formatted);
    // Si estamos en vista calendario, navegar al mes actual
    if (view === "calendar") {
      setCurrentMonth(localToday.getMonth() + 1);
      setCurrentYear(localToday.getFullYear());
    }
  };

  const setYesterday = () => {
    const formatted = formatDateToInput(yesterday);
    setDate(formatted);
    // Si estamos en vista calendario, navegar al mes de ayer
    if (view === "calendar") {
      setCurrentMonth(yesterday.getMonth() + 1);
      setCurrentYear(yesterday.getFullYear());
    }
  };

  const navigateMonth = (direction: "prev" | "next") => {
    if (direction === "prev") {
      if (currentMonth === 1) {
        setCurrentMonth(12);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 12) {
        setCurrentMonth(1);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const handleCalendarDayClick = (dateStr: string) => {
    setDate(dateStr);
  };

  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      // Resetear al mes actual cuando se abre el modal
      const now = new Date();
      setCurrentMonth(now.getMonth() + 1);
      setCurrentYear(now.getFullYear());
    }
  }, [open]);

  // Confirmar rango de mes
  const handleConfirmMes = () => {
    const from = new Date(selectedYear, selectedMonth - 1, 1);
    const to = new Date(selectedYear, selectedMonth, 0);
    onConfirm({ from, to, type: "month" });
    setDate("");
  };

  // Confirmar rango de año
  const handleConfirmAnio = () => {
    // selectedYear siempre debe ser el año mostrado en el input
    const year = Number(selectedYear);
    const from = new Date(year, 0, 1);
    const to = new Date(year, 11, 31);
    onConfirm({ from, to, type: "year" });
    setDate("");
  };

  // Estado para saber si el usuario seleccionó mes o año
  const [selectedRangeType, setSelectedRangeType] = React.useState<
    "month" | "year" | ""
  >("");

  // Cuando se confirma, si el tipo es mes o año, ejecuta la función correspondiente
  React.useEffect(() => {
    if (selectedRangeType === "month" && date) {
      handleConfirmMes();
      setSelectedRangeType("");
    } else if (selectedRangeType === "year" && date) {
      handleConfirmAnio();
      setSelectedRangeType("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, selectedRangeType]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg max-h-[90vh] min-w-[410px]">
        {/* Encabezado */}
        <DialogHeader className="relative p-4 bg-white border-b border-gray-100">
          <div className="flex items-center gap-2 pr-8">
            <div className="p-1.5 bg-gray-50 rounded-md border border-gray-200">
              <CalendarDays className="h-4 w-4" style={{ color: "#5B8EDC" }} />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-gray-800">
                {title}
              </DialogTitle>
              <DialogDescription className="text-gray-500 text-xs mt-0.5">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Contenido principal */}
        <div className="p-4 space-y-4 flex flex-col h-full">
          {/* Toggle entre vistas */}
          <div className="flex border border-gray-200 rounded-md p-0.5">
            <button
              onClick={() => setView("input")}
              className={cn(
                "flex-1 py-1.5 text-xs font-medium rounded-sm transition-colors",
                view === "input"
                  ? "bg-gray-100 text-gray-800"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              Entrada manual
            </button>
            <button
              onClick={() => setView("calendar")}
              className={cn(
                "flex-1 py-1.5 text-xs font-medium rounded-sm transition-colors",
                view === "calendar"
                  ? "bg-gray-100 text-gray-800"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              Calendario
            </button>
          </div>

          {/* Vista de entrada manual */}
          {view === "input" && (
            <div className="space-y-4">
              {/* Quick selection buttons */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-700">
                  Selección rápida
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={setYesterday}
                    className={cn(
                      "flex-1 text-xs py-1 h-auto",
                      date === formatDateToInput(yesterday) &&
                        "bg-blue-50 border-blue-200 text-blue-700"
                    )}
                  >
                    {`Ayer (${formatShortDate(yesterday)})`}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={setToday}
                    className={cn(
                      "flex-1 text-xs py-1 h-auto",
                      date === formatDateToInput(today) &&
                        "bg-blue-50 border-blue-200 text-blue-700"
                    )}
                  >
                    {`Hoy (${formatShortDate(today)})`}
                  </Button>
                </div>
              </div>
              {/* Selección de mes y año */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-700">Mes y año</p>
                <div className="flex gap-2 items-end">
                  <div className="flex flex-col flex-1">
                    <label
                      className="text-xs text-gray-600 mb-1"
                      htmlFor="mes-select"
                    >
                      Mes
                    </label>
                    <select
                      id="mes-select"
                      className="border rounded px-2 py-1 text-xs"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    >
                      {monthNames.map((name, idx) => (
                        <option key={name} value={idx + 1}>
                          {name}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const from = new Date(
                          selectedYear,
                          selectedMonth - 1,
                          1
                        );
                        const to = new Date(selectedYear, selectedMonth, 0);

                        onConfirm({ from, to, type: "month" });
                        setHighlighted("mes");
                        setDate("");
                      }}
                      className={cn(
                        "text-xs py-1 h-auto mt-2",
                        highlighted === "mes" &&
                          "bg-blue-50 border-blue-200 text-blue-700"
                      )}
                    >
                      Descargar mes
                    </Button>
                  </div>
                  <div className="flex flex-col flex-1">
                    <label
                      className="text-xs text-gray-600 mb-1"
                      htmlFor="anio-input"
                    >
                      Año
                    </label>
                    <input
                      id="anio-input"
                      type="number"
                      className="border rounded px-2 py-1 text-xs w-full"
                      value={selectedYear}
                      min={2000}
                      max={2100}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (!isNaN(val)) setSelectedYear(val);
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const year = Number(selectedYear);

                        const from = new Date(year, 0, 1);
                        const to = new Date(year, 11, 31);

                        onConfirm({ from, to, type: "year" });
                        setHighlighted("año");
                        setDate("");
                      }}
                      className={cn(
                        "text-xs py-1 h-auto mt-2",
                        highlighted === "año" &&
                          "bg-blue-50 border-blue-200 text-blue-700"
                      )}
                    >
                      Descargar año
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Vista de calendario - Contenedor con scroll si es necesario */}
          {view === "calendar" && (
            <div className="flex-1 overflow-y-auto pr-1">
              <div className="space-y-3">
                {/* Navegación del calendario */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigateMonth("prev")}
                    className="h-6 w-6 hover:bg-gray-100"
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <div className="text-sm font-medium text-gray-800">
                    {monthNames[currentMonth - 1]} {currentYear}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigateMonth("next")}
                    className="h-6 w-6 hover:bg-gray-100"
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>

                {/* Días de la semana */}
                <div className="grid grid-cols-7 gap-0.5">
                  {["L", "M", "X", "J", "V", "S", "D"].map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs font-medium text-gray-500 py-0.5"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Días del mes */}
                <div className="space-y-0.5 mb-2">
                  {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="grid grid-cols-7 gap-0.5">
                      {week.map((day, dayIndex) => (
                        <div key={dayIndex} className="aspect-square">
                          {day ? (
                            <button
                              onClick={() => handleCalendarDayClick(day.date)}
                              className={cn(
                                "w-full h-full rounded text-xs font-medium transition-colors",
                                "flex items-center justify-center",
                                day.isSelected && "bg-blue-600 text-white",
                                day.isToday &&
                                  !day.isSelected &&
                                  "bg-blue-50 text-blue-600 border border-blue-200",
                                !day.isSelected &&
                                  !day.isToday &&
                                  "hover:bg-gray-100 text-gray-700",
                                day.isWeekend &&
                                  !day.isSelected &&
                                  "text-gray-600"
                              )}
                            >
                              {day.day}
                            </button>
                          ) : (
                            <div />
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Botón para hoy */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={setToday}
                  className="w-full text-xs py-1 h-auto mb-2"
                >
                  Ir a hoy
                </Button>
              </div>
            </div>
          )}
          {/* Botones de acción - SIEMPRE VISIBLES */}
          <div className="pt-3 border-t border-gray-200">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 h-8 rounded-md text-xs hover:bg-[#5B8EDC]/10 border-[#5B8EDC] text-[#5B8EDC] flex items-center gap-2 justify-center"
                style={{ borderColor: "#5B8EDC", color: "#5B8EDC" }}
              >
                <X className="w-4 h-4" />
                {cancelLabel}
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!date}
                className={cn(
                  "flex-1 h-8 rounded-md text-xs flex items-center gap-2 justify-center",
                  "transition-colors text-white",
                  !date ? "opacity-50 cursor-not-allowed" : ""
                )}
                style={{ backgroundColor: "#5B8EDC", borderColor: "#5B8EDC" }}
              >
                <Download className="w-4 h-4" />
                {confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
