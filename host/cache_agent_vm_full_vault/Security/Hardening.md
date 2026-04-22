---
title: "Hardening"
created: 2026-03-14
updated: 2026-03-16
type: security
status: active
confidence: 0.50
confidence_updated: 2026-03-18
source: security
tags: [agent-vm, hardening, security]
summary: "The Tecnativa proxy exposes a subset of the systemd API:"
---
# Hardening

## 7 Security Layers

| Layer | What It Does |
|---|---|
| 1. VM Boundary | KVM hypervisor isolates agent fleet from workstation. VM compromise does not equal host compromise. |
| 2. systemd Hardening | Per-container: read_only, cap_drop ALL, no-new-privileges, memory/CPU/PID limits |
| 3. Network Segmentation | agent-net for inter-service communication; sandbox-net (internal) for isolated sandboxes |
| 4. Volume Isolation | Named volumes only — no host path mounts (except systemd socket via proxy) |
| 5. API Key Management | Credentials in .env file on VM, never baked into images. .env.example in repo with placeholder values. |
| 6. UFW + DOCKER-USER | Firewall rules on VM + iptables DOCKER-USER chain to prevent systemd from bypassing UFW |
| 7. Sandbox Isolation | [[OpenClaw]] sandboxes run on internal network (no internet), MAX_SANDBOXES=1, spawned via filtered socket proxy |

## Per-Container Security

### docker-socket-proxy (Tecnativa)

| Setting | Value | Purpose |
|---|---|---|
| read_only | true | Immutable filesystem |
| cap_drop | ALL | No Linux capabilities |
| no-new-privileges | true | Cannot escalate privileges |
| mem_limit | 128m | Prevent resource exhaustion |
| systemd socket | mounted :ro | Read-only socket access |
| CONTAINERS | 1 | Allow container operations |
| NETWORKS | 1 | Allow network operations |
| IMAGES | 1 | Allow image operations |
| POST | 1 | Allow write operations (create/start/stop) |

**What's blocked:** Everything else — volumes, exec, swarm, secrets, configs, plugins, system, auth, build, commit. A compromised [[OpenClaw]] cannot use the proxy to mount host paths or exec into other containers.

### openclaw-gateway

| Setting | Value | Purpose |
|---|---|---|
| cap_drop | NET_RAW, NET_ADMIN | Cannot sniff or manipulate network |
| no-new-privileges | true | Cannot escalate privileges |
| mem_limit | 4g | Hard memory ceiling |
| cpus | 3 | CPU quota |
| pids_limit | 512 | Prevent fork bombs |
| DOCKER_HOST | tcp://docker-socket-proxy:2375 | Filtered systemd access only |
| DISABLE_DM_PAIRING | true | No direct message pairing |
| MAX_SANDBOXES | 1 | Limit concurrent sandboxes |
| SANDBOX_NETWORK | sandbox-net | Sandboxes on internal network |

## OpenClaw-Specific Hardening

- **DM pairing disabled** (`DISABLE_DM_PAIRING=true`): Prevents users from pairing with the bot via direct messages. All connections go through configured platform channels.
- **MAX_SANDBOXES=1**: Limits concurrent sandbox containers. Prevents resource exhaustion from runaway skill execution.
- **sandbox-net is internal**: Sandbox containers have no internet access. They can only communicate with the [[OpenClaw]] gateway.
- **systemd access via proxy only**: [[OpenClaw]] never touches the real systemd socket. The proxy filters API calls.

## systemd Socket Proxy — Filtered Access

The Tecnativa proxy exposes a subset of the systemd API:

| Operation | Allowed | Why |
|---|---|---|
| Containers (list, create, start, stop, remove) | Yes | [[OpenClaw]] needs to manage sandboxes |
| Networks (list, inspect) | Yes | [[OpenClaw]] needs to attach sandboxes to sandbox-net |
| Images (list, pull) | Yes | [[OpenClaw]] needs to pull sandbox images |
| Volumes | No | Prevents mounting host paths |
| Exec | No | Prevents executing commands in other containers |
| Swarm, Secrets, Configs | No | Not needed, attack surface reduction |
| System, Auth, Build | No | Prevents privilege escalation |

## Known Risks

### ClawHavoc Supply Chain Attack

[[OpenClaw]] has a documented history of supply chain compromise (the "ClawHavoc" incident). A malicious actor published compromised skill packages to the [[OpenClaw]] skill registry.

**Mitigations:**
- VM boundary limits blast radius
- systemd Socket Proxy prevents container escape
- Sandbox containers on internal network
- Manual review of skills before installation
- Pin skill versions, don't auto-update

### CVE-2026-25253

A vulnerability in [[OpenClaw]]'s skill execution pipeline. Check [[OpenClaw]] release notes for patches.

**Mitigations:**
- Keep [[OpenClaw]] updated to latest patched version
- MAX_SANDBOXES=1 limits concurrent exposure
- sandbox-net isolation prevents lateral movement

## Related Notes

- [[Threat Model]] — attack surface analysis and incident response
- [[Architecture/Design Decisions|Design Decisions]] — why these choices were made
- [[Configuration/systemd Stack|systemd Stack]] — full compose file with security settings
- [[Configuration/Networking|Networking]] — UFW and DOCKER-USER chain details

#agent-vm #security #hardening
- [[FlorianBruniaux-claude-code-ultimate-guide]]
- [[SOUL]]
- [[capabilities]]
- [[project_obsidian_vault]]
- [[rohitg00-awesome-claude-code-toolkit]]
