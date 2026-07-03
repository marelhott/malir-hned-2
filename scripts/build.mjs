import { mkdir, readFile, writeFile, cp, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build, transform } from 'esbuild'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')

const reactScripts = [
  '<script src="https://unpkg.com/react@18.3.1/umd/react.production.min.js" crossorigin="anonymous"></script>',
  '<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js" crossorigin="anonymous"></script>',
]
const siteUrl = 'https://malirhned.cz'
const generatedAt = '2026-06-17'

async function ensureCleanDist() {
  await rm(distDir, { recursive: true, force: true })
  await mkdir(path.join(distDir, 'assets'), { recursive: true })
}

async function compileJs(source, outfileName) {
  const result = await transform(source, {
    loader: 'jsx',
    format: 'iife',
    target: 'es2019',
    charset: 'utf8',
  })

  await writeFile(path.join(distDir, 'assets', outfileName), result.code, 'utf8')
}

async function bundleEntry(entryFile, outfileName) {
  await build({
    entryPoints: [path.join(rootDir, entryFile)],
    outfile: path.join(distDir, 'assets', outfileName),
    bundle: true,
    format: 'iife',
    target: 'es2019',
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
    logLevel: 'silent',
  })
}

function stripBabelScripts(html) {
  return html
    .replace(/<script[^>]*src="https:\/\/unpkg\.com\/react@18\.3\.1\/umd\/react\.development\.js"[^>]*><\/script>\s*/g, '')
    .replace(/<script[^>]*src="https:\/\/unpkg\.com\/react-dom@18\.3\.1\/umd\/react-dom\.development\.js"[^>]*><\/script>\s*/g, '')
    .replace(/<script[^>]*src="https:\/\/unpkg\.com\/@babel\/standalone@[^"]+"[^>]*><\/script>\s*/g, '')
    .replace(/<script type="text\/babel" src="[^"]+"><\/script>\s*/g, '')
    .replace(/<script type="text\/babel">[\s\S]*?<\/script>\s*<\/body>/g, '</body>')
}

function injectBundle(html, bundleName) {
  const runtime = [
    ...reactScripts,
    `<script defer src="assets/${bundleName}"></script>`,
  ].join('\n  ')
  return html.replace('</head>', `  ${runtime}\n</head>`)
}

