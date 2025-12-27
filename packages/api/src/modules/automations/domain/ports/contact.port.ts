/**
 * Contact Port
 * Interface for contact operations
 */

import { ContactData } from '../value-objects/condition.vo.js'

export interface ContactDetails {
  id: string
  telefone: string
  nome?: string
  estadoJornada: string
  origem: string
  tags: string[]
  interessado?: {
    idade?: number
    instrumentoDesejado?: string
  }
}

export interface ContactPort {
  /**
   * Get contact by ID with tags and interessado data
   */
  findById(id: string): Promise<ContactDetails | null>

  /**
   * Get contact data for condition evaluation
   */
  getContactData(id: string): Promise<ContactData | null>

  /**
   * Add tag to contact
   */
  addTag(contatoId: string, tagId: string): Promise<{ success: boolean; error?: string }>

  /**
   * Remove tag from contact
   */
  removeTag(contatoId: string, tagId: string): Promise<{ success: boolean; error?: string }>

  /**
   * Update contact's journey state
   */
  updateJourneyState(contatoId: string, estado: string): Promise<{ success: boolean; error?: string }>

  /**
   * Find contacts without interaction for X days
   */
  findContactsWithoutInteraction(days: number, limit?: number): Promise<string[]>
}
