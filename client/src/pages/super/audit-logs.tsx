import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import SuperLayout from "./layout";
import { superFetch } from "./super-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollText, Search, AlertTriangle, Shield, User, Trash2, Edit, Plus, LogIn } from "lucide-react";

const ACTION_ICONS: Record<string, typeof Plus> = {
  create: Plus,
  update: Edit,
  delete: Trash2,
  login: LogIn,
};

const ACTION_COLORS: Record<string, string> = {
  create: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  update: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  delete: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  login: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

const SECURITY_ACTIONS = ["delete", "login_failed", "password_change", "permission_change"];

export default function AuditLogs() {
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 50;

  const { data, isLoading } = useQuery({
    queryKey: ["/api/super/audit-logs", moduleFilter, actionFilter, search, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (moduleFilter !== "all") params.set("module", moduleFilter);
      if (actionFilter !== "all") params.set("action", actionFilter);
      if (search) params.set("search", search);
      params.set("page", String(page));
      params.set("limit", String(limit));
      const res = await superFetch(`/api/super/audit-logs?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const logs = data?.logs || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const modules = ["student", "hr", "fee", "payroll", "finance", "attendance", "timetable", "datesheet", "curriculum", "pos", "library", "transport", "hostel"];

  return (
    <SuperLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-audit-title">
              <ScrollText className="w-6 h-6" /> Audit Logs
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Track all system activity across modules</p>
          </div>
          <Badge variant="outline" data-testid="text-total-logs">{total} total entries</Badge>
        </div>

        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user, entity, description..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9"
                  data-testid="input-search-logs"
                />
              </div>
              <Select value={moduleFilter} onValueChange={(v) => { setModuleFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[160px]" data-testid="select-module-filter">
                  <SelectValue placeholder="All Modules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  {modules.map(m => <SelectItem key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[140px]" data-testid="select-action-filter">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="animate-pulse flex gap-4 p-3">
                    <div className="w-8 h-8 bg-muted rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ScrollText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No audit logs found</p>
              </div>
            ) : (
              <div className="space-y-1">
                {logs.map((log: any) => {
                  const isSecurity = SECURITY_ACTIONS.includes(log.action);
                  const Icon = ACTION_ICONS[log.action] || User;
                  const colorClass = ACTION_COLORS[log.action] || "bg-gray-100 text-gray-800";
                  return (
                    <div
                      key={log.id}
                      className={`flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors ${isSecurity ? "border-l-2 border-orange-400" : ""}`}
                      data-testid={`log-entry-${log.id}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
                        {isSecurity ? <AlertTriangle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{log.description}</span>
                          {isSecurity && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Security</Badge>}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><User className="w-3 h-3" />{log.userEmail || "System"}</span>
                          <Badge variant="outline" className="text-[10px]">{log.module}</Badge>
                          {log.entityType && <span>{log.entityType}: {log.entityName || log.entityId}</span>}
                          {log.ipAddress && <span className="flex items-center gap-1"><Shield className="w-3 h-3" />{log.ipAddress}</span>}
                        </div>
                        {(log.oldValue || log.newValue) && (
                          <div className="mt-2 text-xs bg-muted/50 rounded p-2 font-mono">
                            {log.oldValue && <div className="text-red-500">- {log.oldValue.substring(0, 200)}</div>}
                            {log.newValue && <div className="text-green-500">+ {log.newValue.substring(0, 200)}</div>}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} data-testid="button-prev-page">Previous</Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} data-testid="button-next-page">Next</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SuperLayout>
  );
}
