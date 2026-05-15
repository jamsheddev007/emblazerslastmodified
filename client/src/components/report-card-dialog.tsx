import { useState, useCallback } from "react";
import { pdf } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReportCardDocument } from "./report-card-pdf";
import { FileText, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReportCardDialogProps {
  studentId: string;
  studentName: string;
  fetchFn: (url: string) => Promise<Response>;
  trigger?: React.ReactNode;
}

export function ReportCardDialog({ studentId, studentName, fetchFn, trigger }: ReportCardDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [data, setData] = useState<any>(null);
  const [selectedExam, setSelectedExam] = useState<string>("");
  const { toast } = useToast();

  const fetchData = useCallback(async (examId?: string) => {
    setLoading(true);
    try {
      const url = examId
        ? `/api/report-card/${studentId}?examId=${examId}`
        : `/api/report-card/${studentId}`;
      const res = await fetchFn(url);
      if (!res.ok) throw new Error("Failed to fetch report card data");
      const json = await res.json();
      setData(json);
      if (json.availableExams?.length > 0 && !examId) {
        setSelectedExam(String(json.availableExams[0].id));
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [studentId, fetchFn, toast]);

  const handleOpen = () => {
    setOpen(true);
    fetchData();
  };

  const handleExamChange = (val: string) => {
    setSelectedExam(val);
    fetchData(val);
  };

  const handleDownload = async () => {
    if (!data) return;
    setGenerating(true);
    try {
      const blob = await pdf(<ReportCardDocument data={data} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Report_Card_${studentName.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Downloaded", description: "Report card PDF saved successfully" });
    } catch (e: any) {
      toast({ title: "Error", description: "Failed to generate PDF", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      {trigger ? (
        <div onClick={handleOpen} className="cursor-pointer">{trigger}</div>
      ) : (
        <Button variant="outline" size="sm" onClick={handleOpen} data-testid="button-report-card">
          <FileText className="w-4 h-4 mr-2" />
          Report Card
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="text-report-card-title">Report Card — {studentName}</DialogTitle>
            <DialogDescription>Preview and download the student report card</DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : data ? (
            <div className="space-y-4">
              {data.availableExams?.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">Select Exam:</span>
                  <Select value={selectedExam} onValueChange={handleExamChange}>
                    <SelectTrigger className="w-64" data-testid="select-exam">
                      <SelectValue placeholder="Choose exam" />
                    </SelectTrigger>
                    <SelectContent>
                      {data.availableExams.map((e: any) => (
                        <SelectItem key={e.id} value={String(e.id)}>
                          {e.name} ({e.term})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-bold" data-testid="text-school-name">{data.school.name}</h3>
                  <p className="text-sm text-muted-foreground">{data.school.branchName}</p>
                </div>

                <div className="bg-[#0D7377] text-white rounded-md p-2 flex justify-between items-center">
                  <span className="font-semibold text-sm">STUDENT RESULT CARD</span>
                  {data.exam && (
                    <span className="text-xs opacity-90">
                      {data.exam.term} — {data.exam.name}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><span className="text-muted-foreground">Student:</span> <strong>{data.student.name}</strong></p>
                    <p><span className="text-muted-foreground">Father:</span> <strong>{data.student.fatherName}</strong></p>
                    <p><span className="text-muted-foreground">Class:</span> <strong>{data.student.class} - {data.student.section}</strong></p>
                  </div>
                  <div>
                    <p><span className="text-muted-foreground">Roll No:</span> <strong>{data.student.rollNo}</strong></p>
                    <p><span className="text-muted-foreground">Admission:</span> <strong>{data.student.admissionNo}</strong></p>
                    <p><span className="text-muted-foreground">Attendance:</span> <strong>{data.attendance.percentage}%</strong></p>
                  </div>
                </div>

                {data.results.length > 0 ? (
                  <div className="border rounded overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#1A2B4A] text-white text-xs">
                          <th className="py-2 px-3 text-left">#</th>
                          <th className="py-2 px-3 text-left">Subject</th>
                          <th className="py-2 px-3 text-center">Total</th>
                          <th className="py-2 px-3 text-center">Obtained</th>
                          <th className="py-2 px-3 text-center">%</th>
                          <th className="py-2 px-3 text-center">Grade</th>
                          <th className="py-2 px-3 text-left">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.results.map((r: any, i: number) => (
                          <tr key={i} className={i % 2 === 0 ? "" : "bg-muted/40"}>
                            <td className="py-1.5 px-3">{r.sNo}</td>
                            <td className="py-1.5 px-3">{r.subject}</td>
                            <td className="py-1.5 px-3 text-center">{r.maxMarks}</td>
                            <td className="py-1.5 px-3 text-center font-medium">{r.marksObtained}</td>
                            <td className="py-1.5 px-3 text-center">{r.percentage}%</td>
                            <td className="py-1.5 px-3 text-center font-semibold">{r.grade}</td>
                            <td className="py-1.5 px-3 text-muted-foreground">{r.remarks}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No results available for this exam</p>
                  </div>
                )}

                <div className="bg-[#0D7377] text-white rounded-md p-3 flex justify-around text-center">
                  <div>
                    <p className="text-[10px] uppercase opacity-80">Total</p>
                    <p className="font-bold">{data.summary.totalObtained}/{data.summary.totalMaxMarks}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase opacity-80">Percentage</p>
                    <p className="font-bold">{data.summary.overallPercentage}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase opacity-80">Grade</p>
                    <p className="font-bold">{data.summary.overallGrade}</p>
                  </div>
                  <div>
                    <span className={`px-3 py-1 rounded text-sm font-bold ${data.summary.passStatus === "PASS" ? "bg-green-600" : "bg-red-600"}`}>
                      {data.summary.passStatus}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleDownload}
                disabled={generating}
                className="w-full bg-[#1A2B4A] hover:bg-[#0D4F52]"
                data-testid="button-download-report-card"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                {generating ? "Generating PDF..." : "Download Report Card PDF"}
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No data available</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
