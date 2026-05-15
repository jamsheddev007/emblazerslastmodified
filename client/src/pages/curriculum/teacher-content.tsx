import { useState, useRef } from "react";
import { ModuleLayout } from "@/components/layout/module-layout";
import { teacherNavItems, useTeacherAssignments, useTeacherContent } from "./teacher-data";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FileText, ImageIcon, Link2, StickyNote, Trash2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ContentType = "pdf" | "image" | "note" | "link";
type FilterTab = "all" | "pdf" | "image" | "note" | "link";

export default function TeacherContentPage() {
  const { session } = useAuth();
  const { toast } = useToast();
  const staffId = session?.staffId || "";
  const { data: assignments = [] } = useTeacherAssignments(staffId);
  const { content, createContent, togglePublish, deleteContent, isPending } = useTeacherContent(staffId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [filterClass, setFilterClass] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    className: "",
    section: "",
    subject: "",
    title: "",
    description: "",
    contentType: "note" as ContentType,
    fileData: "",
    fileName: "",
    publishImmediately: false,
  });

  const uniqueClasses = [...new Set(assignments.map((a: any) => a.className))];
  const uniqueSubjects = [...new Set(assignments.map((a: any) => a.subject))];

  const filtered = content.filter((c: any) => {
    if (activeTab !== "all" && c.contentType !== activeTab) return false;
    if (filterClass !== "all" && c.className !== filterClass) return false;
    if (filterSubject !== "all" && c.subject !== filterSubject) return false;
    return true;
  });

  const handleAssignmentSelect = (assignmentId: string) => {
    const a = assignments.find((x: any) => x.id === assignmentId);
    if (a) setForm(f => ({ ...f, className: a.className, section: a.section, subject: a.subject }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ title: "File too large", description: "Maximum file size is 5MB", variant: "destructive" });
      e.target.value = "";
      return;
    }

    if (form.contentType === "pdf" && file.type !== "application/pdf") {
      toast({ title: "Invalid file", description: "Please select a PDF file", variant: "destructive" });
      e.target.value = "";
      return;
    }
    if (form.contentType === "image" && !["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      toast({ title: "Invalid file", description: "Please select a JPG or PNG image", variant: "destructive" });
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setForm(f => ({ ...f, fileData: base64, fileName: file.name }));
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setForm({
      className: "", section: "", subject: "", title: "", description: "",
      contentType: "note", fileData: "", fileName: "", publishImmediately: false,
    });
    if (pdfInputRef.current) pdfInputRef.current.value = "";
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!form.className || !form.title) {
      toast({ title: "Missing fields", description: "Select an assignment and provide a title", variant: "destructive" });
      return;
    }
    if ((form.contentType === "pdf" || form.contentType === "image") && !form.fileData) {
      toast({ title: "Missing file", description: `Please select a ${form.contentType === "pdf" ? "PDF" : "image"} file`, variant: "destructive" });
      return;
    }
    if (form.contentType === "link" && !form.fileData) {
      toast({ title: "Missing URL", description: "Please enter a URL", variant: "destructive" });
      return;
    }
    try {
      await createContent({
        staffId,
        teacherName: session?.name || "",
        className: form.className,
        section: form.section,
        subject: form.subject,
        title: form.title,
        description: form.description,
        contentType: form.contentType,
        fileData: form.fileData,
        fileName: form.fileName,
        isPublished: form.publishImmediately,
      });
      toast({ title: "Content created successfully" });
      setDialogOpen(false);
      resetForm();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleTogglePublish = async (item: any) => {
    try {
      await togglePublish(item.id);
      toast({ title: item.isPublished ? "Content unpublished" : "Content published" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this content?")) return;
    try {
      await deleteContent(id);
      toast({ title: "Content deleted" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const typeIcons: Record<string, any> = {
    pdf: FileText,
    image: ImageIcon,
    note: StickyNote,
    link: Link2,
  };

  const typeColors: Record<string, string> = {
    pdf: "text-red-500",
    image: "text-blue-500",
    note: "text-amber-500",
    link: "text-green-500",
  };

  return (
    <ModuleLayout module="curriculum" navItems={teacherNavItems}>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">My Content</h1>
            <p className="text-muted-foreground">Upload and manage learning materials</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} data-testid="button-add-content">
            <Plus className="w-4 h-4 mr-2" /> Add Content
          </Button>
        </div>

        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FilterTab)}>
            <TabsList data-testid="tabs-content-filter">
              <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
              <TabsTrigger value="pdf" data-testid="tab-pdf">PDF</TabsTrigger>
              <TabsTrigger value="image" data-testid="tab-images">Images</TabsTrigger>
              <TabsTrigger value="note" data-testid="tab-notes">Notes</TabsTrigger>
              <TabsTrigger value="link" data-testid="tab-links">Links</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-3 items-center flex-wrap">
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="w-[180px]" data-testid="select-filter-class">
                <SelectValue placeholder="Filter by class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {uniqueClasses.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="w-[180px]" data-testid="select-filter-subject">
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {uniqueSubjects.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No content found. Click "Add Content" to get started.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item: any) => {
              const TypeIcon = typeIcons[item.contentType] || FileText;
              const iconColor = typeColors[item.contentType] || "text-muted-foreground";
              return (
                <Card key={item.id} data-testid={`card-content-${item.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <TypeIcon className={`w-5 h-5 shrink-0 ${iconColor}`} />
                        <CardTitle className="text-base truncate">{item.title}</CardTitle>
                      </div>
                      <div
                        className="flex items-center gap-2 shrink-0 cursor-pointer"
                        onClick={() => handleTogglePublish(item)}
                        data-testid={`button-toggle-publish-${item.id}`}
                      >
                        <div className={`w-2.5 h-2.5 rounded-full ${item.isPublished ? "bg-green-500" : "bg-gray-400"}`} />
                        <span className="text-xs text-muted-foreground">
                          {item.isPublished ? "Published" : "Draft"}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1 mb-2">
                      <Badge variant="secondary" className="text-xs">{item.className}</Badge>
                      <Badge variant="secondary" className="text-xs">{item.section}</Badge>
                      <Badge variant="outline" className="text-xs">{item.subject}</Badge>
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{item.description}</p>
                    )}
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(item.id)}
                        data-testid={`button-delete-content-${item.id}`}
                      >
                        <Trash2 className="w-3 h-3 mr-1" /> Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload New Content</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Assignment (Class/Section/Subject)</Label>
                <Select onValueChange={handleAssignmentSelect}>
                  <SelectTrigger data-testid="select-assignment">
                    <SelectValue placeholder="Select assignment" />
                  </SelectTrigger>
                  <SelectContent>
                    {assignments.map((a: any) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.className} - {a.section} ({a.subject})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Content title"
                  data-testid="input-content-title"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Description (optional)"
                  data-testid="input-content-description"
                />
              </div>

              <div className="space-y-2">
                <Label>Content Type</Label>
                <Tabs
                  value={form.contentType}
                  onValueChange={(v) => setForm(f => ({ ...f, contentType: v as ContentType, fileData: "", fileName: "" }))}
                >
                  <TabsList className="w-full" data-testid="tabs-content-type">
                    <TabsTrigger value="pdf" className="flex-1" data-testid="tab-type-pdf">
                      <FileText className="w-4 h-4 mr-1" /> PDF
                    </TabsTrigger>
                    <TabsTrigger value="image" className="flex-1" data-testid="tab-type-image">
                      <ImageIcon className="w-4 h-4 mr-1" /> Image
                    </TabsTrigger>
                    <TabsTrigger value="note" className="flex-1" data-testid="tab-type-note">
                      <StickyNote className="w-4 h-4 mr-1" /> Note
                    </TabsTrigger>
                    <TabsTrigger value="link" className="flex-1" data-testid="tab-type-link">
                      <Link2 className="w-4 h-4 mr-1" /> Link
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {form.contentType === "pdf" && (
                <div className="space-y-2">
                  <Label>PDF File</Label>
                  <Input
                    ref={pdfInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    data-testid="input-file-pdf"
                  />
                  {form.fileName && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Upload className="w-3 h-3" /> {form.fileName}
                    </p>
                  )}
                </div>
              )}

              {form.contentType === "image" && (
                <div className="space-y-2">
                  <Label>Image File</Label>
                  <Input
                    ref={imageInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    data-testid="input-file-image"
                  />
                  {form.fileName && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Upload className="w-3 h-3" /> {form.fileName}
                    </p>
                  )}
                </div>
              )}

              {form.contentType === "note" && (
                <div className="space-y-2">
                  <Label>Note Content</Label>
                  <Textarea
                    value={form.fileData}
                    onChange={e => setForm(f => ({ ...f, fileData: e.target.value }))}
                    placeholder="Write your notes here..."
                    rows={6}
                    data-testid="input-content-note"
                  />
                </div>
              )}

              {form.contentType === "link" && (
                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input
                    value={form.fileData}
                    onChange={e => setForm(f => ({ ...f, fileData: e.target.value }))}
                    placeholder="https://..."
                    data-testid="input-content-url"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label htmlFor="publish-toggle">Publish immediately</Label>
                <Switch
                  id="publish-toggle"
                  checked={form.publishImmediately}
                  onCheckedChange={(checked) => setForm(f => ({ ...f, publishImmediately: checked }))}
                  data-testid="switch-publish-immediately"
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isPending}
                className="w-full"
                data-testid="button-submit-content"
              >
                {isPending ? "Saving..." : "Save Content"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ModuleLayout>
  );
}
