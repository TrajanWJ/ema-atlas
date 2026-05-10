<!-- wiki-id: ema:peer-computer-access -->
<!-- see-also: ema:host-node-doctrine, ema:transport-auth-decision, ema:transport-auth-survey -->

# 13 — Peer Computer Access

Status: proposed dev/operator rail
Date: 2026-04-24

This note answers the practical onboarding question: if EMA needs two trusted
machines to work together now, without Tailscale, what should we actually use?

## Decision

Use **OS-native SSH as the first trusted peer rail**.

Do not use the unauthenticated dev-update HTTP server as the main peer model.
It remains a throwaway file-transfer helper. The first real peer should be
onboarded as a trusted operating-system account with SSH key access, admin
membership where appropriate, and auditable sudo escalation.

Longer term, EMA-native peer transport still wants Iroh for daemon-to-daemon
streams. SSH is the bootstrap/operator rail; Iroh is the product rail.

## Why not Tailscale

Tailscale works, but it makes an external overlay's identity and ACL system sit
above EMA's own device trust model. That is acceptable as an optional power-user
path later, not as the default.

For the first peer, EMA needs to learn its own primitives:

- device identity;
- peer trust;
- operator access;
- sudo-capable actions;
- audit trail;
- update/bootstrap flow;
- remote agent dispatch.

Outsourcing that too early hides the product questions.

## What "complete access" means

There are three separate grants. Do not collapse them in the product model even
if the same human receives all three during early dev.

| Grant | Meaning | First implementation |
| --- | --- | --- |
| Login | The peer can open a shell on the machine. | SSH public key in `authorized_keys`. |
| Files | The peer can read/write the EMA workspace and dev artifacts. | Same SSH account, normal Unix permissions. |
| Admin | The peer can perform privileged operations. | Admin user + sudo, with local OS audit logs. |

For early dev, a trusted peer may have all three. EMA should still model them as
three capabilities because production will need to split them.

## First peer onboarding

From the peer, collect:

- legal name / handle for the actor record;
- machine name;
- OS and CPU architecture;
- LAN address or routable hostname when online;
- SSH username;
- SSH public key;
- whether the account is allowed to be an admin account;
- whether sudo should require an interactive password or be automation-grade;
- EMA workspace path on that machine;
- preferred availability window.

On the machine being accessed:

1. Create or choose a local OS user for the peer.
2. Enable Remote Login / SSH.
3. Add the peer's SSH public key to that user's `authorized_keys`.
4. Put the user in the admin group only if this is a fully trusted dev peer.
5. Test login.
6. Test sudo explicitly.
7. Record the peer as an EMA `device` + `actor` + `peer` once those writers
   exist.

## Connectivity without Tailscale

Use the simplest reachable path first:

1. Same LAN: connect by `.local` hostname or LAN IP.
2. Same Wi-Fi but hostname flaky: connect by LAN IP.
3. Different networks: use router port-forwarding only for a temporary dev
   window, or wait for Iroh sidecar support.
4. Public internet SSH should be temporary, key-only, and firewall-limited
   where possible.

If both machines must be reachable from arbitrary networks whenever online,
direct SSH alone is not enough behind NAT. That requires either:

- an overlay network such as Tailscale, which we are not choosing;
- manual port forwarding / dynamic DNS;
- a relay or hole-punching transport such as Iroh.

Therefore the product path is: SSH for local/dev bootstrap now, Iroh for
always-on peer reachability later.

## Sudo posture

For early trusted dev, sudo can be broad at the OS layer, but EMA should treat
sudo as a dangerous capability:

- `sudo` is never implicit in a normal EMA command.
- privileged actions should show as `dispatch.scope_granted` or equivalent
  events before execution once Hermes lands.
- remote privileged commands must be attributable to an actor and device.
- automation-grade sudo should be time-boxed and revocable.

The OS may allow broad admin access during private dev. EMA's model should still
represent it as a capability grant, not as ambient power.

## What to build next

Replace the peer-update helper with a real SSH-backed dev operator tool:

```text
ema peer add
ema peer doctor
ema peer shell
ema peer sync-runtime
ema peer apply-dev-update
ema peer sudo-check
```

Minimum behavior:

- store peer records in a local dev registry;
- verify SSH reachability;
- verify workspace path;
- run `node --version`, `pnpm --version`, `gleam --version`;
- rsync or tar-copy runtime files over SSH;
- run the dev update apply on the remote machine;
- append a local audit record for every remote command.

Later, when daemon peer identity exists, these become daemon commands and events.

## Boundary

This is not production remote administration. It is the trusted-dev bridge that
lets the first two EMA machines collaborate while the real device pairing,
Iroh transport, signed events, and Hermes capability grants are being built.

## Graduation path: EMA-native host nodes

Locked 2026-05-10 by
[`../decisions/2026-05-10-host-node-doctrine.md`](../decisions/2026-05-10-host-node-doctrine.md).
The product target this rail bridges to is **host-node ceremonies** — track
`6E` in the strategic stack. Once 6E lands, the first-class path becomes:

```text
ema device promote-to-host --org <id>
  → flags device with hosting_enabled_for_org: [<id>]
  → emits device.hosting_enabled
  → adjusts uptime monitoring + DERP-presence broadcast

ema device demote-from-host --org <id>
  → blocked if this is the only host (org would go dark)
  → emits device.hosting_disabled
```

That is the EMA-native replacement for "set up an SSH peer." A host node:

- accepts writes for its connected clients (per-entity merge handles
  conflicts when multiple hosts are online);
- broadcasts presence on the org's DERP-stable address so other devices
  and the web surface can find it;
- is the OIDC callback target for browser sign-in (see
  [`../architecture/15-web-org-access-point.md`](../architecture/15-web-org-access-point.md)).

Until 6E ships, SSH remains the trusted-dev rail. Once 6E ships, SSH
demotes to "operator escape hatch for OS-level work" — not the org-level
peer model.
