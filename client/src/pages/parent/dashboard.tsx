import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { ModuleLayout } from "@/components/layout/module-layout";
import { parentNavItems, useParentChildren, useParentDashboard } from "./parent-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, CheckCircle, XCircle, DollarSign, CalendarCheck, GraduationCap, Printer } from "lucide-react";
import { useAutoNotificationPermission } from "@/hooks/use-notifications";

function escHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getGradeColor(grade: string) {
  if (grade === "A+" || grade === "A") return "text-green-600 dark:text-green-400";
  if (grade === "B" || grade === "C") return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
}

export default function ParentDashboard() {
  useAutoNotificationPermission();
  const [, setLocation] = useLocation();
  const { isAuthenticated, session } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  const { data: children = [], isLoading: childrenLoading } = useParentChildren();
  const { data: dashboardData, isLoading: dashLoading } = useParentDashboard(selectedStudent);

  useEffect(() => {
    if (!isAuthenticated("parent") || session?.role !== "parent") {
      setLocation("/parent/login");
    }
  }, [isAuthenticated, session, setLocation]);

  useEffect(() => {
    if (children.length > 0 && !selectedStudent) {
      setSelectedStudent(children[0].studentId);
    }
  }, [children, selectedStudent]);

  if (!isAuthenticated("parent") || session?.role !== "parent") return null;

  const unpaidChallans = dashboardData?.fee?.filter((c: any) => c.status !== "Paid") || [];

  return (
    <ModuleLayout module="parent" navItems={parentNavItems}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold" data-testid="text-page-title">Parent Dashboard</h1>
          <p className="text-muted-foreground mt-1">Apne bachche ki fee, attendance aur results dekhein</p>
        </div>

        {childrenLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : children.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground" data-testid="text-no-children">No children linked to your account yet. Contact school administration.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex flex-wrap gap-2" data-testid="child-tabs">
              {children.map((child: any) => (
                <button
                  key={child.studentId}
                  onClick={() => setSelectedStudent(child.studentId)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    selectedStudent === child.studentId
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-background hover:bg-accent border-border"
                  }`}
                  data-testid={`button-child-${child.studentId}`}
                >
                  <span className="font-medium">{child.name}</span>
                  <span className="text-sm ml-2 opacity-80">{child.class}-{child.section}</span>
                </button>
              ))}
            </div>

            {dashLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : dashboardData ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card data-testid="card-fee-status">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <DollarSign className="w-5 h-5 text-green-500" />
                      Fee Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {unpaidChallans.length > 0 && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg" data-testid="text-unpaid-warning">
                        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                        <span className="text-sm text-red-700 dark:text-red-400 font-medium">
                          {unpaidChallans.length} unpaid challan(s)
                        </span>
                      </div>
                    )}

                    <div className="space-y-2">
                      {(dashboardData.fee || []).map((challan: any) => (
                        <div key={challan.id} className="flex items-center justify-between p-2 rounded border gap-2 flex-wrap" data-testid={`row-challan-${challan.id}`}>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium">{challan.challanNo || `#${challan.id}`}</span>
                            {challan.netAmount && <span className="text-xs text-muted-foreground">Rs. {challan.netAmount?.toLocaleString?.() ?? challan.netAmount}</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={challan.status === "Paid" ? "default" : "destructive"} data-testid={`badge-status-${challan.id}`}>
                              {challan.status}
                            </Badge>
                            <button
                              onClick={() => {
                                const w = window.open("", "_blank");
                                if (!w) return;
                                w.document.write(`<html><head><title>Fee Challan</title><style>body{font-family:sans-serif;padding:24px;max-width:480px;margin:auto}h2{margin-bottom:8px}table{width:100%;border-collapse:collapse}td{padding:6px 8px;border:1px solid #ddd}@media print{button{display:none}}</style></head><body><h2>Fee Challan</h2><table><tr><td>Challan No</td><td><b>${escHtml(challan.challanNo || challan.id)}</b></td></tr><tr><td>Student</td><td>${escHtml(challan.studentName || "")}</td></tr><tr><td>Period</td><td>${escHtml(challan.period || "")}</td></tr><tr><td>Issue Date</td><td>${escHtml(challan.issueDate || "")}</td></tr><tr><td>Due Date</td><td>${escHtml(challan.dueDate || "")}</td></tr><tr><td>Total Amount</td><td>Rs. ${escHtml(challan.totalAmount || 0)}</td></tr><tr><td>Discount</td><td>Rs. ${escHtml(challan.discountAmount || 0)}</td></tr><tr><td>Net Amount</td><td><b>Rs. ${escHtml(challan.netAmount || 0)}</b></td></tr><tr><td>Status</td><td>${escHtml(challan.status)}</td></tr></table><br><button onclick="window.print()">Print</button></body></html>`);
                                w.document.close();
                              }}
                              className="p-1 rounded hover:bg-accent transition-colors"
                              title="Print / Download Challan"
                              data-testid={`button-print-challan-${challan.id}`}
                            >
                              <Printer className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {(!dashboardData.fee || dashboardData.fee.length === 0) && (
                        <p className="text-sm text-muted-foreground text-center py-2">No challans found</p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">Payment ke liye school fee department se raabta karein</p>
                  </CardContent>
                </Card>

                <Card data-testid="card-attendance">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CalendarCheck className="w-5 h-5 text-blue-500" />
                      Attendance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center space-y-3">
                    <div className={`text-5xl font-bold ${
                      (dashboardData.attendance?.percentage || 0) >= 75
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`} data-testid="text-attendance-percentage">
                      {dashboardData.attendance?.percentage || 0}%
                    </div>
                    <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                      {(dashboardData.attendance?.percentage || 0) >= 75 ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span data-testid="text-attendance-detail">
                        {dashboardData.attendance?.presentDays || 0} present / {dashboardData.attendance?.totalDays || 0} total days
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground pt-2 border-t">Last 30 days</p>
                  </CardContent>
                </Card>

                <Card data-testid="card-results">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <GraduationCap className="w-5 h-5 text-violet-500" />
                      Recent Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(dashboardData.results || []).map((result: any) => (
                        <div key={result.id} className="p-2 rounded border space-y-1" data-testid={`row-result-${result.id}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{result.subject}</span>
                            <span className={`text-sm font-bold ${getGradeColor(result.grade || "")}`} data-testid={`text-grade-${result.id}`}>
                              {result.grade || "N/A"}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {result.marksObtained}/{result.maxMarks} marks
                          </div>
                        </div>
                      ))}
                      {(!dashboardData.results || dashboardData.results.length === 0) && (
                        <p className="text-sm text-muted-foreground text-center py-2">No results found</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </>
        )}
      </div>
    </ModuleLayout>
  );
}
