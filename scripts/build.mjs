import { mkdir, readFile, writeFile, cp, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { transform } from 'esbuild'

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
  await cp(path.join(rootDir, 'uploads'), path.join(distDir, 'uploads'), { recursive: true })
}

await ensureCleanDist()
await buildHomePage()
await buildPaintersPage()
await copyStaticPages()
