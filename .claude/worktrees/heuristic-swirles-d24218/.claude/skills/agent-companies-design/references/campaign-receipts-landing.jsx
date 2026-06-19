/* Campaign Receipts — Landing Page */

const LandingPage = () => (
  <div style={{ background: 'var(--paper)' }}>
    <Nav active="product" />

    {/* ====== HERO ====== */}
    <section className="hero">
      <div style={{ position: 'relative', zIndex: 2 }}>
        <span className="hero-eyebrow">
          <span className="dot-live"></span>
          Tracking 12,847 promises · 184 politicians · Live
        </span>
        <h1 className="headline">
          Every promise.<br/>
          Every <span className="underline">receipt</span>.<br/>
          <em>No spin.</em>
        </h1>
        <p className="hero-sub">
          Campaign Receipts is a non-partisan promise tracker. We grade politicians against
          their own words — using executive orders, voting records, court filings, and public
          documents. Cited. Sourced. Auditable.
        </p>
        <div className="hero-actions">
          <button className="btn-primary">
            Browse the receipts
            <span style={{ opacity: 0.6 }}>→</span>
          </button>
          <button className="btn-secondary">
            How we grade
          </button>
        </div>
        <div className="hero-meta">
          <div>
            <div style={{ marginBottom: 4 }}>SINCE 2023</div>
            <div className="v">2,318 verdicts published</div>
          </div>
          <span className="dot-sep"></span>
          <div>
            <div style={{ marginBottom: 4 }}>SOURCES CITED</div>
            <div className="v">41,402 primary docs</div>
          </div>
          <span className="dot-sep"></span>
          <div>
            <div style={{ marginBottom: 4 }}>CORRECTIONS</div>
            <div className="v">14 logged, all public</div>
          </div>
        </div>
      </div>

      {/* Hero — receipt above the fold */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <Receipt />
        <div style={{
          marginTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)',
          letterSpacing: '0.12em', textTransform: 'uppercase'
        }}>
          <span>↑ Live example · Drag to share</span>
          <span>RCPT&nbsp;·&nbsp;CR-2016-008&nbsp;·&nbsp;v3</span>
        </div>
      </div>
    </section>

    <PressStrip />

    {/* ====== BIG STATS — VIRAL ====== */}
    <section className="section" style={{ background: 'var(--paper-2)' }}>
      <div className="section-eyebrow">The receipts, by the numbers</div>
      <h2>Three years of paper trails,<br/>tabulated in public.</h2>
      <p className="lede">
        Built screenshot-first. Every block below is sized to drop straight into a feed or thread
        — the watermark stays with the data.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
        <StatTile
          num="12,847"
          label="Campaign promises in the database, across federal and state offices."
          meta="Tracked promises"
          corner="↗ +312 this mo"
          fill="kept"
        />
        <StatTile
          num="41,402"
          label="Primary-source documents tying every verdict to a paper trail you can audit."
          meta="Receipts cited"
          corner="Audited"
        />
        <StatTile
          num="48.2"
          suffix="%"
          label="Of completed-term promises were rated 'Kept' or 'Partially Kept' since 2000."
          meta="Long-run Kept rate"
          fill="partial"
        />
        <StatTile
          num="0"
          label="Dollars accepted from PACs, parties, or campaigns. Independently funded, reader-supported."
          meta="Outside money taken"
          corner="Verified"
        />
      </div>

      <div style={{
        marginTop: 20, display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20
      }}>
        {/* Big "verdict mix" stat — the chart */}
        <div className="stat-tile" style={{ padding: 36 }}>
          <div className="meta">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ink-3)' }}></span>
            Verdict mix · Trump 45 · 282 promises tracked
          </div>
          <div style={{
            marginTop: 28, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14,
            alignItems: 'flex-end',
          }}>
            {[
              { k: 'Kept',          n: 89,  pct: '31.6%', color: 'var(--kept)' },
              { k: 'Partially Kept',n: 73,  pct: '25.9%', color: 'var(--partial)' },
              { k: 'Broken',        n: 81,  pct: '28.7%', color: 'var(--broken)' },
              { k: 'Pending',       n: 22,  pct: '7.8%',  color: 'var(--pending)' },
              { k: 'You Decide',    n: 17,  pct: '6.0%',  color: 'var(--decide)' },
            ].map((d, i) => (
              <div key={i} style={{ textAlign: 'left' }}>
                <div style={{
                  height: d.n * 1.7 + 'px',
                  background: d.color, borderRadius: '4px 4px 0 0',
                  marginBottom: 10,
                  minHeight: 30,
                }}></div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)',
                              textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  {d.k}
                </div>
                <div style={{ fontFamily: 'var(--display)', fontSize: 32, letterSpacing: '-0.02em',
                              marginTop: 4 }}>
                  {d.n}
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>
                  {d.pct}
                </div>
              </div>
            ))}
          </div>
          <hr className="receipt-divider" style={{ margin: '28px 0 14px' }}/>
          <div className="between" style={{ fontFamily: 'var(--mono)', fontSize: 11,
                                            color: 'var(--ink-3)', letterSpacing: '0.1em' }}>
            <span>SOURCE · campaignreceipts.com / sealed-2016</span>
            <span>UPDATED · 14 APR 2024</span>
          </div>
        </div>

        {/* Pull-quote / viral tweet */}
        <div className="quote-tile">
          <span className="qmark">"</span>
          <blockquote>
            Receipts has done in a year what most outlets won't do in four — graded a
            presidency promise-by-promise, with the paperwork attached.
          </blockquote>
          <div className="qsrc">
            <span>— Editorial Review</span>
            <span style={{ marginLeft: 'auto' }}>The Columbia Journalism Review</span>
          </div>
        </div>
      </div>
    </section>

    {/* ====== LEADERBOARD ====== */}
    <section className="section">
      <div className="between" style={{ marginBottom: 32 }}>
        <div>
          <div className="section-eyebrow">The rankings</div>
          <h2>Who keeps their word.</h2>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Tag>Final-term only</Tag>
          <Tag>Federal · Executive</Tag>
          <Tag>2000 – 2024</Tag>
          <button className="btn-secondary" style={{ padding: '8px 14px', fontSize: 12 }}>
            Filter ⌄
          </button>
        </div>
      </div>

      <Leaderboard rows={[
        { rank: 1, name: 'A. Lincoln Carter',  office: 'Governor · State A',    party: 'i', kept: 41, partial: 14, broken:  7, pending: 2 },
        { rank: 2, name: 'M. Reeves',          office: 'Senator · State B',     party: 'd', kept: 36, partial: 22, broken: 11, pending: 4 },
        { rank: 3, name: 'D. Holloway',        office: 'Governor · State C',    party: 'r', kept: 33, partial: 19, broken: 14, pending: 3 },
        { rank: 4, name: 'P. Okonkwo',         office: 'Representative · St D', party: 'd', kept: 29, partial: 21, broken: 17, pending: 6 },
        { rank: 5, name: 'V. Aoki-Stein',      office: 'Mayor · City E',        party: 'i', kept: 27, partial: 18, broken: 16, pending: 5 },
        { rank: 6, name: 'R. Mitchell',        office: 'Senator · State F',     party: 'r', kept: 25, partial: 26, broken: 18, pending: 4 },
      ]} />

      <div style={{
        marginTop: 24, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)',
        letterSpacing: '0.1em', textAlign: 'center'
      }}>
        ↓ NAMES SHOWN ARE PLACEHOLDERS · LIVE DATA AVAILABLE IN PRODUCTION ↓
      </div>
    </section>

    {/* ====== METHODOLOGY ====== */}
    <section className="section" style={{ background: 'var(--paper-2)' }}>
      <div className="section-eyebrow">How a verdict is made</div>
      <h2>Five steps. One paper trail.</h2>
      <p className="lede">
        Every verdict has a public worksheet. If you disagree, the corrections inbox is open
        — and every correction is logged in the open.
      </p>

      <div className="method-grid">
        <MethodCard n="1" title="Capture the promise"
          body="We transcribe the literal promise from primary sources — rally video, debate transcript, or platform document. Paraphrases never count."
        />
        <MethodCard n="2" title="Wait for the term"
          body="We don't issue final verdicts mid-term. While in office, a politician's promises live in the 'Live tracking' state, with public progress."
        />
        <MethodCard n="3" title="Gather receipts"
          body="Bills, votes, executive orders, court rulings, budget line-items, agency reports. A promise needs at least three independent sources to move out of pending."
        />
        <MethodCard n="4" title="Two-reviewer verdict"
          body="A primary editor proposes a verdict. A second editor — never from the same party affiliation history — must concur before publication."
        />
        <MethodCard n="5" title="Public corrections"
          body="Every verdict is versioned. If you find a flaw, file a dispute. Accepted corrections update the page and stay in the corrections log forever."
        />
        <MethodCard n="6" title="No outside money"
          body="No PACs, no parties, no campaigns, no candidates. Funded by readers, one-time book purchases, and a research grant. Donor list is public."
        />
      </div>
    </section>

    {/* ====== SEALED 2016 — BOOK CALLOUT ====== */}
    <section className="section">
      <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 80, alignItems: 'center' }}>
        <div>
          <div className="section-eyebrow">Featured release</div>
          <h2 style={{ fontSize: 64 }}>SEALED<br/>— The 2016 Promises.</h2>
          <p className="lede" style={{ marginBottom: 32 }}>
            The companion volume. 282 promises from Donald J. Trump's 2016 campaign, every
            verdict sealed at term's end, every source linked. A reference document, not an op-ed.
          </p>
          <div style={{ display: 'flex', gap: 12, marginBottom: 36 }}>
            <button className="btn-primary">Read the digital edition · $19</button>
            <button className="btn-secondary">Free 30-page preview</button>
          </div>
          <div style={{ display: 'flex', gap: 36, fontFamily: 'var(--mono)', fontSize: 11,
                        color: 'var(--ink-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            <span>282 PROMISES</span>
            <span>· 1,114 SOURCES</span>
            <span>· 396 PAGES</span>
          </div>
        </div>

        {/* Book-as-receipt object */}
        <div style={{ position: 'relative', perspective: 800 }}>
          <div style={{
            background: 'var(--ink)', color: 'var(--paper)',
            padding: '56px 48px', borderRadius: 'var(--r-lg)',
            transform: 'rotate(-1.2deg)',
            boxShadow: '0 30px 60px -28px rgba(26,24,21,0.5), 0 0 0 1px var(--ink-2)',
            position: 'relative',
            aspectRatio: '3 / 4',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em',
                            opacity: 0.6, textTransform: 'uppercase' }}>
                CAMPAIGN · RECEIPTS · PRESS
              </div>
              <div style={{
                marginTop: 18, height: 1, background: 'var(--paper)', opacity: 0.3
              }}></div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 96, lineHeight: 0.95,
                            letterSpacing: '-0.03em', marginTop: 40 }}>
                SEALED
              </div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 28, fontStyle: 'italic',
                            opacity: 0.7, marginTop: 12 }}>
                — The 2016 Promises.
              </div>
            </div>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.16em',
              textTransform: 'uppercase', opacity: 0.7,
              display: 'flex', justifyContent: 'space-between'
            }}>
              <span>Vol. I</span>
              <span>C. Antoniou, ed.</span>
              <span>2024</span>
            </div>
            {/* Wax seal */}
            <div style={{
              position: 'absolute', top: 36, right: 36,
              width: 64, height: 64, borderRadius: '50%',
              background: 'var(--broken)', color: 'var(--paper)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--display)', fontSize: 22, fontStyle: 'italic',
              border: '2px solid var(--paper)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              transform: 'rotate(8deg)',
            }}>
              CR
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* ====== CTA ====== */}
    <section className="section" style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '120px 48px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.2em',
                      textTransform: 'uppercase', opacity: 0.5, marginBottom: 20 }}>
          — For readers, journalists, and researchers —
        </div>
        <h2 style={{ color: 'var(--paper)', fontSize: 84, lineHeight: 0.95,
                     fontFamily: 'var(--display)', letterSpacing: '-0.025em', margin: 0 }}>
          Look it up.<br/>
          <em style={{ opacity: 0.5, fontStyle: 'italic' }}>Bring receipts.</em>
        </h2>
        <p style={{ fontSize: 18, opacity: 0.7, marginTop: 28, lineHeight: 1.5 }}>
          Free to search. Free to cite. Auditable forever.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 36 }}>
          <button className="btn-primary" style={{ background: 'var(--paper)', color: 'var(--ink)', borderColor: 'var(--paper)' }}>
            Search a politician
          </button>
          <button className="btn-secondary" style={{ borderColor: 'rgba(250,246,239,0.3)', color: 'var(--paper)' }}>
            Subscribe to the newsletter
          </button>
        </div>
      </div>
    </section>

    <Footer />
  </div>
);

Object.assign(window, { LandingPage });
