/**
 * Vendored copy of shared/react/CompanyPhoneLink + shared/config/company-contact.
 * Imports that escape the company folder break the Render build (webpack roots
 * at the service rootDir), so portfolio components are copied in, not imported.
 * Upstream source of truth: shared/react/CompanyPhoneLink.tsx.
 */

const FALLBACK_E164 = '+17047714720'

function getCompanyPhoneE164(): string {
  const v =
    process.env.NEXT_PUBLIC_COMPANY_PHONE?.trim() ||
    process.env.COMPANY_PHONE?.trim()
  return v || FALLBACK_E164
}

function formatCompanyPhoneDisplay(e164 = getCompanyPhoneE164()): string {
  const d = e164.replace(/\D/g, '')
  if (d.length === 11 && d.startsWith('1')) {
    return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`
  }
  return e164
}

function getCompanyPhoneTelHref(e164 = getCompanyPhoneE164()): string {
  return `tel:${e164.replace(/[^\d+]/g, '')}`
}

type CompanyPhoneLinkProps = {
  className?: string
  /** e.g. "Customer service" — shown before the number */
  prefix?: string
  children?: string
}

/** Click-to-call link for the portfolio company line. */
export function CompanyPhoneLink({
  className,
  prefix = 'Customer service',
  children,
}: CompanyPhoneLinkProps): JSX.Element {
  const display = children ?? formatCompanyPhoneDisplay()
  const label = prefix ? `${prefix}: ${display}` : display
  return (
    <a href={getCompanyPhoneTelHref()} className={className}>
      {label}
    </a>
  )
}
