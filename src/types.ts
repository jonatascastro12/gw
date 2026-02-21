export type Worktree = {
  path: string;
  branch: string;
  headSha: string;
};

export type PrInfo = {
  number: number;
  url: string;
  headRefName: string;
  baseRefName: string;
};

export type StackNode = {
  branch: string;
  worktreePath: string;
  parent?: string;
  children: string[];
};

export type SyncPlan = {
  root: string;
  allBranches: string[];
  rebaseOrder: string[];
};

export type SyncState = {
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

export type SprMeta = {
  version: 1;
  parentByBranch: Record<string, string>;
};
