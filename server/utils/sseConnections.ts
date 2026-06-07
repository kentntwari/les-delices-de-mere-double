import type { TOrderCommentDTO } from "~~/mvc/mapper/order";
import { IApiOrderCommentData } from "~~/shared/types";

type EventStreamLike = {
  push(message: string): Promise<void>;
};

const orderSSEConnections = new Map<string, Set<EventStreamLike>>();

export function addSSEConnection(
  orderId: string,
  stream: EventStreamLike,
): void {
  if (!orderSSEConnections.has(orderId)) {
    orderSSEConnections.set(orderId, new Set());
  }
  orderSSEConnections.get(orderId)!.add(stream);
}

export function removeSSEConnection(
  orderId: string,
  stream: EventStreamLike,
): void {
  const connections = orderSSEConnections.get(orderId);
  if (connections) {
    connections.delete(stream);
    if (connections.size === 0) {
      orderSSEConnections.delete(orderId);
    }
  }
}

export function broadcastComment(
  orderId: string,
  comment: IApiOrderCommentData,
): void {
  const connections = orderSSEConnections.get(orderId);
  if (!connections) return;

  const payload = JSON.stringify(comment);
  for (const stream of connections) {
    stream.push(payload).catch(() => {
      connections.delete(stream);
    });
  }
}
