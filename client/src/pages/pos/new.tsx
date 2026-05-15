import { useState } from "react";
import { useLocation } from "wouter";
import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { posNavItems, usePosData } from "./pos-data";
import { useToast } from "@/hooks/use-toast";
import { Plus, Minus, ShoppingCart } from "lucide-react";

export default function NewSale() {
  const { items, addSale, isPending } = usePosData();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [cart, setCart] = useState<{ itemId: string; quantity: number }[]>([]);
  const [customer, setCustomer] = useState("");

  const addToCart = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item || item.stock === 0) return;
    
    const existing = cart.find((c) => c.itemId === itemId);
    if (existing) {
      if (existing.quantity >= item.stock) {
        toast({ title: "Warning", description: "Maximum stock reached", variant: "destructive" });
        return;
      }
      setCart(cart.map((c) => c.itemId === itemId ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { itemId, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId: string) => {
    const existing = cart.find((c) => c.itemId === itemId);
    if (existing && existing.quantity > 1) {
      setCart(cart.map((c) => c.itemId === itemId ? { ...c, quantity: c.quantity - 1 } : c));
    } else {
      setCart(cart.filter((c) => c.itemId !== itemId));
    }
  };

  const getTotal = () => {
    return cart.reduce((acc, c) => {
      const item = items.find((i) => i.id === c.itemId);
      return acc + (item ? item.price * c.quantity : 0);
    }, 0);
  };

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      toast({ title: "Error", description: "Cart is empty", variant: "destructive" });
      return;
    }

    try {
      const saleItems = cart.map(c => {
        const item = items.find(i => i.id === c.itemId)!;
        return {
          itemId: c.itemId,
          itemName: item.name,
          quantity: c.quantity,
          price: item.price,
          total: item.price * c.quantity
        };
      });

      await addSale({
        invoiceNo: `INV${Date.now()}`,
        customer: customer || "Walk-in Customer",
        date: new Date().toISOString().split("T")[0],
        items: saleItems,
        grandTotal: getTotal()
      });

      toast({ title: "Success", description: "Sale completed successfully" });
      setCart([]);
      setCustomer("");
      setLocation("/pos/sales");
    } catch (error) {
      console.error("Failed to complete sale:", error);
      toast({ title: "Error", description: "Failed to complete sale. Please try again.", variant: "destructive" });
    }
  };

  return (
    <ModuleLayout module="pos" navItems={posNavItems}>
      <div className="space-y-6">
        <PageHeader
          title="New Sale"
          description="Create a new sales transaction"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Items</CardTitle>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No items available. Add items first in the Items section.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="border rounded-md p-3 flex items-center justify-between gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{item.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Rs. {item.price} | Stock: {item.stock}
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => addToCart(item.id)}
                          disabled={item.stock === 0}
                          data-testid={`button-add-${item.id}`}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Cart
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Customer Name</Label>
                  <Input
                    placeholder="Walk-in Customer"
                    value={customer}
                    onChange={(e) => setCustomer(e.target.value)}
                    data-testid="input-customer"
                  />
                </div>

                {cart.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    No items in cart
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cart.map((c) => {
                      const item = items.find((i) => i.id === c.itemId);
                      if (!item) return null;
                      return (
                        <div key={c.itemId} className="flex items-center justify-between gap-2 text-sm">
                          <div className="flex-1 min-w-0">
                            <div className="truncate">{item.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Rs. {item.price} x {c.quantity}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button size="icon" variant="ghost" onClick={() => removeFromCart(c.itemId)}>
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-6 text-center">{c.quantity}</span>
                            <Button size="icon" variant="ghost" onClick={() => addToCart(c.itemId)}>
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>Rs. {getTotal().toLocaleString()}</span>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  disabled={cart.length === 0 || isPending} 
                  onClick={handleCompleteSale}
                  data-testid="button-complete-sale"
                >
                  {isPending ? "Processing..." : "Complete Sale"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ModuleLayout>
  );
}
