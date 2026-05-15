import { useEffect, useState } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { datesheetNavItems, useDateSheetData } from "./datesheet-data";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar, Clock, MapPin, Users, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ViewDateSheet() {
    const [match, params] = useRoute("/curriculum/datesheet/view/:id");
    const { dateSheets, getDateSheet } = useDateSheetData();
    const { toast } = useToast();
    const [, setLocation] = useLocation();
    const [isLoading, setIsLoading] = useState(true);
    const [dateSheet, setDateSheet] = useState<ReturnType<typeof getDateSheet>>(undefined);

    useEffect(() => {
        if (match && params?.id) {
            const ds = getDateSheet(params.id);
            if (ds) {
                setDateSheet(ds);
                setIsLoading(false);
            } else if (dateSheets.length > 0) {
                toast({
                    title: "Error",
                    description: "Date sheet not found",
                    variant: "destructive"
                });
                setLocation("/curriculum/datesheet/list");
            }
        }
    }, [match, params, dateSheets, getDateSheet, setLocation, toast]);

    const downloadPDF = () => {
        if (!dateSheet) return;

        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();

            // School Header
            doc.setFillColor(41, 128, 185); // Primary color
            doc.rect(0, 0, pageWidth, 40, 'F');

            // School Name
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('EMBLAZERS SCHOOL SYSTEM', pageWidth / 2, 15, { align: 'center' });

            // Session Info
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text(`Session: ${new Date().getFullYear()}`, pageWidth / 2, 25, { align: 'center' });
            doc.text(`${dateSheet.examType} Examination`, pageWidth / 2, 32, { align: 'center' });

            // Document Title
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('EXAMINATION DATE SHEET', pageWidth / 2, 50, { align: 'center' });

            // Exam Details
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.text(`Exam: ${dateSheet.examName}`, 14, 62);
            doc.text(`Class: ${dateSheet.class}`, 14, 70);
            doc.text(`Duration: ${new Date(dateSheet.startDate).toLocaleDateString()} to ${new Date(dateSheet.endDate).toLocaleDateString()}`, 14, 78);

            // Prepare table data
            const tableData = dateSheet.entries
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((entry, index) => [
                    (index + 1).toString(),
                    entry.subject,
                    new Date(entry.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                    }),
                    entry.startTime,
                    entry.endTime,
                    calculateDuration(entry.startTime, entry.endTime),
                    entry.room || 'TBD'
                ]);

            // Generate table
            autoTable(doc, {
                startY: 86,
                head: [['#', 'Subject', 'Date', 'Start Time', 'End Time', 'Duration', 'Room']],
                body: tableData,
                theme: 'grid',
                headStyles: {
                    fillColor: [41, 128, 185],
                    textColor: 255,
                    fontStyle: 'bold',
                    halign: 'center'
                },
                bodyStyles: {
                    halign: 'center'
                },
                columnStyles: {
                    0: { cellWidth: 10 },
                    1: { cellWidth: 40, halign: 'left' },
                    2: { cellWidth: 35 },
                    3: { cellWidth: 25 },
                    4: { cellWidth: 25 },
                    5: { cellWidth: 25 },
                    6: { cellWidth: 20 }
                },
                margin: { left: 14, right: 14 }
            });

            // Add footer with statistics
            const finalY = (doc as any).lastAutoTable.finalY || 90;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Summary:', 14, finalY + 15);
            doc.setFont('helvetica', 'normal');
            doc.text(`Total Subjects: ${dateSheet.entries.length}`, 14, finalY + 22);
            doc.text(`Total Exam Days: ${calculateTotalDays(dateSheet.startDate, dateSheet.endDate)}`, 14, finalY + 29);
            doc.text(`Total Hours: ${calculateTotalHours(dateSheet.entries)}`, 14, finalY + 36);

            // Add notes section
            doc.setFontSize(9);
            doc.setFont('helvetica', 'italic');
            const notesY = finalY + 48;
            doc.text('Notes:', 14, notesY);
            doc.setFont('helvetica', 'normal');
            doc.text('• Students must arrive 15 minutes before the exam start time.', 18, notesY + 5);
            doc.text('• Bring your admit card and ID card to the examination hall.', 18, notesY + 10);
            doc.text('• Electronic devices are strictly prohibited in the exam hall.', 18, notesY + 15);

            // Add footer
            const pageHeight = doc.internal.pageSize.getHeight();
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text(
                `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
                pageWidth / 2,
                pageHeight - 10,
                { align: 'center' }
            );

            // Save PDF
            const filename = `${dateSheet.examName.replace(/\s+/g, '_')}_${dateSheet.class.replace(/\s+/g, '_')}_DateSheet.pdf`;
            doc.save(filename);

            toast({
                title: "Success",
                description: "Date sheet PDF downloaded successfully"
            });
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast({
                title: "Error",
                description: "Failed to generate PDF. Please try again.",
                variant: "destructive"
            });
        }
    };

    if (!match) {
        return null;
    }

    if (isLoading) {
        return (
            <ModuleLayout module="curriculum" navItems={datesheetNavItems}>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-muted-foreground">Loading date sheet...</div>
                </div>
            </ModuleLayout>
        );
    }

    if (!dateSheet) {
        return null;
    }

    return (
        <ModuleLayout module="curriculum" navItems={datesheetNavItems}>
            <div className="space-y-6">
                <PageHeader
                    title="Date Sheet Details"
                    description="View complete exam schedule"
                    actions={
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={downloadPDF}>
                                <Download className="w-4 h-4 mr-2" />
                                Download PDF
                            </Button>
                            <Link href="/curriculum/datesheet/list">
                                <Button variant="outline">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to List
                                </Button>
                            </Link>
                        </div>
                    }
                />

                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="text-2xl mb-2">{dateSheet.examName}</CardTitle>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <Badge variant="secondary">{dateSheet.examType}</Badge>
                                    <span>•</span>
                                    <span className="font-medium">{dateSheet.class}</span>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Exam Duration */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-md">
                                    <Calendar className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Start Date</p>
                                    <p className="font-semibold">{new Date(dateSheet.startDate).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-md">
                                    <Calendar className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">End Date</p>
                                    <p className="font-semibold">{new Date(dateSheet.endDate).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Exam Schedule */}
                        <div>
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Exam Schedule
                            </h3>

                            {dateSheet.entries.length > 0 ? (
                                <div className="space-y-3">
                                    {dateSheet.entries
                                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                        .map((entry, index) => (
                                            <div
                                                key={index}
                                                className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                                            >
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                    <div>
                                                        <p className="text-xs text-muted-foreground mb-1">Subject</p>
                                                        <p className="font-semibold text-lg">{entry.subject}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-muted-foreground" />
                                                        <div>
                                                            <p className="text-xs text-muted-foreground mb-1">Date</p>
                                                            <p className="font-medium">
                                                                {new Date(entry.date).toLocaleDateString('en-US', {
                                                                    weekday: 'short',
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    year: 'numeric'
                                                                })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4 text-muted-foreground" />
                                                        <div>
                                                            <p className="text-xs text-muted-foreground mb-1">Time</p>
                                                            <p className="font-medium">
                                                                {entry.startTime} - {entry.endTime}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                Duration: {calculateDuration(entry.startTime, entry.endTime)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-4 h-4 text-muted-foreground" />
                                                        <div>
                                                            <p className="text-xs text-muted-foreground mb-1">Room</p>
                                                            <p className="font-medium">{entry.room || 'TBD'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground border rounded-lg">
                                    No exam schedule available
                                </div>
                            )}
                        </div>

                        {/* Summary */}
                        <div className="pt-4 border-t">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                                <div className="p-4 bg-muted/50 rounded-lg">
                                    <p className="text-2xl font-bold text-primary">{dateSheet.entries.length}</p>
                                    <p className="text-sm text-muted-foreground">Total Subjects</p>
                                </div>
                                <div className="p-4 bg-muted/50 rounded-lg">
                                    <p className="text-2xl font-bold text-primary">
                                        {calculateTotalDays(dateSheet.startDate, dateSheet.endDate)}
                                    </p>
                                    <p className="text-sm text-muted-foreground">Exam Days</p>
                                </div>
                                <div className="p-4 bg-muted/50 rounded-lg">
                                    <p className="text-2xl font-bold text-primary">
                                        {calculateTotalHours(dateSheet.entries)}
                                    </p>
                                    <p className="text-sm text-muted-foreground">Total Hours</p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-4">
                            <Link href="/curriculum/datesheet/list">
                                <Button variant="outline">Close</Button>
                            </Link>
                            <Link href={`/curriculum/datesheet/edit/${dateSheet.id}`}>
                                <Button>Edit Date Sheet</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </ModuleLayout>
    );
}

// Helper function to calculate duration between two times
function calculateDuration(startTime: string, endTime: string): string {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const diffMinutes = endMinutes - startMinutes;

    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    if (hours > 0 && minutes > 0) {
        return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
        return `${hours}h`;
    } else {
        return `${minutes}m`;
    }
}

// Helper function to calculate total days
function calculateTotalDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Include both start and end dates
}

// Helper function to calculate total hours
function calculateTotalHours(entries: Array<{ startTime: string; endTime: string }>): string {
    let totalMinutes = 0;

    entries.forEach(entry => {
        const [startHour, startMin] = entry.startTime.split(':').map(Number);
        const [endHour, endMin] = entry.endTime.split(':').map(Number);

        const startMinutesTotal = startHour * 60 + startMin;
        const endMinutesTotal = endHour * 60 + endMin;
        totalMinutes += endMinutesTotal - startMinutesTotal;
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (minutes > 0) {
        return `${hours}.${Math.round((minutes / 60) * 10)}h`;
    }
    return `${hours}h`;
}
