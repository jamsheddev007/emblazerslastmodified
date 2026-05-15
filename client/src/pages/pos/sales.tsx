import { useState } from "react";
import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { posNavItems, usePosData } from "./pos-data";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Eye } from "lucide-react";
import { Link } from "wouter";

export default function Sales() {
  const { sales } = usePosData();
  const [selectedSale, setSelectedSale] = useState<typeof sales[0] | null>(null);
  const [open, setOpen] = useState(false);

  const handleView = (sale: typeof sales[0]) => {
    setSelectedSale(sale);
    setOpen(true);
  };

  const columns = [
    { key: "invoiceNo" as const, label: "Invoice No", sortable: true },
    { key: "date" as const, label: "Date", sortable: true },
    { key: "customer" as const, label: "Customer" },
    { key: "items" as const, label: "Items", render: (item: typeof sales[0]) => item.items.length },
    { key: "grandTotal" as const, label: "Total", render: (item: typeof sales[0]) => `Rs. ${item.grandTotal.toLocaleString()}` },
  ];

  const actions = (item: typeof sales[0]) => (
    <Button variant="ghost" size="icon" onClick={() => handleView(item)} data-testid={`button-view-${item.id}`}>
      <Eye className="w-4 h-4" />
    </Button>
  );

  return (
    <ModuleLayout module="pos" navItems={posNavItems}>
      <div className="space-y-6">
        <PageHeader
          title="Sales"
          description="View all sales transactions"
          actions={
            <Link href="/pos/new">
              <Button data-testid="button-new-sale">
                <Plus className="w-4 h-4 mr-2" />
                New Sale
              </Button>
            </Link>
          }
        />

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Sale Details - {selectedSale?.invoiceNo}</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <div className="text-sm text-muted-foreground">Date</div>
                  <div className="font-medium">{selectedSale?.date}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Customer</div>
                  <div className="font-medium">{selectedSale?.customer}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Amount</div>
                  <div className="font-medium text-lg">Rs. {selectedSale?.grandTotal.toLocaleString()}</div>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedSale?.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.itemName}</TableCell>
                      <TableCell className="text-right">Rs. {item.price.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">Rs. {item.total.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>

        <DataTable
          data={sales}
          columns={columns}
          searchKey="customer"
          searchPlaceholder="Search by customer..."
          actions={actions}
          getRowKey={(item) => item.id}
        />
      </div>
    </ModuleLayout>
  );
}
