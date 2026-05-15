import { useState } from "react";
import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, StatusBadge } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { hostelNavItems, useHostelData, hostelNames, roomStatuses } from "./hostel-data";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit } from "lucide-react";

export default function Rooms() {
  const { rooms, addRoom, updateRoom, isPending } = useHostelData();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<typeof rooms[0] | null>(null);
  
  const [hostelName, setHostelName] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [bedCount, setBedCount] = useState(4);
  const [status, setStatus] = useState<"Available" | "Full" | "Maintenance">("Available");

  const resetForm = () => {
    setHostelName("");
    setRoomNumber("");
    setBedCount(4);
    setStatus("Available");
    setEditingRoom(null);
  };

  const handleSubmit = async () => {
    if (!hostelName || !roomNumber) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    try {
      if (editingRoom) {
        await updateRoom(editingRoom.id, { hostelName, roomNumber, bedCount, status });
        toast({ title: "Success", description: "Room updated successfully" });
      } else {
        await addRoom({ hostelName, roomNumber, bedCount, occupiedBeds: 0, status });
        toast({ title: "Success", description: "Room added successfully" });
      }
      setIsOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to save room:", error);
      toast({ title: "Error", description: "Failed to save room. Please try again.", variant: "destructive" });
    }
  };

  const handleEdit = (room: typeof rooms[0]) => {
    setEditingRoom(room);
    setHostelName(room.hostelName);
    setRoomNumber(room.roomNumber);
    setBedCount(room.bedCount);
    setStatus(room.status as "Available" | "Full" | "Maintenance");
    setIsOpen(true);
  };

  const columns = [
    { key: "hostelName" as const, label: "Hostel", sortable: true },
    { key: "roomNumber" as const, label: "Room No" },
    { key: "bedCount" as const, label: "Beds" },
    { key: "occupiedBeds" as const, label: "Occupied" },
    { 
      key: "available" as const, 
      label: "Available", 
      render: (item: typeof rooms[0]) => item.bedCount - item.occupiedBeds 
    },
    { key: "status" as const, label: "Status", render: (item: typeof rooms[0]) => <StatusBadge status={item.status} /> },
  ];

  const actions = (item: typeof rooms[0]) => (
    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} data-testid={`button-edit-${item.id}`}>
      <Edit className="w-4 h-4" />
    </Button>
  );

  return (
    <ModuleLayout module="hostel" navItems={hostelNavItems}>
      <div className="space-y-6">
        <PageHeader
          title="Rooms"
          description="Manage hostel rooms"
          actions={
            <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-room">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Room
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingRoom ? "Edit Room" : "Add New Room"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Hostel *</Label>
                    <Select value={hostelName} onValueChange={setHostelName}>
                      <SelectTrigger data-testid="select-hostel">
                        <SelectValue placeholder="Select hostel" />
                      </SelectTrigger>
                      <SelectContent>
                        {hostelNames.map((name) => (
                          <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Room Number *</Label>
                    <Input 
                      value={roomNumber} 
                      onChange={(e) => setRoomNumber(e.target.value)} 
                      placeholder="e.g., 101" 
                      data-testid="input-room-number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Number of Beds</Label>
                    <Input 
                      type="number" 
                      value={bedCount} 
                      onChange={(e) => setBedCount(Number(e.target.value))} 
                      min={1}
                      data-testid="input-bed-count"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                      <SelectTrigger data-testid="select-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roomStatuses.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => { setIsOpen(false); resetForm(); }}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isPending} data-testid="button-save-room">
                      {isPending ? "Saving..." : editingRoom ? "Update Room" : "Add Room"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          }
        />

        <DataTable
          data={rooms}
          columns={columns}
          searchKey="roomNumber"
          searchPlaceholder="Search rooms..."
          actions={actions}
          getRowKey={(item) => item.id}
        />
      </div>
    </ModuleLayout>
  );
}
