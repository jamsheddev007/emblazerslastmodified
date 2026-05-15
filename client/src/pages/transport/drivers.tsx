import { useState } from "react";
import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, StatusBadge } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { transportNavItems, useTransportData, driverStatuses } from "./transport-data";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import type { Driver } from "@shared/schema";

const emptyForm = {
  name: "",
  cnic: "",
  contact: "",
  address: "",
  licenseNumber: "",
  licenseExpiry: "",
  experience: 0,
  vehicleId: "",
  routeId: "",
  salary: 0,
  status: "Active" as Driver["status"],
};

export default function Drivers() {
  const { drivers, vehicles, routes, addDriver, updateDriver, deleteDriver, isPending } = useTransportData();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Driver | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteItem, setDeleteItem] = useState<Driver | null>(null);

  const openCreate = () => {
    setEditingItem(null);
    setForm({ ...emptyForm });
    setDialogOpen(true);
  };

  const openEdit = (item: Driver) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      cnic: item.cnic,
      contact: item.contact,
      address: item.address || "",
      licenseNumber: item.licenseNumber,
      licenseExpiry: item.licenseExpiry,
      experience: item.experience,
      vehicleId: item.vehicleId || "",
      routeId: item.routeId || "",
      salary: item.salary,
      status: item.status,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.cnic || !form.contact || !form.licenseNumber || !form.licenseExpiry) {
      toast({ title: "Validation Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    try {
      const payload = {
        name: form.name,
        cnic: form.cnic,
        contact: form.contact,
        address: form.address || undefined,
        licenseNumber: form.licenseNumber,
        licenseExpiry: form.licenseExpiry,
        experience: form.experience,
        vehicleId: form.vehicleId || undefined,
        routeId: form.routeId || undefined,
        salary: form.salary,
        status: form.status,
      };
      if (editingItem) {
        await updateDriver(editingItem.id, payload);
        toast({ title: "Driver updated successfully" });
      } else {
        await addDriver(payload);
        toast({ title: "Driver created successfully" });
      }
      setDialogOpen(false);
      setForm({ ...emptyForm });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save driver", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await deleteDriver(deleteItem.id);
      toast({ title: "Driver deleted successfully" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to delete driver", variant: "destructive" });
    }
    setDeleteItem(null);
  };

  const columns = [
    { key: "driverId" as const, label: "Driver ID" },
    { key: "name" as const, label: "Name", sortable: true },
    { key: "contact" as const, label: "Contact" },
    { key: "licenseNumber" as const, label: "License No" },
    {
      key: "salary" as const,
      label: "Salary",
      render: (item: Driver) => `Rs. ${item.salary.toLocaleString()}`,
    },
    { key: "status" as const, label: "Status", render: (item: Driver) => <StatusBadge status={item.status} /> },
  ];

  return (
    <ModuleLayout module="transport" navItems={transportNavItems}>
      <div className="space-y-6">
        <PageHeader
          title="Drivers"
          description="Manage transport drivers"
          actions={
            <Button onClick={openCreate} data-testid="button-add-driver">
              <Plus className="w-4 h-4 mr-2" />
              Add Driver
            </Button>
          }
        />

        <DataTable
          data={drivers}
          columns={columns}
          searchKey="name"
          searchPlaceholder="Search drivers..."
          onEdit={openEdit}
          onDelete={(item) => setDeleteItem(item)}
          getRowKey={(item) => item.id}
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Driver" : "Add Driver"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Full name" data-testid="input-driver-name" />
            </div>
            <div className="space-y-2">
              <Label>CNIC</Label>
              <Input value={form.cnic} onChange={(e) => setForm((f) => ({ ...f, cnic: e.target.value }))} placeholder="e.g. 12345-1234567-1" data-testid="input-cnic" />
            </div>
            <div className="space-y-2">
              <Label>Contact</Label>
              <Input value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} placeholder="Phone number" data-testid="input-contact" />
            </div>
            <div className="space-y-2">
              <Label>Address (Optional)</Label>
              <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Address" data-testid="input-address" />
            </div>
            <div className="space-y-2">
              <Label>License Number</Label>
              <Input value={form.licenseNumber} onChange={(e) => setForm((f) => ({ ...f, licenseNumber: e.target.value }))} placeholder="License number" data-testid="input-license-number" />
            </div>
            <div className="space-y-2">
              <Label>License Expiry</Label>
              <Input type="date" value={form.licenseExpiry} onChange={(e) => setForm((f) => ({ ...f, licenseExpiry: e.target.value }))} data-testid="input-license-expiry" />
            </div>
            <div className="space-y-2">
              <Label>Experience (Years)</Label>
              <Input type="number" value={form.experience || ""} onChange={(e) => setForm((f) => ({ ...f, experience: parseInt(e.target.value) || 0 }))} data-testid="input-experience" />
            </div>
            <div className="space-y-2">
              <Label>Salary</Label>
              <Input type="number" value={form.salary || ""} onChange={(e) => setForm((f) => ({ ...f, salary: parseInt(e.target.value) || 0 }))} data-testid="input-salary" />
            </div>
            <div className="space-y-2">
              <Label>Vehicle (Optional)</Label>
              <Select value={form.vehicleId || "__none__"} onValueChange={(v) => setForm((f) => ({ ...f, vehicleId: v === "__none__" ? "" : v }))}>
                <SelectTrigger data-testid="select-vehicle"><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.registrationNumber}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Route (Optional)</Label>
              <Select value={form.routeId || "__none__"} onValueChange={(v) => setForm((f) => ({ ...f, routeId: v === "__none__" ? "" : v }))}>
                <SelectTrigger data-testid="select-route"><SelectValue placeholder="Select route" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {routes.map((r) => <SelectItem key={r.id} value={r.id}>{r.routeName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as Driver["status"] }))}>
                <SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {driverStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel">Cancel</Button>
            <Button onClick={handleSave} disabled={isPending} data-testid="button-save-driver">
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Driver</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete driver "{deleteItem?.name}"? This action cannot be undone.
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
