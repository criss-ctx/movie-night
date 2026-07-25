Analyse all uncommitted changes in this project and prepare everything needed before a commit. Follow these steps in order:

## 1. Gather the current state

Run these commands in parallel:
- `git status` — list all tracked modifications and untracked new files
- `git diff HEAD` — full diff of staged and unstaged changes
- `git log --oneline -8` — recent commit history to match style and scope

## 2. Code review

Read every changed file in full and check for:
- **Correctness** — logic errors, edge cases not handled, wrong conditions
- **DRY / cleanliness** — duplicated logic, dead code, unused imports or variables
- **TypeScript** — type mismatches, unsafe `any`, missing nullability guards
- **Security** — no secrets or credentials in code, no injection risks

If you find issues, fix them before proceeding. If a fix is non-trivial, describe what you changed and why.

## 3. Update memory

Based on what you find, update the project memory at `/home/ice/.claude/projects/-home-ice-projects-movie-night/memory/`:
- If new features were built, update or create the relevant project memory file and update `MEMORY.md`
- If bugs were fixed, update `project_urgent_bugs.md` if those bugs were tracked there
- If the tech stack or architecture changed, update `project_tech_stack_decision.md`
- If the next steps have changed, update `project_next_steps.md`
- Only update memory for things that are non-obvious or wouldn't be derivable from reading the code

## 4. Update tracking files

Check if any of these files need updating based on the changes:
- `DEVLOG.md` — add a row in the feature status table if a new feature is complete; add a note in the relevant section if something significant changed
- `NOTES.md` — if any architectural decision or open question was resolved

## 5. Output (in English)

Finally, output the following clearly formatted:

**Branch name:** `<type>/<short-kebab-description>`
(use `feat/` for new features, `fix/` for bug fixes, `refactor/` for refactoring, `chore/` for config/tooling)

**Files to stage:** list the files that should be included (exclude anything that looks like secrets, local config, or unrelated noise)

**Commit message:**
```
<type>(<scope>): <short imperative description>

<optional body: what changed and why, if non-obvious>
```
Keep the subject line under 72 characters. Use the same commit style as the recent git log.
