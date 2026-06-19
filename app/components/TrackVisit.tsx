'use client'

// TrackVisit — drop this into a server-rendered page to record the
// visit in localStorage via RecentlyViewedRail's trackRecentlyViewed.
// Renders nothing.

import { useEffect } from 'react'
import { trackRecentlyViewed, type RecentlyViewedItem } from './RecentlyViewedRail'

type Props = Omit<RecentlyViewedItem, 'viewedAt'>

export default function TrackVisit(props: Props) {
  useEffect(() => {
    trackRecentlyViewed(props)
    // Only on mount per page load — props are stable per page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}
