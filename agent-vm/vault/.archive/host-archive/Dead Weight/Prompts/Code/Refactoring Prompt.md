# Refactoring Prompt

Sources: [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code), [trailofbits/claude-code-config](https://github.com/trailofbits/claude-code-config), Martin Fowler's Refactoring Catalog

**When to use**: Code maintenance, complexity reduction, removing dead code, improving patterns.

---

## Prompt

Analyze the following code/module for refactoring opportunities. Focus on reducing complexity and improving maintainability without changing behavior.

**Target**: `[file path, module, or directory to refactor]`

### Step 1: Assessment
- Identify code smells (long functions, deep nesting, duplication, god objects)
- Measure current complexity (cyclomatic, cognitive)
- Map dependencies (what depends on this, what this depends on)
- Check test coverage of the target code

### Step 2: Refactoring Plan
For each proposed change:
- **What**: Specific refactoring from the catalog below
- **Why**: What problem it solves (measurable improvement)
- **Risk**: What could break
- **Test**: How to verify behavior is preserved

### Step 3: Execution Order
Order changes to minimize risk:
1. Add missing tests first (lock current behavior)
2. Extract/rename operations (safe, low risk)
3. Structural changes (moderate risk)
4. Algorithm improvements (higher risk, needs verification)

### Refactoring Catalog

**Extraction Refactorings** (safe, do these first):
| Refactoring | When to Use | Threshold |
|-------------|-------------|-----------|
| Extract Function | Long function doing multiple things | >50 lines or >1 responsibility |
| Extract Variable | Complex expression hard to read | Expression used 2+ times or unclear |
| Extract Class/Module | Class/file with multiple responsibilities | >800 lines or 3+ unrelated concerns |
| Extract Parameter Object | Function with many params | >4 parameters of related data |
| Extract Hook (React) | Duplicated stateful logic across components | Same useState+useEffect pattern in 2+ components |

**Simplification Refactorings:**
| Refactoring | When to Use | Example |
|-------------|-------------|---------|
| Replace Conditional with Polymorphism | Switch/if-else on type doing different work | `if (type === 'A') ... else if (type === 'B') ...` to strategy pattern |
| Replace Nested Conditional with Guard Clauses | Deep if/else nesting | Early returns for edge cases |
| Replace Magic Numbers with Constants | Hardcoded values with unclear meaning | `if (status === 3)` to `if (status === STATUS.APPROVED)` |
| Consolidate Conditional | Multiple conditions producing same result | Combine into single descriptively-named condition |
| Replace Temp with Query | Temp variable used once after complex assignment | Extract to well-named function |

**Structural Refactorings** (moderate risk):
| Refactoring | When to Use | Threshold |
|-------------|-------------|-----------|
| Move Function/Method | Function lives in wrong module | Accesses another module's data more than its own |
| Inline Function | Function body is as clear as its name | Single-line delegation with no reuse |
| Split Loop | Loop doing multiple unrelated things | Loop body has 2+ independent operations |
| Replace Loop with Pipeline | Imperative loop with filter/map logic | `for` loop that filters then transforms |
| Introduce Data Access Layer | DB calls scattered throughout | Any direct DB access outside DAL |

**React/TypeScript-Specific Refactorings:**
| Refactoring | When to Use |
|-------------|-------------|
| Extract Custom Hook | Stateful logic duplicated across components |
| Replace Prop Drilling with Context | Props passing through 3+ component levels |
| Replace `useEffect` with Server Action | Client-side data fetching that could be server-side |
| Replace `any` with Proper Types | `any` used as escape hatch |
| Replace Class Component with Function | Legacy class components still in codebase |
| Collocate State | State lifted too high in tree (causes unnecessary re-renders) |
| Replace Inline Styles with CSS Modules/Tailwind | Inconsistent styling approach |

### Smell-to-Refactoring Quick Reference

| Smell | Action | Threshold |
|-------|--------|-----------|
| Long function | Extract sub-functions | >50 lines |
| Deep nesting | Early returns, guard clauses | >4 levels |
| Code duplication | Extract shared utility | 3+ occurrences |
| God object | Split by responsibility | >800 lines |
| Feature envy | Move method to owning class | Accessing other module's data heavily |
| Dead code | Delete entirely | No callers/references |
| Primitive obsession | Create value objects/types | Repeated primitive patterns (e.g., `{lat: number, lng: number}`) |
| Long parameter list | Create parameter object | >5 params |
| Shotgun surgery | Consolidate related changes | Same change touches 5+ files |
| Data clumps | Extract into type/interface | Same 3+ fields appear together repeatedly |

### Rules
- Each refactoring step must be independently testable
- Run tests after every change
- One logical change per commit
- Never refactor and add features in the same change
- If tests break from refactoring (but code works), fix the tests — they were testing implementation, not behavior
- Prefer small, safe refactorings over ambitious restructurings
- When in doubt, extract — it's easier to inline later than to untangle
