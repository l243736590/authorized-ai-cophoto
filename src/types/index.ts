export type UsageScope =
  | 'personal_collection'
  | 'social_media'
  | 'commercial_promotion'
  | 'advertising'

export type LicensorStatus = 'active' | 'paused'

export type RequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'generated'
  | 'revoked'
  | 'expired'

export type CertificateStatus = 'valid' | 'revoked' | 'expired'

export interface Celebrity {
  id: string
  displayName: string
  avatarUrl: string
  category: string
  agencyName: string
  basePrice: number
  allowedUsageScopes: UsageScope[]
  status: LicensorStatus
}

export interface CoPhotoRequest {
  id: string
  userIdHash: string
  celebrityId: string
  usageScope: UsageScope
  price: number
  status: RequestStatus
  createdAt: string
  approvedAt?: string
  expiresAt: string
}

export interface Certificate {
  certificateId: string
  requestId: string
  imageHash: string
  licenseHash: string
  certificateHash: string
  syntheticImage: true
  notPhysicalMeeting: true
  notEndorsement: true
  usageScope: UsageScope[]
  forbiddenUses: string[]
  issuedAt: string
  expiresAt: string
  revocable: true
  status: CertificateStatus
  mockChainName: string
  mockTransactionHash: string
  verifyUrl: string
}

export interface MockAttestation {
  chainName: string
  transactionHash: string
  recordedAt: string
}
