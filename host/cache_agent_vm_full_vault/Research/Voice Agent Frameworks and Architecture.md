---
title: "Voice Agent Frameworks and Architecture"
type: research
created: 2026-03-24
updated: 2026-04-12
confidence: high
source: primary research, GitHub repos, official documentation
tags: [voice-agents, webrtc, speech-to-speech, pipecat, livekit, real-time-ai]
summary: "Comprehensive survey of voice agent frameworks (Pipecat, LiveKit, Vocode, Bolna), end-to-end speech models (Moshi, Ultravox), architecture patterns, and latency optimization techniques."
---

# Voice Agent Frameworks and Architecture

Research compiled: 2026-03-24

Related: [[Voice Agent Prompts and UX Patterns]] | [[Agent Memory Architectures]] | [[AI Agent Landscape]]

## Executive Summary

The voice agent ecosystem has matured rapidly. Two dominant open-source frameworks have emerged — **Pipecat** and **LiveKit Agents** — alongside end-to-end speech models like **Moshi** and **Ultravox** that challenge the traditional STT→LLM→TTS pipeline. The space is converging on WebRTC as the transport layer, Silero VAD as the standard voice activity detector, and streaming architectures that target sub-500ms response latency.

---

## 1. Major Open Source Frameworks

### Pipecat (Daily.co)
- **Repo:** https://github.com/pipecat-ai/pipecat
- **Stars:** ~10,800 ⭐
- **Language:** Python
- **License:** BSD-2-Clause
- **What it is:** Open-source Python framework for building real-time voice and multimodal conversational agents. Created by Daily.co (the WebRTC infrastructure company).

**Architecture:**
- Composable pipeline model — processors chained together in a DAG
- Each processor handles one concern: VAD, STT, LLM, TTS, transport, etc.
- Supports WebSocket and WebRTC transports (via Daily.co or custom)
- Ultra-low latency design with streaming at every stage

**Key Features:**
- Massive integration ecosystem: 18+ STT providers (Deepgram, AssemblyAI, Azure, Google, Whisper, etc.), 20+ LLMs (OpenAI, Anthropic, Gemini, Groq, Ollama, etc.), 15+ TTS providers (ElevenLabs, Cartesia, Deepgram, AWS Polly, etc.)
- Client SDKs: JavaScript, React, React Native, Swift, Kotlin, C++, ESP32
- Pipecat Flows for structured conversation state machines
- Pipecat CLI for scaffolding and deployment to Pipecat Cloud
- Whisker debugger for real-time pipeline inspection
- Tail terminal dashboard

**Ecosystem:**
- `pipecat-flows` — conversation state management
- `voice-ui-kit` — frontend components
- `pipecat-cli` — project scaffolding + deployment
- `whisker` — real-time debugger
- `pipecat-esp32` — embedded/IoT support
- Claude Code skills integration

**Best for:** Maximum flexibility, rapid prototyping, widest provider support, custom pipeline topologies.

---

### LiveKit Agents
- **Repo:** https://github.com/livekit/agents (Python), https://github.com/livekit/agents-js (Node.js)
- **Stars:** ~9,800 ⭐ (Python), ~780 ⭐ (JS)
- **Language:** Python and Node.js/TypeScript
- **License:** Apache 2.0
- **Parent:** https://github.com/livekit/livekit (~17,800 ⭐) — Go-based WebRTC SFU

