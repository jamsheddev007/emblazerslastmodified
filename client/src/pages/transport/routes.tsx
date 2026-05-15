import { useState } from "react";
import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { transportNavItems, useTransportData } from "./transport-data";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, X } from "lucide-react";
import type { Route } from "@shared/schema";

const emptyForm = { routeCode: "", routeName: "", stops: [""] };

export default function Routes() {
  const { routes, addRoute, updateRoute, deleteRoute, isPending } = useTransportData();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Route | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteItem, setDeleteItem] = useState<Route | null>(null);

  const openCreate = () => {
    setEditingItem(null);
    setForm({ ...emptyForm, stops: [""] });
    setDialogOpen(true);
  };

  const openEdit = (item: Route) => {
    setEditingItem(item);
    setForm({
      routeCode: item.routeCode,
      routeName: item.routeName,
      stops: item.stops.length > 0 ? [...item.stops] : [""],
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const filteredStops = form.stops.filter((s) => s.trim() !== "");
    if (!form.routeCode || !form.routeName) {
      toast({ title: "Validation Error", description: "Route code and name are required", variant: "destructive" });
      return;
    }
    try {
      if (editingItem) {
        await updateRoute(editingItem.id, { routeCode: form.routeCode, routeName: form.routeName, stops: filteredStops });
        toast({ title: "Route updated successfully" });
      } else {
        await addRoute({ routeCode: form.routeCode, routeName: form.routeName, stops: filteredStops });
        toast({ title: "Route created successfully" });
      }
      setDialogOpen(false);
      setForm({ ...emptyForm, stops: [""] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save route", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await deleteRoute(deleteItem.id);
      toast({ title: "Route deleted successfully" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to delete route", variant: "destructive" });
    }
    setDeleteItem(null);
  };

  const addStop = () => setForm((f) => ({ ...f, stops: [...f.stops, ""] }));
  const removeStop = (idx: number) => setForm((f) => ({ ...f, stops: f.stops.filter((_, i) => i !== idx) }));
  const updateStop = (idx: number, val: string) => setForm((f) => ({ ...f, stops: f.stops.map((s, i) => (i === idx ? val : s)) }));

  const columns = [
    { key: "routeCode" as const, label: "Code" },
    { key: "routeName" as const, label: "Route Name", sortable: true },
    {
      key: "stops" as const,
      label: "Stops",
      render: (item: Route) => (
        <div className="flex flex-wrap gap-1">
          {item.stops.slice(0, 3).map((stop, idx) => (
            <Badge key={idx} variant="outline">{stop}</Badge>
          ))}
          {item.stops.length > 3 && <Badge variant="outline">+{item.stops.length - 3}</Badge>}
        </div>
      ),
    },
  ];

  return (
    <ModuleLayout module="transport" navItems={transportNavItems}>
      <div className="space-y-6">
        <PageHeader
          title="Routes"
          description="Manage transport routes"
          actions={
            <Button onClick={openCreate} data-testid="button-add-route">
              <Plus className="w-4 h-4 mr-2" />
              Add Route
            </Button>
          }
        />

        <DataTable
          data={routes}
          columns={columns}
          searchKey="routeName"
          searchPlaceholder="Search routes..."
          onEdit={openEdit}
          onDelete={(item) => setDeleteItem(item)}
          getRowKey={(item) => item.id}
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Route" : "Add Route"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Route Code</Label>
              <Input
                value={form.routeCode}
                onChange={(e) => setForm((f) => ({ ...f, routeCode: e.target.value }))}
                placeholder="e.g. R-001"
                data-testid="input-route-code"
              />
            </div>
            <div className="space-y-2">
              <Label>Route Name</Label>
              <Input
                value={form.routeName}
                onChange={(e) => setForm((f) => ({ ...f, routeName: e.target.value }))}
                placeholder="e.g. DHA Phase 6 Route"
                data-testid="input-route-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Stops</Label>
              <div className="space-y-2">
                {form.stops.map((stop, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input
                      value={stop}
                      onChange={(e) => updateStop(idx, e.target.value)}
                      placeholder={`Stop ${idx + 1}`}
                      data-testid={`input-stop-${idx}`}
                    />
                    {form.stops.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeStop(idx)} data-testid={`button-remove-stop-${idx}`}>
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addStop} data-testid="button-add-stop">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Stop
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel">Cancel</Button>
            <Button onClick={handleSave} disabled={isPending} data-testid="button-save-route">
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Route</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete route "{deleteItem?.routeName}"? This action cannot be undone.
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
