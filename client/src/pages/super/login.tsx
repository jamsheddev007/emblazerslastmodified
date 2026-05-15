import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { setSuperToken, getSuperToken } from "./super-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Shield, Eye, EyeOff } from "lucide-react";

export default function SuperLoginPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (getSuperToken()) {
      setLocation("/super/dashboard");
    }
  }, [setLocation]);

  if (getSuperToken()) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/super/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        setSuperToken(data.token);
        setLocation("/super/dashboard");
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex items-center justify-between p-4 border-b">
        <button onClick={() => setLocation("/")} className="flex items-center gap-2 hover:opacity-80 px-3 py-2 rounded-md" data-testid="link-home">
          <div className="w-8 h-8 bg-indigo-600 rounded-md flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-lg">Emblazers</span>
        </button>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4 text-center">
            <div className="w-16 h-16 bg-indigo-600 rounded-lg flex items-center justify-center mx-auto">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-semibold" data-testid="text-page-title">Super Admin</CardTitle>
              <CardDescription className="mt-2">System-wide management portal</CardDescription>
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
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="Super admin email" value={email} onChange={(e) => setEmail(e.target.value)} required data-testid="input-email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} required data-testid="input-password" />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)} data-testid="button-toggle-password">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isLoading} data-testid="button-login">
                {isLoading ? "Logging in..." : "Login as Super Admin"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
