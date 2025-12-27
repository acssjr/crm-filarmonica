/**
 * Event Publisher Adapter Tests
 * Tests for the in-memory event bus implementation
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { EventPublisherAdapter } from './event-publisher.adapter.js'
import type { AutomationEvent } from '../domain/events/automation.events.js'

describe('EventPublisherAdapter', () => {
  let publisher: EventPublisherAdapter
  let consoleSpy: ReturnType<typeof vi.spyOn>
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    publisher = new EventPublisherAdapter()
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  describe('subscribe', () => {
    it('should register a handler for an event type', () => {
      const handler = vi.fn()

      publisher.subscribe('automation.created', handler)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Subscribed handler for automation.created')
      )
    })

    it('should return an unsubscribe function', () => {
      const handler = vi.fn()

      const unsubscribe = publisher.subscribe('automation.created', handler)

      expect(typeof unsubscribe).toBe('function')
    })

    it('should allow multiple handlers for the same event type', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      publisher.subscribe('automation.activated', handler1)
      publisher.subscribe('automation.activated', handler2)

      expect(consoleSpy).toHaveBeenCalledTimes(2)
    })

    it('should allow handlers for different event types', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      publisher.subscribe('automation.created', handler1)
      publisher.subscribe('automation.deleted', handler2)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Subscribed handler for automation.created')
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Subscribed handler for automation.deleted')
      )
    })
  })

  describe('unsubscribe', () => {
    it('should remove handler when unsubscribe is called', async () => {
      const handler = vi.fn().mockResolvedValue(undefined)

      const unsubscribe = publisher.subscribe('automation.created', handler)
      unsubscribe()

      const event: AutomationEvent = {
        eventType: 'automation.created',
        occurredAt: new Date(),
        payload: { automacaoId: 'test-id', nome: 'Test', triggerTipo: 'novo_contato' },
      }

      await publisher.publish(event)

      // Handler should not be called after unsubscribe
      expect(handler).not.toHaveBeenCalled()
    })

    it('should log unsubscription', () => {
      const handler = vi.fn()

      const unsubscribe = publisher.subscribe('automation.activated', handler)
      unsubscribe()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unsubscribed handler for automation.activated')
      )
    })

    it('should only remove the specific handler', async () => {
      const handler1 = vi.fn().mockResolvedValue(undefined)
      const handler2 = vi.fn().mockResolvedValue(undefined)

      const unsubscribe1 = publisher.subscribe('automation.created', handler1)
      publisher.subscribe('automation.created', handler2)

      unsubscribe1()

      const event: AutomationEvent = {
        eventType: 'automation.created',
        occurredAt: new Date(),
        payload: { automacaoId: 'test-id', nome: 'Test', triggerTipo: 'novo_contato' },
      }

      await publisher.publish(event)

      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).toHaveBeenCalledWith(event)
    })
  })

  describe('publish', () => {
    it('should call all handlers for the event type', async () => {
      const handler1 = vi.fn().mockResolvedValue(undefined)
      const handler2 = vi.fn().mockResolvedValue(undefined)

      publisher.subscribe('automation.activated', handler1)
      publisher.subscribe('automation.activated', handler2)

      const event: AutomationEvent = {
        eventType: 'automation.activated',
        occurredAt: new Date(),
        payload: { automacaoId: 'auto-123', nome: 'Test Automation' },
      }

      await publisher.publish(event)

      expect(handler1).toHaveBeenCalledWith(event)
      expect(handler2).toHaveBeenCalledWith(event)
    })

    it('should not call handlers for different event types', async () => {
      const createdHandler = vi.fn().mockResolvedValue(undefined)
      const activatedHandler = vi.fn().mockResolvedValue(undefined)

      publisher.subscribe('automation.created', createdHandler)
      publisher.subscribe('automation.activated', activatedHandler)

      const event: AutomationEvent = {
        eventType: 'automation.created',
        occurredAt: new Date(),
        payload: { automacaoId: 'auto-123', nome: 'Test', triggerTipo: 'novo_contato' },
      }

      await publisher.publish(event)

      expect(createdHandler).toHaveBeenCalledWith(event)
      expect(activatedHandler).not.toHaveBeenCalled()
    })

    it('should not throw when no handlers registered', async () => {
      const event: AutomationEvent = {
        eventType: 'automation.deleted',
        occurredAt: new Date(),
        payload: { automacaoId: 'auto-123' },
      }

      await expect(publisher.publish(event)).resolves.not.toThrow()
    })

    it('should log event publication', async () => {
      const handler = vi.fn().mockResolvedValue(undefined)
      publisher.subscribe('automation.deactivated', handler)

      const event: AutomationEvent = {
        eventType: 'automation.deactivated',
        occurredAt: new Date(),
        payload: { automacaoId: 'auto-123', nome: 'Test' },
      }

      await publisher.publish(event)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Publishing automation.deactivated'),
        expect.any(Object)
      )
    })

    it('should continue executing other handlers when one fails', async () => {
      const failingHandler = vi.fn().mockRejectedValue(new Error('Handler failed'))
      const successHandler = vi.fn().mockResolvedValue(undefined)

      publisher.subscribe('automation.execution.started', failingHandler)
      publisher.subscribe('automation.execution.started', successHandler)

      const event: AutomationEvent = {
        eventType: 'automation.execution.started',
        occurredAt: new Date(),
        payload: { automacaoId: 'auto-123', execucaoId: 'exec-1', contatoId: 'contact-1' },
      }

      await publisher.publish(event)

      expect(failingHandler).toHaveBeenCalled()
      expect(successHandler).toHaveBeenCalled()
    })

    it('should log errors when handler fails', async () => {
      const error = new Error('Handler error')
      const failingHandler = vi.fn().mockRejectedValue(error)

      publisher.subscribe('automation.execution.failed', failingHandler)

      const event: AutomationEvent = {
        eventType: 'automation.execution.failed',
        occurredAt: new Date(),
        payload: { automacaoId: 'auto-123', execucaoId: 'exec-1', contatoId: 'contact-1', erro: 'test' },
      }

      await publisher.publish(event)

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Handler failed for automation.execution.failed'),
        error
      )
    })

    it('should handle execution completed event', async () => {
      const handler = vi.fn().mockResolvedValue(undefined)
      publisher.subscribe('automation.execution.completed', handler)

      const event: AutomationEvent = {
        eventType: 'automation.execution.completed',
        occurredAt: new Date(),
        payload: {
          automacaoId: 'auto-123',
          execucaoId: 'exec-1',
          contatoId: 'contact-1',
          acoesExecutadas: 3,
        },
      }

      await publisher.publish(event)

      expect(handler).toHaveBeenCalledWith(event)
      expect(handler.mock.calls[0][0].payload.acoesExecutadas).toBe(3)
    })

    it('should handle execution paused event with proximaAcaoEm', async () => {
      const handler = vi.fn().mockResolvedValue(undefined)
      publisher.subscribe('automation.execution.paused', handler)

      const nextAction = new Date(Date.now() + 3600000)
      const event: AutomationEvent = {
        eventType: 'automation.execution.paused',
        occurredAt: new Date(),
        payload: {
          automacaoId: 'auto-123',
          execucaoId: 'exec-1',
          contatoId: 'contact-1',
          proximaAcaoEm: nextAction,
        },
      }

      await publisher.publish(event)

      expect(handler).toHaveBeenCalledWith(event)
      expect(handler.mock.calls[0][0].payload.proximaAcaoEm).toEqual(nextAction)
    })
  })

  describe('clear', () => {
    it('should remove all handlers', async () => {
      const handler1 = vi.fn().mockResolvedValue(undefined)
      const handler2 = vi.fn().mockResolvedValue(undefined)

      publisher.subscribe('automation.created', handler1)
      publisher.subscribe('automation.activated', handler2)

      publisher.clear()

      const event1: AutomationEvent = {
        eventType: 'automation.created',
        occurredAt: new Date(),
        payload: { automacaoId: 'test-id', nome: 'Test', triggerTipo: 'novo_contato' },
      }
      const event2: AutomationEvent = {
        eventType: 'automation.activated',
        occurredAt: new Date(),
        payload: { automacaoId: 'test-id', nome: 'Test' },
      }

      await publisher.publish(event1)
      await publisher.publish(event2)

      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).not.toHaveBeenCalled()
    })

    it('should allow new subscriptions after clear', async () => {
      const handler = vi.fn().mockResolvedValue(undefined)

      publisher.subscribe('automation.deleted', handler)
      publisher.clear()

      const newHandler = vi.fn().mockResolvedValue(undefined)
      publisher.subscribe('automation.deleted', newHandler)

      const event: AutomationEvent = {
        eventType: 'automation.deleted',
        occurredAt: new Date(),
        payload: { automacaoId: 'auto-123' },
      }

      await publisher.publish(event)

      expect(handler).not.toHaveBeenCalled()
      expect(newHandler).toHaveBeenCalledWith(event)
    })
  })

  describe('handlers execution order', () => {
    it('should execute handlers in subscription order', async () => {
      const executionOrder: number[] = []

      const handler1 = vi.fn().mockImplementation(async () => {
        executionOrder.push(1)
      })
      const handler2 = vi.fn().mockImplementation(async () => {
        executionOrder.push(2)
      })
      const handler3 = vi.fn().mockImplementation(async () => {
        executionOrder.push(3)
      })

      publisher.subscribe('automation.created', handler1)
      publisher.subscribe('automation.created', handler2)
      publisher.subscribe('automation.created', handler3)

      const event: AutomationEvent = {
        eventType: 'automation.created',
        occurredAt: new Date(),
        payload: { automacaoId: 'test-id', nome: 'Test', triggerTipo: 'novo_contato' },
      }

      await publisher.publish(event)

      expect(executionOrder).toEqual([1, 2, 3])
    })

    it('should await each handler before moving to next', async () => {
      const executionLog: string[] = []

      const handler1 = vi.fn().mockImplementation(async () => {
        executionLog.push('handler1-start')
        await new Promise(resolve => setTimeout(resolve, 10))
        executionLog.push('handler1-end')
      })
      const handler2 = vi.fn().mockImplementation(async () => {
        executionLog.push('handler2-start')
        await new Promise(resolve => setTimeout(resolve, 5))
        executionLog.push('handler2-end')
      })

      publisher.subscribe('automation.activated', handler1)
      publisher.subscribe('automation.activated', handler2)

      const event: AutomationEvent = {
        eventType: 'automation.activated',
        occurredAt: new Date(),
        payload: { automacaoId: 'auto-123', nome: 'Test' },
      }

      await publisher.publish(event)

      expect(executionLog).toEqual([
        'handler1-start',
        'handler1-end',
        'handler2-start',
        'handler2-end',
      ])
    })
  })
})
