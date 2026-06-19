/* Campaign Receipts — Share Tiles (the viral artifacts) */
/* These are sized as social-share artifacts. Influencers crop these to post directly. */

const ShareBrand = ({ inverse = false }) => (
  <div className="brand-stamp" style={inverse ? { color: 'var(--paper)' } : {}}>
    <span className="wm" style={inverse ? { color: 'var(--paper)' } : {}}>
      Campaign<span style={{
        display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
        background: inverse ? 'var(--paper)' : 'var(--ink)',
        margin: '0 4px', transform: 'translateY(-2px)',
      }}></span>Receipts
    </span>
    <span className="url" style={inverse ? {
      color: 'rgba(250,246,239,0.6)', borderColor: 'rgba(250,246,239,0.2)'
    } : {}}>
      campaignreceipts.com
    </span>
  </div>
);

/* 1 — Big stat (1080×1080) */
const TileBigStat = () => (
  <div className="share-tile" style={{
    width: 1080, height: 1080, padding: 72,
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
  }}>
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 16, letterSpacing: '0.16em',
                    textTransform: 'uppercase', color: 'var(--ink-3)' }}>
        — Trump 45 · Final term verdicts
      </div>
      <Stamp kind="broken" lg tilted />
    </div>

    <div>
      <div className="bignum" style={{ fontSize: 360, color: 'var(--broken)' }}>
        81<sup style={{ fontSize: 80 }}>/282</sup>
      </div>
      <div style={{ fontFamily: 'var(--display)', fontSize: 56, lineHeight: 1.1,
                    letterSpacing: '-0.02em', marginTop: 20, maxWidth: 880 }}>
        promises rated <em style={{ color: 'var(--broken)' }}>Broken</em> after his first
        term ended.
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 16, color: 'var(--ink-3)',
                    letterSpacing: '0.1em', marginTop: 24, lineHeight: 1.6 }}>
        Sealed Apr 14, 2024 · 1,114 primary sources cited · Methodology v3
      </div>
    </div>

    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <ShareBrand />
      <div style={{ fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--ink-3)',
                    letterSpacing: '0.14em', textAlign: 'right', textTransform: 'uppercase' }}>
        Tile · 01 / 04<br/>
        <span style={{ color: 'var(--ink)' }}>Receipts, not rhetoric.</span>
      </div>
    </div>
  </div>
);

/* 2 — Receipt-card portrait (1080×1350) */
const TileReceiptCard = () => (
  <div className="share-tile" style={{
    width: 1080, height: 1350, padding: 72,
    display: 'flex', flexDirection: 'column', gap: 36,
    background: 'var(--paper-2)',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span className="wordmark" style={{ fontSize: 28 }}>
        Campaign<span className="dot" style={{ width: 9, height: 9 }}></span>Receipts
      </span>
      <span style={{
        fontFamily: 'var(--mono)', fontSize: 13, letterSpacing: '0.16em',
        textTransform: 'uppercase', color: 'var(--ink-3)',
        border: '1px solid var(--line)', padding: '6px 12px', borderRadius: 4,
      }}>RCPT · CR-2016-008 · v3</span>
    </div>

    <div style={{ flex: 1 }}>
      <Receipt compact />
    </div>

    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14,
      paddingTop: 24, borderTop: '1.5px dashed var(--line)',
    }}>
      {[
        ['Receipts cited', '12'],
        ['Editors',        '2 concurred'],
        ['Last audit',     'APR 2024'],
      ].map(([k, v], i) => (
        <div key={i}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.14em',
                        textTransform: 'uppercase', color: 'var(--ink-3)' }}>
            {k}
          </div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 32, marginTop: 4 }}>{v}</div>
        </div>
      ))}
    </div>

    <div style={{
      fontFamily: 'var(--mono)', fontSize: 14, letterSpacing: '0.14em',
      textTransform: 'uppercase', color: 'var(--ink-3)',
      textAlign: 'center', paddingTop: 18,
    }}>
      campaignreceipts.com / RCPT-2016-008
    </div>
  </div>
);

