// mh-data.jsx — Tokeny, data a cenová logika pro Malíř Hned Variace A

// ── TÉMA ──────────────────────────────────────────────────────
const T = {
  bg: '#f0ece6',
  surface: '#ffffff',
  border: 'rgba(175,165,148,0.28)',
  borderStrong: 'rgba(175,165,148,0.55)',
  text: '#18170f',
  textMid: '#7a7268',
  textLight: '#b8b0a4',
  accent: '#2a7a4e',
  accentSoft: '#e6f3ec',
  accentShadow: 'rgba(42,122,78,0.28)',
  warm: '#f0be38',
  warmSoft: '#fef8e0',
  warmBorder: 'rgba(220,182,75,0.45)',
  panelShadow: '0 2px 8px rgba(20,14,6,0.04), 0 24px 64px rgba(20,14,6,0.09)',
  cardShadow: '0 1px 4px rgba(20,14,6,0.04), 0 8px 24px rgba(20,14,6,0.07)',
  r: 32,   // panel radius
  cr: 18,  // card radius
  br: 13,  // button radius
};

// ── MALÍŘI ────────────────────────────────────────────────────
const PM = {
  'Petr Havel':    { name: 'Petr Havel',    ini: 'P', exp: '12 let praxe', role: 'Po nájemníkovi a menší byty',   summary: 'Nejčastěji maluju byty před nastěhováním a rychlé přemalby, kde je důležitá jasná domluva a čistá práce bez zbytečných okolků.', price: '9 000–16 000 Kč',  resp: 'Volá do 18 min', jobs: '286 zakázek', spec: ['Po nájemníkovi', '1+kk až 3+1', 'Rychlé termíny'],    fit: 'Ideální pro menší byty a rychlé přemalby.',          img: 'https://images.pexels.com/photos/4981775/pexels-photo-4981775.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop' },
  'Martin Růžička':{ name: 'Martin Růžička', ini: 'M', exp: '14 let praxe', role: 'Novostavby a větší byty',       summary: 'Sedí mi čisté zakázky, které se dají dobře naplánovat dopředu. Mám rád přesný rozsah práce a klidnou organizaci.',                                price: '14 000–25 000 Kč', resp: 'Volá do 25 min', jobs: '198 zakázek', spec: ['Novostavby', '3+kk a větší', 'Stropy'],              fit: 'Silný na větší zakázky, kde se plánuje dopředu.',    img: 'https://images.pexels.com/photos/7788241/pexels-photo-7788241.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop' },
  'Roman Veselý':  { name: 'Roman Veselý',   ini: 'R', exp: '11 let praxe', role: 'Přemalby a opravy',             summary: 'Dělám běžné přemalby i stěny, které potřebují před malbou srovnat a připravit. Hodí se tam, kde je potřeba opravit drobnosti.',                price: '8 000–18 000 Kč',  resp: 'Volá do 22 min', jobs: '244 zakázek', spec: ['Opravy stěn', 'Přemalby', 'Starší byty'],             fit: 'Výborný tam, kde nejsou stěny úplně v top stavu.',  img: 'https://images.pexels.com/photos/8961528/pexels-photo-8961528.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop' },
  'David Svoboda': { name: 'David Svoboda',  ini: 'D', exp: '8 let praxe',  role: 'Rychlé termíny',               summary: 'Když je potřeba rychle malovat menší byt nebo kancelář, umím se přizpůsobit tempu a fungovat i v kratším okně.',                                  price: '7 500–15 000 Kč',  resp: 'Volá do 12 min', jobs: '173 zakázek', spec: ['Menší byty', 'Kanceláře', 'Do 48 hodin'],              fit: 'Nejlepší volba pro urgentní menší zakázky.',         img: 'https://images.pexels.com/photos/3931131/pexels-photo-3931131.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop' },
  'Jakub Černý':   { name: 'Jakub Černý',    ini: 'J', exp: '10 let praxe', role: 'Přesné zakrytí a detail',      summary: 'Víc než rychlost řeším pečlivost. Hodím se tam, kde je důležité šetrné zakrytí a čistý detail kolem nábytku nebo kuchyně.',                      price: '12 000–20 000 Kč', resp: 'Volá do 31 min', jobs: '127 zakázek', spec: ['Detailní práce', 'Zakrytí nábytku', 'Barevné malby'],   fit: 'Dobrý tam, kde hraje roli detail a pečlivost.',     img: 'https://images.pexels.com/photos/10682438/pexels-photo-10682438.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop' },
};


