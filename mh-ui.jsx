// mh-ui.jsx — Sdílené UI komponenty pro Malíř Hned Variace A

const { T } = window;

// ── NAV ───────────────────────────────────────────────────────
function SiteNav() {
  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(240,236,230,0.88)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: `1px solid ${T.border}` }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 64px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="#" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img src="uploads/ChatGPT%20Image%201.%206.%202026%2017_27_09%20(1).png" alt="Malíř Hned" style={{ height: 54, width: 'auto', display: 'block' }} />
        </a>
        <nav style={{ display: 'flex', gap: 32 }}>
          {[['#jak-to-funguje', 'Jak to funguje'], ['#terminy', 'Termíny'], ['#cena', 'Cena'], ['Maliri.html', 'Malíři'], ['O nas.html', 'O nás']].map(([href, lbl]) => (
            <a key={href} href={href} style={{ fontSize: 15, fontWeight: 300, color: T.textMid, textDecoration: 'none' }}>{lbl}</a>
          ))}
        </nav>
      </div>
    </div>
  );
}

// ── FOOTER ────────────────────────────────────────────────────
function SiteFooter() {
  return (
    <footer style={{ background: T.surface, borderTop: `1px solid ${T.border}`, padding: '56px 64px 36px', marginTop: 80 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 48 }}>
        <div>
          <div style={{ marginBottom: 16 }}>
            <img src="uploads/ChatGPT%20Image%201.%206.%202026%2017_27_09%20(1).png" alt="Malíř Hned" style={{ height: 44, width: 'auto', display: 'block' }} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 300, color: T.textMid, lineHeight: 1.75, maxWidth: 280, margin: '0 0 20px' }}>Platforma vznikla z reálné malířské praxe. Staví ji lidé, kteří mají za sebou více než deset let zakázek v bytech, kancelářích a menších domech po Praze a okolí.</p>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: T.text, marginBottom: 16 }}>Služby</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <a href="#terminy" style={{ fontSize: 14, fontWeight: 300, color: T.textMid, textDecoration: 'none' }}>Volné termíny</a>
            <a href="#cena" style={{ fontSize: 14, fontWeight: 300, color: T.textMid, textDecoration: 'none' }}>Orientační cena</a>
            <a href="#objednavka" style={{ fontSize: 14, fontWeight: 300, color: T.textMid, textDecoration: 'none' }}>Dokončit objednávku</a>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: T.text, marginBottom: 16 }}>Společnost</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <a href="#jak-to-funguje" style={{ fontSize: 14, fontWeight: 300, color: T.textMid, textDecoration: 'none' }}>Jak to funguje</a>
            <a href="O nas.html" style={{ fontSize: 14, fontWeight: 300, color: T.textMid, textDecoration: 'none' }}>O nás</a>
            <a href="tel:+420777650320" style={{ fontSize: 14, fontWeight: 300, color: T.textMid, textDecoration: 'none' }}>+420 777 650 320</a>
            <a href="mailto:info@malirhned.cz" style={{ fontSize: 14, fontWeight: 300, color: T.textMid, textDecoration: 'none' }}>info@malirhned.cz</a>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: T.text, marginBottom: 16 }}>Kontakt</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {['K Červenému dvoru 18, 160 00 Praha 6', 'IČO: 218 45 731', 'Dostupné termíny', 'Výpočet ceny'].map(item => (
              (item === 'Dostupné termíny' || item === 'Výpočet ceny')
                ? <a key={item} href={item === 'Dostupné termíny' ? '#terminy' : '#cena'} style={{ fontSize: 14, fontWeight: 300, color: T.textMid, textDecoration: 'none' }}>{item}</a>
                : <span key={item} style={{ fontSize: 14, fontWeight: 300, color: T.textMid }}>{item}</span>
            ))}
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 1280, margin: '0 auto', paddingTop: 20, borderTop: `1px solid ${T.border}` }}>
        <span style={{ fontSize: 13, fontWeight: 300, color: T.textLight }}>© 2026 Malíř Hned s.r.o.</span>
      </div>
    </footer>
  );
}

// ── CARD ──────────────────────────────────────────────────────
function Card({ style, children }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.cr, boxShadow: T.cardShadow, ...style }}>
      {children}
    </div>
  );
}

// ── SECTION HEAD ──────────────────────────────────────────────
function SectionHead({ eyebrow, title }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10 }}>{eyebrow}</div>
      <h2 style={{ fontSize: 'clamp(1.75rem, 2.6vw, 2.5rem)', fontWeight: 300, color: T.text, letterSpacing: '-0.05em', lineHeight: 1.05, margin: 0 }}>{title}</h2>
    </div>
  );
}

