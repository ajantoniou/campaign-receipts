/* Campaign Receipts — About / Methodology page */

const AboutPage = () => (
  <div style={{ background: 'var(--paper)' }}>
    <Nav active="about" />

    {/* HERO */}
    <section className="hero" style={{ gridTemplateColumns: '1fr', padding: '96px 48px 64px' }}>
      <div style={{ position: 'relative', zIndex: 2, maxWidth: 920 }}>
        <span className="hero-eyebrow">
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--decide)' }}></span>
          — About the project — Est. 2023, Brooklyn NY
        </span>
        <h1 className="headline" style={{ fontSize: 88, marginTop: 26 }}>
          We're a small newsroom<br/>
          <em>obsessed with the paperwork</em><br/>
          politicians leave behind.
        </h1>
        <p className="hero-sub" style={{ maxWidth: 720, fontSize: 19 }}>
          Three editors, one researcher, two paid fact-checkers, and a network of 40-some volunteer
          document-finders. We don't break news. We don't run hot takes. We grade promises against
          the public record — and we show our work.
        </p>
      </div>
    </section>

    {/* MISSION + 3 PRINCIPLES */}
    <section className="section" style={{ background: 'var(--paper-2)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 80, marginBottom: 56 }}>
        <div>
          <div className="section-eyebrow">The mission</div>
          <h2 style={{ fontSize: 64, lineHeight: 0.98 }}>
            Receipts.<br/>
            <em style={{ color: 'var(--ink-3)' }}>Not rhetoric.</em>
          </h2>
        </div>
        <div>
          <p style={{ fontSize: 22, lineHeight: 1.5, color: 'var(--ink-2)', margin: '0 0 24px',
                      fontFamily: 'var(--display)', letterSpacing: '-0.005em' }}>
            Most political coverage rewards speed and heat. Almost nobody is paid, in the long
            term, to circle back four years later and check whether the thing actually got built.
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.65, color: 'var(--ink-2)', margin: 0 }}>
            We do that boring, slow, paper-pushing work — promise by promise, source by source.
            Then we publish the whole worksheet, not just the headline. If you want a verdict you
            can argue with, we'd rather give you one you can audit.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {[
          { n: 'I', title: 'Show the receipts.',
            body: 'Every verdict links to the primary documents that justify it. If we can\'t show our work, we don\'t publish.' },
          { n: 'II', title: 'Grade at term\'s end.',
            body: 'Mid-term verdicts are tentative. A promise gets a final grade only after the politician has had the full time they asked for.' },
          { n: 'III', title: 'Stay non-partisan, structurally.',
            body: 'Two editors of different party-affiliation histories must concur before a verdict ships. We track our own bias rate publicly.' },
        ].map((p, i) => (
          <div key={i} style={{
            background: 'var(--paper)', border: '1px solid var(--line)',
            borderRadius: 'var(--r-lg)', padding: '36px 32px 32px', position: 'relative',
          }}>
            <div style={{
              fontFamily: 'var(--display)', fontSize: 88, letterSpacing: '-0.04em',
              color: 'var(--ink)', opacity: 0.12, lineHeight: 1,
              position: 'absolute', top: 24, right: 28,
            }}>
              {p.n}
            </div>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.16em',
              textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 24,
            }}>
              Principle {p.n}
            </div>
            <h3 style={{
              fontFamily: 'var(--display)', fontSize: 30, lineHeight: 1.1,
              letterSpacing: '-0.01em', fontWeight: 400, margin: '0 0 14px',
            }}>{p.title}</h3>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ink-2)', margin: 0 }}>
              {p.body}
            </p>
          </div>
        ))}
      </div>
    </section>

    {/* HOW A RECEIPT IS MADE — process */}
    <section className="section">
      <div className="section-eyebrow">From speech to verdict</div>
      <h2>How a receipt is made.</h2>
      <p className="lede">A look inside the worksheet for a single promise.</p>

      <div style={{
        display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 60, alignItems: 'flex-start',
      }}>
        {/* Process timeline */}
        <div>
          {[
            { d: 'Day 0',      step: 'Capture',  who: 'Researcher',
              body: 'Promise transcribed verbatim from primary footage. Paraphrases never count.' },
            { d: 'Day 1–7',    step: 'Triage',   who: 'Editor + tagger',
              body: 'Classified by topic, agency, scope. Routed to the subject-matter editor.' },
            { d: 'Live',       step: 'Track',    who: 'Politician in office',
              body: 'Public progress page. Updated within 72 hours of any qualifying source.' },
            { d: 'Term — 90d', step: 'Receipts', who: 'Volunteer doc-finders',
              body: 'Minimum three independent primary sources required to leave Pending.' },
            { d: 'Term + 30d', step: 'Verdict',  who: 'Editor A',
              body: 'Drafts a verdict + worksheet. Cites every source. Notes contested edges.' },
            { d: 'Term + 60d', step: 'Concur',   who: 'Editor B (different affiliation history)',
              body: 'Independent second pass. Either concurs, escalates, or sends back for more sourcing.' },
            { d: 'Term + 90d', step: 'Publish',  who: 'Public',
              body: 'Receipt goes live. Dispute window opens. Versioned forever.' },
          ].map((s, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '110px 1fr',
              gap: 24, padding: '20px 0',
              borderBottom: i === 6 ? 0 : '1px dashed var(--line)',
              position: 'relative',
            }}>
              <div style={{
                fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)',
                letterSpacing: '0.1em', textTransform: 'uppercase', paddingTop: 4,
              }}>
                <div style={{ color: 'var(--ink)', fontWeight: 600 }}>{s.d}</div>
                <div style={{ marginTop: 4 }}>{s.who}</div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--display)', fontSize: 24, letterSpacing: '-0.01em',
                              marginBottom: 6 }}>
                  {String(i + 1).padStart(2, '0')}. {s.step}
                </div>
                <div style={{ color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.55 }}>
                  {s.body}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sample worksheet — source list */}
        <div className="receipt" style={{ padding: 0 }}>
          <div className="receipt-head">
            <div>
              <div className="id">WORKSHEET · CR-2016-008 · v3</div>
              <h3 className="title" style={{ fontSize: 22 }}>
                Source ledger for the southern border barrier verdict
              </h3>
            </div>
          </div>
          <div className="receipt-body">
            <ul className="source-list">
              {[
                { tag: 'CBP', label: 'Border Wall Status Report — Q4', date: 'JAN 22 \'21' },
                { tag: 'DHS', label: 'Customs and Border Protection budget exhibit',     date: 'OCT 18 \'20' },
                { tag: 'GAO', label: 'Southwest border barrier funding (GAO-20-721)',    date: 'JUL 09 \'20' },
                { tag: 'EO',  label: 'Executive Order 13767 — Border Security',           date: 'JAN 25 \'17' },
                { tag: 'Vid', label: 'Trump rally remarks, Phoenix Convention Ctr.',     date: 'AUG 31 \'16' },
                { tag: 'Doc', label: 'Mexican Foreign Ministry official statement',      date: 'AUG 31 \'16' },
                { tag: 'Web', label: 'Trump campaign position paper, 5-point plan',      date: 'AUG 31 \'16' },
                { tag: 'Vid', label: 'Trump Tower campaign announcement, full footage',  date: 'JUN 16 \'15' },
                { tag: 'Bill', label: 'H.R. 244 — Consolidated Appropriations Act FY17', date: 'MAY 05 \'17' },
                { tag: 'Court', label: 'Sierra Club v. Trump, 9th Cir. opinion',         date: 'JUN 26 \'20' },
              ].map((s, i) => (
                <li key={i}>
                  <span className="src-tag">{s.tag}</span>
                  <span style={{ flex: 1, color: 'var(--ink)' }}>{s.label}</span>
                  <span className="src-date">{s.date}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="receipt-verdict">
            <Stamp kind="partial" tilted />
            <div style={{ fontSize: 13, color: 'var(--ink-2)', flex: 1, fontFamily: 'var(--sans)' }}>
              Concurred by 2 editors · Disputed once (Nov 2023) · Correction not warranted ·
              <a href="#" style={{ color: 'var(--ink)', borderBottom: '1px solid var(--ink)', marginLeft: 6 }}>
                View dispute thread
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* TEAM */}
    <section className="section" style={{ background: 'var(--paper-2)' }}>
      <div className="section-eyebrow">The newsroom</div>
      <h2>Small, on purpose.</h2>
      <p className="lede">Six full-timers. Forty-some volunteer document-finders. One bookkeeper.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {[
          { name: 'C. Antoniou',  role: 'Founding Editor',     bio: 'Previously: investigative desk, mid-size daily. 14 years on the politics beat.', init: 'CA', tag: 'Affil. (D, 2008–14)' },
          { name: 'M. Bauer',     role: 'Senior Editor',       bio: 'Former state-house reporter. Runs the concur-review pipeline.',                  init: 'MB', tag: 'Affil. (R, 2002–11)' },
          { name: 'S. Okereke',   role: 'Methodology Lead',    bio: 'PhD, political science. Wrote the public verdict rubric.',                        init: 'SO', tag: 'Affil. (none)' },
          { name: 'J. Park',      role: 'Lead Fact-Checker',   bio: 'Court records and FOIA wrangler. Built the source-ledger tool.',                 init: 'JP', tag: 'Affil. (D, 2011–17)' },
          { name: 'N. Aguilar',   role: 'Fact-Checker',        bio: 'State and municipal records. Maintains the corrections docket.',                 init: 'NA', tag: 'Affil. (I)' },
          { name: 'R. Voss',      role: 'Research Engineer',   bio: 'Builds the database. Keeps the receipts queryable.',                              init: 'RV', tag: 'Affil. (none)' },
        ].map((p, i) => (
          <div key={i} style={{
            background: 'var(--paper)', border: '1px solid var(--line)',
            borderRadius: 'var(--r-lg)', padding: 28,
            display: 'flex', gap: 18, alignItems: 'flex-start',
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%', background: 'var(--paper-2)',
              border: '1px solid var(--line)', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--display)', fontSize: 22, letterSpacing: '-0.01em',
              color: 'var(--ink-2)',
            }}>
              {p.init}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--display)', fontSize: 22, letterSpacing: '-0.01em' }}>
                {p.name}
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em',
                            textTransform: 'uppercase', color: 'var(--ink-3)', margin: '4px 0 10px' }}>
                {p.role}
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink-2)', marginBottom: 12 }}>
                {p.bio}
              </div>
              <Tag>{p.tag}</Tag>
            </div>
          </div>
        ))}
      </div>
    </section>

    {/* CORRECTIONS LOG — trust */}
    <section className="section">
      <div className="between" style={{ marginBottom: 32 }}>
        <div>
          <div className="section-eyebrow">Corrections log</div>
          <h2>We've been wrong, in public.</h2>
        </div>
        <a href="#" className="btn-secondary">View all 14 corrections →</a>
      </div>

      <div className="board">
        <div className="board-head" style={{ gridTemplateColumns: '110px 1fr 140px 130px 100px' }}>
          <div>DATE</div>
          <div>What changed</div>
          <div>Filed by</div>
          <div>Was</div>
          <div>Now</div>
        </div>
        {[
          { date: 'NOV 14 \'25', what: 'Tax-cut promise from 2020 reclassified after IRS-SOI tables published',  by: 'Reader · A. Klein',  was: 'partial', now: 'kept' },
          { date: 'JUL 02 \'25', what: 'Infrastructure-jobs claim — methodology updated to use BLS series',       by: 'Editor · M. Bauer',  was: 'kept',    now: 'partial' },
          { date: 'MAR 18 \'25', what: 'Healthcare promise scoped to legislation actually signed, not proposed',  by: 'Editor · S. Okereke',was: 'broken',  now: 'partial' },
          { date: 'JAN 09 \'25', what: 'Trade-deficit promise — denominator corrected to nominal GDP',            by: 'Reader · Dr. R. Voss',was:'broken',  now: 'broken' },
          { date: 'OCT 22 \'24', what: 'Federal-judges promise updated with confirmation dates through 2021',     by: 'Reader · J. Park',   was: 'partial', now: 'kept' },
        ].map((c, i) => (
          <div key={i} className="board-row" style={{
            gridTemplateColumns: '110px 1fr 140px 130px 100px', alignItems: 'center', gap: 12,
          }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)',
                          letterSpacing: '0.1em' }}>
              {c.date}
            </div>
            <div style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.45 }}>{c.what}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)',
                          letterSpacing: '0.04em' }}>
              {c.by}
            </div>
            <div><Stamp kind={c.was}/></div>
            <div><Stamp kind={c.now}/></div>
          </div>
        ))}
      </div>
    </section>

    {/* CONTACT / CTA */}
    <section className="section" style={{ background: 'var(--ink)', color: 'var(--paper)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.2em',
                        textTransform: 'uppercase', opacity: 0.5, marginBottom: 16 }}>
            — Open inbox
          </div>
          <h2 style={{ color: 'var(--paper)', fontSize: 64, lineHeight: 1, margin: 0,
                       fontFamily: 'var(--display)', letterSpacing: '-0.02em' }}>
            Found a flaw?<br/>
            <em style={{ opacity: 0.55 }}>Bring receipts.</em>
          </h2>
          <p style={{ fontSize: 17, opacity: 0.75, lineHeight: 1.55, marginTop: 24, maxWidth: 460 }}>
            We ship corrections within 14 days. Every dispute joins a public docket. No editor
            ever sees the politician's name attached to a verdict before they review the sources.
          </p>
        </div>
        <div style={{
          background: 'var(--paper)', color: 'var(--ink)', borderRadius: 'var(--r-lg)',
          padding: 36, fontFamily: 'var(--mono)',
        }}>
          <div style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
                        color: 'var(--ink-3)', marginBottom: 22 }}>
            DISPUTE FORM · CR-DISPUTE-XX
          </div>
          {[
            ['Receipt ID',     'CR-2016-_____'],
            ['Your name',      'Optional — anonymous accepted'],
            ['Sources',        'Drop URLs, PDFs, or court filings...'],
            ['What\'s wrong',  'A paragraph is fine. We read every one.'],
          ].map(([k, v], i) => (
            <div key={i} style={{
              borderBottom: '1px dashed var(--line)', padding: '14px 0',
            }}>
              <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
                            color: 'var(--ink-3)', marginBottom: 6 }}>
                {k}
              </div>
              <div style={{ fontSize: 14, color: 'var(--mute)', fontFamily: 'var(--sans)' }}>
                {v}
              </div>
            </div>
          ))}
          <button className="btn-primary" style={{
            marginTop: 24, width: '100%', justifyContent: 'center',
          }}>
            File a dispute
          </button>
        </div>
      </div>
    </section>

    <Footer />
  </div>
);

Object.assign(window, { AboutPage });
