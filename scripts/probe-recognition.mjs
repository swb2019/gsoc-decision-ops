import { chromium } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
const sample = (await readFile(process.argv[2])).toString('base64');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
page.on('console', (message) => console.log(message.text().slice(0, 500)));
try {
  await page.goto('http://127.0.0.1:4198/gsoc-decision-ops/');
  const results = await page.evaluate(async (sample) => {
    const { pipeline, env } =
      await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.1');
    env.allowLocalModels = false;
    const audio = new AudioContext({ sampleRate: 16000 });
    const buffer = await audio.decodeAudioData(
      Uint8Array.from(atob(sample), (c) => c.charCodeAt(0)).buffer
    );
    const input = buffer.getChannelData(0);
    const results = [];
    for (const options of [
      { device: 'webgpu', dtype: { encoder_model: 'q8', decoder_model_merged: 'q4' } },
      { device: 'webgpu', dtype: { encoder_model: 'fp32', decoder_model_merged: 'q4' } },
      { device: 'wasm', dtype: { encoder_model: 'q8', decoder_model_merged: 'q4' } },
    ]) {
      let model;
      try {
        model = await pipeline(
          'automatic-speech-recognition',
          'onnx-community/whisper-base',
          options
        );
        const started = performance.now();
        const result = await model(input, {
          language: 'en',
          task: 'transcribe',
          return_timestamps: false,
        });
        results.push({
          ...options,
          samples: input.length,
          result,
          ms: performance.now() - started,
        });
      } catch (error) {
        results.push({ ...options, error: String(error) });
      } finally {
        await model?.dispose();
      }
      console.log(JSON.stringify(results.at(-1)));
    }
    await audio.close();
    return results;
  }, sample);
  await writeFile('qa-output/real-voice/backend-probe.json', JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
