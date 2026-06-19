import type { StoreCtaMode } from '@/lib/store-status'

function navPurchaseMeta(mode: StoreCtaMode) {
  const href = mode === 'buy' ? '#compare' : '#notify'
  const desktop =
    mode === 'buy' ? 'Buy' : mode === 'sold_out' ? 'Restock alerts' : 'Notify me'
  const mobile = mode === 'buy' ? 'Buy' : mode === 'sold_out' ? 'Restock' : 'Notify'
  return { href, desktop, mobile }
}

/** Desktop nav row (inside `hidden md:flex` parent). */
export function SealedNavPurchaseLinkDesktop({ mode }: { mode: StoreCtaMode }) {
  const { href, desktop } = navPurchaseMeta(mode)
  return (
    <a href={href} className="transition hover:text-slate-300">
      {desktop}
    </a>
  )
}

/** Mobile horizontal strip (inside `flex md:hidden` parent). */
export function SealedNavPurchaseLinkMobile({ mode }: { mode: StoreCtaMode }) {
  const { href, mobile } = navPurchaseMeta(mode)
  return (
    <a href={href} className="shrink-0 whitespace-nowrap hover:text-white">
      {mobile}
    </a>
  )
}

/** Hero row: optional third button when checkout is not the primary CTA. */
export function SealedHeroNotifyButton({ mode }: { mode: StoreCtaMode }) {
  if (mode === 'buy') return null

  const label = mode === 'sold_out' ? 'Join restock list' : 'Email when checkout opens'

  return (
    <a href="#notify" className="sealed-btn-notify">
      {label}
    </a>
  )
}
