import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';

const root = 'qa-output/art-review';
const manifest = JSON.parse(await readFile(`${root}/capture-manifest.json`, 'utf8'));
assert.equal(manifest.status, 'captured-engineering-evidence');
assert.equal(manifest.states.length, 6);
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
const results = { pack: manifest.pack, status: 'pending', browser: browser.version(), clips: [] };
try {
  const page = await browser.newPage();
  await page.goto(process.env.ART_REVIEW_URL || 'http://127.0.0.1:4196/');
  for (const state of manifest.states) {
    for (const file of Object.values(state.media)) {
      const bytes = await readFile(`${root}/${file.path}`);
      assert.equal(bytes.length, file.bytes);
      assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256);
      if (file.path.endsWith('.webm'))
        assert.equal(bytes.subarray(0, 4).toString('hex'), '1a45dfa3');
    }
    const playback = await page.evaluate(async (path) => {
      const video = [...document.querySelectorAll('video')].find(
        (item) => item.getAttribute('src') === path
      );
      video.muted = true;
      await video.play();
      const waitFor = async (predicate) => {
        const start = performance.now();
        while (!predicate()) {
          if (video.error) throw new Error(video.error.message);
          if (performance.now() - start > 15000) throw new Error('Video playback timed out');
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      };
      await waitFor(() => video.currentTime > 0.2);
      video.currentTime = 18;
      await waitFor(() => video.currentTime > 18.1 && !video.seeking);
      video.pause();
      return {
        width: video.videoWidth,
        height: video.videoHeight,
        time: video.currentTime,
        duration: Number.isFinite(video.duration) ? video.duration : 'streaming-duration',
        decodedFrames: video.getVideoPlaybackQuality().totalVideoFrames,
        error: video.error,
      };
    }, state.media.video.path);
    assert.equal(playback.width, state.viewport.width);
    assert.equal(playback.height, state.viewport.height);
    assert.ok(playback.decodedFrames > 1);
    assert.equal(playback.error, null);
    results.clips.push({ path: state.media.video.path, ...playback });
  }
  results.status = 'passed';
} finally {
  await browser.close();
  await writeFile(`${root}/playback-verification.json`, JSON.stringify(results, null, 2) + '\n');
}
console.log(JSON.stringify(results, null, 2));