function upsertTitle(html, title) {
  if (/<title>[\s\S]*?<\/title>/i.test(html)) {
    return html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`)
  }
  return html.replace('</head>', `  <title>${title}</title>\n</head>`)
}

function injectIntoHead(html, snippet) {
  return html.replace('</head>', `  ${snippet}\n</head>`)
}

function injectIntoRoot(html, innerHtml) {
  return html.replace('<div id="root"></div>', `<div id="root">${innerHtml}</div>`)
}

function buildMetaTags({
  title,
  description,
  canonical,
  image = `${siteUrl}/uploads/hero.png`,
  robots = 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',
}) {
  return [
    `<meta name="description" content="${description}" />`,
    `<meta name="robots" content="${robots}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:locale" content="cs_CZ" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Malíř Hned" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${image}" />`,
  ].join('\n  ')
}

function buildJsonLd(data) {
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`
}

function buildSeoShellStyles() {
  return `<style>
    .mh-seo-shell {
      max-width: 1180px;
      margin: 0 auto;
      padding: 32px 24px 56px;
      font-family: 'Outfit', sans-serif;
      color: #18170f;
    }
    .mh-seo-shell a { color: #2a7a4e; }
    .mh-seo-hero {
      background: #ffffff;
      border: 1px solid rgba(175,165,148,0.28);
      border-radius: 28px;
      box-shadow: 0 2px 8px rgba(20,14,6,0.04), 0 24px 64px rgba(20,14,6,0.09);
      padding: 32px;
      margin-bottom: 24px;
    }
    .mh-seo-kicker {
      display: inline-block;
      margin-bottom: 16px;
      color: #2a7a4e;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .mh-seo-shell h1 {
      font-size: clamp(32px, 5vw, 52px);
      line-height: 1.02;
      letter-spacing: -0.05em;
      font-weight: 300;
      margin: 0 0 16px;
    }
    .mh-seo-shell h2 {
      font-size: clamp(24px, 3vw, 34px);
      line-height: 1.08;
      letter-spacing: -0.04em;
      font-weight: 300;
      margin: 0 0 16px;
    }
    .mh-seo-shell h3 {
      font-size: 18px;
      font-weight: 500;
      margin: 0 0 10px;
    }
    .mh-seo-shell p,
    .mh-seo-shell li {
      font-size: 16px;
      line-height: 1.75;
      color: #4f473d;
      font-weight: 300;
    }
    .mh-seo-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
      margin: 24px 0;
    }
    .mh-seo-card {
      background: #ffffff;
      border: 1px solid rgba(175,165,148,0.28);
      border-radius: 18px;
      padding: 20px;
      box-shadow: 0 1px 4px rgba(20,14,6,0.04), 0 8px 24px rgba(20,14,6,0.07);
    }
    .mh-seo-list {
      margin: 0;
      padding-left: 20px;
    }
    .mh-seo-faq {
      display: grid;
      gap: 14px;
      margin-top: 20px;
    }
    .mh-seo-faq article {
      background: #ffffff;
      border: 1px solid rgba(175,165,148,0.28);
      border-radius: 18px;
      padding: 20px;
    }
    @media (max-width: 800px) {
      .mh-seo-grid { grid-template-columns: 1fr; }
      .mh-seo-hero { padding: 24px; }
    }
  </style>`
}

function buildMaintenanceStyles() {
  return `<style>
    .mh-hold-shell {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 32px 20px;
      font-family: 'Outfit', sans-serif;
      background:
        radial-gradient(circle at top left, rgba(255,255,255,0.78), rgba(255,255,255,0) 28%),
        radial-gradient(circle at bottom right, rgba(255,255,255,0.74), rgba(255,255,255,0) 26%),
        linear-gradient(180deg, #efe9df 0%, #ece4d7 100%);
    }
    .mh-hold-card {
      width: min(760px, 100%);
      background: rgba(255,255,255,0.95);
      border: 1px solid rgba(175,165,148,0.28);
      border-radius: 32px;
      box-shadow: 0 2px 8px rgba(20,14,6,0.04), 0 28px 80px rgba(20,14,6,0.1);
      padding: 48px 36px;
      text-align: center;
    }
    .mh-hold-kicker {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 8px 16px;
      border-radius: 999px;
      margin-bottom: 22px;
      background: rgba(255,255,255,0.92);
      border: 1px solid rgba(175,165,148,0.28);
      color: #2a7a4e;
      font-size: 13px;
      font-weight: 500;
      letter-spacing: 0.02em;
    }
    .mh-hold-dot {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: #2a7a4e;
    }
    .mh-hold-card h1 {
      margin: 0 0 16px;
      font-size: clamp(38px, 6vw, 68px);
      line-height: 0.95;
      letter-spacing: -0.06em;
      font-weight: 300;
      color: #18170f;
    }
    .mh-hold-card p {
      margin: 0 auto;
      max-width: 520px;
      font-size: clamp(16px, 2vw, 20px);
      line-height: 1.7;
      color: #5c5449;
      font-weight: 300;
    }
    @media (max-width: 720px) {
      .mh-hold-card {
        padding: 38px 24px;
        border-radius: 26px;
      }
    }
  </style>`
}

function buildMaintenanceShell() {
  return `
    <main class="mh-hold-shell">
      <section class="mh-hold-card" aria-label="Dočasná úvodní stránka">
        <div class="mh-hold-kicker">
          <span class="mh-hold-dot"></span>
          Malíř Hned
        </div>
        <h1>Chystáme pro vás něco nového.</h1>
        <p>Na webu právě pracujeme. Děkujeme za strpení, brzy se vrátíme s novou verzí.</p>
      </section>
    </main>
  `
}

function buildHomeSeoShell() {
  return `
    <main class="mh-seo-shell">
      <section class="mh-seo-hero">
        <span class="mh-seo-kicker">Malování bytů a pokojů</span>
        <h1>Malíř pokojů Praha a Středočeský kraj. Rychlá poptávka, termín online a přidělení malíře dispečinkem.</h1>
        <p>Malíř Hned propojuje klienta, dispečink a malíře do jednoho živého systému. Klient si vybere termín malování, odešle poptávku a dispečink následně přiřadí vhodného malíře podle kapacity a typu zakázky.</p>
        <p>Služba je zaměřená na běžnou bílou výmalbu, přemalby po nájemníkovi, opravy stěn, stropy i menší barevné práce. Obsluhujeme hlavně Prahu a Středočeský kraj.</p>
      </section>
      <section>
        <h2>Jak objednávka malování funguje</h2>
        <div class="mh-seo-grid">
          <article class="mh-seo-card">
            <h3>1. Výběr termínu</h3>
            <p>Klient si na webu vybere den, kdy chce malovat. Konkrétního malíře si nevolí, protože přidělení řeší dispečink podle dostupnosti a vhodnosti.</p>
          </article>
          <article class="mh-seo-card">
            <h3>2. Odeslání poptávky</h3>
            <p>Na konci stránky odešle objednávku nebo poptávku. Zakázka se propíše do administrace dispečera jako čekající požadavek.</p>
          </article>
          <article class="mh-seo-card">
            <h3>3. Potvrzení a přiřazení</h3>
            <p>Dispečer vybere den, přiřadí dostupného malíře a odešle mu nabídku ke schválení. Po potvrzení malířem se termín napevno zapíše oběma stranám do kalendáře.</p>
          </article>
        </div>
      </section>
      <section>
        <h2>Co zákazník typicky řeší</h2>
        <ul class="mh-seo-list">
          <li>malování bytu před nastěhováním nebo po nájemníkovi</li>
          <li>výmalbu pokoje, 1+kk, 2+kk, 3+1 i větších bytů</li>
          <li>opravy prasklin, škrábanců a drobných nerovností před malbou</li>
          <li>zakrytí nábytku, přesuny vybavení a závěrečný úklid</li>
          <li>rychlý termín malování v Praze a okolí</li>
        </ul>
      </section>
      <section>
        <h2>Časté dotazy k malování</h2>
        <div class="mh-seo-faq">
          <article>
            <h3>Vybere si klient konkrétního malíře?</h3>
            <p>Ne. Klient vybírá hlavně termín a rozsah práce. Konkrétního malíře přiděluje dispečink, aby seděl typ zakázky, lokalita i aktuální kapacita.</p>
          </article>
          <article>
            <h3>Je termín po odeslání objednávky hned definitivní?</h3>
            <p>Nejdřív jde o požadavek. Termín se stane potvrzenou zakázkou až po schválení malířem, takže systém stále pracuje s reálnou dostupností.</p>
          </article>
          <article>
            <h3>Pro jaké lokality je služba určená?</h3>
            <p>Primárně pro Prahu a Středočeský kraj, kde dává smysl rychlá koordinace dispečinku i malířských kapacit.</p>
          </article>
        </div>
      </section>
    </main>
  `
}

function buildPaintersSeoShell() {
  return `
    <main class="mh-seo-shell">
      <section class="mh-seo-hero">
        <span class="mh-seo-kicker">Prověření malíři</span>
        <h1>Malíři pro byty, pokoje a přemalby v Praze a Středočeském kraji.</h1>
        <p>Na této stránce jsou veřejné profily malířů zapojených do systému Malíř Hned. Profil slouží hlavně pro představu o specializaci, stylu práce a typických zakázkách.</p>
      </section>
      <section>
        <h2>Jak malíře vybíráme</h2>
        <div class="mh-seo-grid">
          <article class="mh-seo-card">
            <h3>Podle typu zakázky</h3>
            <p>Jiný malíř se hodí na rychlou přemalbu po nájemníkovi a jiný na detailní práci v zařízeném bytě.</p>
          </article>
          <article class="mh-seo-card">
            <h3>Podle kapacity</h3>
            <p>Dispečink pracuje s online kalendářem a vybírá jen malíře, kteří mají v daném dni reálnou dostupnost.</p>
          </article>
          <article class="mh-seo-card">
            <h3>Podle potvrzení</h3>
            <p>Zakázka je definitivní až po potvrzení malířem, takže veřejný slib termínu není odtržený od reality.</p>
          </article>
        </div>
      </section>
    </main>
  `
}

function buildHomeStructuredData() {
  return [
    buildJsonLd({
      '@context': 'https://schema.org',
      '@type': 'HousePainter',
      '@id': `${siteUrl}/#business`,
      name: 'Malíř Hned',
      url: `${siteUrl}/`,
      image: `${siteUrl}/uploads/hero.png`,
      description: 'Malování bytů, pokojů a přemalby po nájemníkovi v Praze a Středočeském kraji. Klient vybírá termín online, malíře přiděluje dispečink podle kapacity.',
      areaServed: ['Praha', 'Středočeský kraj'],
      serviceType: ['Malování bytů', 'Malování pokojů', 'Přemalby po nájemníkovi', 'Opravy stěn'],
      priceRange: '$$',
    }),
    buildJsonLd({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Vybere si klient konkrétního malíře?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Ne. Klient vybírá termín a rozsah práce, zatímco konkrétního malíře přiděluje dispečink podle dostupnosti a vhodnosti zakázky.',
          },
        },
        {
          '@type': 'Question',
          name: 'Je termín po odeslání objednávky hned definitivní?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Ne. Termín je finálně potvrzený až poté, co dispečer odešle nabídku konkrétnímu malíři a ten ji schválí.',
          },
        },
        {
          '@type': 'Question',
          name: 'Kde Malíř Hned funguje?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Služba je zaměřená především na Prahu a Středočeský kraj.',
          },
        },
      ],
    }),
  ].join('\n  ')
}

