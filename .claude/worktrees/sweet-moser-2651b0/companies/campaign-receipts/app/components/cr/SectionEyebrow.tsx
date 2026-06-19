// SectionEyebrow — mono caps with leading dash. Per claude-design
// benchmark. Opens every section.

type Props = {
  children: React.ReactNode
  className?: string
}

export default function SectionEyebrow({ children, className = '' }: Props) {
  return <div className={`section-eyebrow ${className}`}>{children}</div>
}
