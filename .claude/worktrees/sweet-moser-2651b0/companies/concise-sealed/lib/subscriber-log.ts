/** Redacted subscriber identifiers for stdout (tracker step 44). */

export function maskEmail(email: string): string {
  const trimmed = email.trim().toLowerCase()
  const at = trimmed.indexOf('@')
  if (at < 2) return '[invalid-email]'
  const local = trimmed.slice(0, at)
  const domain = trimmed.slice(at + 1)
  if (!domain || local.length < 1) return '[invalid-email]'
  const head = local.slice(0, 2)
  const tail = local.length > 2 ? local.slice(-1) : ''
  return `${head}***${tail}@${domain}`
}
