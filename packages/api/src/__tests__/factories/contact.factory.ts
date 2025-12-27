/**
 * Factory para Contact e dados relacionados
 */

import { Factory } from 'fishery'
import { faker } from '@faker-js/faker/locale/pt_BR'
import type { ContactData } from '../../modules/automations/domain/value-objects/condition.vo.js'

// Factory para ContactData (usado em evaluateCondition)
export const contactDataFactory = Factory.define<ContactData>(() => ({
  tags: [],
  estadoJornada: 'inicial',
  origem: 'organico',
  idade: faker.number.int({ min: 7, max: 80 }),
  instrumentoDesejado: faker.helpers.arrayElement([
    'violão',
    'piano',
    'saxofone',
    'clarinete',
    'trompete',
    'flauta',
  ]),
}))

// Factory para dados de contato do banco
interface ContatoDB {
  id: string
  telefone: string
  nome: string | null
  tipo: 'desconhecido' | 'responsavel' | 'interessado_direto'
  origem: 'organico' | 'campanha' | 'indicacao'
  origemCampanha: string | null
  canal: 'whatsapp' | 'instagram' | 'messenger'
  estadoJornada: string
  createdAt: Date
  updatedAt: Date
}

export const contatoDBFactory = Factory.define<ContatoDB>(({ sequence }) => ({
  id: faker.string.uuid(),
  telefone: `5575999${String(sequence).padStart(6, '0')}`,
  nome: faker.person.fullName(),
  tipo: 'desconhecido' as const,
  origem: 'organico' as const,
  origemCampanha: null,
  canal: 'whatsapp' as const,
  estadoJornada: 'inicial',
  createdAt: new Date(),
  updatedAt: new Date(),
}))
