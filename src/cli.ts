#!/usr/bin/env bun
import { runBranch } from "./commands/branch";
import { runStatus } from "./commands/status";
import { runSync } from "./commands/sync";
import { SprError } from "./lib/errors";

type ParsedArgs =
  | {
      command: "sync" | "resume" | "status";
      dryRun: boolean;
      fromBranch?: string;
      help?: boolean;
    }
  | {
      command: "branch";
      name: string;
      fromBranch?: string;
      worktreePath?: string;
      help?: boolean;
    };

function parseArgs(argv: string[]): ParsedArgs {
  const [firstRaw, ...restRaw] = argv;
  if (!firstRaw || firstRaw === "-h" || firstRaw === "--help") {
    return { command: "sync", dryRun: false, help: true };
  }

  if (firstRaw === "branch") {
    const [name, ...rest] = restRaw;
    if (!name || name.startsWith("-")) {
      throw new SprError("Usage: spr branch <name> [--from <branch>] [--worktree <path>]");
    }

    let fromBranch: string | undefined;
    let worktreePath: string | undefined;

    for (let i = 0; i < rest.length; i += 1) {
      const arg = rest[i];
      if (arg === "--from") {
        fromBranch = rest[i + 1];
        i += 1;
        continue;
      }
      if (arg === "--worktree") {
        worktreePath = rest[i + 1];
        i += 1;
        continue;
      }
      if (arg === "-h" || arg === "--help") {
        return { command: "branch", name, fromBranch, worktreePath, help: true };
      }
      if (arg.startsWith("-")) {
        throw new SprError(`Unknown option: ${arg}`);
      }
    }

    return { command: "branch", name, fromBranch, worktreePath };
  }

  let command: "sync" | "resume" | "status" = "sync";
  let rest = restRaw;
  if (firstRaw === "sync" || firstRaw === "resume" || firstRaw === "status") {
    command = firstRaw;
  } else if (firstRaw.startsWith("-")) {
    rest = [firstRaw, ...restRaw];
  } else {
    throw new SprError(`Unknown command: ${firstRaw}`);
  }

  let dryRun = false;
  let fromBranch: string | undefined;

  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (arg === "--from") {
      fromBranch = rest[i + 1];
      i += 1;
      continue;
    }
    if (arg === "-h" || arg === "--help") {
      return { command, dryRun, fromBranch, help: true };
    }
    if (arg.startsWith("-")) {
      throw new SprError(`Unknown option: ${arg}`);
    }
  }

  return { command, dryRun, fromBranch };
}

function printHelp(): void {
  console.log(`spr - stacked PR sync for git worktrees

Usage:
  spr sync [--dry-run] [--from <branch>]
  spr resume
  spr status [--from <branch>]
  spr branch <name> [--from <branch>] [--worktree <path>]

Commands:
  sync      Auto-detect related worktrees in your stack, create missing PRs if needed, then rebase descendants in order
  resume    Continue a previously failed sync
  status    Show detected stack plan and current checkpoint state
  branch    Create a branch from parent and persist stack parent metadata

Options:
  --dry-run Show plan only, do not mutate branches
  --from    Override start branch for stack component detection
`);
}

async function main(): Promise<void> {
  const args = parseArgs(Bun.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  if (args.command === "resume") {
    await runSync({ resume: true });
    return;
  }

  if (args.command === "status") {
    await runStatus({ fromBranch: args.fromBranch });
    return;
  }

  if (args.command === "branch") {
    await runBranch({ name: args.name, fromBranch: args.fromBranch, worktreePath: args.worktreePath });
    return;
  }

  await runSync({ dryRun: args.dryRun, fromBranch: args.fromBranch });
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(message);
  process.exit(1);
});
