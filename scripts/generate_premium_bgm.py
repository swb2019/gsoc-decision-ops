#!/usr/bin/env python3
"""
Premium Ambient BGM Generator for Hourglass Command
Generates high-quality procedural ambient music suitable for ops games.

Design goals:
- Low ambient GSOC ops bed
- Subtle pulse, no melody earworm
- Loopable 45-60s seamless
- Stereo OGG
- Quieter mix (~-20 LUFS feel)
- NOT a single-tone hum: layered filtered noise + soft pads + light rhythmic ticks
"""

import numpy as np
from scipy import signal
from scipy.io import wavfile
import subprocess
import os

SAMPLE_RATE = 48000  # Higher quality than 32kHz
DURATION = 52  # Seconds - good loop length
OUTPUT_DIR = "/workspace/apps/web/public/audio"


def pink_noise(samples: int) -> np.ndarray:
    """Generate pink noise using the Voss-McCartney algorithm."""
    # Pink noise has equal energy per octave
    white = np.random.randn(samples)
    
    # Apply 1/f filter
    b = [0.049922035, -0.095993537, 0.050612699, -0.004408786]
    a = [1, -2.494956002, 2.017265875, -0.522189400]
    
    pink = signal.lfilter(b, a, white)
    return pink / np.max(np.abs(pink) + 1e-10)


def brown_noise(samples: int) -> np.ndarray:
    """Generate brown noise (random walk, integrated white noise)."""
    white = np.random.randn(samples)
    brown = np.cumsum(white)
    # High-pass to remove DC drift
    b, a = signal.butter(2, 20 / (SAMPLE_RATE / 2), btype='high')
    brown = signal.filtfilt(b, a, brown)
    return brown / np.max(np.abs(brown) + 1e-10)


def soft_pad(freq: float, samples: int, attack: float = 2.0, release: float = 2.0) -> np.ndarray:
    """Generate a soft synth pad with smooth envelope."""
    t = np.arange(samples) / SAMPLE_RATE
    
    # Slight detuning for warmth
    detune = 0.002
    osc1 = np.sin(2 * np.pi * freq * t)
    osc2 = np.sin(2 * np.pi * freq * (1 + detune) * t)
    osc3 = np.sin(2 * np.pi * freq * (1 - detune) * t)
    
    # Combine with different weights
    pad = 0.5 * osc1 + 0.3 * osc2 + 0.2 * osc3
    
    # Add subtle harmonics
    pad += 0.1 * np.sin(2 * np.pi * freq * 2 * t)  # Octave
    pad += 0.05 * np.sin(2 * np.pi * freq * 3 * t)  # Fifth
    
    # Apply envelope
    env = np.ones(samples)
    attack_samples = int(attack * SAMPLE_RATE)
    release_samples = int(release * SAMPLE_RATE)
    
    # Smooth attack
    env[:attack_samples] = np.linspace(0, 1, attack_samples) ** 2
    # Smooth release
    env[-release_samples:] = np.linspace(1, 0, release_samples) ** 2
    
    return pad * env


def subtle_pulse(samples: int, bpm: float = 30) -> np.ndarray:
    """Generate a very subtle rhythmic pulse - not mechanical, organic feel."""
    beat_interval = int(60 / bpm * SAMPLE_RATE)
    pulse = np.zeros(samples)
    
    t_single = np.arange(int(SAMPLE_RATE * 0.3)) / SAMPLE_RATE
    # Soft sine-based pulse, not a click
    single_pulse = np.sin(2 * np.pi * 80 * t_single) * np.exp(-t_single * 8)
    
    # Add pulses with slight timing variation (humanization)
    pos = 0
    while pos < samples - len(single_pulse):
        # Random timing variation ±5%
        jitter = int(beat_interval * 0.05 * (np.random.rand() - 0.5))
        pulse[pos:pos + len(single_pulse)] += single_pulse * (0.8 + 0.2 * np.random.rand())
        pos += beat_interval + jitter
    
    return pulse / (np.max(np.abs(pulse)) + 1e-10)


