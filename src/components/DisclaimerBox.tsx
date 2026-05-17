interface DisclaimerBoxProps {
  title?: string
  children: string
  tone?: 'normal' | 'strong'
}

export function DisclaimerBox({ title = '重要声明', children, tone = 'normal' }: DisclaimerBoxProps) {
  return (
    <section className={`disclaimer disclaimer--${tone}`}>
      <p className="eyebrow">{title}</p>
      <p>{children}</p>
    </section>
  )
}
