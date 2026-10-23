// Screenshot helper for generate-project-frames. Import it from a throwaway script:
//   import { capturePages } from '<skill>/scripts/capture.mjs';
// It reuses frame-kit's Chromium lookup (documented `launchBrowser` export), so the project
// needs no Playwright dependency. It never logs in for you: pass `storageState` (a saved session
// file) or a `login(page)` hook that reads credentials from the environment.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const VIEWPORT = { width: 1440, height: 900 };

// Common loading indicators and blocking overlays; extend with `loadingSelectors` / `overlaySelectors`
const LOADING = ['[aria-busy="true"]', '.spinner', '.skeleton', '.loading', '[class*="spinner"]', '[class*="skeleton"]', '[role="progressbar"]'];
const OVERLAY = ['[role="dialog"]', '[aria-modal="true"]', '[class*="cookie"]', '[class*="consent"]', '[class*="modal-backdrop"]'];

/**
 * pages: [{ name: '01-dashboard', url: 'http://localhost:8000/dashboard', prepare?: async (page) => {} }]
 * Returns [{ name, file, issues: [...] }]; issues are warnings to review, the PNG is always written.
 */
export async function capturePages({ frameKit, pages, outDir, colorScheme = 'light', storageState, login, setup,
  hideCss = '', loadingSelectors = [], overlaySelectors = [], timeout = 15000 }) {
  const { launchBrowser } = await import(pathToFileURL(join(frameKit, 'src', 'frame.mjs')).href);
  mkdirSync(outDir, { recursive: true });
  const browser = await launchBrowser();
  const results = [];
  try {
    // One context for the whole batch keeps viewport, scale and theme identical
    const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2, colorScheme, storageState });
    if (setup) await setup(context); // e.g. context.addInitScript(...) for the app's own theme switch
    if (login) {
      const page = await context.newPage();
      await login(page);
      await page.close();
    }
    for (const spec of pages) {
      const page = await context.newPage();
      const issues = [];
      page.on('console', (m) => m.type() === 'error' && issues.push(`console error: ${m.text().slice(0, 200)}`));
      page.on('pageerror', (e) => issues.push(`page error: ${e.message.slice(0, 200)}`));
      page.on('response', (r) => r.status() >= 400 && issues.push(`HTTP ${r.status()}: ${r.url().slice(0, 150)}`));
      const file = join(outDir, `${spec.name}.png`);
      try {
        const res = await page.goto(spec.url, { waitUntil: 'load', timeout });
        if (res && res.status() >= 400) issues.push(`page returned HTTP ${res.status()}`);
        await page.waitForLoadState('networkidle', { timeout }).catch(() => issues.push('network never went idle'));
        if (new URL(page.url()).pathname !== new URL(spec.url).pathname) issues.push(`redirected to ${page.url()} (login required?)`);
        await spec.prepare?.(page);
        await page.evaluate(() => document.fonts.ready);
        // Scroll through so lazy content loads, then return to the top
        await page.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
          window.scrollTo(0, 0);
        });
        await page.addStyleTag({ content: `*{caret-color:transparent!important}::-webkit-scrollbar{display:none}${hideCss}` });
        await page.waitForTimeout(400);
        issues.push(...await page.evaluate(({ loading, overlay }) => {
          const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && s.opacity !== '0'; };
          const out = [];
          for (const img of document.images) if (visible(img) && img.complete && img.naturalWidth === 0) out.push(`broken image: ${img.src.slice(0, 120)}`);
          for (const sel of loading) if ([...document.querySelectorAll(sel)].some(visible)) out.push(`loading indicator visible: ${sel}`);
          for (const sel of overlay) if ([...document.querySelectorAll(sel)].some(visible)) out.push(`overlay visible: ${sel}`);
          for (const c of document.querySelectorAll('canvas, svg.chart, .apexcharts-canvas, .recharts-wrapper')) {
            const r = c.getBoundingClientRect();
            if (r.width > 100 && r.height > 100 && !c.querySelector('path, rect, circle, line') && c.tagName !== 'CANVAS') out.push('chart container has no drawn shapes');
          }
          return out;
        }, { loading: [...LOADING, ...loadingSelectors], overlay: [...OVERLAY, ...overlaySelectors] }));
        await page.screenshot({ path: file });
      } catch (e) {
        issues.push(`capture failed: ${e.message.split('\n')[0]}`);
      } finally {
        await page.close().catch(() => {});
      }
      results.push({ name: spec.name, file, issues: [...new Set(issues)] });
    }
  } finally {
    await browser.close().catch(() => {});
  }
  return results;
}
