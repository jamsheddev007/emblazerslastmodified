import { useState, useEffect, useCallback } from "react";

type PermMatrix = Record<string, Record<string, boolean>>;

let cachedPermissions: PermMatrix | null | undefined = undefined;

export function usePermissions() {
  const [permissions, setPermissions] = useState<PermMatrix | null>(cachedPermissions ?? null);
  const [loading, setLoading] = useState(cachedPermissions === undefined);

  useEffect(() => {
    if (cachedPermissions !== undefined) {
      setPermissions(cachedPermissions);
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("emblazers_token");
    if (!token) {
      cachedPermissions = null;
      setPermissions(null);
      setLoading(false);
      return;
    }

    fetch("/api/auth/my-permissions", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const perms = data?.permissions || null;
        cachedPermissions = perms;
        setPermissions(perms);
      })
      .catch(() => {
        cachedPermissions = null;
        setPermissions(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const can = useCallback((feature: string, action: string): boolean => {
    if (!permissions) return true;
    const featurePerms = permissions[feature];
    if (!featurePerms) return true;
    return featurePerms[action] !== false;
  }, [permissions]);

  const hasCustomPermissions = permissions !== null;

  return { permissions, loading, can, hasCustomPermissions };
}

export function clearPermissionsCache() {
  cachedPermissions = undefined;
}
