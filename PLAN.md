# SPR Plan

## Goal
Build a Bun-based CLI (`spr`) to manage stacked pull requests across Git worktrees, with Graphite-like ergonomics but worktree-native behavior.

Primary outcome:
- If a base PR branch changes, one command should rebase and push the rest of the stack in order, even when each branch lives in a different worktree.

## Design Principles
- Auto-detect, do not require `--all-worktrees`.
- Depend only on `git` and `gh` CLIs.
- Be safe by default (`--force-with-lease`, dirty-tree checks, stop on conflict).
- Keep state resumable and inspectable.
- Prefer deterministic behavior over magic.

## Scope
### In scope
- Local stack discovery from worktrees + PR metadata.
- Ordered rebasing of descendant branches.
- One-command sync for the connected stack.
- Resume failed syncs from checkpoint.
- Dry-run preview.

### Out of scope (initially)
- Creating PRs.
- Auto-squash / merge queue integration.
- Cross-repo stacks.
- Background daemon.

## Core UX
### Commands
- `spr sync`
  - Auto-detect all local worktrees.
  - Discover stack connected to current branch.
  - Rebase descendants in topological order.
  - Push each updated branch with `--force-with-lease`.

- `spr sync --dry-run`
  - Compute and print plan only.
  - No mutation.

- `spr sync --from <branch>`
  - Optional branch override when not invoked from stack worktree.

- `spr resume`
  - Continue from last failed step using saved state.

## Auto-Detection Model
1. Enumerate worktrees using `git worktree list --porcelain`.
2. For each worktree branch, query PR metadata:
   - `gh pr view <branch> --json number,headRefName,baseRefName,url`
3. Build local graph where an edge exists when:
   - `child.pr.baseRefName === parent.pr.headRefName`
   - and both branches are present in local worktrees.
4. Find connected component containing current (or `--from`) branch.
5. Compute root and topological order.

## Execution Semantics
- Root branch is not rebased by `spr sync`.
- Each descendant executes:
  1. `git -C <wt> fetch origin`
  2. `git -C <wt> rebase <parentBranch>`
  3. `git -C <wt> push --force-with-lease origin <branch>`

## Safety and Failure Handling
- Fail fast if any involved worktree is dirty.
- Stop at first conflict.
- Persist checkpoint after each successful branch.
- On failure, provide direct recovery hint:
  - `git -C <worktree> rebase --continue`
  - then `spr resume`.

## Persistent Files
Stored under git common dir (`git rev-parse --git-common-dir`):
- `spr-state.json`
  - In-progress sync checkpoint for resume.

(Initial design keeps only one active checkpoint file.)

## Data Shapes
```ts
type Worktree = {
  path: string;
  branch: string;
  headSha: string;
};

type PrInfo = {
  number: number;
  url: string;
  headRefName: string;
  baseRefName: string;
};

type StackNode = {
  branch: string;
  worktreePath: string;
  pr: PrInfo;
  parent?: string;
  children: string[];
};

type SyncPlan = {
  root: string;
  allBranches: string[];
  rebaseOrder: string[];
};

type SyncState = {
  version: 1;
  repoRoot: string;
  startedAt: string;
  command: "sync";
  rootBranch: string;
  stackBranches: string[];
  executionOrder: string[];
  completed: string[];
  failedAt?: string;
  lastError?: string;
  dryRun: boolean;
};
```

## Module Layout
- `src/cli.ts`
  - CLI parsing and command dispatch.
- `src/commands/sync.ts`
  - Orchestration of planning, execution, and resume.
- `src/lib/git.ts`
  - Git wrappers (`worktree list`, `rebase`, `push`, cleanliness checks).
- `src/lib/gh.ts`
  - GitHub PR lookup wrappers.
- `src/lib/stack.ts`
  - Graph build, connected component, topo planning.
- `src/lib/state.ts`
  - Checkpoint persistence.
- `src/lib/ui.ts`
  - Plan/step output formatting.
- `src/lib/errors.ts`
  - Typed errors.

## Algorithm Notes
- Graph roots are component nodes with no parent inside the same component.
- Expect exactly one root per component; otherwise error.
- Topological ordering should be stable and deterministic (sorted queue tie-break).

## Implementation Roadmap
1. MVP sync
- `sync`, `--dry-run`, `resume`.
- Worktree auto-detection.
- Graph-based ordering.

2. Operational hardening
- Better conflict diagnostics.
- Retry/failure classification.
- Optional `--autostash` mode.

3. Usability
- `spr status` for checkpoint and stack visibility.
- Better output formatting and timing info.

4. Advanced workflows
- PR creation/update helpers.
- Stack surgery commands (reparent/reorder).
- Optional CI/merge-queue integration.

## Open Questions
- Should `sync` optionally refresh root from remote before rebasing descendants?
- Should we support partial sync (`--to` / `--only`) for large stacks?
- Should checkpoints retain history (multiple runs) instead of single state file?
- Do we want to support branches without open PRs in local stack planning?

## Non-Goals for now
- Replacing full Graphite feature set.
- Managing code review lifecycle.
- Global branch metadata storage outside repository context.
