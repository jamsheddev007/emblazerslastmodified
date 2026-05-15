import type { Express } from "express";
import { storage } from "../storage";
import { db } from "../db";
import {
  asyncHandler,
  getBranchId,
  getSchoolId,
  filterByBranch,
  verifyBranch,
} from "../lib/route-helpers";
import {
  insertBookSchema,
  insertBookCategorySchema,
  insertLibraryMemberSchema,
  insertBookIssueSchema,
  libraryMembersTable,
  studentsTable,
} from "@shared/schema";
import {
  checkBookReferences,
  checkLibraryMemberReferences,
} from "../validation";
import { eq } from "drizzle-orm";

export function registerLibraryRoutes(app: Express) {
  app.get("/api/books", asyncHandler(async (req, res) => {
    const books = filterByBranch(await storage.getBooks(), getBranchId(req));
    res.json(books);
  }));

  app.get("/api/books/:id", asyncHandler(async (req, res) => {
    const book = await storage.getBook(req.params.id);
    if (!book || !verifyBranch(book, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    res.json(book);
  }));

  app.post("/api/books", asyncHandler(async (req, res) => {
    const parsed = insertBookSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const book = await storage.createBook({ ...parsed.data, branchId: getBranchId(req), schoolId: getSchoolId(req) });
    res.status(201).json(book);
  }));

  app.patch("/api/books/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getBook(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const { id, ...updates } = req.body;
    const parsed = insertBookSchema.partial().safeParse(updates);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const book = await storage.updateBook(req.params.id, parsed.data);
    if (!book) return res.status(404).json({ error: "Not found" });
    res.json(book);
  }));

  app.delete("/api/books/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getBook(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const validation = await checkBookReferences(req.params.id);
    if (!validation.canDelete) {
      return res.status(409).json({ error: validation.errorMessage, references: validation.references });
    }
    const deleted = await storage.deleteBook(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  }));

  app.get("/api/book-categories", asyncHandler(async (req, res) => {
    const categories = filterByBranch(await storage.getBookCategories(), getBranchId(req));
    res.json(categories);
  }));

  app.get("/api/book-categories/:id", asyncHandler(async (req, res) => {
    const category = await storage.getBookCategory(req.params.id);
    if (!category || !verifyBranch(category, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    res.json(category);
  }));

  app.post("/api/book-categories", asyncHandler(async (req, res) => {
    const parsed = insertBookCategorySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const category = await storage.createBookCategory({ ...parsed.data, branchId: getBranchId(req), schoolId: getSchoolId(req) });
    res.status(201).json(category);
  }));

  app.patch("/api/book-categories/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getBookCategory(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const { id, ...updates } = req.body;
    const parsed = insertBookCategorySchema.partial().safeParse(updates);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const category = await storage.updateBookCategory(req.params.id, parsed.data);
    if (!category) return res.status(404).json({ error: "Not found" });
    res.json(category);
  }));

  app.delete("/api/book-categories/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getBookCategory(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const deleted = await storage.deleteBookCategory(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  }));

  app.get("/api/library-members", asyncHandler(async (req, res) => {
    const members = filterByBranch(await storage.getLibraryMembers(), getBranchId(req));
    res.json(members);
  }));

  app.get("/api/library-members/:id", asyncHandler(async (req, res) => {
    const member = await storage.getLibraryMember(req.params.id);
    if (!member || !verifyBranch(member, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    res.json(member);
  }));

  app.post("/api/library-members", asyncHandler(async (req, res) => {
    const parsed = insertLibraryMemberSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const member = await storage.createLibraryMember({ ...parsed.data, branchId: getBranchId(req), schoolId: getSchoolId(req) });
    res.status(201).json(member);
  }));

  app.patch("/api/library-members/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getLibraryMember(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const { id, ...updates } = req.body;
    const parsed = insertLibraryMemberSchema.partial().safeParse(updates);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const member = await storage.updateLibraryMember(req.params.id, parsed.data);
    if (!member) return res.status(404).json({ error: "Not found" });
    res.json(member);
  }));

  app.delete("/api/library-members/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getLibraryMember(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const validation = await checkLibraryMemberReferences(req.params.id);
    if (!validation.canDelete) {
      return res.status(409).json({ error: validation.errorMessage, references: validation.references });
    }
    const deleted = await storage.deleteLibraryMember(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  }));

  app.get("/api/book-issues", asyncHandler(async (req, res) => {
    const issues = filterByBranch(await storage.getBookIssues(), getBranchId(req));
    res.json(issues);
  }));

  app.get("/api/book-issues/:id", asyncHandler(async (req, res) => {
    const issue = await storage.getBookIssue(req.params.id);
    if (!issue || !verifyBranch(issue, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    res.json(issue);
  }));

  app.post("/api/book-issues", asyncHandler(async (req, res) => {
    const parsed = insertBookIssueSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const issue = await storage.createBookIssue({ ...parsed.data, branchId: getBranchId(req), schoolId: getSchoolId(req) });
    res.status(201).json(issue);
  }));

  app.patch("/api/book-issues/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getBookIssue(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const { id, ...updates } = req.body;
    const parsed = insertBookIssueSchema.partial().safeParse(updates);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const issue = await storage.updateBookIssue(req.params.id, parsed.data);
    if (!issue) return res.status(404).json({ error: "Not found" });
    res.json(issue);
  }));

  app.delete("/api/book-issues/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getBookIssue(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const deleted = await storage.deleteBookIssue(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  }));

  app.get("/api/library/statistics", asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const books = filterByBranch(await storage.getBooks(), branchId);
    const members = filterByBranch(await storage.getLibraryMembers(), branchId);
    const issues = filterByBranch(await storage.getBookIssues(), branchId);
    const activeIssues = issues.filter((i: any) => i.status === "Issued");
    const overdueIssues = issues.filter((i: any) => {
      if (i.status !== "Issued") return false;
      const due = new Date(i.dueDate);
      return due < new Date();
    });
    res.json({
      totalBooks: books.length,
      totalMembers: members.length,
      totalIssues: issues.length,
      activeIssues: activeIssues.length,
      overdueIssues: overdueIssues.length,
      availableBooks: books.filter((b: any) => (b.availableCopies || 0) > 0).length,
    });
  }));

  app.get("/api/library/search-students", asyncHandler(async (req, res) => {
    const { query } = req.query;
    if (!query || typeof query !== "string") return res.json([]);
    const branchId = getBranchId(req);
    const allMembers = await db.select().from(libraryMembersTable).where(eq(libraryMembersTable.branchId, branchId));
    const searchLower = query.toLowerCase().trim();
    const results = allMembers.filter((m: any) => m.type === "student").filter((m: any) => {
      const referenceIdMatch = m.referenceId?.toLowerCase().includes(searchLower);
      const nameMatch = m.name?.toLowerCase().includes(searchLower);
      return referenceIdMatch || nameMatch;
    });
    res.json(results);
  }));

  app.get("/api/library/search-staff", asyncHandler(async (req, res) => {
    const { query } = req.query;
    if (!query || typeof query !== "string") return res.json([]);
    const branchId = getBranchId(req);
    const allMembers = await db.select().from(libraryMembersTable).where(eq(libraryMembersTable.branchId, branchId));
    const searchLower = query.toLowerCase().trim();
    const results = allMembers.filter((m: any) => m.type === "staff").filter((m: any) => {
      const referenceIdMatch = m.referenceId?.toLowerCase().includes(searchLower);
      const nameMatch = m.name?.toLowerCase().includes(searchLower);
      return referenceIdMatch || nameMatch;
    });
    res.json(results);
  }));

  app.get("/api/library/missing-members-count", asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);

    const allStudents = await db
      .select({ studentId: studentsTable.studentId })
      .from(studentsTable)
      .where(eq(studentsTable.branchId, branchId));

    const allMembers = await db
      .select({ referenceId: libraryMembersTable.referenceId })
      .from(libraryMembersTable)
      .where(eq(libraryMembersTable.type, "student"));

    const memberReferenceIds = new Set(allMembers.map((m) => m.referenceId));
    const missingCount = allStudents.filter(
      (s) => !memberReferenceIds.has(s.studentId)
    ).length;

    res.json({ missingCount });
  }));
}
