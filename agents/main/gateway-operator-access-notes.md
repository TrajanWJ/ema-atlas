# Gateway Operator Access Notes

**Status**: Draft notes
**Date**: 2026-04-06 UTC

## Observed Command Outcomes

### `openclaw status`
Observed:
- OpenClaw service context is visible
- gateway service is running
- local loopback gateway exists
- command path reports gateway auth/device identity limitations for deeper probing

Interpretation:
- base service reachability is fine
- operator-grade introspection is not fully available from this shell path

### `openclaw gateway probe`
Observed:
- local gateway reachable
- connection succeeds
- RPC visibility is limited by missing `operator.read`

Interpretation:
- this is not a basic transport outage
- failure mode is in auth/scope/identity path, not process availability

### deep security audit
Observed:
- repeats gateway probe auth limitations
- indicates unresolved auth secret/device identity path in current shell path

Interpretation:
- diagnostic depth is blocked by credential resolution and/or pairing, not by gateway liveness

## Current Failure Classification

Most likely classes, in order:
1. authenticated path missing `operator.read`
2. gateway auth token/secret is not resolved in this shell path
3. device identity is not paired/available for privileged diagnostics
4. shell environment lacks expected credential vars

## What We Know

- gateway is up
- gateway is reachable
- diagnostics can connect
- richer operator details are auth-constrained

## What We Do Not Yet Know

- canonical credential source for operator diagnostics
- whether the intended auth path is env-based, token-based, or paired-identity-based
- whether the same limitation affects all shells or just this execution environment

## Decision Tree

### If connection fails
- treat as transport/process issue

### If connection succeeds but scope missing
- treat as auth scope/identity issue
- do not mislabel as gateway outage

### If secret ref is unresolved
- treat as credential resolution issue in the CLI shell path

### If paired identity is absent
- treat as device/operator pairing issue

## Next Operator-Access Tasks

- identify canonical auth path for diagnostics
- classify whether shell env or paired identity should be the supported operator flow
- document the working diagnostic recipe once known
