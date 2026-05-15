import { useState } from "react";
import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { financeNavItems, useVendors, vendorCategories } from "./finance-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Search, Users, Phone, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { type Vendor, type InsertVendor } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function FinanceVendors() {
  const { vendors, createVendor, updateVendor, deleteVendor, isPending } = useVendors();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    category: "Supplier" as typeof vendorCategories[number],
    bankName: "",
    accountNo: "",
    taxId: "",
    status: "Active" as "Active" | "Inactive",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
      category: "Supplier",
      bankName: "",
      accountNo: "",
      taxId: "",
      status: "Active",
    });
    setEditingVendor(null);
  };

  const handleOpenDialog = (vendor?: Vendor) => {
    if (vendor) {
      setEditingVendor(vendor);
      setFormData({
        name: vendor.name,
        contactPerson: vendor.contactPerson || "",
        phone: vendor.phone,
        email: vendor.email || "",
        address: vendor.address,
        category: vendor.category,
        bankName: vendor.bankName || "",
        accountNo: vendor.accountNo || "",
        taxId: vendor.taxId || "",
        status: vendor.status,
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSaveVendor = async () => {
    if (!formData.name || !formData.phone || !formData.address) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    try {
      const vendorData: InsertVendor = {
        name: formData.name,
        contactPerson: formData.contactPerson || undefined,
        phone: formData.phone,
        email: formData.email || undefined,
        address: formData.address,
        category: formData.category,
        bankName: formData.bankName || undefined,
        accountNo: formData.accountNo || undefined,
        taxId: formData.taxId || undefined,
        status: formData.status,
      };

      if (editingVendor) {
        await updateVendor(editingVendor.id, vendorData);
        toast({ title: "Success", description: "Vendor updated successfully" });
      } else {
        await createVendor(vendorData);
        toast({ title: "Success", description: "Vendor created successfully" });
      }
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    }
  };

  const handleDeleteVendor = async (id: string) => {
    try {
      await deleteVendor(id);
      toast({ title: "Success", description: "Vendor deleted" });
    } catch (error) {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    }
  };

  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.vendorId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ModuleLayout module="finance" navItems={financeNavItems}>
      <PageHeader
        title="Vendor Management"
        description="Manage vendors and suppliers for expense tracking"
      />

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendors.length}</div>
            <p className="text-xs text-muted-foreground">{vendors.filter(v => v.status === "Active").length} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Suppliers</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendors.filter(v => v.category === "Supplier").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Service Providers</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendors.filter(v => v.category === "Service Provider").length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search vendors..."
              className="pl-10 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-vendor"
            />
          </div>
          <Button onClick={() => handleOpenDialog()} data-testid="button-add-vendor">
            <Plus className="w-4 h-4 mr-2" />
            Add Vendor
          </Button>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVendors.map((vendor) => (
                <TableRow key={vendor.id} data-testid={`row-vendor-${vendor.id}`}>
                  <TableCell className="font-medium">{vendor.vendorId}</TableCell>
                  <TableCell>{vendor.name}</TableCell>
                  <TableCell>{vendor.category}</TableCell>
                  <TableCell>{vendor.contactPerson || "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {vendor.phone}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={vendor.status === "Active" ? "default" : "secondary"}>
                      {vendor.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleOpenDialog(vendor)} data-testid={`button-edit-vendor-${vendor.id}`}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteVendor(vendor.id)} data-testid={`button-delete-vendor-${vendor.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredVendors.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No vendors found. Click "Add Vendor" to create one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingVendor ? "Edit Vendor" : "Add Vendor"}</DialogTitle>
            <DialogDescription>Manage vendor information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vendor Name *</Label>
                <Input
                  placeholder="Enter vendor name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  data-testid="input-vendor-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(v: typeof vendorCategories[number]) => setFormData(prev => ({ ...prev, category: v }))}
                >
                  <SelectTrigger data-testid="select-vendor-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {vendorCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Person</Label>
                <Input
                  placeholder="Enter contact person"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                  data-testid="input-contact-person"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  data-testid="input-vendor-phone"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  data-testid="input-vendor-email"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(v: "Active" | "Inactive") => setFormData(prev => ({ ...prev, status: v }))}
                >
                  <SelectTrigger data-testid="select-vendor-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Address *</Label>
              <Input
                placeholder="Enter full address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                data-testid="input-vendor-address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bank Name</Label>
                <Input
                  placeholder="Enter bank name"
                  value={formData.bankName}
                  onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                  data-testid="input-bank-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input
                  placeholder="Enter account number"
                  value={formData.accountNo}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountNo: e.target.value }))}
                  data-testid="input-account-no"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveVendor} disabled={isPending} data-testid="button-save-vendor">
                {isPending ? "Saving..." : editingVendor ? "Update Vendor" : "Add Vendor"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
}
