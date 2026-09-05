#!/usr/bin/env python3
"""
Audio Generation Script for Hourglass Command
Generates high-quality SFX and optional ambient BGM using professional
procedural synthesis techniques - NOT toy beeps.
"""

import numpy as np
import os
from scipy.io import wavfile
from scipy import signal
import subprocess

OUTPUT_DIR = "/workspace/apps/web/public/audio"

def ensure_dir():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

def normalize(audio):
    max_val = np.max(np.abs(audio))
    if max_val > 0:
        return audio / max_val
    return audio

def to_stereo(audio):
    if len(audio.shape) == 1:
        return np.column_stack([audio, audio])
    return audio

def apply_envelope(audio, attack=0.01, decay=0.1, sustain=0.7, release=0.2, sr=44100):
    n_samples = len(audio)
    attack_samples = int(attack * sr)
    decay_samples = int(decay * sr)
    release_samples = int(release * sr)
    sustain_samples = max(0, n_samples - attack_samples - decay_samples - release_samples)
    
    envelope = np.zeros(n_samples)
    idx = 0
    
    if attack_samples > 0:
        envelope[idx:idx+attack_samples] = np.linspace(0, 1, attack_samples)
        idx += attack_samples
    
    if decay_samples > 0 and idx < n_samples:
        end_idx = min(idx + decay_samples, n_samples)
        envelope[idx:end_idx] = np.linspace(1, sustain, end_idx - idx)
        idx = end_idx
    
    if sustain_samples > 0 and idx < n_samples:
        end_idx = min(idx + sustain_samples, n_samples)
        envelope[idx:end_idx] = sustain
        idx = end_idx
    
    if release_samples > 0 and idx < n_samples:
        envelope[idx:] = np.linspace(sustain, 0, n_samples - idx)
    
    return audio * envelope

def lowpass_filter(audio, cutoff=2000, sr=44100, order=4):
    nyquist = sr / 2
    normalized_cutoff = min(cutoff / nyquist, 0.99)
    b, a = signal.butter(order, normalized_cutoff, btype='low')
    return signal.filtfilt(b, a, audio)

def highpass_filter(audio, cutoff=80, sr=44100, order=2):
    nyquist = sr / 2
    normalized_cutoff = min(cutoff / nyquist, 0.99)
    b, a = signal.butter(order, normalized_cutoff, btype='high')
    return signal.filtfilt(b, a, audio)

def bandpass_filter(audio, low=200, high=4000, sr=44100, order=2):
    nyquist = sr / 2
    low_norm = min(low / nyquist, 0.99)
    high_norm = min(high / nyquist, 0.99)
    b, a = signal.butter(order, [low_norm, high_norm], btype='band')
    return signal.filtfilt(b, a, audio)

def save_as_ogg(audio, filename, sr=44100):
    wav_path = filename.replace('.ogg', '.wav')
    audio_int = (normalize(audio) * 32767).astype(np.int16)
    if len(audio_int.shape) == 1:
        audio_int = to_stereo(audio_int)
    wavfile.write(wav_path, sr, audio_int)
    
    ogg_path = filename
    subprocess.run([
        'ffmpeg', '-y', '-i', wav_path,
        '-c:a', 'libvorbis', '-q:a', '6',
        ogg_path
    ], capture_output=True)
    
    if os.path.exists(ogg_path):
        os.remove(wav_path)
        print(f"  Saved: {ogg_path}")
    else:
        print(f"  WARNING: Failed to convert, keeping WAV: {wav_path}")

def generate_inject_arrive(sr=44100):
    duration = 0.4
    t = np.linspace(0, duration, int(sr * duration))
    
    freq_start, freq_end = 400, 1200
    freq = np.linspace(freq_start, freq_end, len(t))
    main = np.sin(2 * np.pi * freq * t / sr * np.cumsum(np.ones_like(t)))
    main = main * np.exp(-t * 8)
    
    harmonic = np.sin(2 * np.pi * 800 * t) * 0.3 * np.exp(-t * 12)
    
    click_t = np.linspace(0, 0.01, int(sr * 0.01))
    click = np.sin(2 * np.pi * 2000 * click_t) * np.exp(-click_t * 300)
    click = np.pad(click, (0, len(t) - len(click)), mode='constant')
    
    audio = main + harmonic + click * 0.4
    audio = lowpass_filter(audio, 4000, sr)
    audio = apply_envelope(audio, attack=0.005, decay=0.05, sustain=0.6, release=0.2, sr=sr)
    
    return normalize(audio)

