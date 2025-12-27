/**
 * Event Publisher Adapter
 * Simple in-memory event bus implementation
 */

import { EventPublisherPort } from '../domain/ports/event-publisher.port.js'
import { AutomationEvent } from '../domain/events/automation.events.js'

type EventHandler = (event: AutomationEvent) => Promise<void>
type UnsubscribeFn = () => void

export class EventPublisherAdapter implements EventPublisherPort {
  private handlers: Map<AutomationEvent['eventType'], Set<EventHandler>> = new Map()

  async publish(event: AutomationEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType)
    if (!handlers || handlers.size === 0) {
      return
    }

    console.log(`[EventPublisher] Publishing ${event.eventType}:`, event.payload)

    for (const handler of handlers) {
      try {
        await handler(event)
      } catch (error) {
        console.error(`[EventPublisher] Handler failed for ${event.eventType}:`, error)
      }
    }
  }

  /**
   * Subscribe to an event type
   * @returns Unsubscribe function to remove the handler
   */
  subscribe(
    eventType: AutomationEvent['eventType'],
    handler: EventHandler
  ): UnsubscribeFn {
    let handlers = this.handlers.get(eventType)
    if (!handlers) {
      handlers = new Set()
      this.handlers.set(eventType, handlers)
    }
    handlers.add(handler)
    console.log(`[EventPublisher] Subscribed handler for ${eventType}`)

    // Return unsubscribe function
    return () => {
      handlers!.delete(handler)
      console.log(`[EventPublisher] Unsubscribed handler for ${eventType}`)
    }
  }

  /**
   * Clear all handlers (useful for testing)
   */
  clear(): void {
    this.handlers.clear()
  }
}

export const eventPublisher = new EventPublisherAdapter()
