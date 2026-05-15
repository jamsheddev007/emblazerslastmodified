export interface CSVParseResult<T> {
  data: T[];
  errors: CSVError[];
  isValid: boolean;
}

export interface CSVError {
  row: number;
  column?: string;
  message: string;
}

export interface CSVColumn {
  key: string;
  label: string;
  required?: boolean;
  validate?: (value: string) => string | null;
}

export function parseCSV<T>(
  csvText: string,
  columns: CSVColumn[]
): CSVParseResult<T> {
  const lines = csvText.trim().split(/\r?\n/);
  const errors: CSVError[] = [];
  const data: T[] = [];

  if (lines.length < 2) {
    errors.push({ row: 0, message: "CSV must have a header row and at least one data row" });
    return { data: [], errors, isValid: false };
  }

  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);
  
  const expectedHeaders = columns.map(c => c.label.toLowerCase());
  const actualHeaders = headers.map(h => h.toLowerCase().trim());
  
  const columnMapping: Record<number, string> = {};
  for (let i = 0; i < actualHeaders.length; i++) {
    const colIndex = expectedHeaders.indexOf(actualHeaders[i]);
    if (colIndex !== -1) {
      columnMapping[i] = columns[colIndex].key;
    }
  }

  const requiredColumns = columns.filter(c => c.required);
  for (const reqCol of requiredColumns) {
    if (!actualHeaders.includes(reqCol.label.toLowerCase())) {
      errors.push({ row: 0, column: reqCol.label, message: `Missing required column: ${reqCol.label}` });
    }
  }

  if (errors.length > 0) {
    return { data: [], errors, isValid: false };
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const row: Record<string, string> = {};

    for (let j = 0; j < values.length; j++) {
      const key = columnMapping[j];
      if (key) {
        row[key] = values[j].trim();
      }
    }

    for (const col of columns) {
      if (col.required && !row[col.key]) {
        errors.push({ row: i + 1, column: col.label, message: `Missing required value for ${col.label}` });
      }
      if (col.validate && row[col.key]) {
        const error = col.validate(row[col.key]);
        if (error) {
          errors.push({ row: i + 1, column: col.label, message: error });
        }
      }
    }

    data.push(row as unknown as T);
  }

  return { data, errors, isValid: errors.length === 0 };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes) {
      if (nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = false;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);

  return result;
}

export function generateCSVTemplate(columns: CSVColumn[]): string {
  const headers = columns.map(c => c.label).join(",");
  const example = columns.map(c => `"Example ${c.label}"`).join(",");
  return `${headers}\n${example}`;
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export const studentCSVColumns: CSVColumn[] = [
  { key: "studentId", label: "Student ID", required: true },
  { key: "name", label: "Name", required: true },
  { key: "gender", label: "Gender", required: true, validate: (v) => 
    ["male", "female", "other"].includes(v.trim().toLowerCase()) ? null : "Gender must be Male, Female, or Other" },
  { key: "dob", label: "Date of Birth", required: true },
  { key: "parentName", label: "Parent Name", required: true },
  { key: "parentContact", label: "Parent Contact", required: true },
  { key: "parentEmail", label: "Parent Email" },
  { key: "address", label: "Address", required: true },
  { key: "class", label: "Class", required: true },
  { key: "section", label: "Section", required: true },
  { key: "admissionDate", label: "Admission Date", required: true },
  { key: "status", label: "Status", validate: (v) => 
    !v || ["active", "inactive", "alumni", "left"].includes(v.trim().toLowerCase()) ? null : "Status must be Active, Inactive, Alumni, or Left" },
];


export const resultCSVColumns: CSVColumn[] = [
  { key: "studentId", label: "Student ID", required: true },
  { key: "studentName", label: "Student Name", required: true },
  { key: "class", label: "Class", required: true },
  { key: "subject", label: "Subject", required: true },
  { key: "marksObtained", label: "Marks Obtained", required: true, validate: (v) => 
    !isNaN(Number(v)) ? null : "Marks must be a number" },
  { key: "maxMarks", label: "Max Marks", required: true, validate: (v) => 
    !isNaN(Number(v)) ? null : "Max Marks must be a number" },
  { key: "grade", label: "Grade", required: true },
];

export const feeVoucherCSVColumns: CSVColumn[] = [
  { key: "studentId", label: "Student ID", required: true },
  { key: "studentName", label: "Student Name", required: true },
  { key: "class", label: "Class", required: true },
  { key: "section", label: "Section", required: true },
  { key: "month", label: "Month", required: true },
  { key: "tuitionFee", label: "Tuition Fee", required: true, validate: (v) => 
    !isNaN(Number(v)) ? null : "Tuition Fee must be a number" },
  { key: "transportFee", label: "Transport Fee", validate: (v) => 
    !v || !isNaN(Number(v)) ? null : "Transport Fee must be a number" },
  { key: "otherFee", label: "Other Fee", validate: (v) => 
    !v || !isNaN(Number(v)) ? null : "Other Fee must be a number" },
  { key: "discount", label: "Discount", validate: (v) => 
    !v || !isNaN(Number(v)) ? null : "Discount must be a number" },
  { key: "dueDate", label: "Due Date", required: true },
];
