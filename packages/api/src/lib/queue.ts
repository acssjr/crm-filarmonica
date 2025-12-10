import { Queue, Worker, Job } from 'bullmq'
import IORedis from 'ioredis'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

export const redisConnection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
})

// Queue names
export const WHATSAPP_INCOMING_QUEUE = 'whatsapp:incoming'

// Create a queue
export function createQueue(name: string): Queue {
  return new Queue(name, {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: 100,
      removeOnFail: 1000,
    },
  })
}

// Create a worker
export function createWorker<T>(
  name: string,
  processor: (job: Job<T>) => Promise<void>
): Worker<T> {
  return new Worker(name, processor, {
    connection: redisConnection,
    concurrency: 5,
  })
}

// Graceful shutdown
export async function closeQueues(): Promise<void> {
  await redisConnection.quit()
}
