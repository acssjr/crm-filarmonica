/**
 * Channel Adapters Index
 *
 * Registers all available channel adapters and exports them for use.
 */

export * from './channel.adapter.js'
export * from './whatsapp.adapter.js'

import { channelRegistry } from './channel.adapter.js'
import { whatsappAdapter } from './whatsapp.adapter.js'

// Register all adapters
channelRegistry.register(whatsappAdapter)

// Re-export registry for convenience
export { channelRegistry }

/**
 * Get adapter for a specific channel
 */
export function getAdapter(channel: 'whatsapp' | 'instagram' | 'messenger') {
  return channelRegistry.get(channel)
}

/**
 * Send a message through any channel
 */
export async function sendMessage(
  channel: 'whatsapp' | 'instagram' | 'messenger',
  to: string,
  text: string
) {
  const adapter = channelRegistry.get(channel)

  if (!adapter) {
    return {
      success: false,
      error: `Channel adapter not found: ${channel}`,
    }
  }

  return adapter.sendText(to, text)
}
