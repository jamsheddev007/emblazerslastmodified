import { useState } from "react";
import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, StatusBadge } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { transportNavItems, useTransportData, vehicleTypes, vehicleStatuses } from "./transport-data";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import type { Vehicle } from "@shared/schema";

const emptyForm = {
  registrationNumber: "",
  type: "Bus" as Vehicle["type"],
  capacity: 0,
  model: "",
  make: "",
  year: new Date().getFullYear(),
  routeId: "",
  routeName: "",
  status: "Active" as Vehicle["status"],
  insuranceExpiry: "",
  fitnessExpiry: "",
};

export default function Vehicles() {
  const { vehicles, routes, addVehicle, updateVehicle, deleteVehicle, isPending } = useTransportData();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Vehicle | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteItem, setDeleteItem] = useState<Vehicle | null>(null);

  const openCreate = () => {
    setEditingItem(null);
    setForm({ ...emptyForm });
    setDialogOpen(true);
  };

  const openEdit = (item: Vehicle) => {
    setEditingItem(item);
    setForm({
      registrationNumber: item.registrationNumber,
      type: item.type,
      capacity: item.capacity,
      model: item.model,
      make: item.make,
      year: item.year,
      routeId: item.routeId || "",
      routeName: item.routeName || "",
      status: item.status,
      insuranceExpiry: item.insuranceExpiry,
      fitnessExpiry: item.fitnessExpiry,
    });
    setDialogOpen(true);
  };

  const handleRouteChange = (routeId: string) => {
    if (routeId === "__none__") {
      setForm((f) => ({ ...f, routeId: "", routeName: "" }));
    } else {
      const route = routes.find((r) => r.id === routeId);
      setForm((f) => ({ ...f, routeId, routeName: route?.routeName || "" }));
    }
  };

  const handleSave = async () => {
    if (!form.registrationNumber || !form.model || !form.make || !form.insuranceExpiry || !form.fitnessExpiry) {
      toast({ title: "Validation Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    try {
      const payload = {
        registrationNumber: form.registrationNumber,
        type: form.type,
        capacity: form.capacity,
        model: form.model,
        make: form.make,
        year: form.year,
        routeId: form.routeId || undefined,
        routeName: form.routeName || undefined,
        status: form.status,
        insuranceExpiry: form.insuranceExpiry,
        fitnessExpiry: form.fitnessExpiry,
      };
      if (editingItem) {
        await updateVehicle(editingItem.id, payload);
        toast({ title: "Vehicle updated successfully" });
      } else {
        await addVehicle(payload);
        toast({ title: "Vehicle created successfully" });
      }
      setDialogOpen(false);
      setForm({ ...emptyForm });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save vehicle", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await deleteVehicle(deleteItem.id);
      toast({ title: "Vehicle deleted successfully" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to delete vehicle", variant: "destructive" });
    }
    setDeleteItem(null);
  };

  const columns = [
    { key: "registrationNumber" as const, label: "Reg No", sortable: true },
    { key: "type" as const, label: "Type", render: (item: Vehicle) => <Badge variant="outline">{item.type}</Badge> },
    { key: "capacity" as const, label: "Capacity" },
    { key: "model" as const, label: "Model" },
    { key: "make" as const, label: "Make" },
    { key: "year" as const, label: "Year" },
    {
      key: "routeName" as const,
      label: "Route",
      render: (item: Vehicle) => item.routeName || "-",
    },
    { key: "status" as const, label: "Status", render: (item: Vehicle) => <StatusBadge status={item.status} /> },
  ];

  return (
    <ModuleLayout module="transport" navItems={transportNavItems}>
      <div className="space-y-6">
        <PageHeader
          title="Vehicles"
          description="Manage transport vehicles"
          actions={
            <Button onClick={openCreate} data-testid="button-add-vehicle">
              <Plus className="w-4 h-4 mr-2" />
              Add Vehicle
            </Button>
          }
        />

        <DataTable
          data={vehicles}
          columns={columns}
          searchKey="registrationNumber"
          searchPlaceholder="Search vehicles..."
          onEdit={openEdit}
          onDelete={(item) => setDeleteItem(item)}
          getRowKey={(item) => item.id}
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Vehicle" : "Add Vehicle"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Registration Number</Label>
              <Input value={form.registrationNumber} onChange={(e) => setForm((f) => ({ ...f, registrationNumber: e.target.value }))} placeholder="e.g. ABC-1234" data-testid="input-registration-number" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as Vehicle["type"] }))}>
                <SelectTrigger data-testid="select-vehicle-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {vehicleTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Capacity</Label>
              <Input type="number" value={form.capacity || ""} onChange={(e) => setForm((f) => ({ ...f, capacity: parseInt(e.target.value) || 0 }))} data-testid="input-capacity" />
            </div>
            <div className="space-y-2">
              <Label>Model</Label>
              <Input value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} placeholder="e.g. Hiace" data-testid="input-model" />
            </div>
            <div className="space-y-2">
              <Label>Make</Label>
              <Input value={form.make} onChange={(e) => setForm((f) => ({ ...f, make: e.target.value }))} placeholder="e.g. Toyota" data-testid="input-make" />
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Input type="number" value={form.year || ""} onChange={(e) => setForm((f) => ({ ...f, year: parseInt(e.target.value) || 0 }))} data-testid="input-year" />
            </div>
            <div className="space-y-2">
              <Label>Route (Optional)</Label>
              <Select value={form.routeId || "__none__"} onValueChange={handleRouteChange}>
                <SelectTrigger data-testid="select-route"><SelectValue placeholder="Select route" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {routes.map((r) => <SelectItem key={r.id} value={r.id}>{r.routeName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as Vehicle["status"] }))}>
                <SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {vehicleStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Insurance Expiry</Label>
              <Input type="date" value={form.insuranceExpiry} onChange={(e) => setForm((f) => ({ ...f, insuranceExpiry: e.target.value }))} data-testid="input-insurance-expiry" />
            </div>
            <div className="space-y-2">
              <Label>Fitness Expiry</Label>
              <Input type="date" value={form.fitnessExpiry} onChange={(e) => setForm((f) => ({ ...f, fitnessExpiry: e.target.value }))} data-testid="input-fitness-expiry" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel">Cancel</Button>
            <Button onClick={handleSave} disabled={isPending} data-testid="button-save-vehicle">
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vehicle</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete vehicle "{deleteItem?.registrationNumber}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} data-testid="button-confirm-delete">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ModuleLayout>
  );
}
