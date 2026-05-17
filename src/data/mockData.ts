import type { Celebrity, Certificate, CoPhotoRequest, UsageScope } from '../types'
import { createCertificateHash, createImageHash, createLicenseHash } from '../services/hashService'

export const usageScopeLabels: Record<UsageScope, string> = {
  personal_collection: '个人收藏',
  social_media: '社交媒体展示',
  commercial_promotion: '商业宣传',
  advertising: '广告投放',
}

export const allowedUsageText = '仅限个人收藏与社交媒体展示，不得用于商业广告、品牌背书、投资宣传、新闻证明或其他可能造成误导的用途。'

export const coreDisclaimer = '本图片为授权 AI 合成合影，不代表双方真实线下见面，不构成代言、合作、投资或商业关系证明。'

export const verifyDisclaimer = '该认证仅证明该图片为授权 AI 合成内容，不证明用户与授权对象发生过真实线下会面。'

export const celebrities: Celebrity[] = [
  {
    id: 'kol-esports-001',
    displayName: '星河 Ace',
    avatarUrl: 'EA',
    category: '电竞选手',
    agencyName: '星河电竞工作室',
    basePrice: 1299,
    allowedUsageScopes: ['personal_collection', 'social_media'],
    status: 'active',
  },
  {
    id: 'kol-study-002',
    displayName: 'Lina 留学记',
    avatarUrl: 'LS',
    category: '留学博主',
    agencyName: 'Lina Studio',
    basePrice: 899,
    allowedUsageScopes: ['personal_collection', 'social_media'],
    status: 'active',
  },
  {
    id: 'kol-fitness-003',
    displayName: '燃力 Coach',
    avatarUrl: 'FC',
    category: '健身博主',
    agencyName: '燃力内容经纪',
    basePrice: 1099,
    allowedUsageScopes: ['personal_collection', 'social_media'],
    status: 'active',
  },
]

export const coPhotoRequests: CoPhotoRequest[] = [
  {
    id: 'REQ-2026-00081',
    userIdHash: 'user_7f3a21',
    celebrityId: 'kol-esports-001',
    usageScope: 'personal_collection',
    price: 1299,
    status: 'pending',
    createdAt: '2026-05-14T09:30:00+09:00',
    expiresAt: '2027-05-14T09:30:00+09:00',
  },
  {
    id: 'REQ-2026-00082',
    userIdHash: 'user_a91d0c',
    celebrityId: 'kol-study-002',
    usageScope: 'social_media',
    price: 899,
    status: 'approved',
    createdAt: '2026-05-13T12:10:00+09:00',
    approvedAt: '2026-05-13T15:45:00+09:00',
    expiresAt: '2027-05-13T15:45:00+09:00',
  },
  {
    id: 'REQ-2026-00083',
    userIdHash: 'user_31b9ee',
    celebrityId: 'kol-fitness-003',
    usageScope: 'commercial_promotion',
    price: 1099,
    status: 'rejected',
    createdAt: '2026-05-12T19:05:00+09:00',
    expiresAt: '2027-05-12T19:05:00+09:00',
  },
]

const forbiddenUses = [
  '不可声称真实线下见面',
  '不可用于商业广告',
  '不可暗示代言、投资、合作关系',
  '不可二次出售',
  '不可移除认证标识后传播',
]

function makeCertificate(
  certificateId: string,
  requestId: string,
  status: Certificate['status'],
  issuedAt: string,
  expiresAt: string,
): Certificate {
  const imageHash = createImageHash(certificateId)
  const licenseHash = createLicenseHash(`${certificateId}:${requestId}`)
  const certificateHash = createCertificateHash(`${certificateId}:${imageHash}:${licenseHash}:${status}`)

  return {
    certificateId,
    requestId,
    imageHash,
    licenseHash,
    certificateHash,
    syntheticImage: true,
    notPhysicalMeeting: true,
    notEndorsement: true,
    usageScope: ['personal_collection', 'social_media'],
    forbiddenUses,
    issuedAt,
    expiresAt,
    revocable: true,
    status,
    mockChainName: 'Mock Attestation Ledger',
    mockTransactionHash: `0xtx${certificateHash.slice(6, 30)}`,
    verifyUrl: `/verify/${certificateId}`,
  }
}

export const certificates: Certificate[] = [
  makeCertificate(
    'AICOPHOTO-2026-000001',
    'REQ-2026-00082',
    'valid',
    '2026-05-13T15:45:00+09:00',
    '2027-05-13T15:45:00+09:00',
  ),
  makeCertificate(
    'AICOPHOTO-2026-000002',
    'REQ-2026-00077',
    'revoked',
    '2026-04-21T11:20:00+09:00',
    '2027-04-21T11:20:00+09:00',
  ),
  makeCertificate(
    'AICOPHOTO-2026-000003',
    'REQ-2025-00941',
    'expired',
    '2025-02-02T10:00:00+09:00',
    '2026-02-02T10:00:00+09:00',
  ),
]

export function getCelebrityById(id: string): Celebrity | undefined {
  return celebrities.find((celebrity) => celebrity.id === id)
}

export function getRequestById(id: string): CoPhotoRequest | undefined {
  return coPhotoRequests.find((request) => request.id === id)
}

export function getCertificateById(id: string): Certificate | undefined {
  return certificates.find((certificate) => certificate.certificateId === id)
}
