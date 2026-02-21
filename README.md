# spr

`spr` is a Bun CLI for syncing stacked PR branches across Git worktrees.

It auto-detects all local worktrees, finds the PR stack connected to your current branch, then rebases descendants in order.

## Design Plan

See `PLAN.md` for the full product and implementation plan.

## Requirements

- `bun`
- `git`
- `gh` authenticated against GitHub

## Usage

```bash
bun install
bun run src/cli.ts status
bun run src/cli.ts branch feature/a --from main --worktree ../wt-feature-a
bun run src/cli.ts sync --dry-run
bun run src/cli.ts sync
bun run src/cli.ts resume
```

## Behavior

- Detect worktrees: `git worktree list --porcelain`
- Read PR metadata: `gh pr view <branch> --json number,headRefName,baseRefName,url`
- Build stack graph by local parent/child branch references
- Persist parent metadata in `spr-meta.json` (git common dir) when using `spr branch`
- Prompt to create missing PRs during `sync`
- Rebase descendants in topological order
- Push each updated branch with `--force-with-lease`
- Save checkpoint in `.git/spr-state.json` (actually in `git-common-dir`)
