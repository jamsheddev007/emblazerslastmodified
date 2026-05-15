import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { ModuleLayout } from "@/components/layout/module-layout";
import { parentNavItems } from "./parent-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Eye, EyeOff, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function ParentChangePassword() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, session } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated("parent") || session?.role !== "parent") {
      setLocation("/parent/login");
    }
  }, [isAuthenticated, session, setLocation]);

  if (!isAuthenticated("parent") || session?.role !== "parent") return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/parent/change-password", { currentPassword, newPassword });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setError(data.error || "Failed to change password");
      }
    } catch (err) {
      setError("Connection error");
    }
    setIsLoading(false);
  };

  return (
    <ModuleLayout module="parent" navItems={parentNavItems}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold" data-testid="text-page-title">Change Password</h1>
          <p className="text-muted-foreground mt-1">Apna password yahan se change karein</p>
        </div>

        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <KeyRound className="w-5 h-5 text-orange-500" />
              Update Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            {success && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md flex items-center gap-2" data-testid="text-success">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-700 dark:text-green-400">Password successfully changed</span>
              </div>
            )}
            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm" data-testid="text-error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current">Current Password</Label>
                <div className="relative">
                  <Input id="current" type={showCurrent ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required data-testid="input-current-password" />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new">New Password</Label>
                <div className="relative">
                  <Input id="new" type={showNew ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required data-testid="input-new-password" />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm New Password</Label>
                <Input id="confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required data-testid="input-confirm-password" />
              </div>
              <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={isLoading} data-testid="button-change-password">
                {isLoading ? "Changing..." : "Change Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
}
