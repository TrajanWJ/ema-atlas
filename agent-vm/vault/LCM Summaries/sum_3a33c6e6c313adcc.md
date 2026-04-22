# LCM Summary sum_3a33c6e6c313adcc

Created: 2026-03-19 22:50:53
Kind: condensed
Depth: 1
Conversation: 245
Tokens: 2015
Descendants: 8
Earliest: 2026-03-19T05:01:41.000Z
Latest: 2026-03-19T22:50:53.000Z

## Content

[2026-03-19 05:01 UTC - 2026-03-19 05:24 UTC]
[2026-03-19 05:01 UTC]
Reading https://raw.githubusercontent.com/volcengine/OpenViking/main/README.md...

  Source: readability | ~6250 tokens

![OpenViking](docs/images/banner.jpg)

### OpenViking: The Context Database for AI Agents

English / [中文](README_CN.md) / [日本語](README_JA.md)

[Website](https://www.openviking.ai) · [GitHub](https://github.com/volcengine/OpenViking) · [Issues](https://github.com/volcengine/OpenViking/issues) · [Docs](https://www.openviking.ai/docs)

[![][release-shield]][release-link]
[![][github-stars-shield]][github-stars-link]
[![][github-issues-shield]][github-issues-shield-link]
[![][github-contributors-shield]][github-contributors-link]
[![][license-shield]][license-shield-link]
[![][last-commit-shield]][last-commit-shield-link]

👋 Join our Community

📱 [Lark Group](./docs/en/about/01-about-us.md#lark-group) · [WeChat](./docs/en/about/01-about-us.md#wechat-group) · [Discord](https://discord.com/invite/eHvx8E9XF3) · [X](https://x.com/openvikingai)

[![volcengine%2FOpenViking | Trendshift](https://trendshift.io/api/badge/repositories/19668)](https://trendshift.io/repositories/19668)

---

## Overview

### Challenges in Agent Development

In the AI era, data is abundant, but high-quality context is hard to come by. When building AI Agents, developers often face these challenges:

- **Fragmented Context**: Memories are in code, resources are in vector databases, and skills are scattered, making them difficult to manage uniformly.
- **Surging Context Demand**: An Agent's long-running tasks produce context at every execution. Simple truncation or compression leads to information loss.
- **Poor Retrieval Effectiveness**: Traditional RAG uses flat storage, lacking a global view and making it difficult to understand the full context of information.
- **Unobservable Context**: The implicit retrieval chain of traditional RAG is like a black box, making it hard to debug when errors occur.
- **Limited Memory Iteration**: Current memory is just a record of user interactions, lacking Agent-related task memory.

### The OpenViking Solution

**OpenViking** is an open-source **Context Database** designed specifically for AI Agents.

We aim to define a minimalist context interaction paradigm for Agents, allowing developers to completely say goodbye to the hassle of context management. OpenViking abandons the fragmented vector storage model of traditional RAG and innovatively adopts a **"file system paradigm"** to unify the structured organization of memories, resources, and skills needed by Agents.

With OpenViking, developers can build an Agent's brain just like managing local files:

- **Filesystem Management Paradigm** → **Solves Fragmentation**: Unified context management of memories, resources, and skills based on a filesystem paradigm.
- **Tiered Context Loading** → **Reduces Token Consumption**: L0/L1/L2 three-tier structure, loaded on demand, significantly saving costs.
- **Directory Recursive Retrieval** → **Improves Retrieval Effect**: Supports native filesystem retrieval methods, combining directory positioning with semantic search to achieve recursive and precise context acquisition.
- **Visualized Retrieval Trajectory** → **Observable Context**: Supports visualization of directory retrieval trajectories, allowing users to clearly observe the root cause of issues and guide retrieval logic optimization.
- **Automatic Session Management** → **Context Self-Iteration**: Automatically compresses content, resource references, tool calls, etc., in conversations, extracting long-term memory, making the Agent smarter with use.

---

## Quick Start

### Prerequisites

Before starting with OpenViking, please ensure your environment meets the following requirements:

- **Python Version**: 3.10 or higher
- **Go Version**: 1.22 or higher (Required for building AGFS components)
- **C++ Compiler**: GCC 9+ or Clang 11+ (Required for building core extensions)
- **Operating System**: Linux, macOS, Windows
- **Network Connection**: A stable network connection is required (for downloading dependencies and accessing model services)

### 1. Installation

#### Python Package

```bash
pip install openviking --upgrade --force-reinstall
```

#### Rust CLI (Optional)

```bash
curl -fsSL https://raw.githubusercontent.com/volcengine/OpenViking/main/crates/ov_cli/install.sh | bash
```

Or build from source:

```bash
cargo install --git https://github.com/volcengine/OpenViking ov_cli
```

### 2. Model Preparation

OpenViking requires the following model capabilities:
- **VLM Model**: For image and content understanding
- **Embedding Model**: For vectorization and semantic retrieval

#### Supported VLM Providers

OpenViking supports three VLM providers:

| Provider | Description | Get API Key |
|----------|-----------
[LCM fallback summary; truncated for context management]

[2026-03-19 05:24 UTC - 2026-03-19 07:43 UTC]
[2026-03-19 05:24 UTC]
Reading https://raw.githubusercontent.com/Touchpoint-Labs/Touchpoint/main/README.md...

  Source: readability | ~4272 tokens

# Touchpoint

  
    **Give your AI agent eyes and hands on any desktop.**

  
    [![PyPI](https://img.shields.io/pypi/v/touchpoint-py?color=blue)](https://pypi.org/project/touchpoint-py/)
    [![Python](https://img.shields.io/pypi/pyversions/touchpoint-py)](https://pypi.org/project/touchpoint-py/)
    [![MIT License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
    [![Alpha](https://img.shields.io/badge/status-alpha-orange)](#status)
    **
    ![Linux](https://img.shields.io/badge/Linux-FCC624?logo=linux&logoColor=black)
    ![macOS](https://img.shields.io/badge/macOS-000000?logo=apple&logoColor=white)
    ![Windows](https://img.shields.io/badge/Windows-0078D6?logo=windows&logoColor=white)
  
  
    `pip install touchpoint-py`
  

![Touchpoint demo — AI agent creates a formatted Excel table using Touchpoint](docs/demo.gif)
AI agent researches data in Chrome, then creates a formatted Excel table — full task completed in ~12 minutes

---

Touchpoint is a **cross-platform Python library** for reading and interacting with desktop UI through native accessibility APIs. One import, one API — works on Linux, macOS, and Windows, with built-in support for Chromium and Electron apps via CDP (Chrome DevTools Protocol).

Instead of scraping pixels or running vision models, Touchpoint reads the real accessibility tree — structured names, roles, states, and positions for every element on screen. Fast and reliable, with no model inference needed. Ships with an MCP server so LLM agents like Claude or Cursor can control any desktop app out of the box.

```python
import touchpoint as tp

elements = tp.find("Send", role=tp.Role.BUTTON, app="Slack")
tp.click(elements[0])
```

### Why Touchpoint?

| | Screenshot / vision | Browser automation | **Touchpoint** |
|---|---|---|---|
| Native desktop apps | ⚠️ inaccurate or slow | ❌ | ✅ structured access |
| Browsers | ⚠️ inaccurate or slow | ✅ | ✅ via CDP |
| Electron apps (Slack, VS Code, ...) | ⚠️ inaccurate or slow | ⚠️ web content only | ✅ native + web |
| Structured element data | ❌ needs OCR/vision models | ✅ web only | ✅ names, roles, states, positions |
| Works across Linux, macOS, Windows | ✅ | ✅ | ✅ |

---

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Install](#install)
  - [Platform requirements](#platform-requirements)
- [Quick Start](#quick-start)
  - [Element IDs](#element-ids)
  - [Output formats](#output-formats)
- [MCP Server](#mcp-server)
  - [Tools](#tools)
  - [Client setup](#client-setup)
  - [Environment variables](#environment-variables)
- [Browser \& Electron Apps (CDP)](#browser--electron-apps-cdp)
  - [Setup](#setup)
- [API Reference](#api-reference)
  - [Discovery](#discovery)
  - [Search \& Wait](#search--wait)
  - [Actions](#actions)
  - [Input](#input)
  - [Screenshot \& Config](#screenshot--config)
- [Architecture](#architecture)
- [Configuration](#configur
[LCM fallback summary; truncated for context management]
