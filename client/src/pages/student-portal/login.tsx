import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Eye, EyeOff, GraduationCap, ArrowLeft } from "lucide-react";

export default function StudentPortalLogin() {
  const [, setLocation] = useLocation();
  const { loginStudent, isAuthenticated, session } = useAuth();

  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated("curriculum") && session?.role === "student") {
      setLocation("/curriculum/student-dashboard");
    }
  }, [isAuthenticated, session, setLocation]);

  if (isAuthenticated("curriculum") && session?.role === "student") {
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const result = await loginStudent(studentId.trim(), password);
    if (result.success) {
      setLocation("/curriculum/student-dashboard");
    } else {
      setError(result.error || "Invalid Student ID or password. Please try again.");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex items-center justify-between p-4 border-b">
        <button
          onClick={() => setLocation("/")}
          className="flex items-center gap-2 hover:opacity-80 px-3 py-2 rounded-md"
          data-testid="link-home"
        >
          <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-lg">Emblazers</span>
        </button>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-sm">
          <CardHeader className="space-y-4 text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-semibold">Student Portal</CardTitle>
              <CardDescription className="mt-1">
                Sign in to view your results, attendance, fees, and more
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm" data-testid="text-error">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="student-id">Student ID</Label>
                <Input
                  id="student-id"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. C5-A-2026-0001"
                  required
                  autoFocus
                  data-testid="input-student-id"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Default password is <span className="font-medium">12345678</span>. You will be asked to change it on first login.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
                data-testid="button-submit"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setLocation("/")}
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <footer className="py-4 text-center text-xs text-muted-foreground border-t">
        Emblazers School Management System
      </footer>
    </div>
  );
}
