import { createWorker, WHATSAPP_INCOMING_QUEUE } from '../lib/queue.js'
import { processIncomingMessage } from '../modules/whatsapp/processor.js'
import type { IncomingMessageJob } from '../modules/whatsapp/message.queue.js'
import type { Job } from 'bullmq'

async function processJob(job: Job<IncomingMessageJob>): Promise<void> {
  const startTime = Date.now()
  console.log(`[Worker] Processing message ${job.data.messageId} from ${job.data.from}`)

  try {
    const result = await processIncomingMessage(job.data)
    const duration = Date.now() - startTime

    if (result.success) {
      console.log(
        `[Worker] Message processed in ${duration}ms - Intent: ${result.intent}, WhatsApp ID: ${result.messageId || 'N/A'}`
      )
    } else {
      console.error(`[Worker] Failed to process message: ${result.error}`)
      throw new Error(result.error)
    }
  } catch (error) {
    console.error('[Worker] Error processing message:', error)
    throw error // Let BullMQ handle retry
  }
}

// Create and start worker
export const whatsappWorker = createWorker<IncomingMessageJob>(
  WHATSAPP_INCOMING_QUEUE,
  processJob
)

whatsappWorker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed`)
})

whatsappWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err.message)
})

whatsappWorker.on('error', (err) => {
  console.error('[Worker] Worker error:', err)
})

console.log('[Worker] WhatsApp worker started')
