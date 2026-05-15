import { useState } from "react";
import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTimetableData, classes, sections, days } from "./timetable-data";
import { curriculumNavItems } from "@/pages/curriculum/curriculum-data";

export default function ClassTimetables() {
  const { timetables } = useTimetableData();
  const [selectedClass, setSelectedClass] = useState("Class 5");
  const [selectedSection, setSelectedSection] = useState("A");

  const timetable = timetables.find((t) => t.class === selectedClass && t.section === selectedSection);

  const getSlotsByDay = (day: string) => {
    if (!timetable) return [];
    return timetable.slots
      .filter((s) => s.day === day)
      .sort((a, b) => {
        // Sort by start time
        if (a.startTime && b.startTime) {
          return a.startTime.localeCompare(b.startTime);
        }
        // Fallback to period number if times not available
        return a.period - b.period;
      });
  };

  return (
    <ModuleLayout module="curriculum" navItems={curriculumNavItems}>
      <div className="space-y-6">
        <PageHeader
          title="Class Timetables"
          description="View timetables by class and section"
        />

        <div className="flex flex-wrap gap-4">
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

          <Select value={selectedSection} onValueChange={setSelectedSection}>
            <SelectTrigger className="w-[180px]" data-testid="select-section">
              <SelectValue placeholder="Select Section" />
            </SelectTrigger>
            <SelectContent>
              {sections.map((sec) => (
                <SelectItem key={sec} value={sec}>{sec}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{selectedClass} - Section {selectedSection}</CardTitle>
          </CardHeader>
          <CardContent>
            {timetable ? (
              <div className="space-y-6">
                {days.map((day) => {
                  const daySlots = getSlotsByDay(day);
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
                                  {slot.subject}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {slot.teacherName}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-muted-foreground text-sm">
                            No periods scheduled
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No timetable found for {selectedClass} - Section {selectedSection}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
}
