import { useState } from "react";
import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { parentNavItems } from "./parent-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { queryClient } from "@/lib/queryClient";
import { Plus, Loader2, Mail, MailOpen, Send } from "lucide-react";

interface Message {
  id: number;
  senderId: number;
  senderRole: string;
  senderName: string;
  receiverId: number;
  receiverRole: string;
  subject: string;
  body: string;
  isRead: boolean | null;
  createdAt: string;
}

const parentAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("emblazers_token")}`,
});

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ParentMessages() {
  const { toast } = useToast();
  const [selectedMsg, setSelectedMsg] = useState<Message | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ receiverId: "", receiverRole: "teacher", subject: "", body: "", studentId: "" });

  const { data: inbox = [], isLoading: inboxLoading, refetch: refetchInbox } = useQuery<Message[]>({
    queryKey: ["/api/parent/messages/inbox"],
    queryFn: async () => {
      const res = await fetch("/api/parent/messages/inbox", { headers: parentAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch inbox");
      return res.json();
    },
  });

  const { data: sent = [], isLoading: sentLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages/sent"],
    queryFn: async () => {
      const res = await fetch("/api/messages/sent", { headers: parentAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch sent");
      return res.json();
    },
  });

  const { data: teachers = [] } = useQuery<{ id: number; name: string; designation: string }[]>({
    queryKey: ["/api/teachers/list"],
    queryFn: async () => {
      const res = await fetch("/api/teachers/list", { headers: parentAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch teachers");
      return res.json();
    },
  });

  const { data: children = [] } = useQuery<any[]>({
    queryKey: ["/api/parent/children"],
  });

  const handleSelectMessage = async (msg: Message) => {
    setSelectedMsg(msg);
    if (!msg.isRead) {
      try {
        await fetch(`/api/messages/${msg.id}/read`, { method: "PATCH", headers: parentAuthHeaders() });
        refetchInbox();
        queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
      } catch { /* non-fatal */ }
    }
  };

  const handleSend = async () => {
    if (!form.receiverId || !form.subject || !form.body) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/parent/messages/send", {
        method: "POST",
        headers: { ...parentAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: parseInt(form.receiverId),
          receiverRole: form.receiverRole,
          subject: form.subject,
          body: form.body,
          studentId: form.studentId ? parseInt(form.studentId) : undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to send");
      toast({ title: "Sent", description: "Message sent successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/parent/messages/inbox"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/sent"] });
      setComposeOpen(false);
      setForm({ receiverId: "", receiverRole: "teacher", subject: "", body: "", studentId: "" });
    } catch (err) {
      toast({ title: "Error", description: String(err), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const MessageList = ({ messages, loading }: { messages: Message[]; loading: boolean }) => (
    <div className="divide-y">
      {loading && <p className="p-4 text-muted-foreground text-sm">Loading…</p>}
      {!loading && messages.length === 0 && (
        <p className="p-6 text-center text-muted-foreground text-sm">No messages yet.</p>
      )}
      {messages.map(msg => (
        <div key={msg.id}
          className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${selectedMsg?.id === msg.id ? "bg-muted/50" : ""}`}
          onClick={() => handleSelectMessage(msg)}
          data-testid={`msg-item-${msg.id}`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {msg.isRead
                ? <MailOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                : <Mail className="w-4 h-4 text-blue-500 shrink-0" />}
              <span className={`text-sm truncate ${!msg.isRead ? "font-semibold" : "font-medium"}`}>
                {msg.senderName}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {!msg.isRead && <Badge variant="destructive" className="text-xs px-1 py-0">Unread</Badge>}
              <span className="text-xs text-muted-foreground">{timeAgo(msg.createdAt)}</span>
            </div>
          </div>
          <p className={`text-sm mt-1 truncate ${!msg.isRead ? "font-semibold" : ""}`}>{msg.subject}</p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{msg.body.substring(0, 80)}</p>
        </div>
      ))}
    </div>
  );

  return (
    <ModuleLayout module="parent" navItems={parentNavItems}>
      <PageHeader title="Messages" description="Communicate with teachers and school staff" />

      <div className="flex justify-end mb-4">
        <Button onClick={() => setComposeOpen(true)} data-testid="button-compose-message">
          <Plus className="w-4 h-4 mr-2" /> Compose Message
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <Tabs defaultValue="inbox">
            <TabsList className="w-full">
              <TabsTrigger value="inbox" className="flex-1" data-testid="tab-inbox">
                Inbox
                {inbox.filter(m => !m.isRead).length > 0 && (
                  <Badge variant="destructive" className="ml-1 text-xs px-1 py-0">
                    {inbox.filter(m => !m.isRead).length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="sent" className="flex-1" data-testid="tab-sent">Sent</TabsTrigger>
            </TabsList>
            <Card className="mt-2">
              <CardContent className="p-0 max-h-[500px] overflow-y-auto">
                <TabsContent value="inbox" className="m-0">
                  <MessageList messages={inbox} loading={inboxLoading} />
                </TabsContent>
                <TabsContent value="sent" className="m-0">
                  <MessageList messages={sent} loading={sentLoading} />
                </TabsContent>
              </CardContent>
            </Card>
          </Tabs>
        </div>

        <div className="md:col-span-2">
          {selectedMsg ? (
            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="border-b pb-3">
                  <h3 className="font-semibold text-lg" data-testid="text-message-subject">{selectedMsg.subject}</h3>
                  <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
                    <span>From: <span className="font-medium text-foreground">{selectedMsg.senderName}</span></span>
                    <span>{timeAgo(selectedMsg.createdAt)}</span>
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap leading-relaxed" data-testid="text-message-body">
                  {selectedMsg.body}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Mail className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">Select a message to read it</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Compose Message</DialogTitle>
            <DialogDescription>Send a message to a teacher or school staff member.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>To (Teacher) <span className="text-destructive">*</span></Label>
              <Select value={form.receiverId} onValueChange={v => setForm(p => ({ ...p, receiverId: v }))}>
                <SelectTrigger data-testid="select-to-teacher">
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map(t => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name} — {t.designation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {children.length > 0 && (
              <div className="space-y-2">
                <Label>Related Child (optional)</Label>
                <Select value={form.studentId} onValueChange={v => setForm(p => ({ ...p, studentId: v }))}>
                  <SelectTrigger data-testid="select-child">
                    <SelectValue placeholder="No specific child" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific child</SelectItem>
                    {children.map((c: any) => (
                      <SelectItem key={c.id || c.studentId} value={String(c.id || c.studentId)}>
                        {c.name || c.studentId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Subject <span className="text-destructive">*</span></Label>
              <Input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                placeholder="Message subject" data-testid="input-subject" />
            </div>
            <div className="space-y-2">
              <Label>Message <span className="text-destructive">*</span></Label>
              <Textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                placeholder="Type your message..." rows={4} data-testid="textarea-body" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setComposeOpen(false)} disabled={submitting}>Cancel</Button>
              <Button onClick={handleSend} disabled={submitting} data-testid="button-send-message">
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Send Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
}