def generate_correct_decision(sr=44100):
    duration = 0.5
    t = np.linspace(0, duration, int(sr * duration))
    
    freqs = [523.25, 659.25, 783.99, 1046.50]
    audio = np.zeros_like(t)
    
    for i, freq in enumerate(freqs):
        delay = i * 0.03
        delay_samples = int(delay * sr)
        note_t = np.linspace(0, duration - delay, len(t) - delay_samples)
        note = np.sin(2 * np.pi * freq * note_t) * np.exp(-note_t * 4)
        audio[delay_samples:] += note * (0.8 - i * 0.1)
    
    shimmer = np.sin(2 * np.pi * 2093 * t) * 0.1 * np.exp(-t * 6)
    audio = audio + shimmer
    
    audio = lowpass_filter(audio, 6000, sr)
    audio = apply_envelope(audio, attack=0.01, decay=0.1, sustain=0.5, release=0.25, sr=sr)
    
    return normalize(audio)

def generate_wrong_decision(sr=44100):
    duration = 0.4
    t = np.linspace(0, duration, int(sr * duration))
    
    f1, f2 = 300, 316
    tone1 = np.sin(2 * np.pi * f1 * t)
    tone2 = np.sin(2 * np.pi * f2 * t)
    
    audio = (tone1 + tone2 * 0.8) * np.exp(-t * 5)
    rumble = np.sin(2 * np.pi * 80 * t) * 0.3 * np.exp(-t * 8)
    audio = audio + rumble
    
    audio = lowpass_filter(audio, 2000, sr)
    audio = apply_envelope(audio, attack=0.01, decay=0.15, sustain=0.3, release=0.2, sr=sr)
    
    return normalize(audio)

def generate_tactical_deploy(sr=44100):
    duration = 0.35
    t = np.linspace(0, duration, int(sr * duration))
    
    click_dur = 0.02
    click_samples = int(click_dur * sr)
    click = np.random.randn(click_samples) * np.exp(-np.linspace(0, 8, click_samples))
    click = bandpass_filter(click, 1000, 6000, sr)
    
    tone_start = int(0.03 * sr)
    tone_dur = 0.15
    tone_samples = int(tone_dur * sr)
    tone_t = np.linspace(0, tone_dur, tone_samples)
    tone = np.sin(2 * np.pi * 880 * tone_t) * np.exp(-tone_t * 6)
    
    tone2_start = int(0.12 * sr)
    tone2 = np.sin(2 * np.pi * 660 * tone_t) * np.exp(-tone_t * 8)
    
    audio = np.zeros_like(t)
    audio[:click_samples] = click * 0.4
    if tone_start + tone_samples <= len(audio):
        audio[tone_start:tone_start+tone_samples] += tone
    if tone2_start + len(tone2) <= len(audio):
        audio[tone2_start:tone2_start+len(tone2)] += tone2 * 0.7
    
    audio = lowpass_filter(audio, 5000, sr)
    return normalize(audio)

def generate_micro_task(sr=44100):
    duration = 0.25
    t = np.linspace(0, duration, int(sr * duration))
    
    f1, f2 = 1200, 1800
    tone1 = np.sin(2 * np.pi * f1 * t) * np.exp(-t * 10)
    tone2 = np.sin(2 * np.pi * f2 * t) * 0.5 * np.exp(-t * 15)
    
    audio = tone1 + tone2
    audio = lowpass_filter(audio, 4000, sr)
    audio = apply_envelope(audio, attack=0.002, decay=0.05, sustain=0.3, release=0.15, sr=sr)
    
    return normalize(audio) * 0.7

def generate_error_warn(sr=44100):
    duration = 0.3
    t = np.linspace(0, duration, int(sr * duration))
    
    f1, f2 = 600, 450
    half = len(t) // 2
    
    audio = np.zeros_like(t)
    audio[:half] = np.sin(2 * np.pi * f1 * t[:half])
    audio[half:] = np.sin(2 * np.pi * f2 * t[half:])
    
    audio = audio * np.exp(-t * 3)
    audio = lowpass_filter(audio, 3000, sr)
    audio = apply_envelope(audio, attack=0.005, decay=0.08, sustain=0.5, release=0.1, sr=sr)
    
    return normalize(audio)

def generate_score_up(sr=44100):
    duration = 0.2
    t = np.linspace(0, duration, int(sr * duration))
    
    freq = np.linspace(600, 1000, len(t))
    audio = np.sin(2 * np.pi * np.cumsum(freq) / sr)
    audio = audio * np.exp(-t * 8)
    
    harmonic = np.sin(2 * np.pi * 1500 * t) * 0.2 * np.exp(-t * 12)
    audio = audio + harmonic
    
    audio = lowpass_filter(audio, 4000, sr)
    audio = apply_envelope(audio, attack=0.005, decay=0.05, sustain=0.4, release=0.1, sr=sr)
    
    return normalize(audio) * 0.8