// ── CALC SECTION HEAD ─────────────────────────────────────────
function CalcHead({ title, sub, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${T.border}` }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: T.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          {children}
        </svg>
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: T.text }}>{title}</div>
        {sub && <div style={{ fontSize: 12, fontWeight: 300, color: T.textMid, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── RADIO CARD ────────────────────────────────────────────────
function RadioCard({ label, lines, active, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{ textAlign: 'left', padding: '14px 16px', borderRadius: T.cr, border: `1.5px solid ${active ? T.accent : T.border}`, background: active ? T.accentSoft : T.surface, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8, transition: 'all 0.15s', outline: 'none', width: '100%', fontFamily: "'Outfit', sans-serif", boxShadow: active ? `0 0 0 3px rgba(42,122,78,0.10)` : 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 13, height: 13, borderRadius: 99, border: `2px solid ${active ? T.accent : T.border}`, background: active ? T.accent : 'transparent', flexShrink: 0, transition: 'all 0.15s' }} />
        <span style={{ fontSize: 13, fontWeight: 500, color: active ? T.accent : T.text }}>{label}</span>
      </div>
      {lines && lines.map(l => (
        <div key={l} style={{ paddingLeft: 21, fontSize: 12, fontWeight: 300, color: T.textMid, lineHeight: 1.45 }}>{l}</div>
      ))}
    </button>
  );
}

// ── SERVICE TOGGLE ────────────────────────────────────────────
function ServiceToggle({ label, yesLabel, noLabel, value, onYes, onNo }) {
  const isYes = value === 'Ano' || value === 'Potřebuji';
  const isNo  = value === 'Ne'  || value === 'Nepotřebuji';
  const btn = (active, positive) => ({
    padding: '8px 14px', borderRadius: 10,
    border: `1px solid ${active ? (positive ? T.accent : T.borderStrong) : T.border}`,
    background: active ? (positive ? T.accent : '#ede9e3') : T.surface,
    color: active ? (positive ? '#fff' : T.text) : T.textMid,
    fontSize: 13, fontWeight: 400, cursor: 'pointer',
    fontFamily: "'Outfit', sans-serif", transition: 'all 0.15s',
    display: 'flex', alignItems: 'center', gap: 6,
  });
  return (
    <div style={{ background: '#f7f4f0', borderRadius: T.cr, border: `1px solid ${T.border}`, padding: '14px 16px' }}>
      <div style={{ fontSize: 13, fontWeight: 400, color: T.text, marginBottom: 10 }}>{label}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={onYes} style={btn(isYes, true)}><span>✓</span>{yesLabel}</button>
        <button type="button" onClick={onNo}  style={btn(isNo,  false)}><span>×</span>{noLabel}</button>
      </div>
    </div>
  );
}

// ── PRICE SIDEBAR ─────────────────────────────────────────────
function PriceSidebar({ priceRange, formData }) {
  return (
    <div style={{ position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ background: T.accent, borderRadius: T.cr, padding: '28px 28px' }}>
        <div style={{ fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.45)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.09em' }}>Orientační cena</div>
        <div style={{ fontSize: 26, fontWeight: 500, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.15, marginBottom: 8 }}>
          {fmtRange(priceRange)}
        </div>
        <div style={{ fontSize: 12, fontWeight: 300, color: 'rgba(255,255,255,0.38)', marginBottom: 20, lineHeight: 1.55 }}>Cena je orientační a potvrdí se po upřesnění detailů.</div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            ['Plocha', formData.areaMode],
            ['Rozsah', formData.customArea ? `${formData.customArea} m²` : 'Zadejte m²'],
            ['Strop',  formData.ceilingHeight],
            ['Opravy', formData.repairs],
            ['Práce',  formData.workType],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 12, fontWeight: 300, color: 'rgba(255,255,255,0.38)' }}>{k}</span>
              <span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.72)' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
      <Card style={{ padding: '18px 20px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: T.accent, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Zahrnuto v ceně</div>
        {['Příprava povrchu', 'Základní nátěr', 'Finální malba', 'Úklid dle nastavení'].map(item => (
          <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
            <div style={{ width: 4, height: 4, borderRadius: 99, background: T.accent, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 300, color: T.textMid }}>{item}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

Object.assign(window, { SiteNav, SiteFooter, Card, SectionHead, CalcHead, RadioCard, ServiceToggle, PriceSidebar });
