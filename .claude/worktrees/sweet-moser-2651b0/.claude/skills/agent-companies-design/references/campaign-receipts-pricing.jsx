/* Campaign Receipts — Pricing Page */

const PricingPage = () => (
  <div style={{ background: 'var(--paper)' }}>
    <Nav active="pricing" />

    <section className="hero" style={{ gridTemplateColumns: '1fr', textAlign: 'center', padding: '96px 48px 64px' }}>
      <div style={{ position: 'relative', zIndex: 2, maxWidth: 820, margin: '0 auto' }}>
        <span className="hero-eyebrow" style={{ margin: '0 auto' }}>
          <span className="dot-live"></span>
          Free for everyone. Always.
        </span>
        <h1 className="headline" style={{ fontSize: 92, marginTop: 24 }}>
          The receipts are <span className="underline">free</span>.<br/>
          <em>The deep work pays the rent.</em>
        </h1>
        <p className="hero-sub" style={{ margin: '0 auto 32px', textAlign: 'center', maxWidth: 600 }}>
          Public political accountability shouldn't sit behind a paywall. The database stays free.
          Editions, archives, and research access fund the editorial team.
        </p>
      </div>
    </section>

    {/* PRICING TIERS */}
    <section className="section" style={{ paddingTop: 24 }}>
      <div className="price-grid">
        {/* Reader */}
        <div className="price-card">
          <div className="ptier">— READER · 01</div>
          <h3>The Public Edition</h3>
          <div className="pdesc">
            For citizens, students, and anyone who just wants to look up a politician's record.
          </div>
          <div className="pprice">$0<small>&nbsp;/ forever</small></div>
          <div className="pper">No login required</div>
          <ul className="feats">
            <li>Full database — every promise, every verdict</li>
            <li>All primary-source documents</li>
            <li>Politician profiles + state browsing</li>
            <li>Live tracking on current officeholders</li>
            <li>Submit a correction or new source</li>
            <li>Save & share unlimited receipts</li>
          </ul>
          <button className="btn-secondary">Browse the database</button>
        </div>

        {/* Featured — book */}
        <div className="price-card featured">
          <div className="ptier">— BOUND · 02</div>
          <h3>SEALED — The 2016 Promises</h3>
          <div className="pdesc">
            The companion volume. 282 sealed verdicts, 1,114 receipts, 396 pages.
          </div>
          <div className="pprice">$19<small>&nbsp;one-time</small></div>
          <div className="pper">PDF · EPUB · paperback +$12</div>
          <ul className="feats">
            <li>Every Trump 2016 promise, sealed and indexed</li>
            <li>1,114 receipts hyperlinked to primary sources</li>
            <li>Editor's notes for every contested verdict</li>
            <li>Cross-referenced index by topic, agency, year</li>
            <li>Forever updates — corrections roll in free</li>
            <li>Citation-ready footnotes for journalists</li>
            <li>Includes "How verdicts were made" appendix</li>
          </ul>
          <button className="btn-primary">Buy the digital edition</button>
        </div>

        {/* Pro */}
        <div className="price-card">
          <div className="ptier">— PRO · 03</div>
          <h3>Newsroom & Research</h3>
          <div className="pdesc">
            For journalists, academics, and policy teams who need the data raw and the people on call.
          </div>
          <div className="pprice">$48<small>&nbsp;/ mo</small></div>
          <div className="pper">Billed yearly · $480</div>
          <ul className="feats">
            <li>Everything in Reader, plus —</li>
            <li>Full API access (10k requests/mo)</li>
            <li>CSV exports across any filter</li>
            <li>Embargo briefings on upcoming verdicts</li>
            <li>Editor on Signal for source verification</li>
            <li>White-label receipt embeds for your site</li>
            <li>Archive access — pre-2000 promise corpus</li>
          </ul>
          <button className="btn-secondary">Start a 14-day trial</button>
        </div>
      </div>

      {/* No-PAC reassurance */}
      <div style={{
        marginTop: 36, padding: '24px 28px', border: '1.5px dashed var(--line)',
        borderRadius: 'var(--r-lg)', background: 'var(--paper-2)',
        display: 'flex', alignItems: 'center', gap: 24
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--paper)', border: '1.5px solid var(--line)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--display)', fontSize: 28, fontStyle: 'italic',
          color: 'var(--ink-2)', flexShrink: 0,
        }}>
          $0
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.16em',
                        textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 6 }}>
            Funding policy
          </div>
          <div style={{ fontSize: 16, color: 'var(--ink-2)', lineHeight: 1.55 }}>
            We accept no money from PACs, parties, campaigns, candidates, or super-donors.
            Revenue comes from readers, the SEALED edition, and a single research grant — all
            disclosed in the annual transparency report.
          </div>
        </div>
        <a href="#" style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.14em',
                             textTransform: 'uppercase', color: 'var(--ink)',
                             borderBottom: '1px solid var(--ink)', paddingBottom: 2, flexShrink: 0 }}>
          Read the 2025 disclosure →
        </a>
      </div>
    </section>

    {/* COMPARISON TABLE */}
    <section className="section" style={{ background: 'var(--paper-2)' }}>
      <div className="section-eyebrow">What's in each tier</div>
      <h2>Side by side.</h2>
      <p className="lede">Everything in plain language.</p>

      <div style={{ background: 'var(--paper)', border: '1px solid var(--line)',
                    borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
        {[
          ['Browse all promises',           '✓', '✓', '✓'],
          ['Read primary-source receipts',  '✓', '✓', '✓'],
          ['Save & share receipts',         '✓', '✓', '✓'],
          ['Submit corrections',            '✓', '✓', '✓'],
          ['Full SEALED 2016 archive',      '—', '✓', '✓'],
          ['Editor footnotes & appendices', '—', '✓', '✓'],
          ['API access (10k req/mo)',       '—', '—', '✓'],
          ['CSV exports + bulk download',   '—', '—', '✓'],
          ['Embargo briefings',             '—', '—', '✓'],
          ['Editor-on-Signal',              '—', '—', '✓'],
          ['Pre-2000 archive corpus',       '—', '—', '✓'],
        ].map(([label, a, b, c], i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr',
            padding: '16px 24px', alignItems: 'center',
            borderBottom: i === 10 ? 0 : '1px solid var(--line-soft)',
            fontSize: 14,
          }}>
            <div style={{ color: 'var(--ink-2)' }}>{label}</div>
            {[a, b, c].map((v, j) => (
              <div key={j} style={{
                textAlign: 'center',
                fontFamily: v === '✓' ? 'var(--sans)' : 'var(--mono)',
                color: v === '✓' ? 'var(--kept)' : 'var(--mute)',
                fontWeight: v === '✓' ? 600 : 400, fontSize: v === '✓' ? 16 : 13,
              }}>{v}</div>
            ))}
          </div>
        ))}
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr',
          padding: '14px 24px', background: 'var(--paper-2)',
          borderTop: '1.5px dashed var(--line)',
          fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)',
          letterSpacing: '0.14em', textTransform: 'uppercase'
        }}>
          <div></div>
          <div style={{ textAlign: 'center' }}>READER</div>
          <div style={{ textAlign: 'center' }}>SEALED</div>
          <div style={{ textAlign: 'center' }}>PRO</div>
        </div>
      </div>
    </section>

    {/* FAQ */}
    <section className="section">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 80 }}>
        <div>
          <div className="section-eyebrow">FAQ</div>
          <h2>Asked, often.</h2>
          <p className="lede" style={{ marginBottom: 0 }}>
            Don't see your question? The editor's inbox is{' '}
            <a href="#" style={{ borderBottom: '1px solid var(--ink)' }}>publicly open</a>.
          </p>
        </div>
        <div>
          {[
            { q: "How can the database stay free?",
              a: "About 64% of revenue is from the SEALED digital edition. 28% from Pro subscriptions. 8% from one research grant. No ads, no affiliate deals, no donor strings." },
            { q: "Are you actually non-partisan?",
              a: "We grade promises against the politician's own words. Verdicts require concurrence from two editors with different party-affiliation histories. Disputes go through a public docket." },
            { q: "Can I cite a receipt in my reporting?",
              a: "Yes. Every receipt has a stable URL and a citation-ready footnote. Pro subscribers get an embed snippet that updates if the verdict is later corrected." },
            { q: "How long until a promise is graded?",
              a: "Final verdicts ship within 90 days of a term ending. Live-tracking verdicts update within 72 hours of a relevant primary source landing in our queue." },
            { q: "What if you get it wrong?",
              a: "File a dispute. Accepted corrections update the page within 14 days and stay in the corrections log forever. We've shipped 14 corrections to date — all logged publicly." },
          ].map((f, i) => (
            <div key={i} style={{
              padding: '24px 0', borderBottom: i === 4 ? 0 : '1px solid var(--line)',
            }}>
              <div className="between" style={{ alignItems: 'flex-start', gap: 24 }}>
                <h4 style={{
                  fontFamily: 'var(--display)', fontSize: 24, letterSpacing: '-0.01em',
                  fontWeight: 400, margin: 0, flex: 1,
                }}>{f.q}</h4>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)',
                               letterSpacing: '0.14em' }}>
                  Q.{String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <p style={{ marginTop: 12, marginBottom: 0, color: 'var(--ink-2)',
                          fontSize: 15, lineHeight: 1.6, maxWidth: 640 }}>
                {f.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <Footer />
  </div>
);

Object.assign(window, { PricingPage });
