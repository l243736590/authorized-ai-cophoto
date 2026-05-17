import { usageScopeLabels } from '../data/mockData'
import type { UsageScope } from '../types'

interface UsageScopeBadgeProps {
  scope: UsageScope
  disabled?: boolean
}

export function UsageScopeBadge({ scope, disabled = false }: UsageScopeBadgeProps) {
  return (
    <span className={disabled ? 'usage-badge usage-badge--disabled' : 'usage-badge'}>
      {usageScopeLabels[scope]}
    </span>
  )
}
