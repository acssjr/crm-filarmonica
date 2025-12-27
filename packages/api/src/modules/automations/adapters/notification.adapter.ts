/**
 * Notification Adapter
 * Concrete implementation of NotificationPort
 */

import { eq, desc, sql } from 'drizzle-orm'
import { db } from '../../../db/index.js'
import { alertas } from '../../../db/schema.js'
import { sendWhatsAppMessage } from '../../../lib/whatsapp-client.js'
import { NotificationPort, AlertData } from '../domain/ports/notification.port.js'

export class NotificationAdapter implements NotificationPort {
  async notifyAdminWhatsApp(
    telefone: string,
    mensagem: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const phoneNumber = telefone.replace('+', '')
      await sendWhatsAppMessage(phoneNumber, mensagem)
      return { success: true }
    } catch (error) {
      console.error('[NotificationAdapter] Failed to notify admin:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  async createPanelAlert(data: AlertData): Promise<{ id: string }> {
    const [row] = await db
      .insert(alertas)
      .values({
        tipo: data.tipo,
        titulo: data.titulo,
        mensagem: data.mensagem,
        contatoId: data.contatoId || null,
        automacaoId: data.automacaoId,
        lido: false,
      })
      .returning({ id: alertas.id })

    return { id: row.id }
  }

  async getUnreadAlertsCount(): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(alertas)
      .where(eq(alertas.lido, false))

    return Number(result?.count || 0)
  }

  async markAlertAsRead(id: string): Promise<void> {
    await db.update(alertas).set({ lido: true }).where(eq(alertas.id, id))
  }

  async getAlerts(
    page: number,
    limit: number
  ): Promise<{
    data: Array<AlertData & { id: string; lido: boolean; createdAt: Date }>
    total: number
  }> {
    const offset = (page - 1) * limit

    const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(alertas)
    const total = Number(countResult?.count || 0)

    const rows = await db
      .select()
      .from(alertas)
      .orderBy(desc(alertas.createdAt))
      .limit(limit)
      .offset(offset)

    const data = rows.map(row => ({
      id: row.id,
      tipo: row.tipo as 'info' | 'warning' | 'success',
      titulo: row.titulo,
      mensagem: row.mensagem,
      contatoId: row.contatoId || undefined,
      automacaoId: row.automacaoId,
      lido: row.lido,
      createdAt: row.createdAt,
    }))

    return { data, total }
  }
}

export const notificationAdapter = new NotificationAdapter()