// ── KALENDÁŘ — 3 MĚSÍCE ──────────────────────────────────────
// Duben 2026: 1.4 = středa → leading 2 | Květen: 1.5 = pátek → 4 | Červen: 1.6 = pondělí → 0
const MONTHS = [
  {
    label: 'Duben 2026', year: 2026, month: 4, leading: 2, days: 30,
    cal: [
      { d:  1, jobs: [{ p: 'Petr Havel',     t: '9:00'  }, { p: 'Roman Veselý',   t: '13:30' }] },
      { d:  2, jobs: [{ p: 'David Svoboda',  t: '8:00'  }, { p: 'Martin Růžička', t: '14:00' }] },
      { d:  3, jobs: [{ p: 'Roman Veselý',   t: '11:00' }] },
      { d:  4, jobs: [{ p: 'Martin Růžička', t: '10:00' }, { p: 'Jakub Černý',    t: '15:00' }] },
      { d:  5, jobs: [] }, { d: 6, jobs: [] },
      { d:  7, jobs: [{ p: 'Petr Havel',     t: '8:30'  }, { p: 'David Svoboda',  t: '12:30' }] },
      { d:  8, jobs: [{ p: 'David Svoboda',  t: '9:00'  }, { p: 'Roman Veselý',   t: '13:00' }] },
      { d:  9, jobs: [{ p: 'Roman Veselý',   t: '10:00' }, { p: 'Jakub Černý',    t: '15:00' }] },
      { d: 10, jobs: [{ p: 'Petr Havel',     t: '8:30'  }, { p: 'Martin Růžička', t: '12:00' }, { p: 'David Svoboda', t: '15:30' }] },
      { d: 11, jobs: [{ p: 'Jakub Černý',    t: '9:00'  }, { p: 'Martin Růžička', t: '14:30' }] },
      { d: 12, jobs: [] }, { d: 13, jobs: [{ p: 'Roman Veselý', t: '8:00' }, { p: 'David Svoboda', t: '13:30' }] },
      { d: 14, jobs: [] },
      { d: 15, jobs: [{ p: 'David Svoboda',  t: '9:30'  }, { p: 'Martin Růžička', t: '12:00' }] },
      { d: 16, jobs: [{ p: 'Petr Havel',     t: '10:00' }] },
      { d: 17, jobs: [{ p: 'Martin Růžička', t: '11:00' }, { p: 'Jakub Černý',    t: '14:30' }] },
      { d: 18, jobs: [{ p: 'Petr Havel',     t: '7:00'  }] },
      { d: 19, jobs: [] }, { d: 20, jobs: [{ p: 'David Svoboda', t: '9:00' }] },
      { d: 21, jobs: [{ p: 'Martin Růžička', t: '11:30' }, { p: 'Jakub Černý', t: '15:00' }] },
      { d: 22, jobs: [{ p: 'David Svoboda',  t: '9:00'  }, { p: 'Roman Veselý',   t: '13:30' }] },
      { d: 23, jobs: [{ p: 'Martin Růžička', t: '10:00' }] },
      { d: 24, jobs: [{ p: 'Petr Havel',     t: '8:30'  }, { p: 'Roman Veselý',   t: '15:30' }] },
      { d: 25, jobs: [] }, { d: 26, jobs: [] },
      { d: 27, jobs: [{ p: 'David Svoboda',  t: '9:00'  }] },
      { d: 28, jobs: [{ p: 'Martin Růžička', t: '11:00' }] },
      { d: 29, jobs: [{ p: 'Roman Veselý',   t: '9:30'  }] },
      { d: 30, jobs: [{ p: 'Jakub Černý',    t: '10:30' }] },
    ]
  },
  {
    label: 'Květen 2026', year: 2026, month: 5, leading: 4, days: 31,
    cal: [
      { d:  1, jobs: [] }, { d: 2, jobs: [] }, { d: 3, jobs: [] },
      { d:  4, jobs: [{ p: 'Petr Havel',     t: '9:00'  }, { p: 'Roman Veselý',   t: '14:00' }] },
      { d:  5, jobs: [{ p: 'David Svoboda',  t: '8:30'  }] },
      { d:  6, jobs: [{ p: 'Martin Růžička', t: '10:00' }, { p: 'Jakub Černý',    t: '15:00' }] },
      { d:  7, jobs: [{ p: 'Roman Veselý',   t: '9:00'  }, { p: 'Petr Havel',     t: '13:30' }] },
      { d:  8, jobs: [{ p: 'David Svoboda',  t: '11:00' }, { p: 'Martin Růžička', t: '15:00' }] },
      { d:  9, jobs: [] }, { d: 10, jobs: [] },
      { d: 11, jobs: [{ p: 'Petr Havel',     t: '8:00'  }, { p: 'Jakub Černý',    t: '13:00' }, { p: 'Roman Veselý', t: '16:00' }] },
      { d: 12, jobs: [{ p: 'Roman Veselý',   t: '9:30'  }] },
      { d: 13, jobs: [{ p: 'Martin Růžička', t: '10:00' }, { p: 'David Svoboda',  t: '14:30' }] },
      { d: 14, jobs: [{ p: 'Petr Havel',     t: '8:30'  }] },
      { d: 15, jobs: [{ p: 'Jakub Černý',    t: '9:00'  }, { p: 'Roman Veselý',   t: '13:00' }] },
      { d: 16, jobs: [] }, { d: 17, jobs: [] },
      { d: 18, jobs: [{ p: 'David Svoboda',  t: '8:00'  }, { p: 'Martin Růžička', t: '12:00' }] },
      { d: 19, jobs: [{ p: 'Petr Havel',     t: '10:00' }] },
      { d: 20, jobs: [{ p: 'Roman Veselý',   t: '9:00'  }, { p: 'Jakub Černý',    t: '14:00' }] },
      { d: 21, jobs: [{ p: 'Martin Růžička', t: '11:00' }] },
      { d: 22, jobs: [{ p: 'David Svoboda',  t: '8:30'  }, { p: 'Petr Havel',     t: '13:30' }] },
      { d: 23, jobs: [] }, { d: 24, jobs: [] },
      { d: 25, jobs: [{ p: 'Jakub Černý',    t: '9:00'  }, { p: 'Roman Veselý',   t: '14:00' }] },
      { d: 26, jobs: [{ p: 'Petr Havel',     t: '10:00' }] },
      { d: 27, jobs: [{ p: 'Martin Růžička', t: '9:00'  }, { p: 'David Svoboda',  t: '13:00' }] },
      { d: 28, jobs: [{ p: 'Roman Veselý',   t: '11:00' }] },
      { d: 29, jobs: [{ p: 'Petr Havel',     t: '8:30'  }, { p: 'Jakub Černý',    t: '15:00' }] },
      { d: 30, jobs: [] }, { d: 31, jobs: [] },
    ]
  },
  {
    label: 'Červen 2026', year: 2026, month: 6, leading: 0, days: 30,
    cal: [
      { d:  1, jobs: [{ p: 'Martin Růžička', t: '9:00'  }, { p: 'David Svoboda',  t: '14:00' }] },
      { d:  2, jobs: [{ p: 'Roman Veselý',   t: '10:00' }] },
      { d:  3, jobs: [{ p: 'Petr Havel',     t: '9:30'  }, { p: 'Jakub Černý',    t: '14:30' }] },
      { d:  4, jobs: [{ p: 'David Svoboda',  t: '8:00'  }, { p: 'Martin Růžička', t: '13:00' }] },
      { d:  5, jobs: [{ p: 'Roman Veselý',   t: '11:00' }] },
      { d:  6, jobs: [] }, { d: 7, jobs: [] },
      { d:  8, jobs: [{ p: 'Petr Havel',     t: '9:00'  }, { p: 'Roman Veselý',   t: '13:30' }, { p: 'David Svoboda', t: '16:00' }] },
      { d:  9, jobs: [{ p: 'Martin Růžička', t: '10:00' }] },
      { d: 10, jobs: [{ p: 'Jakub Černý',    t: '9:00'  }, { p: 'Petr Havel',     t: '14:00' }] },
      { d: 11, jobs: [{ p: 'David Svoboda',  t: '8:30'  }] },
      { d: 12, jobs: [{ p: 'Roman Veselý',   t: '10:00' }, { p: 'Martin Růžička', t: '15:00' }] },
      { d: 13, jobs: [] }, { d: 14, jobs: [] },
      { d: 15, jobs: [{ p: 'Petr Havel',     t: '9:00'  }, { p: 'Jakub Černý',    t: '13:00' }] },
      { d: 16, jobs: [{ p: 'David Svoboda',  t: '8:00'  }] },
      { d: 17, jobs: [{ p: 'Martin Růžička', t: '10:00' }, { p: 'Roman Veselý',   t: '14:30' }] },
      { d: 18, jobs: [{ p: 'Petr Havel',     t: '9:30'  }] },
      { d: 19, jobs: [{ p: 'Jakub Černý',    t: '11:00' }, { p: 'David Svoboda',  t: '15:30' }] },
      { d: 20, jobs: [] }, { d: 21, jobs: [] },
      { d: 22, jobs: [{ p: 'Roman Veselý',   t: '9:00'  }, { p: 'Martin Růžička', t: '13:00' }] },
      { d: 23, jobs: [{ p: 'Petr Havel',     t: '10:00' }] },
      { d: 24, jobs: [{ p: 'David Svoboda',  t: '8:30'  }, { p: 'Jakub Černý',    t: '14:00' }] },
      { d: 25, jobs: [{ p: 'Roman Veselý',   t: '9:00'  }] },
      { d: 26, jobs: [{ p: 'Martin Růžička', t: '11:00' }, { p: 'Petr Havel',     t: '15:00' }] },
      { d: 27, jobs: [] }, { d: 28, jobs: [] },
      { d: 29, jobs: [{ p: 'Petr Havel',     t: '9:00'  }, { p: 'Roman Veselý',   t: '13:30' }] },
      { d: 30, jobs: [{ p: 'David Svoboda',  t: '10:00' }] },
    ]
  },
];

