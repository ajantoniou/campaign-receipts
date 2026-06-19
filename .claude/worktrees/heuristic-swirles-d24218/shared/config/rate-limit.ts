const hits = new Map<string, { count: number; resetAt: number }>()

setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of hits) {
    if (entry.resetAt <= now) hits.delete(key)
  }
}, 60_000)

export function isRateLimited(
  ip: string,
  { max = 5, windowMs = 15 * 60_000 }: { max?: number; windowMs?: number } = {},
): boolean {
  const now = Date.now()
  const entry = hits.get(ip)
  if (!entry || entry.resetAt <= now) {
    hits.set(ip, { count: 1, resetAt: now + windowMs })
    return false
  }
  entry.count++
  return entry.count > max
}
