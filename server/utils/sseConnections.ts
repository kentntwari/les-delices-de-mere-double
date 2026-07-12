import type { IApiOrderCommentData } from "~~/shared/types";

type EventStreamMessage = {
  data: string;
  event?: string;
  id?: string;
  retry?: number;
};

type EventStreamLike = {
  push(message: string | EventStreamMessage): Promise<void>;
};

const orderSSEConnections = new Map<string, Set<EventStreamLike>>();

function normalizeOrderId(orderId: string): string {
  return orderId.trim().toLowerCase();
}

export function addSSEConnection(
  orderId: string,
  stream: EventStreamLike,
): void {
  const normalizedOrderId = normalizeOrderId(orderId);

  if (!orderSSEConnections.has(normalizedOrderId)) {
    orderSSEConnections.set(normalizedOrderId, new Set());
  }

  orderSSEConnections.get(normalizedOrderId)!.add(stream);
}

export function removeSSEConnection(
  orderId: string,
  stream: EventStreamLike,
): void {
  const normalizedOrderId = normalizeOrderId(orderId);
  const connections = orderSSEConnections.get(normalizedOrderId);

  if (connections) {
    connections.delete(stream);

    if (connections.size === 0) {
      orderSSEConnections.delete(normalizedOrderId);
    }
  }
}

export function broadcastComment(
  orderId: string,
  comment: IApiOrderCommentData,
): void {
  const normalizedOrderId = normalizeOrderId(orderId);
  const connections = orderSSEConnections.get(normalizedOrderId);

  if (!connections) return;

  const payload = JSON.stringify(comment);

  for (const stream of connections) {
    stream.push({ data: payload }).catch(() => {
      removeSSEConnection(normalizedOrderId, stream);
    });
  }
}
