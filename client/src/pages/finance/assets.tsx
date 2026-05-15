import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ModuleLayout } from "@/components/layout/module-layout";
import { financeNavItems } from "./finance-data";
import { StatsCard, StatsGrid } from "@/components/shared/stats-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Eye, Trash2, Package, Wrench, AlertTriangle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Asset, AssetMaintenanceLog } from "@shared/schema";

const CATEGORIES = ["furniture", "electronics", "vehicles", "sports", "books", "stationery", "other"] as const;
const CONDITIONS = ["good", "fair", "poor", "under_repair", "disposed"] as const;
const MAINTENANCE_TYPES = ["routine", "repair", "inspection", "replacement", "cleaning", "other"];

const CATEGORY_COLORS: Record<string, string> = {
  furniture: "bg-amber-100 text-amber-800",
  electronics: "bg-blue-100 text-blue-800",
  vehicles: "bg-purple-100 text-purple-800",
  sports: "bg-green-100 text-green-800",
  books: "bg-indigo-100 text-indigo-800",
  stationery: "bg-pink-100 text-pink-800",
  other: "bg-gray-100 text-gray-700",
};

const CONDITION_COLORS: Record<string, string> = {
  good: "bg-green-100 text-green-800",
  fair: "bg-yellow-100 text-yellow-800",
  poor: "bg-red-100 text-red-800",
  under_repair: "bg-orange-100 text-orange-800",
  disposed: "bg-gray-100 text-gray-600",
};

