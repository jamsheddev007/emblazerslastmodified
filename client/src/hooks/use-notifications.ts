import { useEffect, useCallback } from "react";

export function useNotifications() {
  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;

    const permission = await Notification.requestPermission();
    return permission === "granted";
  }, []);

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "SHOW_NOTIFICATION",
        title,
        options: {
          icon: "/icon-192.svg",
          badge: "/icon-192.svg",
          ...options,
        },
      });
    } else {
      new Notification(title, {
        icon: "/icon-192.svg",
        ...options,
      });
    }
  }, []);

  return { requestPermission, sendNotification };
}

export function useAutoNotificationPermission() {
  const { requestPermission } = useNotifications();

  useEffect(() => {
    const timer = setTimeout(() => {
      requestPermission();
    }, 3000);
    return () => clearTimeout(timer);
  }, [requestPermission]);
}
