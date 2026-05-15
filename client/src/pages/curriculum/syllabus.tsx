import { useState } from "react";
import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { curriculumNavItems, useCurriculumData, classes, subjects, topicStatuses } from "./curriculum-data";
import { CheckCircle2, Circle, Clock, Plus, Trash2, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type InsertCurriculum } from "@shared/schema";

type TopicEntry = { topic: string; status: "Not Started" | "In Progress" | "Completed" };

export default function Syllabus() {
  const { curriculum, teachers, addCurriculum, isPending } = useCurriculumData();
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState("Class 5");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<{
    class: string;
    subject: string;
    topics: TopicEntry[];
    assignedTeachers: string[]; // Array of teacher IDs
  }>({
    class: "",
    subject: "",
    topics: [{ topic: "", status: "Not Started" }],
    assignedTeachers: [],
  });

  const filteredCurriculum = curriculum.filter((c) => c.class === selectedClass);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "In Progress":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Circle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const resetForm = () => {
    setFormData({ class: "", subject: "", topics: [{ topic: "", status: "Not Started" }], assignedTeachers: [] });
  };

  const handleAddTopic = () => {
    setFormData((prev) => ({
      ...prev,
      topics: [...prev.topics, { topic: "", status: "Not Started" }],
    }));
  };

  const handleRemoveTopic = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      topics: prev.topics.filter((_, i) => i !== index),
    }));
  };

  const handleTopicChange = (index: number, field: "topic" | "status", value: string) => {
    setFormData((prev) => ({
      ...prev,
      topics: prev.topics.map((t, i) =>
        i === index ? { ...t, [field]: value } : t
      ),
    }));
  };

  const handleTeacherToggle = (teacherId: string) => {
    setFormData((prev) => ({
      ...prev,
      assignedTeachers: prev.assignedTeachers.includes(teacherId)
        ? prev.assignedTeachers.filter(id => id !== teacherId)
        : [...prev.assignedTeachers, teacherId]
    }));
  };

  const handleSave = async () => {
    if (!formData.class || !formData.subject) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    const validTopics = formData.topics.filter((t) => t.topic.trim());
    if (validTopics.length === 0) {
      toast({ title: "Error", description: "Please add at least one topic", variant: "destructive" });
      return;
    }
    try {
      const data: InsertCurriculum = {
        class: formData.class,
        subject: formData.subject,
        topics: validTopics.map((t) => ({ topic: t.topic, status: t.status })),
        assignedTeachers: formData.assignedTeachers.map(teacherId => {
          const teacher = teachers.find(t => t.id === teacherId);
          return {
            teacherId,
            teacherName: teacher?.name || "Unknown",
            assignedAt: new Date().toISOString()
          };
        })
      };
      await addCurriculum(data);
      toast({ title: "Success", description: "Curriculum saved successfully" });
      setDialogOpen(false);
      resetForm();
    } catch {
      toast({ title: "Error", description: "Failed to save curriculum", variant: "destructive" });
    }
  };

  return (
    <ModuleLayout module="curriculum" navItems={curriculumNavItems}>
      <div className="space-y-6">
        <PageHeader
          title="Curriculum"
          description="View and track syllabus progress"
          actions={
            <Button onClick={() => setDialogOpen(true)} data-testid="button-add-curriculum">
              <Plus className="w-4 h-4 mr-2" />
              Add Curriculum
            </Button>
          }
        />

        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="w-[180px]" data-testid="select-class">
            <SelectValue placeholder="Select Class" />
          </SelectTrigger>
          <SelectContent>
            {classes.map((cls) => (
              <SelectItem key={cls} value={cls}>{cls}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCurriculum.map((item) => {
            const completed = item.topics.filter((t) => t.status === "Completed").length;
            const total = item.topics.length;
            const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <Card key={item.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-4">
                    <CardTitle className="text-lg">{item.subject}</CardTitle>
                    <Badge variant="outline">{progress}% Complete</Badge>
                  </div>
                  <Progress value={progress} className="h-2 mt-2" />
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {item.topics.map((topic, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        {getStatusIcon(topic.status)}
                        <span className={topic.status === "Completed" ? "line-through text-muted-foreground" : ""}>
                          {topic.topic}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Display Assigned Teachers */}
                  {item.assignedTeachers && item.assignedTeachers.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground font-medium">Teachers:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {item.assignedTeachers.map((teacher, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {teacher.teacherName}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredCurriculum.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No curriculum data found for {selectedClass}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Curriculum</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Class *</Label>
                <Select value={formData.class} onValueChange={(v) => setFormData({ ...formData, class: v })}>
                  <SelectTrigger data-testid="select-curriculum-class">
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subject *</Label>
                <Select value={formData.subject} onValueChange={(v) => setFormData({ ...formData, subject: v })}>
                  <SelectTrigger data-testid="select-curriculum-subject">
                    <SelectValue placeholder="Select Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((sub) => (
                      <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Topics</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddTopic}>
                  <Plus className="w-4 h-4 mr-1" /> Add Topic
                </Button>
              </div>
              <div className="space-y-2">
                {formData.topics.map((topic, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      placeholder="Topic name"
                      value={topic.topic}
                      onChange={(e) => handleTopicChange(idx, "topic", e.target.value)}
                      data-testid={`input-topic-${idx}`}
                    />
                    <Select value={topic.status} onValueChange={(v) => handleTopicChange(idx, "status", v)}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {topicStatuses.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.topics.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveTopic(idx)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Teacher Assignment Section */}
            <div className="space-y-2 pt-4 border-t">
              <Label>Assign Teachers (Optional)</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Select teachers from HR module who will teach this subject
              </p>
              {teachers.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                  {teachers.map((teacher) => (
                    <div key={teacher.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`teacher-${teacher.id}`}
                        checked={formData.assignedTeachers.includes(teacher.id)}
                        onCheckedChange={() => handleTeacherToggle(teacher.id)}
                      />
                      <label
                        htmlFor={`teacher-${teacher.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      >
                        {teacher.name}
                        <span className="text-xs text-muted-foreground ml-2">
                          ({teacher.designation})
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground border rounded-md p-4 text-center">
                  No teachers found in HR module. Please add teachers first.
                </div>
              )}
              {formData.assignedTeachers.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Selected: {formData.assignedTeachers.length} teacher(s)
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isPending} data-testid="button-save-curriculum">
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
}
