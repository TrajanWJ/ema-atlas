# EMA Discord Webhooks

> Last updated: 2026-04-05
>
> Source of truth: `~/bin/discord-webhooks-v2.env`
>
> Webhook URLs are not secrets — Discord webhooks use URL-based authentication.
> Anyone with the URL can post to the channel. Rotate via Discord server settings if compromised.

---

## System Webhooks

These handle infrastructure-level events. Some share the same underlying webhook (Discord allows one webhook per purpose per channel).

### Alerts / Errors

Posts to **#alerts** (`1484014832599437372`)

| Env Var | URL |
|---|---|
| `WEBHOOK_ALERTS` | `https://discord.com/api/webhooks/1488276624981102622/5fe16dRda81juSsjJjhq-FT33EuI1Jb-W0ozN1Y_H5dIRdTKQw9OoX2OGB8-fUmpQhr_` |
| `WEBHOOK_ERROR_LOG` | Same webhook as `WEBHOOK_ALERTS` |
| `WEBHOOK_ALERTS_CHAN` | Same webhook as `WEBHOOK_ALERTS` |

### Logs / Monitoring / Ops

Posts to **#ops-log** (`1482256984811114688`)

| Env Var | URL |
|---|---|
| `WEBHOOK_LOGS` | `https://discord.com/api/webhooks/1488276636410445867/8UQdHs4J96W0jUpCvo1VfZs_C_B7xzKSK2lBDHvRRhDCXbc08L0H93fJlT0_C8NpT29Y` |
| `WEBHOOK_MONITORING` | Same webhook as `WEBHOOK_LOGS` |
| `WEBHOOK_OPS_LOG` | Same webhook as `WEBHOOK_LOGS` |

### Agent Logs / Cron Runs

Posts to **#agent-feed** (`1483018390015709315`)

| Env Var | URL |
|---|---|
| `WEBHOOK_AGENT_LOGS` | `https://discord.com/api/webhooks/1488276630748139680/ESq2pyFxXB8Pt8-6Ib2vtD6CSncEEcaV_zsDJX2rO3WWKt-OZheR5GcrPUv-0IFVoqtM` |
| `WEBHOOK_CRON_RUNS` | Same webhook as `WEBHOOK_AGENT_LOGS` |

---

## Agent Identity Webhooks

Each agent persona has a dedicated webhook that posts with its own name and avatar. These give agents distinct identities in Discord.

### Researcher

Posts to **#research-feed** (`1482258431997116531`)

| Env Var | URL |
|---|---|
| `WEBHOOK_RESEARCHER` | `https://discord.com/api/webhooks/1488275814419136613/08fw27uogzHbqz9XLOvRgejSoaTR7OQ6_0XW7SPQkMDQZwlWOYGawDFa4xPvBSFf98uy` |

### Coder

Posts to **#code-output** (`1484014829156175893`)

| Env Var | URL |
|---|---|
| `WEBHOOK_CODER` | `https://discord.com/api/webhooks/1488276655905574935/F2QuF-W7E_9FBmZJgt0PPfm-QMQlQbTTse3zUVxEB0UVS0ILaB4rOfi6my19DgkRFQJu` |

### Devil's Advocate

Posts to **#devils-corner** (`1484014830280249395`)

| Env Var | URL |
|---|---|
| `WEBHOOK_DEVILS` | `https://discord.com/api/webhooks/1488276662612135967/-tcu8yzmtE8IApM0zUYSXg3WJq4c4DIBTIIfZa3sWpNF8-ct3yjNrWRT2cYxU2Gsql5r` |

### Vault Keeper

Posts to **#vault-feed** (`1483018390015709315`)

| Env Var | URL |
|---|---|
| `WEBHOOK_VAULT_KEEPER` | `https://discord.com/api/webhooks/1488276619557863546/Kc8tL_ASOoVboHQnjo-rH-5ZIK16aH-LuLlqQprHJR76fHfEMcssHH78vKmg7WimI155` |

### Ops

Posts to **#ops-log** (`1482256984811114688`)

| Env Var | URL |
|---|---|
| `WEBHOOK_OPS_LOG` | `https://discord.com/api/webhooks/1488276636410445867/8UQdHs4J96W0jUpCvo1VfZs_C_B7xzKSK2lBDHvRRhDCXbc08L0H93fJlT0_C8NpT29Y` |

---

## Feed Webhooks

### Vault Feed / Agent Feed

Posts to **#agent-feed / vault-feed** (`1483018390015709315`)

| Env Var | URL |
|---|---|
| `WEBHOOK_VAULT_FEED` | `https://discord.com/api/webhooks/1488276619557863546/Kc8tL_ASOoVboHQnjo-rH-5ZIK16aH-LuLlqQprHJR76fHfEMcssHH78vKmg7WimI155` |
| `WEBHOOK_AGENT_FEED` | Same webhook as `WEBHOOK_VAULT_FEED` |

### HN / TIL

Posts to **#links** (`1482256987700990066`)

| Env Var | URL |
|---|---|
| `WEBHOOK_HN` | `https://discord.com/api/webhooks/1488276642987114737/heYY5gnJneRRAVuytsa39bpkOkRCRtLPxNrLD7sKQk738Abn0-0ppM5xeXXKmI6_aR87` |
| `WEBHOOK_TIL` | Same webhook as `WEBHOOK_HN` (defined in env file) |

---

## Dispatch Webhook

Posts to **#dispatch** (`1484014822642286654`)

| Env Var | URL |
|---|---|
| `WEBHOOK_DISPATCH` | `https://discord.com/api/webhooks/1488276697357750393/Ro5AMs7FnqX8-Rvoh4v7gTfZEnzizYomttKP-Go01oSQdwgx-lMSmtqKNiMPcP6nm_Nb` |

Used by the dispatch watcher for echo/acknowledgment messages when commands are received and routed.

---

## Shared Webhook Groups

Several env vars point to the same underlying webhook URL. This is by design — they share a Discord channel but have different semantic names in scripts for clarity.

| Webhook URL (suffix) | Shared by |
|---|---|
| `...624981102622/5fe16d...` | `WEBHOOK_ALERTS`, `WEBHOOK_ERROR_LOG`, `WEBHOOK_ALERTS_CHAN` |
| `...636410445867/8UQdHs...` | `WEBHOOK_LOGS`, `WEBHOOK_MONITORING`, `WEBHOOK_OPS_LOG` |
| `...630748139680/ESq2py...` | `WEBHOOK_AGENT_LOGS`, `WEBHOOK_CRON_RUNS` |
| `...619557863546/Kc8tL_...` | `WEBHOOK_VAULT_FEED`, `WEBHOOK_VAULT_KEEPER`, `WEBHOOK_AGENT_FEED` |
| `...642987114737/heYY5g...` | `WEBHOOK_HN`, `WEBHOOK_TIL` |

---

## Usage

```bash
# Source the env file
source ~/bin/discord-webhooks-v2.env

# Post via curl
curl -s -X POST  \
  -H Content-Type: application/json \
  -d '{content: Disk usage above 90%, username: EMA Alerts}'

# Post with agent identity (custom username/avatar)
curl -s -X POST  \
  -H Content-Type: application/json \
  -d '{content: Found relevant paper on RLHF alignment, username: Researcher, avatar_url: https://example.com/researcher.png}'
```
