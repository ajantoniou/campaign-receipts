import {
  formatCompanyPhoneDisplay,
  getCompanyPhoneTelHref,
} from '../config/company-contact.js'

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
