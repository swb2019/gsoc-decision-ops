#!/usr/bin/env python3
"""
Generate melodic ambient background music for Hourglass Command.

This creates actual musical content with clear midrange frequencies,
NOT a bass drone/hum. Features:
- Soft arpeggio patterns over Am or Cm
- Moving pad chords with LFO modulation
- Light pulse/tick rhythm
- Pleasant fast-casual ops vibe
- Loopable 30-60 seconds
- Target ~-18 to -24 LUFS (sits under SFX)

Acceptance test: FFT top peaks should include 100-800Hz musical fundamentals.
"""

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, filtfilt, resample
import subprocess
import os

# Audio parameters
SAMPLE_RATE = 48000
DURATION = 45  # seconds (loopable)
OUTPUT_WAV = '/tmp/melodic_bgm.wav'
OUTPUT_OGG = 'apps/web/public/audio/ambientBGM_v3.ogg'


def note_to_freq(note: str) -> float:
    """Convert note name to frequency (A4 = 440Hz)."""
    notes = {'C': -9, 'D': -7, 'E': -5, 'F': -4, 'G': -2, 'A': 0, 'B': 2}
    name = note[0].upper()
    octave = int(note[-1])
    semitone = notes[name]
    if len(note) == 3:
        if note[1] == '#':
            semitone += 1
        elif note[1] == 'b':
            semitone -= 1
    return 440.0 * (2 ** ((semitone + (octave - 4) * 12) / 12))


def generate_sine(freq: float, duration: float, sr: int) -> np.ndarray:
    """Generate a pure sine wave."""
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    return np.sin(2 * np.pi * freq * t)


def generate_triangle(freq: float, duration: float, sr: int) -> np.ndarray:
    """Generate a triangle wave (softer than square)."""
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    return 2 * np.abs(2 * (t * freq - np.floor(t * freq + 0.5))) - 1


def adsr_envelope(length: int, attack: float, decay: float, sustain: float, release: float, sr: int) -> np.ndarray:
    """Create ADSR envelope."""
    attack_samples = int(attack * sr)
    decay_samples = int(decay * sr)
    release_samples = int(release * sr)
    sustain_samples = max(0, length - attack_samples - decay_samples - release_samples)
    
    envelope = np.zeros(length)
    
    # Attack
    if attack_samples > 0:
        envelope[:attack_samples] = np.linspace(0, 1, attack_samples)
    
    # Decay
    start = attack_samples
    end = start + decay_samples
    if decay_samples > 0 and end <= length:
        envelope[start:end] = np.linspace(1, sustain, decay_samples)
    
    # Sustain
    start = attack_samples + decay_samples
    end = start + sustain_samples
    if sustain_samples > 0 and end <= length:
        envelope[start:end] = sustain
    
    # Release
    start = attack_samples + decay_samples + sustain_samples
    if release_samples > 0 and start < length:
        release_len = min(release_samples, length - start)
        envelope[start:start + release_len] = np.linspace(sustain, 0, release_len)
    
    return envelope


def lowpass_filter(signal: np.ndarray, cutoff: float, sr: int, order: int = 4) -> np.ndarray:
    """Apply lowpass filter."""
    nyq = sr / 2
    normalized_cutoff = min(cutoff / nyq, 0.99)
    b, a = butter(order, normalized_cutoff, btype='low')
    return filtfilt(b, a, signal)


