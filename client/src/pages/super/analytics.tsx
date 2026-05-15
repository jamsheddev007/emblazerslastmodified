import { useState, useEffect } from "react";
import SuperLayout from "./layout";
import { superFetch } from "./super-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, DollarSign, TrendingUp, Users, UserCheck, CalendarCheck, AlertTriangle, Download, Bell } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, ComposedChart, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { useToast } from "@/hooks/use-toast";

const NAVY = "#1A2B4A";
const TEAL = "#0D7377";
const SKY = "#2E86AB";
const COLORS = [NAVY, TEAL, SKY, "#E76F51", "#F4A261", "#2A9D8F", "#264653", "#E9C46A"];

interface AnalyticsData {
  kpis: {
    totalRevenue: number;
    collectionRate: number;
    totalStudents: number;
    studentGrowth: number;
    totalStaff: number;
    attendanceRate: number;
    overdueAmount: number;
  };
  feeCollectionTrend: { month: string; billed: number; collected: number }[];
  studentsByClass: { class: string; boys: number; girls: number; total: number }[];
  attendanceHeatmap: { class: string; dates: { date: string; rate: number }[] }[];
  feeByClass: { class: string; collected: number; pending: number }[];
  staffByDept: { department: string; count: number; avgSalary: number }[];
  incomeVsExpense: { month: string; income: number; expenses: number; profit: number }[];
  topDefaulters: { studentName: string; class: string; outstanding: number; monthsOverdue: number; lastPayment: string }[];
  recentActivity: { id: number; type: string; description: string; timestamp: string; branch: string }[];
}

function formatPKR(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return String(n);
}

