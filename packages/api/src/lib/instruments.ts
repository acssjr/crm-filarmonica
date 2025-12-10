// Instrumentos prioritários (graves - mais necessários na banda)
export const PRIORITY_INSTRUMENTS = [
  'tuba',
  'bombardino',
  'trombone',
  'sax baritono',
  'sax tenor',
]

// Instrumentos disponíveis
export const AVAILABLE_INSTRUMENTS = [
  ...PRIORITY_INSTRUMENTS,
  'trompete',
  'clarinete',
  'flauta',
  'percussao',
]

// Saxofone alto tem restrição
export const RESTRICTED_INSTRUMENTS = ['sax alto', 'saxofone alto']

export function isRestrictedInstrument(instrument: string): boolean {
  const normalized = instrument.toLowerCase().trim()
  return RESTRICTED_INSTRUMENTS.some((r) => normalized.includes(r.toLowerCase()))
}

export function isPriorityInstrument(instrument: string): boolean {
  const normalized = instrument.toLowerCase().trim()
  return PRIORITY_INSTRUMENTS.some((p) => normalized.includes(p.toLowerCase()))
}

export function getSuggestedAlternatives(instrument: string): string[] {
  if (isRestrictedInstrument(instrument)) {
    return ['sax tenor', 'sax baritono', 'clarinete', 'trombone']
  }
  return []
}
