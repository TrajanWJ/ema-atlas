# Codebase Exploration Prompt

Sources: [ChrisWiles/claude-code-showcase](https://github.com/ChrisWiles/claude-code-showcase), [sdi2200262/agentic-project-management](https://github.com/sdi2200262/agentic-project-management), [Comfy-Org/comfy-claude-prompt-library](https://github.com/Comfy-Org/comfy-claude-prompt-library)

**When to use**: Starting work on an unfamiliar codebase, onboarding to a new project, or deeply understanding a system before major changes.

---

## Prompt

> "AI models are geniuses who start from scratch on every task." — Noam Brown

Prepare for work on this codebase by achieving full understanding before writing any code. Invest adequate time in preparation — excessive groundwork surpasses insufficient preparation.

**Project**: `[project path or description]`

### Step 1: Structure Discovery
- Map the directory structure and identify organizational patterns
- Identify the tech stack (languages, frameworks, build tools)
- Locate configuration files (package.json, pyproject.toml, Cargo.toml, etc.)
- Find the entry points (main files, index files, route definitions)

**Exploration commands:**
```bash
# Directory structure overview (depth-limited)
find . -type f -not -path '*/node_modules/*' -not -path '*/.git/*' | head -100

# Tech stack detection
ls package.json tsconfig.json next.config.* .eslintrc* tailwind.config.* 2>/dev/null

# Entry points for Next.js
ls src/app/layout.tsx src/app/page.tsx src/pages/_app.tsx 2>/dev/null

# All route definitions (Next.js App Router)
find src/app -name 'page.tsx' -o -name 'route.ts' 2>/dev/null

# Package overview
cat package.json | jq '{name, scripts, dependencies: (.dependencies | keys), devDependencies: (.devDependencies | keys)}'
```

### Step 2: Architecture Understanding
- Identify the architectural pattern (monolith, microservices, serverless, etc.)
- Map component boundaries and data flow
- Locate the database schema and migration files
- Identify external service integrations
- Find shared utilities and common patterns

**Architecture discovery commands:**
```bash
# Find data models / schemas
find . -path '*/models/*' -o -path '*/schema/*' -o -path '*/prisma/*' -o -name '*.schema.ts' 2>/dev/null | grep -v node_modules

# Find API routes and handlers
find . -path '*/api/*' -name '*.ts' 2>/dev/null | grep -v node_modules

# Find environment variables used
grep -r 'process.env\.' --include='*.ts' --include='*.tsx' -h | sort -u | head -30

# Find external service integrations
grep -r 'fetch\|axios\|createClient\|new.*Client' --include='*.ts' -l | grep -v node_modules

# Map component imports to find coupling
grep -r "from ['\"]@/" --include='*.tsx' --include='*.ts' -h | sed 's/.*from //' | sort | uniq -c | sort -rn | head -20
```

### Step 3: Convention Detection
- Code style and formatting conventions
- Naming patterns (variables, files, directories, branches)
- Testing patterns (test location, frameworks, fixture patterns)
- Error handling patterns
- State management approach

**Convention detection commands:**
```bash
# Find test patterns
find . -name '*.test.*' -o -name '*.spec.*' -o -name '__tests__' 2>/dev/null | grep -v node_modules | head -20

# Check formatting config
cat .prettierrc* .eslintrc* 2>/dev/null

# Find error handling patterns
grep -r 'catch\|ErrorBoundary\|error\.tsx\|not-found\.tsx' --include='*.ts' --include='*.tsx' -l | grep -v node_modules | head -10

# State management
grep -r 'useState\|useReducer\|zustand\|redux\|jotai\|recoil' --include='*.ts' --include='*.tsx' -l | grep -v node_modules | wc -l
```

### Step 4: Critical Path Identification
- Most-changed files (hotspots)
- Largest/most complex files
- Files with most dependencies (coupling hubs)
- Test coverage gaps

**Hotspot analysis commands:**
```bash
# Most-changed files (if git repo)
git log --name-only --pretty=format: --since='3 months ago' | sort | uniq -c | sort -rn | head -20

# Largest files (complexity indicators)
find . -name '*.ts' -o -name '*.tsx' | grep -v node_modules | xargs wc -l 2>/dev/null | sort -rn | head -20

# Files with most imports (coupling hubs)
for f in $(find . -name '*.ts' -o -name '*.tsx' | grep -v node_modules); do echo "$(grep -c '^import' "$f" 2>/dev/null) $f"; done | sort -rn | head -15

# Test coverage gaps: files without corresponding test files
find src -name '*.ts' -o -name '*.tsx' | grep -v node_modules | grep -v '.test.' | grep -v '.spec.' | while read f; do test_file="${f%.ts*}.test${f##*.ts}"; [ ! -f "$test_file" ] && echo "NO TEST: $f"; done | head -20
```

### Step 5: Documentation
Create a comprehensive onboarding document capturing:
- Project purpose and domain
- Key architectural decisions and their rationale
- Development workflow (build, test, deploy)
- Important files and what they do
- Known gotchas and tribal knowledge
- Open questions that need clarification

### Output
Store findings in a structured document that enables seamless continuation in future sessions. This is working memory, not throwaway analysis. Ideal format: a session log entry in `Session Log/` using the [[Discovery Log Template]].
