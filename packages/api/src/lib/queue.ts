import { Queue, Worker, Job } from 'bullmq'
import { Redis } from 'ioredis'
import { config } from '../config/index.js'

const REDIS_URL = config.redis.url || 'redis://localhost:6379'

export const redisConnection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
})

// Queue names
export const WHATSAPP_INCOMING_QUEUE = 'whatsapp-incoming'

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
