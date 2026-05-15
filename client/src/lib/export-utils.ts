import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import type { Column } from "@/components/shared/data-table";

export interface SummaryRow {
  label: string;
  value: string;
}

export interface ExportConfig<T> {
  title: string;
  filename: string;
  data: T[];
  columns: Column<T>[];
  excludeColumns?: string[];
  summaryRows?: SummaryRow[];
}

function getPlainTextValue<T>(item: T, column: Column<T>): string {
  const value = (item as Record<string, unknown>)[column.key];
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function exportToPDF<T extends Record<string, unknown>>({
  title,
  filename,
  data,
  columns,
  excludeColumns = [],
  summaryRows = [],
}: ExportConfig<T>) {
  const doc = new jsPDF();
  
  const filteredColumns = columns.filter(col => !excludeColumns.includes(col.key));
  
  doc.setFontSize(16);
  doc.text(title, 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 28);

  const headers = filteredColumns.map((col) => col.label);
  const rows = data.map((item) =>
    filteredColumns.map((col) => getPlainTextValue(item, col))
  );

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 35,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    margin: { top: 35 },
  });

  if (summaryRows.length > 0) {
    const finalY = (doc as any).lastAutoTable?.finalY || 100;
    
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Summary", 14, finalY + 15);
    
    autoTable(doc, {
      body: summaryRows.map(row => [row.label, row.value]),
      startY: finalY + 20,
      styles: {
        fontSize: 10,
        cellPadding: 4,
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 80 },
        1: { halign: "right", cellWidth: 60 },
      },
      theme: "plain",
      tableWidth: 140,
    });
  }

  doc.save(`${filename}.pdf`);
}

export async function exportToExcel<T extends Record<string, unknown>>({
  title,
  filename,
  data,
  columns,
  excludeColumns = [],
  summaryRows = [],
}: ExportConfig<T>): Promise<void> {
  try {
  const filteredColumns = columns.filter(col => !excludeColumns.includes(col.key));

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(title.substring(0, 31));

  worksheet.addRow(filteredColumns.map((col) => col.label));

  data.forEach((item) => {
    worksheet.addRow(filteredColumns.map((col) => getPlainTextValue(item, col)));
  });

  if (summaryRows.length > 0) {
    worksheet.addRow([]);
    worksheet.addRow(["Summary", ""]);
    summaryRows.forEach((row) => worksheet.addRow([row.label, row.value]));
  }

  worksheet.columns = filteredColumns.map((col) => ({
    width:
      Math.max(
        col.label.length,
        ...data.map((item) => getPlainTextValue(item, col).length)
      ) + 2,
  }));

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Excel export failed:", err);
  }
}
