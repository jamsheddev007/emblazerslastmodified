import { useState } from "react";
import { useLocation } from "wouter";
import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTimetableData, classes, sections, days, periods, subjects, useAssignedTeachers } from "./timetable-data";
import { curriculumNavItems } from "@/pages/curriculum/curriculum-data";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

interface TimetableSlot {
  day: string;
  period: number;
  subject: string;
  teacherId: string;
  teacherName: string;
  startTime: string;
  endTime: string;
}

export default function CreateTimetable() {
  const { addTimetable, isPending } = useTimetableData();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [slots, setSlots] = useState<TimetableSlot[]>([]);

  const { teachers: assignedTeachers, isLoading: teachersLoading } = useAssignedTeachers(selectedClass, selectedSection);

  const addSlot = () => {
    setSlots([...slots, {
      day: "Monday",
      period: 1,
      subject: "",
      teacherId: "",
      teacherName: "",
      startTime: "",
      endTime: ""
    }]);
  };

  const removeSlot = (index: number) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, field: keyof TimetableSlot, value: string | number) => {
    const updated = [...slots];
    if (field === "teacherId") {
      const teacher = assignedTeachers.find(t => t.id === value);
      updated[index].teacherId = value as string;
      updated[index].teacherName = teacher?.name || "";
    } else {
      (updated[index] as any)[field] = value;
    }
    setSlots(updated);
  };

  // Check if two time ranges overlap
  const timeRangesOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
    if (!start1 || !end1 || !start2 || !end2) return false;
    return start1 < end2 && start2 < end1;
  };

  // Detect conflicts in the current slots
  const detectConflicts = (): string | null => {
    for (let i = 0; i < slots.length; i++) {
      const slot1 = slots[i];

      // Skip if slot doesn't have complete time info
      if (!slot1.startTime || !slot1.endTime || !slot1.teacherId) continue;

      // Validate that end time is after start time
      if (slot1.startTime >= slot1.endTime) {
        return `Period ${i + 1}: End time must be after start time`;
      }

      for (let j = i + 1; j < slots.length; j++) {
        const slot2 = slots[j];

        // Skip if slot doesn't have complete time info
        if (!slot2.startTime || !slot2.endTime || !slot2.teacherId) continue;

        // Only check conflicts on the same day
        if (slot1.day !== slot2.day) continue;

        const timesOverlap = timeRangesOverlap(
          slot1.startTime,
          slot1.endTime,
          slot2.startTime,
          slot2.endTime
        );

        if (timesOverlap) {
          // Check teacher conflict
          if (slot1.teacherId === slot2.teacherId) {
            return `Teacher "${slot1.teacherName}" is assigned to overlapping time slots on ${slot1.day}: ${slot1.startTime}-${slot1.endTime} and ${slot2.startTime}-${slot2.endTime}`;
          }

          // Check class/section conflict (same class-section can't have two periods at same time)
          return `${selectedClass} ${selectedSection} has overlapping periods on ${slot1.day}: ${slot1.startTime}-${slot1.endTime} (${slot1.subject}) and ${slot2.startTime}-${slot2.endTime} (${slot2.subject})`;
        }
      }
    }
    return null;
  };

  const handleSubmit = async () => {
    if (!selectedClass || !selectedSection) {
      toast({ title: "Error", description: "Please select class and section", variant: "destructive" });
      return;
    }

    if (slots.length === 0) {
      toast({ title: "Error", description: "Please add at least one period", variant: "destructive" });
      return;
    }

    const incompleteSlots = slots.some(s => !s.subject || !s.teacherId || !s.startTime || !s.endTime);
    if (incompleteSlots) {
      toast({ title: "Error", description: "Please complete all slot details including time selection", variant: "destructive" });
      return;
    }

    // Check for time conflicts
    const conflict = detectConflicts();
    if (conflict) {
      toast({
        title: "Time Conflict Detected",
        description: conflict,
        variant: "destructive",
        duration: 6000
      });
      return;
    }

    try {
      await addTimetable({
        class: selectedClass,
        section: selectedSection,
        slots: slots.map(s => ({
          day: s.day,
          period: s.period,
          subject: s.subject,
          teacherId: s.teacherId,
          teacherName: s.teacherName,
          startTime: s.startTime,
          endTime: s.endTime
        })),
        updatedAt: new Date().toISOString()
      });

      toast({
        title: "Success",
        description: `Timetable periods saved successfully for ${selectedClass} - Section ${selectedSection}`
      });
      setLocation("/curriculum/timetable/class");
    } catch (error) {
      console.error("Failed to create timetable:", error);
      toast({ title: "Error", description: "Failed to save timetable. Please try again.", variant: "destructive" });
    }
  };

  return (
    <ModuleLayout module="curriculum" navItems={curriculumNavItems}>
      <div className="space-y-6">
        <PageHeader
          title="Create Timetable"
          description="Add or update periods for a class timetable"
        />

        <Card>
          <CardHeader>
            <CardTitle>Timetable Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label>Section *</Label>
                <Select value={selectedSection} onValueChange={setSelectedSection}>
                  <SelectTrigger data-testid="select-section">
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((sec) => (
                      <SelectItem key={sec} value={sec}>{sec}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Timetable Slots</h4>
                <Button type="button" variant="outline" onClick={addSlot} data-testid="button-add-slot">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Period
                </Button>
              </div>

              {slots.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border rounded-md">
                  No periods added yet. Click "Add Period" to start.
                </div>
              ) : (
                <div className="space-y-3">
                  {slots.map((slot, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-7 gap-3 p-3 border rounded-md items-end">
                      <div className="space-y-1">
                        <Label className="text-xs">Day</Label>
                        <Select value={slot.day} onValueChange={(v) => updateSlot(index, "day", v)}>
                          <SelectTrigger data-testid={`select-day-${index}`}>
                            <SelectValue placeholder="Day" />
                          </SelectTrigger>
                          <SelectContent>
                            {days.map((d) => (
                              <SelectItem key={d} value={d}>{d}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Period</Label>
                        <Select value={String(slot.period)} onValueChange={(v) => updateSlot(index, "period", Number(v))}>
                          <SelectTrigger data-testid={`select-period-${index}`}>
                            <SelectValue placeholder="Period" />
                          </SelectTrigger>
                          <SelectContent>
                            {periods.map((p) => (
                              <SelectItem key={p} value={String(p)}>Period {p}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Start Time *</Label>
                        <Input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => updateSlot(index, "startTime", e.target.value)}
                          data-testid={`input-start-time-${index}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">End Time *</Label>
                        <Input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => updateSlot(index, "endTime", e.target.value)}
                          data-testid={`input-end-time-${index}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Subject</Label>
                        <Select value={slot.subject} onValueChange={(v) => updateSlot(index, "subject", v)}>
                          <SelectTrigger data-testid={`select-subject-${index}`}>
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
                        <Label className="text-xs">Teacher</Label>
                        <Select value={slot.teacherId} onValueChange={(v) => updateSlot(index, "teacherId", v)} disabled={teachersLoading || assignedTeachers.length === 0}>
                          <SelectTrigger data-testid={`select-teacher-${index}`}>
                            <SelectValue placeholder={teachersLoading ? "Loading..." : assignedTeachers.length === 0 ? "No teachers assigned" : "Teacher"} />
                          </SelectTrigger>
                          <SelectContent>
                            {assignedTeachers.map((t) => (
                              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeSlot(index)} data-testid={`button-remove-slot-${index}`}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button variant="outline" onClick={() => setLocation("/curriculum/timetable/class")} data-testid="button-cancel">Cancel</Button>
              <Button onClick={handleSubmit} disabled={isPending} data-testid="button-save">
                {isPending ? "Saving..." : "Save Timetable"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
}
