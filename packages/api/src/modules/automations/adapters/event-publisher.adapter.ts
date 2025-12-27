/**
 * Event Publisher Adapter
 * Simple in-memory event bus implementation
 */

import { EventPublisherPort } from '../domain/ports/event-publisher.port.js'
import { AutomationEvent } from '../domain/events/automation.events.js'

type EventHandler = (event: AutomationEvent) => Promise<void>

export class EventPublisherAdapter implements EventPublisherPort {
  private handlers: Map<AutomationEvent['eventType'], EventHandler[]> = new Map()

  async publish(event: AutomationEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType) || []

    console.log(`[EventPublisher] Publishing ${event.eventType}:`, event.payload)

    for (const handler of handlers) {
      try {
        await handler(event)
      } catch (error) {
        console.error(`[EventPublisher] Handler failed for ${event.eventType}:`, error)
      }
    }
  }

  subscribe(
    eventType: AutomationEvent['eventType'],
    handler: EventHandler
  ): void {
    const existing = this.handlers.get(eventType) || []
    existing.push(handler)
    this.handlers.set(eventType, existing)
    console.log(`[EventPublisher] Subscribed handler for ${eventType}`)
  }
}

export const eventPublisher = new EventPublisherAdapter()
