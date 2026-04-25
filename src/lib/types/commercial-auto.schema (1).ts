import { z } from 'zod'

export const CommercialAutoFNOLSchema = z.object({

  /* ── Step 1: Incident ──────────────────────────────────────── */
  incidentType:    z.enum(['collision','rollover','cargo-spill','theft','vandalism','fire','weather','hitrun','backing','other']),
  dateOfLoss:      z.string().min(1, 'Date is required'),
  timeOfLoss:      z.string().optional().default(''),
  location:        z.string().min(5, 'Location is required'),
  description:     z.string().min(20, 'Please describe what happened (20+ characters)'),
  conditions:      z.array(z.string()).default([]),
  policeReport:    z.string().default('Yes — filed at scene'),
  policeNumber:    z.string().optional().default(''),
  injuries:        z.string().default('No injuries'),
  fatalitiesCount: z.number().default(0),
  roadType:        z.string().default('Interstate / Highway'),

  /* ── Step 2: Fleet Vehicle & Driver ────────────────────────── */
  companyName:     z.string().min(1, 'Company name is required'),
  usdotNumber:     z.string().optional().default(''),
  mcNumber:        z.string().optional().default(''),
  unitNumber:      z.string().min(1, 'Unit number is required'),
  vehicleYear:     z.string().default(''),
  vehicleMake:     z.string().default(''),
  vehicleModel:    z.string().default(''),
  vehicleType:     z.string().default('Semi-Truck / Tractor'),
  vin:             z.string().optional().default(''),
  plate:           z.string().optional().default(''),
  gvwr:            z.string().optional().default(''),
  driverName:      z.string().min(1, 'Driver name is required'),
  driverPhone:     z.string().optional().default(''),
  driverLicense:   z.string().optional().default(''),
  cdlClass:        z.string().default('Class A'),
  hosCompliant:    z.string().default('Yes — within HOS limits'),
  driverAtFault:   z.string().default('Under investigation'),
  priorIncidents:  z.string().default('None in past 3 years'),
  dashcamAvailable:z.boolean().default(false),
  telematicsAvailable: z.boolean().default(false),

  /* ── Step 3: Other Parties & Cargo ─────────────────────────── */
  otherVehicles:   z.array(z.object({
    name:    z.string(),
    phone:   z.string(),
    vehicle: z.string(),
    plate:   z.string(),
    insurer: z.string(),
    policy:  z.string(),
  })).default([]),
  propertyDamage:  z.boolean().default(false),
  propertyDesc:    z.string().optional().default(''),
  cargoInvolved:   z.boolean().default(false),
  cargoType:       z.string().optional().default(''),
  cargoWeight:     z.string().optional().default(''),
  cargoValue:      z.string().optional().default(''),
  hazmatInvolved:  z.boolean().default(false),
  hazmatClass:     z.string().optional().default(''),
  hazmatPlacard:   z.string().optional().default(''),
  spillOccurred:   z.boolean().default(false),
  regulatoryNotified: z.boolean().default(false),

  /* ── Step 5: Coverage & Repair ─────────────────────────────── */
  drivable:            z.boolean().default(false),
  towingNeeded:        z.boolean().default(true),
  towingDestination:   z.string().optional().default(''),
  selectedShopIndex:   z.number().default(0),
  inspectionMethod:    z.enum(['mobile','shop','virtual']).default('mobile'),
  rentalUnitNeeded:    z.boolean().default(true),
  rentalUnitType:      z.string().default('Same class as damaged unit'),

  /* ── Step 6: Certifications ─────────────────────────────────── */
  certAccuracy:   z.boolean().refine(v => v === true, { message: 'Certification required' }),
  certAuthorize:  z.boolean().refine(v => v === true, { message: 'Authorization required'  }),
  certConsent:    z.boolean().refine(v => v === true, { message: 'Consent required'        }),
})

export type CommercialAutoFNOLData = z.infer<typeof CommercialAutoFNOLSchema>

export const CA_STEP_FIELDS: Record<number, (keyof CommercialAutoFNOLData)[]> = {
  0: ['incidentType', 'dateOfLoss', 'location', 'description'],
  1: ['companyName', 'unitNumber', 'driverName'],
  2: [],
  3: [],
  4: ['selectedShopIndex'],
  5: ['certAccuracy', 'certAuthorize', 'certConsent'],
}
