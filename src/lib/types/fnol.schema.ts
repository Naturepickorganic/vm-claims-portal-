import { z } from 'zod'

export const FNOLFormSchema = z.object({
  /* Step 1 */
  incidentType: z.enum(['collision','weather','theft','glass','animal','hitrun','fire','other']),
  dateOfLoss:   z.string().min(1, 'Date is required'),
  timeOfLoss:   z.string().optional().default(''),
  location:     z.string().min(5, 'Location is required'),
  description:  z.string().min(20, 'Please describe what happened (20+ characters)'),
  conditions:   z.array(z.string()).default([]),
  policeReport: z.string().optional().default(''),
  policeNumber: z.string().optional().default(''),
  injuries:     z.string().optional().default('No injuries'),
  airbags:      z.string().optional().default('No'),

  /* Step 2 */
  drivable:           z.string().default('No — I need a tow'),
  otherPartyName:     z.string().optional().default(''),
  otherPartyPhone:    z.string().optional().default(''),
  otherPartyInsurer:  z.string().optional().default(''),
  otherPartyPolicy:   z.string().optional().default(''),
  otherPartyVehicle:  z.string().optional().default(''),
  otherPartyPlate:    z.string().optional().default(''),
  faultAssessment:    z.string().default('The other driver'),

  /* Step 3 */
  damageZones: z.array(z.string()).default([]),
  photoCount:  z.number().default(0),

  /* Step 5 */
  selectedShopIndex: z.number().default(0),
  inspectionMethod:  z.enum(['virtual','mobile','shop']).default('virtual'),
  rentalEnabled:     z.boolean().default(true),
  rentalDate:        z.string().optional().default(''),
  rentalProvider:    z.string().optional().default('Enterprise'),
  towingEnabled:     z.boolean().default(true),
  towingLocation:    z.string().optional().default(''),

  /* Step 6 — FIX: z.boolean().refine instead of z.literal(true) */
  certAccuracy:  z.boolean().refine(v => v === true, { message: 'Please certify accuracy' }),
  certAuthorize: z.boolean().refine(v => v === true, { message: 'Authorization is required' }),
  certConsent:   z.boolean().refine(v => v === true, { message: 'Consent is required'       }),
})

export type FNOLFormData = z.infer<typeof FNOLFormSchema>

/** Fields to validate per step — used with RHF trigger() */
export const STEP_FIELDS: Record<number, (keyof FNOLFormData)[]> = {
  0: ['incidentType', 'dateOfLoss', 'location', 'description'],
  1: ['drivable', 'faultAssessment'],
  2: [],
  3: [],
  4: ['selectedShopIndex', 'inspectionMethod'],
  5: ['certAccuracy', 'certAuthorize', 'certConsent'],
}
