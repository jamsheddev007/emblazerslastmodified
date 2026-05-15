import { type ReactNode, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { type ModuleType } from "@shared/schema";
import { moduleConfigs } from "@/lib/module-config";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationBell } from "@/components/ui/notification-bell";
import { NotificationProvider } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { LogOut, ChevronRight, type LucideIcon } from "lucide-react";
import { ChangePasswordDialog } from "@/components/ui/change-password-dialog";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  sectionLabel?: string;
}

interface ModuleLayoutProps {
  module: ModuleType;
  navItems: NavItem[];
  children: ReactNode;
  badgeCounts?: Record<string, number>;
}

function AppSidebar({ module, navItems, onLogout, badgeCounts = {} }: { module: ModuleType; navItems: NavItem[]; onLogout: () => void; badgeCounts?: Record<string, number> }) {
  const [location] = useLocation();
  const config = moduleConfigs[module];
  const Icon = config.icon;
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href={`/${module}/dashboard`} data-testid="link-sidebar-home">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${config.bgColor} rounded-lg flex items-center justify-center`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-sm" data-testid="text-module-name">{config.shortName}</h1>
              <p className="text-xs text-muted-foreground">Emblazers</p>
            </div>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.flatMap((item) => {
                const ItemIcon = item.icon;
                const isActive = location === item.path || (item.path !== `/${module}/dashboard` && location.startsWith(item.path));
                const badgeCount = badgeCounts[item.path];
                const elements = [];
                if (item.sectionLabel) {
                  elements.push(
                    <SidebarMenuItem key={`section-${item.path}`}>
                      <div className="px-2 pt-3 pb-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                        {item.sectionLabel}
                      </div>
                    </SidebarMenuItem>
                  );
                }
                elements.push(
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      onClick={() => setOpenMobile(false)}
                      data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <Link href={item.path}>
                        <ItemIcon className="w-4 h-4" />
                        <span className="flex-1">{item.label}</span>
                        {badgeCount !== undefined && badgeCount > 0 && (
                          <Badge variant="destructive" className="text-xs px-1.5 py-0 min-w-[1.25rem] text-center">
                            {badgeCount > 99 ? "99+" : badgeCount}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
                return elements;
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <SidebarMenu>
          <ChangePasswordDialog />
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onLogout} data-testid="button-logout">
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export function ModuleLayout({ module, navItems, children, badgeCounts }: ModuleLayoutProps) {
  const [location, setLocation] = useLocation();
  const { logout, isAuthenticated, session, token } = useAuth();
  const config = moduleConfigs[module];

  // Only redirect if not authenticated - don't check localStorage directly
  // This prevents race conditions and allows the auth context to manage session
  useEffect(() => {
    if (!isAuthenticated(module)) {
      setLocation(config.loginPath);
    }
  }, [module, isAuthenticated, setLocation, config.loginPath]);

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const currentPage = navItems.find((item) => location.startsWith(item.path))?.label || "Dashboard";

  const sidebarStyle = {
    "--sidebar-width": "15rem",
    "--sidebar-width-icon": "3rem",
  };

  const layoutContent = (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar module={module} navItems={navItems} onLogout={handleLogout} badgeCounts={badgeCounts} />

        <div className="flex flex-col flex-1 min-w-0">
          <header className="h-16 border-b flex items-center justify-between gap-4 px-4 lg:px-6 bg-background sticky top-0 z-30">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground" data-testid="text-module-breadcrumb">{config.shortName}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium" data-testid="text-page-breadcrumb">{currentPage}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {module !== "library" && <NotificationBell />}
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 overflow-auto p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );

  // Only wrap with NotificationProvider for non-library modules
  // This completely disables all notification API calls, WebSocket connections, and polling for library module
  if (module === "library") {
    return layoutContent;
  }

  return (
    <NotificationProvider module={module}>
      {layoutContent}
    </NotificationProvider>
  );
}
