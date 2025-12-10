import { z } from 'zod'

// Common validation schemas

export const phoneSchema = z
  .string()
  .regex(/^55\d{10,11}$/, 'Telefone deve estar no formato 55DDDNUMERO')

export const emailSchema = z.string().email('Email inválido').optional()

export const uuidSchema = z.string().uuid('ID inválido')

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

// WhatsApp webhook validation
export const webhookVerifySchema = z.object({
  'hub.mode': z.literal('subscribe'),
  'hub.verify_token': z.string(),
  'hub.challenge': z.string(),
})

export const webhookMessageSchema = z.object({
  object: z.literal('whatsapp_business_account'),
  entry: z.array(
    z.object({
      id: z.string(),
      changes: z.array(
        z.object({
          value: z.object({
            messaging_product: z.literal('whatsapp'),
            metadata: z.object({
              display_phone_number: z.string(),
              phone_number_id: z.string(),
            }),
            contacts: z
              .array(
                z.object({
                  profile: z.object({ name: z.string().optional() }),
                  wa_id: z.string(),
                })
              )
              .optional(),
            messages: z
              .array(
                z.object({
                  from: z.string(),
                  id: z.string(),
                  timestamp: z.string(),
                  type: z.enum(['text', 'image', 'audio', 'video', 'document', 'sticker', 'location', 'contacts', 'interactive', 'button', 'reaction']),
                  text: z.object({ body: z.string() }).optional(),
                })
              )
              .optional(),
            statuses: z.array(z.unknown()).optional(),
          }),
          field: z.literal('messages'),
        })
      ),
    })
  ),
})

// Auth validation
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

export const registerSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

// Contact validation
export const createContactSchema = z.object({
  telefone: phoneSchema,
  nome: z.string().min(2).max(100).optional(),
  origem: z.enum(['organico', 'campanha', 'indicacao', 'evento']).default('organico'),
  codigoCampanha: z.string().max(50).optional(),
})

export const updateContactSchema = z.object({
  nome: z.string().min(2).max(100).optional(),
  idade: z.number().int().min(1).max(120).optional(),
  instrumento: z.string().max(50).optional(),
  estadoJornada: z
    .enum([
      'inicial',
      'boas_vindas',
      'coletando_nome',
      'coletando_idade',
      'coletando_instrumento',
      'verificando_sax',
      'coletando_experiencia',
      'verificando_disponibilidade',
      'incompativel',
      'cadastro_completo',
      'atendimento_humano',
    ])
    .optional(),
})

// Prospect validation
export const updateProspectSchema = z.object({
  status: z.enum(['novo', 'contatado', 'visitou', 'matriculado', 'desistente']).optional(),
  notas: z.string().max(1000).optional(),
})

// Message validation
export const sendMessageSchema = z.object({
  contatoId: uuidSchema,
  mensagem: z.string().min(1).max(4096),
})

// Dashboard filters
export const dashboardFiltersSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  origem: z.enum(['organico', 'campanha', 'indicacao', 'evento']).optional(),
})

// Helper to validate request body
export function validateBody<T extends z.ZodSchema>(
  schema: T,
  body: unknown
): z.infer<T> {
  return schema.parse(body)
}

// Helper to validate query params
export function validateQuery<T extends z.ZodSchema>(
  schema: T,
  query: unknown
): z.infer<T> {
  return schema.parse(query)
}
