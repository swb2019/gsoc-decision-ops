import { describe, expect, it } from 'vitest';
import {
  getKokoroDtype,
  getWhisperDtype,
  HEAP_PRESSURE_BYTES,
  HEAP_PRESSURE_RATIO,
  isHeapUnderPressure,
  isMemoryError,
  pickInferenceDevice,
  shouldReuseInMemoryModels,
  shouldSkipKokoro,
} from './local-voice-load-policy';

describe('isMemoryError', () => {
  it('treats RangeError and WASM runtime errors as memory failures', () => {
    expect(isMemoryError(new RangeError('Array buffer allocation failed'))).toBe(true);
    const wasmErr = new Error('memory access out of bounds');
    wasmErr.name = 'RuntimeError';
    expect(isMemoryError(wasmErr)).toBe(true);
  });

  it('matches common OOM message shapes', () => {
    expect(isMemoryError(new Error('Out of memory'))).toBe(true);
    expect(isMemoryError(new Error('Aborted(OOM)'))).toBe(true);
    expect(isMemoryError(new Error('Unable to allocate 1GB'))).toBe(true);
  });

  it('does not flag ordinary load failures', () => {
    expect(isMemoryError(new Error('Failed to load Transformers.js from CDN'))).toBe(false);
    expect(isMemoryError(new Error('404 Not Found'))).toBe(false);
    expect(isMemoryError(null)).toBe(false);
  });
});

describe('isHeapUnderPressure', () => {
  it('is false when Chrome heap telemetry is missing', () => {
    expect(isHeapUnderPressure(undefined)).toBe(false);
    expect(isHeapUnderPressure(null)).toBe(false);
    expect(isHeapUnderPressure({ usedJSHeapSize: 1, jsHeapSizeLimit: 0 })).toBe(false);
  });

  it('trips when used heap crosses the ratio of the limit', () => {
    const limit = 2 * 1024 * 1024 * 1024;
    expect(
      isHeapUnderPressure({
        usedJSHeapSize: Math.ceil(limit * HEAP_PRESSURE_RATIO),
        jsHeapSizeLimit: limit,
      })
    ).toBe(true);
    expect(
      isHeapUnderPressure({
        usedJSHeapSize: Math.floor(limit * (HEAP_PRESSURE_RATIO - 0.2)),
        jsHeapSizeLimit: limit,
      })
    ).toBe(false);
  });

  it('trips on absolute used-heap ceiling', () => {
    expect(
      isHeapUnderPressure({
        usedJSHeapSize: HEAP_PRESSURE_BYTES,
        jsHeapSizeLimit: 4 * 1024 * 1024 * 1024,
      })
    ).toBe(true);
  });
});

describe('pickInferenceDevice', () => {
  it('uses wasm when WebGPU is missing', () => {
    expect(pickInferenceDevice(false, 8)).toBe('wasm');
  });

  it('uses wasm on low-RAM machines so WebGL COP keeps the GPU', () => {
    expect(pickInferenceDevice(true, 2)).toBe('wasm');
    expect(pickInferenceDevice(true, 3.5)).toBe('wasm');
  });

  it('uses webgpu when available on typical desktops', () => {
    expect(pickInferenceDevice(true, 8)).toBe('webgpu');
    expect(pickInferenceDevice(true, undefined)).toBe('webgpu');
  });
});

describe('model dtypes and skip/reuse', () => {
  it('quantizes Whisper encoder and Kokoro', () => {
    expect(getWhisperDtype()).toEqual({
      encoder_model: 'q8',
      decoder_model_merged: 'q4',
    });
    expect(getKokoroDtype()).toBe('q8');
  });

  it('skips Kokoro after a Whisper OOM or heap pressure', () => {
    expect(shouldSkipKokoro({ whisperMemoryError: true, heapUnderPressure: false })).toBe(true);
    expect(shouldSkipKokoro({ whisperMemoryError: false, heapUnderPressure: true })).toBe(true);
    expect(shouldSkipKokoro({ whisperMemoryError: false, heapUnderPressure: false })).toBe(false);
  });

  it('reuses whichever model is still in memory after disable', () => {
    expect(shouldReuseInMemoryModels({ whisperLoaded: true, kokoroLoaded: false })).toBe(true);
    expect(shouldReuseInMemoryModels({ whisperLoaded: false, kokoroLoaded: true })).toBe(true);
    expect(shouldReuseInMemoryModels({ whisperLoaded: false, kokoroLoaded: false })).toBe(false);
  });
});
