import { useState } from "react";
import { ModuleLayout } from "@/components/layout/module-layout";
import { studentNavItems, useStudentContent } from "./student-data";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Image as ImageIcon, StickyNote, Link2, ExternalLink, Clock, User } from "lucide-react";

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

const typeIcons: Record<string, any> = { pdf: FileText, image: ImageIcon, note: StickyNote, link: Link2 };
const typeLabels: Record<string, string> = { pdf: "PDF", image: "Image", note: "Note", link: "Link" };

export default function StudentContentPage() {
  const { session } = useAuth();
  const className = session?.className || "";
  const section = session?.section || "";
  const { data, isLoading } = useStudentContent();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedContent, setSelectedContent] = useState<any>(null);

  const contentMap: Record<string, any[]> = data?.content || {};
  const subjects = Object.keys(contentMap);
  const filteredContent = activeTab === "all"
    ? subjects.flatMap(s => contentMap[s])
    : contentMap[activeTab] || [];

  const handleViewContent = (item: any) => {
    if (item.contentType === "link" && item.fileData) {
      window.open(item.fileData, "_blank", "noopener,noreferrer");
      return;
    }
    setSelectedContent(item);
  };

  return (
    <ModuleLayout module="curriculum" navItems={studentNavItems}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Study Material</h1>
          <p className="text-muted-foreground">
            Browse learning content for {className} - {section} ({data?.total || 0} items)
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList data-testid="tabs-subject-filter">
            <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
            {subjects.map(s => (
              <TabsTrigger key={s} value={s} data-testid={`tab-${s.toLowerCase()}`}>{s}</TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-48 rounded-md bg-muted animate-pulse" />
                ))}
              </div>
            ) : filteredContent.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No study material available yet.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredContent.map((item: any) => {
                  const TypeIcon = typeIcons[item.contentType] || FileText;
                  return (
                    <Card key={item.id || item._id} data-testid={`card-content-${item.id || item._id}`}>
                      <CardHeader className="pb-2 flex flex-row items-start gap-3">
                        <div className="rounded-md bg-muted p-2">
                          <TypeIcon className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base leading-tight truncate">{item.title}</CardTitle>
                          {item.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline">{item.subject}</Badge>
                          <Badge variant="secondary">{typeLabels[item.contentType] || item.contentType}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {item.teacherName}
                          </span>
                          {(item.createdAt || item.uploadedAt) && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {timeAgo(item.createdAt || item.uploadedAt)}
                            </span>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => handleViewContent(item)}
                          data-testid={`button-view-content-${item.id || item._id}`}
                        >
                          {item.contentType === "link" ? (
                            <><ExternalLink className="w-4 h-4 mr-2" /> Open Link</>
                          ) : (
                            "View Content"
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={!!selectedContent} onOpenChange={() => setSelectedContent(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            {selectedContent && (
              <>
                <DialogHeader>
                  <DialogTitle data-testid="text-content-modal-title">{selectedContent.title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline">{selectedContent.subject}</Badge>
                    <Badge variant="secondary">{typeLabels[selectedContent.contentType]}</Badge>
                    <Badge variant="secondary">By {selectedContent.teacherName}</Badge>
                  </div>
                  {selectedContent.description && (
                    <p className="text-sm text-muted-foreground">{selectedContent.description}</p>
                  )}

                  {selectedContent.contentType === "pdf" && selectedContent.fileData && (
                    <iframe
                      src={`data:application/pdf;base64,${selectedContent.fileData}`}
                      className="w-full h-[70vh] rounded-md border"
                      title={selectedContent.title}
                      data-testid="viewer-pdf"
                    />
                  )}

                  {selectedContent.contentType === "image" && selectedContent.fileData && (
                    <div className="flex items-center justify-center bg-muted rounded-md p-4">
                      <img
                        src={selectedContent.fileData}
                        alt={selectedContent.title}
                        className="max-w-full max-h-[70vh] rounded-md object-contain"
                        data-testid="viewer-image"
                      />
                    </div>
                  )}

                  {selectedContent.contentType === "note" && selectedContent.fileData && (
                    <div
                      className="p-4 bg-muted rounded-md whitespace-pre-wrap text-sm leading-relaxed"
                      data-testid="viewer-note"
                    >
                      {selectedContent.fileData}
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ModuleLayout>
  );
}
