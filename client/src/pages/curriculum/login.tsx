import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { moduleConfigs } from "@/lib/module-config";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Eye, EyeOff, Lock, ShieldCheck, UserCog, ArrowLeft, Info } from "lucide-react";

type LoginRole = "select" | "admin" | "teacher";

export default function CurriculumLoginPage() {
  const [, setLocation] = useLocation();
  const { login, loginTeacher, isAuthenticated, session } = useAuth();
  const config = moduleConfigs["curriculum"];

  const [role, setRole] = useState<LoginRole>("select");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated("curriculum") && session) {
      const r = session.role;
      if (r === "teacher") {
        setLocation("/curriculum/teacher-dashboard");
      } else if (r === "student") {
        setLocation("/curriculum/student-dashboard");
      } else {
        setLocation("/curriculum/dashboard");
      }
    }
  }, [isAuthenticated, session, setLocation]);

  if (isAuthenticated("curriculum") && session) {
    return null;
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const success = await login("curriculum", email, password);
    if (success) {
      setLocation("/curriculum/dashboard");
    } else {
      setError("Invalid email or password.");
    }
    setIsLoading(false);
  };

  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const result = await loginTeacher(email, password);
    if (result.success) {
      setLocation("/curriculum/teacher-dashboard");
    } else {
      setError(result.error || "Login failed.");
    }
    setIsLoading(false);
  };

  const roleCards = [
    { key: "admin" as LoginRole, label: "Admin", desc: "Full curriculum management", icon: ShieldCheck, color: "bg-violet-500" },
    { key: "teacher" as LoginRole, label: "Teacher", desc: "Manage classes & content", icon: UserCog, color: "bg-emerald-500" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex items-center justify-between p-4 border-b">
        <button
          onClick={() => setLocation("/")}
          className="flex items-center gap-2 hover:opacity-80 px-3 py-2 rounded-md"
          data-testid="link-home"
        >
          <div className="w-8 h-8 bg-violet-500 rounded-md flex items-center justify-center">
            <Lock className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-lg">Emblazers</span>
        </button>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4 text-center">
            <div className="w-16 h-16 bg-violet-500 rounded-lg flex items-center justify-center mx-auto">
              {config.icon && <config.icon className="w-8 h-8 text-white" />}
            </div>
            <div>
              <CardTitle className="text-2xl font-semibold">{config.name}</CardTitle>
              <CardDescription className="mt-2">
                {role === "select" ? "Choose your role to continue" : `Sign in as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm" data-testid="text-error">
                {error}
              </div>
            )}

            {role === "select" && (
              <div className="grid gap-3" data-testid="role-selection">
                {roleCards.map((rc) => (
                  <button
                    key={rc.key}
                    onClick={() => { setRole(rc.key); setError(""); setEmail(""); setPassword(""); }}
                    className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent transition-colors text-left"
                    data-testid={`button-role-${rc.key}`}
                  >
                    <div className={`w-12 h-12 ${rc.color} rounded-lg flex items-center justify-center shrink-0`}>
                      <rc.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-medium">{rc.label} Login</div>
                      <div className="text-sm text-muted-foreground">{rc.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {role === "admin" && (
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@emblazers.com" required data-testid="input-email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" required data-testid="input-password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" data-testid="button-toggle-password">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full bg-violet-500 hover:bg-violet-600" disabled={isLoading} data-testid="button-submit">
                  {isLoading ? "Signing in..." : "Sign in as Admin"}
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => { setRole("select"); setError(""); }} data-testid="button-back">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to role selection
                </Button>
              </form>
            )}

            {role === "teacher" && (
              <form onSubmit={handleTeacherLogin} className="space-y-4">
                <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                  <Info className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">How to login:</p>
                    <ul className="mt-1 space-y-0.5 text-emerald-700/80 dark:text-emerald-400/80">
                      <li>• Enter the email address from your staff profile</li>
                      <li>• Your default password is your <strong>Staff ID</strong> (e.g. STF0101)</li>
                    </ul>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teacher-email">Staff Email</Label>
                  <Input id="teacher-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. teacher@school.com" required data-testid="input-teacher-email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teacher-password">Password <span className="text-muted-foreground font-normal">(default: your Staff ID)</span></Label>
                  <div className="relative">
                    <Input id="teacher-password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="e.g. STF0101" required data-testid="input-teacher-password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600" disabled={isLoading} data-testid="button-teacher-submit">
                  {isLoading ? "Signing in..." : "Sign in as Teacher"}
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => { setRole("select"); setError(""); }} data-testid="button-back">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to role selection
                </Button>
              </form>
            )}

          </CardContent>
        </Card>
      </main>
    </div>
  );
}
