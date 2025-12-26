"use client";

import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useDropzone } from "react-dropzone";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  UploadCloud,
  File as FileIcon,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  Cog,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { downloadExcelTemplate } from "@/lib/excel-template";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type UploadResult = {
  successCount: number;
  errorCount: number;
  errors: { row: number; error: string; data: any }[];
};

type UploadDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onProcessFile: (file: File) => Promise<any>;
};

export function UploadDialog({
  isOpen,
  onClose,
  onProcessFile,
}: UploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(true);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setUploadResult(null);
      setProcessingError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
    },
    maxFiles: 1,
  });

  const handleProcess = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProcessingError(null);
    setUploadResult(null);
    try {
      const result = await onProcessFile(file);
      setUploadResult(result);
      if (result && result.errorCount === 0) {
        toast({
          title: "Archivo cargado correctamente",
          description: `Se cargaron ${result.successCount} facturas sin errores.`,
          className: "bg-green-100 text-green-800 border-green-300",
        });
      } else if (result && result.errorCount > 0) {
        toast({
          title: "Carga completada con errores",
          description: `Se cargaron ${result.successCount} facturas. ${result.errorCount} filas con errores.`,
          className: "bg-red-100 text-red-800 border-red-300",
        });
      }
    } catch (error: any) {
      setProcessingError(
        error.message || "Ocurrió un error desconocido al procesar el archivo."
      );
      toast({
        title: "Error al procesar archivo",
        description:
          error.message ||
          "Ocurrió un error desconocido al procesar el archivo.",
        className: "bg-yellow-100 text-yellow-700 border-yellow-200",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Cerrar modal automáticamente si la carga fue exitosa y no hay errores
  useEffect(() => {
    if (
      uploadResult &&
      uploadResult.successCount > 0 &&
      uploadResult.errorCount === 0
    ) {
      const timeout = setTimeout(() => {
        setShowModal(false);
        setTimeout(() => handleClose(), 300); // Espera animación
      }, 1200);
      return () => clearTimeout(timeout);
    }
  }, [uploadResult]);

  const handleClose = () => {
    setFile(null);
    setIsProcessing(false);
    setUploadResult(null);
    setProcessingError(null);
    onClose();
  };

  const handleDownloadTemplate = () => {
    downloadExcelTemplate();
  };

  const renderContent = () => {
    if (isProcessing) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-8 h-48">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg font-medium">Procesando archivo...</p>
          <p className="text-sm text-muted-foreground">
            Esto puede tardar unos segundos.
          </p>
        </div>
      );
    }

    if (processingError) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-8 h-48 bg-red-50 dark:bg-red-900/10 rounded-lg">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-lg font-bold text-destructive">
            Error al Procesar
          </p>
          <p className="text-sm text-destructive/80">{processingError}</p>
        </div>
      );
    }

    if (uploadResult) {
      return (
        <div className="p-6">
          <div className="flex flex-col items-center text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-2xl font-bold mb-2">Carga Completada</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 my-6 text-center">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {uploadResult.successCount}
              </p>
              <p className="text-sm font-medium text-muted-foreground">
                Facturas Cargadas
              </p>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                {uploadResult.errorCount}
              </p>
              <p className="text-sm font-medium text-muted-foreground">
                Filas con Errores
              </p>
            </div>
          </div>

          {uploadResult.errorCount > 0 && (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Ver Detalles de Errores</AccordionTrigger>
                <AccordionContent>
                  <ScrollArea className="h-[200px] p-1 border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[10%]">Fila</TableHead>
                          <TableHead className="w-[30%]">Error</TableHead>
                          <TableHead>Datos de la Fila</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {uploadResult.errors.map((err, index) => (
                          <TableRow key={index} className="bg-muted/20">
                            <TableCell className="font-medium text-destructive">
                              {err.row}
                            </TableCell>
                            <TableCell className="text-xs">
                              {err.error}
                            </TableCell>
                            <TableCell>
                              <div className="overflow-x-auto">
                                <table className="min-w-full text-xs border border-gray-200 rounded">
                                  <tbody>
                                    {Object.entries(err.data).map(
                                      ([key, value]) => (
                                        <tr key={key}>
                                          <td className="font-semibold px-2 py-1 border-b border-r border-gray-100 bg-gray-50 text-gray-700">
                                            {key}
                                          </td>
                                          <td className="px-2 py-1 border-b border-gray-100">
                                            {String(value)}
                                          </td>
                                        </tr>
                                      )
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>
      );
    }

    if (file) {
      return (
        <div className="p-8 text-center border-2 border-dashed rounded-lg flex flex-col items-center justify-center h-48">
          <FileIcon className="h-12 w-12 text-primary" />
          <p className="mt-4 font-medium">{file.name}</p>
          <p className="text-sm text-muted-foreground">
            {(file.size / 1024).toFixed(2)} KB
          </p>
          <button
            onClick={() => setFile(null)}
            className="mt-2 text-xs text-destructive hover:underline"
          >
            Quitar archivo
          </button>
        </div>
      );
    }

    return (
      <div
        {...getRootProps()}
        className={`p-8 text-center border-2 border-dashed rounded-lg cursor-pointer h-48 flex flex-col items-center justify-center transition-colors ${
          isDragActive
            ? "border-primary bg-primary/10"
            : "hover:border-primary/50"
        }`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="h-12 w-12 text-muted-foreground" />
        <p className="mt-4 font-medium">
          Arrastra y suelta un archivo aquí, o haz clic para seleccionar
        </p>
        <p className="text-sm text-muted-foreground">
          Solo archivos .xlsx o .xls
        </p>
      </div>
    );
  };

  return (
    <Dialog
      open={isOpen && showModal}
      onOpenChange={(open) => !open && handleClose()}
    >
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Cargar Facturas desde Excel</DialogTitle>
          <DialogDescription>
            Selecciona o arrastra un archivo .xlsx/.xls para cargar nuevas
            facturas al sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">{renderContent()}</div>

        <Separator />

        <DialogFooter className="pt-4">
          <div className="w-full flex justify-between items-center ">
            <Button
              variant="link"
              onClick={handleDownloadTemplate}
              className="p-0 h-auto "
            >
              <Download className="mr-2 h-4 w-4" />
              Descargar plantilla de facturas
            </Button>
            <div>
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                className="mr-3 border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors rounded-lg px-4 py-2 shadow-sm"
              >
                <X className="mr-2 h-4 w-4" />
                {uploadResult ? "Cerrar" : "Cancelar"}
              </Button>
              <Button
                type="button"
                onClick={handleProcess}
                disabled={!file || isProcessing || !!uploadResult}
              >
                {isProcessing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Cog className="mr-2 h-4 w-4" />
                )}
                Procesar Archivo
              </Button>{" "}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
