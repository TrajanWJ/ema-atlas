# Design Decisions

Architectural decisions for the JarvisAI agent fleet, with rationale.

---

## DD-001: Single VM over Split VMs

**Decision:** Run all containers in a single KVM VM rather than separating Mission Control and OpenClaw into different VMs.

**Rationale:** Simpler management — one VM to start, stop, snapshot, and SSH into. Inter-container communication stays on a Docker bridge network instead of crossing VM boundaries. Can split later if isolation requirements change.

**Trade-off:** A compromised OpenClaw container has local network access to Mission Control. Mitigated by Docker network segmentation and read-only filesystems.

---

## DD-002: OpenClaw over IronClaw

**Decision:** Use OpenClaw as the AI gateway platform.

**Rationale:** Largest community, most integrations across messaging platforms (WhatsApp, Telegram, Slack, Discord, Signal, iMessage, Matrix, Teams, LINE, IRC). More active plugin/skill ecosystem. The VM boundary mitigates supply chain risk — even if OpenClaw is compromised, the blast radius is contained to the VM.

**Risk:** OpenClaw has a history of supply chain attacks (ClawHavoc incident, CVE-2026-25253). See [[Security/Hardening\|Hardening]] for mitigations.

---

## DD-003: Docker Socket Proxy (Tecnativa)

**Decision:** Use tecnativa/docker-socket-proxy instead of mounting the Docker socket directly into OpenClaw.

**Rationale:** Prevents privilege escalation. A compromised OpenClaw container cannot use the Docker socket to escape to the host. The proxy filters API calls — only CONTAINERS, NETWORKS, and IMAGES operations are allowed, with POST enabled for container lifecycle management.

**Alternative rejected:** Direct socket mount with read-only flag — still allows container creation with host mounts.

---

## DD-004: XFCE over GNOME

**Decision:** Use XFCE as the VM desktop environment.

**Rationale:** ~200MB RAM overhead vs ~1GB for GNOME. In a 14GB VM running Docker containers, every GB matters. XFCE provides the GUI needed for virt-viewer access without wasting resources.

---

## DD-005: virbr0 NAT Only

**Decision:** Use a single NAT network (virbr0, 192.168.122.0/24) for the VM.

**Rationale:** Provides both internet access (for pulling images, updates) and host access (for SSH, Mission Control web UI). No need for a separate bridge network. The VM gets a predictable static IP (192.168.122.10) via netplan.

**Trade-off:** VM is not directly accessible from other LAN devices. This is a feature, not a bug — limits attack surface.

---

## DD-006: Cloud-init Provisioning

**Decision:** Provision the VM using cloud-init (user-data, meta-data, network-config) rather than manual installation.

**Rationale:** Reproducible builds. The VM can be destroyed and recreated from the cloud image + cloud-init ISO in minutes. Configuration is version-controlled in `~/Desktop/JarvisAI/cloud-init/`.

---

## DD-007: Autologin

**Decision:** Configure lightdm for passwordless autologin to the XFCE session.

**Rationale:** The VM is a tool, not a user workstation. Requiring a password on every boot adds friction without security value — the VM boundary itself is the security layer. The workstation user already authenticated to start the VM.

---

## DD-008: Mission Control Bound to VM IP Only, OpenClaw No Published Ports

**Decision:** Mission Control publishes port 3000 only on 192.168.122.10 (the VM's IP). OpenClaw has no published ports at all.

**Rationale:** Mission Control needs to be accessible from the workstation browser. OpenClaw does not — it communicates with Mission Control over the Docker bridge network (agent-net) and with messaging platforms via outbound connections. No inbound port exposure minimizes attack surface.

---

## Related Notes

- [[System Overview]] — architecture diagram showing these decisions in context
- [[Security/Threat Model\|Threat Model]] — risk analysis that informed these decisions

#jarvisai #architecture #decisions
