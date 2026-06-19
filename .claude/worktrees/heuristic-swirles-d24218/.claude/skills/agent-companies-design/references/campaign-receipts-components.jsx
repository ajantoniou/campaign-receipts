/* Campaign Receipts — Shared Components */

const Wordmark = ({ size = 22, tag, inverse = false }) => (
  <span className="wordmark" style={{ fontSize: size, color: inverse ? 'var(--paper)' : 'var(--ink)' }}>
    Campaign<span className="dot" style={{ background: inverse ? 'var(--paper)' : 'var(--ink)' }}></span>Receipts
    {tag && <span className="mono-tag">{tag}</span>}
  </span>
);

const Nav = ({ active = 'product' }) => (
  <nav className="nav">
    <Wordmark tag="BETA" />
    <div className="nav-links">
      <a href="#" style={ active === 'browse'   ? { color: 'var(--ink)', borderBottomColor: 'var(--ink)' } : {} }>Browse</a>
      <a href="#" style={ active === 'rankings' ? { color: 'var(--ink)', borderBottomColor: 'var(--ink)' } : {} }>Rankings</a>
      <a href="#" style={ active === 'method'   ? { color: 'var(--ink)', borderBottomColor: 'var(--ink)' } : {} }>Methodology</a>
      <a href="#" style={ active === 'sealed'   ? { color: 'var(--ink)', borderBottomColor: 'var(--ink)' } : {} }>SEALED&nbsp;2016</a>
      <a href="#" style={ active === 'pricing'  ? { color: 'var(--ink)', borderBottomColor: 'var(--ink)' } : {} }>Pricing</a>
      <a href="#" style={ active === 'about'    ? { color: 'var(--ink)', borderBottomColor: 'var(--ink)' } : {} }>About</a>
    </div>
    <a className="nav-cta" href="#">
      Search a politician
      <span style={{ opacity: 0.5 }}>⌘K</span>
    </a>
  </nav>
);

const Stamp = ({ kind = 'kept', children, lg = false, tilted = false }) => {
  const labels = {
    kept: 'Kept', partial: 'Partially Kept', broken: 'Broken',
    pending: 'Pending', decide: 'You Decide'
  };
  return (
    <span className={`stamp ${kind} ${lg ? 'stamp-lg' : ''} ${tilted ? 'stamp-tilted' : ''}`}>
      {children || labels[kind]}
    </span>
  );
};

const Tag = ({ children, kind }) => (
  <span className={`tag ${kind ? 'party-' + kind : ''}`}>{children}</span>
);

/* Receipt Row helper — k/v with dotted leader */
const RRow = ({ k, v, mono = true }) => (
  <div className="receipt-row">
    <span className="k">{k}</span>
    <span className="leader"></span>
    <span className="v" style={ mono ? {} : { fontFamily: 'var(--sans)' }}>{v}</span>
  </div>
);

/* Receipt Card — the core viral artifact */
const Receipt = ({
  id = 'CR-2016-008',
  politician = 'Donald J. Trump',
  office = '45th President of the United States',
  party = 'Republican',
  term = '2017–2021',
  category = 'Immigration',
  title = 'Build a wall along the southern border — and Mexico will pay for it',
  date = 'June 16, 2015',
  source = 'Campaign announcement, Trump Tower (NY)',
  verdict = 'partial',
  verdictDetail = 'Roughly 458 miles constructed or replaced. Mexico did not fund construction.',
  sources = [
    { tag: 'CBP', label: 'Border Wall Status Report', date: 'Jan 22, 2021' },
    { tag: 'GAO', label: 'Southwest Border Barrier Funding', date: 'Jul 2020' },
    { tag: 'Vid', label: 'Trump rally remarks, Phoenix AZ',  date: 'Aug 31, 2016' },
  ],
  compact = false,
}) => (
  <div className="receipt">
    <div className="receipt-head">
      <div>
        <div className="id">RCPT&nbsp;·&nbsp;{id}</div>
        <h3 className="title">"{title}"</h3>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div className="id">{category}</div>
        <div style={{ marginTop: 6 }}>
          <Tag kind={party === 'Republican' ? 'r' : party === 'Democratic' ? 'd' : 'i'}>{party.slice(0,3).toUpperCase()}</Tag>
        </div>
      </div>
    </div>
    <div className="receipt-body">
      <RRow k="Politician" v={politician} mono={false} />
      <RRow k="Office"     v={office} mono={false} />
      <RRow k="Term"       v={term} />
      <RRow k="Promise made" v={date} />
      <RRow k="Where"      v={source} mono={false} />
      {!compact && <>
        <hr className="receipt-divider" />
        <RRow k="Receipts cited" v={`${sources.length} primary sources`} />
        <RRow k="Last audited"   v="Apr 14, 2024" />
        <RRow k="Editor"         v="C. Antoniou + 2 reviewers" mono={false} />
      </>}
    </div>
    <div className="receipt-verdict">
      <Stamp kind={verdict} tilted />
      <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.45, flex: 1, fontFamily: 'var(--sans)' }}>
        {verdictDetail}
      </div>
    </div>
    <div className="receipt-foot">
      <span>★ Receipts, not rhetoric</span>
      <span>campaignreceipts.com / {id}</span>
    </div>
  </div>
);

