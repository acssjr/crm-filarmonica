/**
 * Spam Protection Service
 *
 * Uses Redis to track message frequency and detect spam/abuse.
 * Replaces the in-memory implementation for better scalability.
 *
 * Reference: docs uteis/CRM Omni-Channel para Escola de Música.md
 * "O uso do Redis com o algoritmo Redlock garante que apenas um atendente
 * consiga travar a edição de uma conversa por vez"
 */

import { redisConnection } from './queue.js'
import { config } from '../config/index.js'

const SPAM_PREFIX = 'spam:'

interface SpamCheckResult {
  isSpam: boolean
  count: number
  remainingWindow: number
}

/**
 * Spam Protection Service
 *
 * Tracks contextless messages per phone number using Redis.
 * After N contextless messages in M seconds, the user is flagged as spam.
 */
export class SpamProtectionService {
  private readonly threshold: number
  private readonly windowMs: number
  private readonly enabled: boolean

  constructor() {
    this.threshold = config.spamProtection.threshold
    this.windowMs = config.spamProtection.windowMs
    this.enabled = config.spamProtection.enabled
  }

  /**
   * Check if a phone number is sending spam
   *
   * @param phone - Phone number to check
   * @param hasContext - Whether the message has meaningful context/intent
   * @returns SpamCheckResult with spam status
   */
  async check(phone: string, hasContext: boolean): Promise<SpamCheckResult> {
    if (!this.enabled) {
      return { isSpam: false, count: 0, remainingWindow: 0 }
    }

    const key = this.getKey(phone)

    try {
      // If message has context, reset the counter
      if (hasContext) {
        await this.reset(phone)
        return { isSpam: false, count: 0, remainingWindow: 0 }
      }

      // Increment counter
      const count = await redisConnection.incr(key)

      // Set expiry on first increment
      if (count === 1) {
        await redisConnection.pexpire(key, this.windowMs)
      }

      // Get remaining TTL
      const ttl = await redisConnection.pttl(key)
      const remainingWindow = ttl > 0 ? ttl : 0

      const isSpam = count >= this.threshold
      if (isSpam) {
        console.log(`[SpamProtection] Spam detected for ${phone}: ${count} messages in window`)
      }

      return { isSpam, count, remainingWindow }
    } catch (error) {
      // If Redis fails, don't block the message (fail open)
      console.error('[SpamProtection] Redis error:', error)
      return { isSpam: false, count: 0, remainingWindow: 0 }
    }
  }

  /**
   * Reset spam counter for a phone number
   */
  async reset(phone: string): Promise<void> {
    try {
      await redisConnection.del(this.getKey(phone))
    } catch (error) {
      console.error('[SpamProtection] Failed to reset counter:', error)
    }
  }

  /**
   * Get current spam count for a phone number (for debugging/admin)
   */
  async getCount(phone: string): Promise<number> {
    try {
      const count = await redisConnection.get(this.getKey(phone))
      return count ? parseInt(count, 10) : 0
    } catch (error) {
      console.error('[SpamProtection] Failed to get count:', error)
      return 0
    }
  }

  /**
   * Block a phone number temporarily
   */
  async block(phone: string, durationMs: number = 3600000): Promise<void> {
    try {
      const key = `${SPAM_PREFIX}blocked:${phone}`
      await redisConnection.set(key, '1', 'PX', durationMs)
      console.log(`[SpamProtection] Blocked ${phone} for ${durationMs}ms`)
    } catch (error) {
      console.error('[SpamProtection] Failed to block phone:', error)
    }
  }

  /**
   * Check if a phone number is blocked
   */
  async isBlocked(phone: string): Promise<boolean> {
    try {
      const key = `${SPAM_PREFIX}blocked:${phone}`
      const blocked = await redisConnection.exists(key)
      return blocked === 1
    } catch (error) {
      console.error('[SpamProtection] Failed to check blocked status:', error)
      return false
    }
  }

  /**
   * Unblock a phone number
   */
  async unblock(phone: string): Promise<void> {
    try {
      const key = `${SPAM_PREFIX}blocked:${phone}`
      await redisConnection.del(key)
    } catch (error) {
      console.error('[SpamProtection] Failed to unblock phone:', error)
    }
  }

  private getKey(phone: string): string {
    // Normalize phone number
    const normalized = phone.replace(/\D/g, '')
    return `${SPAM_PREFIX}count:${normalized}`
  }
}

// Singleton instance
export const spamProtection = new SpamProtectionService()

// Legacy compatibility function
export async function checkSpamProtection(
  from: string,
  hasContext: boolean
): Promise<boolean> {
  const result = await spamProtection.check(from, hasContext)
  return result.isSpam
}
