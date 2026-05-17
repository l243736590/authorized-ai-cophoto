import type { CertificateStatus, RequestStatus } from '../types'

const labels: Record<CertificateStatus | RequestStatus, string> = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
  generated: 'generated',
  revoked: '已撤销',
  expired: '已过期',
  valid: '有效',
}

interface StatusBadgeProps {
  status: CertificateStatus | RequestStatus | 'not_found'
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const label = status === 'not_found' ? '未找到' : labels[status]

  return <span className={`status-badge status-badge--${status}`}>{label}</span>
}
