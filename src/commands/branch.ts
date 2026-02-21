import * as git from "../lib/git";
import * as metaStore from "../lib/meta";

export async function runBranch(opts: {
  name: string;
  fromBranch?: string;
  worktreePath?: string;
}): Promise<void> {
  const repoRoot = await git.repoRoot();
  const commonDir = await git.gitCommonDir(repoRoot);
  const fromBranch = opts.fromBranch ?? (await git.currentBranch());

  await git.createBranch(repoRoot, opts.name, fromBranch, opts.worktreePath);
  await metaStore.setParent(commonDir, opts.name, fromBranch);

  console.log(
    opts.worktreePath
      ? `Created branch ${opts.name} from ${fromBranch} in worktree ${opts.worktreePath}`
      : `Created branch ${opts.name} from ${fromBranch}`
  );
}