def generate_arpeggio(chord_notes: list, duration: float, sr: int, tempo_bpm: float = 80) -> np.ndarray:
    """Generate a soft arpeggio pattern."""
    samples = int(duration * sr)
    output = np.zeros(samples)
    
    beat_duration = 60.0 / tempo_bpm
    note_duration = beat_duration / 2  # Eighth notes
    note_samples = int(note_duration * sr)
    
    # Create arpeggio pattern (up then down)
    pattern = list(range(len(chord_notes))) + list(range(len(chord_notes) - 2, 0, -1))
    
    pos = 0
    pattern_idx = 0
    
    while pos < samples:
        note_idx = pattern[pattern_idx % len(pattern)]
        freq = chord_notes[note_idx]
        
        # Generate note with envelope
        note_len = min(note_samples, samples - pos)
        note = generate_triangle(freq, note_duration, sr)[:note_len]
        
        # Soft ADSR envelope
        env = adsr_envelope(len(note), 0.02, 0.1, 0.4, 0.15, sr)
        note = note * env
        
        # Add to output
        output[pos:pos + len(note)] += note * 0.3
        
        pos += note_samples
        pattern_idx += 1
    
    # Soft filtering for warmth
    output = lowpass_filter(output, 3000, sr)
    
    return output


def generate_pad_chord(notes: list, duration: float, sr: int) -> np.ndarray:
    """Generate warm pad chord with slow LFO modulation."""
    samples = int(duration * sr)
    output = np.zeros(samples)
    t = np.linspace(0, duration, samples, endpoint=False)
    
    # LFO for volume modulation (slow breathing)
    lfo = 0.5 + 0.3 * np.sin(2 * np.pi * 0.15 * t)  # 0.15 Hz LFO
    
    for note_freq in notes:
        # Layer sine + soft triangle for richer pad sound
        wave = 0.7 * generate_sine(note_freq, duration, sr)
        wave += 0.3 * generate_triangle(note_freq, duration, sr)
        
        # Apply LFO
        wave = wave * lfo
        
        output += wave
    
    # Normalize
    output = output / len(notes)
    
    # Warm filter with slow modulation
    # Use static filter since dynamic is complex
    output = lowpass_filter(output, 1500, sr)
    
    # Soft envelope for the whole pad
    fade_samples = int(2.0 * sr)
    fade_in = np.linspace(0, 1, fade_samples)
    fade_out = np.linspace(1, 0, fade_samples)
    output[:fade_samples] *= fade_in
    output[-fade_samples:] *= fade_out
    
    return output * 0.25


def generate_soft_pulse(duration: float, sr: int, bpm: float = 72) -> np.ndarray:
    """Generate soft rhythmic pulse/heartbeat."""
    samples = int(duration * sr)
    output = np.zeros(samples)
    
    beat_duration = 60.0 / bpm
    beat_samples = int(beat_duration * sr)
    
    # Create soft kick-like pulse
    pulse_duration = 0.15  # seconds
    pulse_samples = int(pulse_duration * sr)
    
    t_pulse = np.linspace(0, pulse_duration, pulse_samples, endpoint=False)
    # Soft sine pulse with pitch drop (like heartbeat)
    freq_envelope = 120 * np.exp(-t_pulse * 15) + 50  # Drops from 120Hz to ~50Hz
    phase = np.cumsum(2 * np.pi * freq_envelope / sr)
    pulse = np.sin(phase)
    
    # Shape with envelope
    pulse_env = np.exp(-t_pulse * 12)
    pulse = pulse * pulse_env * 0.15
    
    # Place pulses
    pos = 0
    while pos + pulse_samples < samples:
        output[pos:pos + pulse_samples] += pulse
        pos += beat_samples
    
    return output


def generate_tick_layer(duration: float, sr: int, density: float = 0.3) -> np.ndarray:
    """Generate sparse hi-hat/tick texture."""
    samples = int(duration * sr)
    output = np.zeros(samples)
    
    tick_duration = 0.02  # 20ms ticks
    tick_samples = int(tick_duration * sr)
    
    # Create tick sound (filtered noise)
    np.random.seed(42)
    tick = np.random.randn(tick_samples) * 0.1
    tick_env = np.exp(-np.linspace(0, 5, tick_samples))
    tick = tick * tick_env
    tick = lowpass_filter(tick, 8000, sr)
    
    # Sparse placement
    interval = int(0.25 * sr)  # Base interval ~250ms
    pos = 0
    while pos + tick_samples < samples:
        if np.random.random() < density:
            output[pos:pos + tick_samples] += tick
        pos += interval + int(np.random.randint(-int(0.05 * sr), int(0.05 * sr)))
    
    return output * 0.3


