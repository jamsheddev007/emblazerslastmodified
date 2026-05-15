import { useState, useCallback } from "react";
import { Upload, FileText, AlertCircle, CheckCircle, Download, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { parseCSV, generateCSVTemplate, downloadCSV, type CSVColumn, type CSVError, type CSVParseResult } from "@/lib/csv-utils";

export interface BulkUploadProps<T> {
  title: string;
  description: string;
  columns: CSVColumn[];
  templateFilename: string;
  onUpload: (data: T[]) => Promise<BulkUploadResult>;
  isOpen: boolean;
  onClose: () => void;
}

export interface BulkUploadResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
}

type UploadState = "idle" | "preview" | "uploading" | "complete";

export function BulkUpload<T extends Record<string, unknown>>({
  title,
  description,
  columns,
  templateFilename,
  onUpload,
  isOpen,
  onClose,
}: BulkUploadProps<T>) {
  const [state, setState] = useState<UploadState>("idle");
  const [parseResult, setParseResult] = useState<CSVParseResult<T> | null>(null);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files?.[0]) {
      processFile(files[0]);
    }
  }, [columns]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.[0]) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setParseResult({
        data: [],
        errors: [{ row: 0, message: "Please upload a CSV file" }],
        isValid: false,
      });
      setState("preview");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = parseCSV<T>(text, columns);
      setParseResult(result);
      setState("preview");
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const template = generateCSVTemplate(columns);
    downloadCSV(template, templateFilename);
  };

  const handleUpload = async () => {
    if (!parseResult || !parseResult.isValid) return;

    setState("uploading");
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 10, 90));
    }, 200);

    try {
      const result = await onUpload(parseResult.data);
      setUploadResult(result);
      setProgress(100);
      setState("complete");
    } catch (error) {
      setUploadResult({
        success: 0,
        failed: parseResult.data.length,
        errors: [{ row: 0, message: String(error) }],
      });
      setState("complete");
    } finally {
      clearInterval(progressInterval);
    }
  };

  const handleReset = () => {
    setState("idle");
    setParseResult(null);
    setUploadResult(null);
    setProgress(0);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const previewColumns = columns.slice(0, 5);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {state === "idle" && (
            <div className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-muted-foreground/50"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">
                  Drag and drop your CSV file here
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  or click to browse
                </p>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  id="csv-upload"
                  onChange={handleFileSelect}
                  data-testid="input-csv-file"
                />
                <label htmlFor="csv-upload">
                  <Button variant="outline" asChild>
                    <span data-testid="button-browse-file">Browse Files</span>
                  </Button>
                </label>
              </div>

              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  data-testid="button-download-template"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV Template
                </Button>
              </div>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Expected Columns</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="flex flex-wrap gap-2">
                    {columns.map((col) => (
                      <Badge
                        key={col.key}
                        variant={col.required ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {col.label}
                        {col.required && " *"}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {state === "preview" && parseResult && (
            <div className="space-y-4">
              {parseResult.errors.length > 0 && (
                <Card className="border-destructive">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      Validation Errors ({parseResult.errors.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <ScrollArea className="h-32">
                      <ul className="space-y-1 text-sm">
                        {parseResult.errors.map((error, i) => (
                          <li key={i} className="text-destructive">
                            Row {error.row}: {error.message}
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              {parseResult.data.length > 0 && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Data Preview
                      </span>
                      <Badge variant="secondary">
                        {parseResult.data.length} rows
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <ScrollArea className="h-64">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            {previewColumns.map((col) => (
                              <TableHead key={col.key}>{col.label}</TableHead>
                            ))}
                            {columns.length > 5 && (
                              <TableHead>...</TableHead>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parseResult.data.slice(0, 10).map((row, i) => (
                            <TableRow key={i}>
                              <TableCell className="text-muted-foreground">
                                {i + 1}
                              </TableCell>
                              {previewColumns.map((col) => (
                                <TableCell key={col.key} className="max-w-32 truncate">
                                  {String(row[col.key] || "")}
                                </TableCell>
                              ))}
                              {columns.length > 5 && (
                                <TableCell className="text-muted-foreground">
                                  ...
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {parseResult.data.length > 10 && (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          Showing 10 of {parseResult.data.length} rows
                        </p>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {state === "uploading" && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg font-medium mb-4">Uploading data...</p>
              <Progress value={progress} className="w-64" />
              <p className="text-sm text-muted-foreground mt-2">
                {progress}% complete
              </p>
            </div>
          )}

          {state === "complete" && uploadResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-8">
                {uploadResult.failed === 0 ? (
                  <div className="text-center">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <p className="text-xl font-medium text-green-600">
                      Upload Successful
                    </p>
                    <p className="text-muted-foreground mt-2">
                      {uploadResult.success} records imported successfully
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <AlertCircle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
                    <p className="text-xl font-medium">Upload Complete</p>
                    <p className="text-muted-foreground mt-2">
                      {uploadResult.success} successful, {uploadResult.failed} failed
                    </p>
                  </div>
                )}
              </div>

              {uploadResult.errors.length > 0 && (
                <Card className="border-destructive">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm text-destructive">
                      Failed Records
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <ScrollArea className="h-32">
                      <ul className="space-y-1 text-sm">
                        {uploadResult.errors.map((error, i) => (
                          <li key={i} className="text-destructive">
                            Row {error.row}: {error.message}
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {state === "idle" && (
            <Button variant="outline" onClick={handleClose} data-testid="button-cancel-bulk">
              Cancel
            </Button>
          )}
          {state === "preview" && (
            <>
              <Button variant="outline" onClick={handleReset} data-testid="button-back">
                <X className="h-4 w-4 mr-2" />
                Start Over
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!parseResult?.isValid}
                data-testid="button-upload-data"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload {parseResult?.data.length || 0} Records
              </Button>
            </>
          )}
          {state === "complete" && (
            <>
              <Button variant="outline" onClick={handleReset} data-testid="button-upload-more">
                Upload More
              </Button>
              <Button onClick={handleClose} data-testid="button-done">
                Done
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