function buildPublicFiles() {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${generatedAt}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${siteUrl}/malire</loc>
    <lastmod>${generatedAt}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${siteUrl}/o-nas</loc>
    <lastmod>${generatedAt}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>
`

  const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /maliri
Disallow: /maliri/
Disallow: /nabidka
Disallow: /zakazka

Sitemap: ${siteUrl}/sitemap.xml
`

  return { sitemap, robots }
}

async function buildHomePage() {
  const html = await readFile(path.join(rootDir, 'Malir Hned v2.html'), 'utf8')

  let cleanedHtml = stripBabelScripts(html)
  cleanedHtml = upsertTitle(cleanedHtml, 'Chystáme pro vás něco nového | Malíř Hned')
  cleanedHtml = injectIntoHead(cleanedHtml, buildMetaTags({
    title: 'Chystáme pro vás něco nového | Malíř Hned',
    description: 'Web Malíř Hned je dočasně v úpravě. Brzy se vrátíme s novou verzí.',
    canonical: `${siteUrl}/`,
    robots: 'noindex,nofollow,noarchive',
  }))
  cleanedHtml = injectIntoHead(cleanedHtml, buildMaintenanceStyles())
  cleanedHtml = injectIntoRoot(cleanedHtml, buildMaintenanceShell())
  await writeFile(path.join(distDir, 'index.html'), cleanedHtml, 'utf8')
  await writeFile(path.join(distDir, 'Malir Hned v2.html'), cleanedHtml, 'utf8')
}

