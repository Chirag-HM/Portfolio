import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const LIVE_URL = 'https://chiragportfolio-mu.vercel.app'
const OUT_DIR = path.resolve('.shots', 'live-audit')

async function launchBrowser() {
  const launchOptions = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-webgl',
      '--enable-unsafe-swiftshader',
      '--ignore-gpu-blocklist',
    ],
  }
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  if (fs.existsSync(chromePath)) {
    return await chromium.launch({ ...launchOptions, executablePath: chromePath })
  }
  return await chromium.launch(launchOptions)
}

async function auditLive() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const browser = await launchBrowser()

  const report = {
    url: LIVE_URL,
    timestamp: new Date().toISOString(),
    firstPaint: {
      totalRequests: 0,
      totalTransferBytes: 0,
      breakdown: [],
    },
    consoleMessages: [],
    failedRequests: [],
    metaTags: {},
    shareImage: {},
    links: [],
    keyboardNav: {},
    scrollBoundaries: {},
    caseStudy: {},
    notFound: {},
  }

  // 1. Desktop 1440px First Paint & Network Audit
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()

  page.on('console', (msg) => {
    report.consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
    })
  })

  page.on('requestfailed', (req) => {
    report.failedRequests.push({
      url: req.url(),
      method: req.method(),
      failure: req.failure()?.errorText,
    })
  })

  const networkEntries = []
  page.on('response', async (res) => {
    let size = 0
    try {
      const headers = res.headers()
      if (headers['content-length']) {
        size = parseInt(headers['content-length'], 10)
      } else {
        const body = await res.body().catch(() => null)
        size = body ? body.length : 0
      }
    } catch {}

    networkEntries.push({
      url: res.url(),
      status: res.status(),
      contentType: res.headers()['content-type'] || '',
      size,
    })
  })

  console.log(`[1] Navigating to ${LIVE_URL}...`)
  const response = await page.goto(LIVE_URL, { waitUntil: 'networkidle', timeout: 30000 })
  console.log(`[1] Loaded with status: ${response?.status()}`)

  // Calculate First Paint Network Stats
  report.firstPaint.totalRequests = networkEntries.length
  report.firstPaint.totalTransferBytes = networkEntries.reduce((acc, e) => acc + (e.size || 0), 0)
  report.firstPaint.breakdown = networkEntries

  // 2. Extract Meta tags & Canonical
  report.metaTags = await page.evaluate(() => {
    const metas = {}
    document.querySelectorAll('meta').forEach((m) => {
      const name = m.getAttribute('name') || m.getAttribute('property')
      if (name) metas[name] = m.getAttribute('content')
    })
    const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href')
    const manifest = document.querySelector('link[rel="manifest"]')?.getAttribute('href')
    const title = document.title
    return { title, canonical, manifest, ...metas }
  })

  // Check OG Share Image response
  if (report.metaTags['og:image']) {
    try {
      const imgRes = await page.request.get(report.metaTags['og:image'])
      report.shareImage = {
        url: report.metaTags['og:image'],
        status: imgRes.status(),
        contentType: imgRes.headers()['content-type'],
        contentLength: imgRes.headers()['content-length'],
      }
    } catch (e) {
      report.shareImage = { error: e.message }
    }
  }

  // 3. Extract and verify all links
  const extractedLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a')).map((a) => ({
      text: a.innerText.trim() || a.getAttribute('aria-label') || '',
      href: a.getAttribute('href'),
      target: a.getAttribute('target'),
      rel: a.getAttribute('rel'),
    }))
  })

  for (const link of extractedLinks) {
    let status = 'untested'
    if (link.href && !link.href.startsWith('#') && !link.href.startsWith('mailto:')) {
      try {
        const fullUrl = link.href.startsWith('http') ? link.href : new URL(link.href, LIVE_URL).href
        const res = await page.request.get(fullUrl, { timeout: 10000 })
        status = res.status()
      } catch (err) {
        status = `err: ${err.message}`
      }
    }
    report.links.push({ ...link, checkStatus: status })
  }

  // Screenshot desktop initial
  await page.screenshot({ path: path.join(OUT_DIR, 'desktop-initial.png') })

  // 4. Scroll boundaries test (Projects, Stack, Contact)
  console.log('[2] Testing scroll boundaries...')
  const scrollTests = [
    { target: '#stack', label: 'stack' },
    { target: '#projects', label: 'projects' },
    { target: '#contact', label: 'contact' },
  ]

  for (const st of scrollTests) {
    const exists = await page.$(st.target)
    if (exists) {
      await exists.scrollIntoViewIfNeeded()
      await page.waitForTimeout(1500)
      const canvasCount = await page.$$eval('canvas', (els) => els.length)
      const targetCanvasCount = await page.$$eval(`${st.target} canvas`, (els) => els.length)
      await page.screenshot({ path: path.join(OUT_DIR, `scroll-${st.label}.png`) })
      report.scrollBoundaries[st.label] = {
        mounted: true,
        totalCanvases: canvasCount,
        chapterCanvases: targetCanvasCount,
      }
    } else {
      report.scrollBoundaries[st.label] = { mounted: false, error: 'selector not found' }
    }
  }

  // 5. Test Keyboard Navigation
  console.log('[3] Testing keyboard navigation...')
  await page.goto(LIVE_URL, { waitUntil: 'domcontentloaded' })
  await page.keyboard.press('Tab')
  const firstFocus = await page.evaluate(() => {
    const el = document.activeElement
    return {
      tagName: el?.tagName,
      text: el?.textContent?.trim(),
      href: el?.getAttribute('href'),
      visible: el ? el.offsetWidth > 0 && el.offsetHeight > 0 : false,
    }
  })
  report.keyboardNav.firstTab = firstFocus

  // Tab through first 8 interactive elements
  const focusedElements = [firstFocus]
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press('Tab')
    const active = await page.evaluate(() => {
      const el = document.activeElement
      return {
        tagName: el?.tagName,
        text: el?.textContent?.trim().slice(0, 30),
        ariaLabel: el?.getAttribute('aria-label'),
      }
    })
    focusedElements.push(active)
  }
  report.keyboardNav.tabSequence = focusedElements

  // 6. Mobile 390px Viewport Audit
  console.log('[4] Testing Mobile 390px viewport...')
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true,
  })
  const mobilePage = await mobileContext.newPage()
  await mobilePage.goto(LIVE_URL, { waitUntil: 'networkidle' })
  await mobilePage.screenshot({ path: path.join(OUT_DIR, 'mobile-initial.png') })

  const mobileCheck = await mobilePage.evaluate(() => {
    return {
      canvases: document.querySelectorAll('canvas').length,
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
      bodyScrollWidth: document.documentElement.scrollWidth,
      windowWidth: window.innerWidth,
    }
  })
  report.mobileAudit = mobileCheck

  // 7. Case Study Route (/projects/ai-smart-vision)
  console.log('[5] Testing Case Study route...')
  const caseStudyRes = await page.goto(`${LIVE_URL}/projects/ai-smart-vision`, {
    waitUntil: 'networkidle',
  })
  await page.screenshot({ path: path.join(OUT_DIR, 'case-study.png') })
  report.caseStudy = {
    status: caseStudyRes?.status(),
    title: await page.title(),
    hasContent: (await page.$('article')) !== null,
  }

  // 8. 404 Route (/non-existent-route)
  console.log('[6] Testing 404 Route...')
  const notFoundRes = await page.goto(`${LIVE_URL}/non-existent-test-route-404`, {
    waitUntil: 'networkidle',
  })
  await page.screenshot({ path: path.join(OUT_DIR, '404-page.png') })
  report.notFound = {
    status: notFoundRes?.status(),
    title: await page.title(),
    hasHeading: await page.evaluate(() => {
      const h1 = document.querySelector('h1')
      return h1 ? h1.innerText : null
    }),
    hasHomeLink: (await page.$('a[href="/"]')) !== null,
  }

  await browser.close()

  const summaryPath = path.join(OUT_DIR, 'live-audit-summary.json')
  fs.writeFileSync(summaryPath, JSON.stringify(report, null, 2))
  console.log(`\nAudit completed successfully. Report written to ${summaryPath}`)
}

auditLive().catch((e) => {
  console.error('Audit failed:', e)
  process.exit(1)
})