**Architecture:**
- Agent = LLM with instructions + tools
- AgentSession = container managing interactions with end users
- AgentServer = orchestrator for job scheduling and agent lifecycle
- Built on LiveKit's WebRTC media server (SFU written in Go)
- Full telephony integration (SIP/PSTN via LiveKit's telephony stack)

**Key Features:**
- Semantic turn detection using custom transformer model (not just silence-based!)
- Built-in test framework with judges for agent evaluation
- MCP (Model Context Protocol) native support
- Multi-agent handoff patterns (sequential handoff between specialized agents)
- Integrated job scheduling and dispatch APIs
- RPCs and Data APIs for client-agent data exchange
- LiveKit Inference — unified API for accessing models via LiveKit Cloud
- Agent Builder — browser-based prototype tool (no code required)
- Kubernetes-ready with load balancing

**Plugin Ecosystem (Python):**
- STT: Deepgram, OpenAI Whisper, AssemblyAI, Azure, Google, etc.
- LLM: OpenAI, Anthropic, Google, Groq, Ollama, etc.
- TTS: Cartesia, ElevenLabs, Deepgram, Azure, etc.
- VAD: Silero
- Realtime: OpenAI Realtime API, Google Gemini Live
- Avatars: Anam, Bey, LemonSlice

**Best for:** Production deployments needing WebRTC infrastructure, telephony integration, multi-agent orchestration, enterprise-grade scaling.

---

### Vocode
- **Repo:** https://github.com/vocodedev/vocode-core
- **Stars:** ~3,700 ⭐
- **Language:** Python
- **License:** MIT
- **Status:** Looking for community maintainers (less actively developed)

**Architecture:**
- StreamingConversation as the core abstraction
- Pluggable Transcriber → Agent → Synthesizer pipeline
- Telephony-first design (Twilio, Zoom dial-in)

**Key Features:**
- Out-of-box telephony: inbound/outbound calls via Twilio
- Zoom meeting integration
- Langchain agent support
- PunctuationEndpointingConfig for turn detection
- System audio capture for local conversations

**Integrations:**
- STT: Deepgram, AssemblyAI, Gladia, Google, Azure, RevAI, Whisper
- LLM: OpenAI, Anthropic
- TTS: ElevenLabs, Azure, Google, Play.ht, Cartesia, Coqui (OSS), AWS Polly, Bark

**Best for:** Quick telephony prototypes, Twilio integration. Note: development has slowed — consider Pipecat or LiveKit for new projects.

---

### Bolna
- **Repo:** https://github.com/bolna-ai/bolna
- **Stars:** ~600 ⭐
- **Language:** Python
- **License:** MIT

**Architecture:**
- End-to-end voice agent platform orchestrating ASR+LLM+TTS over WebSockets
- Docker-based local setup with Twilio/Plivo telephony + ngrok tunneling + Redis
- JSON-driven agent configuration

**Key Features:**
- Telephony providers: Twilio, Plivo (Exotel, Vonage coming)
- Simple Python API: `Assistant` → `add_task()` → `execute()`
- Hosted API and no-code playground available (closed source)

**Best for:** Quick telephony voice agents with minimal code, JSON-configurable pipelines.

---

## 2. End-to-End Speech Models (Pipeline-Free)

### Moshi (Kyutai Labs)
- **Repo:** https://github.com/kyutai-labs/moshi
- **Stars:** ~9,900 ⭐
- **License:** CC-BY 4.0 (model weights), Apache 2.0 (code)

**Architecture — Full-Duplex Spoken Dialogue:**
- Models TWO audio streams simultaneously: Moshi speaking + user speaking
- "Inner monologue" — predicts text tokens of its own speech for quality improvement
- Depth Transformer (inter-codebook) + 7B Temporal Transformer (temporal dependencies)
- Uses **Mimi** neural audio codec: 24kHz → 12.5Hz representation at 1.1kbps, fully streaming
- **160ms theoretical latency** (80ms Mimi frame + 80ms acoustic delay), ~200ms practical on L4 GPU

**Key Innovation:**
- No separate STT/TTS stages — true end-to-end speech-to-speech
- Full-duplex: can listen while speaking (natural conversation)
- Mimi codec outperforms SpeechTokenizer and SemantiCodec at lower bitrates
- Distillation from WavLM for semantic+acoustic in single model

**Implementations:** PyTorch (research), MLX (Mac/iPhone), Rust (production)
**Fine-tune repo:** https://github.com/kyutai-labs/moshi-finetune
**Related:** Hibiki (simultaneous speech translation), Kyutai TTS/STT

**Best for:** Research into pipeline-free voice agents, full-duplex conversation, lowest theoretical latency.

---

### Ultravox (Fixie AI)
- **Repo:** https://github.com/fixie-ai/ultravox
- **Stars:** ~4,400 ⭐
- **License:** MIT (code), varies (models)

**Architecture:**
- Multimodal LLM that directly understands audio — no separate ASR stage
- Audio → multimodal projector → LLM token space (extends Llama/Mistral/Gemma)
- Currently: audio in → streaming text out (speech token output in development)
- Default: Llama 3.3 70B base, 8B variant available

**Key Innovation:**
- Eliminates ASR latency by processing audio natively
- Builds on AudioLM, SeamlessM4T, Gazelle, SpeechGPT research
- Future: native paralinguistic understanding (timing, emotion)

**Best for:** Ultra-low-latency voice understanding, replacing STT in pipelines, research.

---

## 3. OpenAI Realtime API Ecosystem

### OpenAI Realtime Console
- **Repo:** https://github.com/openai/openai-realtime-console
- **Stars:** ~3,600 ⭐
- React app for inspecting/debugging Realtime API over WebRTC
- Reference implementation for WebRTC data channel communication

### OpenAI Realtime Agents
- **Repo:** https://github.com/openai/openai-realtime-agents
- **Stars:** ~6,800 ⭐
- Next.js demo showcasing advanced agentic patterns

**Two Architectural Patterns:**
1. **Chat-Supervisor:** Realtime chat agent (gpt-4o-realtime-mini) handles conversation, defers complex tasks to text-based supervisor (gpt-4.1). ~2s latency for deferred responses.
2. **Sequential Handoff:** Specialized realtime agents transfer users between domains (like customer service routing). Avoids instruction/tool overload in single agent.

### OpenAI Agents SDK (JS)
- **Repo:** https://github.com/openai/openai-agents-js
- **Stars:** ~2,500 ⭐
- Multi-agent workflows + voice agents in JavaScript/TypeScript
- Features: Agents, handoffs, tools (functions + MCP), guardrails, sessions, tracing
- Realtime Agents for voice with full feature set
- Provider-agnostic despite OpenAI branding

---

## 4. Voice-Specific Middleware & Components

### Silero VAD
- **Repo:** https://github.com/snakers4/silero-vad
- **Stars:** ~8,600 ⭐
- **The de facto standard VAD** — used by Pipecat, LiveKit, and most voice frameworks
- Pre-trained, enterprise-grade Voice Activity Detector
- ONNX + PyTorch support, runs on CPU
- Minimal footprint: works on 1G RAM, Python 3.8+
- Real-time capable with configurable thresholds

### Turn Detection Approaches

| Approach | Used By | How It Works | Tradeoffs |
|---|---|---|---|
| **Silence-based** | Most basic setups | Fixed silence duration triggers end-of-turn | Simple but causes premature cutoffs or long waits |
| **Punctuation-based** | Vocode | STT punctuation signals end of utterance | Better than silence, but depends on STT accuracy |
| **VAD-based** | Pipecat, most frameworks | Silero VAD detects speech/non-speech | Good baseline, configurable thresholds |
| **Semantic turn detection** | LiveKit Agents | Custom transformer model predicts turn completion | Best accuracy, reduces false interruptions |
| **End-to-end** | Moshi | Model inherently handles turn-taking in dual-stream | Most natural but requires specialized model |

### Interruption Handling Patterns

1. **Hard interrupt:** Stop TTS immediately when user speaks → responsive but can cause choppy UX
2. **Soft interrupt:** Fade out current TTS, buffer user input → smoother but adds latency
3. **Full-duplex:** Process both streams simultaneously (Moshi) → most natural, hardest to implement
4. **VAD + debounce:** Wait for sustained speech before interrupting → reduces false positives

### Endpointing Configuration (Common Parameters)
- `min_silence_duration_ms` — how long silence before considering turn complete (200-1000ms typical)
- `speech_pad_ms` — padding around detected speech segments
- `threshold` — VAD confidence threshold (0.3-0.7 typical)
- `prefix_padding_ms` — audio to keep before speech onset
- `max_speech_duration_s` — maximum single utterance length

---

## 5. Architecture Patterns

### Pattern 1: Classic STT → LLM → TTS Pipeline
```
User Audio → [VAD] → [STT] → Text → [LLM] → Response Text → [TTS] → Audio → User
```
- **Latency:** Sum of all stages (typically 800ms-2s total)
- **Optimization:** Stream at every stage — start TTS before LLM finishes, stream STT partials to LLM
- **Used by:** Pipecat, LiveKit, Vocode, Bolna, most production systems
- **Advantage:** Mix and match best providers for each stage
- **Disadvantage:** Cumulative latency, loses paralinguistic information between stages

### Pattern 2: End-to-End Speech Model
```
User Audio → [Speech-to-Speech Model] → Agent Audio → User
```
- **Latency:** Single model inference (~160-300ms)
- **Used by:** Moshi, OpenAI Realtime API (gpt-4o-realtime)
- **Advantage:** Lowest latency, preserves tone/emotion, natural turn-taking
- **Disadvantage:** Less flexible, fewer model choices, can't swap components

### Pattern 3: Hybrid (Chat-Supervisor)
```
User Audio → [Realtime Model for conversation] ←→ [Text LLM for complex tasks]
                     ↓
              Agent Audio → User
```
- **Used by:** OpenAI Realtime Agents demo
- **Advantage:** Fast responses for simple queries, smart responses for complex ones
- **Disadvantage:** ~2s added latency for supervisor-deferred tasks

### Pattern 4: Multi-Agent Handoff
```
User → [Router Agent] → [Specialist Agent A] → [Specialist Agent B] → ...
```
- **Used by:** OpenAI Realtime Agents (sequential handoff), LiveKit multi-agent
- **Advantage:** Keeps each agent focused, avoids instruction overload
- **Disadvantage:** Handoff latency, state transfer complexity

### WebRTC vs WebSocket Transport

| Feature | WebRTC | WebSocket |
|---|---|---|
| Latency | Lower (UDP, DTLS) | Higher (TCP) |
| NAT traversal | Built-in (ICE, TURN) | Requires proxy |
| Audio quality | Opus codec, jitter buffer | Raw audio frames |
| Echo cancellation | Built-in AEC | Must implement separately |
| Browser support | Native | Native |
| Complexity | Higher setup | Simpler |
| Recommended for | Production voice agents | Prototyping, server-to-server |

**Industry consensus:** WebRTC for production, WebSocket for quick prototyping.

---

## 6. Latency Optimization Techniques

### STT Optimizations
- Use streaming/partial results (don't wait for final transcript)
- Deepgram Nova-3 and AssemblyAI Universal offer lowest latency streaming
- Pre-warm connections, reuse WebSocket sessions

### LLM Optimizations
- Stream tokens — start TTS on first sentence/phrase, not full response
- Use faster models for simple turns (gpt-4o-mini, Groq for <100ms inference)
- Speculative execution — start generating before user finishes (risky)
- Sentence-level chunking for TTS handoff

### TTS Optimizations
- Streaming synthesis — Cartesia Sonic, ElevenLabs Turbo, Deepgram Aura
- Pre-buffer first ~200ms before playback for smoother start
- Voice cloning + caching for consistent, fast synthesis
- Use SSML or phoneme hints to reduce synthesis retries

### System-Level Optimizations
- Co-locate services in same region/datacenter
- Use WebRTC (UDP) instead of WebSocket (TCP)
- Keep-alive connections to all providers
- Implement proper audio buffering and jitter handling
- Target metrics: <500ms first-byte, <1s full response

---

## 7. Deepgram AI Agent Platform
- **Demo repo:** https://github.com/deepgram-devs/deepgram-ai-agent-demo (~400 ⭐)
- Combined STT (Nova) + TTS (Aura) in a WebSocket-based conversational agent
- Agent API endpoint: `wss://agent.deepgram.com/v1/agent/converse`
- JWT-based authentication with session-scoped temporary keys
- Focus on lowest-latency STT as competitive advantage

---

## 8. Hume AI — Empathic Voice
- **Repo:** https://github.com/HumeAI/hume-api-examples (~240 ⭐)
- **Unique angle:** Emotion-aware voice AI
- EVI (Empathic Voice Interface) for conversational agents with emotional intelligence
- Expression measurement: facial, vocal, and language-based analysis
- SDK examples: Python, TypeScript, Next.js, React Native, Flutter, Vue, TouchDesigner
- TTS with empathic expression (tone carries emotion)
- Custom Language Models (CLM) via SSE and WebSocket endpoints

---

## 9. Commercial Platforms (Closed Source, APIs Only)

| Platform | Focus | Notable Feature |
|---|---|---|
| **VAPI** | Voice agent API platform | Managed infrastructure, simple API |
| **Retell AI** | Conversational voice AI | Low-latency, enterprise telephony |
| **Bland AI** | Phone call AI agents | Focuses on outbound calling at scale |
| **Play.ai** | Voice agent builder | Text-to-speech focus, PlayDialog model |
| **Deepgram** | Speech AI platform | Fastest STT (Nova-3), Aura TTS, Agent API |
| **AssemblyAI** | Speech understanding | Universal model, LeMUR for audio intelligence |

---

## 10. Key Architectural Insights

### What the best frameworks have in common:
1. **Streaming everything** — no stage waits for the previous to complete fully
2. **Silero VAD as standard** — nearly every framework uses it
3. **WebRTC for production** — LiveKit's SFU is the infrastructure backbone
4. **Plugin/provider agnostic** — swap STT/LLM/TTS without code changes
5. **Interruption as first-class** — not an afterthought, designed into the pipeline

### Where the field is heading:
1. **End-to-end models** replacing pipelines (Moshi, Ultravox, OpenAI Realtime)
2. **Semantic turn detection** replacing silence-based endpointing
3. **Multi-agent voice** — specialized agents handling different intents
4. **Full-duplex** — listening while speaking becoming expected
5. **MCP integration** — voice agents gaining tool use via Model Context Protocol
6. **Emotion-aware** — Hume leading, others following with paralinguistic understanding

### Decision Matrix: Which Framework to Use

| Need | Best Choice | Why |
|---|---|---|
| Fastest prototype | Pipecat | Widest integrations, simple pipeline model |
| Production at scale | LiveKit Agents | WebRTC infra, job scheduling, Kubernetes |
| Telephony focus | Vocode or Bolna | Built-in Twilio/Plivo support |
| Lowest latency | Moshi or OpenAI Realtime | End-to-end models, no pipeline overhead |
| Emotion-aware | Hume EVI | Only platform with native expression analysis |
| OpenAI ecosystem | OpenAI Agents SDK | Native Realtime API, handoffs, guardrails |
| Research/custom model | Ultravox | Train your own multimodal speech LLM |

---

## 11. Repository Quick Reference

| Repo | Stars | Language | Category |
|---|---|---|---|
| [livekit/livekit](https://github.com/livekit/livekit) | ~17,800 | Go | WebRTC SFU |
| [pipecat-ai/pipecat](https://github.com/pipecat-ai/pipecat) | ~10,800 | Python | Voice framework |
| [kyutai-labs/moshi](https://github.com/kyutai-labs/moshi) | ~9,900 | Python/Rust | E2E speech model |
| [livekit/agents](https://github.com/livekit/agents) | ~9,800 | Python | Voice framework |
| [snakers4/silero-vad](https://github.com/snakers4/silero-vad) | ~8,600 | Python | VAD middleware |
| [openai/openai-realtime-agents](https://github.com/openai/openai-realtime-agents) | ~6,800 | TypeScript | Voice agent demo |
| [fixie-ai/ultravox](https://github.com/fixie-ai/ultravox) | ~4,400 | Python | E2E speech model |
| [vocodedev/vocode-core](https://github.com/vocodedev/vocode-core) | ~3,700 | Python | Voice framework |
| [openai/openai-realtime-console](https://github.com/openai/openai-realtime-console) | ~3,600 | TypeScript | Realtime API demo |
| [openai/openai-agents-js](https://github.com/openai/openai-agents-js) | ~2,500 | TypeScript | Agent framework |
| [livekit/agents-js](https://github.com/livekit/agents-js) | ~780 | TypeScript | Voice framework |
| [bolna-ai/bolna](https://github.com/bolna-ai/bolna) | ~600 | Python | Voice platform |
| [deepgram-devs/deepgram-ai-agent-demo](https://github.com/deepgram-devs/deepgram-ai-agent-demo) | ~400 | TypeScript | Agent demo |
| [HumeAI/hume-api-examples](https://github.com/HumeAI/hume-api-examples) | ~240 | Multi | API examples |

---

*Star counts as of March 2026. See individual repos for current numbers.*
