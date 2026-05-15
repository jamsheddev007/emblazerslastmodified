import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { type ModuleType } from "@shared/schema";
import { moduleConfigs } from "@/lib/module-config";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Eye, EyeOff, Lock } from "lucide-react";

interface ModuleLoginProps {
  module: ModuleType;
}

export function ModuleLogin({ module }: ModuleLoginProps) {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const config = moduleConfigs[module];
  const Icon = config.icon;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const success = await login(module, email, password);
    if (success) {
      setLocation(config.dashboardPath);
    } else {
      setError("Invalid email or password. Please try again.");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex items-center justify-between p-4 border-b">
        <button
          onClick={() => setLocation("/")}
          className="flex items-center gap-2 hover-elevate active-elevate-2 px-3 py-2 rounded-md"
          data-testid="link-home"
        >
          <div className={`w-8 h-8 ${config.bgColor} rounded-md flex items-center justify-center`}>
            <Lock className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-lg">Emblazers</span>
        </button>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4 text-center">
            <div className={`w-16 h-16 ${config.bgColor} rounded-lg flex items-center justify-center mx-auto`}>
              <Icon className="w-8 h-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-semibold">{config.name}</CardTitle>
              <CardDescription className="mt-2">{config.description}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm" data-testid="text-error">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
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

              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  data-testid="checkbox-remember"
                />
                <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                  Remember me
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t">
              <p className="text-xs text-muted-foreground text-center">
                Demo credentials are pre-configured for this module.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="p-4 border-t text-center text-sm text-muted-foreground">
        Emblazers School Management System
      </footer>
    </div>
  );
}