/* 3 — Leaderboard (1080×1350) */
const TileLeaderboard = () => (
  <div className="share-tile" style={{
    width: 1080, height: 1350, padding: 64,
    display: 'flex', flexDirection: 'column',
  }}>
    <div style={{ marginBottom: 36 }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 14, letterSpacing: '0.18em',
                    textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 14 }}>
        — Promise-Kept Index · Final terms · 2000–2024
      </div>
      <h2 style={{ fontFamily: 'var(--display)', fontSize: 72, lineHeight: 0.95,
                   letterSpacing: '-0.025em', margin: 0 }}>
        Who actually<br/>
        <em>kept their word.</em>
      </h2>
    </div>

    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
      {[
        { rank: 1, name: 'A. Lincoln Carter', party: 'i', score: 78, kept: 41, total: 64 },
        { rank: 2, name: 'M. Reeves',         party: 'd', score: 71, kept: 36, total: 73 },
        { rank: 3, name: 'D. Holloway',       party: 'r', score: 67, kept: 33, total: 69 },
        { rank: 4, name: 'P. Okonkwo',        party: 'd', score: 62, kept: 29, total: 73 },
        { rank: 5, name: 'V. Aoki-Stein',     party: 'i', score: 58, kept: 27, total: 66 },
      ].map((r, i) => (
        <div key={i} style={{
          display: 'grid', gridTemplateColumns: '64px 1fr 110px',
          alignItems: 'center', gap: 24,
          padding: '18px 0', borderBottom: i === 4 ? 0 : '1px dashed var(--line)',
        }}>
          <div style={{
            fontFamily: 'var(--display)', fontSize: 56, letterSpacing: '-0.03em',
            color: i === 0 ? 'var(--kept)' : 'var(--ink)', lineHeight: 1,
          }}>
            {r.rank}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 30, letterSpacing: '-0.01em',
                          marginBottom: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
              {r.name}
              <Tag kind={r.party}>{r.party.toUpperCase()}</Tag>
            </div>
            <div style={{
              height: 8, background: 'var(--paper-3)', borderRadius: 99,
              overflow: 'hidden', marginTop: 8,
            }}>
              <div style={{
                width: r.score + '%', height: '100%',
                background: i === 0 ? 'var(--kept)' : 'var(--ink-2)',
              }}></div>
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-3)',
                          letterSpacing: '0.1em', marginTop: 8, textTransform: 'uppercase' }}>
              {r.kept} of {r.total} promises kept or partially kept
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--display)', fontSize: 56, color: 'var(--ink)',
                          letterSpacing: '-0.03em', lineHeight: 1 }}>
              {r.score}
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)',
                          letterSpacing: '0.1em', marginTop: 4 }}>SCORE</div>
          </div>
        </div>
      ))}
    </div>

    <ShareBrand />
  </div>
);

/* 4 — Quote/tweet tile (1080×1080) */
const TileQuote = () => (
  <div className="share-tile" style={{
    width: 1080, height: 1080, padding: 80,
    background: 'var(--ink)', color: 'var(--paper)',
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
  }}>
    <div style={{ fontFamily: 'var(--mono)', fontSize: 14, letterSpacing: '0.18em',
                  textTransform: 'uppercase', opacity: 0.5 }}>
      — A receipt from the floor of Congress
    </div>

    <div>
      <div style={{ fontFamily: 'var(--display)', fontSize: 200, lineHeight: 0.5,
                    color: 'var(--partial)', opacity: 0.6, marginBottom: -20 }}>
        "
      </div>
      <blockquote style={{
        fontFamily: 'var(--display)', fontSize: 64, lineHeight: 1.15,
        letterSpacing: '-0.015em', margin: 0,
        fontStyle: 'normal', maxWidth: 880,
      }}>
        I will sign a bill to repeal and replace it within the first 100 days.
      </blockquote>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 14, color: 'rgba(250,246,239,0.6)',
                    letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 36,
                    display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <span>— Campaign rally, Phoenix AZ</span>
        <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor' }}></span>
        <span>OCT 31, 2016</span>
        <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor' }}></span>
        <span>Video, 14:32</span>
      </div>
    </div>

    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
      paddingTop: 36, borderTop: '1px solid rgba(250,246,239,0.15)',
    }}>
      <div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '0.18em',
                      textTransform: 'uppercase', opacity: 0.5, marginBottom: 10 }}>
          Verdict, sealed
        </div>
        <Stamp kind="broken" lg tilted />
        <div style={{ fontSize: 15, opacity: 0.7, marginTop: 14, maxWidth: 480, lineHeight: 1.5 }}>
          No replacement bill was signed during the 115th, 116th, or 117th Congress.
        </div>
      </div>
      <ShareBrand inverse />
    </div>
  </div>
);

const ShareTilesPage = () => (
  <div style={{
    display: 'grid', gridTemplateColumns: '1080px 1080px', gap: 56,
    padding: 56, background: 'var(--paper-2)',
    justifyContent: 'center',
  }}>
    <TileBigStat />
    <TileReceiptCard />
    <TileLeaderboard />
    <TileQuote />
  </div>
);

Object.assign(window, {
  TileBigStat, TileReceiptCard, TileLeaderboard, TileQuote, ShareTilesPage
});
