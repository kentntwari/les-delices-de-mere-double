import type { H3Event } from "h3";
import type { TOrderCommentDTO } from "~~/mvc/mapper/order";

type SSEWriter = {
  write: (data: string) => void;
  close: () => void;
};

const orderSSEConnections = new Map<string, Set<SSEWriter>>();

export function addSSEConnection(orderId: string, writer: SSEWriter): void {
  if (!orderSSEConnections.has(orderId)) {
    orderSSEConnections.set(orderId, new Set());
  }
  orderSSEConnections.get(orderId)!.add(writer);
}

export function removeSSEConnection(orderId: string, writer: SSEWriter): void {
  const connections = orderSSEConnections.get(orderId);
  if (connections) {
    connections.delete(writer);
    if (connections.size === 0) {
      orderSSEConnections.delete(orderId);
    }
  }
}

export function broadcastComment(
  orderId: string,
  comment: TOrderCommentDTO,
): void {
  const connections = orderSSEConnections.get(orderId);
  if (!connections) return;

  const payload = `data: ${JSON.stringify(comment)}\n\n`;
  for (const writer of connections) {
    try {
      writer.write(payload);
    } catch {
      connections.delete(writer);
    }
  }
}
