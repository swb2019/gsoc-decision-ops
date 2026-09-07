/** Physical Android task-tab qualification. Configuration stays outside published evidence.
 * Usage: node scripts/android-qualification.mjs <local-config.json>
 * Config: {adb,url,devices:[{model,android,browserVersion,serial,endpoint}],adbServerPort?:5037,sceneCycles?:5,nativeDownloads?:false}
 * Retains journals and browser profiles. Clears only the task app's offline release caches/worker.
 */
import { chromium } from 'playwright';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import AxeBuilder from '@axe-core/playwright';

assert.ok(process.argv[2], 'Pass a local device-configuration JSON path.');
const configuration = JSON.parse(await readFile(process.argv[2], 'utf8'));
const baseURL = new URL(configuration.url);
assert.ok(
  ['localhost', '127.0.0.1'].includes(baseURL.hostname),
  'Use the task-owned loopback test server.'
);
assert.ok(baseURL.pathname.endsWith('/'), 'The application URL must end with a slash.');
assert.ok(
  configuration.adb && configuration.devices?.length,
  'Configuration needs adb and devices.'
);
const output = resolve(
  'qa-output',
  configuration.mobileQualification ? 'android-mobile' : 'android'
);
const cycles = Math.max(1, Math.min(10, configuration.sceneCycles ?? 5));
await mkdir(output, { recursive: true });
const results = [];

