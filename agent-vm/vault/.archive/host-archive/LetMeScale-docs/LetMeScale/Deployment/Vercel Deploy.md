> See also: [[LetMeScale]]

# Vercel Deployment Guide — LetMeScale

## Project Configuration

LetMeScale is a **pnpm monorepo** with Turborepo. The landing app lives in `apps/landing`.

### Vercel Project Settings

These are configured via the Vercel dashboard or API (not `vercel.json`):

| Setting | Value |
|---------|-------|
| **Root Directory** | `apps/landing` |
| **Framework** | Next.js (auto-detected) |
| **Build Command** | `cd ../.. && turbo build --filter=@letmescale/landing` |
| **Install Command** | `cd ../.. && pnpm install` |
| **Output Directory** | (leave empty — Next.js auto-detects) |
| **Node Version** | 24.x |

### Why These Settings Matter

- **Root Directory = `apps/landing`**: Tells Vercel where `package.json` with `next` dependency lives. Without this, Vercel can't detect Next.js and treats the build output as static files (blank page).
- **Build Command uses `cd ../..`**: Because Root Directory is `apps/landing`, commands run from there. We `cd` back to the monorepo root so Turborepo can resolve workspace dependencies.
- **No `vercel.json` needed**: All config lives in Vercel project settings. Adding `vercel.json` with `framework` or `outputDirectory` overrides can break the Next.js builder.

## Deploying

### Via CLI (recommended for manual deploys)

```bash
# Production deploy
vercel --prod

# Preview deploy
vercel
```

### Via Git Push (automatic)

Push to `master` triggers a production deploy automatically via the GitHub integration.

```bash
git push origin master
```

### Redeploying Without Code Changes

If you need to trigger a fresh build:

```bash
# Via CLI — always works
vercel --prod

# Via git — creates an empty commit
git commit --allow-empty -m "chore: trigger Vercel redeploy"
git push origin master
```

## Troubleshooting

### Blank page / 404 after deploy

**Cause**: Vercel can't find Next.js or the output directory.

**Fix**: Verify Root Directory is set to `apps/landing` in project settings:
```bash
# Check via API
vercel project ls

# Or update via API
curl -X PATCH "https://api.vercel.com/v9/projects/PROJECT_ID" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rootDirectory":"apps/landing","framework":"nextjs","buildCommand":"cd ../.. && turbo build --filter=@letmescale/landing","installCommand":"cd ../.. && pnpm install"}'
```

### "No Output Directory named 'public' found"

**Cause**: Vercel doesn't detect this as a Next.js project (missing `next` in root `package.json`).

**Fix**: Set Root Directory to `apps/landing` so Vercel finds `next` in the right `package.json`.

### "No Next.js version detected"

**Cause**: `vercel.json` has `"framework": "nextjs"` but Vercel is looking at root `package.json`.

**Fix**: Remove `vercel.json` and configure via project settings instead.

### Build succeeds but site is broken

Check that the deploy log shows:
- `Detected Next.js version: 15.x.x`
- `Created all serverless functions in: ...`
- `Collected static files ...`

If you only see `Build Completed` without the Next.js-specific lines, the framework wasn't detected.

## Local `.vercel/project.json`

This file links your local repo to the Vercel project:

```json
{
  "projectId": "prj_KAImhgxSWI9Ikxgv0JSk4S410fX2",
  "orgId": "team_oXnAEKgYUjaD7fqs13aYoucd",
  "projectName": "letmescale"
}
```

If this file is missing, run `vercel link` to re-create it.

#letmescale #deployment
