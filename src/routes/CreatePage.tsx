import { useMemo, useState } from 'react'
import { DisclaimerBox } from '../components/DisclaimerBox'
import { Layout } from '../components/Layout'
import { UsageScopeBadge } from '../components/UsageScopeBadge'
import { allowedUsageText, celebrities, coreDisclaimer, usageScopeLabels } from '../data/mockData'
import { useLanguage } from '../i18n/LanguageContext'
import { buildResultUrl } from '../services/certificateService'
import type { UsageScope } from '../types'

const usageScopes: UsageScope[] = [
  'personal_collection',
  'social_media',
  'commercial_promotion',
  'advertising',
]

const enabledScopes: UsageScope[] = ['personal_collection', 'social_media']

const footballCaseImagePath = '/cases/football-cophoto-case.png'
const fakerCaseImagePath = '/cases/faker-cophoto.png'

const copy = {
  zh: {
    heroEyebrow: 'Authorized AI Co-photo',
    heroTitle: '授权 AI 合影收藏卡',
    heroSubtitle: '不伪造见面，只认证授权。',
    heroBody: '为粉丝和 KOL 创建可验证的 AI 合成合影：每张图都有认证编号、用途边界、hash 记录和扫码验证页。',
    proof: ['肖像授权', 'AI 合成标识', '二维码验证', 'Mock 链上记录'],
    createCta: '创建合影认证',
    verifyCta: '查看验证页',
    certImageType: '图片类型',
    certImageTypeValue: 'AI 合成合影',
    certScope: '授权范围',
    certScopeValue: '个人收藏 / 社交媒体展示',
    certStatus: '状态',
    certStatusValue: '有效，可扫码验证',
    finishedCase: '投资人演示成品案例',
    finishedCaseBody: '用足球合影样张展示完整产品闭环：AI 合成合影、认证编号、二维码验证、用途限制与公开验证页。',
    caseNote: '演示样张仅用于产品展示；真实上线前需要取得肖像授权与明确用途范围。',
    missingImage: '案例图片未加载',
    missingFootball: '请确认 public/cases/football-cophoto-case.png 存在',
    chainTitle: 'FAKER 合影上链展示相框',
    chainBody: '用于投资人演示：把合影作为授权 AI 合成内容展示，旁边给出 mock 链上记录、用途边界和验证入口。',
    usageScope: '个人收藏、社交媒体展示',
    chainWarning: '展示文案必须保持边界：该认证仅证明授权 AI 合成与生成记录，不证明真实线下会面，不构成代言、合作或商业关系证明。',
    steps: [
      ['上传照片', '只做生成输入，MVP 不上传服务器。'],
      ['选择授权对象', 'KOL / 博主 / 选手可按授权范围开放。'],
      ['生成可验证纪念照', '二维码页面清楚说明认证了什么，也说明没有认证什么。'],
    ],
    createTitle: '制作你的授权 AI 合影纪念卡',
    uploadPhoto: '上传你的照片',
    noFile: '尚未选择照片',
    localDemo: '第一版仅做本地 UI 演示，不会上传到服务器。',
    chooseSubject: '选择想合影的授权对象',
    chooseUsage: '选择这张纪念照的用途',
    commercialDisabled: '第一版暂不支持商业用途授权。',
    generate: '生成授权 AI 合影认证',
    notMeeting: '这不是线下见面证明，而是一张带授权边界的 AI 纪念合影。',
    licensor: '授权方',
    basePrice: '基础授权价',
    currentUsage: '当前用途',
    verifyAlways: '公开验证页会始终显示：',
    noteTags: ['AI 合成', '肖像授权', '不代表真实见面', '不构成代言或商业关系'],
    allowedUsage: allowedUsageText,
    coreDisclaimer,
  },
  ko: {
    heroEyebrow: 'Official Licensed Frame',
    heroTitle: '공식 인증 AI 투샷 카드',
    heroSubtitle: '만남을 위조하지 않고, 허가만 인증합니다.',
    heroBody: '팬과 크리에이터를 위한 검증 가능한 AI 합성 투샷입니다. 인증번호, 사용 범위, 해시 기록, QR 검증 페이지를 함께 제공합니다.',
    proof: ['초상권 허가', 'AI 합성 표시', 'QR 검증', 'Mock 온체인 기록'],
    createCta: '투샷 인증 만들기',
    verifyCta: '검증 페이지 보기',
    certImageType: '이미지 유형',
    certImageTypeValue: 'AI 합성 투샷',
    certScope: '허가 범위',
    certScopeValue: '개인 소장 / SNS 게시',
    certStatus: '상태',
    certStatusValue: '유효, QR 검증 가능',
    finishedCase: '투자자 데모 완성 사례',
    finishedCaseBody: '축구 투샷 샘플로 제품 흐름을 보여줍니다: AI 합성 이미지, 인증번호, QR 검증, 사용 제한, 공개 검증 페이지.',
    caseNote: '데모 이미지는 제품 설명용입니다. 실제 출시 전에는 초상권 허가와 사용 범위를 명확히 해야 합니다.',
    missingImage: '사례 이미지가 로드되지 않았습니다',
    missingFootball: 'public/cases/football-cophoto-case.png 파일을 확인하세요',
    chainTitle: 'FAKER 투샷 온체인 전시 프레임',
    chainBody: '투자자 데모용입니다. 합성 이미지를 허가된 AI 콘텐츠로 전시하고 mock 온체인 기록, 사용 범위, 검증 입구를 함께 보여줍니다.',
    usageScope: '개인 소장, SNS 게시',
    chainWarning: '이 인증은 허가된 AI 합성 및 생성 기록만 증명합니다. 실제 오프라인 만남, 광고 모델, 협업, 투자 관계를 증명하지 않습니다.',
    steps: [
      ['사진 업로드', 'MVP에서는 로컬 UI 데모만 제공하며 서버에 업로드하지 않습니다.'],
      ['허가 대상 선택', 'KOL / 크리에이터 / 선수는 허가 범위에 따라 공개됩니다.'],
      ['검증 가능한 기념 이미지 생성', 'QR 페이지에서 무엇을 인증하고 무엇을 인증하지 않는지 명확히 표시합니다.'],
    ],
    createTitle: '공식 인증 AI 투샷 카드 만들기',
    uploadPhoto: '내 사진 업로드',
    noFile: '선택된 사진 없음',
    localDemo: '첫 버전은 로컬 UI 데모이며 서버 업로드가 없습니다.',
    chooseSubject: '함께 만들 허가 대상 선택',
    chooseUsage: '기념 이미지 사용 범위 선택',
    commercialDisabled: '첫 버전은 상업적 사용 허가를 지원하지 않습니다.',
    generate: '공식 AI 투샷 인증 생성',
    notMeeting: '이 이미지는 실제 만남의 증거가 아니라, 허가 범위가 명시된 AI 기념 투샷입니다.',
    licensor: '허가 주체',
    basePrice: '기본 허가가',
    currentUsage: '현재 사용 범위',
    verifyAlways: '공개 검증 페이지는 항상 표시합니다:',
    noteTags: ['AI 합성', '초상권 허가', '실제 만남 아님', '광고/협업 관계 아님'],
    allowedUsage: '개인 소장 및 SNS 게시에 한정되며, 상업 광고, 브랜드 보증, 투자 홍보, 뉴스 증빙 등 오해를 유발할 수 있는 용도로 사용할 수 없습니다.',
    coreDisclaimer: '본 이미지는 허가된 AI 합성 투샷이며, 실제 오프라인 만남을 의미하지 않고 광고 모델, 협업, 투자 또는 상업 관계의 증거가 아닙니다.',
  },
}

