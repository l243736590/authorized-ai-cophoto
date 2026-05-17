import { CertificateCard } from '../components/CertificateCard'
import { DisclaimerBox } from '../components/DisclaimerBox'
import { Layout } from '../components/Layout'
import { StatusBadge } from '../components/StatusBadge'
import {
  allowedUsageText,
  getCelebrityById,
  getCertificateById,
  getRequestById,
  usageScopeLabels,
  verifyDisclaimer,
} from '../data/mockData'

interface VerifyPageProps {
  certificateId: string
}

const archivedParties: Record<string, { licensor: string; subject: string }> = {
  'AICOPHOTO-2026-000002': {
    licensor: '星河电竞工作室',
    subject: '星河 Ace',
  },
  'AICOPHOTO-2026-000003': {
    licensor: '燃力内容经纪',
    subject: '燃力 Coach',
  },
}

export function VerifyPage({ certificateId }: VerifyPageProps) {
  const certificate = getCertificateById(certificateId)

  if (!certificate) {
    return (
      <Layout compact>
        <section className="verify-status verify-status--not_found">
          <StatusBadge status="not_found" />
          <h1>未找到该认证记录</h1>
          <p>请确认二维码或认证编号是否完整。未找到记录不代表图片获得平台授权。</p>
        </section>
      </Layout>
    )
  }

  const request = getRequestById(certificate.requestId)
  const celebrity = request ? getCelebrityById(request.celebrityId) : undefined
  const archived = archivedParties[certificate.certificateId]
  const licensorName = celebrity?.agencyName ?? archived?.licensor ?? '归档授权方'
  const subjectName = celebrity?.displayName ?? archived?.subject ?? '归档授权对象'

  return (
    <Layout compact>
      <section className={`verify-status verify-status--${certificate.status}`}>
        <StatusBadge status={certificate.status} />
        <h1>{certificate.status === 'valid' ? '认证状态：有效' : certificate.status === 'revoked' ? '认证状态：已撤销' : '认证状态：已过期'}</h1>
        <p>{verifyDisclaimer}</p>
      </section>

      <section className="verify-grid">
        <div className="verify-main">
          <dl className="meta-grid meta-grid--large">
            <div>
              <dt>认证编号</dt>
              <dd>{certificate.certificateId}</dd>
            </div>
            <div>
              <dt>图片类型</dt>
              <dd>AI 合成合影</dd>
            </div>
            <div>
              <dt>授权方</dt>
              <dd>{licensorName}</dd>
            </div>
            <div>
              <dt>授权对象</dt>
              <dd>{subjectName}</dd>
            </div>
            <div>
              <dt>授权范围</dt>
              <dd>{certificate.usageScope.map((scope) => usageScopeLabels[scope]).join('、')}</dd>
            </div>
            <div>
              <dt>范围说明</dt>
              <dd>{allowedUsageText}</dd>
            </div>
          </dl>

          <section className="forbidden-panel">
            <p className="eyebrow">Forbidden Uses</p>
            <h2>禁止用途</h2>
            <ul>
              {certificate.forbiddenUses.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <DisclaimerBox tone="strong">{verifyDisclaimer}</DisclaimerBox>
        </div>

        <aside className="chain-panel">
          <p className="eyebrow">Mock Chain Attestation</p>
          <h2>链上/认证记录</h2>
          <dl className="chain-list">
            <div>
              <dt>image_hash</dt>
              <dd>{certificate.imageHash}</dd>
            </div>
            <div>
              <dt>license_hash</dt>
              <dd>{certificate.licenseHash}</dd>
            </div>
            <div>
              <dt>certificate_hash</dt>
              <dd>{certificate.certificateHash}</dd>
            </div>
            <div>
              <dt>issued_at</dt>
              <dd>{new Date(certificate.issuedAt).toLocaleString('zh-CN')}</dd>
            </div>
            <div>
              <dt>expires_at</dt>
              <dd>{new Date(certificate.expiresAt).toLocaleString('zh-CN')}</dd>
            </div>
            <div>
              <dt>mock_chain</dt>
              <dd>{certificate.mockChainName}</dd>
            </div>
            <div>
              <dt>mock_transaction_hash</dt>
              <dd>{certificate.mockTransactionHash}</dd>
            </div>
          </dl>
        </aside>
      </section>

      <CertificateCard certificate={certificate} />
    </Layout>
  )
}