def generate_ambient_texture(duration: float, sr: int) -> np.ndarray:
    """Generate subtle high-frequency ambient texture (air)."""
    samples = int(duration * sr)
    
    # Pink-ish noise, heavily filtered to high frequencies only
    np.random.seed(123)
    noise = np.random.randn(samples)
    
    # Bandpass 4000-10000 Hz
    nyq = sr / 2
    low = 4000 / nyq
    high = min(10000 / nyq, 0.99)
    b, a = butter(2, [low, high], btype='band')
    filtered = filtfilt(b, a, noise)
    
    # Very subtle
    return filtered * 0.03


def main():
    print("Generating melodic ambient BGM for Hourglass Command...")
    print(f"Duration: {DURATION}s, Sample Rate: {SAMPLE_RATE}Hz")
    
    # A minor chord for ops vibe: A3, C4, E4 (+ A4 for arpeggio)
    am_chord = [note_to_freq('A3'), note_to_freq('C4'), note_to_freq('E4')]
    am_arpeggio = [note_to_freq('A3'), note_to_freq('C4'), note_to_freq('E4'), note_to_freq('A4')]
    
    # Secondary chord: F major (relative major feel): F3, A3, C4
    f_chord = [note_to_freq('F3'), note_to_freq('A3'), note_to_freq('C4')]
    
    # G major for movement: G3, B3, D4
    g_chord = [note_to_freq('G3'), note_to_freq('B3'), note_to_freq('D4')]
    
    print("Generating layers...")
    
    # 1. Arpeggio layer (main melodic content) - this is the KEY midrange element
    print("  - Arpeggio (80 BPM, Am)...")
    arpeggio = generate_arpeggio(am_arpeggio, DURATION, SAMPLE_RATE, tempo_bpm=80)
    
    # 2. Pad chord layers (warm background)
    print("  - Pad chords (Am -> F -> G progression)...")
    section_duration = DURATION / 3
    
    pad_am = generate_pad_chord(am_chord, section_duration, SAMPLE_RATE)
    pad_f = generate_pad_chord(f_chord, section_duration, SAMPLE_RATE)
    pad_g = generate_pad_chord(g_chord, section_duration, SAMPLE_RATE)
    
    # Combine pads - simpler approach with direct mixing
    total_samples = int(DURATION * SAMPLE_RATE)
    section_samples = int(section_duration * SAMPLE_RATE)
    pads = np.zeros(total_samples)
    
    # Ensure pads are all the right length
    pad_am = pad_am[:section_samples] if len(pad_am) >= section_samples else np.pad(pad_am, (0, section_samples - len(pad_am)))
    pad_f = pad_f[:section_samples] if len(pad_f) >= section_samples else np.pad(pad_f, (0, section_samples - len(pad_f)))
    pad_g = pad_g[:section_samples] if len(pad_g) >= section_samples else np.pad(pad_g, (0, section_samples - len(pad_g)))
    
    # Place pads in sequence with crossfade
    crossfade = int(1.0 * SAMPLE_RATE)
    
    # Am section (0 to section_samples)
    end1 = min(section_samples, total_samples)
    pads[:end1] = pad_am[:end1]
    
    # F section (section_samples to 2*section_samples) with crossfade
    start2 = section_samples
    end2 = min(2 * section_samples, total_samples)
    if start2 < total_samples:
        # Crossfade region
        cf_start = max(0, start2 - crossfade)
        cf_end = start2
        if cf_end > cf_start:
            cf_len = cf_end - cf_start
            pads[cf_start:cf_end] *= np.linspace(1, 0.3, cf_len)
            pads[cf_start:cf_end] += pad_f[:cf_len] * np.linspace(0, 0.7, cf_len)
        # Rest of F section
        remaining = min(end2 - start2, len(pad_f) - crossfade)
        if remaining > 0:
            pads[start2:start2 + remaining] = pad_f[crossfade:crossfade + remaining]
    
    # G section (2*section_samples to 3*section_samples) with crossfade
    start3 = 2 * section_samples
    end3 = min(3 * section_samples, total_samples)
    if start3 < total_samples:
        # Crossfade region
        cf_start = max(0, start3 - crossfade)
        cf_end = min(start3, total_samples)
        if cf_end > cf_start:
            cf_len = cf_end - cf_start
            pads[cf_start:cf_end] *= np.linspace(1, 0.3, cf_len)
            pads[cf_start:cf_end] += pad_g[:cf_len] * np.linspace(0, 0.7, cf_len)
        # Rest of G section
        remaining = min(end3 - start3, len(pad_g) - crossfade)
        if remaining > 0 and start3 < total_samples:
            actual_remaining = min(remaining, total_samples - start3)
            pads[start3:start3 + actual_remaining] = pad_g[crossfade:crossfade + actual_remaining]
    
    # 3. Soft pulse/heartbeat
    print("  - Soft pulse (72 BPM)...")
    pulse = generate_soft_pulse(DURATION, SAMPLE_RATE, bpm=72)
    
    # 4. Sparse tick texture
    print("  - Tick texture...")
    ticks = generate_tick_layer(DURATION, SAMPLE_RATE, density=0.25)
    
    # 5. Air/ambience (very subtle high freq)
    print("  - Ambient texture...")
    air = generate_ambient_texture(DURATION, SAMPLE_RATE)
    
    # Mix all layers
    print("Mixing layers...")
    samples = int(DURATION * SAMPLE_RATE)
    
    # Ensure all arrays are same length
    arpeggio = arpeggio[:samples] if len(arpeggio) >= samples else np.pad(arpeggio, (0, samples - len(arpeggio)))
    pads = pads[:samples] if len(pads) >= samples else np.pad(pads, (0, samples - len(pads)))
    pulse = pulse[:samples] if len(pulse) >= samples else np.pad(pulse, (0, samples - len(pulse)))
    ticks = ticks[:samples] if len(ticks) >= samples else np.pad(ticks, (0, samples - len(ticks)))
    air = air[:samples] if len(air) >= samples else np.pad(air, (0, samples - len(air)))
    
    # Mix with relative levels
    # Arpeggio is the MAIN melodic element - should be prominent
    mix = (
        arpeggio * 1.0 +      # Main melodic content
        pads * 0.6 +          # Warm pad background
        pulse * 0.4 +         # Subtle rhythm
        ticks * 0.3 +         # Texture
        air * 0.2             # Air
    )
    
    # Normalize to target level (~-18 LUFS feel)
    peak = np.max(np.abs(mix))
    if peak > 0:
        mix = mix / peak * 0.35  # Leave headroom, target low volume
    
    # Create stereo with subtle width
    print("Creating stereo image...")
    left = mix
    right = np.roll(mix, int(0.003 * SAMPLE_RATE))  # 3ms delay for width
    right = right * 0.95 + mix * 0.05  # Slight mono blend
    
    stereo = np.column_stack([left, right])
    
    # Loop crossfade for seamless looping
    print("Applying loop crossfade...")
    crossfade_samples = int(2.0 * SAMPLE_RATE)
    fade_in = np.linspace(0, 1, crossfade_samples).reshape(-1, 1)
    fade_out = np.linspace(1, 0, crossfade_samples).reshape(-1, 1)
    
    stereo[:crossfade_samples] = stereo[:crossfade_samples] * fade_in + stereo[-crossfade_samples:] * fade_out
    
    # Convert to 16-bit
    stereo_16 = (stereo * 32767).astype(np.int16)
    
    # Write WAV
    print(f"Writing WAV: {OUTPUT_WAV}")
    wavfile.write(OUTPUT_WAV, SAMPLE_RATE, stereo_16)
    
    # Convert to OGG
    print(f"Converting to OGG: {OUTPUT_OGG}")
    os.makedirs(os.path.dirname(OUTPUT_OGG), exist_ok=True)
    subprocess.run([
        'ffmpeg', '-y', '-i', OUTPUT_WAV,
        '-c:a', 'libvorbis', '-q:a', '6',  # Quality 6 (~192kbps)
        OUTPUT_OGG
    ], check=True, capture_output=True)
    
    # Verify output
    print("\n--- Verification ---")
    result = subprocess.run([
        'ffprobe', '-v', 'error',
        '-show_entries', 'format=duration:stream=sample_rate,channels',
        '-of', 'default=noprint_wrappers=1',
        OUTPUT_OGG
    ], capture_output=True, text=True)
    print(result.stdout)
    
    # FFT Analysis
    print("\n--- FFT Analysis ---")
    analyze_fft(OUTPUT_OGG)
    
    print(f"\n✅ Done! Output: {OUTPUT_OGG}")
    print("File should have clear midrange melodic content (arpeggio at A3=220Hz, C4=262Hz, E4=330Hz, A4=440Hz)")


