import type { Certificate } from '../types'

export interface C2paMetadataDraft {
  certificateId: string
  contentType: 'authorized-ai-cophoto'
  syntheticImage: true
  notPhysicalMeeting: true
  notEndorsement: true
  verifyUrl: string
}

export function buildC2paMetadataDraft(certificate: Certificate): C2paMetadataDraft {
  // Placeholder for future C2PA metadata writing. Store public verification
  // facts only; original photos, IDs, and full license documents should remain
  // in controlled server storage, not in public metadata or on-chain records.
  return {
    certificateId: certificate.certificateId,
    contentType: 'authorized-ai-cophoto',
    syntheticImage: true,
    notPhysicalMeeting: true,
    notEndorsement: true,
    verifyUrl: certificate.verifyUrl,
  }
}