async function buildPaintersPage() {
  const html = await readFile(path.join(rootDir, 'Maliri.html'), 'utf8')
  const appMatch = html.match(/<script type="text\/babel">([\s\S]*?)<\/script>\s*<\/body>/)
  if (!appMatch) throw new Error('Nenalezen inline app script v Maliri.html')

  await compileJs(appMatch[1].trim(), 'painters.js')

  let cleanedHtml = stripBabelScripts(html)
  cleanedHtml = upsertTitle(cleanedHtml, 'Malíři Praha a Středočeský kraj | Malíř Hned')
  cleanedHtml = injectIntoHead(cleanedHtml, buildMetaTags({
    title: 'Malíři Praha a Středočeský kraj | Malíř Hned',
    description: 'Seznam malířů zapojených do systému Malíř Hned. Specializace, typické zakázky a způsob přiřazování podle reálné kapacity v kalendáři.',
    canonical: `${siteUrl}/malire`,
  }))
  cleanedHtml = injectIntoHead(cleanedHtml, buildSeoShellStyles())
  cleanedHtml = injectIntoRoot(cleanedHtml, buildPaintersSeoShell())
  cleanedHtml = injectBundle(cleanedHtml, 'painters.js')
  await writeFile(path.join(distDir, 'Maliri.html'), cleanedHtml, 'utf8')
}

