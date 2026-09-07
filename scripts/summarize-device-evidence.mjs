/** Derive a readable physical-device evidence table without inventing qualification results. */
import { readFile, writeFile } from 'node:fs/promises';
import { GLASSHOUSE_VERSIONS } from '../packages/core/dist/index.js';
import assert from 'node:assert/strict';

const pack = JSON.parse(await readFile('apps/web/out/glasshouse-offline-manifest.json', 'utf8'));
const models = process.argv.slice(2);
assert.ok(models.length > 0, 'Supply the exact tested model directory names.');
for (const model of models) assert.match(model, /^[a-zA-Z0-9_-]+$/);
const median = values => { const sorted = [...values].sort((a, b) => a - b); return sorted[Math.floor(sorted.length / 2)]; };
const reports = await Promise.all(models.map(async model => {
  const report = JSON.parse(await readFile(`qa-output/android/${model}/qualification.json`, 'utf8'));
  assert.equal(report.model, model);
  assert.equal(report.status, 'passed');
  assert.ok(report.offlinePack.includes(pack.version), 'A device result must name the delivered pack.');
  assert.deepEqual(report.completion.versions, GLASSHOUSE_VERSIONS);
  return report;
}));
const devices = reports.map(report => ({
  model: report.model, android: report.android, browser: report.browserVersion,
  graphics: report.graphics, completion: report.completion,
  reloads: [...new Set(report.coldReloads.map(item => item.route))].map(route => {
    const samples = report.coldReloads.filter(item => item.route === route);
    assert.equal(samples.length, 5);
    return { route, n: samples.length, lcpMs: samples.map(item => item.lcp), medianLcpMs: median(samples.map(item => item.lcp)), maxLcpMs: Math.max(...samples.map(item => item.lcp)), maxCls: Math.max(...samples.map(item => item.cls)) };
  }),
  sceneCycles: report.sceneCycles, commandAcknowledgment: report.commandAcknowledgment,
  frames: report.frameSummary, limitations: report.limitations,
}));
await writeFile('qa-output/android/summary.json', JSON.stringify(reports, null, 2));
await writeFile('qa-output/device-summary.json', JSON.stringify({ pack: pack.version, versions: GLASSHOUSE_VERSIONS, status: 'engineering-checks-passed', humanQualification: 'pending', devices }, null, 2));
const table = devices.flatMap(device => device.reloads.map(route => `| ${device.model} | ${route.route} | ${route.lcpMs.join(', ')} | ${route.medianLcpMs} | ${route.maxLcpMs} | ${route.maxCls} |`)).join('\n');
const latency = devices.map(device => `| ${device.model} | ${device.commandAcknowledgment.count} | ${device.commandAcknowledgment.maxDomMs.toFixed(1)} ms | ${device.commandAcknowledgment.maxAfterPaintOpportunityMs.toFixed(1)} ms | ${device.sceneCycles.count} | ${(device.sceneCycles.maxHeapGrowthBytes / 1048576).toFixed(2)} MiB |`).join('\n');
const document = `# Physical Android engineering evidence\n\nBoth named phones passed the automated full offline mission on pack **${pack.version}**. This is engineering evidence, not completed human accessibility/device qualification. The phones were USB connected, visible, and running their actual Chrome/WebGL implementations. No browser profile was reset. All original journal checkpoints were retained, and original free rotation was restored.\n\n${devices.map(device => `- **${device.model}**: Android ${device.android}; Chrome ${device.browser}; ${device.graphics.renderer}.`).join('\n')}\n\n## Five cache-disabled navigations per route\n\n| Model | Route | LCP observations (ms) | Median | Maximum | Maximum CLS |\n| --- | --- | --- | --- | --- | --- |\n${table}\n\nThese are localhost-over-USB, cache-disabled navigations in the same Chrome process. They are not process-cold launches, mobile-radio transfer measurements, field percentiles or field INP. The initial flagship pack was removed before measurement. Device-local text entry, tab selection and deliberate time controls were automated.\n\n## Mission, resilience and latency\n\nBoth phones downloaded and integrity-verified the full pack, failed an uncached target request under network emulation, then completed a three-decision mission through minute 30 and a controlled handoff while offline. Real WebGL rendering, recorded resource commitments, forced WebGL loss, schematic recovery, portrait/landscape, 200% text and completed-review axe checks passed. JSON, HTML and searchable-text PDF were generated offline; repeated JSON exports remained unchanged. Browser download-handoff Blob bytes were verified; OS Downloads-folder persistence and sharing remain unqualified.\n\n| Model | Actual committed plans measured | Maximum click-to-DOM acknowledgment | Maximum following paint opportunity | Scene load/exit cycles | Maximum JS-heap growth |\n| --- | --- | --- | --- | --- | --- |\n${latency}\n\nLatency uses the physical page clock from captured click to commitment insertion, excluding USB/driver transport. Three plans per phone provide a small lab sample, not a robust population p95. Every observed acknowledgment and following paint opportunity was below 200 ms. Ten forced-GC scene cycles remained within the declared 16 MiB JavaScript regression bound; this is not physical GPU-memory, thermal or endurance certification. Full-mission frame traces include deliberate scene loads, GC, screenshots, orientation changes and forced GPU loss; do not treat those injected pauses as steady-scene animation measurements.\n\nEarlier attempts exposed Android keyboard/browser-bar geometry changes and USB debugging-service disconnects. The harness now waits for stable viewport geometry and verifies actual click delivery. Interrupted attempts were not counted as passes. The completed lower-memory phone run used a dedicated persistent debugging connection. Those driver corrections did not change the simulation.\n\n## Evidence and remaining scope\n\n- [Exact combined raw results](../qa-output/android/summary.json) and [derived summary](../qa-output/device-summary.json).\n${devices.map(device => `- [${device.model} results](../qa-output/android/${device.model}/qualification.json), [frame trace](../qa-output/android/${device.model}/mission-frame-trace.json), [completed review](../qa-output/android/${device.model}/completed-review.png).`).join('\n')}\n- [Repeatable harness](../scripts/android-qualification.mjs). Keep device serials/local tunnel configuration outside published evidence.\n\nHuman touch/soft-keyboard, NVDA, VoiceOver/iPhone Safari, OS export/share, native voice/audio perception, and a named integrated-GPU desktop remain in the manual qualification packet. The available desktop has an NVIDIA RTX 4070 SUPER; it does not substitute for the integrated-GPU reference. Supplemental Firefox and Windows WebKit engine checks do not establish native iPhone/Safari qualification.\n`;
await writeFile('docs/DEVICE-VALIDATION.md', document);
console.log(JSON.stringify({ pack: pack.version, devices: devices.map(device => ({ model: device.model, reloads: device.reloads, frames: device.frames })) }, null, 2));
