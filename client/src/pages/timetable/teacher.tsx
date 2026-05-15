import { useState } from "react";
import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTimetableData, days } from "./timetable-data";
import { curriculumNavItems } from "@/pages/curriculum/curriculum-data";

export default function TeacherTimetables() {
  const { timetables } = useTimetableData();

  const teachers = Array.from(
    timetables
      .flatMap((tt) => tt.slots as { teacherId: string; teacherName: string }[])
      .reduce((map, slot) => {
        if (slot.teacherId && !map.has(slot.teacherId)) {
          map.set(slot.teacherId, { id: slot.teacherId, name: slot.teacherName });
        }
        return map;
      }, new Map<string, { id: string; name: string }>())
      .values()
  );

  const [selectedTeacher, setSelectedTeacher] = useState<string>("");

  const effectiveTeacher = selectedTeacher || teachers[0]?.id || "";
  const teacher = teachers.find((t) => t.id === effectiveTeacher);

  const getTeacherSlotsByDay = (day: string) => {
    const slots: {
      day: string;
      period: number;
      class: string;
      section: string;
      subject: string;
      startTime?: string;
      endTime?: string;
    }[] = [];

    timetables.forEach((tt) => {
      tt.slots.forEach((slot) => {
        if (slot.teacherId === effectiveTeacher && slot.day === day) {
          slots.push({
            day: slot.day,
            period: slot.period,
            class: tt.class,
            section: tt.section,
            subject: slot.subject,
            startTime: slot.startTime,
            endTime: slot.endTime,
          });
        }
      });
    });

    // Sort by start time
    return slots.sort((a, b) => {
      if (a.startTime && b.startTime) {
        return a.startTime.localeCompare(b.startTime);
      }
      return a.period - b.period;
    });
  };

  return (
    <ModuleLayout module="curriculum" navItems={curriculumNavItems}>
      <div className="space-y-6">
        <PageHeader
          title="Teacher Timetables"
          description="View individual teacher schedules"
        />

        <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
          <SelectTrigger className="w-[280px]" data-testid="select-teacher">
            <SelectValue placeholder="Select Teacher" />
          </SelectTrigger>
          <SelectContent>
            {teachers.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Card>
          <CardHeader>
            <CardTitle>{teacher?.name ?? "Select a teacher"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {days.map((day) => {
                const daySlots = getTeacherSlotsByDay(day);
                return (
                  <div key={day} className="border rounded-lg overflow-hidden">
                    <div className="bg-muted px-4 py-2 font-semibold">
                      {day}
                    </div>
                    <div className="p-4">
                      {daySlots.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {daySlots.map((slot, idx) => (
                            <div
                              key={idx}
                              className="border rounded-md p-3 bg-card hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="text-xs font-medium text-muted-foreground">
                                  Period {slot.period}
                                </div>
                                {slot.startTime && slot.endTime && (
                                  <div className="text-xs font-medium text-primary">
                                    {slot.startTime} - {slot.endTime}
                                  </div>
                                )}
                              </div>
                              <div className="font-semibold text-sm mb-1">
                                {slot.class} {slot.section}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {slot.subject}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground text-sm">
                          No classes scheduled
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
}
