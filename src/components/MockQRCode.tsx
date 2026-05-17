interface MockQRCodeProps {
  label?: string
}

export function MockQRCode({ label = 'Verified AI Co-photo' }: MockQRCodeProps) {
  return (
    <div className="mock-qr" aria-label="模拟二维码">
      <div className="mock-qr__grid">
        {Array.from({ length: 25 }).map((_, index) => (
          <span key={index} className={index % 2 === 0 || index % 7 === 0 ? 'is-dark' : ''} />
        ))}
      </div>
      <strong>{label}</strong>
    </div>
  )
}
