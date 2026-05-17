import { MockQRCode } from './MockQRCode'

interface SyntheticImagePreviewProps {
  title?: string
}

export function SyntheticImagePreview({ title = '授权 AI 虚拟合影' }: SyntheticImagePreviewProps) {
  return (
    <figure className="synthetic-preview">
      <div className="synthetic-preview__scene">
        <div className="synthetic-person synthetic-person--user">
          <span>YOU</span>
        </div>
        <div className="synthetic-person synthetic-person--kol">
          <span>KOL</span>
        </div>
        <MockQRCode />
      </div>
      <figcaption>{title}</figcaption>
    </figure>
  )
}
