import { useState, useEffect } from "react";
import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, StatusBadge } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { libraryNavItems, useLibraryData, searchStudents, searchStaff } from "./library-data";
import { useToast } from "@/hooks/use-toast";
import { Plus, RotateCcw, Search, User, GraduationCap, Users, Eye } from "lucide-react";
import type { Student, Staff } from "@shared/schema";

type MemberType = "Student" | "Staff";

export default function IssueReturn() {
  const { books, issues, issueBook, returnBook, isPending, isLoading } = useLibraryData();
  const { toast } = useToast();

  // Issue Dialog State
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [memberType, setMemberType] = useState<MemberType>("Student");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<(Student | Staff)[]>([]);
  const [selectedMember, setSelectedMember] = useState<Student | Staff | null>(null);
  const [selectedBookId, setSelectedBookId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [searching, setSearching] = useState(false);

  // Return Dialog State
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState("");
  const [returnDate, setReturnDate] = useState("");

  // View Dialog State
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingIssue, setViewingIssue] = useState<typeof issues[0] | null>(null);

  // Filter State
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [memberTypeFilter, setMemberTypeFilter] = useState<string>("all");

  // Auto-calculate due date (14 days from today)
  useEffect(() => {
    const today = new Date();
    const due = new Date(today.setDate(today.getDate() + 14));
    setDueDate(due.toISOString().split("T")[0]);
  }, [issueDialogOpen]);

  // Auto-set return date to today
  useEffect(() => {
    setReturnDate(new Date().toISOString().split("T")[0]);
  }, [returnDialogOpen]);

  // Search with debounce
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = memberType === "Student"
          ? await searchStudents(searchQuery)
          : await searchStaff(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, memberType]);

  const availableBooks = books.filter(b => (b.availableCopies || 0) > 0);

  const resetIssueForm = () => {
    setMemberType("Student");
    setSearchQuery("");
    setSearchResults([]);
    setSelectedMember(null);
    setSelectedBookId("");
    const today = new Date();
    const due = new Date(today.setDate(today.getDate() + 14));
    setDueDate(due.toISOString().split("T")[0]);
  };

  const handleSelectMember = (member: Student | Staff) => {
    setSelectedMember(member);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleIssue = async () => {
    if (!selectedMember || !selectedBookId || !dueDate) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    const book = books.find(b => b.id === selectedBookId);
    if (!book) {
      toast({ title: "Error", description: "Book not found", variant: "destructive" });
      return;
    }

    try {
      const isStudent = "studentId" in selectedMember;

      await issueBook({
        bookId: book.id,
        bookTitle: book.title,
        accessionNo: book.accessionNo,
        memberId: selectedMember.id, // Database ID!
        memberName: selectedMember.name,
        memberType: isStudent ? "Student" : "Staff",
        class: isStudent ? selectedMember.class : undefined,
        section: isStudent ? selectedMember.section : undefined,
        issueDate: new Date().toISOString().split("T")[0],
        dueDate,
        fine: 0,
        finePaid: false,
        status: "Issued"
      });

      toast({
        title: "Success",
        description: `Book issued to ${selectedMember.name}`
      });
      setIssueDialogOpen(false);
      resetIssueForm();
    } catch (error) {
      console.error("Failed to issue book:", error);
      toast({
        title: "Error",
        description: "Failed to issue book. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleReturn = async () => {
    if (!selectedIssueId || !returnDate) {
      toast({
        title: "Error",
        description: "Please select an issue and return date",
        variant: "destructive"
      });
      return;
    }

    try {
      await returnBook(selectedIssueId, returnDate);
      toast({ title: "Success", description: "Book returned successfully" });
      setReturnDialogOpen(false);
      setSelectedIssueId("");
    } catch (error) {
      console.error("Failed to return book:", error);
      toast({
        title: "Error",
        description: "Failed to return book",
        variant: "destructive"
      });
    }
  };

  const filteredIssues = issues.filter(issue => {
    const matchesStatus = statusFilter === "all" || issue.status === statusFilter;
    const matchesMemberType = memberTypeFilter === "all" || issue.memberType === memberTypeFilter;
    return matchesStatus && matchesMemberType;
  });

  const issuedCount = issues.filter(i => i.status === "Issued").length;
  const overdueCount = issues.filter(i => i.status === "Overdue").length;
  const returnedCount = issues.filter(i => i.status === "Returned").length;

  const columns = [
    { key: "bookTitle" as const, label: "Book", sortable: true },
    { key: "accessionNo" as const, label: "Acc No" },
    { key: "memberName" as const, label: "Member" },
    {
      key: "memberType" as const,
      label: "Type",
      render: (item: typeof issues[0]) => (
        <Badge variant="outline" className="text-xs">
          {item.memberType}
        </Badge>
      )
    },
    { key: "issueDate" as const, label: "Issue Date" },
    { key: "dueDate" as const, label: "Due Date" },
    {
      key: "returnDate" as const,
      label: "Return Date",
      render: (item: typeof issues[0]) => item.returnDate || "-"
    },
    {
      key: "fine" as const,
      label: "Fine",
      render: (item: typeof issues[0]) => item.fine > 0 ? `$${item.fine}` : "-"
    },
    {
      key: "status" as const,
      label: "Status",
      render: (item: typeof issues[0]) => <StatusBadge status={item.status} />
    },
  ];

  const actions = (item: typeof issues[0]) => (
    <div className="flex gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setViewingIssue(item);
          setViewDialogOpen(true);
        }}
        data-testid={`button-view-${item.id}`}
      >
        <Eye className="w-4 h-4" />
      </Button>
      {item.status !== "Returned" && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedIssueId(item.id);
            setReturnDialogOpen(true);
          }}
          data-testid={`button-return-${item.id}`}
        >
          <RotateCcw className="w-4 h-4 mr-1" />
          Return
        </Button>
      )}
    </div>
  );

  return (
    <ModuleLayout module="library" navItems={libraryNavItems}>
      <div className="space-y-6">
        <PageHeader
          title="Issue / Return"
          description="Manage book issues and returns"
          actions={
            <Button onClick={() => setIssueDialogOpen(true)} data-testid="button-issue-book">
              <Plus className="w-4 h-4 mr-2" />
              Issue Book
            </Button>
          }
        />

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-amber-600">{issuedCount}</div>
              <p className="text-sm text-muted-foreground">Currently Issued</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
              <p className="text-sm text-muted-foreground">Overdue Books</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{returnedCount}</div>
              <p className="text-sm text-muted-foreground">Total Returned</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Status:</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Issued">Issued</SelectItem>
                <SelectItem value="Returned">Returned</SelectItem>
                <SelectItem value="Overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm">Member Type:</Label>
            <Select value={memberTypeFilter} onValueChange={setMemberTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Student">Student</SelectItem>
                <SelectItem value="Staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Issue History Table */}
        <DataTable
          data={filteredIssues}
          columns={columns}
          searchKey="bookTitle"
          searchPlaceholder="Search by book or member..."
          actions={actions}
          getRowKey={(item) => item.id}
        />

        {/* Issue Book Dialog */}
        <Dialog open={issueDialogOpen} onOpenChange={(open) => {
          setIssueDialogOpen(open);
          if (!open) resetIssueForm();
        }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Issue Book</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {/* Member Type Selection */}
              <div className="space-y-2">
                <Label>Issue To *</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={memberType === "Student" ? "default" : "outline"}
                    onClick={() => {
                      setMemberType("Student");
                      setSearchQuery("");
                      setSearchResults([]);
                      setSelectedMember(null);
                    }}
                    className="w-full"
                  >
                    <GraduationCap className="w-4 h-4 mr-2" />
                    Student
                  </Button>
                  <Button
                    type="button"
                    variant={memberType === "Staff" ? "default" : "outline"}
                    onClick={() => {
                      setMemberType("Staff");
                      setSearchQuery("");
                      setSearchResults([]);
                      setSelectedMember(null);
                    }}
                    className="w-full"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Staff
                  </Button>
                </div>
              </div>

              {/* Search Member */}
              {!selectedMember && (
                <div className="space-y-2">
                  <Label>Search {memberType} by ID or Name *</Label>
                  <div className="relative">
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={`Enter ${memberType} ID or name...`}
                      data-testid="input-member-search"
                    />
                    {searching && (
                      <Search className="absolute right-3 top-3 w-4 h-4 animate-spin" />
                    )}
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <Card>
                      <CardContent className="p-2">
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {searchResults.map((result) => {
                            const isStudent = "studentId" in result;
                            return (
                              <Button
                                key={result.id}
                                variant="ghost"
                                className="w-full justify-start text-left"
                                onClick={() => handleSelectMember(result)}
                              >
                                <div className="flex-1">
                                  <div className="font-medium">{result.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    ID: {isStudent ? result.studentId : result.staffId}
                                    {isStudent && ` • ${result.class} ${result.section}`}
                                  </div>
                                </div>
                              </Button>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
                    <p className="text-sm text-muted-foreground">
                      No {memberType.toLowerCase()} found matching "{searchQuery}"
                    </p>
                  )}
                </div>
              )}

              {/* Selected Member Display */}
              {selectedMember && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{selectedMember.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {"studentId" in selectedMember
                              ? `ID: ${selectedMember.studentId} • ${selectedMember.class} ${selectedMember.section}`
                              : `ID: ${selectedMember.staffId} • ${selectedMember.designation}`
                            }
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedMember(null)}
                      >
                        Change
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Book Selection */}
              <div className="space-y-2">
                <Label>Select Book *</Label>
                <Select value={selectedBookId} onValueChange={setSelectedBookId}>
                  <SelectTrigger data-testid="select-book">
                    <SelectValue placeholder="Select an available book" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBooks.length === 0 ? (
                      <SelectItem value="none" disabled>No books available</SelectItem>
                    ) : (
                      availableBooks.map((book) => (
                        <SelectItem key={book.id} value={book.id}>
                          {book.title} - {book.accessionNo} ({book.availableCopies || 0} available)
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {availableBooks.length} books available for issue
                </p>
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <Label>Due Date *</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  data-testid="input-due-date"
                />
                <p className="text-xs text-muted-foreground">
                  Default: 14 days from today
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIssueDialogOpen(false);
                    resetIssueForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleIssue}
                  disabled={isPending || !selectedMember || !selectedBookId || !dueDate}
                  data-testid="button-confirm-issue"
                >
                  {isPending ? "Issuing..." : "Issue Book"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Return Book Dialog */}
        <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Return Book</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Select Issue Record *</Label>
                <Select value={selectedIssueId} onValueChange={setSelectedIssueId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an issue to return" />
                  </SelectTrigger>
                  <SelectContent>
                    {issues.filter(i => i.status !== "Returned").map((issue) => (
                      <SelectItem key={issue.id} value={issue.id}>
                        {issue.bookTitle} - {issue.memberName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Return Date *</Label>
                <Input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>

              {selectedIssueId && (
                <Card>
                  <CardContent className="pt-4">
                    {(() => {
                      const issue = issues.find(i => i.id === selectedIssueId);
                      if (!issue) return null;

                      const dueDate = new Date(issue.dueDate);
                      const returnD = new Date(returnDate);
                      const isOverdue = returnD > dueDate;
                      const daysOverdue = isOverdue
                        ? Math.ceil((returnD.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
                        : 0;
                      const calculatedFine = daysOverdue * 5;

                      return (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Book:</span>
                            <span className="font-medium">{issue.bookTitle}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Member:</span>
                            <span className="font-medium">{issue.memberName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Due Date:</span>
                            <span className="font-medium">{issue.dueDate}</span>
                          </div>
                          {isOverdue && (
                            <>
                              <div className="flex justify-between text-red-600">
                                <span>Days Overdue:</span>
                                <span className="font-medium">{daysOverdue}</span>
                              </div>
                              <div className="flex justify-between text-red-600">
                                <span>Fine ($5/day):</span>
                                <span className="font-bold">${calculatedFine}</span>
                              </div>
                            </>
                          )}
                          {!isOverdue && (
                            <div className="text-green-600 text-center pt-2">
                              ✓ Returned on time - No fine
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setReturnDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleReturn}
                  disabled={isPending || !selectedIssueId || !returnDate}
                >
                  {isPending ? "Processing..." : "Process Return"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Issue Details Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Issue Details</DialogTitle>
            </DialogHeader>
            {viewingIssue && (
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Book Title</p>
                    <p className="font-medium">{viewingIssue.bookTitle}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Accession No</p>
                    <p className="font-medium">{viewingIssue.accessionNo}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Member Name</p>
                    <p className="font-medium">{viewingIssue.memberName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Member Type</p>
                    <p className="font-medium">{viewingIssue.memberType}</p>
                  </div>
                  {viewingIssue.class && (
                    <>
                      <div>
                        <p className="text-muted-foreground">Class</p>
                        <p className="font-medium">{viewingIssue.class}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Section</p>
                        <p className="font-medium">{viewingIssue.section}</p>
                      </div>
                    </>
                  )}
                  <div>
                    <p className="text-muted-foreground">Issue Date</p>
                    <p className="font-medium">{viewingIssue.issueDate}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Due Date</p>
                    <p className="font-medium">{viewingIssue.dueDate}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Return Date</p>
                    <p className="font-medium">{viewingIssue.returnDate || "Not returned"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <StatusBadge status={viewingIssue.status} />
                  </div>
                  {viewingIssue.fine > 0 && (
                    <>
                      <div>
                        <p className="text-muted-foreground">Fine</p>
                        <p className="font-medium text-red-600">${viewingIssue.fine}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Fine Status</p>
                        <Badge variant={viewingIssue.finePaid ? "default" : "destructive"}>
                          {viewingIssue.finePaid ? "Paid" : "Pending"}
                        </Badge>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ModuleLayout>
  );
}
