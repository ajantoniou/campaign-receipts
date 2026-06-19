/**
 * Portfolio general company line (Tello). Source: root `.env` → `COMPANY_PHONE`.
 * Public on customer-facing sites; fallback matches canonical E.164 if env unset.
 */

const FALLBACK_E164 = '+17047714720'

function readEnvPhone() {
  if (typeof process !== 'undefined' && process.env) {
    const v =
      process.env.NEXT_PUBLIC_COMPANY_PHONE?.trim() ||
      process.env.COMPANY_PHONE?.trim()
    if (v) return v
  }
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const v =
      import.meta.env.PUBLIC_COMPANY_PHONE?.trim?.() ||
      import.meta.env.COMPANY_PHONE?.trim?.()
    if (v) return v
  }
  return ''
}

/** E.164, e.g. +17047714720 */
export function getCompanyPhoneE164() {
  return readEnvPhone() || FALLBACK_E164
}

/** US display, e.g. (704) 771-4720 */
export function formatCompanyPhoneDisplay(e164 = getCompanyPhoneE164()) {
  const d = e164.replace(/\D/g, '')
  if (d.length === 11 && d.startsWith('1')) {
    return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`
  }
  return e164
}

export function getCompanyPhoneTelHref(e164 = getCompanyPhoneE164()) {
  return `tel:${e164.replace(/[^\d+]/g, '')}`
}
