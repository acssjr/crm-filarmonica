/**
 * Notification Port
 * Interface for sending notifications to admins
 */

export interface AlertData {
  tipo: 'info' | 'warning' | 'success'
  titulo: string
  mensagem: string
  contatoId?: string
  automacaoId: string
}

export interface NotificationPort {
  /**
   * Send a WhatsApp notification to admin
   */
  notifyAdminWhatsApp(telefone: string, mensagem: string): Promise<{ success: boolean; error?: string }>

  /**
   * Create an alert in the panel
   */
  createPanelAlert(data: AlertData): Promise<{ id: string }>

  /**
   * Get unread alerts count
   */
  getUnreadAlertsCount(): Promise<number>

  /**
   * Mark alert as read
   */
  markAlertAsRead(id: string): Promise<void>

  /**
   * Get all alerts with pagination
   */
  getAlerts(page: number, limit: number): Promise<{
    data: Array<AlertData & { id: string; lido: boolean; createdAt: Date }>
    total: number
  }>
}
