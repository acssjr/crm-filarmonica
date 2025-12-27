/**
 * Event Publisher Port
 * Interface for publishing domain events
 */

import { AutomationEvent } from '../events/automation.events.js'

export interface EventPublisherPort {
  /**
   * Publish an automation event
   */
  publish(event: AutomationEvent): Promise<void>

  /**
   * Subscribe to automation events
   */
  subscribe(
    eventType: AutomationEvent['eventType'],
    handler: (event: AutomationEvent) => Promise<void>
  ): void
}
