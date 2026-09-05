#!/usr/bin/env python3
"""
AI Audio Generation using Meta's MusicGen (facebook/musicgen-small)
Generates SFX and ambient BGM using the transformers library.
Runs on CPU - slower but produces AI-generated original audio.
"""

import os
import sys
import subprocess

OUTPUT_DIR = "/workspace/apps/web/public/audio"

def ensure_dir():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

def convert_to_ogg(wav_path, ogg_path):
    """Convert WAV to high-quality OGG"""
    subprocess.run([
        'ffmpeg', '-y', '-i', wav_path,
        '-c:a', 'libvorbis', '-q:a', '6',
        ogg_path
    ], capture_output=True)
    if os.path.exists(ogg_path):
        os.remove(wav_path)
        return True
    return False

def main():
    print("=" * 70)
    print("Hourglass Command - AI Audio Generation (MusicGen)")
    print("Model: facebook/musicgen-small via HuggingFace Transformers")
    print("=" * 70)
    print()
    
    ensure_dir()
    
    print("Loading MusicGen model (this may take a minute)...")
    
    try:
        import torch
        from transformers import AutoProcessor, MusicgenForConditionalGeneration
        import scipy.io.wavfile as wavfile
        import numpy as np
        
        # Load the smallest model for CPU feasibility
        processor = AutoProcessor.from_pretrained("facebook/musicgen-small")
        model = MusicgenForConditionalGeneration.from_pretrained(
            "facebook/musicgen-small",
            torch_dtype=torch.float32  # Use float32 for CPU
        )
        model = model.to("cpu")
        model.eval()
        
        sample_rate = model.config.audio_encoder.sampling_rate
        print(f"Model loaded. Sample rate: {sample_rate} Hz")
        print()
        
    except Exception as e:
        print(f"ERROR: Failed to load MusicGen model: {e}")
        print("Falling back to AudioGen or other methods...")
        return False
    
    # Define SFX prompts - short, punchy, GSOC/ops-craft feel
    sfx_prompts = {
        'injectArrive': {
            'prompt': 'short electronic notification ping, tactical radar beep, sci-fi interface alert sound, clean digital chime, 1 second',
            'duration': 64,  # tokens, ~2 seconds
        },
        'correctDecision': {
            'prompt': 'short success sound effect, positive confirmation chime, bright ascending tones, pleasant bell, achievement sound, 1 second',
            'duration': 64,
        },
        'wrongDecision': {
            'prompt': 'short error buzzer sound effect, negative feedback tone, low warning buzz, wrong answer sound, 1 second',
            'duration': 64,
        },
        'tacticalDeploy': {
            'prompt': 'short radio click beep, dispatch confirmation sound, mechanical click followed by tone, tactical communication sound, 0.5 seconds',
            'duration': 48,
        },
        'microTask': {
            'prompt': 'very short subtle notification chime, soft bell ding, gentle alert, minimal UI sound, 0.3 seconds',
            'duration': 32,
        },
        'error': {
            'prompt': 'warning alert sound effect, two tone caution beep, attention getter sound, not harsh, 0.5 seconds',
            'duration': 48,
        },
        'scoreUp': {
            'prompt': 'short point score sound effect, coin collect chime, positive feedback ding, rising tone, 0.3 seconds',
            'duration': 32,
        },
        'streakBonus': {
            'prompt': 'achievement fanfare sound effect, triumphant short melody, success celebration, winning sound, 1 second',
            'duration': 80,
        },
        'timerUrgent': {
            'prompt': 'urgent timer ticking sound effect, countdown warning beeps, increasing tension, time pressure sound, 1.5 seconds',
            'duration': 96,
        },
    }
    
    # Generate SFX
    print("Generating SFX (this will take several minutes on CPU)...")
    print("-" * 70)
    
    for name, config in sfx_prompts.items():
        prompt = config['prompt']
        max_tokens = config['duration']
        
        print(f"\nGenerating: {name}")
        print(f"  Prompt: {prompt[:60]}...")
        
        try:
            inputs = processor(
                text=[prompt],
                padding=True,
                return_tensors="pt",
            )
            
            with torch.no_grad():
                audio_values = model.generate(
                    **inputs,
                    max_new_tokens=max_tokens,
                    do_sample=True,
                    guidance_scale=3.0,
                )
            
            # Extract audio and save
            audio = audio_values[0, 0].cpu().numpy()
            
            # Normalize
            audio = audio / np.max(np.abs(audio)) * 0.9
            
            # Convert to int16
            audio_int16 = (audio * 32767).astype(np.int16)
            
            wav_path = os.path.join(OUTPUT_DIR, f"{name}.wav")
            ogg_path = os.path.join(OUTPUT_DIR, f"{name}.ogg")
            
            wavfile.write(wav_path, sample_rate, audio_int16)
            
            if convert_to_ogg(wav_path, ogg_path):
                print(f"  ✓ Saved: {ogg_path}")
            else:
                print(f"  ✓ Saved: {wav_path} (OGG conversion failed)")
                
        except Exception as e:
            print(f"  ✗ Failed: {e}")
    
    # Generate ambient BGM (longer, more complex)
    print("\n" + "-" * 70)
    print("Generating ambient BGM loop (this will take longer)...")
    
    bgm_prompt = "calm ambient electronic music, soft synthesizer pads, minimal atmospheric background music, peaceful, low volume, suitable for focus, no vocals, 30 seconds"
    
    try:
        inputs = processor(
            text=[bgm_prompt],
            padding=True,
            return_tensors="pt",
        )
        
        with torch.no_grad():
            audio_values = model.generate(
                **inputs,
                max_new_tokens=512,  # ~15-20 seconds
                do_sample=True,
                guidance_scale=3.0,
            )
        
        audio = audio_values[0, 0].cpu().numpy()
        audio = audio / np.max(np.abs(audio)) * 0.7  # Lower volume for BGM
        audio_int16 = (audio * 32767).astype(np.int16)
        
        wav_path = os.path.join(OUTPUT_DIR, "ambientBGM.wav")
        ogg_path = os.path.join(OUTPUT_DIR, "ambientBGM.ogg")
        
        wavfile.write(wav_path, sample_rate, audio_int16)
        
        if convert_to_ogg(wav_path, ogg_path):
            print(f"  ✓ Saved: {ogg_path}")
        else:
            print(f"  ✓ Saved: {wav_path}")
            
    except Exception as e:
        print(f"  ✗ BGM generation failed: {e}")
    
    print("\n" + "=" * 70)
    print("AI Audio Generation Complete!")
    print("Model: facebook/musicgen-small")
    print(f"Files saved to: {OUTPUT_DIR}")
    print("=" * 70)
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
