import type { Certificate, MockAttestation } from '../types'
import { createMockHash } from './hashService'

export function createMockAttestation(certificate: Pick<Certificate, 'certificateId' | 'certificateHash'>): MockAttestation {
  return {
    chainName: 'Mock Attestation Ledger',
    transactionHash: createMockHash(`${certificate.certificateId}:${certificate.certificateHash}`, '0xtx'),
    recordedAt: new Date().toISOString(),
  }
}

export interface FutureChainAttestationPayload {
  certificateId: string
  imageHash: string
  licenseHash: string
  certificateHash: string
  usageScope: string[]
  issuedAt: string
  expiresAt: string
  revocationStatus: string
}

export async function submitFutureAttestation(
  payload: FutureChainAttestationPayload,
): Promise<MockAttestation> {
  // Future EAS or chain integration should only submit hashes, certificate id,
  // usage scope, timestamps, and revocation status. Never put user originals,
  // identity documents, private contracts, or personal data on-chain.
  void payload
  return {
    chainName: 'Mock Attestation Ledger',
    transactionHash: createMockHash('future-attestation', '0xtx'),
    recordedAt: new Date().toISOString(),
  }
}
