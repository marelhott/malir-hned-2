// mh-sections.jsx — Sekce stránky pro Malíř Hned Variace A

const { T, MONTHS, PM, fmtP, fmtRange, dayLbl, getSlots } = window;
const { SectionHead, Card, CalcHead, RadioCard, ServiceToggle, PriceSidebar } = window;

// ── HERO ──────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section style={{ padding: '40px 0 0' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 64px' }}>
      <div style={{
        borderRadius: T.r,
        border: `1px solid ${T.border}`,
        boxShadow: T.panelShadow,
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: '0.58fr 1fr',
        minHeight: 540,
        background: '#ffffff',
      }}>
        {/* Vlevo — text, dot textura */}
        <div style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '64px 28px 64px 72px',
          background: `radial-gradient(circle, rgba(0,0,0,0.022) 1px, transparent 1px) 0 0 / 18px 18px, #ffffff`,
        }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 99, background: 'rgba(255,255,255,0.92)', border: `1px solid ${T.border}`, fontSize: 13, fontWeight: 300, color: T.textMid, marginBottom: 28, alignSelf: 'flex-start', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ width: 6, height: 6, borderRadius: 99, background: T.accent }} />
            Praha a Středočeský kraj
          </div>
          <h1 style={{ margin: 0, fontWeight: 300, letterSpacing: '-0.055em', lineHeight: 1.0, fontSize: 'clamp(38px, 3.8vw, 60px)' }}>
            <span style={{ display: 'block', color: T.text }}>Malíř, když ho</span>
            <span style={{ display: 'block', color: T.textLight }}>potřebujete hned.</span>
          </h1>
          <p style={{ fontSize: 'clamp(14px, 1.1vw, 17px)', lineHeight: 1.65, color: T.textMid, fontWeight: 300, margin: '20px 0 36px', maxWidth: 400 }}>
            Nejdřív vyberete termín, potom uvidíte cenu a dostupného malíře pro objednávku.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <a href="#terminy" style={{ display: 'inline-block', padding: '13px 32px', borderRadius: T.br, background: T.accent, color: '#fff', fontSize: 15, fontWeight: 400, textDecoration: 'none', boxShadow: `0 12px 28px ${T.accentShadow}`, letterSpacing: '-0.01em' }}>
              Vybrat termín
            </a>
            <a href="#cena" style={{ fontSize: 14, fontWeight: 300, color: T.textMid, textDecoration: 'none' }}>Spočítat cenu →</a>
          </div>
          <div style={{ fontSize: 13, color: T.textLight, marginTop: 14, fontWeight: 300 }}>Zabere asi 30 sekund</div>
        </div>

        {/* Vpravo — obrázek malíře */}
        <div style={{ position: 'relative', background: '#ffffff', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden' }}>
          <img
            src="uploads/hero.png"
            alt="Malíř Hned – jak to funguje"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center center', display: 'block' }}
          />
        </div>
      </div>
      </div>
    </section>
  );
}

// ── KROKY ─────────────────────────────────────────────────────
const STEPS = [
  { num: '01', title: 'Nejdřív vyberete termín',       text: 'Kalendář ukáže nejbližší volno.',                   href: '#terminy'    },
  { num: '02', title: 'Potom vidíte cenu',              text: 'Orientační rozsah pro vybraný termín.',             href: '#cena'       },
  { num: '03', title: 'Pak potvrdíte malíře',           text: 'Dostupný ověřený malíř pro daný slot.',             href: '#malir'      },
  { num: '04', title: 'Nakonec potvrdíte objednávku',  text: 'Malíř se ozve napřímo.',                            href: '#objednavka' },
];