def analyze_fft(filepath: str):
    """Analyze frequency content of the output file."""
    import soundfile as sf
    
    data, sr = sf.read(filepath)
    if len(data.shape) > 1:
        data = np.mean(data, axis=1)
    
    # Take 5-second sample
    sample_length = min(len(data), 5 * sr)
    sample = data[:sample_length]
    
    # FFT
    from scipy.fft import rfft, rfftfreq
    fft_result = np.abs(rfft(sample))
    freqs = rfftfreq(len(sample), 1/sr)
    
    # Find top peaks
    peak_indices = np.argsort(fft_result)[-15:]
    
    print("Top 10 frequency peaks:")
    for i in range(len(peak_indices)-1, max(len(peak_indices)-11, -1), -1):
        f = freqs[peak_indices[i]]
        mag = fft_result[peak_indices[i]]
        # Identify musical notes
        note = ""
        if 200 < f < 500:
            if 215 < f < 225: note = "(~A3)"
            elif 258 < f < 268: note = "(~C4)"
            elif 325 < f < 340: note = "(~E4)"
            elif 340 < f < 360: note = "(~F4)"
            elif 390 < f < 400: note = "(~G4)"
            elif 435 < f < 445: note = "(~A4)"
        print(f"  {f:.1f} Hz {note} (magnitude: {mag:.1f})")
    
    # Energy distribution
    total_energy = np.sum(fft_result ** 2)
    
    low_mask = freqs < 100
    low_energy = np.sum(fft_result[low_mask] ** 2)
    
    sub_200_mask = freqs < 200
    sub_200_energy = np.sum(fft_result[sub_200_mask] ** 2)
    
    mid_mask = (freqs >= 100) & (freqs < 800)
    mid_energy = np.sum(fft_result[mid_mask] ** 2)
    
    high_mask = freqs >= 800
    high_energy = np.sum(fft_result[high_mask] ** 2)
    
    print(f"\nEnergy distribution:")
    print(f"  Under 100Hz: {100 * low_energy / total_energy:.1f}%")
    print(f"  Under 200Hz: {100 * sub_200_energy / total_energy:.1f}%")
    print(f"  100-800Hz (musical midrange): {100 * mid_energy / total_energy:.1f}%")
    print(f"  800Hz+: {100 * high_energy / total_energy:.1f}%")
    
    # Acceptance test
    if sub_200_energy / total_energy < 0.4 and mid_energy / total_energy > 0.3:
        print("\n✅ PASS: Music has clear midrange content, NOT a bass drone")
    else:
        print("\n❌ FAIL: Energy distribution still too bass-heavy")
        return False
    
    return True


if __name__ == '__main__':
    main()
