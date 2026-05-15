import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { moduleConfigs } from "@/lib/module-config";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Eye, EyeOff, Lock } from "lucide-react";

export default function ParentLoginPage() {
  const [, setLocation] = useLocation();
  const { loginParent, isAuthenticated, session } = useAuth();
  const config = moduleConfigs["parent"];

  const [cnic, setCnic] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated("parent") && session?.role === "parent") {
      setLocation("/parent/dashboard");
    }
  }, [isAuthenticated, session, setLocation]);

  if (isAuthenticated("parent") && session?.role === "parent") {
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const result = await loginParent(cnic, password);
    if (result.success) {
      setLocation("/parent/dashboard");
    } else {
      setError(result.error || "Login failed.");
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
          <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
            <Lock className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-lg">Emblazers</span>
        </button>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4 text-center">
            <div className="w-16 h-16 bg-orange-500 rounded-lg flex items-center justify-center mx-auto">
              {config.icon && <config.icon className="w-8 h-8 text-white" />}
            </div>
            <div>
              <CardTitle className="text-2xl font-semibold" data-testid="text-page-title">Parent Portal</CardTitle>
              <CardDescription className="mt-2">
                CNIC number aur password se login karein
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
                <Label htmlFor="cnic">CNIC Number</Label>
                <Input
                  id="cnic"
                  value={cnic}
                  onChange={(e) => setCnic(e.target.value)}
                  placeholder="e.g. 3520112345678"
                  required
                  data-testid="input-cnic"
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
                    placeholder="Enter password"
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
              </div>
              <p className="text-xs text-muted-foreground">Default password CNIC ke last 6 digits hain. Pehli baar login par password change karein.</p>
              <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={isLoading} data-testid="button-submit">
                {isLoading ? "Logging in..." : "Login as Parent"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
