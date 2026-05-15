import { WebSocket } from "ws";

export const clients = new Set<WebSocket>();

export function broadcastNotification(notification: any) {
  const message = JSON.stringify({ type: "notification", data: notification });
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}
