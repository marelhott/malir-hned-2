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
    '<link rel="icon" href="data:,">',
    ...reactScripts,
    `<script defer src="assets/${bundleName}"></script>`,
  ].join('\n  ')
  return html.replace('</head>', `  ${runtime}\n</head>`)
}

async function buildHomePage() {
  const [html, dataJsx, uiJsx, sectionsJsx] = await Promise.all([
    readFile(path.join(rootDir, 'Malir Hned v2.html'), 'utf8'),
    readFile(path.join(rootDir, 'mh-data.jsx'), 'utf8'),
    readFile(path.join(rootDir, 'mh-ui.jsx'), 'utf8'),
    readFile(path.join(rootDir, 'mh-sections.jsx'), 'utf8'),
  ])

  const appMatch = html.match(/<script type="text\/babel">([\s\S]*?)<\/script>\s*<\/body>/)
  if (!appMatch) throw new Error('Nenalezen inline app script v Malir Hned v2.html')

  const combinedSource = [
    dataJsx,
    `{\n${uiJsx}\n}`,
    `{\n${sectionsJsx}\n}`,
    `{\n${appMatch[1].trim()}\n}`,
  ].join('\n\n')

  await compileJs(combinedSource, 'home.js')

  const cleanedHtml = injectBundle(stripBabelScripts(html), 'home.js')
  await writeFile(path.join(distDir, 'index.html'), cleanedHtml, 'utf8')
  await writeFile(path.join(distDir, 'Malir Hned v2.html'), cleanedHtml, 'utf8')
}

async function buildPaintersPage() {
  const html = await readFile(path.join(rootDir, 'Maliri.html'), 'utf8')
  const appMatch = html.match(/<script type="text\/babel">([\s\S]*?)<\/script>\s*<\/body>/)
  if (!appMatch) throw new Error('Nenalezen inline app script v Maliri.html')

  await compileJs(appMatch[1].trim(), 'painters.js')

  const cleanedHtml = injectBundle(stripBabelScripts(html), 'painters.js')
  await writeFile(path.join(distDir, 'Maliri.html'), cleanedHtml, 'utf8')
}

async function copyStaticPages() {
  await cp(path.join(rootDir, 'O nas.html'), path.join(distDir, 'O nas.html'))
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
