import { Job, Queue, Worker } from 'bullmq'
import { redisConnection } from '../../lib/queue.js'
import { campaignService } from './campaign.service.js'
import { templateService } from '../templates/template.service.js'
import { findTemplateById } from '../templates/template.repository.js'
import { findContactById } from '../contacts/contact.repository.js'
import { sendWhatsAppMessage } from '../../lib/whatsapp-client.js'
import {
  findPendingRecipients,
  updateRecipientStatus,
  updateExecution,
} from './campaign.repository.js'

const QUEUE_NAME = 'campaign-processor'
const MESSAGES_PER_BATCH = 10
const DELAY_BETWEEN_MESSAGES_MS = 45000 // 45 seconds = ~80 msgs/hour

interface CampaignJobData {
  campanhaId: string
  executionId?: string
}

// Create queue
let campaignQueue: Queue | null = null

export function getCampaignQueue(): Queue {
  if (!campaignQueue) {
    campaignQueue = new Queue(QUEUE_NAME, { connection: redisConnection })
  }
  return campaignQueue
}

// Schedule a campaign for processing
export async function scheduleCampaignJob(campanhaId: string, runAt?: Date): Promise<void> {
  const queue = getCampaignQueue()

  const jobOptions: any = {
    jobId: `campaign-${campanhaId}`,
    removeOnComplete: true,
    removeOnFail: false,
  }

  if (runAt) {
    jobOptions.delay = runAt.getTime() - Date.now()
  }

  await queue.add('process-campaign', { campanhaId }, jobOptions)
}

// Process campaign job
async function processCampaignJob(job: Job<CampaignJobData>): Promise<void> {
  const { campanhaId } = job.data
  let executionId = job.data.executionId

  console.log(`[Campaign Worker] Starting campaign ${campanhaId}`)

  // Start execution if not already
  if (!executionId) {
    const result = await campaignService.startExecution(campanhaId)
    if (result.error) {
      console.error(`[Campaign Worker] Failed to start execution: ${result.error}`)
      return
    }
    executionId = result.executionId
  }

  const campanha = await campaignService.getById(campanhaId)
  if (!campanha) {
    console.error(`[Campaign Worker] Campaign not found: ${campanhaId}`)
    return
  }

  // Get template
  const template = await findTemplateById(campanha.templateId)
  if (!template) {
    console.error(`[Campaign Worker] Template not found: ${campanha.templateId}`)
    return
  }

  // Process messages in batches
  let hasMoreRecipients = true
  let stats = {
    totalEnviadas: 0,
    totalEntregues: 0,
    totalLidas: 0,
    totalRespondidas: 0,
    totalFalhas: 0,
  }

  while (hasMoreRecipients) {
    // Check if campaign was cancelled
    const currentCampanha = await campaignService.getById(campanhaId)
    if (!currentCampanha || currentCampanha.status === 'cancelada') {
      console.log(`[Campaign Worker] Campaign ${campanhaId} was cancelled`)
      break
    }

    // Get batch of pending recipients
    const recipients = await findPendingRecipients(campanhaId, MESSAGES_PER_BATCH)

    if (recipients.length === 0) {
      hasMoreRecipients = false
      continue
    }

    // Process each recipient
    for (const recipient of recipients) {
      try {
        // Get contact
        const contact = await findContactById(recipient.contatoId)
        if (!contact) {
          await updateRecipientStatus(recipient.id, 'falhou', 'Contato nao encontrado')
          stats.totalFalhas++
          continue
        }

        // Render template for this contact
        const message = await templateService.renderForContact(template.conteudo, recipient.contatoId)

        // Send message
        const phoneNumber = contact.telefone.replace('+', '')
        await sendWhatsAppMessage(phoneNumber, message)

        // Update status
        await updateRecipientStatus(recipient.id, 'enviada')
        stats.totalEnviadas++

        console.log(`[Campaign Worker] Sent message to ${contact.telefone}`)

        // Wait between messages to avoid rate limiting
        await sleep(DELAY_BETWEEN_MESSAGES_MS)

      } catch (error) {
        console.error(`[Campaign Worker] Failed to send to recipient ${recipient.id}:`, error)
        await updateRecipientStatus(recipient.id, 'falhou', (error as Error).message)
        stats.totalFalhas++
      }
    }

    // Update execution stats periodically
    if (executionId) {
      await updateExecution(executionId, stats)
    }
  }

  // Finalize execution
  if (executionId) {
    await updateExecution(executionId, {
      ...stats,
      concluidaAt: new Date(),
    })
  }

  // Finish campaign (handles recurrence)
  await campaignService.finishCampaign(campanhaId)

  console.log(`[Campaign Worker] Completed campaign ${campanhaId}. Stats:`, stats)
}

// Start the worker
export function startCampaignWorker(): Worker {
  const worker = new Worker<CampaignJobData>(
    QUEUE_NAME,
    processCampaignJob,
    {
      connection: redisConnection,
      concurrency: 1, // Process one campaign at a time
    }
  )

  worker.on('completed', (job) => {
    console.log(`[Campaign Worker] Job ${job.id} completed`)
  })

  worker.on('failed', (job, error) => {
    console.error(`[Campaign Worker] Job ${job?.id} failed:`, error)
  })

  console.log('[Campaign Worker] Worker started')

  return worker
}

// Check for scheduled campaigns and queue them
export async function checkScheduledCampaigns(): Promise<void> {
  const campaigns = await campaignService.findScheduledCampaigns()

  for (const campaign of campaigns) {
    console.log(`[Campaign Worker] Queueing scheduled campaign ${campaign.id}`)
    await scheduleCampaignJob(campaign.id)
  }
}

// Helper
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