def generate_streak_bonus(sr=44100):
    duration = 0.6
    t = np.linspace(0, duration, int(sr * duration))
    
    audio = np.zeros_like(t)
    
    note1 = np.sin(2 * np.pi * 523.25 * t) * np.exp(-t * 3)
    audio += note1
    
    delay1 = int(0.08 * sr)
    note2_t = t[:-delay1] if delay1 < len(t) else t[:1]
    note2 = np.sin(2 * np.pi * 783.99 * note2_t) * np.exp(-note2_t * 3.5)
    audio[delay1:delay1+len(note2)] += note2 * 0.9
    
    delay2 = int(0.15 * sr)
    note3_t = t[:-delay2] if delay2 < len(t) else t[:1]
    note3 = np.sin(2 * np.pi * 1046.50 * note3_t) * np.exp(-note3_t * 4)
    audio[delay2:delay2+len(note3)] += note3 * 0.7
    
    shimmer = np.sin(2 * np.pi * 2093 * t) * 0.15 * np.exp(-t * 5)
    audio = audio + shimmer
    
    audio = lowpass_filter(audio, 6000, sr)
    audio = apply_envelope(audio, attack=0.01, decay=0.15, sustain=0.5, release=0.3, sr=sr)
    
    return normalize(audio)

def generate_timer_urgent(sr=44100):
    duration = 0.8
    t = np.linspace(0, duration, int(sr * duration))
    
    audio = np.zeros_like(t)
    
    tick_times = [0, 0.15, 0.3, 0.45]
    for tick_time in tick_times:
        tick_start = int(tick_time * sr)
        tick_dur = 0.08
        tick_samples = int(tick_dur * sr)
        tick_t = np.linspace(0, tick_dur, tick_samples)
        
        freq = 800 + tick_time * 400
        tick = np.sin(2 * np.pi * freq * tick_t) * np.exp(-tick_t * 25)
        
        if tick_start + tick_samples <= len(audio):
            audio[tick_start:tick_start+tick_samples] += tick
    
    audio = lowpass_filter(audio, 4000, sr)
    return normalize(audio)

def generate_ambient_bgm(sr=44100):
    duration = 45.0
    t = np.linspace(0, duration, int(sr * duration))
    
    audio = np.zeros_like(t)
    
    freqs = [130.81, 155.56, 196.00]
    for freq in freqs:
        mod = 1 + 0.003 * np.sin(2 * np.pi * 0.1 * t)
        pad = np.sin(2 * np.pi * freq * mod * t)
        audio += pad * 0.15
    
    noise = np.random.randn(len(t))
    noise = lowpass_filter(noise, 200, sr)
    noise = noise * 0.05 * (1 + 0.5 * np.sin(2 * np.pi * 0.05 * t))
    audio = audio + noise
    
    shimmer = np.sin(2 * np.pi * 523.25 * t) * 0.02
    shimmer = shimmer * (0.5 + 0.5 * np.sin(2 * np.pi * 0.08 * t))
    audio = audio + shimmer
    
    fade_samples = int(2.0 * sr)
    fade_in = np.linspace(0, 1, fade_samples)
    fade_out = np.linspace(1, 0, fade_samples)
    audio[:fade_samples] *= fade_in
    audio[-fade_samples:] *= fade_out
    
    audio = lowpass_filter(audio, 3000, sr)
    audio = highpass_filter(audio, 60, sr)
    
    return normalize(audio) * 0.3

def main():
    print("=" * 60)
    print("Hourglass Command - Professional Audio Generation")
    print("=" * 60)
    print("\nGenerating high-quality procedural audio...")
    print("(Layered synthesis, ADSR envelopes, filtering)")
    print()
    
    ensure_dir()
    sr = 44100
    
    sfx_generators = {
        'injectArrive': generate_inject_arrive,
        'correctDecision': generate_correct_decision,
        'wrongDecision': generate_wrong_decision,
        'tacticalDeploy': generate_tactical_deploy,
        'microTask': generate_micro_task,
        'error': generate_error_warn,
        'scoreUp': generate_score_up,
        'streakBonus': generate_streak_bonus,
        'timerUrgent': generate_timer_urgent,
    }
    
    print("Generating SFX:")
    for name, generator in sfx_generators.items():
        print(f"  - {name}...", end=" ", flush=True)
        audio = generator(sr)
        save_as_ogg(audio, os.path.join(OUTPUT_DIR, f"{name}.ogg"), sr)
    
    print("\nGenerating ambient BGM loop:")
    print("  - ambientBGM...", end=" ", flush=True)
    audio = generate_ambient_bgm(sr)
    save_as_ogg(audio, os.path.join(OUTPUT_DIR, "ambientBGM.ogg"), sr)
    
    print("\n" + "=" * 60)
    print("Audio generation complete!")
    print(f"Files saved to: {OUTPUT_DIR}")
    print("=" * 60)

if __name__ == "__main__":
    main()
