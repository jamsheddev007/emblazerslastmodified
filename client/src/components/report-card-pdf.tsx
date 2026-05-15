import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

const NAVY = "#1A2B4A";
const TEAL = "#0D7377";
const LIGHT_BG = "#F8FAFC";
const BORDER = "#CBD5E1";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1E293B",
  },
  header: {
    backgroundColor: NAVY,
    padding: 16,
    borderRadius: 4,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    color: "white",
    textAlign: "center",
  },
  schoolName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  schoolAddress: {
    fontSize: 8,
    opacity: 0.8,
    marginBottom: 2,
  },
  titleBar: {
    backgroundColor: TEAL,
    padding: 8,
    borderRadius: 3,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleText: {
    color: "white",
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
  },
  titleSubtext: {
    color: "white",
    fontSize: 9,
    opacity: 0.9,
  },
  studentInfoGrid: {
    flexDirection: "row",
    marginBottom: 12,
    border: `1px solid ${BORDER}`,
    borderRadius: 3,
  },
  studentInfoCol: {
    flex: 1,
    padding: 10,
  },
  studentInfoDivider: {
    width: 1,
    backgroundColor: BORDER,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  infoLabel: {
    width: 80,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: "#64748B",
  },
  infoValue: {
    flex: 1,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#1E293B",
  },
  table: {
    marginBottom: 12,
    border: `1px solid ${BORDER}`,
    borderRadius: 3,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: NAVY,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  tableHeaderCell: {
    color: "white",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    padding: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: `1px solid ${BORDER}`,
  },
  tableRowAlt: {
    flexDirection: "row",
    borderBottom: `1px solid ${BORDER}`,
    backgroundColor: LIGHT_BG,
  },
  tableCell: {
    fontSize: 9,
    padding: 7,
  },
  colSNo: { width: "6%" },
  colSubject: { width: "24%" },
  colTotal: { width: "12%", textAlign: "center" as any },
  colObtained: { width: "14%", textAlign: "center" as any },
  colPct: { width: "10%", textAlign: "center" as any },
  colGrade: { width: "12%", textAlign: "center" as any },
  colRemarks: { width: "22%" },
  summaryBar: {
    backgroundColor: TEAL,
    padding: 10,
    borderRadius: 3,
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  summaryItem: {
    alignItems: "center" as any,
  },
  summaryLabel: {
    color: "white",
    fontSize: 7,
    opacity: 0.8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  summaryValue: {
    color: "white",
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
  },
  gradingScale: {
    border: `1px solid ${BORDER}`,
    borderRadius: 3,
    padding: 10,
    marginBottom: 16,
  },
  gradingTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#64748B",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  gradingRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  gradingItem: {
    fontSize: 7,
    color: "#475569",
  },
  signaturesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
    paddingTop: 0,
  },
  signatureBlock: {
    alignItems: "center" as any,
    width: "30%",
  },
  signatureLine: {
    width: "100%",
    borderBottom: `1px solid ${BORDER}`,
    marginBottom: 6,
  },
  signatureLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#64748B",
  },
  passStamp: {
    backgroundColor: "#059669",
    color: "white",
    padding: "4 12",
    borderRadius: 3,
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  failStamp: {
    backgroundColor: "#DC2626",
    color: "white",
    padding: "4 12",
    borderRadius: 3,
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
});

interface ReportCardData {
  student: {
    name: string;
    fatherName: string;
    class: string;
    section: string;
    rollNo: string;
    admissionNo: string;
  };
  school: {
    name: string;
    branchName: string;
    address: string;
    phone: string;
  };
  exam: {
    name: string;
    term: string;
    startDate: string;
    endDate: string;
  } | null;
  results: {
    sNo: number;
    subject: string;
    maxMarks: number;
    marksObtained: number;
    percentage: number;
    grade: string;
    remarks: string;
  }[];
  summary: {
    totalMaxMarks: number;
    totalObtained: number;
    overallPercentage: number;
    overallGrade: string;
    passStatus: string;
  };
  attendance: {
    totalDays: number;
    presentDays: number;
    percentage: number;
  };
}

function getGradeStyle(grade: string) {
  if (grade === "A+" || grade === "A") return { color: "#059669" };
  if (grade === "B+" || grade === "B") return { color: "#2563EB" };
  if (grade === "C") return { color: "#D97706" };
  return { color: "#DC2626" };
}

export function ReportCardDocument({ data }: { data: ReportCardData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.schoolName}>{data.school.name}</Text>
            {data.school.address && (
              <Text style={styles.schoolAddress}>{data.school.address}</Text>
            )}
            {data.school.phone && (
              <Text style={styles.schoolAddress}>Phone: {data.school.phone}</Text>
            )}
            <Text style={styles.schoolAddress}>{data.school.branchName}</Text>
          </View>
        </View>

        <View style={styles.titleBar}>
          <Text style={styles.titleText}>STUDENT RESULT CARD</Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            {data.exam && (
              <Text style={styles.titleSubtext}>
                Term: {data.exam.term} | Exam: {data.exam.name}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.studentInfoGrid}>
          <View style={styles.studentInfoCol}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Student:</Text>
              <Text style={styles.infoValue}>{data.student.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Father:</Text>
              <Text style={styles.infoValue}>{data.student.fatherName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Class:</Text>
              <Text style={styles.infoValue}>{data.student.class} - {data.student.section}</Text>
            </View>
          </View>
          <View style={styles.studentInfoDivider} />
          <View style={styles.studentInfoCol}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Roll No:</Text>
              <Text style={styles.infoValue}>{data.student.rollNo}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Admission:</Text>
              <Text style={styles.infoValue}>{data.student.admissionNo}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Attendance:</Text>
              <Text style={styles.infoValue}>
                {data.attendance.percentage}% ({data.attendance.presentDays}/{data.attendance.totalDays} days)
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colSNo]}>#</Text>
            <Text style={[styles.tableHeaderCell, styles.colSubject]}>Subject</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
            <Text style={[styles.tableHeaderCell, styles.colObtained]}>Obtained</Text>
            <Text style={[styles.tableHeaderCell, styles.colPct]}>%</Text>
            <Text style={[styles.tableHeaderCell, styles.colGrade]}>Grade</Text>
            <Text style={[styles.tableHeaderCell, styles.colRemarks]}>Remarks</Text>
          </View>
          {data.results.map((r, i) => (
            <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={[styles.tableCell, styles.colSNo]}>{r.sNo}</Text>
              <Text style={[styles.tableCell, styles.colSubject]}>{r.subject}</Text>
              <Text style={[styles.tableCell, styles.colTotal]}>{r.maxMarks}</Text>
              <Text style={[styles.tableCell, styles.colObtained]}>{r.marksObtained}</Text>
              <Text style={[styles.tableCell, styles.colPct]}>{r.percentage}%</Text>
              <Text style={[styles.tableCell, styles.colGrade, getGradeStyle(r.grade)]}>{r.grade}</Text>
              <Text style={[styles.tableCell, styles.colRemarks]}>{r.remarks}</Text>
            </View>
          ))}
          {data.results.length === 0 && (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: "100%", textAlign: "center", padding: 16, color: "#94A3B8" }]}>
                No results available for this exam
              </Text>
            </View>
          )}
        </View>

        <View style={styles.summaryBar}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Marks</Text>
            <Text style={styles.summaryValue}>
              {data.summary.totalObtained}/{data.summary.totalMaxMarks}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Percentage</Text>
            <Text style={styles.summaryValue}>{data.summary.overallPercentage}%</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Grade</Text>
            <Text style={styles.summaryValue}>{data.summary.overallGrade}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={data.summary.passStatus === "PASS" ? styles.passStamp : styles.failStamp}>
              {data.summary.passStatus}
            </Text>
          </View>
        </View>

        <View style={styles.gradingScale}>
          <Text style={styles.gradingTitle}>Grading Scale</Text>
          <View style={styles.gradingRow}>
            <Text style={styles.gradingItem}>A+ (90-100) Excellent</Text>
            <Text style={styles.gradingItem}>A (80-89) Very Good</Text>
            <Text style={styles.gradingItem}>B+ (75-79) Good</Text>
            <Text style={styles.gradingItem}>B (65-74) Satisfactory</Text>
            <Text style={styles.gradingItem}>C (55-64) Average</Text>
            <Text style={styles.gradingItem}>D (45-54) Below Average</Text>
            <Text style={styles.gradingItem}>F (Below 45) Fail</Text>
          </View>
        </View>

        <View style={styles.signaturesRow}>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Class Teacher</Text>
          </View>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Head Teacher</Text>
          </View>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Parent / Guardian</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
