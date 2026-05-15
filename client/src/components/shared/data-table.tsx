import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ChevronLeft, ChevronRight, Eye, Pencil, Trash2, FileDown, FileSpreadsheet } from "lucide-react";
import { exportToPDF, exportToExcel } from "@/lib/export-utils";
import type { LucideIcon } from "lucide-react";

export interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

export interface Filter {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface ExportOptions {
  enabled?: boolean;
  title?: string;
  filename?: string;
  excludeColumns?: string[];
  summaryRows?: { label: string; value: string }[];
}

interface EmptyStateConfig {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  filters?: Filter[];
  searchPlaceholder?: string;
  searchKeys?: string[];
  searchKey?: string;
  filterKey?: string;
  filterOptions?: string[];
  onView?: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  actions?: (item: T) => React.ReactNode;
  canEdit?: boolean;
  canDelete?: boolean;
  emptyMessage?: string;
  emptyState?: EmptyStateConfig;
  isLoading?: boolean;
  pageSize?: number;
  getRowKey: (item: T) => string;
  exportOptions?: ExportOptions;
  mobileCardRender?: (item: T) => React.ReactNode;
}

const SKELETON_WIDTHS = ["w-3/4", "w-1/2", "w-2/3", "w-5/6", "w-1/3"];

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  filters = [],
  searchPlaceholder = "Search...",
  searchKeys = [],
  searchKey,
  filterKey,
  filterOptions,
  onView,
  onEdit,
  onDelete,
  actions,
  canEdit = true,
  canDelete = true,
  emptyMessage = "No data found",
  emptyState,
  isLoading = false,
  pageSize = 10,
  getRowKey,
  exportOptions,
  mobileCardRender,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);

  const effectiveSearchKeys = searchKey ? [searchKey] : searchKeys;

  const effectiveFilters: Filter[] = filterKey && filterOptions
    ? [{ key: filterKey, label: filterKey.charAt(0).toUpperCase() + filterKey.slice(1), options: filterOptions.map(o => ({ value: o, label: o })) }]
    : filters;

  const filteredData = useMemo(() => {
    let result = [...data];

    if (search && effectiveSearchKeys.length > 0) {
      const lowerSearch = search.toLowerCase();
      result = result.filter((item) =>
        effectiveSearchKeys.some((key) =>
          String(item[key] || "").toLowerCase().includes(lowerSearch)
        )
      );
    }

    Object.entries(filterValues).forEach(([key, value]) => {
      if (value && value !== "all") {
        result = result.filter((item) => String(item[key]) === value);
      }
    });

    return result;
  }, [data, search, effectiveSearchKeys, filterValues]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const showEditButton = onEdit && canEdit;
  const showDeleteButton = onDelete && canDelete;
  const showActions = onView || showEditButton || showDeleteButton || actions;
  const totalColumns = columns.length + (showActions ? 1 : 0);

  const handleExportPDF = () => {
    if (!exportOptions) return;
    exportToPDF({
      title: exportOptions.title || "Export",
      filename: exportOptions.filename || "export",
      data: filteredData,
      columns,
      excludeColumns: exportOptions.excludeColumns,
      summaryRows: exportOptions.summaryRows,
    });
  };

  const handleExportExcel = () => {
    if (!exportOptions) return;
    exportToExcel({
      title: exportOptions.title || "Export",
      filename: exportOptions.filename || "export",
      data: filteredData,
      columns,
      excludeColumns: exportOptions.excludeColumns,
      summaryRows: exportOptions.summaryRows,
    });
  };

  const renderEmptyState = () => {
    if (emptyState) {
      const Icon = emptyState.icon;
      return (
        <TableRow>
          <TableCell colSpan={totalColumns} className="py-16">
            <div className="flex flex-col items-center justify-center text-center gap-3" data-testid="empty-state">
              <div className="rounded-full bg-muted p-4">
                <Icon className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">{emptyState.title}</p>
                {emptyState.description && (
                  <p className="text-sm text-muted-foreground mt-1">{emptyState.description}</p>
                )}
              </div>
              {emptyState.action && (
                <Button size="sm" onClick={emptyState.action.onClick} data-testid="button-empty-action">
                  {emptyState.action.label}
                </Button>
              )}
            </div>
          </TableCell>
        </TableRow>
      );
    }
    return (
      <TableRow>
        <TableCell colSpan={totalColumns} className="text-center py-8 text-muted-foreground">
          {emptyMessage}
        </TableCell>
      </TableRow>
    );
  };

  const renderMobileEmptyState = () => {
    if (emptyState) {
      const Icon = emptyState.icon;
      return (
        <div className="flex flex-col items-center justify-center text-center gap-3 py-16 px-4" data-testid="empty-state-mobile">
          <div className="rounded-full bg-muted p-4">
            <Icon className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">{emptyState.title}</p>
            {emptyState.description && (
              <p className="text-sm text-muted-foreground mt-1">{emptyState.description}</p>
            )}
          </div>
          {emptyState.action && (
            <Button size="sm" onClick={emptyState.action.onClick}>{emptyState.action.label}</Button>
          )}
        </div>
      );
    }
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">{emptyMessage}</div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between flex-wrap">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
            data-testid="input-search"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {effectiveFilters.map((filter) => (
            <Select
              key={filter.key}
              value={filterValues[filter.key] || "all"}
              onValueChange={(value) => {
                setFilterValues((prev) => ({ ...prev, [filter.key]: value }));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[140px]" data-testid={`filter-${filter.key}`}>
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {filter.label}</SelectItem>
                {filter.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}

          {exportOptions?.enabled && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={filteredData.length === 0}
                data-testid="button-export-pdf"
              >
                <FileDown className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                disabled={filteredData.length === 0}
                data-testid="button-export-excel"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Excel
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Card View */}
      {mobileCardRender && (
        <Card className="block sm:hidden overflow-hidden">
          {isLoading ? (
            <div className="space-y-0 divide-y">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4 space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          ) : paginatedData.length === 0 ? (
            renderMobileEmptyState()
          ) : (
            <div className="divide-y">
              {paginatedData.map((item) => (
                <div key={getRowKey(item)} className="relative">
                  {mobileCardRender(item)}
                  {showActions && (
                    <div className="flex items-center gap-1 px-4 pb-3">
                      {onView && (
                        <Button variant="ghost" size="icon" onClick={() => onView(item)} data-testid={`button-view-${getRowKey(item)}`}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      {showEditButton && (
                        <Button variant="ghost" size="icon" onClick={() => onEdit(item)} data-testid={`button-edit-mobile-${getRowKey(item)}`}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                      {showDeleteButton && (
                        <Button variant="ghost" size="icon" onClick={() => onDelete(item)} data-testid={`button-delete-mobile-${getRowKey(item)}`}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                      {actions && actions(item)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Desktop Table View */}
      <Card className={`overflow-hidden ${mobileCardRender ? "hidden sm:block" : ""}`}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.key} className="whitespace-nowrap">
                    {col.label}
                  </TableHead>
                ))}
                {showActions && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, rowIdx) => (
                  <TableRow key={`skeleton-${rowIdx}`}>
                    {columns.map((col, colIdx) => (
                      <TableCell key={col.key}>
                        <Skeleton className={`h-4 ${SKELETON_WIDTHS[(rowIdx * columns.length + colIdx) % SKELETON_WIDTHS.length]}`} />
                      </TableCell>
                    ))}
                    {showActions && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Skeleton className="h-8 w-8 rounded" />
                          <Skeleton className="h-8 w-8 rounded" />
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : paginatedData.length === 0 ? (
                renderEmptyState()
              ) : (
                paginatedData.map((item) => (
                  <TableRow key={getRowKey(item)} className="hover-elevate">
                    {columns.map((col) => (
                      <TableCell key={col.key} className="whitespace-nowrap">
                        {col.render ? col.render(item) : item[col.key]}
                      </TableCell>
                    ))}
                    {showActions && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {onView && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onView(item)}
                              data-testid={`button-view-${getRowKey(item)}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          {showEditButton && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEdit(item)}
                              data-testid={`button-edit-${getRowKey(item)}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          )}
                          {showDeleteButton && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDelete(item)}
                              data-testid={`button-delete-${getRowKey(item)}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                          {actions && actions(item)}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, filteredData.length)} of{" "}
            {filteredData.length} entries
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              data-testid="button-prev-page"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium px-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              data-testid="button-next-page"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    Active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    Inactive: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
    Paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    Unpaid: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    Partial: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    Present: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    Absent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    Late: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    Leave: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    Open: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    Closed: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
    Applied: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    Shortlisted: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    Hired: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    Rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    Probation: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    "On Leave": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    Terminated: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    Available: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    Issued: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    Returned: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    Overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    Alumni: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    Left: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
    Full: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    Maintenance: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    "Not Started": "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
    "In Progress": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    Completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    "Out of Stock": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <Badge className={`${variants[status] || "bg-gray-100 text-gray-700"} border-0`}>
      {status}
    </Badge>
  );
}
