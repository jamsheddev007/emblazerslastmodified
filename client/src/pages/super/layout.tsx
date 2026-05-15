import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { getSuperToken, clearSuperToken } from "./super-auth";
import { Shield, LayoutDashboard, School, GitBranch, Users, LogOut, BarChart3, ScrollText, FileText } from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/super/dashboard", icon: LayoutDashboard },
  { label: "Analytics", href: "/super/analytics", icon: BarChart3 },
  { label: "Schools", href: "/super/schools", icon: School },
  { label: "Branches", href: "/super/branches", icon: GitBranch },
  { label: "Admins", href: "/super/admins", icon: Users },
  { label: "Audit Logs", href: "/super/audit-logs", icon: ScrollText },
  { label: "Report Cards", href: "/super/report-card-settings", icon: FileText },
];

export default function SuperLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!getSuperToken()) {
      setLocation("/super/login");
    }
  }, [setLocation]);

  if (!getSuperToken()) return null;

  const handleLogout = () => {
    clearSuperToken();
    setLocation("/super/login");
  };

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-64 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">Emblazers</h2>
              <p className="text-xs text-muted-foreground">Super Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                    isActive
                      ? "bg-indigo-600 text-white"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t space-y-2">
          <div className="px-3 py-2">
            <p className="text-xs text-muted-foreground">Logged in as</p>
            <p className="text-sm font-medium" data-testid="text-user-label">Super Admin</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full transition-colors"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
