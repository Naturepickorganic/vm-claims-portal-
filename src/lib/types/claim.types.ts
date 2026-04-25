export type LOB = 'auto' | 'home' | 'commercial-property' | 'workers-comp' | 'commercial-auto'

export type ClaimStatus =
  | 'Filed' | 'Assigned' | 'InspectionScheduled' | 'InspectionComplete'
  | 'RepairAuthorized' | 'RepairsInProgress' | 'QualityCheck' | 'Settled' | 'Closed'

export interface ClaimMilestone {
  order:   number
  title:   string
  status:  'done' | 'active' | 'pending'
  date:    string
  detail:  string
}

export interface ClaimMessage {
  id:          string
  from:        'adjuster' | 'customer'
  senderName?: string
  text:        string
  timestamp:   string
  read:        boolean
}

export interface ClaimDocument {
  id:      string
  name:    string
  type:    string
  date:    string
  status:  'ok' | 'pending' | 'review'
  url?:    string
}

export interface FNOLSubmitResponse {
  claimId:   string
  gwClaimId: string
  adjuster:  { name: string; phone: string; email: string }
  estimatedResolution: string
}

export interface ClaimStatusResponse {
  claimId:       string
  gwClaimId:     string
  lob:           LOB
  status:        ClaimStatus
  dateOfLoss:    string
  dateFiled:     string
  vehicleInfo?:  string
  propertyAddress?: string
  adjusterName:  string
  adjusterPhone: string
  estimatedRepair?: number
  deductible:    number
  policyNumber:  string
  milestones:    ClaimMilestone[]
  messages:      ClaimMessage[]
  documents:     ClaimDocument[]
}
