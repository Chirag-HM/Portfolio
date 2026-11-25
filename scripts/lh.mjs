import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { preview } from 'vite'

function runAsync(cmd, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, { stdio: 'inherit', shell: true, env })
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`Command exited with code ${code}`))
    })
    child.on('error', reject)
  })
}

async function runLH(url, formFactor, outName) {
  const outPath = path.resolve('.shots', outName)
  const presetFlag = formFactor === 'desktop' ? '--preset=desktop' : ''
  const cmd = [
    'npx --yes lighthouse',
    `"${url}"`,
    '--output=json',
    `--output-path="${outPath}"`,
    presetFlag,
    '--chrome-flags="--headless=new --no-sandbox --use-gl=angle --use-angle=swiftshader --enable-webgl --enable-unsafe-swiftshader --ignore-gpu-blocklist"',
  ]
    .filter(Boolean)
    .join(' ')

  console.log('Running:', cmd)
  await runAsync(cmd, {
    ...process.env,
    CHROME_PATH: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  })

  const report = JSON.parse(fs.readFileSync(outPath, 'utf8'))
  const cats = report.categories
  const summary = {
    formFactor,
    url,
    performance: Math.round((cats.performance?.score ?? 0) * 100),
    accessibility: Math.round((cats.accessibility?.score ?? 0) * 100),
    bestPractices: Math.round((cats['best-practices']?.score ?? 0) * 100),
    seo: Math.round((cats.seo?.score ?? 0) * 100),
    failingAudits: Object.values(report.audits)
      .filter((a) => a.score !== null && a.score < 0.9)
      .map((a) => ({ id: a.id, score: a.score, title: a.title, displayValue: a.displayValue })),
  }
  console.log('SUMMARY:', JSON.stringify(summary, null, 2))
}

async function main() {
  fs.mkdirSync('.shots', { recursive: true })
  const server = await preview({ preview: { port: 4175, strictPort: true, host: '127.0.0.1' } })
  try {
    await runLH('http://127.0.0.1:4175/', 'mobile', 'lh-after-mobile.json')
    await runLH('http://127.0.0.1:4175/', 'desktop', 'lh-after-desktop.json')
  } finally {
    await new Promise((r) => server.httpServer.close(() => r(undefined)))
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
