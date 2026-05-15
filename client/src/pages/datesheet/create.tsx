import { useState } from "react";
import { useLocation } from "wouter";
import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { datesheetNavItems, useDateSheetData, classes, examTypes, subjects } from "./datesheet-data";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

interface ExamEntry {
  subject: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  invigilatorId: string;
  invigilatorName: string;
}

export default function CreateDateSheet() {
  const { addDateSheet, isPending } = useDateSheetData();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [examName, setExamName] = useState("");
  const [examType, setExamType] = useState<typeof examTypes[number]>("Term");
  const [selectedClass, setSelectedClass] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [entries, setEntries] = useState<ExamEntry[]>([]);

  const addEntry = () => {
    setEntries([...entries, { subject: "", date: "", startTime: "09:00", endTime: "11:00", room: "", invigilatorId: "", invigilatorName: "" }]);
  };

  const removeEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, field: keyof ExamEntry, value: string) => {
    const updated = [...entries];
    updated[index][field] = value;
    setEntries(updated);
  };

  const handleSubmit = async () => {
    if (!examName || !examType || !selectedClass || !startDate || !endDate) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    if (entries.length === 0) {
      toast({ title: "Error", description: "Please add at least one subject", variant: "destructive" });
      return;
    }

    try {
      await addDateSheet({
        examName,
        examType,
        class: selectedClass,
        startDate,
        endDate,
        entries: entries.map(e => ({
          subject: e.subject,
          date: e.date,
          startTime: e.startTime,
          endTime: e.endTime,
          room: e.room || "TBD",
          invigilatorId: e.invigilatorId || "",
          invigilatorName: e.invigilatorName || "TBD"
        }))
      });

      toast({ title: "Success", description: "Date sheet created successfully" });
      setLocation("/curriculum/datesheet/list");
    } catch (error) {
      console.error("Failed to create date sheet:", error);
      toast({ title: "Error", description: "Failed to create date sheet. Please try again.", variant: "destructive" });
    }
  };

  return (
    <ModuleLayout module="curriculum" navItems={datesheetNavItems}>
      <div className="space-y-6">
        <PageHeader
          title="Create Date Sheet"
          description="Create a new exam date sheet"
        />

        <Card>
          <CardHeader>
            <CardTitle>Date Sheet Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Exam Name *</Label>
                <Input 
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  placeholder="e.g., First Term Examination 2024" 
                  data-testid="input-exam-name" 
                />
              </div>
              <div className="space-y-2">
                <Label>Exam Type *</Label>
                <Select value={examType} onValueChange={(v) => setExamType(v as typeof examType)}>
                  <SelectTrigger data-testid="select-exam-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {examTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Class *</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger data-testid="select-class">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  data-testid="input-start-date" 
                />
              </div>
              <div className="space-y-2">
                <Label>End Date *</Label>
                <Input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  data-testid="input-end-date" 
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Exam Schedule</h4>
                <Button type="button" variant="outline" onClick={addEntry} data-testid="button-add-subject">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Subject
                </Button>
              </div>
              
              {entries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border rounded-md">
                  No subjects added yet. Click "Add Subject" to start.
                </div>
              ) : (
                <div className="space-y-3">
                  {entries.map((entry, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-3 p-3 border rounded-md items-end">
                      <div className="space-y-1">
                        <Label className="text-xs">Subject</Label>
                        <Select value={entry.subject} onValueChange={(v) => updateEntry(index, "subject", v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {subjects.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Date</Label>
                        <Input 
                          type="date" 
                          value={entry.date}
                          onChange={(e) => updateEntry(index, "date", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Start Time</Label>
                        <Input 
                          type="time" 
                          value={entry.startTime}
                          onChange={(e) => updateEntry(index, "startTime", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">End Time</Label>
                        <Input 
                          type="time" 
                          value={entry.endTime}
                          onChange={(e) => updateEntry(index, "endTime", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Room</Label>
                        <Input 
                          value={entry.room}
                          onChange={(e) => updateEntry(index, "room", e.target.value)}
                          placeholder="e.g., 101"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeEntry(index)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button variant="outline" onClick={() => setLocation("/curriculum/datesheet/list")} data-testid="button-cancel">Cancel</Button>
              <Button onClick={handleSubmit} disabled={isPending} data-testid="button-save">
                {isPending ? "Saving..." : "Save Date Sheet"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
}
