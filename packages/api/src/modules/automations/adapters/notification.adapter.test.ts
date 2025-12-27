/**
 * Notification Adapter Tests
 * Tests for admin notifications and panel alerts
 */

import { describe, it, expect, beforeEach, vi, afterEach, type Mock } from 'vitest'
import { NotificationAdapter } from './notification.adapter.js'

// Mock the database module
vi.mock('../../../db/index.js', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}))

// Mock the WhatsApp client
vi.mock('../../../lib/whatsapp-client.js', () => ({
  sendWhatsAppMessage: vi.fn(),
}))

// Mock the schema
vi.mock('../../../db/schema.js', () => ({
  alertas: {
    id: 'id',
    tipo: 'tipo',
    titulo: 'titulo',
    mensagem: 'mensagem',
    contatoId: 'contatoId',
    automacaoId: 'automacaoId',
    lido: 'lido',
    createdAt: 'createdAt',
  },
}))

// Mock drizzle-orm
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((col, val) => ({ type: 'eq', col, val })),
  desc: vi.fn((col) => ({ type: 'desc', col })),
  sql: vi.fn((strings, ...values) => ({ type: 'sql', strings, values })),
}))

import { db } from '../../../db/index.js'
import { sendWhatsAppMessage } from '../../../lib/whatsapp-client.js'

