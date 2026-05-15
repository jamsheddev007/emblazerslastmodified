import { apiRequest, queryClient } from "./queryClient";
import type { ActivityAction, InsertActivityLog, InsertNotification } from "@shared/schema";

interface LogActionParams {
  module: string;
  action: ActivityAction;
  entityType: string;
  entityId?: string;
  entityName?: string;
  description: string;
  link?: string;
  notificationTitle?: string;
  metadata?: Record<string, any>;
}

export async function logAction({
  module,
  action,
  entityType,
  entityId,
  entityName,
  description,
  link,
  notificationTitle,
  metadata,
}: LogActionParams): Promise<void> {
  try {
    const activityLog: InsertActivityLog = {
      module,
      action,
      entityType,
      entityId,
      entityName,
      description,
      metadata,
    };
    await apiRequest("POST", "/api/activity-logs", activityLog);

    const notification: InsertNotification = {
      type: "action_log",
      title: notificationTitle || getDefaultTitle(action, entityType),
      message: description,
      module,
      priority: "medium",
      read: false,
      link,
      metadata: metadata ? Object.fromEntries(Object.entries(metadata).map(([k, v]) => [k, String(v)])) : undefined,
    };
    await apiRequest("POST", "/api/notifications", notification);

    queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    queryClient.invalidateQueries({ queryKey: ["/api/notifications", module] });
    queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count", module] });
    queryClient.invalidateQueries({ queryKey: ["/api/activity-logs"] });
  } catch (error) {
    console.error("Failed to log action:", error);
  }
}

function getDefaultTitle(action: ActivityAction, entityType: string): string {
  const actionLabels: Record<ActivityAction, string> = {
    create: "Created",
    update: "Updated",
    delete: "Deleted",
    generate: "Generated",
    payment: "Payment Recorded",
    status_change: "Status Changed",
    export: "Exported",
    import: "Imported",
    login: "Logged In",
    other: "Action Performed",
  };
  return `${actionLabels[action]} ${entityType}`;
}

export function getActionIcon(action: ActivityAction): string {
  const icons: Record<ActivityAction, string> = {
    create: "plus-circle",
    update: "edit",
    delete: "trash-2",
    generate: "file-plus",
    payment: "credit-card",
    status_change: "refresh-cw",
    export: "download",
    import: "upload",
    login: "log-in",
    other: "activity",
  };
  return icons[action];
}
