# Code vApp Secrets and Runtime Contract

## Target borrow from t3code-fork
- desktop secret storage channels
- provider account/runtime config separation
- contracts package for terminal/provider/runtime
- provider-neutral runtime service boundary

## EMA rule
Secrets are references in the shared model, not plaintext scattered through settings or session blobs.

## Contract goals
- one typed runtime contract for CLI, GUI, and provider adapters
- one secret-reference model for environment/provider access
- one normalized provider session directory
- one event/logging model into Chronicle
