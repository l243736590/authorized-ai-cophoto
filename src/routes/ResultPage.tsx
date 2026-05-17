import { useState } from 'react'
import { CertificateCard } from '../components/CertificateCard'
import { DisclaimerBox } from '../components/DisclaimerBox'
import { Layout } from '../components/Layout'
import { SyntheticImagePreview } from '../components/SyntheticImagePreview'
import { coreDisclaimer, getCertificateById } from '../data/mockData'

interface ResultPageProps {
  certificateId: string
}

export function ResultPage({ certificateId }: ResultPageProps) {
  const certificate = getCertificateById(certificateId)
  const [copyState, setCopyState] = useState('复制认证链接')

  if (!certificate) {
    return (
      <Layout compact>
        <section className="empty-state">
          <h1>未找到该认证结果</h1>
          <p>请检查认证编号，或返回创建页查看 demo 流程。</p>
          <a className="primary-button" href="/">
            返回创建页
          </a>
        </section>
      </Layout>
    )
  }

  const verifyUrl = `${window.location.origin}/verify/${certificate.certificateId}`

  async function copyVerifyUrl() {
    await navigator.clipboard?.writeText(verifyUrl)
    setCopyState('已复制')
    window.setTimeout(() => setCopyState('复制认证链接'), 1400)
  }

  return (
    <Layout>
      <section className="result-layout">
        <div>
          <p className="eyebrow">Generated Result</p>
          <h1>授权 AI 合成合影已生成</h1>
          <p className="page-lead">该图像带有可验证认证编号、mock hash、用途限制和二维码验证入口。</p>
          <SyntheticImagePreview />
          <DisclaimerBox tone="strong">{coreDisclaimer}</DisclaimerBox>
          <div className="button-row">
            <a className="primary-button" href={`/verify/${certificate.certificateId}`}>
              查看认证页
            </a>
            <button type="button" onClick={() => window.alert('MVP demo：下载图片接口暂未接入。')}>
              下载图片
            </button>
            <button type="button" onClick={copyVerifyUrl}>
              {copyState}
            </button>
          </div>
        </div>
        <CertificateCard certificate={certificate} />
      </section>
    </Layout>
  )
}
