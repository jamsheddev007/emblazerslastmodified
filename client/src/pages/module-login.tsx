import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { ModuleLogin } from "@/components/layout/module-login";
import { moduleConfigs } from "@/lib/module-config";
import { useAuth } from "@/lib/auth";
import { moduleCredentials, type ModuleType } from "@shared/schema";

export default function ModuleLoginPage() {
  const { module } = useParams<{ module?: string }>();
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  const isValidModule = !!module && Object.prototype.hasOwnProperty.call(moduleCredentials, module);
  const moduleKey = module as ModuleType;
  const config = isValidModule ? moduleConfigs[moduleKey] : undefined;

  useEffect(() => {
    if (!isValidModule || !config) {
      setLocation("/");
      return;
    }

    if (isAuthenticated(moduleKey)) {
      setLocation(config.dashboardPath);
    }
  }, [config, isAuthenticated, isValidModule, moduleKey, setLocation]);

  if (!isValidModule || !config) {
    return null;
  }

  return <ModuleLogin module={moduleKey} />;
}
