import { useState } from "react";
import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, StatusBadge } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { libraryNavItems, useLibraryData } from "./library-data";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit } from "lucide-react";

const categories = ["General", "Fiction", "Non-Fiction", "Reference", "Textbook", "Science", "History", "Biography", "Children"];
const bookStatuses = ["Available", "Issued", "Out of Stock"] as const;

export default function Books() {
  const { books, addBook, updateBook, isPending } = useLibraryData();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<typeof books[0] | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [accessionNo, setAccessionNo] = useState("");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState<string>(categories[0]);
  const [isbn, setIsbn] = useState("");
  const [status, setStatus] = useState<typeof bookStatuses[number]>("Available");
  const [totalCopies, setTotalCopies] = useState(1);

  const resetForm = () => {
    setAccessionNo("");
    setTitle("");
    setAuthor("");
    setCategory(categories[0]);
    setIsbn("");
    setStatus("Available");
    setTotalCopies(1);
    setEditingBook(null);
  };

  const handleSubmit = async () => {
    if (!accessionNo || !title || !author) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    try {
      if (editingBook) {
        await updateBook(editingBook.id, { accessionNo, title, author, category, isbn, status });
        toast({ title: "Success", description: "Book updated successfully" });
      } else {
        await addBook({
          accessionNo,
          title,
          author,
          category,
          isbn,
          status,
          totalCopies: totalCopies,
          availableCopies: status === "Available" ? totalCopies : 0
        });
        toast({ title: "Success", description: "Book added successfully" });
      }
      setIsOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to save book:", error);
      toast({ title: "Error", description: "Failed to save book. Please try again.", variant: "destructive" });
    }
  };

  const handleEdit = (book: typeof books[0]) => {
    setEditingBook(book);
    setAccessionNo(book.accessionNo);
    setTitle(book.title);
    setAuthor(book.author);
    setCategory(book.category);
    setIsbn(book.isbn || "");
    setStatus(book.status);
    // Note: totalCopies not editable here to avoid consistency issues
    setIsOpen(true);
  };

  const filteredBooks = categoryFilter === "all"
    ? books
    : books.filter(b => b.category === categoryFilter);

  const availableBooks = books.filter(b => b.status === "Available").length;
  const issuedBooks = books.filter(b => b.status === "Issued").length;

  const columns = [
    { key: "accessionNo" as const, label: "Acc No" },
    { key: "title" as const, label: "Title", sortable: true },
    { key: "author" as const, label: "Author" },
    { key: "category" as const, label: "Category" },
    { key: "isbn" as const, label: "ISBN" },
    { key: "totalCopies" as const, label: "Copies", render: (item: typeof books[0]) => `${item.availableCopies}/${item.totalCopies || 1}` },
    { key: "status" as const, label: "Status", render: (item: typeof books[0]) => <StatusBadge status={item.status} /> },
  ];

  const actions = (item: typeof books[0]) => (
    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} data-testid={`button-edit-${item.id}`}>
      <Edit className="w-4 h-4" />
    </Button>
  );

  return (
    <ModuleLayout module="library" navItems={libraryNavItems}>
      <div className="space-y-6">
        <PageHeader
          title="Books"
          description="Manage library book catalog"
          actions={
            <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-book">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Book
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingBook ? "Edit Book" : "Add New Book"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Accession No *</Label>
                      <Input
                        value={accessionNo}
                        onChange={(e) => setAccessionNo(e.target.value)}
                        placeholder="e.g., ACC001"
                        data-testid="input-accession-no"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>ISBN</Label>
                      <Input
                        value={isbn}
                        onChange={(e) => setIsbn(e.target.value)}
                        placeholder="e.g., 978-3-16-148410-0"
                        data-testid="input-isbn"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Book title"
                      data-testid="input-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Author *</Label>
                    <Input
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="Author name"
                      data-testid="input-author"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={category} onValueChange={setCategory}>
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
                    {!editingBook && (
                      <div className="space-y-2">
                        <Label>Total Copies</Label>
                        <Input
                          type="number"
                          min={1}
                          value={totalCopies}
                          onChange={(e) => setTotalCopies(parseInt(e.target.value) || 1)}
                          data-testid="input-total-copies"
                        />
                      </div>
                    )}
                    {editingBook && (
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                          <SelectTrigger data-testid="select-status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {bookStatuses.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => { setIsOpen(false); resetForm(); }}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isPending} data-testid="button-save-book">
                      {isPending ? "Saving..." : editingBook ? "Update Book" : "Add Book"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          }
        />

        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Filter by Category:</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-category-filter">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-4 ml-auto text-sm">
            <span className="text-green-600">Available: {availableBooks}</span>
            <span className="text-amber-600">Issued: {issuedBooks}</span>
            <span className="font-medium">Total: {books.length}</span>
          </div>
        </div>

        <DataTable
          data={filteredBooks}
          columns={columns}
          searchKey="title"
          searchPlaceholder="Search books..."
          actions={actions}
          getRowKey={(item) => item.id}
          exportOptions={{
            enabled: true,
            title: "Library Books",
            filename: "library-books",
          }}
        />
      </div>
    </ModuleLayout>
  );
}