/* Stat tile */
const StatTile = ({ num, suffix, label, meta, corner, fill }) => (
  <div className={`stat-tile ${fill ? 'fill-' + fill : ''}`}>
    <div className="meta">
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ink-3)' }}></span>
      {meta}
    </div>
    <div className="num">{num}{suffix && <small>{suffix}</small>}</div>
    <div className="lbl">{label}</div>
    {corner && <div className="corner-mark">{corner}</div>}
  </div>
);

/* Leaderboard row */
const BoardRow = ({ rank, name, office, kept, partial, broken, pending = 0, party }) => {
  const total = kept + partial + broken + pending;
  const initials = name.split(' ').map(s => s[0]).slice(0, 2).join('');
  return (
    <div className="board-row">
      <div className="rank">#{String(rank).padStart(2, '0')}</div>
      <div className="name">
        <span className="ava">{initials}</span>
        <div>
          <div>{name}</div>
          <div className="sub">{office} · <Tag kind={party}>{party.toUpperCase()}</Tag></div>
        </div>
      </div>
      <div className="count kept">{kept}</div>
      <div className="count partial">{partial}</div>
      <div className="count broken">{broken}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="bar">
          <div className="seg kept"    style={{ width: `${kept/total*100}%` }}></div>
          <div className="seg partial" style={{ width: `${partial/total*100}%` }}></div>
          <div className="seg broken"  style={{ width: `${broken/total*100}%` }}></div>
          <div className="seg pending" style={{ width: `${pending/total*100}%` }}></div>
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.08em' }}>
          {total} promises
        </div>
      </div>
    </div>
  );
};

const Leaderboard = ({ rows }) => (
  <div className="board">
    <div className="board-head">
      <div>RK</div>
      <div>Politician</div>
      <div>Kept</div>
      <div>Partial</div>
      <div>Broken</div>
      <div>Distribution</div>
    </div>
    {rows.map((r, i) => <BoardRow key={i} {...r} />)}
  </div>
);

/* Methodology card */
const MethodCard = ({ n, title, body }) => (
  <div className="method-card">
    <div className="num-mark">— {String(n).padStart(2, '0')}</div>
    <h3>{title}</h3>
    <p>{body}</p>
  </div>
);

/* Press strip */
const PressStrip = () => (
  <div className="press">
    <div className="label">Cited or referenced by</div>
    <div className="press-logos">
      <span className="serif" style={{ fontStyle: 'italic' }}>The Atlantic</span>
      <span className="small-caps">POLITICO</span>
      <span className="serif">Reuters</span>
      <span className="small-caps">AP&nbsp;FACT&nbsp;CHECK</span>
      <span className="serif" style={{ fontStyle: 'italic' }}>ProPublica</span>
      <span className="small-caps">NPR</span>
      <span className="serif">Bloomberg</span>
    </div>
  </div>
);

/* Footer */
const Footer = () => (
  <footer className="foot">
    <div className="foot-grid">
      <div>
        <Wordmark size={26} inverse />
        <p style={{ fontSize: 14, opacity: 0.7, lineHeight: 1.55, margin: '18px 0 16px', maxWidth: 320 }}>
          A non-partisan promise tracker. Every claim has a receipt, every verdict has a paper trail.
        </p>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.5 }}>
          © 2026 · Audit edition v4.2
        </div>
      </div>
      <div>
        <h4>Product</h4>
        <ul>
          <li><a href="#">Browse politicians</a></li>
          <li><a href="#">Live tracker</a></li>
          <li><a href="#">Rankings</a></li>
          <li><a href="#">Submit a receipt</a></li>
          <li><a href="#">API access</a></li>
        </ul>
      </div>
      <div>
        <h4>Research</h4>
        <ul>
          <li><a href="#">SEALED — 2016</a></li>
          <li><a href="#">Methodology</a></li>
          <li><a href="#">Corrections log</a></li>
          <li><a href="#">Editorial standards</a></li>
        </ul>
      </div>
      <div>
        <h4>Company</h4>
        <ul>
          <li><a href="#">About</a></li>
          <li><a href="#">Funding</a></li>
          <li><a href="#">Press kit</a></li>
          <li><a href="#">Careers</a></li>
        </ul>
      </div>
      <div>
        <h4>Legal</h4>
        <ul>
          <li><a href="#">Privacy</a></li>
          <li><a href="#">Terms</a></li>
          <li><a href="#">Bias policy</a></li>
          <li><a href="#">Contact editor</a></li>
        </ul>
      </div>
    </div>
    <div className="foot-bottom">
      <span>RECEIPTS / NOT / RHETORIC</span>
      <span>Built in NYC · Independently funded · No PAC money</span>
    </div>
  </footer>
);

Object.assign(window, {
  Wordmark, Nav, Stamp, Tag, RRow, Receipt,
  StatTile, BoardRow, Leaderboard, MethodCard,
  PressStrip, Footer
});
