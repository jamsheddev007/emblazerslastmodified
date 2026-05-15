import { useState, useEffect } from "react";
import SuperLayout from "./layout";
import { superFetch } from "./super-auth";
import { Card, CardContent } from "@/components/ui/card";
import { School, GitBranch, GraduationCap, Users, UserCog, Loader2 } from "lucide-react";

interface Stats {
  totalSchools: number;
  totalBranches: number;
  totalStudents: number;
  totalStaff: number;
  totalModuleUsers: number;
}

export default function SuperDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    superFetch("/api/super/stats")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards = stats
    ? [
        { label: "Total Schools", value: stats.totalSchools, icon: School, color: "bg-indigo-600" },
        { label: "Total Branches", value: stats.totalBranches, icon: GitBranch, color: "bg-emerald-600" },
        { label: "Total Students", value: stats.totalStudents, icon: GraduationCap, color: "bg-blue-600" },
        { label: "Total Staff", value: stats.totalStaff, icon: Users, color: "bg-orange-600" },
        { label: "Module Users", value: stats.totalModuleUsers, icon: UserCog, color: "bg-purple-600" },
      ]
    : [];

  return (
    <SuperLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold" data-testid="text-page-title">Dashboard</h1>
          <p className="text-muted-foreground mt-1">System overview and statistics</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {cards.map((card) => (
              <Card key={card.label} data-testid={`card-${card.label.toLowerCase().replace(/\s+/g, "-")}`}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 ${card.color} rounded-lg flex items-center justify-center`}>
                      <card.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{card.value}</p>
                      <p className="text-xs text-muted-foreground">{card.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </SuperLayout>
  );
}