export function CreatePage() {
  const { language, isKo } = useLanguage()
  const text = copy[language]
  const [selectedCelebrityId, setSelectedCelebrityId] = useState(celebrities[0].id)
  const [usageScope, setUsageScope] = useState<UsageScope>('personal_collection')
  const [fileName, setFileName] = useState(text.noFile)
  const [footballCaseImageReady, setFootballCaseImageReady] = useState(false)
  const [fakerCaseImageReady, setFakerCaseImageReady] = useState(false)

  const selectedCelebrity = useMemo(
    () => celebrities.find((celebrity) => celebrity.id === selectedCelebrityId) ?? celebrities[0],
    [selectedCelebrityId],
  )

  function handleSubmit() {
    window.location.href = buildResultUrl('AICOPHOTO-2026-000001')
  }

  function getUsageLabel(scope: UsageScope) {
    if (!isKo) {
      return usageScopeLabels[scope]
    }

    return {
      personal_collection: '개인 소장',
      social_media: 'SNS 게시',
      commercial_promotion: '상업 홍보',
      advertising: '광고 집행',
    }[scope]
  }

  return (
    <Layout>
      <section className="hero-panel hero-panel--fan hero-panel--product">
        <div className="hero-panel__copy">
          <p className="eyebrow">{text.heroEyebrow}</p>
          <h1>{text.heroTitle}</h1>
          <p className="hero-subtitle">{text.heroSubtitle}</p>
          <p className="hero-description">{text.heroBody}</p>

          <div className="hero-proof-row" aria-label={isKo ? '플랫폼 기능' : '平台能力'}>
            {text.proof.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>

          <div className="hero-actions">
            <a className="primary-button" href="#create-request">
              {text.createCta}
            </a>
            <a className="secondary-button" href="/verify/AICOPHOTO-2026-000001">
              {text.verifyCta}
            </a>
          </div>
        </div>

        <div className="hero-product-preview" aria-label={isKo ? '공식 AI 투샷 제품 미리보기' : '授权 AI 合影产品预览'}>
          <div className="hero-preview-card">
            <div className="hero-preview-card__bar">
              <span>Verified AI Co-photo</span>
              <strong>AICOPHOTO-2026-FOOTBALL-DEMO</strong>
            </div>
            <div className="hero-preview-card__image">
              <img
                src={footballCaseImagePath}
                alt={isKo ? '축구 투샷 완성 사례' : '足球合影成品案例'}
                onLoad={() => setFootballCaseImageReady(true)}
                onError={() => setFootballCaseImageReady(false)}
              />
              {!footballCaseImageReady && (
                <div className="case-image-frame__missing">
                  <strong>{text.missingImage}</strong>
                  <span>{text.missingFootball}</span>
                </div>
              )}
            </div>
          </div>

          <aside className="hero-cert-panel">
            <p className="eyebrow">Certificate</p>
            <dl>
              <div>
                <dt>{text.certImageType}</dt>
                <dd>{text.certImageTypeValue}</dd>
              </div>
              <div>
                <dt>{text.certScope}</dt>
                <dd>{text.certScopeValue}</dd>
              </div>
              <div>
                <dt>{text.certStatus}</dt>
                <dd>{text.certStatusValue}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      <section className="case-showcase" aria-label={isKo ? '완성 사례' : '成品案例'}>
        <div className="case-showcase__copy">
          <p className="eyebrow">Finished Case</p>
          <h2>{text.finishedCase}</h2>
          <p>{text.finishedCaseBody}</p>
          <span>{text.caseNote}</span>
        </div>
        <figure className="case-showcase__frame">
          <div className="case-image-frame">
            <img
              src={footballCaseImagePath}
              alt={isKo ? '축구 투샷 완성 사례' : '足球合影成品案例'}
              onLoad={() => setFootballCaseImageReady(true)}
              onError={() => setFootballCaseImageReady(false)}
            />
          </div>
          <figcaption>Case ID: AICOPHOTO-2026-FOOTBALL-DEMO · Authorized synthetic co-photo</figcaption>
        </figure>
      </section>

      <section className="chain-exhibit" aria-label={text.chainTitle}>
        <div className="chain-exhibit__media">
          <div className={fakerCaseImageReady ? 'chain-frame has-image' : 'chain-frame'}>
            <img
              src={fakerCaseImagePath}
              alt={text.chainTitle}
              onLoad={() => setFakerCaseImageReady(true)}
              onError={() => setFakerCaseImageReady(false)}
            />
            {!fakerCaseImageReady && (
              <div className="chain-frame__placeholder">
                <strong>FAKER CO-PHOTO</strong>
                <span>public/cases/faker-cophoto.png</span>
              </div>
            )}
            <div className="chain-frame__topline">
              <span>ON-CHAIN ATTESTATION DISPLAY</span>
              <strong>AICOPHOTO-2026-FAKER-DEMO</strong>
            </div>
            <div className="chain-frame__qr">
              <div className="chain-frame__qr-grid">
                {Array.from({ length: 49 }).map((_, index) => (
                  <i key={index} className={index % 3 === 0 || index % 8 === 0 ? 'is-dark' : ''} />
                ))}
              </div>
              <strong>Verified AI Co-photo</strong>
            </div>
          </div>
        </div>

        <div className="chain-exhibit__copy">
          <p className="eyebrow">On-chain Display Frame</p>
          <h2>{text.chainTitle}</h2>
          <p>{text.chainBody}</p>
          <dl className="chain-exhibit__facts">
            <div>
              <dt>certificate_id</dt>
              <dd>AICOPHOTO-2026-FAKER-DEMO</dd>
            </div>
            <div>
              <dt>mock_chain</dt>
              <dd>Mock Attestation Ledger</dd>
            </div>
            <div>
              <dt>image_hash</dt>
              <dd>0xmockf4k3r8a91c0photo</dd>
            </div>
            <div>
              <dt>usage_scope</dt>
              <dd>{text.usageScope}</dd>
            </div>
          </dl>
          <p className="chain-exhibit__warning">{text.chainWarning}</p>
        </div>
      </section>

      <section className="fan-steps" aria-label={isKo ? '플랫폼 흐름' : '平台流程'}>
        {text.steps.map(([title, body], index) => (
          <div key={title}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{title}</strong>
            <p>{body}</p>
          </div>
        ))}
      </section>

      <section id="create-request" className="workspace-grid">
        <div className="create-form">
          <div className="section-heading">
            <p className="eyebrow">Create Request</p>
            <h2>{text.createTitle}</h2>
          </div>

          <label className="upload-zone">
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setFileName(event.target.files?.[0]?.name ?? text.noFile)}
            />
            <span>{text.uploadPhoto}</span>
            <strong>{fileName}</strong>
            <small>{text.localDemo}</small>
          </label>

          <div className="field-group">
            <label htmlFor="celebrity">{text.chooseSubject}</label>
            <select
              id="celebrity"
              value={selectedCelebrityId}
              onChange={(event) => setSelectedCelebrityId(event.target.value)}
            >
              {celebrities.map((celebrity) => (
                <option key={celebrity.id} value={celebrity.id}>
                  {celebrity.displayName} · {celebrity.category}
                </option>
              ))}
            </select>
          </div>

          <fieldset className="field-group">
            <legend>{text.chooseUsage}</legend>
            <div className="usage-options">
              {usageScopes.map((scope) => {
                const disabled = !enabledScopes.includes(scope)
                return (
                  <label key={scope} className={disabled ? 'usage-option is-disabled' : 'usage-option'}>
                    <input
                      type="radio"
                      name="usageScope"
                      value={scope}
                      checked={usageScope === scope}
                      disabled={disabled}
                      onChange={() => setUsageScope(scope)}
                    />
                    <UsageScopeBadge scope={scope} disabled={disabled} />
                    {isKo && <span className="usage-option__translated">{getUsageLabel(scope)}</span>}
                    {disabled && <small>{text.commercialDisabled}</small>}
                  </label>
                )
              })}
            </div>
          </fieldset>

          <button className="primary-button" type="button" onClick={handleSubmit}>
            {text.generate}
          </button>
        </div>

        <aside className="licensor-summary licensor-summary--fan">
          <div className="avatar-token">{selectedCelebrity.avatarUrl}</div>
          <p className="eyebrow">{selectedCelebrity.category}</p>
          <h2>{selectedCelebrity.displayName}</h2>
          <p className="fan-summary-copy">{text.notMeeting}</p>
          <dl className="summary-list">
            <div>
              <dt>{text.licensor}</dt>
              <dd>{selectedCelebrity.agencyName}</dd>
            </div>
            <div>
              <dt>{text.basePrice}</dt>
              <dd>¥{selectedCelebrity.basePrice.toLocaleString('zh-CN')}</dd>
            </div>
            <div>
              <dt>{text.currentUsage}</dt>
              <dd>{getUsageLabel(usageScope)}</dd>
            </div>
          </dl>
          <DisclaimerBox>{text.allowedUsage}</DisclaimerBox>
        </aside>
      </section>

      <section className="fan-note-strip">
        <strong>{text.verifyAlways}</strong>
        {text.noteTags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </section>

      <DisclaimerBox tone="strong">{text.coreDisclaimer}</DisclaimerBox>
    </Layout>
  )
}
