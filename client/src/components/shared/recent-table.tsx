import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
}

interface RecentTableProps<T> {
  title: string;
  data: T[];
  columns: Column<T>[];
  getRowKey: (item: T) => string;
  emptyMessage?: string;
  maxRows?: number;
  testId?: string;
}

export function RecentTable<T extends Record<string, any>>({
  title,
  data,
  columns,
  getRowKey,
  emptyMessage = "No recent data",
  maxRows = 5,
  testId,
}: RecentTableProps<T>) {
  const displayData = data.slice(0, maxRows);
  const tableTestId = testId || `table-${title.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <Card data-testid={tableTestId}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold" data-testid={`${tableTestId}-title`}>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.key} className="whitespace-nowrap text-xs uppercase tracking-wide">
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-center py-6 text-muted-foreground text-sm"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                displayData.map((item) => (
                  <TableRow key={getRowKey(item)}>
                    {columns.map((col) => (
                      <TableCell key={col.key} className="whitespace-nowrap text-sm">
                        {col.render ? col.render(item) : item[col.key]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
