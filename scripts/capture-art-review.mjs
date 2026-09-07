/** Capture the real static app and its native procedural audio; no microphone or phone access. */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import {
  createGlasshouseSession,
  restoreGlasshouseSession,
  serializeGlasshouseSession,
  canonicalGlasshouseState,
  getGlasshouseReport,
  GLASSHOUSE_VERSIONS,
  GLASSHOUSE_HANDOVER,
} from '../packages/core/dist/index.js';

const site = resolve('apps/web/out');
const output = resolve('qa-output/art-review');
const manifestText = await readFile(resolve(site, 'glasshouse-offline-manifest.json'), 'utf8');
const pack = JSON.parse(manifestText);
const expectedPack = process.env.ART_REVIEW_PACK || '93781ed04a3f81597bbfbd90';
assert.equal(pack.version, expectedPack, 'Capture only the explicitly selected final artifact.');
const port = Number(process.env.ART_REVIEW_PORT || 4185);
const duration = Math.max(24, Number(process.env.ART_REVIEW_SECONDS || 24));
const smoke = process.argv.includes('--smoke');
const sha = (value) => createHash('sha256').update(value).digest('hex');
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
await mkdir(output, { recursive: true });
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.txt': 'text/plain',
};
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (!pathname.startsWith(pack.scope)) return res.writeHead(404).end();
    let file = resolve(site, pathname.slice(pack.scope.length));
    if (file !== site && !file.startsWith(site + sep)) return res.writeHead(403).end();
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    res
      .writeHead(200, {
        'Content-Type': mime[extname(file)] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      })
      .end(await readFile(file));
  } catch {
    res.writeHead(404).end('Not found');
  }
});
await new Promise((done, reject) => {
  server.once('error', reject);
  server.listen(port, '127.0.0.1', done);
});
const base = `http://127.0.0.1:${port}${pack.scope}`;

