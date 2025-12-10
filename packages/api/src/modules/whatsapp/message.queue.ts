import { createQueue, WHATSAPP_INCOMING_QUEUE } from '../../lib/queue.js'

export interface IncomingMessageJob {
  from: string
  messageId: string
  timestamp: string
  type: string
  text?: string
  receivedAt: string
}

export const whatsappIncomingQueue = createQueue(WHATSAPP_INCOMING_QUEUE)

export async function enqueueIncomingMessage(data: IncomingMessageJob): Promise<string> {
  const job = await whatsappIncomingQueue.add('process-message', data, {
    priority: 1, // High priority for fast response
  })
  return job.id || 'unknown'
}
