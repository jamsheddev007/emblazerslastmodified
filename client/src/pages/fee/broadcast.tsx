import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ModuleLayout } from "@/components/layout/module-layout";
import { feeNavItems } from "./fee-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Send, Users, Bell, AlertTriangle, Megaphone, History, RefreshCw, CheckCircle2, ChevronRight } from "lucide-react";
import { classOptions } from "./fee-data";

const sectionOptions = ["A", "B", "C", "D", "E", "F"];

const notificationTypes = [
  { value: "fee_reminder", label: "Fee Reminder", color: "bg-orange-100 text-orange-800", icon: AlertTriangle },
  { value: "payment_due", label: "Payment Due", color: "bg-yellow-100 text-yellow-800", icon: AlertTriangle },
  { value: "custom_fee_notice", label: "Custom Fee Notice", color: "bg-blue-100 text-blue-800", icon: Megaphone },
];

const audienceOptions = [
  { value: "all", label: "All Parents", description: "Every active student's parent" },
  { value: "class", label: "By Class / Section", description: "Select a specific class or section" },
  { value: "defaulters", label: "Defaulters Only", description: "Parents of students with unpaid or partial fees" },
];

interface PreviewData { students: number; parents: number }
interface BroadcastResult { sent: number; students: number; message: string }

export default function FeeBroadcast() {
  const { toast } = useToast();

  const [notifType, setNotifType] = useState("fee_reminder");
  const [audience, setAudience] = useState("all");
  const [targetClass, setTargetClass] = useState("");
  const [targetSection, setTargetSection] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: history = [], isLoading: historyLoading, refetch: refetchHistory } = useQuery<any[]>({
    queryKey: ["/api/notifications/fee-broadcast-history"],
  });

  const previewMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/notifications/fee-broadcast-preview", {
      targetAll: audience === "all" || undefined,
      targetClass: audience === "class" ? targetClass : undefined,
      targetSection: audience === "class" && targetSection ? targetSection : undefined,
      targetDefaulters: audience === "defaulters" || undefined,
    }).then(r => r.json() as Promise<PreviewData>),
    onSuccess: (data) => { setPreview(data); },
    onError: () => toast({ title: "Preview failed", variant: "destructive" }),
  });

  const sendMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/notifications/fee-broadcast", {
      type: notifType,
      title: title.trim(),
      message: message.trim(),
      targetAll: audience === "all" || undefined,
      targetClass: audience === "class" ? targetClass : undefined,
      targetSection: audience === "class" && targetSection ? targetSection : undefined,
      targetDefaulters: audience === "defaulters" || undefined,
    }).then(r => r.json() as Promise<BroadcastResult>),
    onSuccess: (data) => {
      toast({ title: "Broadcast Sent!", description: data.message });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/fee-broadcast-history"] });
      setTitle("");
      setMessage("");
      setPreview(null);
      setConfirmOpen(false);
    },
    onError: async (err: any) => {
      setConfirmOpen(false);
      const body = err?.response ? await err.response.json().catch(() => ({})) : {};
      toast({ title: "Send Failed", description: body?.error || "Could not send broadcast", variant: "destructive" });
    },
  });

  function handlePreview() {
    if (audience === "class" && !targetClass) {
      toast({ title: "Select a class", description: "Please select a class first", variant: "destructive" });
      return;
    }
    previewMutation.mutate();
  }

  function handleSend() {
    if (!title.trim()) { toast({ title: "Title required", variant: "destructive" }); return; }
    if (!message.trim()) { toast({ title: "Message required", variant: "destructive" }); return; }
    if (audience === "class" && !targetClass) { toast({ title: "Select a class", variant: "destructive" }); return; }
    if (!preview) {
      toast({ title: "Preview first", description: "Click 'Check Audience' to see how many parents will receive this", variant: "destructive" });
      return;
    }
    if (preview.parents === 0) {
      toast({ title: "No parents found", description: "Change your audience selection", variant: "destructive" });
      return;
    }
    setConfirmOpen(true);
  }

  const selectedType = notificationTypes.find(t => t.value === notifType);

  return (
    <ModuleLayout module="fee" navItems={feeNavItems}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Broadcast Notification</h1>
          <p className="text-muted-foreground">Send notifications to multiple parents at once</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Compose */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Send className="w-4 h-4 text-[#0D7377]" />
                  Compose Broadcast
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Notification Type */}
                <div className="space-y-2">
                  <Label>Notification Type</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {notificationTypes.map(t => (
                      <button
                        key={t.value}
                        onClick={() => setNotifType(t.value)}
                        data-testid={`button-type-${t.value}`}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                          notifType === t.value
                            ? "border-[#0D7377] bg-[#0D7377]/10 text-[#0D7377]"
                            : "border-border hover:border-[#0D7377]/50 text-muted-foreground"
                        }`}
                      >
                        <t.icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Audience */}
                <div className="space-y-3">
                  <Label>Target Audience</Label>
                  <div className="space-y-2">
                    {audienceOptions.map(opt => (
                      <label
                        key={opt.value}
                        data-testid={`radio-audience-${opt.value}`}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          audience === opt.value
                            ? "border-[#0D7377] bg-[#0D7377]/5"
                            : "border-border hover:border-[#0D7377]/40"
                        }`}
                      >
                        <input
                          type="radio"
                          name="audience"
                          value={opt.value}
                          checked={audience === opt.value}
                          onChange={() => { setAudience(opt.value); setPreview(null); }}
                          className="mt-0.5 accent-[#0D7377]"
                        />
                        <div>
                          <div className="text-sm font-medium">{opt.label}</div>
                          <div className="text-xs text-muted-foreground">{opt.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {audience === "class" && (
                    <div className="flex gap-3 mt-2 pl-1">
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">Class</Label>
                        <Select value={targetClass} onValueChange={v => { setTargetClass(v); setPreview(null); }}>
                          <SelectTrigger data-testid="select-target-class">
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                          <SelectContent>
                            {classOptions.map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">Section <span className="text-muted-foreground">(optional)</span></Label>
                        <Select value={targetSection} onValueChange={v => { setTargetSection(v === "all" ? "" : v); setPreview(null); }}>
                          <SelectTrigger data-testid="select-target-section">
                            <SelectValue placeholder="All sections" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Sections</SelectItem>
                            {sectionOptions.map(s => <SelectItem key={s} value={s}>Section {s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Message */}
                <div className="space-y-2">
                  <Label htmlFor="broadcast-title">Title</Label>
                  <Input
                    id="broadcast-title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Fee Due Reminder – January 2026"
                    maxLength={100}
                    data-testid="input-title"
                  />
                  <p className="text-xs text-muted-foreground text-right">{title.length}/100</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="broadcast-message">Message</Label>
                  <Textarea
                    id="broadcast-message"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Write the full message parents will see in their notification bell..."
                    rows={4}
                    maxLength={500}
                    data-testid="input-message"
                  />
                  <p className="text-xs text-muted-foreground text-right">{message.length}/500</p>
                </div>

                {/* Preview + Send */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-1">
                  <Button
                    variant="outline"
                    onClick={handlePreview}
                    disabled={previewMutation.isPending}
                    data-testid="button-preview"
                    className="gap-2"
                  >
                    <Users className="w-4 h-4" />
                    {previewMutation.isPending ? "Checking..." : "Check Audience"}
                  </Button>

                  {preview && (
                    <div className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-full font-medium ${
                      preview.parents > 0
                        ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400"
                    }`} data-testid="text-preview-result">
                      <Users className="w-3.5 h-3.5" />
                      {preview.parents > 0
                        ? `${preview.parents} parent(s) · ${preview.students} student(s)`
                        : "No parents found"}
                    </div>
                  )}

                  <div className="sm:ml-auto">
                    <Button
                      onClick={handleSend}
                      disabled={sendMutation.isPending || !title.trim() || !message.trim()}
                      data-testid="button-send"
                      className="gap-2 bg-[#0D7377] hover:bg-[#0a5c5f] text-white"
                    >
                      <Send className="w-4 h-4" />
                      Send Broadcast
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Tips + History */}
          <div className="space-y-4">
            {/* Preview card */}
            {(title || message) && (
              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Parent Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selectedType && (
                    <Badge className={`${selectedType.color} border-0 text-xs`}>{selectedType.label}</Badge>
                  )}
                  <p className="text-sm font-semibold">{title || "Your title here"}</p>
                  <p className="text-xs text-muted-foreground">{message || "Your message here..."}</p>
                </CardContent>
              </Card>
            )}

            {/* Tips */}
            <Card className="bg-muted/40">
              <CardContent className="pt-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">How it works</p>
                {[
                  "Select who receives the notification",
                  "Write a clear title and message",
                  "Click 'Check Audience' to see the count",
                  "Send — parents see it in their notification bell",
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <div className="w-4 h-4 rounded-full bg-[#0D7377]/15 text-[#0D7377] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</div>
                    {tip}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Broadcast History */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="w-4 h-4 text-[#0D7377]" />
                Broadcast History
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => refetchHistory()} data-testid="button-refresh-history" className="gap-1 text-xs">
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />)}
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No broadcasts sent yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((item: any) => (
                  <div
                    key={item.id}
                    data-testid={`row-history-${item.id}`}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title.replace("Broadcast Sent: ", "")}</p>
                      <p className="text-xs text-muted-foreground">{item.message}</p>
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0">
                      {new Date(item.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirm Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Broadcast</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>You are about to send a notification to <strong>{preview?.parents ?? 0} parent(s)</strong> for <strong>{preview?.students ?? 0} student(s)</strong>.</p>
                <div className="rounded-lg border p-3 bg-muted/40 space-y-1">
                  {selectedType && <Badge className={`${selectedType.color} border-0 text-xs`}>{selectedType.label}</Badge>}
                  <p className="text-sm font-semibold mt-1">{title}</p>
                  <p className="text-xs text-muted-foreground">{message}</p>
                </div>
                <p className="text-xs text-muted-foreground">This cannot be undone. Parents will see this in their notification bell immediately.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sendMutation.isPending} data-testid="button-confirm-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => sendMutation.mutate()}
              disabled={sendMutation.isPending}
              data-testid="button-confirm-send"
              className="bg-[#0D7377] hover:bg-[#0a5c5f]"
            >
              {sendMutation.isPending ? "Sending..." : `Send to ${preview?.parents ?? 0} Parents`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ModuleLayout>
  );
}
