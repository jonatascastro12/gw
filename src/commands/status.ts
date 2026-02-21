import { discoverPlan } from "../lib/plan";
import * as stateStore from "../lib/state";
import * as ui from "../lib/ui";

export async function runStatus(opts: { fromBranch?: string } = {}): Promise<void> {
  const { commonDir, fromBranch, plan } = await discoverPlan({ fromBranch: opts.fromBranch });

  console.log(`From branch: ${fromBranch}`);
  ui.printPlan(plan);

  const state = await stateStore.loadState(commonDir);
  if (!state) {
    console.log("Checkpoint: none");
    return;
  }

  console.log("Checkpoint:");
  console.log(`- startedAt: ${state.startedAt}`);
  console.log(`- rootBranch: ${state.rootBranch}`);
  console.log(`- completed: ${state.completed.length}/${state.executionOrder.length}`);
  if (state.failedAt) {
    console.log(`- failedAt: ${state.failedAt}`);
  }
  if (state.lastError) {
    console.log(`- lastError: ${state.lastError}`);
  }
}
