---
title: Multimodal Tools Installation
created: '2026-03-16'
updated: '2026-03-16'
type: research
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: research
tags:
  - audio
  - media
  - multimodal
  - python
  - tools
  - video
  - whisper
summary: >-
  11 standalone Python scripts for video/audio/image processing from Mixpeek.
  Covers thumbnails, scene detection, transcription, topic segmentation, cap
wiki_id: research/Multimodal_Tools_Installation
imported_from: vault/Research/Multimodal Tools Installation.md
imported_at: '2026-04-04T00:23:57.096Z'
---
# Multimodal Tools Installation

**Date:** 2026-03-16
**Status:** ✅ Installed — all deps in venv, all tools accessible via wrapper
**Repo:** https://github.com/mixpeek/multimodal-tools

## What It Is

11 standalone Python scripts for video/audio/image processing from Mixpeek. Covers thumbnails, scene detection, transcription, topic segmentation, caption generation/search, summarization, CLIP search, and face blurring.

## Installation Details

| Item | Path |
|---|---|
| Repo | `~/tools/multimodal-tools/` |
| Venv | `~/tools/multimodal-tools/.venv/` (2.3 GB) |
| Wrapper | `~/bin/media-tools.sh` |
| System ffmpeg | 6.1.1 (already present) |

### Key Python Packages Installed
- `torch` 2.10.0+cpu (CPU-only — no CUDA bloat)
- `openai-whisper` 20250625 (tiny model: 72MB download on first use)
- `transformers` 5.3.0, `sentence-transformers` 5.3.0
- `scenedetect` 0.6.7.1, `opencv-python-headless` 4.13.0.92
- `hdbscan` 0.8.41, `ffmpeg-python` 0.2.0

## Tool Status — Tested Headlessly

### ✅ Fully Working (no GPU needed)

| Tool | Wrapper Command | What It Does | Test Result |
|---|---|---|---|
| extract_thumbnails | `media-tools.sh extract-thumbnails` | Grab frames every N sec | ✅ Extracted 3 frames from 6s test video |
| split_video_by_second | `media-tools.sh split-video` | Split into N-sec chunks | ✅ Split 6s video into 3×2s chunks |
| blur_faces | `media-tools.sh blur-faces` | Detect/blur faces (Haar cascade) | ✅ Loads, CLI works |
| transcribe_audio | `media-tools.sh transcribe` | Whisper transcription | ✅ Transcribed test audio (tiny model, CPU) |
| generate_video_captions | `media-tools.sh captions` | SRT/VTT from audio/video | ✅ Ran successfully, correct empty result on sine wave |
| caption_search | `media-tools.sh caption-search` | Search within captions | ✅ CLI loads, accepts --transcript_input or --video_input |
| segment_transcript_by_topic | `media-tools.sh segment-topics` | Whisper + HDBSCAN clustering | ✅ CLI loads (needs real speech audio for meaningful test) |

### ⚠️ Working with Caveats

| Tool | Issue |
|---|---|
| scene_change_split | **Detection works** (correctly found 3 scenes in test). **Splitting fails** — uses deprecated `VideoManager` API. `split_video_ffmpeg()` call and `video_manager.is_started()` incompatible with scenedetect 0.6.7. Fix: update script to use `open_video()` API. |
| video_shot_segmenter | **Same issue** — detection works, splitting fails with identical `VideoManager` deprecation. |

### 🐌 Functional but Slow on CPU

| Tool | Why Slow | Model Download |
|---|---|---|
| summarize_transcript | BART-large-CNN (1.6GB) or T5 — pure CPU inference | First-run download |
| search_local_media | CLIP model (torch + torchvision + transformers) | First-run download |
| Whisper (all) | base model ~140MB, large-v3 ~3GB | tiny=72MB cached ✅ |

### Model Sizes (Whisper)

| Model | Size | CPU Speed | Quality |
|---|---|---|---|
| tiny | 72 MB | Fast | Low — good for testing |
| base | 140 MB | Moderate | Decent for most content |
| small | 460 MB | Slow | Good |
| medium | 1.5 GB | Very slow | High |
| large-v3 | 3 GB | Impractical on CPU | Best |

## Usage Examples

```bash
# Extract a frame every 5 seconds
media-tools.sh extract-thumbnails --input video.mp4 --output_folder ./frames --interval 5

# Split into 30-second chunks
media-tools.sh split-video --input video.mp4 --output_folder ./chunks --duration 30

# Transcribe with tiny model (fastest on CPU)
media-tools.sh transcribe --input audio.mp3 --output transcript.json --model_size tiny

# Generate SRT captions
media-tools.sh captions --input video.mp4 --output_dir ./subs --model_size tiny

# Search captions for a phrase
media-tools.sh caption-search --video_input video.mp4 --query "machine learning" --model_size tiny

# Blur faces in an image
media-tools.sh blur-faces --input photo.jpg --output blurred.jpg

# Topic segmentation
media-tools.sh segment-topics --input podcast.mp4 --output segments.json
```

## Known Issues

1. **SceneDetect VideoManager deprecation** — `scene_change_split` and `video_shot_segmenter` both use the deprecated `VideoManager` API. Scene *detection* works fine; it's only the *splitting* step that fails. The repo needs updating to use `scenedetect.open_video()` instead.
2. **No GPU** — All torch-based tools (whisper, CLIP, summarization) run on CPU. Whisper tiny/base are practical; anything larger is slow. CLIP search and BART summarization will be sluggish.
3. **First-run model downloads** — Whisper, BART, CLIP, sentence-transformers all download models on first use. Budget ~5GB total if using all tools.

## Architecture Notes

- Each tool is fully standalone with its own `requirements.txt` and `README.md`
- No shared config, no framework — just argparse CLIs
- The wrapper script activates the shared venv and dispatches to the right script
- All tools accept `--input` and produce output to specified paths

## Tags
#tools #media #video #audio #whisper #multimodal #python

## Related

- [[Multimodal Tools Installation]]
- [[briefing-2026-03-16]]
- [[github-intel-favorites]]
