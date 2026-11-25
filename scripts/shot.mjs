import fs from 'node:fs'
import path from 'node:path'
import { preview } from 'vite'
import { chromium } from 'playwright'

const PORT = 4173
const BASE_URL = `http://127.0.0.1:${PORT}`
const OUT_DIR = path.resolve(process.cwd(), '.shots')
const CHECK_CANVAS = process.argv.includes('--canvas')

const LAUNCH_ARGS = [
  '--use-gl=angle',
  '--use-angle=swiftshader',
  '--enable-webgl',
  '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist',
]

async function launchBrowser() {
  try {
    return await chromium.launch({ channel: 'chrome', headless: true, args: LAUNCH_ARGS })
  } catch {
    try {
      return await chromium.launch({ channel: 'msedge', headless: true, args: LAUNCH_ARGS })
    } catch {
      return await chromium.launch({ headless: true, args: LAUNCH_ARGS })
    }
  }
}

async function runWebGLCanvasCheck(page, errors) {
  const probe = await page.evaluate(() => {
    const existingCanvases = Array.from(document.querySelectorAll('canvas')).map((c) => {
      const rect = c.getBoundingClientRect()
      return { width: Math.round(rect.width), height: Math.round(rect.height) }
    })

    // Ephemeral WebGL render test using temporary offscreen canvas (removed immediately)
    const testCanvas = document.createElement('canvas')
    testCanvas.width = 64
    testCanvas.height = 64
    document.body.appendChild(testCanvas)

    const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl')
    let pixelOk = false
    let renderer = ''

    if (gl) {
      gl.clearColor(0.73, 0.8, 0.84, 1.0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      const px = new Uint8Array(4)
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px)
      pixelOk = px[0] > 150 && px[3] === 255
      const ext = gl.getExtension('WEBGL_debug_renderer_info')
      renderer = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)
    }

    testCanvas.remove()
    return {
      hasWebGL: Boolean(gl),
      pixelOk,
      renderer,
      existingCanvasCount: existingCanvases.length,
    }
  })

  console.log('[canvas-check]', probe)
  if (!probe.hasWebGL || !probe.pixelOk) {
    errors.push(`[canvas-check] WebGL rendering failed: ${JSON.stringify(probe)}`)
  }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const server = await preview({
    preview: { port: PORT, strictPort: true, host: '127.0.0.1' },
  })

  let browser
  const errors = []

  try {
    browser = await launchBrowser()
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await context.newPage()

    // Prevent slow/offline external Google Font requests from timing out headless runs
    await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort())

    let currentVp = 'desktop-1440'
    page.on('pageerror', (err) => errors.push(`[${currentVp}] pageerror: ${err.message}`))
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text()
        if (text.includes('ERR_FAILED') || text.includes('ERR_INTERNET_DISCONNECTED')) return
        errors.push(`[${currentVp}] console.error: ${text}`)
      }
    })

    const viewports = [
      { name: 'desktop-1440', width: 1440, height: 900 },
      { name: 'tablet-768', width: 768, height: 1024 },
      { name: 'mobile-390', width: 390, height: 844 },
      { name: 'mobile-375', width: 375, height: 812 },
    ]

    const scrollStops = [
      { name: 'hero', selector: 'main', offset: 0 },
      { name: 'about', selector: '#about', offset: 0 },
      { name: 'services', selector: '#services', offset: 0 },
      { name: 'stack', selector: '#stack', offset: 60 },
      { name: 'projects-1', selector: '#projects', offset: 40 },
      { name: 'contact', selector: '#contact', offset: 0 },
    ]

    for (const vp of viewports) {
      currentVp = vp.name
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await page.waitForTimeout(950)

      if (CHECK_CANVAS && vp.name === 'desktop-1440') {
        await runWebGLCanvasCheck(page, errors)
      }

      for (const stop of scrollStops) {
        await page.evaluate(
          ({ selector, offset }) => {
            const el = document.querySelector(selector)
            if (el) {
              const top = el.getBoundingClientRect().top + window.scrollY + offset
              window.scrollTo({ top, behavior: 'instant' })
            }
          },
          { selector: stop.selector, offset: stop.offset }
        )

        if (
          (stop.name === 'stack' || stop.name === 'projects-1' || stop.name === 'contact') &&
          vp.name === 'desktop-1440' &&
          CHECK_CANVAS
        ) {
          await page.waitForFunction(
            (sel) => {
              const c = document.querySelector(`${sel} canvas`)
              if (!c) return false
              const r = c.getBoundingClientRect()
              return r.width >= 1000 && r.height >= 700
            },
            stop.selector,
            { timeout: 18000 }
          )
        }

        await page.waitForTimeout(
          (stop.name === 'projects-1' || stop.name === 'stack' || stop.name === 'contact') &&
            vp.name === 'desktop-1440'
            ? 1400
            : 850
        )

        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth
        )
        if (overflow) {
          errors.push(`[${vp.name}] horizontal overflow detected on ${stop.name}`)
        }

        const outFile = path.join(OUT_DIR, `${vp.name}-${stop.name}.png`)
        await page.screenshot({ path: outFile })
        console.log(`Captured ${outFile}`)

        // Interactive Phase 4 pedestal captures on desktop-1440
        if (stop.name === 'stack' && vp.name === 'desktop-1440' && CHECK_CANVAS) {
          const stackCanvasCheck = await page.evaluate(() => {
            const allCanvases = document.querySelectorAll('canvas').length
            const stackC = document.querySelector('#stack canvas')
            const projectsCanvases = document.querySelectorAll('#projects canvas').length
            const r = stackC ? stackC.getBoundingClientRect() : null
            return {
              allCanvases,
              projectsCanvases,
              stackCanvas: r ? { width: Math.round(r.width), height: Math.round(r.height) } : null,
            }
          })
          console.log('[stack-canvas]', stackCanvasCheck)
          if (
            stackCanvasCheck.allCanvases !== 1 ||
            stackCanvasCheck.projectsCanvases !== 0 ||
            !stackCanvasCheck.stackCanvas ||
            stackCanvasCheck.stackCanvas.width < 1000
          ) {
            errors.push(`[${vp.name}] Stack single-scene invariant failed: ${JSON.stringify(stackCanvasCheck)}`)
          }

          // Push center particles slightly with mouse, then focus + hover tool chip for note readout
          await page.mouse.move(700, 400, { steps: 6 })
          await page.waitForTimeout(300)
          const toolChip = page.locator('#stack aside button').nth(1)
          if ((await toolChip.count()) > 0) {
            await toolChip.focus()
            await page.waitForTimeout(180)
          }
          const stackHoverOut = path.join(OUT_DIR, `${vp.name}-stack-hover.png`)
          await page.screenshot({ path: stackHoverOut })
          console.log(`Captured ${stackHoverOut}`)

          // Trigger Next group & capture mid-morph dissolve frame (~380ms) and settled 02 Backend frame
          const nextStackBtn = page.locator('#stack button[aria-label="Next stack group"]')
          if ((await nextStackBtn.count()) > 0) {
            await nextStackBtn.click()
            await page.waitForTimeout(380)
            const stackMorphOut = path.join(OUT_DIR, `${vp.name}-stack-morph.png`)
            await page.screenshot({ path: stackMorphOut })
            console.log(`Captured ${stackMorphOut}`)

            await page.waitForTimeout(1400)
            const stack2Out = path.join(OUT_DIR, `${vp.name}-stack-2.png`)
            await page.screenshot({ path: stack2Out })
            console.log(`Captured ${stack2Out}`)
          } else {
            errors.push(`[${vp.name}] Next stack group button missing`)
          }

          // Jump to 03 (AI & APIs) and 04 (IoT) sculptures via bottom carousel buttons
          const aiBtn = page.locator('#stack nav button', { hasText: 'AI & APIs' })
          if ((await aiBtn.count()) > 0) {
            await aiBtn.click()
            await page.waitForTimeout(1750)
            const stack3Out = path.join(OUT_DIR, `${vp.name}-stack-3.png`)
            await page.screenshot({ path: stack3Out })
            console.log(`Captured ${stack3Out}`)
          }

          const iotBtn = page.locator('#stack nav button', { hasText: 'IoT' })
          if ((await iotBtn.count()) > 0) {
            await iotBtn.click()
            await page.waitForTimeout(1750)
            const stack4Out = path.join(OUT_DIR, `${vp.name}-stack-4.png`)
            await page.screenshot({ path: stack4Out })
            console.log(`Captured ${stack4Out}`)
          }
        }

        // Interactive Phase 3 crystal gallery captures on desktop-1440
        if (stop.name === 'projects-1' && vp.name === 'desktop-1440' && CHECK_CANVAS) {
          const canvasInfo = await page.evaluate(() => {
            const allCanvases = document.querySelectorAll('canvas').length
            const stackCanvases = document.querySelectorAll('#stack canvas').length
            const c = document.querySelector('#projects canvas')
            if (!c) return { allCanvases, stackCanvases, width: 0, height: 0 }
            const r = c.getBoundingClientRect()
            return {
              allCanvases,
              stackCanvases,
              width: Math.round(r.width),
              height: Math.round(r.height),
            }
          })
          console.log('[projects-canvas]', canvasInfo)
          if (
            canvasInfo.allCanvases !== 1 ||
            canvasInfo.stackCanvases !== 0 ||
            canvasInfo.width < 1000 ||
            canvasInfo.height < 700
          ) {
            errors.push(`[${vp.name}] #projects single-scene invariant failed: ${JSON.stringify(canvasInfo)}`)
          }

          // 1) Hover crystal center -> trigger tilt + SVG leader lines + scrambled HUD
          await page.mouse.move(720, 440, { steps: 8 })
          await page.waitForTimeout(700)
          const hoverOut = path.join(OUT_DIR, `${vp.name}-projects-hover.png`)
          await page.screenshot({ path: hoverOut })
          console.log(`Captured ${hoverOut}`)

          // 2) Navigate to crystal 02 via next arrow
          const nextBtn = page.locator('#projects button[aria-label="Next project crystal"]')
          if ((await nextBtn.count()) > 0) {
            await nextBtn.click()
            await page.waitForTimeout(1350)
            const secondOut = path.join(OUT_DIR, `${vp.name}-projects-2.png`)
            await page.screenshot({ path: secondOut })
            console.log(`Captured ${secondOut}`)
          } else {
            errors.push(`[${vp.name}] Next project crystal button missing`)
          }

          // 3) Click active crystal center (or bottom label) -> dolly zoom + dark monospace panel
          await page.mouse.click(720, 430)
          await page.waitForTimeout(950)
          const hasDialog = (await page.locator('#projects [role="dialog"]').count()) > 0
          if (!hasDialog) {
            // Fall back to bottom bracketed button if raycast missed under SwiftShader
            const titleBtn = page.locator('#projects button').filter({ hasText: /Campus|AI Smart/i }).first()
            if ((await titleBtn.count()) > 0) {
              await titleBtn.click()
              await page.waitForTimeout(900)
            }
          }
          const panelOut = path.join(OUT_DIR, `${vp.name}-projects-panel.png`)
          await page.screenshot({ path: panelOut })
          console.log(`Captured ${panelOut}`)

          if ((await page.locator('#projects [role="dialog"]').count()) === 0) {
            errors.push(`[${vp.name}] Project detail panel did not open on click`)
          } else {
            await page.keyboard.press('Escape')
            await page.waitForTimeout(500)
          }
        }

        // Interactive Phase 5 moonlit mountain landscape finale captures on desktop-1440
        if (stop.name === 'contact' && vp.name === 'desktop-1440' && CHECK_CANVAS) {
          const contactCanvasCheck = await page.evaluate(() => {
            const allCanvases = document.querySelectorAll('canvas').length
            const stackCanvases = document.querySelectorAll('#stack canvas').length
            const projectsCanvases = document.querySelectorAll('#projects canvas').length
            const c = document.querySelector('#contact canvas')
            const r = c ? c.getBoundingClientRect() : null
            return {
              allCanvases,
              stackCanvases,
              projectsCanvases,
              contactCanvas: r ? { width: Math.round(r.width), height: Math.round(r.height) } : null,
            }
          })
          console.log('[contact-canvas]', contactCanvasCheck)
          if (
            contactCanvasCheck.allCanvases !== 1 ||
            contactCanvasCheck.stackCanvases !== 0 ||
            contactCanvasCheck.projectsCanvases !== 0 ||
            !contactCanvasCheck.contactCanvas ||
            contactCanvasCheck.contactCanvas.width < 1000
          ) {
            errors.push(`[${vp.name}] #contact single-scene invariant failed: ${JSON.stringify(contactCanvasCheck)}`)
          }

          // Mid-path glide shot (~45% scroll through pinned runway)
          await page.evaluate(() => {
            const el = document.querySelector('#contact')
            if (el) {
              const travel = Math.max(1, el.getBoundingClientRect().height - window.innerHeight)
              const top = el.getBoundingClientRect().top + window.scrollY + travel * 0.45
              window.scrollTo({ top, behavior: 'instant' })
            }
          })
          await page.waitForTimeout(950)
          const midOut = path.join(OUT_DIR, `${vp.name}-contact-mid.png`)
          await page.screenshot({ path: midOut })
          console.log(`Captured ${midOut}`)

          // End close-up shot beside hut + overlay fade-in (100% scroll)
          await page.evaluate(() => {
            const el = document.querySelector('#contact')
            if (el) {
              const travel = Math.max(1, el.getBoundingClientRect().height - window.innerHeight)
              const top = el.getBoundingClientRect().top + window.scrollY + travel
              window.scrollTo({ top, behavior: 'instant' })
            }
          })
          await page.waitForTimeout(1200)
          const closeOut = path.join(OUT_DIR, `${vp.name}-contact-close.png`)
          await page.screenshot({ path: closeOut })
          console.log(`Captured ${closeOut}`)

          // Hover and click "Send a signal" -> stronger expanding beacon ring + toast confirmation
          const signalBtn = page.locator('#contact button', { hasText: 'Send a signal' })
          if ((await signalBtn.count()) > 0) {
            await signalBtn.hover()
            await page.waitForTimeout(250)
            await signalBtn.click()
            await page.waitForTimeout(550)
            const hasToast = (await page.locator('#contact [role="status"]').count()) > 0
            if (!hasToast) {
              errors.push(`[${vp.name}] Send a signal click did not show status toast`)
            }
            const signalOut = path.join(OUT_DIR, `${vp.name}-contact-signal.png`)
            await page.screenshot({ path: signalOut })
            console.log(`Captured ${signalOut}`)
          } else {
            errors.push(`[${vp.name}] Send a signal button missing`)
          }
        }
      }

      // Verify Classic fallback mode on desktop-1440 for #stack, #projects, and #contact
      if (vp.name === 'desktop-1440' && CHECK_CANVAS) {
        const toggleBtn = page.locator('button[aria-pressed]').first()
        await toggleBtn.scrollIntoViewIfNeeded()
        await toggleBtn.click()
        await page.waitForTimeout(300)

        await page.evaluate(() => {
          const el = document.querySelector('#stack')
          if (el) {
            window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + 40, behavior: 'instant' })
          }
        })
        await page.waitForTimeout(700)
        const stackCanvasAfterClassic = await page.locator('#stack canvas').count()
        if (stackCanvasAfterClassic > 0) {
          errors.push(`[${vp.name}] #stack canvas still mounted after switching to Classic`)
        }
        const stackClassicOut = path.join(OUT_DIR, `${vp.name}-stack-classic.png`)
        await page.screenshot({ path: stackClassicOut })
        console.log(`Captured ${stackClassicOut}`)

        await page.evaluate(() => {
          const el = document.querySelector('#projects')
          if (el) {
            window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + 80, behavior: 'instant' })
          }
        })
        await page.waitForTimeout(700)
        const canvasAfterClassic = await page.locator('#projects canvas').count()
        if (canvasAfterClassic > 0) {
          errors.push(`[${vp.name}] #projects canvas still mounted after switching to Classic`)
        }
        const classicOut = path.join(OUT_DIR, `${vp.name}-projects-classic.png`)
        await page.screenshot({ path: classicOut })
        console.log(`Captured ${classicOut}`)

        await page.evaluate(() => {
          const el = document.querySelector('#contact')
          if (el) {
            window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: 'instant' })
          }
        })
        await page.waitForTimeout(700)
        const contactCanvasAfterClassic = await page.locator('#contact canvas').count()
        if (contactCanvasAfterClassic > 0) {
          errors.push(`[${vp.name}] #contact canvas still mounted after switching to Classic`)
        }
        const contactClassicOut = path.join(OUT_DIR, `${vp.name}-contact-classic.png`)
        await page.screenshot({ path: contactClassicOut })
        console.log(`Captured ${contactClassicOut}`)

        // Restore immersive preference
        await toggleBtn.scrollIntoViewIfNeeded()
        await toggleBtn.click()
        await page.waitForTimeout(250)
      }

      // Check Case Study and /play routes
      for (const routeCheck of [
        { route: '/projects/ai-smart-vision', label: 'case-study' },
        { route: '/play', label: 'play' },
      ]) {
        await page.goto(`${BASE_URL}${routeCheck.route}`, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        })
        await page.waitForTimeout(500)
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth
        )
        if (overflow) {
          errors.push(`[${vp.name}] horizontal overflow on ${routeCheck.route}`)
        }
        if (vp.name === 'desktop-1440' || vp.name === 'mobile-375') {
          const outFile = path.join(OUT_DIR, `${vp.name}-${routeCheck.label}.png`)
          await page.screenshot({ path: outFile })
          console.log(`Captured ${outFile}`)
        }
      }
    }

    await context.close()

    if (errors.length > 0) {
      console.error('Errors detected during shot run:')
      errors.forEach((e) => console.error(' -', e))
      process.exitCode = 1
    } else {
      console.log('All screenshots captured cleanly (0 JS errors, 0 horizontal overflows).')
    }
  } finally {
    if (browser) await browser.close()
    await new Promise((resolve) => server.httpServer.close(() => resolve(undefined)))
  }
}

void main()