function StepsSection() {
  return (
    <section id="jak-to-funguje" style={{ padding: '48px 0 0' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 64px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {STEPS.map(step => (
            <a key={step.num} href={step.href} style={{ textDecoration: 'none', display: 'block', padding: '22px 24px', borderRadius: T.cr, border: `1px solid ${T.border}`, background: T.surface, boxShadow: T.cardShadow, transition: 'all 0.18s' }}>
              <div style={{ fontSize: 28, fontWeight: 200, color: T.textLight, letterSpacing: '-0.04em', marginBottom: 12, lineHeight: 1 }}>{step.num}</div>
              <h3 style={{ fontSize: 15, fontWeight: 500, color: T.text, letterSpacing: '-0.03em', lineHeight: 1.25, margin: '0 0 8px' }}>{step.title}</h3>
              <p style={{ fontSize: 13, fontWeight: 300, color: T.textMid, margin: 0, lineHeight: 1.6 }}>{step.text}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── KALENDÁŘ ─────────────────────────────────────────────────
function CalendarSection({ months, monthIdx, setMonthIdx, selectedDay, setSelectedDay, selectedSlotId, setSelectedSlotId, formData, loading, error }) {
  const WEEKDAYS = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
  const month = months?.[monthIdx];
  const slots = getSlots(months, monthIdx, selectedDay, formData);
  const selDayData = selectedDay && month ? month.cal.find(d => d.d === selectedDay) : null;

  const NavBtn = ({ dir, onClick, disabled }) => (
    <button type="button" onClick={onClick} disabled={disabled} style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${disabled ? 'transparent' : T.border}`, background: disabled ? 'transparent' : T.surface, cursor: disabled ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: disabled ? T.textLight : T.textMid, flexShrink: 0, transition: 'all 0.15s' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {dir === 'prev' ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
      </svg>
    </button>
  );

  return (
    <section id="terminy" style={{ padding: '80px 0' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 64px' }}>
        <SectionHead eyebrow="Termín" title="Vyberte si termín" />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'flex-start' }}>

          {/* Kalendářový panel */}
          <Card style={{ padding: '28px 28px 24px' }}>
            {/* Legenda */}
            <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
              {[['#40b870', 'Volno'], ['#f0be38', 'Omezená kapacita'], ['#d0ccc8', 'Plno']].map(([c, l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 99, background: c }} />
                  <span style={{ fontSize: 12, fontWeight: 300, color: T.textMid }}>{l}</span>
                </div>
              ))}
            </div>

            {/* Navigace měsíců — inline s názvem */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f4f0ea', borderRadius: 12, padding: '6px 10px', border: `1px solid ${T.border}` }}>
              <NavBtn dir="prev" disabled={monthIdx === 0} onClick={() => { setMonthIdx(Math.max(0, monthIdx - 1)); setSelectedDay(null); setSelectedSlotId(''); }} />
              <div style={{ fontSize: 14, fontWeight: 500, color: T.text, letterSpacing: '-0.02em', userSelect: 'none', minWidth: 104, textAlign: 'center' }}>{month?.label || 'Načítám'}</div>
              <NavBtn dir="next" disabled={monthIdx >= (months?.length || 1) - 1} onClick={() => { setMonthIdx(Math.min((months?.length || 1) - 1, monthIdx + 1)); setSelectedDay(null); setSelectedSlotId(''); }} />
            </div>
            </div>

            {/* Dny v týdnu */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
              {WEEKDAYS.map((d, i) => (
                <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 300, color: i >= 5 ? T.textLight : T.textLight, paddingBottom: 4 }}>{d}</div>
              ))}
            </div>

            {/* Mřížka dnů */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {Array.from({ length: month?.leading || 0 }, (_, i) => <div key={`e${i}`} />)}
              {(month?.cal || []).map(day => {
                const free = day.selectable;
                const sel  = selectedDay === day.d;
                const dot = day.service_status === 'volno' ? '#40b870' : day.service_status === 'omezena_kapacita' || day.service_status === 'posledni_misto' ? '#f0be38' : '#d0ccc8';
                return (
                  <button key={day.d} type="button"
                    onClick={() => { if (free) { setSelectedDay(day.d); setSelectedSlotId(''); } }}
                    style={{ aspectRatio: '1', borderRadius: 9, border: `1.5px solid ${sel ? T.accent : free ? T.border : 'transparent'}`, background: sel ? T.accent : free ? T.surface : '#f0ece6', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, cursor: free ? 'pointer' : 'default', fontFamily: "'Outfit', sans-serif", transition: 'all 0.15s', boxShadow: sel ? `0 4px 12px ${T.accentShadow}` : 'none' }}>
                    <span style={{ fontSize: 12, fontWeight: sel ? 600 : free ? 400 : 300, color: sel ? '#fff' : free ? T.text : T.textLight, lineHeight: 1 }}>{day.d}</span>
                    <div style={{ width: 4, height: 4, borderRadius: 99, background: sel ? 'rgba(255,255,255,0.6)' : dot }} />
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Detail vybraného dne */}
          <div>
            {selDayData ? (() => {
              const count = selDayData.available_painters_count || 0;
              const status = count === 0
                ? { label: 'Plno / nedostupné', sub: 'Pro tento den teď neevidujeme vhodnou volnou kapacitu.', dot: '#d0ccc8', bg: '#f7f4f0', border: T.border, btnLabel: null }
                : count === 1
                ? { label: 'Poslední místo', sub: 'V tomto dni zbývá poslední vhodná kapacita. Termín po odeslání ještě ověříme.', dot: '#f0be38', bg: T.warmSoft, border: T.warmBorder, btnLabel: 'Vybrat tento den' }
                : count === 2
                ? { label: 'Omezená kapacita', sub: 'Vhodní malíři jsou k dispozici, ale kapacita už je omezená.', dot: '#f0be38', bg: T.warmSoft, border: T.warmBorder, btnLabel: 'Vybrat tento den' }
                : { label: 'Volno', sub: 'Pro tento den vidíme dobrou dostupnost služby. Finální potvrzení vznikne až po přijetí malířem.', dot: '#40b870', bg: T.accentSoft, border: 'rgba(42,122,78,0.18)', btnLabel: 'Vybrat tento den' };
              return (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10 }}>Vybraný den</div>
                  <h3 style={{ fontSize: 22, fontWeight: 300, color: T.text, letterSpacing: '-0.04em', margin: '0 0 20px' }}>{dayLbl(monthIdx, selectedDay)}</h3>
                  <div style={{ background: status.bg, border: `1px solid ${status.border}`, borderRadius: T.cr, padding: '22px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 99, background: status.dot, flexShrink: 0 }} />
                      <span style={{ fontSize: 18, fontWeight: 500, color: T.text, letterSpacing: '-0.03em' }}>{status.label}</span>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 300, color: T.textMid, margin: 0, lineHeight: 1.6 }}>{status.sub}</p>
                    {status.btnLabel && (
                      <button type="button" onClick={() => { const first = slots[0]; if (first) setSelectedSlotId(first.id); }}
                        style={{ padding: '11px 16px', borderRadius: T.br, background: T.accent, color: '#fff', fontSize: 14, fontWeight: 400, cursor: 'pointer', fontFamily: "'Outfit', sans-serif", border: 'none', boxShadow: `0 8px 20px ${T.accentShadow}`, textAlign: 'center' }}>
                        {selectedSlotId && slots.some(s => s.id === selectedSlotId) ? 'Den vybrán ✓' : status.btnLabel}
                      </button>
                    )}
                  </div>
                </div>
              );
            })() : (
              <Card style={{ padding: '36px', textAlign: 'center' }}>
                <p style={{ fontSize: 14, fontWeight: 300, color: T.textMid, margin: 0 }}>{loading ? 'Načítám dostupnost služby…' : error ? error : 'Klikněte na den v kalendáři pro zobrazení dostupnosti.'}</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── KALKULAČKA ────────────────────────────────────────────────
function CalcSection({ formData, setFormData, priceRange }) {
  const sf = (k, v) => setFormData(prev => ({ ...prev, [k]: v }));
  const inp = { padding: '10px 14px', borderRadius: T.br, border: `1px solid ${T.border}`, background: T.surface, fontSize: 14, fontWeight: 300, color: T.text, fontFamily: "'Outfit', sans-serif", outline: 'none', width: '100%' };
  const sel = { ...inp, appearance: 'none', WebkitAppearance: 'none' };

  return (
    <section id="cena" style={{ padding: '0 0 80px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 64px' }}>
        <SectionHead eyebrow="Cena" title="Spočítejte si přibližnou cenu" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 316px', gap: 28, alignItems: 'start' }}>

          {/* Formulář */}
          <Card style={{ overflow: 'hidden', padding: 0 }}>

            {/* Typ plochy */}
            <div style={{ padding: '24px 28px', borderBottom: `1px solid ${T.border}` }}>
              <CalcHead title="Typ plochy">
                <path d="M4 11.5 12 5l8 6.5" /><path d="M6.5 10.5V19h11v-8.5" /><path d="M10 19v-4.5h4V19" />
              </CalcHead>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: T.textMid, fontWeight: 300, marginBottom: 6 }}>Celková plocha</div>
                  <div style={{ display: 'flex' }}>
                    <input type="number" min="0" placeholder="0" value={formData.customArea} onChange={e => sf('customArea', e.target.value)} style={{ ...inp, borderRadius: `${T.br}px 0 0 ${T.br}px`, borderRight: 'none', flex: 1 }} />
                    <div style={{ padding: '10px 12px', borderRadius: `0 ${T.br}px ${T.br}px 0`, border: `1px solid ${T.border}`, background: '#f7f4f0', fontSize: 14, color: T.textMid }}>m²</div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, color: T.textMid, fontWeight: 300, marginBottom: 6 }}>Výška stropu</div>
                    <select value={formData.ceilingHeight} onChange={e => sf('ceilingHeight', e.target.value)} style={sel}>
                      <option value="250 cm">250 cm — standardní</option>
                      <option value="350 cm">350 cm — vyšší</option>
                      <option value="450 cm">450 cm — velmi vysoký</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[{ value: 'Podlahové m2', label: 'Podlahová plocha', hint: 'rozměr podlahy' }, { value: 'Stěnové m2', label: 'Stěnová plocha', hint: 'stěny a strop' }].map(opt => (
                    <button key={opt.value} type="button" onClick={() => sf('areaMode', opt.value)} style={{ textAlign: 'left', padding: '14px 16px', borderRadius: T.cr, border: `1.5px solid ${formData.areaMode === opt.value ? T.accent : T.border}`, background: formData.areaMode === opt.value ? T.accentSoft : T.surface, cursor: 'pointer', fontFamily: "'Outfit', sans-serif", display: 'flex', gap: 10, alignItems: 'center', transition: 'all 0.15s' }}>
                      <div style={{ width: 13, height: 13, borderRadius: 99, border: `2px solid ${formData.areaMode === opt.value ? T.accent : T.border}`, background: formData.areaMode === opt.value ? T.accent : 'transparent', flexShrink: 0 }} />
                      <div><div style={{ fontSize: 13, fontWeight: 500, color: formData.areaMode === opt.value ? T.accent : T.text }}>{opt.label}</div><div style={{ fontSize: 11, fontWeight: 300, color: T.textMid, marginTop: 2 }}>{opt.hint}</div></div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Typ práce */}
            <div style={{ padding: '24px 28px', borderBottom: `1px solid ${T.border}` }}>
              <CalcHead title="Typ práce">
                <path d="m6 16 4-4m2-6 2 2m-5.5 9.5L5 19l1.5-3.5L15 7l2 2-8.5 8.5Z" />
              </CalcHead>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['Běžná bílá výmalba', 'Po nájemníkovi', 'Opravy stěn', 'Stropy', 'Barevné stěny'].map(opt => (
                  <button key={opt} type="button" onClick={() => sf('workType', opt)} style={{ padding: '8px 14px', borderRadius: 10, border: `1px solid ${formData.workType === opt ? T.accent : T.border}`, background: formData.workType === opt ? T.accentSoft : T.surface, fontSize: 13, fontWeight: formData.workType === opt ? 500 : 300, color: formData.workType === opt ? T.accent : T.textMid, cursor: 'pointer', fontFamily: "'Outfit', sans-serif", transition: 'all 0.15s' }}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Rozsah oprav */}
            <div style={{ padding: '24px 28px', borderBottom: `1px solid ${T.border}` }}>
              <CalcHead title="Rozsah oprav">
                <path d="M12 4 6.5 6v4.8c0 3.4 2.1 6.6 5.5 8.2 3.4-1.6 5.5-4.8 5.5-8.2V6L12 4Z" /><path d="m9.5 11.5 1.8 1.8 3.2-3.3" />
              </CalcHead>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {[{ v: 'Malé', l: ['malé dírky,', 'drobné trhliny'] }, { v: 'Střední', l: ['lokální škrábání,', 'větší trhliny'] }, { v: 'Velké', l: ['rozsáhlejší', 'škrábání a opravy'] }, { v: 'Žádné', l: ['pouze malování,', 'bez oprav'] }].map(o => (
                  <RadioCard key={o.v} label={o.v} lines={o.l} active={formData.repairs === o.v} onClick={() => sf('repairs', o.v)} />
                ))}
              </div>
            </div>

            {/* Služby */}
            <div style={{ padding: '24px 28px', borderBottom: `1px solid ${T.border}` }}>
              <CalcHead title="Služby" sub="ovlivňující cenu">
                <path d="m12 4 8 4.7-8 4.6-8-4.6L12 4Z" /><path d="m4 12.5 8 4.5 8-4.5" /><path d="m4 16.5 8 4.5 8-4.5" />
              </CalcHead>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <ServiceToggle label="Barvu zajistí malíř?" yesLabel="Ano, malíř zajistí" noLabel="Ne, mám vlastní" value={formData.material} onYes={() => sf('material', 'Ano')} onNo={() => sf('material', 'Ne')} />
                <ServiceToggle label="Posunutí nábytku?" yesLabel="Ano, potřebuji" noLabel="Ne, vyřeším sám" value={formData.furnitureMoving} onYes={() => sf('furnitureMoving', 'Ano')} onNo={() => sf('furnitureMoving', 'Ne')} />
                <ServiceToggle label="Zakrývání, oblepování?" yesLabel="Ano, chci" noLabel="Není potřeba" value={formData.covering} onYes={() => sf('covering', 'Ano')} onNo={() => sf('covering', 'Ne')} />
                <ServiceToggle label="Úklid po práci?" yesLabel="Potřebuji" noLabel="Nepotřebuji" value={formData.cleaning} onYes={() => sf('cleaning', 'Potřebuji')} onNo={() => sf('cleaning', 'Nepotřebuji')} />
              </div>
            </div>

            {/* Další údaje */}
            <div style={{ padding: '24px 28px', borderBottom: `1px solid ${T.border}` }}>
              <CalcHead title="Další údaje">
                <path d="M4 6h16M4 11h12M4 16h8" />
              </CalcHead>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                <ServiceToggle label="Prázdný prostor?" yesLabel="Ano, prázdný" noLabel="Ne, zařízený" value={formData.emptySpace} onYes={() => sf('emptySpace', 'Ano')} onNo={() => sf('emptySpace', 'Ne')} />
                <ServiceToggle label="Koberce na podlaze?" yesLabel="Ano, jsou koberce" noLabel="Ne, holá podlaha" value={formData.carpets} onYes={() => sf('carpets', 'Ano')} onNo={() => sf('carpets', 'Ne')} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 12, color: T.textMid, fontWeight: 300 }}>Počet místností</span>
                  <input type="number" min="1" placeholder="Např. 3" value={formData.roomCount} onChange={e => sf('roomCount', e.target.value)} style={inp} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 12, color: T.textMid, fontWeight: 300 }}>Typ prostoru</span>
                  <select value={formData.propertyType} onChange={e => sf('propertyType', e.target.value)} style={sel}>
                    {['Pokoj', 'Byt', '1+kk', '2+kk', '2+1', '3+kk', '3+1', '4+kk', 'Kancelář'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </label>
              </div>
            </div>

            {/* Doplňující informace */}
            <div style={{ padding: '24px 28px' }}>
              <CalcHead title="Doplňující informace">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </CalcHead>
              <textarea placeholder="Zde můžete napsat jakékoli dodatečné informace o práci..." value={formData.notes} onChange={e => sf('notes', e.target.value)} rows={5} style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
            </div>
          </Card>

          {/* Cenový sidebar */}
          <PriceSidebar priceRange={priceRange} formData={formData} />
        </div>
      </div>
    </section>
  );
}

// ── MALÍŘ ─────────────────────────────────────────────────────
function PainterSection({ selectedSlot, monthIdx, onDetailClick }) {
  if (!selectedSlot) return null;
  const painters = Object.values(PM);

  return (
    <section id="malir" style={{ padding: '0 0 80px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 64px' }}>
        <SectionHead eyebrow="Malíř" title="Přiřazení malíře" />
        <Card style={{ padding: '30px 32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 26, alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 13px', borderRadius: 99, background: T.accentSoft, border: `1px solid rgba(42,122,78,0.15)`, fontSize: 12, fontWeight: 400, color: T.accent, marginBottom: 16 }}>
                <div style={{ width: 6, height: 6, borderRadius: 99, background: T.accent }} />
                Dispečink vybírá ručně
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 500, color: T.text, letterSpacing: '-0.045em', lineHeight: 1.2, margin: '0 0 10px' }}>
                Konkrétního malíře potvrdíme až po zpracování zakázky
              </h3>
              <p style={{ fontSize: 15, fontWeight: 300, color: T.textMid, lineHeight: 1.72, margin: 0 }}>
                Pro vybraný den teď vidíme dostupnou kapacitu služby. Dispečink podle termínu, lokality a typu práce vybere nejvhodnějšího malíře a po jeho přijetí vám ho potvrdí.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 10, marginTop: 20 }}>
                {painters.map((p) => (
                  <div key={p.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: '100%', maxWidth: 64, aspectRatio: '1', borderRadius: 14, overflow: 'hidden', border: `1px solid ${T.border}`, boxShadow: T.cardShadow }}>
                      <img src={p.img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 400, color: T.textMid, textAlign: 'center', lineHeight: 1.2 }}>{p.name.split(' ')[0]}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '18px 20px', borderRadius: T.cr, background: '#f7f4f0', border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8 }}>Vybraný den</div>
              <div style={{ fontSize: 20, fontWeight: 500, color: T.text, letterSpacing: '-0.04em', marginBottom: 6 }}>{dayLbl(monthIdx, selectedSlot.day)}</div>
              <div style={{ fontSize: 14, fontWeight: 300, color: T.textMid, marginBottom: 12 }}>{selectedSlot.serviceLabel || 'Dostupnost ověřena'}</div>
              <button type="button" onClick={onDetailClick} style={{ width: '100%', padding: '12px 16px', borderRadius: T.br, border: `1px solid ${T.border}`, background: '#fff', color: T.text, fontSize: 14, fontWeight: 400, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>
                Zobrazit detail přiřazení
              </button>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}

// ── OBJEDNÁVKA ────────────────────────────────────────────────
function OrderSection({ selectedSlot, monthIdx, onOrderClick }) {
  if (!selectedSlot) return null;
  return (
    <section id="objednavka" style={{ padding: '0 0 80px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 64px' }}>
        <SectionHead eyebrow="Objednávka" title="Závazná objednávka" />
        <Card style={{ padding: '28px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginBottom: 24 }}>
            {/* Step + painter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
              <div style={{ width: 46, height: 46, borderRadius: 13, background: T.accentSoft, border: `1px solid rgba(42,122,78,0.18)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: T.accent }}>01</div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 3 }}>Malíř</div>
                <div style={{ fontSize: 18, fontWeight: 500, color: T.text, letterSpacing: '-0.04em' }}>{selectedSlot.painter.name}</div>
              </div>
            </div>
            {/* Oddělovač */}
            <div style={{ width: 1, height: 44, background: T.border, flexShrink: 0 }} />
            {/* Text */}
            <p style={{ fontSize: 14, fontWeight: 300, color: T.textMid, lineHeight: 1.65, margin: 0, flex: 1 }}>
              Doplníte kontakt a zakázka odejde do zpracování dispečinku. Jakmile bude vybraný malíř potvrzený, ozve se vám napřímo.
            </p>
          </div>
          <button type="button" onClick={onOrderClick} style={{ width: '100%', padding: '14px', borderRadius: T.br, background: T.accent, color: '#fff', fontSize: 15, fontWeight: 400, cursor: 'pointer', fontFamily: "'Outfit', sans-serif", boxShadow: `0 10px 24px ${T.accentShadow}`, border: 'none', letterSpacing: '-0.01em' }}>
            Pokračovat k závazné objednávce
          </button>
          
        </Card>
      </div>
    </section>
  );
}

// ── PAINTER MODAL ────────────────────────────────────────────
const PORTFOLIO_IMGS = [
  'https://images.unsplash.com/photo-1625585598750-3535fe40efb3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=700',
  'https://images.unsplash.com/photo-1616046229478-9901c5536a45?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=700',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=700',
];

function PainterModal({ painter, priceRange, day, monthIdx, time, onClose, onConfirm }) {
  if (!painter) return null;
  React.useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, []);
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(12,10,6,0.54)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.surface, borderRadius: T.r, boxShadow: T.panelShadow, maxWidth: 940, width: '100%', maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '20px 32px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 4 }}>Detail dostupného malíře</div>
            <h2 style={{ fontSize: 22, fontWeight: 500, color: T.text, letterSpacing: '-0.04em', margin: '0 0 3px' }}>{painter.name}</h2>
            <p style={{ fontSize: 14, fontWeight: 300, color: T.textMid, margin: 0 }}>{painter.role}</p>
          </div>
          <button type="button" onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${T.border}`, background: '#f7f4f0', fontSize: 18, color: T.textMid, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
        </div>

        {/* Body */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 272px', flex: 1, overflow: 'hidden', minHeight: 0 }}>

          {/* Hlavní obsah */}
          <div style={{ overflow: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              <div style={{ width: 96, height: 96, borderRadius: 18, overflow: 'hidden', flexShrink: 0, border: `1px solid ${T.border}` }}>
                <img src={painter.img} alt={painter.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 500, color: T.text, letterSpacing: '-0.02em', margin: '0 0 8px', lineHeight: 1.4 }}>{painter.summary}</h3>
                <p style={{ fontSize: 14, fontWeight: 300, color: T.textMid, lineHeight: 1.65, margin: 0 }}>{painter.fit}</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[[painter.exp, 'Praxe'], [painter.jobs, 'Zakázky'], [painter.resp, 'Reakce']].map(([val, lbl]) => (
                <Card key={lbl} style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: 10, fontWeight: 300, color: T.textLight, marginBottom: 4 }}>{lbl}</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: T.text }}>{val}</div>
                </Card>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 10 }}>Specializace</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {painter.spec.map(s => (
                  <div key={s} style={{ padding: '5px 12px', borderRadius: 99, background: T.accentSoft, fontSize: 13, fontWeight: 400, color: T.accent }}>{s}</div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 12 }}>Ukázky realizací</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {PORTFOLIO_IMGS.map((src, i) => (
                  <div key={i} style={{ aspectRatio: '4/3', borderRadius: T.cr, overflow: 'hidden', border: `1px solid ${T.border}` }}>
                    <img src={src} alt={`Realizace ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Aside */}
          <div style={{ background: '#f7f4f0', borderLeft: `1px solid ${T.border}`, padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Card style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>Vybraný termín</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: T.text }}>{dayLbl(monthIdx, day)}</div>
              <div style={{ fontSize: 13, fontWeight: 300, color: T.textMid, marginTop: 2 }}>{time}</div>
            </Card>
            <Card style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>Orientační cena</div>
              <div style={{ fontSize: 15, fontWeight: 500, color: T.text, letterSpacing: '-0.02em' }}>{fmtRange(priceRange)}</div>
              <div style={{ fontSize: 12, fontWeight: 300, color: T.textMid, marginTop: 4, lineHeight: 1.5 }}>Finální potvrzení se může upravit.</div>
            </Card>
            <div style={{ flex: 1 }} />
            <button type="button" onClick={onConfirm} style={{ width: '100%', padding: '13px', borderRadius: T.br, background: T.accent, color: '#fff', fontSize: 14, fontWeight: 400, cursor: 'pointer', fontFamily: "'Outfit', sans-serif", border: 'none', boxShadow: `0 10px 24px ${T.accentShadow}` }}>
              Potvrdit tohoto malíře a termín
            </button>
            <button type="button" onClick={onClose} style={{ width: '100%', padding: '11px', borderRadius: T.br, background: 'transparent', color: T.textMid, fontSize: 14, fontWeight: 300, cursor: 'pointer', fontFamily: "'Outfit', sans-serif", border: `1px solid ${T.border}` }}>
              Zpět na přehled
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ORDER FORM MODAL ─────────────────────────────────────────
function OrderFormModal({ selectedSlot, monthIdx, priceRange, onClose, onConfirm }) {
  if (!selectedSlot) return null;
  const [form, setForm] = React.useState({ name: '', phone: '', email: '', address: '', notes: '' });
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const sf = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  React.useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, []);
  const inp = { padding: '10px 14px', borderRadius: T.br, border: `1px solid ${T.border}`, background: T.surface, fontSize: 14, fontWeight: 300, color: T.text, fontFamily: "'Outfit', sans-serif", outline: 'none', width: '100%' };

  async function handleSubmit() {
    const requiredFields = [
      ['name', 'Vyplňte prosím jméno.'],
      ['phone', 'Vyplňte prosím telefon.'],
      ['email', 'Vyplňte prosím e-mail.'],
      ['address', 'Vyplňte prosím přesnou adresu.'],
    ];

    const missing = requiredFields.find(([key]) => !String(form[key] || '').trim());
    if (missing) {
      window.alert(missing[1]);
      return;
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
    if (!emailOk) {
      window.alert('Zadejte prosím platný e-mail.');
      return;
    }

    const digits = form.phone.replace(/\D/g, '');
    if (digits.length < 9) {
      window.alert('Zadejte prosím platné telefonní číslo.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await onConfirm({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        notes: form.notes.trim(),
      });
    } catch (submitError) {
      setError(submitError.message || 'Zakázku se nepodařilo odeslat.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(12,10,6,0.54)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.surface, borderRadius: T.r, boxShadow: T.panelShadow, maxWidth: 820, width: '100%', maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '20px 32px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 4 }}>Krok 4</div>
            <h2 style={{ fontSize: 22, fontWeight: 500, color: T.text, letterSpacing: '-0.04em', margin: 0 }}>Dokončení objednávky</h2>
          </div>
          <button type="button" onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${T.border}`, background: '#f7f4f0', fontSize: 18, color: T.textMid, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        {/* Summary strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderBottom: `1px solid ${T.border}`, background: '#f7f4f0', flexShrink: 0 }}>
          {[
            ['Datum',           monthIdx != null ? dayLbl(monthIdx, selectedSlot.day) : dayLbl(0, selectedSlot.day)],
            ['Čas',             selectedSlot.time],
            ['Orientační cena', fmtRange(priceRange)],
            ['Malíř',           selectedSlot.painter.name],
          ].map(([lbl, val], i, arr) => (
            <div key={lbl} style={{ padding: '24px 20px', textAlign: 'center', borderRight: i < arr.length - 1 ? `1px solid ${T.border}` : 'none' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{lbl}</div>
              <div style={{ fontSize: 20, fontWeight: 500, color: T.text, letterSpacing: '-0.04em', lineHeight: 1.1 }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Form */}
        <div style={{ overflow: 'auto', padding: '28px 32px', flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: T.text, marginBottom: 18 }}>Kontaktní údaje</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
            {[['Jméno', 'text', 'name', 'Vaše jméno'], ['Telefon', 'tel', 'phone', '+420...'], ['E-mail', 'email', 'email', 'vas@email.cz'], ['Přesná adresa', 'text', 'address', 'Ulice, číslo, město']].map(([lbl, type, key, ph]) => (
              <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, color: T.textMid, fontWeight: 300 }}>{lbl}</span>
                <input type={type} placeholder={ph} value={form[key]} onChange={e => sf(key, e.target.value)} style={inp} />
              </label>
            ))}
          </div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
            <span style={{ fontSize: 12, color: T.textMid, fontWeight: 300 }}>Poznámka pro malíře</span>
            <textarea placeholder="Např. byt po nájemníkovi, klíče u správce, preferuji dopoledne..." rows={4} value={form.notes} onChange={e => sf('notes', e.target.value)} style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
          </label>
          {error ? <p style={{ fontSize: 12, fontWeight: 300, color: '#b54d43', textAlign: 'center', marginBottom: 12 }}>{error}</p> : null}
          <button type="button" disabled={submitting} onClick={handleSubmit} style={{ width: '100%', padding: '14px', borderRadius: T.br, background: T.accent, color: '#fff', fontSize: 15, fontWeight: 400, cursor: submitting ? 'default' : 'pointer', fontFamily: "'Outfit', sans-serif", boxShadow: `0 10px 24px ${T.accentShadow}`, border: 'none', opacity: submitting ? 0.75 : 1 }}>
            {submitting ? 'Odesílám zakázku…' : 'Odeslat zakázku ke zpracování'}
          </button>
          <p style={{ fontSize: 12, fontWeight: 300, color: T.textLight, textAlign: 'center', marginTop: 12 }}>
            Po odeslání ověříme dostupnost vhodného malíře a potvrdíme vám přiřazení.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── CONFIRMATION MODAL ────────────────────────────────────────
function ConfirmationModal({ selectedSlot, monthIdx, priceRange, submissionResult, onClose }) {
  React.useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(12,10,6,0.54)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.surface, borderRadius: T.r, boxShadow: T.panelShadow, maxWidth: 520, width: '100%', padding: '48px 40px', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 99, background: T.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 500, color: T.text, letterSpacing: '-0.04em', margin: '0 0 12px' }}>Zakázku jsme přijali ke zpracování</h2>
        <p style={{ fontSize: 15, fontWeight: 300, color: T.textMid, lineHeight: 1.65, margin: '0 0 28px' }}>
          Ověříme dostupnost vhodného malíře pro vámi preferovaný termín. Jakmile bude malíř potvrzený, pošleme vám jeho jméno a bude vás kontaktovat napřímo.
        </p>
        {selectedSlot && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 28 }}>
            {[['Termín', monthIdx != null ? dayLbl(monthIdx, selectedSlot.day) : dayLbl(0, selectedSlot.day)], ['Reference', submissionResult?.reference || '—'], ['Cena', fmtRange(priceRange)]].map(([lbl, val]) => (
              <Card key={lbl} style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 4 }}>{lbl}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: T.text }}>{val}</div>
              </Card>
            ))}
          </div>
        )}
        <button type="button" onClick={onClose} style={{ padding: '12px 32px', borderRadius: T.br, background: T.accent, color: '#fff', fontSize: 14, fontWeight: 400, cursor: 'pointer', fontFamily: "'Outfit', sans-serif", border: 'none', boxShadow: `0 10px 24px ${T.accentShadow}` }}>
          Zavřít
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { HeroSection, StepsSection, CalendarSection, CalcSection, PainterSection, OrderSection, PainterModal, OrderFormModal, ConfirmationModal });