const MONTH_NAMES_GEN = ['ledna', 'února', 'března', 'dubna', 'května', 'června', 'července', 'srpna', 'září', 'října', 'listopadu', 'prosince'];

function dayLbl(monthIdx, dayNum) {
  const safeIdx = (monthIdx != null && monthIdx >= 0 && monthIdx < MONTHS.length) ? Number(monthIdx) : 0;
  const m = MONTHS[safeIdx];
  if (!m) return `${dayNum}.`;
  return `${dayNum}. ${MONTH_NAMES_GEN[m.month - 1]} ${m.year}`;
}

function getSlots(monthIdx, dayNum, form) {
  const month = MONTHS[monthIdx];
  const day = month.cal.find(d => d.d === dayNum);
  if (!day || !day.jobs.length) return [];
  const pr = calcPriceRange(form);
  return day.jobs
    .map((j, i) => ({ id: `${monthIdx}-${dayNum}-${i}`, monthIdx, day: dayNum, time: j.t, painter: PM[j.p], priceRange: pr }))
    .filter(s => s.painter);
}


// ── HELPER FUNKCE ─────────────────────────────────────────────
function fmtP(n) { return n.toLocaleString('cs-CZ'); }
function fmtRange(r) {
  if (!r || r.low === 0) return '— Kč';
  if (r.single || r.low === r.high) return `${fmtP(r.low)}\xa0Kč`;
  return `${fmtP(r.low)}\xa0–\xa0${fmtP(r.high)}\xa0Kč`;
}

