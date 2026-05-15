import { Card, CardContent } from "@/components/ui/card";
import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  trend?: {
    value: number;
    label: string;
    direction: "up" | "down";
  };
  subtitle?: string;
  testId?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  iconColor = "text-blue-500",
  trend,
  subtitle,
  testId,
}: StatsCardProps) {
  const cardTestId = testId || `stats-${title.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <Card className="hover-elevate transition-all duration-200" data-testid={cardTestId}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground truncate" data-testid={`${cardTestId}-title`}>{title}</p>
            <p className="text-3xl font-bold mt-2 tabular-nums" data-testid={`${cardTestId}-value`}>{value}</p>
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                {trend.direction === "up" ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span
                  className={`text-sm font-medium ${
                    trend.direction === "up" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {trend.value}%
                </span>
                <span className="text-sm text-muted-foreground">{trend.label}</span>
              </div>
            )}
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-lg bg-muted ${iconColor}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface StatsGridProps {
  children: React.ReactNode;
}

export function StatsGrid({ children }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {children}
    </div>
  );
}
