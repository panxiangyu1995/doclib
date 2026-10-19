import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DoclibError } from "../core/state.js";
import { CLI_VERSION } from "../core/version.js";
import type { CommandResult } from "./init.js";

const MARKER = "# doclib-hook";

function cliAbsPath(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "cli.js");
}

function hookScript(strict: boolean): string {
  const flags = strict ? " --strict" : "";
  return [
    "#!/bin/sh",
    MARKER,
    "# 由 doclib hook install 生成；移除请运行 doclib hook remove",
    `node "${cliAbsPath()}" check${flags} || exit 1`,
    "",
  ].join("\n");
}

const CI_WORKFLOW = `name: doclib-check

on:
  pull_request:
  push:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      # 版本在安装时固化，保证 CI 可复现
      - run: npx --yes doclib@${CLI_VERSION} check --strict
`;

export async function runHook(
  root: string,
  opts: { strict?: boolean; remove?: boolean; ci?: string },
): Promise<CommandResult> {
  if (opts.remove === true) {
    const p = path.join(root, ".git", "hooks", "pre-commit");
    const raw = await fs.readFile(p, "utf8").catch(() => null);
    if (raw === null) return { text: "未找到 pre-commit 钩子。\n", json: {} };
    if (!raw.includes(MARKER)) throw new DoclibError("pre-commit 钩子非 doclib 管理（无标记），请手动处理");
    await fs.rm(p);
    return { text: "已移除 doclib pre-commit 钩子。\n", json: { removed: true } };
  }
  if (opts.ci !== undefined) {
    if (opts.ci !== "github") throw new DoclibError("--ci 仅支持 github");
    const wfDir = path.join(root, ".github", "workflows");
    await fs.mkdir(wfDir, { recursive: true });
    const wfPath = path.join(wfDir, "doclib-check.yml");
    await fs.writeFile(wfPath, CI_WORKFLOW, "utf8");
    return { text: `已生成 CI 模板: .github/workflows/doclib-check.yml（push/PR 时运行 doclib check --strict）\n`, json: { path: ".github/workflows/doclib-check.yml" } };
  }
  try {
    await fs.access(path.join(root, ".git"));
  } catch {
    throw new DoclibError("当前目录不是 git 仓库，无法安装钩子");
  }
  const hooksDir = path.join(root, ".git", "hooks");
  await fs.mkdir(hooksDir, { recursive: true });
  const p = path.join(hooksDir, "pre-commit");
  const existing = await fs.readFile(p, "utf8").catch(() => null);
  if (existing !== null && !existing.includes(MARKER)) {
    throw new DoclibError("已存在非 doclib 管理的 pre-commit 钩子；请手动合并后重试");
  }
  await fs.writeFile(p, hookScript(opts.strict === true), { mode: 0o755 });
  return {
    text: `已安装 pre-commit 钩子（提交时运行 doclib check${opts.strict ? " --strict" : ""}）。\n`,
    json: { path: ".git/hooks/pre-commit", strict: opts.strict === true },
  };
}
