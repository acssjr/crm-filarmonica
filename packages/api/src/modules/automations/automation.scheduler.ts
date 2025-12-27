/**
 * Automation Scheduler
 * BullMQ adapter for scheduling automation jobs
 */

import { Job, Queue, Worker } from 'bullmq'
import { redisConnection } from '../../lib/queue.js'
import { scheduledAutomationsService, executeAutomationService } from './index.js'
import { TriggerEvent } from './domain/value-objects/trigger.vo.js'

const QUEUE_NAME = 'automation-processor'

interface AutomationJobData {
  type: 'trigger' | 'scheduled-check' | 'resume-execution'
  payload: {
    event?: TriggerEvent
    executionId?: string
  }
}

// Create queue
let automationQueue: Queue | null = null

export function getAutomationQueue(): Queue {
  if (!automationQueue) {
    automationQueue = new Queue(QUEUE_NAME, { connection: redisConnection })
  }
  return automationQueue
}

/**
 * Queue a trigger event for processing
 */
export async function queueTriggerEvent(event: TriggerEvent): Promise<void> {
  const queue = getAutomationQueue()

  await queue.add(
    'trigger',
    {
      type: 'trigger',
      payload: { event },
    } as AutomationJobData,
    {
      removeOnComplete: true,
      removeOnFail: false,
    }
  )

  console.log(`[AutomationScheduler] Queued trigger event: ${event.tipo} for contact ${event.contatoId}`)
}

/**
 * Queue resume of a paused execution
 */
export async function queueResumeExecution(executionId: string): Promise<void> {
  const queue = getAutomationQueue()

  await queue.add(
    'resume',
    {
      type: 'resume-execution',
      payload: { executionId },
    } as AutomationJobData,
    {
      removeOnComplete: true,
      removeOnFail: false,
    }
  )

  console.log(`[AutomationScheduler] Queued resume for execution ${executionId}`)
}

/**
 * Process automation jobs
 */
async function processAutomationJob(job: Job<AutomationJobData>): Promise<void> {
  const { type, payload } = job.data

  console.log(`[AutomationScheduler] Processing job: ${type}`)

  switch (type) {
    case 'trigger':
      if (payload.event) {
        await executeAutomationService.handleTrigger(payload.event)
      }
      break

    case 'resume-execution':
      if (payload.executionId) {
        await executeAutomationService.resumeExecution(payload.executionId)
      }
      break

    case 'scheduled-check':
      await scheduledAutomationsService.run()
      break

    default:
      console.error(`[AutomationScheduler] Unknown job type: ${type}`)
  }
}

/**
 * Start the automation worker
 */
export function startAutomationWorker(): Worker {
  const worker = new Worker<AutomationJobData>(QUEUE_NAME, processAutomationJob, {
    connection: redisConnection,
    concurrency: 5,
  })

  worker.on('completed', job => {
    console.log(`[AutomationScheduler] Job ${job.id} completed`)
  })

  worker.on('failed', (job, error) => {
    console.error(`[AutomationScheduler] Job ${job?.id} failed:`, error)
  })

  console.log('[AutomationScheduler] Worker started')

  return worker
}

/**
 * Schedule the periodic check for time-based automations
 * Runs every 5 minutes
 */
export async function schedulePeriodicCheck(): Promise<void> {
  const queue = getAutomationQueue()

  // Remove existing repeatable job if any
  const repeatableJobs = await queue.getRepeatableJobs()
  for (const job of repeatableJobs) {
    if (job.name === 'scheduled-check') {
      await queue.removeRepeatableByKey(job.key)
    }
  }

  // Add new repeatable job
  await queue.add(
    'scheduled-check',
    {
      type: 'scheduled-check',
      payload: {},
    } as AutomationJobData,
    {
      repeat: {
        every: 5 * 60 * 1000, // Every 5 minutes
      },
      removeOnComplete: true,
      removeOnFail: false,
    }
  )

  console.log('[AutomationScheduler] Periodic check scheduled (every 5 minutes)')
}

/**
 * Initialize the automation scheduler
 */
export function initializeAutomationScheduler(): Worker {
  const worker = startAutomationWorker()
  schedulePeriodicCheck().catch(console.error)
  return worker
}
