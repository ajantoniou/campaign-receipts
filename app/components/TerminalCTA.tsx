import Link from 'next/link'
import { TrendingUp, TerminalSquare } from 'lucide-react'

export default function TerminalCTA({ title }: { title?: string }) {
  return (
    <div className="my-12 relative overflow-hidden rounded-lg border border-[#333] bg-[#0a0a0a] p-8 text-center sm:text-left sm:flex sm:items-center sm:justify-between shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-r from-[#00FF00]/5 to-transparent pointer-events-none" />
      
      <div className="relative z-10 sm:max-w-xl">
        <div className="flex items-center justify-center sm:justify-start gap-2 text-[#58A6FF] mb-3">
          <TerminalSquare className="w-5 h-5" />
          <span className="font-mono text-xs uppercase tracking-widest font-bold">Alpha Terminal</span>
        </div>
        <h3 className="text-2xl font-display font-bold text-white mb-2 leading-tight">
          Trade the outcome of {title ? `this ${title}` : 'this legislation'}.
        </h3>
        <p className="text-[#888] text-sm leading-relaxed mb-6 sm:mb-0">
          Get institutional-grade predictions, calculated arbitrage gaps, and real-time PAC money flows on political betting markets. 
        </p>
      </div>

      <div className="relative z-10 sm:ml-6 shrink-0">
        <Link 
          href="/betting"
          className="inline-flex items-center justify-center gap-2 bg-[#00FF00] text-black font-mono font-bold text-sm px-6 py-3 rounded hover:bg-[#00cc00] transition-colors whitespace-nowrap"
        >
          <TrendingUp className="w-4 h-4" />
          OPEN TERMINAL
        </Link>
      </div>
    </div>
  )
}
