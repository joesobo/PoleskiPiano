# AGENTS.md

## Plan Mode

- Make the plan extremely concise. Sacrifice grammar for the sake of concision.
- At the end of each plan, give me a list of unresolved questions to answer, if any.

## Repository expectations

- Never merge directly to main
- Keep a living architecture.md which maps every file in the project. Must be read at start of every convo and updated before committing

## Rules

- **Write it down** - No mental notes. Files survive, thoughts don't.
- **No destructive commands** without asking. `trash` > `rm`.
- **Verify subagent work** - Don't trust "done" claims. Check PR state, worktree cleanup, review dismissal actually happened.
- **Fix bugs with tests** - When I report a bug, don't start by trying to fix it. Instead start by writing a test that reproduces the bug. Then have subagents try to fix the bug and prove it with a passing test.

## Default Tooling (Global)

- Use `rg` by default for text search.
- Use `fd` by default for file discovery.
- Use `sg` (ast-grep) when structure-aware/AST search is more reliable than regex.
- Use `jq` for JSON filtering/transforms instead of ad-hoc parsing.
- Use `fzf` for interactive filtering/selection workflows.
- Use `bat` for human-oriented file preview/reading.
- Use `eza` for directory listings and tree views.
- Use `zoxide` for fast directory jumping.
- Use `delta` for readable git diff/log output.
- Fall back to baseline tools only when the above are unavailable or clearly a worse fit.

## Agent skills

### Issue tracker

Issues and PRDs are tracked in GitHub Issues for `joesobo/PoleskiPiano`. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the default five-label triage vocabulary. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repo: read root `CONTEXT.md` and root `docs/adr/` when present. See `docs/agents/domain.md`.
