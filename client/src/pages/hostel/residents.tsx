import { useState, useEffect, useRef } from "react";
import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, StatusBadge } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { hostelNavItems, useHostelData, residentStatuses } from "./hostel-data";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function Residents() {
  const { residents, rooms, addResident, updateResident, isPending } = useHostelData();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingResident, setEditingResident] = useState<typeof residents[0] | null>(null);
  
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [roomId, setRoomId] = useState("");
  const [bedNumber, setBedNumber] = useState(1);
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState<"Active" | "Left">("Active");
  const [fetchStatus, setFetchStatus] = useState<"idle" | "loading" | "found" | "notfound">("idle");
  const [autoFilled, setAutoFilled] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (editingResident) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!studentId.trim()) {
      setFetchStatus("idle");
      setAutoFilled(false);
      return;
    }
    setFetchStatus("loading");
    debounceRef.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem("emblazers_token");
        const res = await fetch(`/api/students?search=${encodeURIComponent(studentId.trim())}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error("fetch failed");
        const students: { studentId: string; name: string; class: string; section: string }[] = await res.json();
        const match = students.find(
          (s) => s.studentId.toLowerCase() === studentId.trim().toLowerCase()
        );
        if (match) {
          setStudentName(match.name);
          setStudentClass(`${match.class} - ${match.section}`);
          setFetchStatus("found");
          setAutoFilled(true);
        } else {
          setStudentName("");
          setStudentClass("");
          setFetchStatus("notfound");
          setAutoFilled(false);
        }
      } catch {
        setFetchStatus("idle");
        setAutoFilled(false);
      }
    }, 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [studentId, editingResident]);

  const resetForm = () => {
    setStudentId("");
    setStudentName("");
    setStudentClass("");
    setRoomId("");
    setBedNumber(1);
    setJoinDate(new Date().toISOString().split("T")[0]);
    setStatus("Active");
    setEditingResident(null);
    setFetchStatus("idle");
    setAutoFilled(false);
  };

  const handleSubmit = async () => {
    if (!studentId || !studentName || !roomId || !studentClass) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    const selectedRoom = rooms.find(r => r.id === roomId);
    if (!selectedRoom) {
      toast({ title: "Error", description: "Invalid room selected", variant: "destructive" });
      return;
    }

    try {
      if (editingResident) {
        await updateResident(editingResident.id, { 
          studentId, 
          studentName, 
          class: studentClass,
          roomId, 
          roomNumber: selectedRoom.roomNumber,
          bedNumber,
          joinDate, 
          status 
        });
        toast({ title: "Success", description: "Resident updated successfully" });
      } else {
        await addResident({ 
          studentId, 
          studentName, 
          class: studentClass,
          roomId, 
          roomNumber: selectedRoom.roomNumber,
          bedNumber,
          joinDate, 
          status 
        });
        toast({ title: "Success", description: "Resident added successfully" });
      }
      setIsOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to save resident:", error);
      toast({ title: "Error", description: "Failed to save resident. Please try again.", variant: "destructive" });
    }
  };

  const handleEdit = (resident: typeof residents[0]) => {
    setEditingResident(resident);
    setStudentId(resident.studentId);
    setStudentName(resident.studentName);
    setStudentClass(resident.class);
    setRoomId(resident.roomId);
    setBedNumber(resident.bedNumber);
    setJoinDate(resident.joinDate);
    setStatus(resident.status as "Active" | "Left");
    setIsOpen(true);
  };

  const availableRooms = rooms.filter(r => r.status === "Available" && r.bedCount > r.occupiedBeds);

  const columns = [
    { key: "studentId" as const, label: "Student ID", sortable: true },
    { key: "studentName" as const, label: "Name", sortable: true },
    { key: "class" as const, label: "Class" },
    { key: "roomNumber" as const, label: "Room" },
    { key: "bedNumber" as const, label: "Bed" },
    { key: "joinDate" as const, label: "Join Date" },
    { key: "status" as const, label: "Status", render: (item: typeof residents[0]) => <StatusBadge status={item.status} /> },
  ];

  const actions = (item: typeof residents[0]) => (
    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} data-testid={`button-edit-${item.id}`}>
      <Edit className="w-4 h-4" />
    </Button>
  );

  return (
    <ModuleLayout module="hostel" navItems={hostelNavItems}>
      <div className="space-y-6">
        <PageHeader
          title="Residents"
          description="Manage hostel residents"
          actions={
            <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-resident">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Resident
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingResident ? "Edit Resident" : "Add New Resident"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Student ID *</Label>
                    <div className="relative">
                      <Input
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        placeholder="e.g., C5-A-2026-0001"
                        className="pr-9"
                        data-testid="input-student-id"
                      />
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                        {fetchStatus === "loading" && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                        {fetchStatus === "found" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                        {fetchStatus === "notfound" && <AlertCircle className="w-4 h-4 text-destructive" />}
                      </div>
                    </div>
                    {fetchStatus === "notfound" && (
                      <p className="text-xs text-destructive" data-testid="text-student-not-found">
                        No student found with this ID. Please check and try again.
                      </p>
                    )}
                    {fetchStatus === "found" && (
                      <p className="text-xs text-green-600 dark:text-green-400" data-testid="text-student-found">
                        Student details auto-filled from records.
                      </p>
                    )}
                    {fetchStatus === "idle" && !editingResident && (
                      <p className="text-xs text-muted-foreground">
                        Name and class will be filled automatically.
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Student Name *</Label>
                      <Input
                        value={studentName}
                        onChange={(e) => { if (!autoFilled) setStudentName(e.target.value); }}
                        placeholder="Auto-filled from Student ID"
                        readOnly={autoFilled}
                        className={autoFilled ? "bg-muted text-muted-foreground cursor-not-allowed" : ""}
                        data-testid="input-student-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Class &amp; Section *</Label>
                      <Input
                        value={studentClass}
                        onChange={(e) => { if (!autoFilled) setStudentClass(e.target.value); }}
                        placeholder="Auto-filled from Student ID"
                        readOnly={autoFilled}
                        className={autoFilled ? "bg-muted text-muted-foreground cursor-not-allowed" : ""}
                        data-testid="input-class"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Room *</Label>
                      <Select value={roomId} onValueChange={setRoomId}>
                        <SelectTrigger data-testid="select-room">
                          <SelectValue placeholder="Select room" />
                        </SelectTrigger>
                        <SelectContent>
                          {(editingResident ? rooms : availableRooms).map((room) => (
                            <SelectItem key={room.id} value={room.id}>
                              Room {room.roomNumber}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Bed Number</Label>
                      <Input 
                        type="number" 
                        value={bedNumber} 
                        onChange={(e) => setBedNumber(Number(e.target.value))} 
                        min={1}
                        data-testid="input-bed-number"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Join Date</Label>
                      <Input 
                        type="date" 
                        value={joinDate} 
                        onChange={(e) => setJoinDate(e.target.value)}
                        data-testid="input-join-date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {residentStatuses.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => { setIsOpen(false); resetForm(); }}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isPending} data-testid="button-save-resident">
                      {isPending ? "Saving..." : editingResident ? "Update Resident" : "Add Resident"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          }
        />

        <DataTable
          data={residents}
          columns={columns}
          searchKey="studentName"
          searchPlaceholder="Search residents..."
          actions={actions}
          getRowKey={(item) => item.id}
        />
      </div>
    </ModuleLayout>
  );
}
