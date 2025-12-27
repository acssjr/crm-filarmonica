/**
 * Instrument utilities
 *
 * Re-exports from institution config for backward compatibility.
 * New code should import directly from config/institution.ts
 */

import {
  institution,
  isRestrictedInstrument,
  isPriorityInstrument,
  getSuggestedAlternatives,
} from '../config/institution.js'

// Re-export for backward compatibility
export const PRIORITY_INSTRUMENTS = institution.instruments.priority
export const AVAILABLE_INSTRUMENTS = institution.instruments.available
export const RESTRICTED_INSTRUMENTS = institution.instruments.restricted

// Re-export functions
export { isRestrictedInstrument, isPriorityInstrument, getSuggestedAlternatives }