describe('NotificationAdapter', () => {
  let adapter: NotificationAdapter
  let mockSelect: Mock
  let mockInsert: Mock
  let mockUpdate: Mock
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    adapter = new NotificationAdapter()
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    mockSelect = vi.fn()
    mockInsert = vi.fn()
    mockUpdate = vi.fn()

    ;(db.select as Mock) = mockSelect
    ;(db.insert as Mock) = mockInsert
    ;(db.update as Mock) = mockUpdate
    ;(sendWhatsAppMessage as Mock).mockResolvedValue(undefined)
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  describe('notifyAdminWhatsApp', () => {
    it('should send WhatsApp notification successfully', async () => {
      const result = await adapter.notifyAdminWhatsApp('+5575988123456', 'Alert: New contact!')

      expect(result.success).toBe(true)
      expect(sendWhatsAppMessage).toHaveBeenCalledWith('5575988123456', 'Alert: New contact!')
    })

    it('should remove + prefix from phone number', async () => {
      const result = await adapter.notifyAdminWhatsApp('+5575988123456', 'Test message')

      expect(result.success).toBe(true)
      expect(sendWhatsAppMessage).toHaveBeenCalledWith('5575988123456', 'Test message')
    })

    it('should handle phone without + prefix', async () => {
      const result = await adapter.notifyAdminWhatsApp('5575988123456', 'Test message')

      expect(result.success).toBe(true)
      expect(sendWhatsAppMessage).toHaveBeenCalledWith('5575988123456', 'Test message')
    })

    it('should handle WhatsApp API errors', async () => {
      ;(sendWhatsAppMessage as Mock).mockRejectedValue(new Error('Rate limit exceeded'))

      const result = await adapter.notifyAdminWhatsApp('+5575988123456', 'Alert message')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Rate limit exceeded')
    })

    it('should log errors on failure', async () => {
      const error = new Error('Network error')
      ;(sendWhatsAppMessage as Mock).mockRejectedValue(error)

      await adapter.notifyAdminWhatsApp('+5575988123456', 'Alert')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[NotificationAdapter] Failed to notify admin'),
        error
      )
    })

    it('should send messages with special characters', async () => {
      const message = 'Alerta: Contato Joao Silva - Tel: (75) 98812-3456'

      const result = await adapter.notifyAdminWhatsApp('+5575900000000', message)

      expect(result.success).toBe(true)
      expect(sendWhatsAppMessage).toHaveBeenCalledWith('5575900000000', message)
    })
  })

  describe('createPanelAlert', () => {
    it('should create info alert successfully', async () => {
      const alertData = {
        tipo: 'info' as const,
        titulo: 'Novo Contato',
        mensagem: 'Um novo contato foi registrado',
        automacaoId: 'auto-123',
      }

      const returningMock = vi.fn().mockResolvedValue([{ id: 'alert-456' }])
      const valuesMock = vi.fn().mockReturnValue({ returning: returningMock })
      mockInsert.mockReturnValue({ values: valuesMock })

      const result = await adapter.createPanelAlert(alertData)

      expect(result.id).toBe('alert-456')
      expect(valuesMock).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo: 'info',
          titulo: 'Novo Contato',
          mensagem: 'Um novo contato foi registrado',
          automacaoId: 'auto-123',
          lido: false,
        })
      )
    })

    it('should create warning alert', async () => {
      const alertData = {
        tipo: 'warning' as const,
        titulo: 'Atencao',
        mensagem: 'Automacao falhou para alguns contatos',
        automacaoId: 'auto-789',
      }

      const returningMock = vi.fn().mockResolvedValue([{ id: 'alert-warning' }])
      const valuesMock = vi.fn().mockReturnValue({ returning: returningMock })
      mockInsert.mockReturnValue({ values: valuesMock })

      const result = await adapter.createPanelAlert(alertData)

      expect(result.id).toBe('alert-warning')
    })

    it('should create success alert', async () => {
      const alertData = {
        tipo: 'success' as const,
        titulo: 'Sucesso',
        mensagem: 'Automacao executada com sucesso',
        automacaoId: 'auto-success',
      }

      const returningMock = vi.fn().mockResolvedValue([{ id: 'alert-success' }])
      const valuesMock = vi.fn().mockReturnValue({ returning: returningMock })
      mockInsert.mockReturnValue({ values: valuesMock })

      const result = await adapter.createPanelAlert(alertData)

      expect(result.id).toBe('alert-success')
    })

    it('should create alert with contatoId', async () => {
      const alertData = {
        tipo: 'info' as const,
        titulo: 'Contato atualizado',
        mensagem: 'Jornada do contato foi atualizada',
        contatoId: 'contact-123',
        automacaoId: 'auto-123',
      }

      const returningMock = vi.fn().mockResolvedValue([{ id: 'alert-contact' }])
      const valuesMock = vi.fn().mockReturnValue({ returning: returningMock })
      mockInsert.mockReturnValue({ values: valuesMock })

      const result = await adapter.createPanelAlert(alertData)

      expect(result.id).toBe('alert-contact')
      expect(valuesMock).toHaveBeenCalledWith(
        expect.objectContaining({
          contatoId: 'contact-123',
        })
      )
    })

    it('should set contatoId to null when not provided', async () => {
      const alertData = {
        tipo: 'info' as const,
        titulo: 'System Alert',
        mensagem: 'General system notification',
        automacaoId: 'auto-system',
      }

      const returningMock = vi.fn().mockResolvedValue([{ id: 'alert-system' }])
      const valuesMock = vi.fn().mockReturnValue({ returning: returningMock })
      mockInsert.mockReturnValue({ values: valuesMock })

      await adapter.createPanelAlert(alertData)

      expect(valuesMock).toHaveBeenCalledWith(
        expect.objectContaining({
          contatoId: null,
        })
      )
    })
  })

  describe('getUnreadAlertsCount', () => {
    it('should return count of unread alerts', async () => {
      const whereMock = vi.fn().mockResolvedValue([{ count: 5 }])
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      mockSelect.mockReturnValue({ from: fromMock })

      const result = await adapter.getUnreadAlertsCount()

      expect(result).toBe(5)
    })

    it('should return 0 when no unread alerts', async () => {
      const whereMock = vi.fn().mockResolvedValue([{ count: 0 }])
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      mockSelect.mockReturnValue({ from: fromMock })

      const result = await adapter.getUnreadAlertsCount()

      expect(result).toBe(0)
    })

    it('should handle null count result', async () => {
      const whereMock = vi.fn().mockResolvedValue([{ count: null }])
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      mockSelect.mockReturnValue({ from: fromMock })

      const result = await adapter.getUnreadAlertsCount()

      expect(result).toBe(0)
    })

    it('should handle undefined result', async () => {
      const whereMock = vi.fn().mockResolvedValue([])
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      mockSelect.mockReturnValue({ from: fromMock })

      const result = await adapter.getUnreadAlertsCount()

      expect(result).toBe(0)
    })

    it('should convert string count to number', async () => {
      const whereMock = vi.fn().mockResolvedValue([{ count: '10' }])
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      mockSelect.mockReturnValue({ from: fromMock })

      const result = await adapter.getUnreadAlertsCount()

      expect(result).toBe(10)
      expect(typeof result).toBe('number')
    })
  })

  describe('markAlertAsRead', () => {
    it('should mark alert as read', async () => {
      const whereMock = vi.fn().mockResolvedValue(undefined)
      const setMock = vi.fn().mockReturnValue({ where: whereMock })
      mockUpdate.mockReturnValue({ set: setMock })

      await adapter.markAlertAsRead('alert-123')

      expect(mockUpdate).toHaveBeenCalled()
      expect(setMock).toHaveBeenCalledWith({ lido: true })
    })

    it('should not throw when alert not found', async () => {
      const whereMock = vi.fn().mockResolvedValue(undefined)
      const setMock = vi.fn().mockReturnValue({ where: whereMock })
      mockUpdate.mockReturnValue({ set: setMock })

      await expect(adapter.markAlertAsRead('non-existent')).resolves.not.toThrow()
    })
  })

  describe('getAlerts', () => {
    const mockAlerts = [
      {
        id: 'alert-1',
        tipo: 'info',
        titulo: 'Alert 1',
        mensagem: 'First alert',
        contatoId: 'contact-1',
        automacaoId: 'auto-1',
        lido: false,
        createdAt: new Date('2025-01-01'),
      },
      {
        id: 'alert-2',
        tipo: 'warning',
        titulo: 'Alert 2',
        mensagem: 'Second alert',
        contatoId: null,
        automacaoId: 'auto-2',
        lido: true,
        createdAt: new Date('2025-01-02'),
      },
    ]

    it('should return paginated alerts with total count', async () => {
      // Mock count query
      const countFromMock = vi.fn().mockResolvedValue([{ count: 10 }])

      // Mock data query
      const offsetMock = vi.fn().mockResolvedValue(mockAlerts)
      const limitMock = vi.fn().mockReturnValue({ offset: offsetMock })
      const orderByMock = vi.fn().mockReturnValue({ limit: limitMock })
      const dataFromMock = vi.fn().mockReturnValue({ orderBy: orderByMock })

      mockSelect
        .mockReturnValueOnce({ from: countFromMock })
        .mockReturnValueOnce({ from: dataFromMock })

      const result = await adapter.getAlerts(1, 10)

      expect(result.total).toBe(10)
      expect(result.data).toHaveLength(2)
    })

    it('should calculate correct offset for page', async () => {
      const countFromMock = vi.fn().mockResolvedValue([{ count: 50 }])

      const offsetMock = vi.fn().mockResolvedValue([])
      const limitMock = vi.fn().mockReturnValue({ offset: offsetMock })
      const orderByMock = vi.fn().mockReturnValue({ limit: limitMock })
      const dataFromMock = vi.fn().mockReturnValue({ orderBy: orderByMock })

      mockSelect
        .mockReturnValueOnce({ from: countFromMock })
        .mockReturnValueOnce({ from: dataFromMock })

      await adapter.getAlerts(3, 10) // Page 3, limit 10 = offset 20

      expect(offsetMock).toHaveBeenCalledWith(20)
    })

    it('should map alert data correctly', async () => {
      const countFromMock = vi.fn().mockResolvedValue([{ count: 1 }])

      const offsetMock = vi.fn().mockResolvedValue([mockAlerts[0]])
      const limitMock = vi.fn().mockReturnValue({ offset: offsetMock })
      const orderByMock = vi.fn().mockReturnValue({ limit: limitMock })
      const dataFromMock = vi.fn().mockReturnValue({ orderBy: orderByMock })

      mockSelect
        .mockReturnValueOnce({ from: countFromMock })
        .mockReturnValueOnce({ from: dataFromMock })

      const result = await adapter.getAlerts(1, 10)

      expect(result.data[0]).toEqual({
        id: 'alert-1',
        tipo: 'info',
        titulo: 'Alert 1',
        mensagem: 'First alert',
        contatoId: 'contact-1',
        automacaoId: 'auto-1',
        lido: false,
        createdAt: new Date('2025-01-01'),
      })
    })

    it('should convert null contatoId to undefined', async () => {
      const alertWithNullContact = {
        ...mockAlerts[1],
        contatoId: null,
      }

      const countFromMock = vi.fn().mockResolvedValue([{ count: 1 }])
      const offsetMock = vi.fn().mockResolvedValue([alertWithNullContact])
      const limitMock = vi.fn().mockReturnValue({ offset: offsetMock })
      const orderByMock = vi.fn().mockReturnValue({ limit: limitMock })
      const dataFromMock = vi.fn().mockReturnValue({ orderBy: orderByMock })

      mockSelect
        .mockReturnValueOnce({ from: countFromMock })
        .mockReturnValueOnce({ from: dataFromMock })

      const result = await adapter.getAlerts(1, 10)

      expect(result.data[0].contatoId).toBeUndefined()
    })

    it('should return empty array when no alerts', async () => {
      const countFromMock = vi.fn().mockResolvedValue([{ count: 0 }])
      const offsetMock = vi.fn().mockResolvedValue([])
      const limitMock = vi.fn().mockReturnValue({ offset: offsetMock })
      const orderByMock = vi.fn().mockReturnValue({ limit: limitMock })
      const dataFromMock = vi.fn().mockReturnValue({ orderBy: orderByMock })

      mockSelect
        .mockReturnValueOnce({ from: countFromMock })
        .mockReturnValueOnce({ from: dataFromMock })

      const result = await adapter.getAlerts(1, 10)

      expect(result.total).toBe(0)
      expect(result.data).toEqual([])
    })

    it('should order alerts by createdAt descending', async () => {
      const countFromMock = vi.fn().mockResolvedValue([{ count: 2 }])
      const offsetMock = vi.fn().mockResolvedValue(mockAlerts)
      const limitMock = vi.fn().mockReturnValue({ offset: offsetMock })
      const orderByMock = vi.fn().mockReturnValue({ limit: limitMock })
      const dataFromMock = vi.fn().mockReturnValue({ orderBy: orderByMock })

      mockSelect
        .mockReturnValueOnce({ from: countFromMock })
        .mockReturnValueOnce({ from: dataFromMock })

      await adapter.getAlerts(1, 10)

      expect(orderByMock).toHaveBeenCalled()
    })

    it('should handle page 1 with offset 0', async () => {
      const countFromMock = vi.fn().mockResolvedValue([{ count: 5 }])
      const offsetMock = vi.fn().mockResolvedValue([])
      const limitMock = vi.fn().mockReturnValue({ offset: offsetMock })
      const orderByMock = vi.fn().mockReturnValue({ limit: limitMock })
      const dataFromMock = vi.fn().mockReturnValue({ orderBy: orderByMock })

      mockSelect
        .mockReturnValueOnce({ from: countFromMock })
        .mockReturnValueOnce({ from: dataFromMock })

      await adapter.getAlerts(1, 20)

      expect(offsetMock).toHaveBeenCalledWith(0)
      expect(limitMock).toHaveBeenCalledWith(20)
    })

    it('should handle large page numbers', async () => {
      const countFromMock = vi.fn().mockResolvedValue([{ count: 1000 }])
      const offsetMock = vi.fn().mockResolvedValue([])
      const limitMock = vi.fn().mockReturnValue({ offset: offsetMock })
      const orderByMock = vi.fn().mockReturnValue({ limit: limitMock })
      const dataFromMock = vi.fn().mockReturnValue({ orderBy: orderByMock })

      mockSelect
        .mockReturnValueOnce({ from: countFromMock })
        .mockReturnValueOnce({ from: dataFromMock })

      await adapter.getAlerts(100, 10) // Page 100, offset should be 990

      expect(offsetMock).toHaveBeenCalledWith(990)
    })
  })
})