function installCapture() {
  const capture = {
    contexts: [],
    tap: null,
    video: null,
    audio: null,
    chunks: [],
    audioChunks: [],
    frames: 0,
    lastImage: null,
    started: 0,
    timer: null,
  };
  window.__artCapture = capture;
  const NativeAudio = window.AudioContext || window.webkitAudioContext;
  const nativeConnect = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (destination, ...rest) {
    const result = nativeConnect.call(this, destination, ...rest);
    if (destination === this.context.destination && this.context.__artTap)
      nativeConnect.call(this, this.context.__artTap);
    return result;
  };
  if (NativeAudio)
    window.AudioContext = class extends NativeAudio {
      constructor(options) {
        super(options);
        this.__artTap = this.createMediaStreamDestination();
        capture.contexts.push(this);
        capture.tap = this.__artTap;
      }
    };
  const dataUrl = (blob) =>
    new Promise((done, reject) => {
      const reader = new FileReader();
      reader.onload = () => done(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  const loadImage = (url) =>
    new Promise((done, reject) => {
      const image = new Image();
      image.onload = () => done(image);
      image.onerror = reject;
      image.src = url;
    });
  capture.draw = async (base64) => {
    const image = await loadImage(`data:image/jpeg;base64,${base64}`);
    capture.lastImage = image;
    capture.paint.drawImage(image, 0, 0, capture.canvas.width, capture.canvas.height);
    capture.track.requestFrame();
    capture.frames++;
  };
  capture.start = async ({ width, height, firstFrame }) => {
    capture.canvas = document.createElement('canvas'); // Encoding surface is unattached: it never changes the app DOM or scene.
    capture.canvas.width = width;
    capture.canvas.height = height;
    capture.paint = capture.canvas.getContext('2d');
    capture.stream = capture.canvas.captureStream(0);
    capture.track = capture.stream.getVideoTracks()[0];
    if (capture.tap) capture.stream.addTrack(capture.tap.stream.getAudioTracks()[0]);
    const videoType = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ].find((type) => MediaRecorder.isTypeSupported(type));
    capture.video = new MediaRecorder(capture.stream, {
      mimeType: videoType,
      videoBitsPerSecond: 1800000,
      audioBitsPerSecond: 64000,
    });
    capture.video.ondataavailable = (event) => {
      if (event.data.size) capture.chunks.push(event.data);
    };
    capture.video.start(500);
    if (capture.tap) {
      capture.audio = new MediaRecorder(capture.tap.stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 96000,
      });
      capture.audio.ondataavailable = (event) => {
        if (event.data.size) capture.audioChunks.push(event.data);
      };
      capture.audio.start(500);
    }
    capture.started = performance.now();
    await capture.draw(firstFrame);
    // Hold the latest real compositor frame during idle periods. No camera or domain animation is invented.
    capture.timer = setInterval(() => {
      if (capture.lastImage) {
        capture.paint.drawImage(capture.lastImage, 0, 0);
        capture.track.requestFrame();
      }
    }, 100);
    return {
      videoType,
      audio: Boolean(capture.audio),
      contextStates: capture.contexts.map((context) => context.state),
    };
  };
  capture.finish = async () => {
    clearInterval(capture.timer);
    const stop = (recorder) =>
      new Promise((done, reject) => {
        if (!recorder || recorder.state === 'inactive') return done();
        recorder.onstop = done;
        recorder.onerror = (event) => reject(event.error);
        recorder.stop();
      });
    await Promise.all([stop(capture.video), stop(capture.audio)]);
    const videoBlob = new Blob(capture.chunks, { type: capture.video.mimeType });
    const audioBlob = new Blob(capture.audioChunks, {
      type: capture.audio?.mimeType || 'audio/webm',
    });
    const result = {
      video: await dataUrl(videoBlob),
      audio: audioBlob.size ? await dataUrl(audioBlob) : null,
      encodedFrames: capture.frames,
      wallDurationSeconds: (performance.now() - capture.started) / 1000,
      contextStatesAtEnd: capture.contexts.map((context) => context.state),
      audioAnalysis: null,
      wav: null,
    };
    if (audioBlob.size) {
      try {
        const decoded = await new OfflineAudioContext(2, 1, 48000).decodeAudioData(
          await audioBlob.arrayBuffer()
        );
        const channels = Array.from({ length: decoded.numberOfChannels }, (_, index) =>
          decoded.getChannelData(index)
        );
        const wav = new ArrayBuffer(44 + decoded.length * 2),
          view = new DataView(wav);
        const string = (at, text) =>
          [...text].forEach((char, index) => view.setUint8(at + index, char.charCodeAt(0)));
        string(0, 'RIFF');
        view.setUint32(4, 36 + decoded.length * 2, true);
        string(8, 'WAVE');
        string(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, decoded.sampleRate, true);
        view.setUint32(28, decoded.sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        string(36, 'data');
        view.setUint32(40, decoded.length * 2, true);
        let square = 0,
          peak = 0;
        for (let index = 0; index < decoded.length; index++) {
          const value =
            channels.reduce((sum, channel) => sum + channel[index], 0) / channels.length;
          square += value * value;
          peak = Math.max(peak, Math.abs(value));
          view.setInt16(44 + index * 2, Math.round(Math.max(-1, Math.min(1, value)) * 32767), true);
        }
        result.wav = await dataUrl(new Blob([wav], { type: 'audio/wav' }));
        result.audioAnalysis = {
          decodedDurationSeconds: decoded.duration,
          sampleRate: decoded.sampleRate,
          sourceChannels: decoded.numberOfChannels,
          wavChannels: 1,
          rms: Math.sqrt(square / decoded.length),
          peak,
          method:
            'Actual MediaRecorder output decoded and averaged to mono PCM; no generated replacement signal.',
        };
      } catch (error) {
        result.audioAnalysis = { decodeError: String(error), originalRecordingPreserved: true };
      }
    }
    capture.track.stop();
    return result;
  };
}

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: [
    '--enable-unsafe-swiftshader',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
  ],
});
const result = {
  status: 'in-progress',
  kind: 'automated-real-app-art-capture',
  pack: pack.version,
  manifestSha256: sha(manifestText),
  versions: GLASSHOUSE_VERSIONS,
  server: base,
  browser: browser.version(),
  desktopVideoMinimumSeconds: duration,
  humanArtReview: 'pending',
  humanComparator: 'pending',
  physicalDevicesTouched: false,
  captureMethod:
    'Chrome DevTools actual compositor JPEG frames encoded in an unattached canvas with MediaRecorder at real wall time. Last real frame is held during idle. Native WebAudio destination is tee-connected to MediaStreamAudioDestinationNode; the original output graph still runs. No microphone, screen/OS permission, fabricated scene, prerecorded substitute sound, or authoritative-state injection is used.',
  limitations: [
    'Desktop/headless lab capture; renderer/device details are recorded separately from physical-device qualification.',
    'Responsive mobile captures are emulated viewport/touch contexts, not phone performance or accessibility evidence.',
    'Browser/OS speech synthesis is outside WebAudio and is not recorded; the unchanged handover transcript is supplied and human voice review remains pending.',
    'The causal debrief intentionally stops optional sound; its audio sample includes actual room tone before the transition and then the stopped/suspended output, not an invented debrief soundtrack.',
    'All interactions and elapsed times belong to automated synthetic capture, not human play, comprehension or learning results.',
  ],
  states: [],
  pageErrors: [],
  externalRequests: [],
};

