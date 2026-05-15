import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ModuleLayout } from "@/components/layout/module-layout";
import { curriculumNavItems } from "./curriculum-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare, Send, Loader2, Inbox, User, Search, RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const adminAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("emblazers_token")}`,
});

function useInboxConversations() {
  return useQuery<any[]>({
    queryKey: ["/api/curriculum/parent-inbox"],
    queryFn: async () => {
      const res = await fetch("/api/curriculum/parent-inbox", { headers: adminAuthHeaders() });
      if (!res.ok) throw new Error("Failed to load inbox");
      return res.json();
    },
    refetchInterval: 15000,
  });
}

function useConversationMessages(studentId: string | null) {
  return useQuery<any[]>({
    queryKey: ["/api/curriculum/parent-inbox", studentId],
    queryFn: async () => {
      const res = await fetch(`/api/curriculum/parent-inbox/${studentId}`, { headers: adminAuthHeaders() });
      if (!res.ok) throw new Error("Failed to load messages");
      return res.json();
    },
    enabled: !!studentId,
    refetchInterval: 10000,
  });
}

function useReplyMessage() {
  return useMutation({
    mutationFn: async ({ studentId, message }: { studentId: string; message: string }) => {
      const res = await apiRequest("POST", "/api/curriculum/parent-inbox/reply", { studentId, message });
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/curriculum/parent-inbox", variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/curriculum/parent-inbox"] });
    },
  });
}

export default function CurriculumParentInbox() {
  const { toast } = useToast();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [], isLoading: convsLoading, refetch: refetchConvs } = useInboxConversations();
  const { data: messages = [], isLoading: msgsLoading } = useConversationMessages(selectedStudentId);
  const replyMutation = useReplyMessage();

  const selectedConv = conversations.find((c: any) => c.studentId === selectedStudentId);

  const filteredConvs = conversations.filter((c: any) =>
    !search ||
    c.studentName?.toLowerCase().includes(search.toLowerCase()) ||
    c.parentName?.toLowerCase().includes(search.toLowerCase()) ||
    c.studentId?.toLowerCase().includes(search.toLowerCase())
  );

  const totalUnread = conversations.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (selectedStudentId) {
      queryClient.invalidateQueries({ queryKey: ["/api/curriculum/parent-inbox"] });
    }
  }, [selectedStudentId]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedStudentId) return;
    try {
      await replyMutation.mutateAsync({ studentId: selectedStudentId, message: replyText.trim() });
      setReplyText("");
    } catch {
      toast({ title: "Failed to send reply", variant: "destructive" });
    }
  };

  const timeAgo = (dateStr: string) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  return (
    <ModuleLayout module="curriculum" navItems={curriculumNavItems}>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Parent Inbox</h1>
            {totalUnread > 0 && (
              <Badge className="bg-red-500 hover:bg-red-600 text-white px-2 py-0.5" data-testid="badge-unread-total">
                {totalUnread} unread
              </Badge>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={() => refetchConvs()} data-testid="button-refresh-inbox">
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)] min-h-[500px]">

          {/* LEFT — Conversation List */}
          <div className="lg:col-span-1 flex flex-col border rounded-xl overflow-hidden bg-background">
            <div className="p-3 border-b bg-muted/40">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by student or parent..."
                  className="pl-9 h-9 text-sm"
                  data-testid="input-search-conversations"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {convsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredConvs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
                  <Inbox className="w-10 h-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {search ? "No conversations match your search" : "No messages yet. Parent messages will appear here."}
                  </p>
                </div>
              ) : (
                filteredConvs.map((conv: any) => (
                  <button
                    key={conv.studentId}
                    onClick={() => setSelectedStudentId(conv.studentId)}
                    className={`w-full text-left px-4 py-3 border-b transition-colors flex items-start gap-3 ${
                      selectedStudentId === conv.studentId
                        ? "bg-violet-50 dark:bg-violet-950 border-l-4 border-l-violet-500"
                        : "hover:bg-muted/50"
                    }`}
                    data-testid={`button-conv-${conv.studentId}`}
                  >
                    <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="font-semibold text-sm truncate">{conv.studentName}</p>
                        <span className="text-xs text-muted-foreground shrink-0">{timeAgo(conv.lastMessageAt)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{conv.parentName}</p>
                      <p className={`text-xs mt-1 truncate ${conv.unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                        {conv.lastSenderRole === "school" ? "You: " : ""}{conv.lastMessage}
                      </p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <Badge className="bg-red-500 hover:bg-red-500 text-white text-xs px-1.5 py-0.5 shrink-0" data-testid={`badge-unread-${conv.studentId}`}>
                        {conv.unreadCount}
                      </Badge>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* RIGHT — Chat Panel */}
          <div className="lg:col-span-2 flex flex-col border rounded-xl overflow-hidden bg-background">
            {!selectedStudentId ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
                <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-violet-500" />
                </div>
                <div>
                  <p className="font-semibold text-lg">Select a conversation</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Choose a parent conversation on the left to view and reply to messages
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="px-5 py-3 border-b bg-muted/40 flex items-center gap-3 shrink-0">
                  <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center">
                    <User className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{selectedConv?.studentName}</p>
                    <p className="text-xs text-muted-foreground">
                      Parent: {selectedConv?.parentName}
                      {selectedConv?.parentCnic && <span className="ml-2">· CNIC: {selectedConv.parentCnic}</span>}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {msgsLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                      No messages in this conversation
                    </div>
                  ) : (
                    messages.map((msg: any) => {
                      const isSchool = msg.senderRole === "school";
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isSchool ? "justify-end" : "justify-start"}`}
                          data-testid={`msg-${msg.id}`}
                        >
                          {!isSchool && (
                            <div className="w-7 h-7 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center shrink-0 mr-2 mt-1">
                              <User className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                            </div>
                          )}
                          <div className={`max-w-[72%] space-y-1`}>
                            <div className={`rounded-2xl px-4 py-2.5 ${
                              isSchool
                                ? "bg-violet-600 text-white rounded-tr-sm"
                                : "bg-muted text-foreground rounded-tl-sm"
                            }`}>
                              <p className="text-sm leading-relaxed">{msg.message}</p>
                            </div>
                            <p className={`text-xs text-muted-foreground ${isSchool ? "text-right" : "text-left"}`}>
                              {isSchool ? "School Admin" : selectedConv?.parentName} · {timeAgo(msg.createdAt)}
                            </p>
                          </div>
                          {isSchool && (
                            <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center shrink-0 ml-2 mt-1">
                              <MessageSquare className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Input */}
                <div className="p-4 border-t bg-background shrink-0">
                  <form onSubmit={handleReply} className="flex gap-2">
                    <Input
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Reply to ${selectedConv?.parentName}...`}
                      disabled={replyMutation.isPending}
                      className="flex-1"
                      data-testid="input-reply"
                    />
                    <Button
                      type="submit"
                      disabled={!replyText.trim() || replyMutation.isPending}
                      className="bg-violet-600 hover:bg-violet-700 shrink-0"
                      data-testid="button-send-reply"
                    >
                      {replyMutation.isPending
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Send className="w-4 h-4" />
                      }
                    </Button>
                  </form>
                  <p className="text-xs text-muted-foreground mt-2">
                    Your reply will appear in the parent's Messages section in real time.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </ModuleLayout>
  );
}
