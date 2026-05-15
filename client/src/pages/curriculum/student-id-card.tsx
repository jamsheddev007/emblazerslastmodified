import { useRef, useState, useCallback } from "react";
import { ModuleLayout } from "@/components/layout/module-layout";
import { studentNavItems, useIdCardStatus, useGenerateIdCard } from "./student-data";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { IdCard, Download, AlertTriangle, CheckCircle, User, Loader2, UploadCloud, X, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];

export default function StudentIdCard() {
  const { session } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [justGenerated, setJustGenerated] = useState(false);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { data: status, isLoading: statusLoading } = useIdCardStatus();
  const generateMutation = useGenerateIdCard();

  const studentName = (session as any)?.name || (session as any)?.studentName || "Student Name";
  const studentId = (session as any)?.studentId || "STU-0000";
  const className = (session as any)?.className || "—";
  const section = (session as any)?.section || "—";

  const processFile = useCallback((file: File) => {
    setPhotoError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setPhotoError("Only JPG and PNG images are allowed.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setPhotoError("Photo must be under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoDataUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const clearPhoto = () => {
    setPhotoDataUrl(null);
    setPhotoError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGenerateAndDownload = async () => {
    if (!photoDataUrl) return;
    if (!status?.canGenerate && !justGenerated) return;

    try {
      const result = await generateMutation.mutateAsync();
      setJustGenerated(true);

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [85, 54] });

      // Header bar
      doc.setFillColor(15, 52, 96);
      doc.rect(0, 0, 85, 14, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("EMBLAZERS", 42.5, 6, { align: "center" });
      doc.setFontSize(5.5);
      doc.setFont("helvetica", "normal");
      doc.text("School Management System", 42.5, 10.5, { align: "center" });

      // Card body background
      doc.setFillColor(245, 247, 250);
      doc.rect(0, 14, 85, 40, "F");

      // Photo area
      const photoX = 4;
      const photoY = 17;
      const photoW = 20;
      const photoH = 24;
      doc.setFillColor(220, 225, 235);
      doc.roundedRect(photoX, photoY, photoW, photoH, 2, 2, "F");

      // Embed uploaded photo
      try {
        const imgFormat = photoDataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";
        doc.addImage(photoDataUrl, imgFormat, photoX, photoY, photoW, photoH);
      } catch {
        // fallback: leave placeholder
        doc.setTextColor(140, 150, 165);
        doc.setFontSize(5);
        doc.text("PHOTO", photoX + photoW / 2, photoY + photoH / 2 + 2, { align: "center" });
      }

      // Student name
      doc.setTextColor(15, 52, 96);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      const displayName = result.name || studentName;
      const maxNameWidth = 52;
      const nameFontSize = doc.getTextWidth(displayName) * 10 > maxNameWidth ? 7.5 : 10;
      doc.setFontSize(nameFontSize);
      doc.text(displayName, 28, 22);

      // Details rows
      doc.setFontSize(5.5);
      const labelX = 28;
      const valueX = 48;
      const rows: [string, string][] = [
        ["Student ID:", result.studentId || studentId],
        ["Class:", result.className || className],
        ["Section:", result.section || section],
      ];

      rows.forEach(([label, value], i) => {
        const y = 29 + i * 5.5;
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 110, 125);
        doc.text(label, labelX, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(30, 40, 55);
        doc.text(value, valueX, y);
      });

      // Footer bar
      doc.setFillColor(15, 52, 96);
      doc.rect(0, 46, 85, 8, "F");
      doc.setTextColor(200, 210, 225);
      doc.setFontSize(5);
      doc.setFont("helvetica", "normal");
      const generatedDate = new Date(result.generatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
      doc.text(`Generated: ${generatedDate}`, 4, 51);
      doc.text("If found, please return to school administration.", 42.5, 51, { align: "center" });

      doc.save(`ID_Card_${result.studentId || studentId}.pdf`);
      toast({ title: "ID card downloaded successfully!" });
    } catch (err: any) {
      toast({ title: "Cannot generate ID card", description: err.message, variant: "destructive" });
    }
  };

  const canAct = (status?.canGenerate || justGenerated) && !!photoDataUrl;

  return (
    <ModuleLayout module="curriculum" navItems={studentNavItems}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <IdCard className="w-6 h-6 text-blue-600" />
            Student ID Card
          </h1>
          <p className="text-muted-foreground mt-1">Upload your photo, preview your ID card, then download it as a PDF</p>
        </div>

        {!statusLoading && !status?.canGenerate && !justGenerated && (
          <Alert className="border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950" data-testid="alert-duplicate-request">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-800 dark:text-red-200 font-medium">
              <span className="font-semibold">Duplicate Request:</span> You have already generated your ID card this month.
              You can generate again on <span className="font-bold">{status?.nextAvailableDate}</span>.
            </AlertDescription>
          </Alert>
        )}

        {justGenerated && (
          <Alert className="border-green-300 bg-green-50 dark:border-green-900 dark:bg-green-950" data-testid="alert-success">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Your ID card was generated and downloaded successfully this month.
            </AlertDescription>
          </Alert>
        )}

        {/* Photo Upload Section */}
        <Card className="shadow-sm" data-testid="card-photo-upload">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-semibold uppercase tracking-wide">Step 1 — Upload Your Photo</h2>
              <span className="text-xs text-red-500 font-medium">* Required</span>
            </div>

            {!photoDataUrl ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                data-testid="upload-photo-dropzone"
                className={`
                  relative flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all
                  ${isDragging
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                    : "border-slate-300 dark:border-slate-600 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }
                `}
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <UploadCloud className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-sm text-foreground">Click to upload or drag & drop</p>
                  <p className="text-xs text-muted-foreground mt-1">JPG or PNG • Max 2MB</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleFileChange}
                  className="hidden"
                  data-testid="input-photo-upload"
                />
              </div>
            ) : (
              <div className="flex items-center gap-4 p-4 rounded-xl border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950" data-testid="photo-preview-row">
                <img
                  src={photoDataUrl}
                  alt="Uploaded photo"
                  className="w-16 h-20 object-cover rounded-lg border-2 border-white shadow-md"
                  data-testid="img-uploaded-photo"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <p className="font-medium text-green-800 dark:text-green-200 text-sm">Photo uploaded successfully</p>
                  </div>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">This photo will appear on your ID card</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearPhoto}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                  data-testid="button-remove-photo"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {photoError && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1" data-testid="text-photo-error">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {photoError}
              </p>
            )}
          </CardContent>
        </Card>

        {/* ID Card Preview */}
        <Card className="shadow-md" data-testid="card-id-card-preview">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <IdCard className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-semibold uppercase tracking-wide">Step 2 — Preview</h2>
            </div>

            <div
              className="mx-auto relative rounded-xl overflow-hidden shadow-xl"
              style={{ width: 340, height: 216, background: "#f5f7fa", fontFamily: "sans-serif" }}
              data-testid="id-card-visual"
            >
              {/* Header */}
              <div
                className="absolute inset-x-0 top-0 flex flex-col items-center justify-center"
                style={{ height: 56, background: "linear-gradient(135deg, #0f3460 0%, #16213e 100%)" }}
              >
                <p className="text-white font-extrabold tracking-widest text-sm">EMBLAZERS</p>
                <p className="text-blue-200 text-xs mt-0.5">School Management System</p>
              </div>

              {/* Photo area */}
              <div className="absolute" style={{ top: 64, left: 16 }}>
                <div
                  className="rounded-lg overflow-hidden flex flex-col items-center justify-center"
                  style={{ width: 80, height: 96, background: "#dce1eb" }}
                >
                  {photoDataUrl ? (
                    <img
                      src={photoDataUrl}
                      alt="Student"
                      className="w-full h-full object-cover"
                      data-testid="img-card-photo-preview"
                    />
                  ) : (
                    <>
                      <User className="w-10 h-10 text-slate-400" />
                      <span className="text-xs text-slate-400 mt-1 font-semibold tracking-wider">PHOTO</span>
                    </>
                  )}
                </div>
              </div>

              {/* Student info */}
              <div className="absolute" style={{ top: 64, left: 112 }}>
                <p className="font-extrabold text-base leading-tight" style={{ color: "#0f3460", maxWidth: 210 }}>
                  {studentName}
                </p>
                <div className="mt-3 space-y-1.5">
                  {[
                    ["Student ID", studentId],
                    ["Class", className],
                    ["Section", section],
                  ].map(([label, value]) => (
                    <div key={label} className="flex gap-2 text-xs">
                      <span className="font-semibold w-20" style={{ color: "#64748b" }}>{label}:</span>
                      <span className="font-medium" style={{ color: "#1e293b" }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div
                className="absolute inset-x-0 bottom-0 flex items-center px-3"
                style={{ height: 32, background: "#0f3460" }}
              >
                <p className="text-xs" style={{ color: "#94a3b8" }}>
                  If found, please return to school administration.
                </p>
              </div>

              {/* Overlay when no photo */}
              {!photoDataUrl && (
                <div className="absolute inset-0 rounded-xl bg-white/40 dark:bg-black/20 backdrop-blur-[1px] flex items-center justify-center" style={{ top: 56, height: 128 }}>
                  <p className="text-xs text-slate-500 font-medium bg-white/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-full shadow-sm">
                    Upload a photo to see preview
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2 justify-center text-sm text-muted-foreground">
              <Badge variant="outline">{studentId}</Badge>
              <Badge variant="outline">Class {className} — Section {section}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Generate Button */}
        <div className="flex flex-col items-center gap-3">
          {statusLoading ? (
            <Button disabled className="gap-2 px-8 py-5 text-base" data-testid="button-generate-id-card">
              <Loader2 className="w-5 h-5 animate-spin" /> Checking status...
            </Button>
          ) : (
            <Button
              onClick={handleGenerateAndDownload}
              disabled={!canAct || generateMutation.isPending}
              className="gap-2 px-8 py-5 text-base bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
              data-testid="button-generate-id-card"
            >
              {generateMutation.isPending ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</>
              ) : (
                <><Download className="w-5 h-5" /> Generate &amp; Download ID Card</>
              )}
            </Button>
          )}

          {!statusLoading && !photoDataUrl && (
            <p className="text-sm text-amber-600 dark:text-amber-400 font-medium text-center">
              A photo is required before you can generate your ID card.
            </p>
          )}

          {!statusLoading && !status?.canGenerate && !justGenerated && (
            <p className="text-sm text-muted-foreground text-center">
              You can generate your ID card once per calendar month.
            </p>
          )}

          {!statusLoading && (status?.canGenerate || justGenerated) && photoDataUrl && !justGenerated && (
            <p className="text-sm text-muted-foreground text-center">
              You can generate your ID card <span className="font-medium text-foreground">once per month</span>. This will count as your generation for {new Date().toLocaleString("default", { month: "long", year: "numeric" })}.
            </p>
          )}
        </div>
      </div>
    </ModuleLayout>
  );
}