// ── CENOVÁ LOGIKA ─────────────────────────────────────────────
const FLOOR_AREA_RATE = 10000 / 55;
const WALL_AREA_RATE  = FLOOR_AREA_RATE / 3.5;
const MIN_PRICE       = 3000;

function calcPriceRange(form) {
  const area = Number(form.customArea) || 0;
  if (area <= 0) return { low: 0, high: 0, single: true };

  const isPudorys = form.areaMode === 'Podlahové m2';
  const basePrice = Math.max(
    isPudorys ? area * FLOOR_AREA_RATE : area * WALL_AREA_RATE,
    MIN_PRICE
  );

  let total = basePrice;

  if (isPudorys) {
    const h = form.ceilingHeight.replace(' cm', '');
    if (h === '350') total += basePrice * 0.10;
    else if (h === '450') total += basePrice * 0.20;
  }

  if (form.repairs === 'Malé')         total += basePrice * 0.17;
  else if (form.repairs === 'Střední') total += basePrice * 0.35;
  else if (form.repairs === 'Velké')   total += basePrice * 0.60;

  if (form.material        === 'Ano')       total += basePrice * 0.22;
  if (form.furnitureMoving === 'Ano')       total += basePrice * 0.18;
  if (form.covering        === 'Ano')       total += basePrice * 0.14;
  if (form.cleaning        === 'Potřebuji') total += basePrice * 0.16;

  const final = Math.round(total);
  const low   = Math.floor(final / 1000) * 1000;
  const high  = Math.ceil(final  / 1000) * 1000 + 1000;
  return { low, high, single: false };
}

Object.assign(window, { T, MONTHS, PM, calcPriceRange, fmtP, fmtRange, dayLbl, getSlots });
