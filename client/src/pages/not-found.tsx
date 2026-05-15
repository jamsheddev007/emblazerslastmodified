import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Rocket, Construction } from "lucide-react";

const moduleRoutes: Record<string, { label: string; home: string; color: string }> = {
  "/student": { label: "Student Module", home: "/student/dashboard", color: "bg-blue-500" },
  "/hr": { label: "HR Module", home: "/hr/dashboard", color: "bg-emerald-500" },
  "/fee": { label: "Fee Module", home: "/fee/dashboard", color: "bg-violet-500" },
  "/payroll": { label: "Payroll Module", home: "/payroll/dashboard", color: "bg-amber-500" },
  "/finance": { label: "Finance Module", home: "/finance/dashboard", color: "bg-cyan-500" },
  "/attendance": { label: "Attendance Module", home: "/attendance/dashboard", color: "bg-rose-500" },
  "/curriculum": { label: "Curriculum Module", home: "/curriculum/dashboard", color: "bg-violet-600" },
  "/library": { label: "Library Module", home: "/library/dashboard", color: "bg-teal-500" },
  "/transport": { label: "Transport Module", home: "/transport/dashboard", color: "bg-orange-600" },
  "/hostel": { label: "Hostel Module", home: "/hostel/dashboard", color: "bg-pink-500" },
  "/parent": { label: "Parent Portal", home: "/parent/dashboard", color: "bg-orange-500" },
  "/staff": { label: "Staff Portal", home: "/staff/dashboard", color: "bg-slate-600" },
};

function getModuleContext(path: string) {
  for (const prefix of Object.keys(moduleRoutes)) {
    if (path.startsWith(prefix)) return moduleRoutes[prefix];
  }
  return null;
}

export default function NotFound() {
  const [location, setLocation] = useLocation();
  const moduleCtx = getModuleContext(location);

  const goBack = () => window.history.back();
  const goHome = () => setLocation("/");
  const goModuleHome = () => moduleCtx && setLocation(moduleCtx.home);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-lg w-full text-center space-y-8">
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-32 h-32 rounded-3xl bg-orange-500/10 flex items-center justify-center">
              <Construction className="w-16 h-16 text-orange-500" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center shadow-lg">
              <span className="text-white text-xs font-bold">!</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-center gap-3">
            <span className="text-6xl font-black text-orange-500 tracking-tight">404</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Page Not Found
          </h1>
          <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
            This page doesn't exist yet or is coming in the next version of Emblazers School Management System.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 bg-orange-500/10 text-orange-600 dark:text-orange-400 px-4 py-2 rounded-full text-sm font-medium border border-orange-500/20">
          <Rocket className="w-4 h-4" />
          Coming Soon in Next Version
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={goBack}
            className="gap-2"
            data-testid="button-go-back"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>

          {moduleCtx ? (
            <Button
              onClick={goModuleHome}
              className="gap-2 bg-orange-500 hover:bg-orange-600 text-white"
              data-testid="button-module-home"
            >
              <Home className="w-4 h-4" />
              {moduleCtx.label} Home
            </Button>
          ) : (
            <Button
              onClick={goHome}
              className="gap-2 bg-orange-500 hover:bg-orange-600 text-white"
              data-testid="button-go-home"
            >
              <Home className="w-4 h-4" />
              Go to Home
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Path: <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{location}</code>
        </p>
      </div>
    </div>
  );
}
