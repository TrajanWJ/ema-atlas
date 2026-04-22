---
title: "Kali MCP Server — AI-Assisted Penetration Testing"
created: 2026-03-18
updated: 2026-03-18
type: research
status: active
source: unknown
---

# Kali MCP Server — AI-Assisted Penetration Testing

**Source:** [Wh0am123/MCP-Kali-Server](https://github.com/Wh0am123/MCP-Kali-Server) · 577+ stars
**Status:** Documented, not installed (no Kali box currently)

## What It Is

Lightweight API bridge connecting MCP clients (Claude Desktop, 5ire, etc.) to a Linux terminal. Enables AI-driven offensive security testing: recon, exploitation, CTF solving in real-time.

## Supported Tools

| Tool | Purpose |
|------|---------|
| **Nmap** | Network scanning, port enumeration |
| **Metasploit** | Exploitation framework |
| **sqlmap** | SQL injection testing |
| **Hydra** | Password brute forcing |
| **John the Ripper** | Password hash cracking |
| **Gobuster** | Directory/file enumeration |
| **Nikto** | Web server scanning |
| **WPScan** | WordPress vulnerability scanning |
| **Dirb** | Directory brute forcing |
| **enum4linux** | SMB/Samba enumeration |
| **Raw commands** | Any terminal command |

## Use Cases

- Automated reconnaissance
- CTF challenge solving (demo: web CTF + HackTheBox)
- Memory forensics (Volatility)
- Disk forensics (SleuthKit)
- Red team automation

## Installation

### On Kali Linux (easiest)
```bash
sudo apt install mcp-kali-server
kali-server-mcp
```

### From source
```bash
git clone https://github.com/Wh0am123/MCP-Kali-Server.git
cd MCP-Kali-Server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
./server.py --ip 127.0.0.1 --port 5000
```

### Remote access (recommended: SSH tunnel)
```bash
# Terminal 1 — SSH tunnel to Kali box
ssh -L 5000:localhost:5000 user@KALI_IP

# Terminal 2 — client
./client.py --server http://127.0.0.1:5000
```

## Integration Path

1. Set up a Kali VM or container
2. Install MCP-Kali-Server
3. SSH tunnel from agent-vm
4. Add to OpenClaw MCP config or Claude Code settings
5. Security agent (🛡️) gets full offensive tooling

## Related
- [[Security Audit 2026-03-16]] — Last security work
- [[Tool Integration March 2026]] — Integration tracker
