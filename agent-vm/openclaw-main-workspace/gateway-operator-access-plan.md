# Gateway Operator Access Plan

**Status**: Active
**Date**: 2026-04-06 UTC
**Scope**: Restore operator-grade introspection for host/gateway diagnostics without mixing it into the security-hardening lane.

## Problem

Current host checks show:
- the local gateway is reachable
- the gateway service is running
- deep probe / richer inspection is limited because the command path lacks resolved auth/device identity and `operator.read`

This means the control plane is partially alive but not fully inspectable from the current shell path.

## Goal

Make gateway/operator inspection reliable enough that recovery and control-plane work can use real host truth rather than partial probe output.

## Known Current State

- `openclaw status` works enough to confirm service state and broad system context
- `openclaw gateway probe` reaches the local loopback gateway
- richer diagnostics are scope-limited
- deep security audit repeats the same auth limitation for probe details
- the issue appears to be credential/scope resolution in the shell path, not simple process unavailability

## Desired End State

The recovery operator shell should be able to:
- run gateway probe with full operator visibility
- retrieve operator-readable gateway status/details
- distinguish auth failure from transport failure cleanly
- use one repeatable, documented path for diagnostics

## Working Hypotheses

1. **SecretRef / token resolution mismatch**
   - CLI command path cannot resolve the configured gateway auth secret/provider

2. **Device identity not paired in this shell path**
   - gateway expects device identity or equivalent credentials for privileged scope

3. **Credential env not present in shell**
   - expected environment variables are missing from the process environment used by diagnostics

4. **Scope mismatch**
   - available credentials authenticate but do not include `operator.read`

5. **CLI path discrepancy**
   - service/runtime can access credentials internally, but ad hoc shell commands cannot

## Debug Sequence

### Step A — Establish canonical diagnostic command set
Use a small stable checklist:
- `openclaw status --all`
- `openclaw gateway probe`
- gateway status command(s) if exposed with operator detail

Capture:
- reachable vs unreachable
- auth failure vs missing scope
- whether auth material is being resolved at all

### Step B — Classify the auth path failure
For each command, classify:
- transport failure
- missing credentials
- unresolved secret provider
- authenticated but missing scope
- paired identity absent

### Step C — Decide the canonical credential path
Pick one supported way for operator diagnostics to authenticate:
- resolved shell env
- paired device identity
- explicit operator token path

Avoid mixed ad hoc methods.

### Step D — Document the operator diagnostic path
Once the working path is known, define:
- required environment/setup
- canonical commands
- expected success/failure shapes
- how to tell scope errors from connectivity issues

## Acceptance Criteria

Operator access lane is complete when:
- a repeatable shell path can access gateway diagnostics with operator-readable detail
- probe output distinguishes auth/scope from network/process failure
- the diagnostic path is documented in the workspace
- control-plane recovery work can rely on it for host/gateway truth

## Immediate Deliverables

1. this plan
2. an operator-access notes file with command outcomes
3. a short troubleshooting decision tree for future recovery work

## Out of Scope

- broad security hardening
- channel exposure/policy cleanup
- unrelated gateway architecture changes
