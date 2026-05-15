export function getGradeColor(grade: string): string {
  switch (grade?.toUpperCase()) {
    case "A+": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    case "A": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "B": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "C": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "D": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    case "F": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    default: return "bg-muted text-muted-foreground";
  }
}

export function getGradeFromPercentage(percentage: number): { grade: string; color: string } {
  if (percentage >= 90) return { grade: "A+", color: getGradeColor("A+") };
  if (percentage >= 80) return { grade: "A", color: getGradeColor("A") };
  if (percentage >= 70) return { grade: "B", color: getGradeColor("B") };
  if (percentage >= 60) return { grade: "C", color: getGradeColor("C") };
  if (percentage >= 50) return { grade: "D", color: getGradeColor("D") };
  return { grade: "F", color: getGradeColor("F") };
}
