// Export all workers
export { whatsappWorker } from './whatsapp.worker.js'

// Graceful shutdown
import { closeQueues } from '../lib/queue.js'
import { whatsappWorker } from './whatsapp.worker.js'

async function shutdown() {
  console.log('[Workers] Shutting down...')
  await whatsappWorker.close()
  await closeQueues()
  console.log('[Workers] Shutdown complete')
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
