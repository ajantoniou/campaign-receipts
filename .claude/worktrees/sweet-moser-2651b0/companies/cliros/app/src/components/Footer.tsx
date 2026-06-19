import Logo from "./Logo";
import { CompanyPhoneLink } from "@/lib/company-phone";

export default function Footer() {
  return (
    <footer className="bg-[var(--obsidian)] text-[var(--paper)]/80">
      <div className="gold-rule-foil" />
      <div className="max-w-[1200px] mx-auto px-6 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-12">
          <div>
            <Logo size="sm" variant="white" />
            <p className="font-sc text-[11px] mt-4 text-[var(--gold-foil)]">Cliros, PBC</p>
            <address className="not-italic mt-3 text-[13px] leading-[1.65] text-[var(--paper)]/75">
              999 Peachtree Street NE<br />
              Suite 2300<br />
              Atlanta, Georgia 30309<br />
              <a href="mailto:alex@cliros.ai" className="hover:text-[var(--gold-foil)] transition">alex@cliros.ai</a>
              {" · "}
              <CompanyPhoneLink className="hover:text-[var(--gold-foil)] transition" />
            </address>
          </div>
          <div>
            <h4 className="font-sc text-[11px] text-[var(--gold-foil)] mb-4">Product</h4>
            <ul className="space-y-2.5 text-[13px] text-[var(--paper)]/75">
              <li><a href="/#package" className="hover:text-[var(--paper)] transition">The 10-Doc Package</a></li>
              <li><a href="/#pricing" className="hover:text-[var(--paper)] transition">Pricing</a></li>
              <li><a href="mailto:alex@cliros.ai?subject=Cliros%20founding%20attorney%20preview" className="hover:text-[var(--paper)] transition">Start a Preview File</a></li>
              <li><a href="/login" className="hover:text-[var(--paper)] transition">Sign In</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-sc text-[11px] text-[var(--gold-foil)] mb-4">Firm</h4>
            <ul className="space-y-2.5 text-[13px] text-[var(--paper)]/75">
              <li><a href="/#pledge" className="hover:text-[var(--paper)] transition">About</a></li>
              <li><a href="/#pledge" className="hover:text-[var(--paper)] transition">The Mission Fund</a></li>
              <li><a href="mailto:alex@cliros.ai?subject=Press%20inquiry" className="hover:text-[var(--paper)] transition">Press</a></li>
              <li><a href="mailto:alex@cliros.ai?subject=Cliros%20question" className="hover:text-[var(--paper)] transition">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-sc text-[11px] text-[var(--gold-foil)] mb-4">Legal</h4>
            <ul className="space-y-2.5 text-[13px] text-[var(--paper)]/75">
              <li><a href="/terms" className="hover:text-[var(--paper)] transition">Terms</a></li>
              <li><a href="/privacy" className="hover:text-[var(--paper)] transition">Privacy</a></li>
              <li><a href="https://www.gabar.org" target="_blank" rel="noreferrer" className="hover:text-[var(--paper)] transition">State Bar of Georgia ↗</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-[var(--paper)]/10 flex flex-col md:flex-row items-center justify-between gap-4 text-[12px]">
          <p className="text-[var(--paper)]/55 text-center md:text-left">
            © {new Date().getFullYear()} Cliros, PBC. Attorney advertising. Past results do not guarantee future outcomes.
          </p>
          <a href="/#pledge" className="inline-flex items-center gap-2 text-[var(--gold-foil)] hover:text-[var(--paper)] transition" aria-label="The Cliros Mission Fund — 10% of revenue">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-[var(--gold)] text-[9px] font-sc text-[var(--gold-foil)]">10%</span>
            <span className="font-sc text-[10px]">Mission Fund — 10% of revenue</span>
          </a>
          <p className="text-[var(--paper)]/55 text-[11px]">
            Made with <span className="text-[var(--orange-ga)]">♥</span> in the USA <span aria-label="US flag">🇺🇸</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