async function copyStaticPages() {
  const aboutHtml = await readFile(path.join(rootDir, 'O nas.html'), 'utf8')
  let cleanedAboutHtml = upsertTitle(aboutHtml, 'O nás | Malíř Hned')
  cleanedAboutHtml = injectIntoHead(cleanedAboutHtml, buildMetaTags({
    title: 'O nás | Malíř Hned',
    description: 'Jak funguje Malíř Hned, proč přidělujeme malíře dispečinkem a na jaké zakázky se zaměřujeme v Praze a Středočeském kraji.',
    canonical: `${siteUrl}/o-nas`,
  }))
  await writeFile(path.join(distDir, 'O nas.html'), cleanedAboutHtml, 'utf8')
  await cp(path.join(rootDir, 'admin.html'), path.join(distDir, 'admin.html'))
  await cp(path.join(rootDir, 'malir.html'), path.join(distDir, 'malir.html'))
  await cp(path.join(rootDir, 'nabidka.html'), path.join(distDir, 'nabidka.html'))
  await cp(path.join(rootDir, 'zakazka.html'), path.join(distDir, 'zakazka.html'))
  await cp(path.join(rootDir, 'favicon.svg'), path.join(distDir, 'favicon.svg'))
  await cp(path.join(rootDir, 'uploads'), path.join(distDir, 'uploads'), { recursive: true })
  await cp(path.join(rootDir, 'uploads', 'ChatGPT Image 1. 6. 2026 17_27_09 (1).png'), path.join(distDir, 'uploads', 'logo.png'))
  await cp(path.join(rootDir, 'uploads', 'ChatGPT Image 31. 5. 2026 14_45_33.png'), path.join(distDir, 'uploads', 'hero.png'))
  // Copy public/ files (sw.js, manifest, etc.)
  await cp(path.join(rootDir, 'public'), distDir, { recursive: true })

  const { sitemap, robots } = buildPublicFiles()
  await writeFile(path.join(distDir, 'sitemap.xml'), sitemap, 'utf8')
  await writeFile(path.join(distDir, 'robots.txt'), robots, 'utf8')
}

async function buildInternalPages() {
  await Promise.all([
    bundleEntry('src/admin.jsx', 'admin.js'),
    bundleEntry('src/painter-app.jsx', 'painter-app.js'),
    bundleEntry('src/offer.jsx', 'offer.js'),
    bundleEntry('src/job-status.jsx', 'job-status.js'),
  ])
}

await ensureCleanDist()
await buildHomePage()
await buildPaintersPage()
await buildInternalPages()
await copyStaticPages()