export default function SuperAnalytics() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [dateRange, setDateRange] = useState("month");
  const [branch, setBranch] = useState("all");
  const [branches, setBranches] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    superFetch("/api/super/branches").then(r => r.json()).then(setBranches).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ range: dateRange });
    if (branch !== "all") params.set("branchId", branch);

    superFetch(`/api/super/analytics?${params}`)
      .then(r => {
        if (!r.ok) throw new Error("Failed to fetch analytics");
        return r.json();
      })
      .then(d => { setData(d); setLoading(false); })
      .catch((err) => {
        setLoading(false);
        toast({ title: "Error", description: err.message || "Failed to load analytics", variant: "destructive" });
      });
  }, [dateRange, branch]);

  const handleSendReminder = async (studentName: string) => {
    toast({ title: "Reminder Sent", description: `Fee reminder sent to ${studentName}'s parent` });
  };

  if (loading && !data) {
    return (
      <SuperLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-page-title">System Analytics</h1>
              <p className="text-muted-foreground">Advanced insights across all modules</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-28 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-80 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </SuperLayout>
    );
  }

  const kpis = data?.kpis || { totalRevenue: 0, collectionRate: 0, totalStudents: 0, studentGrowth: 0, totalStaff: 0, attendanceRate: 0, overdueAmount: 0 };

  return (
    <SuperLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">System Analytics</h1>
            <p className="text-muted-foreground">Advanced insights across all modules</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40" data-testid="select-date-range">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Select value={branch} onValueChange={setBranch}>
              <SelectTrigger className="w-44" data-testid="select-branch">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map((b: any) => (
                  <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" data-testid="button-export-pdf">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KPICard icon={DollarSign} label="Total Revenue" value={`PKR ${formatPKR(kpis.totalRevenue)}`} color="bg-emerald-100 dark:bg-emerald-900" iconColor="text-emerald-600 dark:text-emerald-400" testId="kpi-revenue" />
          <KPICard icon={TrendingUp} label="Collection Rate" value={`${kpis.collectionRate}%`} color="bg-blue-100 dark:bg-blue-900" iconColor="text-blue-600 dark:text-blue-400" testId="kpi-collection" />
          <KPICard icon={Users} label="Total Students" value={String(kpis.totalStudents)} sub={kpis.studentGrowth > 0 ? `+${kpis.studentGrowth}%` : `${kpis.studentGrowth}%`} color="bg-violet-100 dark:bg-violet-900" iconColor="text-violet-600 dark:text-violet-400" testId="kpi-students" />
          <KPICard icon={UserCheck} label="Total Staff" value={String(kpis.totalStaff)} color="bg-amber-100 dark:bg-amber-900" iconColor="text-amber-600 dark:text-amber-400" testId="kpi-staff" />
          <KPICard icon={CalendarCheck} label="Attendance Rate" value={`${kpis.attendanceRate}%`} color="bg-teal-100 dark:bg-teal-900" iconColor="text-teal-600 dark:text-teal-400" testId="kpi-attendance" />
          <KPICard icon={AlertTriangle} label="Overdue Fees" value={`PKR ${formatPKR(kpis.overdueAmount)}`} color="bg-red-100 dark:bg-red-900" iconColor="text-red-600 dark:text-red-400" testId="kpi-overdue" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fee Collection Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {(data?.feeCollectionTrend?.length ?? 0) > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={data!.feeCollectionTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={formatPKR} />
                    <Tooltip formatter={(v: number) => `PKR ${v.toLocaleString()}`} />
                    <Legend />
                    <Line type="monotone" dataKey="billed" stroke={NAVY} strokeWidth={2} name="Billed" dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="collected" stroke={TEAL} strokeWidth={2} name="Collected" dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Students by Class</CardTitle>
            </CardHeader>
            <CardContent>
              {(data?.studentsByClass?.length ?? 0) > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data!.studentsByClass}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="class" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="boys" fill={SKY} name="Boys" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="girls" fill="#E76F51" name="Girls" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fee Collection by Class</CardTitle>
            </CardHeader>
            <CardContent>
              {(data?.feeByClass?.length ?? 0) > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={data!.feeByClass}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="collected"
                      nameKey="class"
                      label={({ class: c, collected }) => `${c}: ${formatPKR(collected)}`}
                    >
                      {data!.feeByClass.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => `PKR ${v.toLocaleString()}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Staff by Department</CardTitle>
            </CardHeader>
            <CardContent>
              {(data?.staffByDept?.length ?? 0) > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data!.staffByDept} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="department" type="category" tick={{ fontSize: 11 }} width={100} />
                    <Tooltip />
                    <Bar dataKey="count" fill={TEAL} name="Headcount" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Monthly Income vs Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              {(data?.incomeVsExpense?.length ?? 0) > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={data!.incomeVsExpense}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={formatPKR} />
                    <Tooltip formatter={(v: number) => `PKR ${v.toLocaleString()}`} />
                    <Legend />
                    <Area type="monotone" dataKey="income" fill={TEAL} fillOpacity={0.2} stroke={TEAL} strokeWidth={2} name="Income" />
                    <Area type="monotone" dataKey="expenses" fill="#E76F51" fillOpacity={0.2} stroke="#E76F51" strokeWidth={2} name="Expenses" />
                    <Line type="monotone" dataKey="profit" stroke={NAVY} strokeWidth={2} strokeDasharray="5 5" name="Profit/Loss" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Attendance Heatmap (Current Month)</CardTitle>
          </CardHeader>
          <CardContent>
            {(data?.attendanceHeatmap?.length ?? 0) > 0 ? (
              <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                  <div className="flex gap-1 mb-1">
                    <div className="w-24 shrink-0" />
                    {data!.attendanceHeatmap[0]?.dates.map((d, i) => (
                      <div key={i} className="w-8 h-6 text-center text-[10px] text-muted-foreground">
                        {new Date(d.date).getDate()}
                      </div>
                    ))}
                  </div>
                  {data!.attendanceHeatmap.map((row, ri) => (
                    <div key={ri} className="flex gap-1 mb-1">
                      <div className="w-24 shrink-0 text-xs truncate py-1">{row.class}</div>
                      {row.dates.map((d, di) => (
                        <div
                          key={di}
                          className={`w-8 h-6 rounded-sm ${getHeatColor(d.rate)}`}
                          title={`${row.class} - ${d.date}: ${d.rate}%`}
                        />
                      ))}
                    </div>
                  ))}
                  <div className="flex gap-3 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-500" /> &gt;90%</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-yellow-400" /> 75-90%</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500" /> &lt;75%</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-gray-200 dark:bg-gray-700" /> No data</span>
                  </div>
                </div>
              </div>
            ) : <EmptyChart />}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top 10 Fee Defaulters</CardTitle>
            </CardHeader>
            <CardContent>
              {(data?.topDefaulters?.length ?? 0) > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" data-testid="table-defaulters">
                    <thead>
                      <tr className="border-b bg-muted/50 text-xs">
                        <th className="p-2 text-left">Student</th>
                        <th className="p-2 text-left">Class</th>
                        <th className="p-2 text-right">Outstanding</th>
                        <th className="p-2 text-center">Overdue</th>
                        <th className="p-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data!.topDefaulters.map((d, i) => (
                        <tr key={i} className={`border-b ${d.monthsOverdue > 2 ? "bg-red-50 dark:bg-red-900/20" : ""}`}>
                          <td className="p-2 font-medium">{d.studentName}</td>
                          <td className="p-2">{d.class}</td>
                          <td className="p-2 text-right font-medium">PKR {d.outstanding.toLocaleString()}</td>
                          <td className="p-2 text-center">
                            <Badge variant={d.monthsOverdue > 2 ? "destructive" : "secondary"}>
                              {d.monthsOverdue}mo
                            </Badge>
                          </td>
                          <td className="p-2 text-center">
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleSendReminder(d.studentName)} data-testid={`button-remind-${i}`}>
                              <Bell className="w-3 h-3 mr-1" />
                              Remind
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No fee defaulters found</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Activity Feed</CardTitle>
            </CardHeader>
            <CardContent>
              {(data?.recentActivity?.length ?? 0) > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {data!.recentActivity.map((a, i) => (
                    <div key={i} className="flex items-start gap-3 pb-3 border-b last:border-0">
                      <div className={`p-1.5 rounded-md ${getActivityColor(a.type)}`}>
                        {getActivityIcon(a.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{a.description}</p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">{a.timestamp}</span>
                          <Badge variant="outline" className="text-[10px] h-4">{a.branch}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No recent activity</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </SuperLayout>
  );
}

function KPICard({ icon: Icon, label, value, sub, color, iconColor, testId }: {
  icon: any; label: string; value: string; sub?: string; color: string; iconColor: string; testId: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={`p-1.5 rounded-md ${color}`}>
            <Icon className={`w-4 h-4 ${iconColor}`} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-xl font-bold mt-0.5" data-testid={testId}>{value}</p>
        {sub && (
          <p className={`text-xs mt-0.5 ${sub.startsWith("+") ? "text-emerald-600" : "text-red-500"}`}>{sub} vs last month</p>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-60 text-muted-foreground text-sm">
      No data available for the selected period
    </div>
  );
}

function getHeatColor(rate: number): string {
  if (rate < 0) return "bg-gray-200 dark:bg-gray-700";
  if (rate >= 90) return "bg-emerald-500";
  if (rate >= 75) return "bg-yellow-400";
  return "bg-red-500";
}

function getActivityColor(type: string): string {
  switch (type) {
    case "payment": return "bg-emerald-100 dark:bg-emerald-900";
    case "admission": return "bg-blue-100 dark:bg-blue-900";
    case "attendance": return "bg-amber-100 dark:bg-amber-900";
    default: return "bg-gray-100 dark:bg-gray-800";
  }
}

function getActivityIcon(type: string) {
  const cls = "w-3.5 h-3.5";
  switch (type) {
    case "payment": return <DollarSign className={`${cls} text-emerald-600`} />;
    case "admission": return <Users className={`${cls} text-blue-600`} />;
    case "attendance": return <CalendarCheck className={`${cls} text-amber-600`} />;
    default: return <TrendingUp className={`${cls} text-gray-600`} />;
  }
}
