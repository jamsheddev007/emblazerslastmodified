import { useState, useRef } from "react";
import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { posNavItems, usePosData, categories } from "./pos-data";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Upload, Eye } from "lucide-react";
import ExcelJS from 'exceljs';

export default function Items() {
  const { items, addItem, updateItem, isPending } = usePosData();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<typeof items[0] | null>(null);
  const [viewingItem, setViewingItem] = useState<typeof items[0] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<typeof categories[number]>("Stationery");
  const [price, setPrice] = useState(0);
  const [stock, setStock] = useState(0);

  const resetForm = () => {
    setName("");
    setCategory("Stationery");
    setPrice(0);
    setStock(0);
    setEditingItem(null);
  };

  const handleSubmit = async () => {
    if (!name || !price) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    try {
      if (editingItem) {
        // Keep existing code
        await updateItem(editingItem.id, { itemCode: editingItem.itemCode, name, category, price, stock });
        toast({ title: "Success", description: "Item updated successfully" });
      } else {
        // Backend handles auto-generation
        await addItem({ itemCode: "AUTO", name, category, price, stock });
        toast({ title: "Success", description: "Item added successfully" });
      }
      setIsOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to save item:", error);
      toast({ title: "Error", description: "Failed to save item. Please try again.", variant: "destructive" });
    }
  };

  const handleEdit = (item: typeof items[0]) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setPrice(item.price);
    setStock(item.stock);
    setIsOpen(true);
  };

  const handleView = (item: typeof items[0]) => {
    setViewingItem(item);
    setViewOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const ws = workbook.worksheets[0];

      const headers: string[] = [];
      ws.getRow(1).eachCell((cell, colNumber) => {
        headers[colNumber] = String(cell.value ?? "").toLowerCase();
      });

      const data: Record<string, unknown>[] = [];
      ws.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const obj: Record<string, unknown> = {};
        row.eachCell((cell, colNumber) => {
          if (headers[colNumber]) obj[headers[colNumber]] = cell.value;
        });
        data.push(obj);
      });

      const validCategories: typeof categories[number][] = [...categories];
      let importedCount = 0;
      for (const row of data) {
        if (row.name && row.price) {
          const rawCat = String(row.category || "");
          const category: typeof categories[number] = (validCategories as string[]).includes(rawCat)
            ? (rawCat as typeof categories[number])
            : "Other";
          await addItem({
            itemCode: "AUTO",
            name: String(row.name),
            category,
            price: Number(row.price),
            stock: Number(row.stock || 0),
          });
          importedCount++;
        }
      }

      toast({ title: "Success", description: `Imported ${importedCount} items successfully` });
    } catch (error) {
      console.error("Import error:", error);
      toast({ title: "Error", description: "Failed to import items", variant: "destructive" });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const columns = [
    { key: "itemCode" as const, label: "Code" },
    { key: "name" as const, label: "Item Name", sortable: true },
    { key: "category" as const, label: "Category", render: (item: typeof items[0]) => <Badge variant="outline">{item.category}</Badge> },
    { key: "price" as const, label: "Price", render: (item: typeof items[0]) => `Rs. ${item.price.toLocaleString()}` },
    {
      key: "stock" as const,
      label: "Stock",
      render: (item: typeof items[0]) => (
        <span className={item.stock < 10 ? "text-red-500 font-medium" : ""}>
          {item.stock}
        </span>
      )
    },
  ];

  const actions = (item: typeof items[0]) => (
    <div className="flex gap-2">
      <Button variant="ghost" size="icon" onClick={() => handleView(item)} title="View Details">
        <Eye className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} data-testid={`button-edit-${item.id}`} title="Edit">
        <Edit className="w-4 h-4" />
      </Button>
    </div>
  );

  return (
    <ModuleLayout module="pos" navItems={posNavItems}>
      <div className="space-y-6">
        <PageHeader
          title="Items"
          description="Manage inventory items"
          actions={
            <div className="flex gap-2">
              <div className="hidden">
                <Input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx,.xls" />
              </div>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Import Excel
              </Button>
              <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-item">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingItem ? "Edit Item" : "Add New Item"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Item Code removed - auto generated */}
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Item Name *</Label>
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter item name"
                          data-testid="input-name"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Price *</Label>
                        <Input
                          type="number"
                          value={price}
                          onChange={(e) => setPrice(Number(e.target.value))}
                          min={0}
                          data-testid="input-price"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Stock</Label>
                        <Input
                          type="number"
                          value={stock}
                          onChange={(e) => setStock(Number(e.target.value))}
                          min={0}
                          data-testid="input-stock"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => { setIsOpen(false); resetForm(); }}>Cancel</Button>
                      <Button onClick={handleSubmit} disabled={isPending} data-testid="button-save-item">
                        {isPending ? "Saving..." : editingItem ? "Update Item" : "Add Item"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={viewOpen} onOpenChange={setViewOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Item Details</DialogTitle>
                  </DialogHeader>
                  {viewingItem && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground">Item Code</Label>
                          <p className="font-medium">{viewingItem.itemCode}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Category</Label>
                          <p><Badge variant="outline">{viewingItem.category}</Badge></p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Name</Label>
                          <p className="font-medium">{viewingItem.name}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Price</Label>
                          <p className="font-medium">Rs. {viewingItem.price.toLocaleString()}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Current Stock</Label>
                          <p className={`font-medium ${viewingItem.stock < 10 ? "text-red-500" : ""}`}>{viewingItem.stock}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          }
        />

        <DataTable
          data={items}
          columns={columns}
          searchKey="name"
          searchPlaceholder="Search items..."
          actions={actions}
          getRowKey={(item) => item.id}
        />
      </div>
    </ModuleLayout>
  );
}
