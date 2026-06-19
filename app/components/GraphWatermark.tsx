// Watermark for screenshot-worthy graphs.
// Per design lead: must survive a journalist's screenshot even if the
// page chrome around it is cropped. Mono font, low opacity, bottom-right,
// unselectable. Same component is mirrored in OG-image routes so
// screenshots-of-screenshots still carry the credit.

type Props = {
  className?: string
}

export default function GraphWatermark({ className = '' }: Props) {
  return (
    <div
      className={`absolute bottom-2 right-3 font-mono text-[10px] text-ink-400/50 select-none pointer-events-none ${className}`}
      aria-hidden
    >
      campaignreceipts.com
    </div>
  )
}
