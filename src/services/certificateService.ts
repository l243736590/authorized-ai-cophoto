import type { Certificate, CoPhotoRequest, UsageScope } from '../types'
import { createCertificateHash, createImageHash, createLicenseHash } from './hashService'
import { createMockAttestation } from './attestationService'

const defaultForbiddenUses = [
  '不可声称真实线下见面',
  '不可用于商业广告',
  '不可暗示代言、投资、合作关系',
  '不可二次出售',
  '不可移除认证标识后传播',
]

export function generateCertificateId(sequence: number): string {
  return `AICOPHOTO-2026-${String(sequence).padStart(6, '0')}`
}

export function buildVerifyUrl(certificateId: string): string {
  return `${window.location.origin}/verify/${certificateId}`
}

export function buildResultUrl(certificateId: string): string {
  return `/result/${certificateId}`
}

export function createCertificateFromRequest(
  request: CoPhotoRequest,
  sequence: number,
  usageScope: UsageScope[] = ['personal_collection', 'social_media'],
): Certificate {
  const certificateId = generateCertificateId(sequence)
  const imageHash = createImageHash(`${certificateId}:${request.id}`)
  const licenseHash = createLicenseHash(`${request.celebrityId}:${request.usageScope}:${request.approvedAt}`)
  const certificateHash = createCertificateHash(`${certificateId}:${imageHash}:${licenseHash}`)
  const mockAttestation = createMockAttestation({ certificateId, certificateHash })

  return {
    certificateId,
    requestId: request.id,
    imageHash,
    licenseHash,
    certificateHash,
    syntheticImage: true,
    notPhysicalMeeting: true,
    notEndorsement: true,
    usageScope,
    forbiddenUses: defaultForbiddenUses,
    issuedAt: request.approvedAt ?? new Date().toISOString(),
    expiresAt: request.expiresAt,
    revocable: true,
    status: 'valid',
    mockChainName: mockAttestation.chainName,
    mockTransactionHash: mockAttestation.transactionHash,
    verifyUrl: buildVerifyUrl(certificateId),
  }
}

export function getForbiddenUses(): string[] {
  return defaultForbiddenUses
}