def tick_layer(samples: int) -> np.ndarray:
    """Very subtle high-frequency ticks for texture."""
    ticks = np.zeros(samples)
    
    # Sparse ticks - roughly every 2-4 seconds
    num_ticks = int(DURATION / 3)
    positions = np.sort(np.random.randint(int(SAMPLE_RATE * 0.5), samples - SAMPLE_RATE, num_ticks))
    
    t_tick = np.arange(int(SAMPLE_RATE * 0.02)) / SAMPLE_RATE
    single_tick = np.sin(2 * np.pi * 2000 * t_tick) * np.exp(-t_tick * 200)
    
    for pos in positions:
        if pos + len(single_tick) < samples:
            ticks[pos:pos + len(single_tick)] += single_tick * (0.3 + 0.4 * np.random.rand())
    
    return ticks / (np.max(np.abs(ticks)) + 1e-10)


def lfo(samples: int, freq: float, depth: float = 1.0) -> np.ndarray:
    """Generate low-frequency oscillator for modulation."""
    t = np.arange(samples) / SAMPLE_RATE
    return (1 + depth * np.sin(2 * np.pi * freq * t)) / 2


def create_seamless_loop(audio: np.ndarray, crossfade_duration: float = 3.0) -> np.ndarray:
    """Create a seamless loop with crossfade."""
    crossfade_samples = int(crossfade_duration * SAMPLE_RATE)
    
    # Copy the beginning to the end for crossfade
    fade_in = np.linspace(0, 1, crossfade_samples) ** 2
    fade_out = np.linspace(1, 0, crossfade_samples) ** 2
    
    # Apply crossfade
    audio[-crossfade_samples:] = (
        audio[-crossfade_samples:] * fade_out +
        audio[:crossfade_samples] * fade_in
    )
    
    return audio


