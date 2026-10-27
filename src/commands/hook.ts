import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bakeChainLines, chainMarker, loadTestChain, type TestChain } from "../core/harness.js";
import { DoclibError } from "../core/state.js";
import { CLI_VERSION, PACKAGE_NAME } from "../core/version.js";
import type { CommandResult } from "./init.js";

const MARKER = "# doclib-hook";

export type HookState = "none" | "doclib" | "doclib-strict" | "foreign";

function cliAbsPath(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "cli.js");
}

export function relativeCliPath(root: string, cliAbs: string): string {
  const rel = path.relative(root, cliAbs);
  return (rel.startsWith("..") ? cliAbs : rel).replace(/\\/g, "/");
}

export async function resolveHooksDir(root: string): Promise<string | null> {
  const dotGit = path.join(root, ".git");
  const st = await fs.stat(dotGit).catch(() => null);
  if (st === null) return null;
  if (st.isDirectory()) return path.join(dotGit, "hooks");
  const raw = await fs.readFile(dotGit, "utf8");
  const line = raw.split("\n").find((l) => l.startsWith("gitdir:"));
  if (!line) throw new DoclibError(".git 指针文件缺少 gitdir 行，无法定位钩子目录");
  const target = line.slice("gitdir:".length).trim();
  const gitdir = path.isAbsolute(target) ? target : path.resolve(root, target);
  return path.join(gitdir, "hooks");
}

export async function readHookState(root: string): Promise<HookState> {
  const hooksDir = await resolveHooksDir(root);
  if (hooksDir === null) return "none";
  const raw = await fs.readFile(path.join(hooksDir, "pre-commit"), "utf8").catch(() => null);
  if (raw === null) return "none";
  if (!raw.includes(MARKER)) return "foreign";
  return raw.includes("--strict") ? "doclib-strict" : "doclib";
}

function hookScript(root: string, strict: boolean, chain: TestChain | null): string {
  const flags = strict ? " --strict" : "";
  const cli = relativeCliPath(root, cliAbsPath());
  const lines = [
    "#!/bin/sh",
    MARKER,
    "# 由 doclib hook install 生成；移除请运行 doclib hook remove",
    'ROOT=$(git rev-parse --show-toplevel 2>/dev/null) && cd "$ROOT" || exit 1',
    'command -v node >/dev/null 2>&1 || { echo "doclib hook: 未找到 node，请先安装 Node.js；移除门禁请运行 doclib hook remove" >&2; exit 1; }',
    `CLI="${cli}"`,
    '[ -f "${CLI}" ] || { echo "doclib hook: CLI 不存在（${CLI}）——若尚未构建请先构建项目，或运行 doclib hook remove 移除门禁" >&2; exit 1; }',
    `node "\${CLI}" check${flags} || exit 1`,
  ];
  if (chain !== null) {
    lines.push(chainMarker(chain));
    lines.push(...bakeChainLines(chain.fast, "测试链 fast 档"));
  }
  lines.push("");
  return lines.join("\n");
}

function ciWorkflow(chain: TestChain | null): string {
  const lines = [
    "name: doclib-check",
    "",
    "on:",
    "  pull_request:",
    "  push:",
    "    branches: [main]",
    "",
    "jobs:",
    "  check:",
    "    runs-on: ubuntu-latest",
    "    steps:",
    "      - uses: actions/checkout@v4",
    "      - uses: actions/setup-node@v4",
    "        with:",
    "          node-version: 20",
    "      # 版本在安装时固化，保证 CI 可复现",
    `      - run: npx --yes ${PACKAGE_NAME}@${CLI_VERSION} check --strict`,
  ];
  if (chain !== null) {
    chain.full.forEach((cmd, i) => {
      lines.push(`      - run: ${cmd}`);
      lines.push(`        name: test-chain full ${i + 1}/${chain.full.length}`);
    });
  }
  return `${lines.join("\n")}\n`;
}

export async function runHook(
  root: string,
  opts: { strict?: boolean; remove?: boolean; ci?: string },
): Promise<CommandResult> {
  if (opts.remove === true) {
    const hooksDir = await resolveHooksDir(root);
    if (hooksDir === null) return { text: "未找到 pre-commit 钩子。\n", json: {} };
    const p = path.join(hooksDir, "pre-commit");
    const raw = await fs.readFile(p, "utf8").catch(() => null);
    if (raw === null) return { text: "未找到 pre-commit 钩子。\n", json: {} };
    if (!raw.includes(MARKER)) throw new DoclibError("pre-commit 钩子非 doclib 管理（无标记），请手动处理");
    await fs.rm(p);
    return { text: "已移除 doclib pre-commit 钩子。\n", json: { removed: true } };
  }
  if (opts.ci !== undefined) {
    if (opts.ci !== "github") throw new DoclibError("--ci 仅支持 github");
    const chain = await loadTestChain(root);
    const wfDir = path.join(root, ".github", "workflows");
    await fs.mkdir(wfDir, { recursive: true });
    const wfPath = path.join(wfDir, "doclib-check.yml");
    await fs.writeFile(wfPath, ciWorkflow(chain), "utf8");
    const chainNote = chain === null ? "" : `（含测试链 full 档 ${chain.full.length} 条）`;
    return { text: `已生成 CI 模板: .github/workflows/doclib-check.yml（push/PR 时运行 doclib check --strict）${chainNote}\n`, json: { path: ".github/workflows/doclib-check.yml" } };
  }
  const hooksDir = await resolveHooksDir(root);
  if (hooksDir === null) throw new DoclibError("当前目录不是 git 仓库，无法安装钩子");
  await fs.mkdir(hooksDir, { recursive: true });
  const p = path.join(hooksDir, "pre-commit");
  const state = await readHookState(root);
  if (state === "foreign") {
    throw new DoclibError("已存在非 doclib 管理的 pre-commit 钩子；请手动合并后重试");
  }
  const chain = await loadTestChain(root);
  await fs.writeFile(p, hookScript(root, opts.strict === true, chain), { mode: 0o755 });
  await fs.chmod(p, 0o755);
  const shown = path.relative(root, hooksDir).replace(/\\/g, "/") + "/pre-commit";
  const chainNote = chain === null ? "" : `测试链 fast 档 ${chain.fast.length} 条已烘焙（馆内 test-chain 变更后重跑本命令刷新）。`;
  return {
    text: `已安装 pre-commit 钩子（提交时运行 doclib check${opts.strict ? " --strict" : ""}）。${chainNote}\n`,
    json: { path: shown, strict: opts.strict === true, chainBaked: chain !== null },
  };
}
