/**
 * Browser-side policy for Whisper + Kokoro first-enable.
 *
 * First provision can OOM Chromium: two ONNX stacks (~230MB weights) load on the
 * main thread, and fp32 encoder/Kokoro plus download buffers spike heap. Retry
 * often works because Cache Storage already holds the shards.
 */

export type InferenceDevice = 'webgpu' | 'wasm';

export const PROGRESS_THROTTLE_MS = 200;
export const INTER_MODEL_YIELD_MS = 150;
export const CDN_SCRIPT_TIMEOUT_MS = 45_000;

/** Skip Kokoro (use Web Speech) when JS heap is already this full after Whisper. */
export const HEAP_PRESSURE_RATIO = 0.55;

/** Absolute used-heap ceiling before attempting the second model (~1.2 GiB). */
export const HEAP_PRESSURE_BYTES = 1.2 * 1024 * 1024 * 1024;

export interface HeapMeasurement {
  usedJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export function isMemoryError(error: unknown): boolean {
  if (error instanceof RangeError) return true;
  const name = error instanceof Error ? error.name : '';
  if (name === 'RuntimeError' || name === 'WebAssembly.RuntimeError') return true;
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /out of memory|\booms?\b|ENOMEM|unable to allocate|memory access out of bounds|Aborted\(OOM\)|Failed to start the application/i.test(
    message
  );
}

export function isHeapUnderPressure(memory?: HeapMeasurement | null): boolean {
  if (!memory || memory.jsHeapSizeLimit <= 0) return false;
  if (memory.usedJSHeapSize / memory.jsHeapSizeLimit >= HEAP_PRESSURE_RATIO) return true;
  return memory.usedJSHeapSize >= HEAP_PRESSURE_BYTES;
}

/**
 * Prefer WebGPU when it is available and the machine is not low-RAM.
 * Low-RAM devices keep the GPU for the existing WebGL COP and run models on WASM.
 */
export function pickInferenceDevice(
  webGpuAvailable: boolean,
  deviceMemoryGb?: number
): InferenceDevice {
  if (!webGpuAvailable) return 'wasm';
  if (deviceMemoryGb !== undefined && deviceMemoryGb > 0 && deviceMemoryGb < 4) {
    return 'wasm';
  }
  return 'webgpu';
}

/** Quantized Whisper dtypes — fp32 encoder is the first-enable memory spike. */
export function getWhisperDtype(): { encoder_model: 'q8'; decoder_model_merged: 'q4' } {
  return {
    encoder_model: 'q8',
    decoder_model_merged: 'q4',
  };
}

/** Kokoro q8 on both WASM and WebGPU (fp32 doubles peak with Whisper still resident). */
export function getKokoroDtype(): 'q8' {
  return 'q8';
}

export function shouldSkipKokoro(opts: {
  whisperMemoryError: boolean;
  heapUnderPressure: boolean;
}): boolean {
  return opts.whisperMemoryError || opts.heapUnderPressure;
}

export function shouldReuseInMemoryModels(opts: {
  whisperLoaded: boolean;
  kokoroLoaded: boolean;
}): boolean {
  return opts.whisperLoaded || opts.kokoroLoaded;
}