def generate_ambient_bgm():
    """Generate the complete ambient BGM."""
    print("Generating premium ambient BGM for Hourglass Command...")
    print(f"Sample rate: {SAMPLE_RATE} Hz")
    print(f"Duration: {DURATION} seconds")
    print()
    
    samples = DURATION * SAMPLE_RATE
    
    # Layer 1: Filtered brown noise for deep ambient bed
    print("  Creating brown noise layer...")
    brown = brown_noise(samples)
    # Low-pass filter for warmth
    b, a = signal.butter(4, 200 / (SAMPLE_RATE / 2), btype='low')
    brown_filtered = signal.filtfilt(b, a, brown)
    # Apply slow LFO modulation to volume
    brown_mod = brown_filtered * lfo(samples, 0.05, 0.3)
    
    # Layer 2: Pink noise with bandpass for texture
    print("  Creating pink noise layer...")
    pink = pink_noise(samples)
    # Bandpass 100-800 Hz for mid-range warmth
    b, a = signal.butter(3, [100 / (SAMPLE_RATE / 2), 800 / (SAMPLE_RATE / 2)], btype='band')
    pink_filtered = signal.filtfilt(b, a, pink)
    # Different LFO rate for movement
    pink_mod = pink_filtered * lfo(samples, 0.03, 0.4)
    
    # Layer 3: High filtered noise for air/presence
    print("  Creating air layer...")
    air = pink_noise(samples)
    b, a = signal.butter(3, [2000 / (SAMPLE_RATE / 2), 6000 / (SAMPLE_RATE / 2)], btype='band')
    air_filtered = signal.filtfilt(b, a, air)
    air_mod = air_filtered * lfo(samples, 0.02, 0.5)
    
    # Layer 4: Soft pad chord (C minor voicing for ops feel)
    print("  Creating pad layers...")
    # Low C (65.4 Hz)
    pad_low = soft_pad(65.4, samples, attack=3.0, release=3.0)
    # G (98 Hz)
    pad_fifth = soft_pad(98.0, samples, attack=2.5, release=2.5)
    # Eb (77.8 Hz) for minor feel
    pad_third = soft_pad(77.8, samples, attack=2.0, release=3.0)
    
    # Modulate pads with different LFOs
    pad_low_mod = pad_low * lfo(samples, 0.04, 0.2)
    pad_fifth_mod = pad_fifth * lfo(samples, 0.06, 0.25)
    pad_third_mod = pad_third * lfo(samples, 0.05, 0.2)
    
    # Layer 5: Subtle pulse
    print("  Creating subtle pulse...")
    pulse = subtle_pulse(samples, bpm=28)  # Very slow
    b, a = signal.butter(3, 150 / (SAMPLE_RATE / 2), btype='low')
    pulse_filtered = signal.filtfilt(b, a, pulse)
    
    # Layer 6: Texture ticks
    print("  Creating tick layer...")
    ticks = tick_layer(samples)
    
    # Mix layers with careful gain staging
    print("  Mixing layers...")
    mix = (
        brown_mod * 0.25 +           # Deep bed
        pink_mod * 0.15 +            # Mid warmth
        air_mod * 0.03 +             # Air/presence
        pad_low_mod * 0.12 +         # Low pad
        pad_fifth_mod * 0.08 +       # Fifth
        pad_third_mod * 0.06 +       # Third
        pulse_filtered * 0.04 +      # Very subtle pulse
        ticks * 0.015                # Barely audible ticks
    )
    
    # Create stereo with subtle width
    print("  Creating stereo image...")
    # Offset copy for stereo width
    offset = int(SAMPLE_RATE * 0.015)  # 15ms delay for width
    left = mix
    right = np.roll(mix, offset)
    
    # Add subtle stereo difference with different noise
    stereo_diff = pink_noise(samples) * 0.02
    left = left + stereo_diff * 0.5
    right = right - stereo_diff * 0.5
    
    # Combine to stereo
    stereo = np.column_stack([left, right])
    
    # Make seamless loop
    print("  Creating seamless loop...")
    stereo[:, 0] = create_seamless_loop(stereo[:, 0], crossfade_duration=4.0)
    stereo[:, 1] = create_seamless_loop(stereo[:, 1], crossfade_duration=4.0)
    
    # Final limiting and normalization
    print("  Applying final processing...")
    # Soft clip/limit
    stereo = np.tanh(stereo * 2) / 2
    
    # Normalize to target level (~-20 LUFS feel, peak around -6 dBFS)
    peak = np.max(np.abs(stereo))
    target_peak = 0.5  # -6 dBFS
    stereo = stereo * (target_peak / peak)
    
    # Convert to 16-bit
    stereo_int16 = (stereo * 32767).astype(np.int16)
    
    # Save as WAV first
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    wav_path = os.path.join(OUTPUT_DIR, "ambientBGM_premium.wav")
    wavfile.write(wav_path, SAMPLE_RATE, stereo_int16)
    print(f"  Saved WAV: {wav_path}")
    
    # Convert to high-quality OGG
    ogg_path = os.path.join(OUTPUT_DIR, "ambientBGM_v2.ogg")
    result = subprocess.run([
        'ffmpeg', '-y', '-i', wav_path,
        '-c:a', 'libvorbis', '-q:a', '6',  # High quality
        '-ar', '48000',  # Keep 48kHz
        ogg_path
    ], capture_output=True, text=True)
    
    if os.path.exists(ogg_path):
        os.remove(wav_path)
        print(f"  Saved OGG: {ogg_path}")
        
        # Get file info
        info = subprocess.run(
            ['ffprobe', '-hide_banner', ogg_path],
            capture_output=True, text=True
        )
        print(f"\n{info.stderr}")
    else:
        print(f"  OGG conversion failed: {result.stderr}")
        
    return ogg_path


if __name__ == "__main__":
    generate_ambient_bgm()
    print("\n✓ Premium BGM generation complete!")
