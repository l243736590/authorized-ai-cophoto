import { allowedUsageText, usageScopeLabels } from '../data/mockData'
import type { Certificate } from '../types'
import { StatusBadge } from './StatusBadge'
import { UsageScopeBadge } from './UsageScopeBadge'

interface CertificateCardProps {
  certificate: Certificate
}

export function CertificateCard({ certificate }: CertificateCardProps) {
  return (
    <section className="certificate-card">
      <div>
        <p className="eyebrow">Certification Record</p>
        <h2>{certificate.certificateId}</h2>
      </div>
      <StatusBadge status={certificate.status} />

      <dl className="meta-grid">
        <div>
          <dt>图片类型</dt>
          <dd>AI 合成合影</dd>
        </div>
        <div>
          <dt>授权状态</dt>
          <dd>{certificate.status === 'valid' ? '授权记录有效' : '授权记录不可继续使用'}</dd>
        </div>
        <div>
          <dt>用途范围</dt>
          <dd className="badge-row">
            {certificate.usageScope.map((scope) => (
              <UsageScopeBadge key={scope} scope={scope} />
            ))}
          </dd>
        </div>
        <div>
          <dt>授权说明</dt>
          <dd>{allowedUsageText}</dd>
        </div>
      </dl>

      <div className="hash-list">
        <div>
          <span>image_hash</span>
          <code>{certificate.imageHash}</code>
        </div>
        <div>
          <span>license_hash</span>
          <code>{certificate.licenseHash}</code>
        </div>
        <div>
          <span>certificate_hash</span>
          <code>{certificate.certificateHash}</code>
        </div>
      </div>

      <p className="fine-print">
        已记录用途：{certificate.usageScope.map((scope) => usageScopeLabels[scope]).join('、')}
      </p>
    </section>
  )
}
