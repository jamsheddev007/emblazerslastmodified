import { Link } from "wouter";
import { moduleConfigs, studentPortalConfig } from "@/lib/module-config";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { GraduationCap, ArrowRight } from "lucide-react";

const PORTAL_IDS = ["student-portal", "parent", "staff-portal"];
const ADMIN_IDS = ["student", "fee", "payroll", "finance", "attendance", "curriculum", "pos", "library", "transport", "hostel", "reports"];

const portals = PORTAL_IDS.map(id => moduleConfigs[id]).filter(Boolean);
const adminModules = ADMIN_IDS.map(id => moduleConfigs[id]).filter(Boolean);

const PORTAL_BADGE: Record<string, { label: string; cls: string }> = {
  "student-portal": { label: "For Students", cls: "bg-blue-600 text-white" },
  "parent": { label: "For Parents", cls: "bg-orange-500 text-white" },
  "staff-portal": { label: "For Staff", cls: "bg-teal-600 text-white" },
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b sticky top-0 z-50 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Emblazers</h1>
              <p className="text-xs text-muted-foreground">School Management System</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1">
        <section className="py-12 lg:py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Complete School Management
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Manage students, staff, fees, attendance, exams, library, transport, hostel, and more with separate modules for every department.
            </p>
          </div>
        </section>

        {/* ── Portals: Student / Parent / Staff ── */}
        <section className="py-10 px-4 sm:px-6 lg:px-8 border-b">
          <div className="max-w-7xl mx-auto">
            <div className="mb-5">
              <h3 className="text-xl font-semibold">Portals</h3>
              <p className="text-sm text-muted-foreground mt-1">Direct access for students, parents, and staff members</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
              {portals.map((module) => {
                const Icon = module.icon;
                const badge = PORTAL_BADGE[module.id];
                return (
                  <Link key={module.id} href={module.loginPath} data-testid={`link-module-${module.id}`}>
                    <Card className="h-full hover-elevate active-elevate-2 cursor-pointer transition-all duration-200 group border-2 hover:border-blue-400 dark:hover:border-blue-500" data-testid={`card-module-${module.id}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className={`w-14 h-14 ${module.bgColor} rounded-xl flex items-center justify-center shadow-sm`}>
                            <Icon className="w-7 h-7 text-white" />
                          </div>
                          <div className="flex items-center gap-2">
                            {badge && (
                              <Badge className={`${badge.cls} text-xs`}>{badge.label}</Badge>
                            )}
                            <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                        <CardTitle className="text-lg mt-3" data-testid={`text-module-title-${module.id}`}>{module.shortName}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="line-clamp-2" data-testid={`text-module-desc-${module.id}`}>
                          {module.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Admin Modules ── */}
        <section className="py-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-5">
              <h3 className="text-xl font-semibold">Administration Modules</h3>
              <p className="text-sm text-muted-foreground mt-1">Staff and admin tools for managing school operations</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
              {adminModules.map((module) => {
                const Icon = module.icon;
                return (
                  <Link key={module.id} href={module.loginPath} data-testid={`link-module-${module.id}`}>
                    <Card className="h-full hover-elevate active-elevate-2 cursor-pointer transition-all duration-200 group" data-testid={`card-module-${module.id}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className={`w-12 h-12 ${module.bgColor} rounded-lg flex items-center justify-center`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                        </div>
                        <CardTitle className="text-lg mt-3" data-testid={`text-module-title-${module.id}`}>{module.shortName}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="line-clamp-2" data-testid={`text-module-desc-${module.id}`}>
                          {module.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          Emblazers School Management System
        </div>
      </footer>
    </div>
  );
}
