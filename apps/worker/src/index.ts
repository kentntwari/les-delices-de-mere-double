import { Queue } from "bullmq";

const queueName = process.env.BULLMQ_QUEUE_NAME ?? "les-delices-jobs";

export function createWorkerQueue(): Queue {
  return new Queue(queueName, {
    connection: {
      host: process.env.REDIS_HOST ?? "127.0.0.1",
      port: Number.parseInt(process.env.REDIS_PORT ?? "6379", 10),
      password: process.env.REDIS_PASSWORD,
    },
  });
}

if (process.env.NODE_ENV !== "test") {
  const queue = createWorkerQueue();
  console.log(`BullMQ worker scaffold ready for queue: ${queue.name}`);
}