for (const device of configuration.devices) {
  const result = {
    model: device.model,
    android: device.android,
    browserVersion: device.browserVersion,
    checks: [],
    limitations: [
      'Five cold-cache reloads retain the same browser process; these are not process-cold launches.',
      'DevTools delivers touch to a physical browser. This does not qualify a human touch or assistive-technology journey.',
      'Form text and select values are entered through browser automation; this is not a human soft-keyboard qualification.',
      'Heap observations describe JavaScript memory, not physical GPU memory or a prolonged thermal soak.',
      'Three mission commits provide small-N lab acknowledgment latency, not field INP or a robust population p95.',
      configuration.nativeDownloads
        ? 'Native download handoff is requested; Downloads-folder persistence and OS sharing are not asserted.'
        : 'Exports are captured from the generated Blob at download handoff. OS download UI is suppressed; Downloads-folder persistence and sharing are not asserted.',
    ],
    errors: [],
    externalRequests: [],
    coldReloads: [],
    orientation: [],
    memoryTrace: [],
    touches: [],
    exports: [],
    completion: null,
  };
  const directory = resolve(output, device.model.replace(/[^a-zA-Z0-9_-]/g, '-'));
  await mkdir(directory, { recursive: true });
  const redact = (value) => String(value).replaceAll(device.serial, '[device]');
  const adb = (...args) =>
    execFileSync(
      configuration.adb,
      ['-P', String(configuration.adbServerPort ?? 5037), '-s', device.serial, ...args],
      {
        encoding: 'utf8',
        windowsHide: true,
      }
    ).trim();
  let browser, page, client, originalRotation;
  let offline = false;
  try {
    originalRotation = adb('shell', 'wm', 'user-rotation');
    const serverPort = baseURL.port || (baseURL.protocol === 'https:' ? '443' : '80');
    adb('reverse', `tcp:${serverPort}`, `tcp:${serverPort}`);
    adb('forward', `tcp:${new URL(device.endpoint).port}`, 'localabstract:chrome_devtools_remote');
    browser = await chromium.connectOverCDP(device.endpoint);
    const pages = browser
      .contexts()
      .flatMap((context) => context.pages())
      .filter((candidate) => candidate.url().startsWith(baseURL.href));
    assert.equal(pages.length, 1, 'Exactly one task-owned Android test tab is required.');
    page = pages[0];
    page.setDefaultTimeout(20000);
    page.on('pageerror', (error) => result.errors.push(redact(error.message)));
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (['http:', 'https:'].includes(url.protocol) && url.origin !== baseURL.origin)
        result.externalRequests.push(url.href);
    });
    client = await page.context().newCDPSession(page);
    await client.send('Performance.enable');
    await client.send('Network.enable');
    const frames = () =>
      page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      );
    const screenshot = (name) =>
      page.screenshot({ path: resolve(directory, `${name}.png`), fullPage: false });
    const button = (name) => page.getByRole('button', { name, exact: true });
    const tap = async (locator) => {
      await locator.waitFor({ state: 'visible' });
      await locator.evaluate((element) => {
        const active = document.activeElement;
        if (
          active !== element &&
          active instanceof HTMLElement &&
          /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName)
        )
          active.blur();
      });
      let diagnostic;
      // Android's keyboard and browser bars can finish resizing after blur. Recenter
      // against the actual viewport until the target receives the physical touch.
      for (let attempt = 0; attempt < 20; attempt++) {
        await locator.evaluate((element) =>
          element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' })
        );
        // A layout hit-test can become stale while Chrome finishes hiding its
        // keyboard/browser bars. Require a quiet geometry interval before touch.
        await locator.evaluate(
          (element) =>
            new Promise((resolve) => {
              let signature = '',
                quietSince = performance.now();
              const started = quietSince;
              const check = () => {
                const rect = element.getBoundingClientRect(),
                  view = visualViewport;
                const next = [
                  rect.x,
                  rect.y,
                  rect.width,
                  rect.height,
                  scrollY,
                  view?.offsetTop,
                  view?.height,
                ]
                  .map((value) => Math.round((value ?? 0) * 10))
                  .join(',');
                const now = performance.now();
                if (next !== signature) {
                  signature = next;
                  quietSince = now;
                }
                if (now - quietSince >= 250 || now - started > 2500) resolve();
                else requestAnimationFrame(check);
              };
              requestAnimationFrame(check);
            })
        );
        diagnostic = await locator.evaluate((element) => {
          const rect = element.getBoundingClientRect();
          const x = rect.left + rect.width / 2,
            y = rect.top + rect.height / 2;
          const hit = document.elementFromPoint(x, y),
            viewport = window.visualViewport;
          return {
            label: element.getAttribute('aria-label') || element.textContent?.trim(),
            rect: rect.toJSON(),
            point: { x, y },
            receives: Boolean(hit && (hit === element || element.contains(hit))),
            hit: hit?.outerHTML.slice(0, 300),
            scrollX,
            scrollY,
            width: innerWidth,
            height: innerHeight,
            viewport: viewport
              ? {
                  offsetLeft: viewport.offsetLeft,
                  offsetTop: viewport.offsetTop,
                  width: viewport.width,
                  height: viewport.height,
                  scale: viewport.scale,
                }
              : null,
            tabs: document.querySelector('.gh-mobile-tabs')?.getBoundingClientRect().toJSON(),
          };
        });
        result.touches.push({ ...diagnostic, recenterAttempt: attempt });
        const view = diagnostic.viewport;
        if (
          diagnostic.receives &&
          diagnostic.point.x >= (view?.offsetLeft ?? 0) &&
          diagnostic.point.y >= (view?.offsetTop ?? 0) &&
          diagnostic.point.x <= (view?.offsetLeft ?? 0) + (view?.width ?? diagnostic.width) &&
          diagnostic.point.y <= (view?.offsetTop ?? 0) + (view?.height ?? diagnostic.height)
        )
          break;
      }
      assert.ok(
        diagnostic.receives,
        `Touch target is occluded: ${diagnostic.label}; hit ${diagnostic.hit}`
      );
      const viewport = diagnostic.viewport;
      const point = {
        x: diagnostic.point.x - (viewport?.offsetLeft ?? 0),
        y: diagnostic.point.y - (viewport?.offsetTop ?? 0),
      };
      assert.ok(
        point.x >= 0 &&
          point.y >= 0 &&
          point.x <= (viewport?.width ?? diagnostic.width) &&
          point.y <= (viewport?.height ?? diagnostic.height),
        'Touch must fall inside the visual viewport.'
      );
      const token = result.touches.length;
      await locator.evaluate((element, token) => {
        window.__hourglassTouchReceipt = { token, clicked: false };
        element.addEventListener(
          'click',
          () => {
            window.__hourglassTouchReceipt = { token, clicked: true };
          },
          { once: true }
        );
      }, token);
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ ...point, radiusX: 2, radiusY: 2, force: 1 }],
      });
      await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.waitForFunction(
        (token) =>
          window.__hourglassTouchReceipt?.token === token && window.__hourglassTouchReceipt.clicked,
        token,
        { timeout: 3000 }
      );
      await frames();
    };
    const area = async (name) => {
      if (await button(name).isVisible()) {
        await tap(button(name));
        await page.waitForFunction(
          (label) =>
            [...document.querySelectorAll('.gh-mobile-tabs button')].some(
              (item) =>
                item.textContent.trim() === label && item.getAttribute('aria-current') === 'page'
            ),
          name
        );
      }
    };
    const takeover = async () => {
      if (await button('Take over here').isVisible()) {
        await tap(button('Take over here'));
        await button('Take over here').waitFor({ state: 'hidden' });
      }
    };
    const saved = async () => {
      await tap(button('Open display and local data settings'));
      await page.waitForFunction(() =>
        document.querySelector('.gh-save-state')?.textContent?.includes('Saved')
      );
      await tap(button('Close settings'));
    };
    const memory = async (checkpoint) => {
      await frames();
      await client.send('HeapProfiler.collectGarbage');
      const metrics = (await client.send('Performance.getMetrics')).metrics;
      const item = {
        checkpoint,
        metrics: Object.fromEntries(
          metrics
            .filter((item) =>
              [
                'JSHeapUsedSize',
                'JSHeapTotalSize',
                'Nodes',
                'Documents',
                'LayoutCount',
                'RecalcStyleCount',
                'TaskDuration',
              ].includes(item.name)
            )
            .map((item) => [item.name, item.value])
        ),
      };
      result.memoryTrace.push(item);
      return item;
    };
    const captureDownload = async (locator, stem) => {
      const before = await page.evaluate(() => window.__hourglassExports.length);
      await tap(locator);
      await page.waitForFunction((count) => window.__hourglassExports.length > count, before, {
        timeout: 45000,
      });
      const artifact = await page.evaluate((index) => window.__hourglassExports[index], before);
      assert.ok(!artifact.error, artifact.error);
      const bytes = Buffer.from(artifact.base64, 'base64');
      assert.ok(
        bytes.length > 0 && bytes.length < 20 * 1024 * 1024,
        'Export must be nonempty and bounded.'
      );
      const filename = `${stem}-${artifact.filename.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
      await writeFile(resolve(directory, filename), bytes);
      result.exports.push({
        file: filename,
        mime: artifact.mime,
        bytes: bytes.length,
        nativeDownloadRequested: Boolean(configuration.nativeDownloads),
      });
      return bytes;
    };
    const commit = async () => {
      const before = await page.locator('.gh-commitment').count();
      await tap(button('Commit plan'));
      await page.waitForFunction(
        (count) => document.querySelectorAll('.gh-commitment').length === count + 1,
        before
      );
    };

    result.reset = await page.evaluate(async (scope) => {
      const removedWorkers = [],
        removedCaches = [];
      for (const registration of await navigator.serviceWorker.getRegistrations()) {
        const script =
          registration.active?.scriptURL ??
          registration.waiting?.scriptURL ??
          registration.installing?.scriptURL;
        if (registration.scope === scope && script === new URL('glasshouse-sw.js', scope).href) {
          await registration.unregister();
          removedWorkers.push(script);
        }
      }
      for (const name of await caches.keys())
        if (
          name.startsWith('hourglass-glasshouse:pack:') ||
          name === 'hourglass-glasshouse:control:v1'
        ) {
          await caches.delete(name);
          removedCaches.push(name);
        }
      return { removedWorkers, removedCaches, journals: 'preserved' };
    }, baseURL.href);
    await page.addInitScript(
      ({ nativeDownloads }) => {
        window.__hourglassVitals = { lcp: 0, cls: 0, longTasks: [] };
        new PerformanceObserver((list) => {
          for (const item of list.getEntries()) window.__hourglassVitals.lcp = item.startTime;
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        new PerformanceObserver((list) => {
          for (const item of list.getEntries())
            if (!item.hadRecentInput) window.__hourglassVitals.cls += item.value;
        }).observe({ type: 'layout-shift', buffered: true });
        new PerformanceObserver((list) => {
          for (const item of list.getEntries())
            window.__hourglassVitals.longTasks.push({
              start: item.startTime,
              duration: item.duration,
            });
        }).observe({ type: 'longtask', buffered: true });
        window.__hourglassCommandLatencies = [];
        document.addEventListener(
          'click',
          (event) => {
            const target = event.target instanceof Element ? event.target.closest('button') : null;
            if (target?.textContent.trim() !== 'Commit plan') return;
            const at = performance.now(),
              count = document.querySelectorAll('.gh-commitment').length;
            const observer = new MutationObserver(() => {
              if (document.querySelectorAll('.gh-commitment').length <= count) return;
              observer.disconnect();
              const domMs = performance.now() - at;
              requestAnimationFrame(() =>
                requestAnimationFrame(() =>
                  window.__hourglassCommandLatencies.push({
                    at,
                    type: 'commit-plan',
                    domMs,
                    afterPaintOpportunityMs: performance.now() - at,
                  })
                )
              );
            });
            observer.observe(document.documentElement, { childList: true, subtree: true });
            setTimeout(() => observer.disconnect(), 5000);
          },
          true
        );
        const blobs = new Map();
        window.__hourglassExports = [];
        const create = URL.createObjectURL.bind(URL);
        URL.createObjectURL = (value) => {
          const url = create(value);
          if (value instanceof Blob) blobs.set(url, value);
          return url;
        };
        const click = HTMLAnchorElement.prototype.click;
        HTMLAnchorElement.prototype.click = function () {
          const blob = blobs.get(this.href);
          if (!this.download || !blob) return click.call(this);
          const filename = this.download,
            href = this.href;
          void blob
            .arrayBuffer()
            .then((buffer) => {
              const bytes = new Uint8Array(buffer);
              let binary = '';
              for (let offset = 0; offset < bytes.length; offset += 8192)
                binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
              window.__hourglassExports.push({ filename, mime: blob.type, base64: btoa(binary) });
              blobs.delete(href);
            })
            .catch((error) => window.__hourglassExports.push({ error: error.message }));
          if (nativeDownloads) return click.call(this);
        };
      },
      { nativeDownloads: Boolean(configuration.nativeDownloads) }
    );
    await page.goto('about:blank');
    await page.goto(baseURL.href, { waitUntil: 'networkidle' });
    await takeover();
    if (await page.locator('.gh-command-heading, .gh-review-title').isVisible()) {
      await tap(button('Open display and local data settings'));
      await captureDownload(
        button('Start a new mission · preserve this backup'),
        'preserved-prior-session'
      );
    }
    await page.getByRole('button', { name: /^Guided practice/ }).waitFor();
    // The application intentionally retains its resume pointer across a launch screen. For a
    // repeatable fresh-launch measurement, detach only that pointer after the UI backup settled.
    // Every checkpoint, event, archive and lease remains intact and inspectable in practice history.
    result.reset.previousResumePointer = await page.evaluate(async () => {
      if (!(await indexedDB.databases()).some((item) => item.name === 'hourglass:glasshouse:v1'))
        return null;
      const database = await new Promise((resolve, reject) => {
        const request = indexedDB.open('hourglass:glasshouse:v1');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      try {
        return await new Promise((resolve, reject) => {
          const transaction = database.transaction('metadata', 'readwrite');
          const store = transaction.objectStore('metadata');
          const request = store.get('current');
          let previous = null;
          request.onsuccess = () => {
            previous = request.result?.value ?? null;
            store.delete('current');
          };
          transaction.oncomplete = () => resolve(previous);
          transaction.onerror = () => reject(transaction.error);
        });
      } finally {
        database.close();
      }
    });
    adb('shell', 'wm', 'user-rotation', 'lock', '0');
    await page.waitForFunction(() => innerHeight > innerWidth);
    await client.send('Network.setCacheDisabled', { cacheDisabled: true });
    for (const route of ['', 'glasshouse/', 'evidence/'])
      for (let run = 0; run < 5; run++) {
        await page.goto(new URL(route, baseURL).href, { waitUntil: 'networkidle' });
        assert.equal(
          await page.evaluate(() => document.visibilityState),
          'visible',
          'Measure only a visible physical tab.'
        );
        await frames();
        result.coldReloads.push({
          route: `/${route}`,
          run: run + 1,
          ...(await page.evaluate(() => ({
            ...window.__hourglassVitals,
            resources: performance.getEntriesByType('resource').map((item) => ({
              path: new URL(item.name).pathname,
              bytes: item.encodedBodySize,
              duration: item.duration,
            })),
            width: innerWidth,
            height: innerHeight,
            dpr: devicePixelRatio,
            userAgent: navigator.userAgent,
          }))),
        });
      }
    await client.send('Network.setCacheDisabled', { cacheDisabled: false });
    result.checks.push(
      'five visible cache-disabled navigations each for root, /glasshouse/ and /evidence/ with the previous offline pack removed; legacy phone qualification is separate'
    );
    await page.goto(baseURL.href, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /^Guided practice/ }).waitFor();
    await screenshot('launch-portrait');
    await tap(button('Open display and local data settings'));
    await tap(button('Inspect offline download'));
    await page.locator('.gh-offline-facts').waitFor();
    result.offlinePack = await page.locator('.gh-offline-facts').innerText();
    await tap(page.getByRole('button', { name: /Download complete pack/ }));
    await page.getByText('Verified · next start', { exact: true }).waitFor({ timeout: 120000 });
    await tap(button('Activate for next start'));
    await page.getByText('Offline active', { exact: true }).waitFor();
    await tap(button('Close settings'));
    await tap(page.getByRole('button', { name: /^Guided practice/ }));
    await page.locator('.gh-command-heading').waitFor();
    await saved();
    await client.send('Network.emulateNetworkConditions', {
      offline: true,
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: -1,
    });
    offline = true;
    assert.equal(
      await page.evaluate(async (scope) => {
        try {
          await fetch(new URL(`__qualification-uncached-${Date.now()}`, scope), {
            cache: 'no-store',
          });
          return false;
        } catch {
          return true;
        }
      }, baseURL.href),
      true,
      'An uncached task-origin request must fail offline.'
    );
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('.gh-command-heading').waitFor();
    await takeover();
    result.checks.push(
      'explicit integrity-verified offline pack, uncached target request failure and complete mission reload'
    );
    await page.evaluate(() => {
      window.__hourglassFrameTrace = [];
      let previous;
      const frame = (time) => {
        if (previous !== undefined && window.__hourglassFrameTrace.length < 30000)
          window.__hourglassFrameTrace.push({
            time,
            delta: time - previous,
            visibility: document.visibilityState,
          });
        previous = time;
        window.__hourglassFrameRequest = requestAnimationFrame(frame);
      };
      window.__hourglassFrameRequest = requestAnimationFrame(frame);
    });
    await memory('mission-open');
    await area('Situation');
    const openScene = async () => {
      await tap(button('Architecture · optional'));
      await page.waitForFunction(() =>
        [...document.querySelectorAll('.gh-map-switch button')].some(
          (item) =>
            item.textContent.trim() === 'Architecture · optional' &&
            item.getAttribute('aria-pressed') === 'true'
        )
      );
      await page.locator('canvas').waitFor({ state: 'visible' });
    };
    await openScene();
    result.graphics = await page.locator('canvas').evaluate((canvas) => {
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl'),
        extension = gl.getExtension('WEBGL_debug_renderer_info');
      return {
        vendor: extension
          ? gl.getParameter(extension.UNMASKED_VENDOR_WEBGL)
          : gl.getParameter(gl.VENDOR),
        renderer: extension
          ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL)
          : gl.getParameter(gl.RENDERER),
        version: gl.getParameter(gl.VERSION),
      };
    });
    await page
      .locator('canvas')
      .evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await frames();
    await screenshot('campus-quiet');
    const baseline = await memory('scene-mounted-baseline');
    for (let cycle = 1; cycle <= cycles; cycle++) {
      await tap(button('Schematic'));
      await page.locator('canvas').waitFor({ state: 'detached' });
      await memory(`scene-disposed-${cycle}`);
      await openScene();
      await memory(`scene-remounted-${cycle}`);
    }
    const mounted = result.memoryTrace.filter((item) =>
      item.checkpoint.startsWith('scene-remounted')
    );
    result.sceneCycles = {
      count: cycles,
      maxHeapGrowthBytes:
        Math.max(...mounted.map((item) => item.metrics.JSHeapUsedSize)) -
        baseline.metrics.JSHeapUsedSize,
      interpretation:
        'Bounded physical-browser JavaScript heap observations; no GPU-memory or endurance claim.',
    };
    assert.ok(
      result.sceneCycles.maxHeapGrowthBytes < 16 * 1024 * 1024,
      'Scene-cycle JavaScript heap growth stays below 16 MiB.'
    );
    result.checks.push(
      `${cycles} optional-scene mount/dispose cycles with detached canvases and bounded JavaScript heap growth`
    );
    await area('Decide');
    await tap(page.getByRole('button', { name: /Evidence, reasoning & safeguards/ }));
    await tap(page.getByRole('checkbox', { name: /Mara Chen/ }));
    if (configuration.mobileQualification) {
      const input = page.getByLabel('Rationale', { exact: true });
      const before = await page.evaluate(() => visualViewport?.height ?? innerHeight);
      await tap(input);
      const keyboardOpened = await page
        .waitForFunction(
          (height) => (visualViewport?.height ?? innerHeight) < height - 100,
          before,
          { timeout: 5000 }
        )
        .then(() => true)
        .catch(() => false);
      result.keyboard = await input.evaluate(
        (element, keyboardOpened) => ({
          keyboardOpened,
          focused: document.activeElement === element,
          fontSize: parseFloat(getComputedStyle(element).fontSize),
          viewportHeight: visualViewport?.height ?? innerHeight,
          viewportScale: visualViewport?.scale ?? 1,
          width: innerWidth,
          contentWidth: document.documentElement.scrollWidth,
        }),
        keyboardOpened
      );
      assert.ok(result.keyboard.focused, 'Native touch focuses the text input.');
      assert.ok(
        result.keyboard.fontSize >= 16,
        'Mobile input remains readable without forced zoom.'
      );
      assert.ok(
        result.keyboard.contentWidth <= result.keyboard.width + 1,
        'Keyboard entry preserves horizontal reflow.'
      );
      await screenshot('native-keyboard');
      result.checks.push(
        keyboardOpened
          ? 'Native soft keyboard opened by touch; focused input, readable text and reflow preserved'
          : 'Touch input focus and readable text preserved; no native soft-keyboard resize observed'
      );
    }
    await page
      .getByLabel('Rationale', { exact: true })
      .fill('Obtain a timestamped entrance observation before broad disruption.');
    await page
      .getByLabel('Review trigger', { exact: true })
      .fill('Reassess on the guard report or a changed entry condition.');
    await commit();
    await area('Situation');
    assert.match(
      await page.getByLabel('Campus commitments shown in the architectural view').innerText(),
      /Mobile patrol coverage is displaced/
    );
    await page
      .locator('canvas')
      .evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await frames();
    await screenshot('campus-guard-commitment');
    await memory('guard-committed');
    await page.locator('canvas').evaluate((canvas) => {
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl'),
        extension = gl.getExtension('WEBGL_lose_context');
      if (!extension) throw new Error('Context-loss injection unavailable.');
      extension.loseContext();
    });
    await page
      .locator('.gh-error')
      .filter({ hasText: 'Your session and complete schematic are preserved' })
      .waitFor();
    assert.equal(await page.locator('canvas').count(), 0);
    await tap(button('Dismiss message'));
    result.checks.push(
      'offline physical WebGL rendering, visible commitment and forced GPU-loss recovery'
    );
    await tap(button('Next significant update'));
    await tap(button('Next significant update'));
    await area('Decide');
    await page
      .getByRole('combobox', { name: 'Control', exact: true })
      .selectOption('investigate-connector');
    await commit();
    await tap(button('Next significant update'));
    await tap(button('Next significant update'));
    await page.getByRole('combobox', { name: 'Control', exact: true }).selectOption('monitor');
    await commit();
    for (let count = 0; count < 20; count++) {
      if (Number((await page.locator('.gh-clock-offset').innerText()).match(/\d+/)[0]) >= 30) break;
      await tap(button('Next significant update'));
    }
    await memory('dispatch-deadline');
    for (const [rotation, label] of [
      ['1', 'landscape'],
      ['0', 'portrait'],
    ]) {
      adb('shell', 'wm', 'user-rotation', 'lock', rotation);
      await page.waitForFunction(
        (landscape) => (landscape ? innerWidth > innerHeight : innerHeight > innerWidth),
        rotation === '1'
      );
      const layout = await page.evaluate(() => ({
        width: innerWidth,
        height: innerHeight,
        content: document.documentElement.scrollWidth,
      }));
      assert.ok(
        layout.content <= layout.width + 1,
        `${label} has no horizontal document scrolling.`
      );
      result.orientation.push({ label, ...layout });
      await screenshot(`mission-${label}`);
    }
    await area('Decide');
    const enlargement = await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    const largeLayout = await page.evaluate(() => ({
      width: innerWidth,
      content: document.documentElement.scrollWidth,
    }));
    assert.ok(
      largeLayout.content <= largeLayout.width + 1,
      '200% text has no horizontal form overflow.'
    );
    await screenshot('text-200-percent');
    await enlargement.evaluate((element) => element.remove());
    result.checks.push(
      'portrait, landscape and 200-percent text retain bounded physical-device layout'
    );
    await area('Situation');
    await tap(button('Prepare handoff'));
    await page
      .getByLabel('Situation & outstanding work')
      .fill(
        'Entrance verified; connector scope investigated; shipment reviewed. Carry remaining uncertainty into the next watch.'
      );
    await page.getByLabel('Receiving owner').fill('Relief watch');
    await page
      .locator('.gh-handoff-panel')
      .getByLabel('Review trigger')
      .fill('Review next vendor update or any new entrance anomaly.');
    await tap(button('Record handoff'));
    await page.getByRole('heading', { name: 'The watch is handed over.' }).waitFor();
    await saved();
    await memory('controlled-handoff');
    const trace = await page.evaluate(() => {
      cancelAnimationFrame(window.__hourglassFrameRequest);
      return window.__hourglassFrameTrace;
    });
    await writeFile(resolve(directory, 'mission-frame-trace.json'), JSON.stringify(trace));
    result.frameSummary = {
      samples: trace.length,
      visibleFrames: trace.filter((item) => item.visibility === 'visible').length,
      over50ms: trace.filter((item) => item.delta > 50).length,
      maximumMs: Math.max(...trace.map((item) => item.delta)),
    };
    const latencies = await page.evaluate(() => window.__hourglassCommandLatencies);
    result.commandAcknowledgment = {
      samples: latencies,
      count: latencies.length,
      maxDomMs: Math.max(...latencies.map((item) => item.domMs)),
      maxAfterPaintOpportunityMs: Math.max(
        ...latencies.map((item) => item.afterPaintOpportunityMs)
      ),
      interpretation:
        'Click capture to commitment insertion and the following paint opportunity on the physical page clock. CDP/ADB transport excluded. Small N; no robust p95 or field-INP claim.',
    };
    assert.equal(
      latencies.length,
      3,
      'All three actual mission commits have acknowledgment measurements.'
    );
    await tap(button('Open causal debrief'));
    await page.getByRole('heading', { name: 'What did your choices change?' }).waitFor();
    await screenshot('completed-review');
    const accessibility = await new AxeBuilder({ page })
      .include('.gh-app')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    result.accessibility = accessibility.violations.map((item) => ({
      id: item.id,
      impact: item.impact,
      nodes: item.nodes.map((node) => node.target),
    }));
    assert.deepEqual(result.accessibility, []);
    const json = JSON.parse(
      (await captureDownload(button('JSON'), 'offline-report')).toString('utf8')
    );
    const html = (await captureDownload(button('HTML'), 'offline-report')).toString('utf8');
    const pdf = await captureDownload(button('PDF'), 'offline-report');
    assert.match(html, /<!doctype html>/i);
    assert.ok(
      html.includes(json.sessionId) && html.includes(json.canonicalDigest),
      'HTML keeps the same frozen report identity and digest.'
    );
    assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
    assert.ok(pdf.length > 1000);
    const repeated = JSON.parse(
      (await captureDownload(button('JSON'), 'unchanged-report')).toString('utf8')
    );
    assert.deepEqual(repeated, json, 'Reading and exporting does not mutate the frozen report.');
    result.completion = {
      lifecycle: json.lifecycle,
      decisions: json.decisions.length,
      tick: json.simulatedMinutes,
      versions: json.versions,
      sessionId: json.sessionId,
      canonicalDigest: json.canonicalDigest,
    };
    assert.equal(result.completion.lifecycle, 'completed');
    assert.equal(result.completion.decisions, 3);
    assert.deepEqual(
      result.externalRequests,
      [],
      'The flagship sends no page requests to another origin.'
    );
    assert.deepEqual(result.errors, [], 'No uncaught page errors.');
    result.checks.push(
      'offline three-decision mission and controlled handoff; JSON/HTML/text-PDF artifact generation; unchanged repeated export; review axe checks'
    );
    result.status = 'passed';
  } catch (error) {
    result.status = 'failed';
    result.failure = redact(error.stack || error);
    if (page) {
      result.failureContext = await page
        .evaluate(() => ({
          url: location.href,
          width: innerWidth,
          height: innerHeight,
          scrollY,
          text: document.body.innerText.slice(0, 16000),
          selectedArchitecture: document.querySelector('.gh-map-switch button[aria-pressed="true"]')
            ?.textContent,
          errors: document.querySelector('.gh-error')?.textContent,
        }))
        .catch(() => null);
      await page
        .screenshot({ path: resolve(directory, 'failure.png'), fullPage: false })
        .catch(() => undefined);
    }
  } finally {
    if (offline && client)
      await client
        .send('Network.emulateNetworkConditions', {
          offline: false,
          latency: 0,
          downloadThroughput: -1,
          uploadThroughput: -1,
        })
        .catch(() => undefined);
    if (client)
      await client
        .send('Network.setCacheDisabled', { cacheDisabled: false })
        .catch(() => undefined);
    try {
      if (originalRotation?.startsWith('free')) adb('shell', 'wm', 'user-rotation', 'free');
      else if (originalRotation)
        adb('shell', 'wm', 'user-rotation', 'lock', originalRotation.match(/\d+/)?.[0] ?? '0');
    } catch (error) {
      result.restoreWarning = redact(error.message);
    }
    if (browser) await browser.close();
    await writeFile(resolve(directory, 'qualification.json'), JSON.stringify(result, null, 2));
    results.push(result);
    console.log(
      JSON.stringify({
        model: result.model,
        status: result.status,
        checks: result.checks,
        failure: result.failure,
      })
    );
  }
}
await writeFile(resolve(output, 'summary.json'), JSON.stringify(results, null, 2));
if (results.some((result) => result.status !== 'passed')) process.exitCode = 1;
