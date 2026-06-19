/**
 * Hero WebP paths — CON-26 / HERO_MANIFEST.md (tracker step 6).
 * Default = lobbyist-podium (editorial caricature + gold quote). Set `NEXT_PUBLIC_HERO_VARIANT=envelope|rally` to swap.
 */
export type HeroVariantId = 'sealed-envelope' | 'rally-silhouettes' | 'lobbyist-podium'

export function getHeroVariant(): HeroVariantId {
  const raw = process.env.NEXT_PUBLIC_HERO_VARIANT?.toLowerCase().trim()
  if (raw === 'rally' || raw === 'rally-silhouettes' || raw === 'option-b' || raw === 'b') {
    return 'rally-silhouettes'
  }
  if (raw === 'envelope' || raw === 'sealed' || raw === 'sealed-envelope' || raw === 'option-a' || raw === 'a') {
    return 'sealed-envelope'
  }
  return 'lobbyist-podium'
}

export function getHeroImagePaths() {
  const v = getHeroVariant()
  if (v === 'rally-silhouettes') {
    return {
      variant: v,
      desktopMime: 'image/webp' as const,
      desktop: '/hero/hero-rally-silhouettes-1920x1080.webp',
      mobile: '/hero/hero-rally-silhouettes-750x1000.webp',
      altDesktop:
        'Campaign rally crowd in silhouette, viewed from behind stage, with raised hands and American flag backdrop under stage lighting',
      altMobile:
        'Campaign rally crowd in silhouette, viewed from behind stage, with raised hands and American flag backdrop under stage lighting',
    }
  }
  if (v === 'sealed-envelope') {
    return {
      variant: v,
      desktopMime: 'image/webp' as const,
      desktop: '/hero/hero-sealed-envelope-1920x1080.webp',
      mobile: '/hero/hero-sealed-envelope-750x1000.webp',
      altDesktop:
        'Sealed manila envelope with unbroken wax seal, labeled 2016 campaign archive, on aged oak desk with redacted documents',
      altMobile:
        'Sealed manila envelope with unbroken wax seal, labeled 2016 campaign archive, on aged oak desk with redacted documents',
    }
  }
  return {
    variant: v,
    desktopMime: 'image/jpeg' as const,
    desktop: '/hero/hero-lobbyist-podium-1920.jpg',
    mobile: '/hero/hero-lobbyist-podium-1920.jpg',
    altDesktop:
      'Editorial black-and-white illustration of a candidate at a podium with American flag backdrop — companion art for SEALED campaign archive',
    altMobile:
      'Editorial black-and-white illustration of a candidate at a podium with American flag backdrop — companion art for SEALED campaign archive',
  }
}