function Badge({ label, colorClass }: { label: string; colorClass: string }) {
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${colorClass}`}>{label.replace("_", " ")}</span>;
}

const emptyAssetForm = { assetName: "", assetCode: "", category: "furniture", purchaseDate: "", purchasePrice: "", currentValue: "", condition: "good", location: "", assignedTo: "", warrantyExpiry: "", notes: "" };
const emptyMaintForm = { maintenanceType: "routine", description: "", cost: "", performedAt: "", performedBy: "", nextMaintenanceDate: "", condition: "" };

type AssetWithMeta = Asset & { maintenanceLogs?: AssetMaintenanceLog[] };

export default function FinanceAssets() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterCondition, setFilterCondition] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editAsset, setEditAsset] = useState<Asset | null>(null);
  const [viewAsset, setViewAsset] = useState<Asset | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [maintOpen, setMaintOpen] = useState(false);
  const [assetForm, setAssetForm] = useState(emptyAssetForm);
  const [maintForm, setMaintForm] = useState(emptyMaintForm);

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (filterCategory) params.set("category", filterCategory);
    if (filterCondition) params.set("condition", filterCondition);
    if (search) params.set("search", search);
    return params.toString() ? `?${params.toString()}` : "";
  };

  const { data: assetsData, isLoading } = useQuery<{ total: number; assets: Asset[] }>({
    queryKey: ["/api/assets", filterCategory, filterCondition, search],
    queryFn: () => apiRequest("GET", `/api/assets${buildQuery()}`).then(r => r.json()),
  });

  const { data: viewDetail } = useQuery<AssetWithMeta>({
    queryKey: ["/api/assets", viewAsset?.id],
    enabled: !!viewAsset?.id,
    queryFn: () => apiRequest("GET", `/api/assets/${viewAsset!.id}`).then(r => r.json()),
  });

  const assets = assetsData?.assets || [];

  const { data: summaryData } = useQuery<any>({
    queryKey: ["/api/assets/summary"],
    queryFn: () => apiRequest("GET", "/api/assets/summary").then(r => r.json()),
  });

  const dueSoon = useMemo(() => {
    const today = new Date();
    const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return (assetsData?.assets || []).filter((a: Asset) => {
      if (!a.warrantyExpiry) return false;
      const exp = new Date(a.warrantyExpiry);
      return exp >= today && exp <= sevenDaysLater;
    }).length;
  }, [assetsData]);

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/assets", data).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/assets"] }); queryClient.invalidateQueries({ queryKey: ["/api/assets/summary"] }); setCreateOpen(false); toast({ title: "Asset Registered", description: "New asset has been added successfully." }); },
    onError: () => toast({ title: "Error", description: "Failed to register asset.", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/assets/${id}`, data).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/assets"] }); queryClient.invalidateQueries({ queryKey: ["/api/assets/summary"] }); setEditAsset(null); toast({ title: "Asset Updated" }); },
    onError: () => toast({ title: "Error", description: "Failed to update asset.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/assets/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/assets"] }); queryClient.invalidateQueries({ queryKey: ["/api/assets/summary"] }); setDeleteId(null); toast({ title: "Asset Deleted" }); },
    onError: () => toast({ title: "Error", description: "Failed to delete asset.", variant: "destructive" }),
  });

  const maintMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("POST", `/api/assets/${id}/maintenance`, data).then(r => r.json()),
    onSuccess: () => { if (viewAsset) queryClient.invalidateQueries({ queryKey: ["/api/assets", viewAsset.id] }); setMaintOpen(false); setMaintForm(emptyMaintForm); toast({ title: "Maintenance Logged" }); },
    onError: () => toast({ title: "Error", description: "Failed to log maintenance.", variant: "destructive" }),
  });

  function openCreate() { setAssetForm(emptyAssetForm); setCreateOpen(true); }
  function openEdit(a: Asset) {
    setAssetForm({ assetName: a.assetName, assetCode: a.assetCode, category: a.category, purchaseDate: a.purchaseDate || "", purchasePrice: a.purchasePrice?.toString() || "", currentValue: a.currentValue?.toString() || "", condition: a.condition, location: a.location || "", assignedTo: a.assignedTo || "", warrantyExpiry: a.warrantyExpiry || "", notes: a.notes || "" });
    setEditAsset(a);
  }
  function handleAssetSubmit() {
    const payload = { ...assetForm, purchasePrice: assetForm.purchasePrice ? Number(assetForm.purchasePrice) : undefined, currentValue: assetForm.currentValue ? Number(assetForm.currentValue) : undefined };
    if (editAsset) updateMutation.mutate({ id: editAsset.id, data: payload });
    else createMutation.mutate(payload);
  }
  function handleMaintSubmit() {
    if (!viewAsset) return;
    const payload = { ...maintForm, cost: maintForm.cost ? Number(maintForm.cost) : undefined };
    maintMutation.mutate({ id: viewAsset.id, data: payload });
  }

  const isWarrantyExpired = (d?: string | null) => d && new Date(d) < new Date();

  const totalValue = summaryData?.totalValue || 0;
  const underRepair = summaryData?.byCondition?.under_repair || 0;

  return (
    <ModuleLayout module="finance" navItems={financeNavItems}>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Asset Management</h1>
            <p className="text-muted-foreground text-sm mt-1">Track and manage school assets and maintenance</p>
          </div>
          <Button onClick={openCreate} data-testid="button-register-asset"><Plus className="w-4 h-4 mr-2" />Register New Asset</Button>
        </div>

        <StatsGrid>
          <StatsCard title="Total Assets" value={summaryData?.totalAssets || 0} icon={Package} iconColor="text-blue-500" />
          <StatsCard title="Total Asset Value" value={`PKR ${totalValue.toLocaleString()}`} icon={Package} iconColor="text-green-500" />
          <StatsCard title="Under Repair" value={underRepair} icon={Wrench} iconColor="text-orange-500" />
          <StatsCard title="Due for Maintenance" value={dueSoon} icon={AlertTriangle} iconColor="text-red-500" subtitle="Next 7 days" />
        </StatsGrid>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[180px]">
                <Label className="text-xs">Search</Label>
                <Input placeholder="Search by name or code..." value={search} onChange={e => setSearch(e.target.value)} data-testid="input-search-assets" />
              </div>
              <div className="min-w-[140px]">
                <Label className="text-xs">Category</Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger data-testid="filter-category"><SelectValue placeholder="All Categories" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-[140px]">
                <Label className="text-xs">Condition</Label>
                <Select value={filterCondition} onValueChange={setFilterCondition}>
                  <SelectTrigger data-testid="filter-condition"><SelectValue placeholder="All Conditions" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Conditions</SelectItem>
                    {CONDITIONS.map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {(search || filterCategory || filterCondition) && (
                <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setFilterCategory(""); setFilterCondition(""); }}>Clear</Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Asset Code</TableHead>
                  <TableHead className="whitespace-nowrap">Asset Name</TableHead>
                  <TableHead className="whitespace-nowrap">Category</TableHead>
                  <TableHead className="whitespace-nowrap">Condition</TableHead>
                  <TableHead className="whitespace-nowrap">Location</TableHead>
                  <TableHead className="whitespace-nowrap">Assigned To</TableHead>
                  <TableHead className="whitespace-nowrap">Current Value</TableHead>
                  <TableHead className="whitespace-nowrap">Warranty Expiry</TableHead>
                  <TableHead className="whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 9 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
                  ))
                ) : assets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-16">
                      <div className="flex flex-col items-center gap-3 text-center" data-testid="assets-empty-state">
                        <div className="rounded-full bg-muted p-4"><Package className="w-8 h-8 text-muted-foreground" /></div>
                        <p className="font-semibold">No assets found</p>
                        <p className="text-sm text-muted-foreground">Register your first asset to get started.</p>
                        <Button size="sm" onClick={openCreate} data-testid="button-empty-register"><Plus className="w-4 h-4 mr-1" />Register Asset</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : assets.map((asset: Asset) => (
                  <TableRow key={asset.id} data-testid={`row-asset-${asset.id}`}>
                    <TableCell className="font-mono text-xs whitespace-nowrap">{asset.assetCode}</TableCell>
                    <TableCell className="whitespace-nowrap font-medium">{asset.assetName}</TableCell>
                    <TableCell><Badge label={asset.category} colorClass={CATEGORY_COLORS[asset.category] || CATEGORY_COLORS.other} /></TableCell>
                    <TableCell><Badge label={asset.condition} colorClass={CONDITION_COLORS[asset.condition] || ""} /></TableCell>
                    <TableCell className="whitespace-nowrap text-sm">{asset.location || "—"}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm">{asset.assignedTo || "—"}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm">{asset.currentValue != null ? `PKR ${asset.currentValue.toLocaleString()}` : "—"}</TableCell>
                    <TableCell className={`whitespace-nowrap text-sm ${isWarrantyExpired(asset.warrantyExpiry) ? "text-red-600 font-medium" : ""}`}>{asset.warrantyExpiry || "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(asset)} data-testid={`button-edit-asset-${asset.id}`}><Edit className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => setViewAsset(asset)} data-testid={`button-view-asset-${asset.id}`}><Eye className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteId(asset.id)} data-testid={`button-delete-asset-${asset.id}`}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Create/Edit Asset Modal */}
      <Dialog open={createOpen || !!editAsset} onOpenChange={v => { if (!v) { setCreateOpen(false); setEditAsset(null); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editAsset ? "Edit Asset" : "Register New Asset"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Asset Name *</Label><Input value={assetForm.assetName} onChange={e => setAssetForm(f => ({ ...f, assetName: e.target.value }))} data-testid="input-asset-name" /></div>
              <div><Label>Asset Code</Label><Input value={assetForm.assetCode} onChange={e => setAssetForm(f => ({ ...f, assetCode: e.target.value }))} placeholder="Auto-generated" data-testid="input-asset-code" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Category *</Label>
                <Select value={assetForm.category} onValueChange={v => setAssetForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger data-testid="select-asset-category"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Condition</Label>
                <Select value={assetForm.condition} onValueChange={v => setAssetForm(f => ({ ...f, condition: v }))}>
                  <SelectTrigger data-testid="select-asset-condition"><SelectValue /></SelectTrigger>
                  <SelectContent>{CONDITIONS.map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace("_", " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Purchase Date</Label><Input type="date" value={assetForm.purchaseDate} onChange={e => setAssetForm(f => ({ ...f, purchaseDate: e.target.value }))} data-testid="input-purchase-date" /></div>
              <div><Label>Warranty Expiry</Label><Input type="date" value={assetForm.warrantyExpiry} onChange={e => setAssetForm(f => ({ ...f, warrantyExpiry: e.target.value }))} data-testid="input-warranty-expiry" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Purchase Price (PKR)</Label><Input type="number" value={assetForm.purchasePrice} onChange={e => setAssetForm(f => ({ ...f, purchasePrice: e.target.value }))} data-testid="input-purchase-price" /></div>
              <div><Label>Current Value (PKR)</Label><Input type="number" value={assetForm.currentValue} onChange={e => setAssetForm(f => ({ ...f, currentValue: e.target.value }))} data-testid="input-current-value" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Location</Label><Input value={assetForm.location} onChange={e => setAssetForm(f => ({ ...f, location: e.target.value }))} data-testid="input-location" /></div>
              <div><Label>Assigned To</Label><Input value={assetForm.assignedTo} onChange={e => setAssetForm(f => ({ ...f, assignedTo: e.target.value }))} data-testid="input-assigned-to" /></div>
            </div>
            <div><Label>Notes</Label><Textarea value={assetForm.notes} onChange={e => setAssetForm(f => ({ ...f, notes: e.target.value }))} rows={2} data-testid="input-asset-notes" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); setEditAsset(null); }}>Cancel</Button>
            <Button onClick={handleAssetSubmit} disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-asset-submit">
              {editAsset ? "Save Changes" : "Register Asset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Asset?</AlertDialogTitle><AlertDialogDescription>This will delete the asset and all its maintenance logs. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="button-confirm-delete">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Detail Modal */}
      <Dialog open={!!viewAsset} onOpenChange={v => !v && setViewAsset(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <DialogTitle>{viewAsset?.assetName}</DialogTitle>
              <Button size="sm" onClick={() => setMaintOpen(true)} data-testid="button-log-maintenance"><Wrench className="w-4 h-4 mr-1" />Log Maintenance</Button>
            </div>
          </DialogHeader>
          {viewDetail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div><p className="text-muted-foreground text-xs">Asset Code</p><p className="font-mono font-medium">{viewDetail.assetCode}</p></div>
                <div><p className="text-muted-foreground text-xs">Category</p><Badge label={viewDetail.category} colorClass={CATEGORY_COLORS[viewDetail.category] || ""} /></div>
                <div><p className="text-muted-foreground text-xs">Condition</p><Badge label={viewDetail.condition} colorClass={CONDITION_COLORS[viewDetail.condition] || ""} /></div>
                <div><p className="text-muted-foreground text-xs">Location</p><p>{viewDetail.location || "—"}</p></div>
                <div><p className="text-muted-foreground text-xs">Assigned To</p><p>{viewDetail.assignedTo || "—"}</p></div>
                <div><p className="text-muted-foreground text-xs">Current Value</p><p>{viewDetail.currentValue != null ? `PKR ${viewDetail.currentValue.toLocaleString()}` : "—"}</p></div>
                <div><p className="text-muted-foreground text-xs">Purchase Date</p><p>{viewDetail.purchaseDate || "—"}</p></div>
                <div><p className="text-muted-foreground text-xs">Warranty Expiry</p><p className={isWarrantyExpired(viewDetail.warrantyExpiry) ? "text-red-600 font-medium" : ""}>{viewDetail.warrantyExpiry || "—"}</p></div>
                <div><p className="text-muted-foreground text-xs">Purchase Price</p><p>{viewDetail.purchasePrice != null ? `PKR ${viewDetail.purchasePrice.toLocaleString()}` : "—"}</p></div>
              </div>
              {viewDetail.notes && <div className="text-sm"><p className="text-muted-foreground text-xs mb-1">Notes</p><p className="text-sm">{viewDetail.notes}</p></div>}

              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Clock className="w-4 h-4" />Maintenance History</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Cost</TableHead>
                        <TableHead>Performed By</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Next Due</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(!viewDetail.maintenanceLogs || viewDetail.maintenanceLogs.length === 0) ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No maintenance logs yet.</TableCell></TableRow>
                      ) : viewDetail.maintenanceLogs.map((log: AssetMaintenanceLog) => (
                        <TableRow key={log.id} data-testid={`row-maint-${log.id}`}>
                          <TableCell className="capitalize text-xs">{log.maintenanceType}</TableCell>
                          <TableCell className="text-xs max-w-[180px] truncate">{log.description}</TableCell>
                          <TableCell className="text-xs">{log.cost != null ? `PKR ${log.cost.toLocaleString()}` : "—"}</TableCell>
                          <TableCell className="text-xs">{log.performedBy}</TableCell>
                          <TableCell className="text-xs">{log.performedAt}</TableCell>
                          <TableCell className="text-xs">{log.nextMaintenanceDate || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Log Maintenance Modal */}
      <Dialog open={maintOpen} onOpenChange={v => { if (!v) { setMaintOpen(false); setMaintForm(emptyMaintForm); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Log Maintenance — {viewAsset?.assetName}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Maintenance Type *</Label>
              <Select value={maintForm.maintenanceType} onValueChange={v => setMaintForm(f => ({ ...f, maintenanceType: v }))}>
                <SelectTrigger data-testid="select-maint-type"><SelectValue /></SelectTrigger>
                <SelectContent>{MAINTENANCE_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Description *</Label><Textarea value={maintForm.description} onChange={e => setMaintForm(f => ({ ...f, description: e.target.value }))} rows={2} data-testid="input-maint-description" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Performed At *</Label><Input type="date" value={maintForm.performedAt} onChange={e => setMaintForm(f => ({ ...f, performedAt: e.target.value }))} data-testid="input-maint-performed-at" /></div>
              <div><Label>Cost (PKR)</Label><Input type="number" value={maintForm.cost} onChange={e => setMaintForm(f => ({ ...f, cost: e.target.value }))} data-testid="input-maint-cost" /></div>
            </div>
            <div><Label>Performed By *</Label><Input value={maintForm.performedBy} onChange={e => setMaintForm(f => ({ ...f, performedBy: e.target.value }))} data-testid="input-maint-performed-by" /></div>
            <div><Label>Next Maintenance Date</Label><Input type="date" value={maintForm.nextMaintenanceDate} onChange={e => setMaintForm(f => ({ ...f, nextMaintenanceDate: e.target.value }))} data-testid="input-next-maint-date" /></div>
            <div><Label>Update Condition</Label>
              <Select value={maintForm.condition} onValueChange={v => setMaintForm(f => ({ ...f, condition: v }))}>
                <SelectTrigger data-testid="select-maint-condition"><SelectValue placeholder="Keep current condition" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Keep current</SelectItem>
                  {CONDITIONS.map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace("_", " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setMaintOpen(false); setMaintForm(emptyMaintForm); }}>Cancel</Button>
            <Button onClick={handleMaintSubmit} disabled={maintMutation.isPending} data-testid="button-maint-submit">Log Maintenance</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
}
