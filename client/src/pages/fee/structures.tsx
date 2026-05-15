import { useState } from "react";
import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { feeNavItems, useFeeStructures, useDiscountRules, useLateFeeRules, classOptions, sessionOptions, feeHeadOptions, discountTypes } from "./fee-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Edit, Settings, Percent, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
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
import { type FeeStructure, type InsertFeeStructure } from "@shared/schema";

const frequencyOptions = ["Monthly", "Quarterly", "Half-Yearly", "Yearly", "One-Time"] as const;
const discountCategories = ["Sibling", "Merit", "Staff Child", "Scholarship", "Early Bird", "Other"] as const;
const lateFeeTypes = ["Fixed", "Percentage", "Daily"] as const;

export default function FeeStructures() {
  const { structures, createStructure, updateStructure, deleteStructure, isPending } = useFeeStructures();
  const { rules: discountRules, createRule: createDiscountRule, deleteRule: deleteDiscountRule } = useDiscountRules();
  const { rules: lateFeeRules, createRule: createLateFeeRule, deleteRule: deleteLateFeeRule } = useLateFeeRules();
  const { toast } = useToast();

  const [structureDialogOpen, setStructureDialogOpen] = useState(false);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [lateFeeDialogOpen, setLateFeeDialogOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState<FeeStructure | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    class: "",
    academicSession: sessionOptions[1],
    feeHeads: [{ name: "Tuition Fee", amount: 0, frequency: "Monthly" as const }] as { name: string; amount: number; frequency: typeof frequencyOptions[number] }[],
    isActive: true,
  });

  const [discountFormData, setDiscountFormData] = useState({
    name: "",
    type: "Percentage" as "Percentage" | "Fixed",
    value: 0,
    category: "Other" as typeof discountCategories[number],
    applicableClasses: [] as string[],
    validFrom: new Date().toISOString().split("T")[0],
    isActive: true,
  });

  const [lateFeeFormData, setLateFeeFormData] = useState({
    name: "",
    type: "Fixed" as typeof lateFeeTypes[number],
    value: 0,
    gracePeriodDays: 7,
    maxLateFee: 0,
    isActive: true,
  });

  const resetForms = () => {
    setFormData({
      name: "",
      class: "",
      academicSession: sessionOptions[1],
      feeHeads: [{ name: "Tuition Fee", amount: 0, frequency: "Monthly" }],
      isActive: true,
    });
    setEditingStructure(null);
  };

  const handleAddFeeHead = () => {
    setFormData(prev => ({
      ...prev,
      feeHeads: [...prev.feeHeads, { name: "", amount: 0, frequency: "Monthly" as const }]
    }));
  };

  const handleRemoveFeeHead = (index: number) => {
    setFormData(prev => ({
      ...prev,
      feeHeads: prev.feeHeads.filter((_, i) => i !== index)
    }));
  };

  const handleFeeHeadChange = (index: number, field: "name" | "amount" | "frequency", value: string | number) => {
    setFormData(prev => ({
      ...prev,
      feeHeads: prev.feeHeads.map((fh, i) => 
        i === index ? { ...fh, [field]: field === "amount" ? Number(value) : value } : fh
      )
    }));
  };

  const handleSaveStructure = async () => {
    if (!formData.name || !formData.class || formData.feeHeads.length === 0) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    const totalAmount = formData.feeHeads.reduce((sum, fh) => sum + fh.amount, 0);

    try {
      const data: InsertFeeStructure = {
        name: formData.name,
        class: formData.class,
        academicSession: formData.academicSession,
        feeHeads: formData.feeHeads,
        totalAmount,
        isActive: formData.isActive,
      };

      if (editingStructure) {
        await updateStructure(editingStructure.id, data);
        toast({ title: "Success", description: "Fee structure updated successfully" });
      } else {
        await createStructure(data);
        toast({ title: "Success", description: "Fee structure created successfully" });
      }
      setStructureDialogOpen(false);
      resetForms();
    } catch (error) {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    }
  };

  const handleEditStructure = (structure: FeeStructure) => {
    setEditingStructure(structure);
    setFormData({
      name: structure.name,
      class: structure.class,
      academicSession: structure.academicSession,
      feeHeads: structure.feeHeads,
      isActive: structure.isActive,
    });
    setStructureDialogOpen(true);
  };

  const handleDeleteStructure = async (id: string) => {
    try {
      await deleteStructure(id);
      toast({ title: "Success", description: "Fee structure deleted" });
    } catch (error) {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    }
  };

  const handleSaveDiscount = async () => {
    if (!discountFormData.name || discountFormData.value <= 0) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    try {
      await createDiscountRule({
        name: discountFormData.name,
        type: discountFormData.type,
        value: discountFormData.value,
        category: discountFormData.category,
        validFrom: discountFormData.validFrom,
        applicableClasses: discountFormData.applicableClasses.length > 0 ? discountFormData.applicableClasses : undefined,
        isActive: discountFormData.isActive,
      });
      toast({ title: "Success", description: "Discount rule created successfully" });
      setDiscountDialogOpen(false);
      setDiscountFormData({
        name: "",
        type: "Percentage",
        value: 0,
        category: "Other",
        applicableClasses: [],
        validFrom: new Date().toISOString().split("T")[0],
        isActive: true,
      });
    } catch (error) {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    }
  };

  const handleSaveLateFee = async () => {
    if (!lateFeeFormData.name || lateFeeFormData.value <= 0) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    try {
      await createLateFeeRule({
        name: lateFeeFormData.name,
        type: lateFeeFormData.type,
        value: lateFeeFormData.value,
        gracePeriodDays: lateFeeFormData.gracePeriodDays,
        maxLateFee: lateFeeFormData.maxLateFee > 0 ? lateFeeFormData.maxLateFee : undefined,
        isActive: lateFeeFormData.isActive,
      });
      toast({ title: "Success", description: "Late fee rule created successfully" });
      setLateFeeDialogOpen(false);
      setLateFeeFormData({
        name: "",
        type: "Fixed",
        value: 0,
        gracePeriodDays: 7,
        maxLateFee: 0,
        isActive: true,
      });
    } catch (error) {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    }
  };

  return (
    <ModuleLayout module="fee" navItems={feeNavItems}>
      <PageHeader
        title="Fee Structure Management"
        description="Configure fee structures by class and session, manage discounts and late fee rules"
      />

      <Tabs defaultValue="structures" className="space-y-4">
        <TabsList>
          <TabsTrigger value="structures" data-testid="tab-structures">
            <Settings className="w-4 h-4 mr-2" />
            Fee Structures
          </TabsTrigger>
          <TabsTrigger value="discounts" data-testid="tab-discounts">
            <Percent className="w-4 h-4 mr-2" />
            Discounts
          </TabsTrigger>
          <TabsTrigger value="latefees" data-testid="tab-latefees">
            <Clock className="w-4 h-4 mr-2" />
            Late Fees
          </TabsTrigger>
        </TabsList>

        <TabsContent value="structures" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Fee Structures by Class</h3>
            <Button onClick={() => { resetForms(); setStructureDialogOpen(true); }} data-testid="button-add-structure">
              <Plus className="w-4 h-4 mr-2" />
              Add Fee Structure
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {structures.map((structure) => (
              <Card key={structure.id} data-testid={`card-structure-${structure.id}`}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <div>
                    <CardTitle className="text-lg">{structure.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">Class {structure.class} | {structure.academicSession}</p>
                  </div>
                  <Badge variant={structure.isActive ? "default" : "secondary"}>
                    {structure.isActive ? "Active" : "Inactive"}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {structure.feeHeads.map((fh, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{fh.name} <span className="text-muted-foreground text-xs">({fh.frequency})</span></span>
                        <span className="font-medium">Rs. {fh.amount.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span>Total</span>
                      <span>Rs. {structure.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" onClick={() => handleEditStructure(structure)} data-testid={`button-edit-structure-${structure.id}`}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDeleteStructure(structure.id)} data-testid={`button-delete-structure-${structure.id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {structures.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No fee structures defined yet. Click "Add Fee Structure" to create one.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="discounts" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Discount Rules</h3>
            <Button onClick={() => setDiscountDialogOpen(true)} data-testid="button-add-discount">
              <Plus className="w-4 h-4 mr-2" />
              Add Discount Rule
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Applicable Classes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discountRules.map((rule) => (
                  <TableRow key={rule.id} data-testid={`row-discount-${rule.id}`}>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>{rule.category}</TableCell>
                    <TableCell>{rule.type}</TableCell>
                    <TableCell>
                      {rule.type === "Percentage" ? `${rule.value}%` : `Rs. ${rule.value.toLocaleString()}`}
                    </TableCell>
                    <TableCell>
                      {(rule.applicableClasses?.length ?? 0) > 0 
                        ? rule.applicableClasses?.join(", ") 
                        : "All Classes"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={rule.isActive ? "default" : "secondary"}>
                        {rule.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => deleteDiscountRule(rule.id)} data-testid={`button-delete-discount-${rule.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {discountRules.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No discount rules defined yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="latefees" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Late Fee Rules</h3>
            <Button onClick={() => setLateFeeDialogOpen(true)} data-testid="button-add-latefee">
              <Plus className="w-4 h-4 mr-2" />
              Add Late Fee Rule
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Grace Period</TableHead>
                  <TableHead>Fee Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Max Late Fee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lateFeeRules.map((rule) => (
                  <TableRow key={rule.id} data-testid={`row-latefee-${rule.id}`}>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>{rule.gracePeriodDays} days</TableCell>
                    <TableCell>{rule.type}</TableCell>
                    <TableCell>
                      {rule.type === "Percentage" ? `${rule.value}%` : `Rs. ${rule.value.toLocaleString()}`}
                    </TableCell>
                    <TableCell>{rule.maxLateFee ? `Rs. ${rule.maxLateFee.toLocaleString()}` : "-"}</TableCell>
                    <TableCell>
                      <Badge variant={rule.isActive ? "default" : "secondary"}>
                        {rule.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => deleteLateFeeRule(rule.id)} data-testid={`button-delete-latefee-${rule.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {lateFeeRules.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No late fee rules defined yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={structureDialogOpen} onOpenChange={setStructureDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingStructure ? "Edit Fee Structure" : "Add Fee Structure"}</DialogTitle>
            <DialogDescription>Define fee heads and amounts for a class and session</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Structure Name</Label>
              <Input
                placeholder="e.g., Class 5 Fee Structure 2025-2026"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                data-testid="input-structure-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={formData.class} onValueChange={(v) => setFormData(prev => ({ ...prev, class: v }))}>
                  <SelectTrigger data-testid="select-class">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classOptions.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Academic Session</Label>
                <Select value={formData.academicSession} onValueChange={(v) => setFormData(prev => ({ ...prev, academicSession: v }))}>
                  <SelectTrigger data-testid="select-session">
                    <SelectValue placeholder="Select session" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessionOptions.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Fee Heads</Label>
                <Button type="button" size="sm" variant="outline" onClick={handleAddFeeHead} data-testid="button-add-fee-head">
                  <Plus className="w-4 h-4 mr-1" /> Add Fee Head
                </Button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {formData.feeHeads.map((fh, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Select 
                      value={fh.name} 
                      onValueChange={(v) => handleFeeHeadChange(index, "name", v)}
                    >
                      <SelectTrigger className="flex-1" data-testid={`select-fee-head-${index}`}>
                        <SelectValue placeholder="Select fee head" />
                      </SelectTrigger>
                      <SelectContent>
                        {feeHeadOptions.map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="Amount"
                      className="w-28"
                      value={fh.amount || ""}
                      onChange={(e) => handleFeeHeadChange(index, "amount", e.target.value)}
                      data-testid={`input-fee-amount-${index}`}
                    />
                    <Select 
                      value={fh.frequency} 
                      onValueChange={(v) => handleFeeHeadChange(index, "frequency", v)}
                    >
                      <SelectTrigger className="w-32" data-testid={`select-frequency-${index}`}>
                        <SelectValue placeholder="Frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        {frequencyOptions.map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.feeHeads.length > 1 && (
                      <Button type="button" size="icon" variant="ghost" onClick={() => handleRemoveFeeHead(index)} data-testid={`button-remove-fee-head-${index}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4 flex justify-between items-center">
              <div className="text-lg font-semibold">
                Total: Rs. {formData.feeHeads.reduce((sum, fh) => sum + (fh.amount || 0), 0).toLocaleString()}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStructureDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveStructure} disabled={isPending} data-testid="button-save-structure">
                  {isPending ? "Saving..." : "Save Structure"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={discountDialogOpen} onOpenChange={setDiscountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Discount Rule</DialogTitle>
            <DialogDescription>Create a new discount rule for fee concessions</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Discount Name</Label>
              <Input
                placeholder="e.g., Sibling Discount, Merit Scholarship"
                value={discountFormData.name}
                onChange={(e) => setDiscountFormData(prev => ({ ...prev, name: e.target.value }))}
                data-testid="input-discount-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select 
                  value={discountFormData.category} 
                  onValueChange={(v: typeof discountCategories[number]) => setDiscountFormData(prev => ({ ...prev, category: v }))}
                >
                  <SelectTrigger data-testid="select-discount-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {discountCategories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valid From</Label>
                <Input
                  type="date"
                  value={discountFormData.validFrom}
                  onChange={(e) => setDiscountFormData(prev => ({ ...prev, validFrom: e.target.value }))}
                  data-testid="input-valid-from"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select 
                  value={discountFormData.type} 
                  onValueChange={(v: "Percentage" | "Fixed") => setDiscountFormData(prev => ({ ...prev, type: v }))}
                >
                  <SelectTrigger data-testid="select-discount-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {discountTypes.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Value</Label>
                <Input
                  type="number"
                  placeholder={discountFormData.type === "Percentage" ? "e.g., 10" : "e.g., 5000"}
                  value={discountFormData.value || ""}
                  onChange={(e) => setDiscountFormData(prev => ({ ...prev, value: Number(e.target.value) }))}
                  data-testid="input-discount-value"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDiscountDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveDiscount} data-testid="button-save-discount">Save Discount</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={lateFeeDialogOpen} onOpenChange={setLateFeeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Late Fee Rule</DialogTitle>
            <DialogDescription>Define late payment penalty rules</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rule Name</Label>
              <Input
                placeholder="e.g., Standard Late Fee"
                value={lateFeeFormData.name}
                onChange={(e) => setLateFeeFormData(prev => ({ ...prev, name: e.target.value }))}
                data-testid="input-latefee-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Grace Period (Days)</Label>
                <Input
                  type="number"
                  placeholder="e.g., 7"
                  value={lateFeeFormData.gracePeriodDays || ""}
                  onChange={(e) => setLateFeeFormData(prev => ({ ...prev, gracePeriodDays: Number(e.target.value) }))}
                  data-testid="input-grace-period"
                />
              </div>
              <div className="space-y-2">
                <Label>Fee Type</Label>
                <Select 
                  value={lateFeeFormData.type} 
                  onValueChange={(v: typeof lateFeeTypes[number]) => setLateFeeFormData(prev => ({ ...prev, type: v }))}
                >
                  <SelectTrigger data-testid="select-latefee-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {lateFeeTypes.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Value ({lateFeeFormData.type === "Percentage" ? "%" : lateFeeFormData.type === "Daily" ? "Rs/day" : "Rs"})</Label>
                <Input
                  type="number"
                  placeholder={lateFeeFormData.type === "Percentage" ? "e.g., 5" : "e.g., 50"}
                  value={lateFeeFormData.value || ""}
                  onChange={(e) => setLateFeeFormData(prev => ({ ...prev, value: Number(e.target.value) }))}
                  data-testid="input-latefee-value"
                />
              </div>
              <div className="space-y-2">
                <Label>Maximum Late Fee (Rs)</Label>
                <Input
                  type="number"
                  placeholder="e.g., 2000"
                  value={lateFeeFormData.maxLateFee || ""}
                  onChange={(e) => setLateFeeFormData(prev => ({ ...prev, maxLateFee: Number(e.target.value) }))}
                  data-testid="input-max-latefee"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setLateFeeDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveLateFee} data-testid="button-save-latefee">Save Late Fee Rule</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
}
