/**
 * Institution-specific configuration
 * These values are specific to Sociedade Filarmonica 25 de Março
 * In a multi-tenant setup, these would come from the database
 */

export const institution = {
  // Basic info
  name: 'Sociedade Filarmônica 25 de Março',
  shortName: 'Filarmônica',
  history: '157 anos de tradição musical',

  // Location
  address: 'Praça da Bandeira, 25 - Centro, Nazaré - BA',
  googleMapsUrl: 'https://maps.google.com/?q=Praca+da+Bandeira+25+Nazare+BA',
  city: 'Nazaré',
  state: 'BA',

  // Schedule
  schedule: {
    days: ['Segunda', 'Quarta', 'Sexta'],
    startTime: '15:00',
    endTime: '17:00',
    displayFormat: 'Segunda, Quarta e Sexta, das 15h às 17h',
  },

  // Contact
  phone: process.env.INSTITUTION_PHONE,
  email: process.env.INSTITUTION_EMAIL,

  // Instruments configuration
  instruments: {
    // Priority instruments (bass register - most needed)
    priority: [
      'tuba',
      'bombardino',
      'trombone',
      'sax baritono',
      'sax tenor',
    ],

    // All available instruments
    available: [
      'tuba',
      'bombardino',
      'trombone',
      'sax baritono',
      'sax tenor',
      'trompete',
      'clarinete',
      'flauta',
      'percussao',
    ],

    // Restricted instruments (high demand, limited availability)
    restricted: ['sax alto', 'saxofone alto'],

    // Suggested alternatives for restricted instruments
    alternatives: {
      'sax alto': ['sax tenor', 'sax baritono', 'clarinete', 'trombone'],
      'saxofone alto': ['sax tenor', 'sax baritono', 'clarinete', 'trombone'],
    },
  },

  // Class configuration
  classes: {
    maxStudentsPerClass: 20,
    isFree: true,
    minimumAge: 7,
    requiresParentForMinors: true,
  },
} as const

// Helper functions
export function isRestrictedInstrument(instrument: string): boolean {
  const normalized = instrument.toLowerCase().trim()
  return institution.instruments.restricted.some(r =>
    normalized.includes(r.toLowerCase())
  )
}

export function isPriorityInstrument(instrument: string): boolean {
  const normalized = instrument.toLowerCase().trim()
  return institution.instruments.priority.some(p =>
    normalized.includes(p.toLowerCase())
  )
}

export function getSuggestedAlternatives(instrument: string): readonly string[] {
  const normalized = instrument.toLowerCase().trim()

  for (const [restricted, alternatives] of Object.entries(institution.instruments.alternatives)) {
    if (normalized.includes(restricted.toLowerCase())) {
      return alternatives
    }
  }

  return []
}

export function getFormattedSchedule(): string {
  return institution.schedule.displayFormat
}

export function getFormattedAddress(): string {
  return institution.address
}

export default institution
