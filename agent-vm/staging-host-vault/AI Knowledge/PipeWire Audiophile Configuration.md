---
date: 2026-03-20
tags: [audio, linux, pipewire, easyeffects, alsa]
status: active
---

# PipeWire Audiophile Configuration

> Research into optimal PipeWire + EasyEffects settings for high-end floor-standing tower speakers driven via Realtek ALC897 onboard DAC through an amp.

## Question

What are the optimal PipeWire configuration values (sample rate, quantum, resampler quality, bit depth) and EasyEffects plugin chain settings for audiophile-quality output through a Realtek ALC897 onboard DAC into an amplifier driving tower speakers?

---

## Findings

### 1. PipeWire Core Configuration

**Files to create (user-level, survives package updates):**
- `~/.config/pipewire/pipewire.conf.d/audiophile.conf`
- `~/.config/pipewire/client.conf.d/audiophile.conf`
- `~/.config/wireplumber/wireplumber.conf.d/50-alsa-audiophile.conf`

**Sample rate:** Set `default.clock.allowed-rates` to a multi-rate list rather than hard-coding `default.clock.rate`. PipeWire (0.3.61+) supports up to 32 allowed rates and switches automatically when the graph is idle. Hard-coding a single rate forces all content to be resampled; the allowed-rates list permits bit-perfect passthrough for each format. Source: [ArchWiki PipeWire](https://wiki.archlinux.org/title/PipeWire), [Head-Fi bit-perfect thread](https://www.head-fi.org/threads/bit-perfect-playback-on-linux-pipewire.973318/).

**Quantum (buffer size):** For music listening (not recording), 1024 samples at 48 kHz = ~21 ms latency — comfortable for playback with no audio dropouts. Smaller values (64–256) reduce latency but increase CPU interrupt load and dropout risk on shared desktop systems. 512 is a practical middle ground. Values are rounded down to powers of two when `clock.power-of-two-quantum = true`. Source: [docs.pipewire.org pipewire.conf](https://docs.pipewire.org/page_man_pipewire_conf_5.html).

**Bit depth:** PipeWire internally uses 32-bit float (F32LE) for mixing. The output format sent to ALSA can be set to S32LE (32-bit integer) or S24LE via WirePlumber rules to match the DAC's native depth. The ALC897 supports up to S32LE. Source: [WirePlumber ALSA docs](https://pipewire.pages.freedesktop.org/wireplumber/daemon/configuration/alsa.html), [Arch bit-perfect thread](https://bbs.archlinux.org/viewtopic.php?id=290859).

### 2. Upsampling: 96 kHz vs 48 kHz

**Verdict: Stay at 48 kHz as the default clock rate; let allowed-rates handle native-rate passthrough.**

Key data points:
- Upsampling is mathematically lossless — measurements show the resulting waveform is identical with only ~-144 dB noise above 20 kHz (inaudible). Source: [ArchWiki PipeWire](https://wiki.archlinux.org/title/PipeWire).
- However, upsampling forces the CPU to resample every stream, and many integrated codecs (including the ALC897) do not reliably report 96 kHz capability, meaning PipeWire may fall back to 48 kHz anyway. Source: [EndeavourOS HiFi thread](https://forum.endeavouros.com/t/hifi-sound-configuration-for-pipewire/65407).
- The correct approach for an onboard DAC: include 96000 in `allowed-rates` so 96 kHz content plays natively, but do not set `default.clock.rate = 96000` (which would force-upsample all 44.1/48 kHz content). Source: [ArchWiki PipeWire](https://wiki.archlinux.org/title/PipeWire).
- Verify hardware support first: `cat /proc/asound/card0/stream0 | grep Rates`

### 3. Resampler Quality

**Verdict: resample.quality = 10 is the practical optimum.**

PipeWire uses its own Spa resampler (not SoX or Speex, but derived from the same algorithm family). The range is 0–14 (note: some older docs say 0–15; official current docs confirm 0–14). Default is 4.

- Quality 10 vs 14: "very little quality difference between 10 and 14, but the CPU load difference is 2-3x." Source: [EndeavourOS HiFi thread](https://forum.endeavouros.com/t/hifi-sound-configuration-for-pipewire/65407), [ArchWiki](https://wiki.archlinux.org/title/PipeWire).
- A Ryzen 2600 running 44100→48000 Hz at quality=15 uses 4.0% of one CPU core. Source: [EndeavourOS audiophile guide](https://discovery.endeavouros.com/audio/audiophile/2022/01/).
- For an onboard DAC with amplifier output (not headphone critical listening), 10 is indistinguishable from 14 in blind tests.
- Optional advanced: add `dither.noise = 1` and `dither.method = shaped5` for noise-shaped dithering when down-converting bit depths. Source: [Head-Fi thread](https://www.head-fi.org/threads/bit-perfect-playback-on-linux-pipewire.973318/).

### 4. Realtek ALC897 Known Issues and Tweaks

**Issue 1: Jack detection inversion** — The most-reported ALC897 bug on Linux. The codec reports headphones as "plugged in" when they are unplugged (and vice versa), causing rear speakers to mute. Affects multiple motherboard vendors (Gigabyte, ASUS, MSI). Source: [Arch Forum ALC897 two mobos](https://bbs.archlinux.org/viewtopic.php?id=297957).

**Fix:** No confirmed kernel-level fix as of research date. The alsamixer workaround is to disable Auto-Mute: open `alsamixer`, press F6 to select the ALC897 card, find "Auto-Mute Mode" control, set it to Disabled. This must survive reboots via `alsactl store`. Source: [ALSA Troubleshooting ArchWiki](https://wiki.archlinux.org/title/Advanced_Linux_Sound_Architecture/Troubleshooting), [Arch Forum ALC887 front panel](https://bbs.archlinux.org/viewtopic.php?id=275507).

**Issue 2: Power saving click/pop** — snd_hda_intel's default power-save=1 causes audible pops when the codec suspends after inactivity. Source: [ALSA Troubleshooting ArchWiki](https://wiki.archlinux.org/title/Advanced_Linux_Sound_Architecture/Troubleshooting).

**Fix:** `/etc/modprobe.d/alsa-base.conf`:
```
options snd_hda_intel power_save=0 power_save_controller=N
```

**Issue 3: Channel mode defaults to 2ch** — The ALC897 exposes a "Channel Mode" mixer control. It defaults to '2ch' stereo mode, which is correct for a stereo tower speaker setup, but users attempting surround must manually switch to '6ch'. For stereo-only use this is not a problem. Source: [Arch Forum Z690/ALC897](https://bbs.archlinux.org/viewtopic.php?id=280317).

**Issue 4: Wrong card selected as default** — On systems with multiple audio devices (e.g., HDMI audio from GPU), the ALC897 may not be default. Fix with WirePlumber `default.audio.sink` rule or set priority. Source: [Linux Mint ALC897 forum](https://forums.linuxmint.com/viewtopic.php?t=449820).

**Issue 5: No 5.1 surround** — An open issue in alsa-ucm-conf as of last research. Not relevant for stereo tower speaker use. Source: [alsa-ucm-conf GitHub issue #590](https://github.com/alsa-project/alsa-ucm-conf/issues/590).

**model= parameter:** The ALSA HD-audio model system applies quirks per codec. For ALC897, `model=auto` (the default) is generally best. If jack detection problems persist, try `model=dell-headset-multi` (documented to help ALC892 and related). Syntax in `/etc/modprobe.d/alsa-base.conf`:
```
options snd_hda_intel model=dell-headset-multi
```
Source: [ALSA Troubleshooting ArchWiki](https://wiki.archlinux.org/title/Advanced_Linux_Sound_Architecture/Troubleshooting).

### 5. EasyEffects Plugin Chain for Tower Speakers

**Important caveat:** No community presets exist specifically tuned for floor-standing tower speakers, because room acoustics dominate at that speaker size. The plugin chain below is appropriate for the amp+tower use case: it avoids bass enhancement (towers handle bass natively), focuses on dynamic control and protection, and does not add artificial exciter or harmonics.

**Recommended chain order** (signal flows left to right):

| Position | Plugin | Purpose |
|---|---|---|
| 1 | Parametric EQ (30-band) | Room correction and tonal balance |
| 2 | Multiband Compressor | Tame transient peaks per frequency band |
| 3 | Limiter (LSP Stereo) | Hard ceiling to protect amp and drivers |

Do NOT add Bass Enhancer or Exciter to a full-range tower speaker chain — those are for laptop speakers with no bass extension. Source: [EasyEffects manual guide 1](https://wwmm.github.io/easyeffects/guides/guide_1.html).

**Parametric EQ starting curve for towers through an amp:**
The "Perfect EQ" community preset (source: [JackHack96 presets](https://github.com/JackHack96/EasyEffects-Presets)) is a reasonable starting point with these values:

| Band | Frequency | Gain | Q | Type | Mode |
|---|---|---|---|---|---|
| 0 | 32 Hz | +4.0 dB | 1.505 | Bell | RLC (BT) |
| 1 | 64 Hz | +2.0 dB | 1.505 | Bell | RLC (BT) |
| 2 | 125 Hz | +1.0 dB | 1.505 | Bell | RLC (BT) |
| 3 | 250 Hz | 0.0 dB | 1.505 | Bell | RLC (BT) |
| 4 | 500 Hz | -1.0 dB | 1.505 | Bell | RLC (BT) |
| 5 | 1 kHz | -2.0 dB | 1.505 | Bell | RLC (BT) |
| 6 | 2 kHz | 0.0 dB | 1.505 | Bell | RLC (BT) |
| 7 | 4 kHz | +2.0 dB | 1.505 | Bell | RLC (BT) |
| 8 | 8 kHz | +3.0 dB | 1.505 | Bell | RLC (BT) |
| 9 | 16 kHz | +3.0 dB | 1.505 | Bell | RLC (BT) |

Input gain: -2.0 dB. This gentle bass shelf + presence lift + air boost is appropriate for towers in typical living rooms. For rooms with significant bass buildup (near walls), reduce the 32 Hz and 64 Hz bands by 2–4 dB.

**Multiband Compressor settings** (for tower speakers, gentler than the laptop speaker guide):
- Mode: Modern
- Compression mode: Downward (all bands)
- Input gain: -3 dB
- Split frequencies: 250 Hz / 1250 Hz / 5000 Hz

| Band | Threshold | Ratio | Attack | Release | Knee | Makeup |
|---|---|---|---|---|---|---|
| 1 (sub/bass <250Hz) | -20 dB | 3:1 | 150 ms | 300 ms | -12 dB | 2 dB |
| 2 (mid 250–1250Hz) | -24 dB | 2.5:1 | 150 ms | 200 ms | -9 dB | 2 dB |
| 3 (upper mid 1.25–5kHz) | -24 dB | 2.5:1 | 100 ms | 150 ms | -9 dB | 3 dB |
| 4 (treble >5kHz) | -24 dB | 3:1 | 80 ms | 120 ms | -9 dB | 3 dB |

Source adapted from: [EasyEffects manual guide 1](https://wwmm.github.io/easyeffects/guides/guide_1.html), reduced ratios and makeup gain for tower speakers that don't need the same boost as laptop speakers.

**Limiter settings** (LSP Stereo Limiter — now default in EasyEffects, replacing Calf):
- PreAmp: 0 dB
- Lookahead: 4 ms
- Attack: 2 ms
- Release: 8 ms
- Stereo Link: 100%
- Oversampling: Half x4 (good quality/CPU tradeoff)
- Threshold: -1.0 dBFS (prevents inter-sample clipping from reconstruction)

Source: [EasyEffects manual guide 1](https://wwmm.github.io/easyeffects/guides/guide_1.html). LSP limiter note from [EasyEffects changelog](https://github.com/wwmm/easyeffects/blob/master/CHANGELOG.md).

---

## Configuration Reference

### pipewire.conf.d/audiophile.conf
```
context.properties = {
    default.clock.quantum      = 1024
    default.clock.min-quantum  = 32
    default.clock.max-quantum  = 8192
    default.clock.allowed-rates = [ 44100 48000 88200 96000 176400 192000 ]
    clock.power-of-two-quantum = true
    link.max-buffers           = 64
}
```

### client.conf.d/audiophile.conf
```
stream.properties = {
    resample.quality = 10
}
```

### wireplumber.conf.d/50-alsa-audiophile.conf
Match to ALC897 stereo output and set S32LE:
```
monitor.alsa.rules = [
  {
    matches = [
      { node.name = "~alsa_output.*analog*" }
    ]
    actions = {
      update-props = {
        audio.format    = "S32LE"
        audio.rate      = 48000
        api.alsa.period-size = 1024
      }
    }
  }
]
```

### /etc/modprobe.d/alsa-base.conf (ALC897 tweaks)
```
options snd_hda_intel power_save=0 power_save_controller=N
```

---

## Decisions

| Question | Answer | Confidence |
|---|---|---|
| Upsample to 96 kHz? | No — use allowed-rates list, not forced upsampling | High |
| Resampler quality | 10 — practical optimum, 2–3x CPU saving over 14 with no audible difference | High |
| Quantum / buffer | 1024 for listening, 512 if minor latency matters | High |
| Bit depth | S32LE for output to ALSA | Medium (verify hardware support) |
| ALC897 top issue | Jack detection inversion / auto-mute — disable Auto-Mute in alsamixer | High |
| EasyEffects chain for towers | Parametric EQ → Multiband Compressor → Limiter (no bass enhancer) | Medium |

---

## Sources

- [ArchWiki — PipeWire](https://wiki.archlinux.org/title/PipeWire)
- [docs.pipewire.org — pipewire.conf(5)](https://docs.pipewire.org/page_man_pipewire_conf_5.html)
- [WirePlumber ALSA configuration docs](https://pipewire.pages.freedesktop.org/wireplumber/daemon/configuration/alsa.html)
- [Head-Fi — Bit-perfect playback on Linux (PipeWire)](https://www.head-fi.org/threads/bit-perfect-playback-on-linux-pipewire.973318/)
- [EndeavourOS — HiFi sound configuration for PipeWire](https://forum.endeavouros.com/t/hifi-sound-configuration-for-pipewire/65407)
- [EndeavourOS — Audiophile guide](https://discovery.endeavouros.com/audio/audiophile/2022/01/)
- [Arch Forum — Bit-perfect audio with PipeWire](https://bbs.archlinux.org/viewtopic.php?id=290859)
- [Arch Forum — ALC897 two mobos issues](https://bbs.archlinux.org/viewtopic.php?id=297957)
- [Arch Forum — Z690/ALC897 surround](https://bbs.archlinux.org/viewtopic.php?id=280317)
- [ArchWiki — ALSA Troubleshooting](https://wiki.archlinux.org/title/Advanced_Linux_Sound_Architecture/Troubleshooting)
- [alsa-ucm-conf issue #590 — ALC897 no surround](https://github.com/alsa-project/alsa-ucm-conf/issues/590)
- [EasyEffects manual — Guide 1 (speaker optimization)](https://wwmm.github.io/easyeffects/guides/guide_1.html)
- [JackHack96/EasyEffects-Presets — Perfect EQ values](https://github.com/JackHack96/EasyEffects-Presets)
- [Digitalone1/EasyEffects-Presets](https://github.com/Digitalone1/EasyEffects-Presets)
- [Linux Mint Forum — ALC897 resolved](https://forums.linuxmint.com/viewtopic.php?t=449820)

#audio #linux #pipewire #easyeffects #alsa #realtek
