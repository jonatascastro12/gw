import type { PrInfo } from "../types";
import { MissingPrError } from "./errors";
import { runCmd } from "./shell";

export async function viewPrByBranchOptional(branch: string): Promise<PrInfo | null> {
  const out = await runCmd(
    [
      "gh",
      "pr",
      "view",
      branch,
      "--json",
      "number,headRefName,baseRefName,url",
    ],
    { allowFailure: true }
  );

  if (!out) {
    return null;
  }

  try {
    const parsed = JSON.parse(out) as PrInfo;
    if (!parsed?.headRefName || !parsed?.baseRefName || !parsed?.number || !parsed?.url) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function viewPrByBranch(branch: string): Promise<PrInfo> {
  const pr = await viewPrByBranchOptional(branch);
  if (!pr) {
    throw new MissingPrError(branch);
  }
  return pr;
}

export async function createPr(branch: string, base: string): Promise<void> {
  await runCmd(["gh", "pr", "create", "--head", branch, "--base", base, "--fill"]);
}
