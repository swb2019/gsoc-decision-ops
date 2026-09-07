import { test, expect } from '@playwright/test';
// Native recording, silence detection, decoding and audio playback; deterministic ASR/TTS
// adapters isolate the conversation contract from recognition quality and model downloads.
export async function setup(page, path) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    localStorage.setItem(
      'hourglass-local-voice-config',
      JSON.stringify({ enabled: false, sttEnabled: true, ttsEnabled: true })
    );
    window.__conversation = { texts: [], replies: [], streams: [], calls: 0 };
    navigator.mediaDevices.getUserMedia = async () => {
      const context = new AudioContext();
      await context.resume();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      gain.gain.value = 0;
      const destination = context.createMediaStreamDestination();
      oscillator.connect(gain).connect(destination);
      oscillator.start();
      window.__conversation.streams.push(destination.stream);
      window.__conversation.gain = gain;
      destination.stream.getTracks()[0].addEventListener('ended', () => context.close());
      return destination.stream;
    };
  });
  await page.route('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.1', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: `export const env={}; export async function pipeline(){ return async(audio)=>{window.__conversation.calls++;return {text:window.__conversation.texts.shift()||''};};}`,
    })
  );
  await page.route('https://cdn.jsdelivr.net/npm/kokoro-js@1.2.0/+esm', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: `export const KokoroTTS={from_pretrained:async()=>({generate:async(text)=>{
      window.__conversation.replies.push(text);
      const buffer=new ArrayBuffer(44+4800); const v=new DataView(buffer);
      const word=(at,s)=>[...s].forEach((c,i)=>v.setUint8(at+i,c.charCodeAt(0)));
      word(0,'RIFF');v.setUint32(4,buffer.byteLength-8,true);word(8,'WAVE');word(12,'fmt ');
      v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,24000,true);
      v.setUint32(28,48000,true);v.setUint16(32,2,true);v.setUint16(34,16,true);word(36,'data');v.setUint32(40,4800,true);
      return {toBlob:async()=>new Blob([buffer],{type:'audio/wav'})};
    }})};`,
    })
  );
  if (path.includes('scenarios')) {
    await page.clock.install();
    await page.clock.resume();
  }
  await page.goto(path);
  test.skip(
    !(await page.evaluate(() => Boolean(window.AudioContext && window.MediaRecorder))),
    'This engine build lacks native recording; Chromium and Firefox cover the conversation recorder path.'
  );
  const panel = page.getByRole('region', { name: 'Ongoing two-way voice' });
  await panel.getByRole('button', { name: 'Voice setup', exact: true }).click();
  await panel.getByRole('switch', { name: 'Enable two-way audio', exact: true }).click();
  await expect(panel.getByRole('button', { name: 'Start conversation', exact: true })).toBeEnabled({
    timeout: 20000,
  });
  await panel.getByRole('button', { name: 'Close two-way audio settings' }).click();
  await panel.getByRole('button', { name: 'Start conversation', exact: true }).click();
  return panel;
}

export async function utter(page, text, reply) {
  const panel = page.getByRole('region', { name: 'Ongoing two-way voice' });
  await expect(panel.getByRole('status')).toHaveText('Listening — speak naturally', {
    timeout: 20000,
  });
  const count = await page.evaluate((text) => {
    window.__conversation.texts.push(text);
    window.__conversation.gain.gain.value = 0.12;
    return window.__conversation.calls;
  }, text);
  await page.waitForTimeout(650);
  await page.evaluate(() => {
    window.__conversation.gain.gain.value = 0;
  });
  await expect
    .poll(() => page.evaluate(() => window.__conversation.calls), { timeout: 20000 })
    .toBe(count + 1);
  if (reply)
    await expect
      .poll(() => page.evaluate(() => window.__conversation.replies.join('\n')), { timeout: 20000 })
      .toMatch(reply);
}
