import type { SyncPlan } from "../types";

export function printPlan(plan: SyncPlan): void {
  console.log(`Stack root: ${plan.root}`);
  console.log(`Stack branches: ${plan.allBranches.join(" -> ")}`);

  if (plan.rebaseOrder.length === 0) {
    console.log("No descendant branches to rebase.");
    return;
  }

  console.log("Rebase execution order:");
  for (const branch of plan.rebaseOrder) {
    console.log(`- ${branch}`);
  }
}

export function printSyncHeader(): void {
  console.log("Syncing stacked PRs across related worktrees...");
}

export function printStep(message: string): void {
  console.log(message);
}
