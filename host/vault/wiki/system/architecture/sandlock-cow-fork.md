---
title: Sandlock — COW Fork Sandbox
source: 'https://github.com/multikernel/sandlock'
created: '2026-03-19'
type: knowledge
tags:
  - sandbox
  - security
  - agent-spawning
  - cow-fork
  - landlock
  - seccomp
  - overlayfs
  - checkpoint-restore
confidence: 0.85
wiki_id: system/architecture/sandlock-cow-fork
imported_from: vault/Architecture/sandlock-cow-fork.md
imported_at: '2026-04-04T00:23:56.792Z'
summary: ''
---

# Sandlock — Landlock + seccomp-bpf COW Fork Sandbox

## What It Is
Sandlock combines Linux Landlock LSM, seccomp-bpf, and seccomp user notification to create userspace sandboxes without root privileges, cgroups, or containers. Key innovations:
- **COW forking** for near-instant process isolation
- **OverlayFS/BranchFS** COW filesystem for automatic write protection
- **Port virtualization** — multiple sandboxes bind the same port, no namespaces needed
- **Deterministic execution** — frozen time, seeded randomness, disabled ASLR
- **Checkpoint/restore** without CRIU or root
- Pure Python (ctypes to kernel interfaces), no C compiler required

## COW Fork Model
Initialize expensive state once, then fork COW clones that share memory. Each `fork()` is a real `os.fork()` — the kernel shares all pages copy-on-write.

```python
def init():
    global model
    model = load_model()       # 2 GB, loaded once

def work():
    seed = int(os.environ["SEED"])
    rollout(model, seed)       # reads COW-shared model

with Sandbox(policy, init, work) as sb:
    for seed in range(1000):
        sb.fork(env={"SEED": str(seed)}).wait()
```

How it works:
1. `Sandbox(policy, init, work)` forks a child, runs `init()`, child enters fork-ready loop on control socket
2. `sb.fork(env=...)` sends a command — main thread calls `os.fork()`, clone applies env and runs `work()`
3. No signals, no ptrace — main thread is in blocking `os.read()` (GIL released), forks cleanly
4. Each clone inherits Landlock + seccomp confinement via `fork()`

**Stats:**
- ~1ms per fork (vs Docker ~200ms, MicroVM ~100ms)
- 1000 clones of a 50 MB process use ~50 MB total, not 50 GB
- No root required, no daemon, pure userspace

## Comparison Table (from upstream)

| Feature | Sandlock | Container | MicroVM | gVisor |
|---------|----------|-----------|---------|--------|
| Root required | No | Yes* | Yes | Yes |
| Image build | No | Yes | Yes | Yes |
| Startup time | ~1ms (fork) | ~200ms | ~100ms | ~100ms |
| Kernel | Shared | Shared | Separate guest | Shared (sentry) |
| Filesystem isolation | Landlock | Overlay | Block-level | ptrace/KVM |
| Network isolation | Landlock + seccomp | Network namespace | TAP device | Sentry kernel |
| Syscall filtering | seccomp-bpf | seccomp | N/A | Sentry kernel |
| Resource limits | seccomp notif + SIGSTOP | cgroup v2 | VM config | cgroup v2 |
| Memory sharing | COW fork, zero-copy | Bind-mount + re-init | Explicit shared mem | N/A |
| Nesting | Native (fork) | Complex | Not supported | Supported |
| COW filesystem | OverlayFS/BranchFS | Overlay | Block-level | N/A |
| Checkpoint/restore | ptrace + BranchFS | CRIU | VM snapshot | N/A |

*Rootless containers require user namespace support, `/etc/subuid`, and `fuse-overlayfs`.

## Security Layers (Defense in Depth)

1. **Landlock** — filesystem (r/w/deny paths), TCP ports (bind/connect), IPC scoping, signal isolation. Irreversible via `landlock_restrict_self()`.
2. **seccomp-bpf** — blocks dangerous syscalls (`ptrace`, `mount`, `unshare`, `setns`, `kexec_load`, `bpf`, etc.). Argument-level filtering on `clone`/`clone3` namespace flags.
3. **seccomp user notification** — resource limits (memory, processes, CPU throttle, disk quota), port virtualization, `/proc`/`/sys` virtualization, domain-based network ACLs, deterministic time/randomness.

## Resource Limits (No cgroups, No root)

| Resource | Mechanism | Enforcement |
|----------|-----------|-------------|
| Memory | seccomp notif on `mmap`/`brk`/`mremap` | `ENOMEM` when over budget |
| Processes | seccomp notif on `clone`/`fork` | `EAGAIN` when at limit |
| CPU | SIGSTOP/SIGCONT cycling (100ms period) | Throttle to N% of one core |
| Open files | `RLIMIT_NOFILE` | Kernel-enforced |
| Disk | BranchFS FUSE layer | `ENOSPC` when quota exceeded |
| Ports | seccomp notif on `bind`/`connect` | Virtualize conflicting ports |

## Why Relevant to Our Agent System
Our dispatch system spawns 27+ agents. Current options:
- Docker containers: ~200ms startup, root daemon, resource overhead
- Direct processes: fast but no isolation
- Sandlock COW fork: **~1ms spawn + filesystem isolation + no root**

### Pattern: Cheap Agent Clone Spawning
1. Parent process loads agent context (SOUL, tools, memory)
2. COW fork -> child inherits all context at ~zero cost
3. Landlock restricts child to: agent workdir (COW-protected), read-only vault, scoped network (`net_allow_hosts`)
4. seccomp-bpf blocks dangerous syscalls (no ptrace, no mount, no namespace escape)
5. Resource limits cap memory/processes/CPU per agent without cgroups
6. Child runs task, writes results to shared pipe/file
7. Parent collects results, child exits — COW pages freed

### Bonus Features for Agent Use
- **Port virtualization**: multiple agents can bind same port (e.g., local HTTP tool servers) without conflicts
- **Deterministic execution**: reproducible agent runs with `time_start` + `random_seed`
- **Checkpoint/restore**: snapshot a warm agent, restore it later without re-initialization
- **Nested sandboxes**: an agent can sandbox its own sub-tools with stricter policy
- **Domain-based network ACLs**: `net_allow_hosts=["api.openai.com"]` — everything else blocked
- **Privileged mode**: UID 0 inside user namespace, but still confined by Landlock + seccomp

### Example Agent Policy
```python
from sandlock import Sandbox, Policy

agent_policy = Policy(
    fs_writable=["/tmp/agent-workdir"],
    fs_readable=["/home/trajan/vault", "/usr", "/lib", "/etc"],
    net_allow_hosts=["api.openai.com", "api.anthropic.com"],
    max_memory="512M",
    max_processes=10,
    max_cpu=50,
    isolate_ipc=True,
    isolate_signals=True,
    clean_env=True,
    workdir="/tmp/agent-workdir",  # auto-enables COW protection
)
```

## Requirements
- Linux 5.13+ (Landlock ABI v1). Full features need 6.7+ (TCP ports) or 6.12+ (IPC scoping).
- Python 3.10+
- No root, no cgroups, no C compiler
- Our VM runs 6.8.0 — compatible with all features except IPC scoping (needs 6.12)

## Status
**Monitor** — needs integration testing before practical use. Pure Python package (no pip release confirmed yet). The API is clean and well-designed. COW fork pattern maps directly to our dispatch needs. Worth prototyping with a single agent first.

## Related
- [[agent-rendered-infrastructure]] — lightweight agent spawning patterns
- [[intercept-mcp-guardrails]] — runtime policy enforcement
- [[Agent Architecture Overview]] — current dispatch system design
