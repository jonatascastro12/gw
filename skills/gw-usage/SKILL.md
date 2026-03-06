---
name: gw-usage
description: Use when working with the gw CLI to manage stacked branches and PRs across git worktrees, including creating links in gw-meta.json, bootstrapping existing PR stacks, running sync/resume safely, and troubleshooting stack detection or dirty-worktree errors.
---

# GW Usage

Use this workflow to operate `gw` safely and predictably.

## Establish Stack Context

1. Run `gw status` or `gw status --from <branch>` to inspect:
- root branch
- stack branch order
- rebase execution order
- checkpoint state
2. If the expected parent link is missing:
- Run `gw link [branch] --parent <parent>` or `gw link [branch] --child <child>`.
- Omit `[branch]` to use the current branch.
3. If PRs already exist and local metadata/worktrees are missing:
- Run `gw bootstrap --from <branch>`.

## Sync Safely

1. Run `gw sync --dry-run --from <branch>` first.
2. Confirm stack order and missing-PR prompts are correct.
3. Run `gw sync --from <branch> --yes` (use `--yes`/`-y` to auto-confirm all prompts and avoid hanging in non-interactive environments like agents).
4. If sync stops on conflict, you have several options:
   - **AI resolve**: Run `gw resolve` to auto-resolve conflicts using Claude or Codex CLI.
   - **Manual resolve**: Fix conflicts in the reported worktree, `git add`, `git rebase --continue`, then `gw resume --yes`.
   - **Abort**: Run `gw abort` to abort the rebase and clear state.
   - **Abort + rollback**: Run `gw abort --rollback --yes` to also reset all branches to pre-sync SHAs.

## Metadata Rules

1. Treat `gw-meta.json` as source of truth for parent linkage.
2. Use `gw link` or `gw branch` to update linkage instead of manual edits.
3. Expect `gw sync` to auto-seed missing parent links from open PR base refs when possible.

## Restack Descendants Only

1. Run `gw restack --dry-run --from <branch>` to preview.
2. Run `gw restack --from <branch> --yes` to rebase only descendants of the given branch.
3. On conflict, the same resolve/abort/resume flow applies.

## Troubleshooting

1. Dirty worktree errors:
- Clean or ignore the listed path, then retry.
2. Branch not in local worktree graph:
- Create/check out a worktree for that branch first, or run `gw bootstrap`.
3. Missing PR inference:
- Ensure the branch has an open PR, otherwise add linkage with `gw link`.
4. "Rebase is still in progress" on resume:
- Finish resolving conflicts (`git rebase --continue`) or run `gw abort`.
5. Want to undo a sync completely:
- Run `gw abort --rollback --yes` to reset all branches to their pre-sync state.
