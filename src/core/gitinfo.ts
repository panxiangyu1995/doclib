import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type GitInfo = { branch: string; commit: string };

export async function readGitInfo(root: string): Promise<GitInfo | null> {
  try {
    const [{ stdout: branch }, { stdout: commit }] = await Promise.all([
      execFileAsync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd: root }),
      execFileAsync("git", ["rev-parse", "HEAD"], { cwd: root }),
    ]);
    const b = branch.trim();
    const c = commit.trim();
    if (b.length === 0 || c.length === 0) return null;
    return { branch: b, commit: c };
  } catch {
    return null;
  }
}