async function savedSession(page, sessionId) {
  for (let retry = 0; retry < 40; retry++) {
    const text = await page.evaluate(async (id) => {
      const db = await new Promise((done, reject) => {
        const open = indexedDB.open('hourglass:glasshouse:v1');
        open.onsuccess = () => done(open.result);
        open.onerror = () => reject(open.error);
      });
      try {
        return await new Promise((done, reject) => {
          const get = db.transaction('checkpoints').objectStore('checkpoints').get(id);
          get.onsuccess = () => done(get.result?.text || null);
          get.onerror = () => reject(get.error);
        });
      } finally {
        db.close();
      }
    }, sessionId);
    if (text) return restoreGlasshouseSession(text);
    await page.waitForTimeout(100);
  }
  throw new Error('Imported checkpoint did not reach the task-owned journal.');
}
async function settings(page) {
  await page.getByRole('button', { name: 'Open display and local data settings' }).click();
}
async function showSituation(page, mobile) {
  if (mobile) await page.getByRole('button', { name: 'Situation', exact: true }).click();
  await page.locator('.gh-campus-panel').scrollIntoViewIfNeeded();
}
async function moveCamera(page, mobile, reverse = false) {
  if (mobile) return; // Product mobile camera remains fixed; no artificial orbit is introduced.
  const box = await page.locator('.gh-scene canvas').boundingBox();
  assert.ok(box);
  const x = box.x + box.width * 0.5,
    y = box.y + box.height * 0.52;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + (reverse ? -52 : 52), y + (reverse ? -10 : 10), { steps: 28 });
  await page.mouse.up();
}
async function writeDataUrl(file, dataUrl) {
  // MIME codec parameters may themselves contain commas (vp9,opus).
  const encoded = dataUrl.match(/;base64,([A-Za-z0-9+/=]+)$/)?.[1];
  assert.ok(encoded, 'The capture must be an explicit base64 data URL.');
  const bytes = Buffer.from(encoded, 'base64');
  if (file.endsWith('.webm')) assert.equal(bytes.subarray(0, 4).toString('hex'), '1a45dfa3', 'A WebM capture must retain its EBML header.');
  await writeFile(file, bytes);
  return { bytes: bytes.length, sha256: sha(bytes) };
}
async function captureCase(definition, mobile) {
  const tier = mobile ? 'mobile-emulated' : 'desktop';
  const name = `${tier}-${definition.id}`;
  const directory = resolve(output, name);
  await mkdir(directory, { recursive: true });
  const viewport = mobile ? { width: 390, height: 844 } : { width: 1920, height: 1080 };
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    isMobile: mobile,
    hasTouch: mobile,
    acceptDownloads: true,
    reducedMotion: mobile ? 'reduce' : 'no-preference',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  page.on('pageerror', (error) =>
    result.pageErrors.push({ capture: name, message: error.message })
  );
  page.on('request', (request) => {
    if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== new URL(base).origin)
      result.externalRequests.push({ capture: name, url: request.url() });
  });
  await page.addInitScript(installCapture);
  const source = definition.source;
  const sourceText = serializeGlasshouseSession(source);
  await writeFile(resolve(directory, 'source-session.json'), sourceText);
  await page.goto(`${base}glasshouse/`, { waitUntil: 'networkidle' });
  await page
    .getByLabel('Import Glasshouse JSON session')
    .setInputFiles({
      name: `${definition.id}.json`,
      mimeType: 'application/json',
      buffer: Buffer.from(sourceText),
    });
  await page.getByRole('button', { name: 'Review', exact: true }).waitFor();
  assert.equal(
    canonicalGlasshouseState(await savedSession(page, source.sessionId)),
    canonicalGlasshouseState(source)
  );
  await showSituation(page, mobile);
  await page.getByRole('button', { name: 'Schematic', exact: true }).click();
  await page.screenshot({ path: resolve(directory, 'schematic-before.png'), fullPage: false });
  await page
    .locator('.gh-campus-panel')
    .screenshot({ path: resolve(directory, 'schematic-panel.png') });
  await page.getByRole('button', { name: 'Architecture · optional', exact: true }).click();
  await page.locator('.gh-scene canvas').waitFor();
  await page.waitForTimeout(900);
  const renderer = await page.locator('.gh-scene canvas').evaluate((canvas) => {
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    return {
      vendor: info ? gl.getParameter(info.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
      renderer: info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
    };
  });
  await page.screenshot({ path: resolve(directory, 'architecture-before.png'), fullPage: false });
  await page
    .locator('.gh-campus-panel')
    .screenshot({ path: resolve(directory, 'architecture-panel.png') });
  assert.equal(
    canonicalGlasshouseState(await savedSession(page, source.sessionId)),
    canonicalGlasshouseState(source),
    'View changes altered canonical state.'
  );
  await settings(page);
  if (!mobile)
    await page
      .getByRole('checkbox', {
        name: /Enable.*motion|Enable.*camera|Camera motion|Optional motion/i,
      })
      .check();
  await page.getByRole('checkbox', { name: 'Enable effects', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Enable ambience', exact: true }).check();
  await page.getByRole('button', { name: 'Close settings', exact: true }).click();
  await showSituation(page, mobile);
  await page.waitForTimeout(300);
  assert.equal(
    await page.evaluate(() => window.__artCapture.contexts[0]?.state),
    'running',
    'The native procedural audio graph must be active.'
  );
  const clip = {
    id: definition.id,
    tier,
    viewport,
    renderer,
    sourceSessionId: source.sessionId,
    sourceCanonicalDigest: getGlasshouseReport(source).canonicalDigest,
    sourceMinute: source.tick,
    sourceFile: `${name}/source-session.json`,
    actions: [],
    frames: [],
    media: {},
  };
  const firstFrame = (await page.screenshot({ type: 'jpeg', quality: 90 })).toString('base64');
  clip.encoding = await page.evaluate((options) => window.__artCapture.start(options), {
    ...viewport,
    firstFrame,
  });
  const cdp = await context.newCDPSession(page);
  let pendingFrame = Promise.resolve();
  cdp.on('Page.screencastFrame', (event) => {
    void cdp.send('Page.screencastFrameAck', { sessionId: event.sessionId }).catch(() => {});
    clip.frames.push({
      wallTimestamp: event.metadata.timestamp,
      sha256: sha(Buffer.from(event.data, 'base64')),
    });
    pendingFrame = pendingFrame.then(() =>
      page.evaluate((data) => window.__artCapture.draw(data), event.data)
    );
  });
  await cdp.send('Page.startScreencast', {
    format: 'jpeg',
    quality: 90,
    maxWidth: viewport.width,
    maxHeight: viewport.height,
    everyNthFrame: 1,
  });
  const started = Date.now();
  const waitUntil = async (seconds) => {
    const remaining = seconds * 1000 - (Date.now() - started);
    if (remaining > 0) await page.waitForTimeout(remaining);
  };
  const note = (action) =>
    clip.actions.push({ elapsedSeconds: (Date.now() - started) / 1000, action });
  await waitUntil(3);
  if (definition.id === 'causal-debrief') {
    note(
      'Open the real causal review; optional sound stops through the product navigation handler.'
    );
    await page.getByRole('button', { name: 'Review', exact: true }).click();
    await page
      .getByRole('heading', { name: 'What did your choices change?', exact: true })
      .waitFor();
    await page.screenshot({ path: resolve(directory, 'causal-debrief.png'), fullPage: false });
    await page.screenshot({ path: resolve(directory, 'causal-debrief-full.png'), fullPage: true });
    await waitUntil(10);
    const finding = page.getByText('Inspect finding basis', { exact: true }).first();
    await finding.scrollIntoViewIfNeeded();
    await finding.click();
    note('Inspect a real evidence-linked finding and its rule boundary.');
    await waitUntil(18);
    await page
      .getByRole('heading', { name: 'What remains unresolved', exact: true })
      .scrollIntoViewIfNeeded();
    note('Read retained unresolved obligations.');
  } else {
    await moveCamera(page, mobile);
    note(
      mobile
        ? 'Hold the product fixed-camera mobile view.'
        : 'Deliberate bounded camera drag through the actual OrbitControls.'
    );
    await waitUntil(9);
    if (definition.id === 'constrained-operation') {
      await page.getByRole('button', { name: 'Next significant update', exact: true }).click();
      note('Advance actual D08 queue from minute 20 to owner approval/vendor update at minute 24.');
      await showSituation(page, mobile);
      await page.waitForTimeout(700);
    }
    await moveCamera(page, mobile, true);
    await waitUntil(17);
    if (definition.id === 'constrained-operation') {
      await page.getByRole('button', { name: 'Next significant update', exact: true }).click();
      note('Advance the actual queued isolation completion to minute 28; guard remains committed.');
      await showSituation(page, mobile);
      await page.waitForTimeout(700);
    }
  }
  await waitUntil(duration + 0.4);
  await page.screenshot({ path: resolve(directory, 'final-view.png'), fullPage: false });
  await cdp.send('Page.stopScreencast');
  await pendingFrame;
  const media = await page.evaluate(() => window.__artCapture.finish());
  clip.media.video = {
    path: `${name}/motion.webm`,
    ...(await writeDataUrl(resolve(directory, 'motion.webm'), media.video)),
  };
  if (media.audio)
    clip.media.nativeAudio = {
      path: `${name}/native-audio.webm`,
      ...(await writeDataUrl(resolve(directory, 'native-audio.webm'), media.audio)),
    };
  if (media.wav)
    clip.media.audioWav = {
      path: `${name}/procedural-audio.wav`,
      ...(await writeDataUrl(resolve(directory, 'procedural-audio.wav'), media.wav)),
    };
  clip.wallDurationSeconds = media.wallDurationSeconds;
  clip.encodedFrames = media.encodedFrames;
  clip.audioAnalysis = media.audioAnalysis;
  clip.contextStatesAtEnd = media.contextStatesAtEnd;
  assert.ok(clip.wallDurationSeconds >= 24);
  assert.ok(clip.media.video.bytes > 10000);
  assert.ok(
    media.audioAnalysis?.rms > 0,
    'The actual procedural audio sample must contain a nonzero signal.'
  );
  const finalState = await savedSession(page, source.sessionId);
  clip.finalMinute = finalState.tick;
  clip.finalCanonicalDigest = getGlasshouseReport(finalState).canonicalDigest;
  if (definition.id !== 'constrained-operation')
    assert.equal(
      canonicalGlasshouseState(finalState),
      canonicalGlasshouseState(source),
      'Presentation/review changed the source record.'
    );
  else {
    assert.equal(finalState.tick, 28);
    assert.ok(
      finalState.events.some(
        (event) =>
          event.type === 'action.completed' &&
          event.payload.control === 'isolate-connector' &&
          event.simulatedAt === 28
      )
    );
  }
  await writeFile(resolve(directory, 'final-session.json'), serializeGlasshouseSession(finalState));
  await writeFile(resolve(directory, 'full-report.json'), json(getGlasshouseReport(finalState, 0)));
  if (definition.id !== 'causal-debrief') {
    await page.getByRole('button', { name: 'Schematic', exact: true }).click();
    await page.screenshot({ path: resolve(directory, 'schematic-after.png'), fullPage: false });
  }
  clip.nativeVoiceAvailable = await page.evaluate(
    () =>
      'speechSynthesis' in window &&
      speechSynthesis.getVoices().some((voice) => voice.localService && voice.lang.startsWith('en'))
  );
  await writeFile(resolve(directory, 'capture.json'), json(clip));
  result.states.push(clip);
  await context.close();
  process.stdout.write(
    `Captured ${name}: ${clip.wallDurationSeconds.toFixed(2)}s, ${clip.media.video.bytes} video bytes, audio ${media.audioAnalysis.decodedDurationSeconds?.toFixed(2)}s\n`
  );
}

try {
  const definitions = [
    {
      id: 'quiet-handover',
      source: createGlasshouseSession(10, 'independent', 'art-review-quiet'),
    },
    {
      id: 'constrained-operation',
      source: restoreGlasshouseSession(
        await readFile('qa-output/calibration/development/facilitator/D08/session.json', 'utf8')
      ),
    },
    {
      id: 'causal-debrief',
      source: restoreGlasshouseSession(
        await readFile('qa-output/calibration/development/facilitator/D10/session.json', 'utf8')
      ),
    },
  ];
  for (const definition of definitions) {
    assert.equal(definition.source.rulesVersion, GLASSHOUSE_VERSIONS.rules);
    assert.equal(definition.source.assetsVersion, GLASSHOUSE_VERSIONS.assets);
  }
  for (const mobile of [false, true])
    for (const definition of definitions) {
      await captureCase(definition, mobile);
      if (smoke) break;
    }
  assert.equal(
    await readFile(resolve(site, 'glasshouse-offline-manifest.json'), 'utf8'),
    manifestText,
    'Artifact changed during capture.'
  );
  assert.deepEqual(result.pageErrors, []);
  assert.deepEqual(result.externalRequests, []);
  result.status = smoke ? 'smoke-only' : 'captured-engineering-evidence';
} catch (error) {
  result.status = 'failed';
  result.failure = String(error.stack || error);
  process.exitCode = 1;
} finally {
  await browser.close();
  await new Promise((done) => server.close(done));
}

await writeFile(resolve(output, 'capture-manifest.json'), json(result));
await writeFile(
  resolve(output, 'voice-transcript.md'),
  `# Unchanged handover voice transcript\n\nSpeaker: Mara Chen, duty analyst. Scenario timestamp: 06:10 / simulated minute 0.\n\n${GLASSHOUSE_HANDOVER}\n\nThis text is the actual authored handover. Browser/OS speech synthesis is not routed through the procedural WebAudio graph and was not recorded. No microphone or substitute narration was used. Local-voice availability is recorded per capture; audible voice quality/priority and human comprehension remain pending manual review.\n`
);
const rows = result.states
  .map(
    (state) =>
      `| ${state.tier} / ${state.id} | ${state.sourceMinute} → ${state.finalMinute} | ${state.viewport.width}×${state.viewport.height} / ${state.wallDurationSeconds.toFixed(2)}s | [Motion](${state.media.video.path}) | [Schematic](${state.tier}-${state.id}/schematic-before.png) · [Architecture](${state.tier}-${state.id}/architecture-before.png)${state.id === 'causal-debrief' ? ` · [Debrief](${state.tier}-${state.id}/causal-debrief.png)` : ''} | ${state.media.audioWav ? `[Actual audio](${state.media.audioWav.path})` : '[Original audio](' + state.media.nativeAudio?.path + ')'} |`
  )
  .join('\n');
await writeFile(
  resolve(output, 'README.md'),
  `# Three-state art and procedural sound evidence\n\nStatus: ${result.status}. Human art approval, comparator and voice review remain pending.\n\nCaptured the actual static app pack **${pack.version}**, at task-owned localhost port ${port}. Versions: ${JSON.stringify(GLASSHOUSE_VERSIONS)}. [Capture manifest](capture-manifest.json) records browser/renderer, before/after canonical state, scripted interactions, actual source-frame hashes, audio analysis, encoding method and file hashes. [Open the review gallery](index.html).\n\n| State/tier | Simulated minutes | Resolution / recorded wall duration | Video | Equivalent actual stills | Native procedural sound |\n| --- | --- | --- | --- | --- | --- |\n${rows}\n\nThe quiet state is a real version-pinned opening. Constrained operation imports development D08 at minute 20 through the app's validated file importer, then uses actual queued owner approval and isolation-completion updates at minutes 24 and 28. Causal debrief imports D10's completed minute-30 checkpoint and opens the real review, finding basis and unresolved work. Every directory retains source/final serialized sessions and the full final report. Zero activePlaySeconds in the archived report is an unmeasured placeholder: this is automated capture, not human play timing.\n\nStills use Playwright screenshots. Video encodes actual Chrome compositor frames into WebM in an unattached canvas; idle intervals hold the last real frame. Desktop camera changes use actual pointer drags through the product's bounded controls. Emulated mobile uses the product's fixed camera and 390×844 responsive/touch context; it is not physical-device or performance qualification. No phones were accessed. The recording canvas never appears in or alters the app.\n\nAudio is the actual native procedural effects/ambience output, tee-connected to a MediaStreamAudioDestinationNode while retaining the normal output. MediaRecorder's original Opus/WebM is preserved; the WAV is decoded real output averaged to mono PCM, with duration/RMS/peak recorded. No microphone, OS capture permission, downloaded sample or substitute sound was used. The debrief stops sound through normal navigation; its sample includes the actual preceding room tone and stopped output, not an invented review soundtrack. [Handover speaker/timestamp transcript](voice-transcript.md) remains the voice fallback; browser/OS speech is outside this graph and human voice review remains pending.\n\nThis is engineering capture of synthetic state, not a completed human comparator, art approval, field latency study or learning result. Pair schematic and architecture stills at the same source checkpoint; the changed constrained-operation final state is separately identified. Preserve this evidence with its exact pack. Regenerate on a changed artifact with ART_REVIEW_PACK explicitly set to that reviewed candidate.\n`
);
const escape = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
await writeFile(
  resolve(output, 'index.html'),
  `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Glasshouse art review evidence</title><style>body{margin:auto;max-width:1280px;padding:32px;font:17px/1.6 system-ui;background:#f1eee6;color:#263128}h1,h2{line-height:1.2}section{margin:48px 0;border-top:1px solid #8c968b;padding-top:24px}video{display:block;width:100%;background:#18231c}figure{margin:0}.pair{display:grid;grid-template-columns:1fr 1fr;gap:18px}img{width:100%;height:auto}a{color:#295a3f}audio{width:min(100%,600px)}@media(max-width:700px){.pair{grid-template-columns:1fr}body{padding:16px}}</style><h1>Glasshouse: three states for review</h1><p>Actual application capture · pack ${escape(pack.version)}. Synthetic engineering evidence. Human art/audio comparison and voice review remain pending.</p><p><a href="README.md">Methods and limits</a> · <a href="capture-manifest.json">Provenance and hashes</a> · <a href="voice-transcript.md">Unchanged voice transcript</a></p>${result.states.map((state) => `<section><h2>${escape(state.id.replaceAll('-', ' '))} · ${escape(state.tier)}</h2><p>${state.viewport.width} × ${state.viewport.height}; ${state.wallDurationSeconds.toFixed(2)} seconds. Simulated minute ${state.sourceMinute} → ${state.finalMinute}. ${state.tier === 'mobile-emulated' ? 'Responsive emulation; not physical handset evidence.' : 'Actual bounded desktop camera/UI interactions.'}</p><video controls preload="metadata" src="${state.media.video.path}" poster="${state.tier}-${state.id}/architecture-before.png"></video><p>Captured procedural sound: ${state.media.audioWav ? `<audio controls preload="metadata" src="${state.media.audioWav.path}"></audio>` : 'See the original recording in the manifest.'}</p><div class="pair"><figure><a href="${state.tier}-${state.id}/schematic-before.png"><img loading="lazy" src="${state.tier}-${state.id}/schematic-before.png" alt="Equivalent schematic at the source checkpoint"></a><figcaption>Schematic · same source state</figcaption></figure><figure><a href="${state.tier}-${state.id}/architecture-before.png"><img loading="lazy" src="${state.tier}-${state.id}/architecture-before.png" alt="Optional architecture at the same source checkpoint"></a><figcaption>Architecture · same source state</figcaption></figure></div>${state.id === 'causal-debrief' ? `<p><a href="${state.tier}-${state.id}/causal-debrief-full.png">Full causal debrief still</a></p>` : ''}<p><a href="${state.tier}-${state.id}/capture.json">State, events, encoding and audio analysis</a></p></section>`).join('')}</html>`
);
if (result.failure) process.stderr.write(`${result.failure}\n`);
else
  process.stdout.write(
    `Art review capture ${result.status}: ${result.states.length} clips in ${output}\n`
  );
