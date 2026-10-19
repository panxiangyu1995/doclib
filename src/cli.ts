#!/usr/bin/env node
import { runInit } from "./commands/init.js";
import { runSnapshot } from "./commands/snapshot.js";
import { runDiff } from "./commands/diff.js";
import { runPlan } from "./commands/plan.js";
import { runStatus } from "./commands/status.js";
import { runVerify } from "./commands/verify.js";
import { DoclibError } from "./core/state.js";

type Flags = { json: boolean; force: boolean; rebuild: boolean; note?: string; to?: string; agents?: string; guide?: "light" | "none" };

function parseArgs(argv: string[]): { cmd: string; flags: Flags } {
  const flags: Flags = { json: false, force: false, rebuild: false };
  const positional: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--json") flags.json = true;
    else if (a === "--force") flags.force = true;
    else if (a === "--rebuild") flags.rebuild = true;
    else if (a === "--note") flags.note = argv[++i];
    else if (a === "--to") flags.to = argv[++i];
    else if (a === "--agents") flags.agents = argv[++i];
    else if (a === "--guide") flags.guide = argv[++i] as Flags["guide"];
    else positional.push(a);
  }
  return { cmd: positional[0] ?? "help", flags };
}

const HELP = `doclib — 把任意项目蒸馏成可复原的文档图书馆

用法: doclib <命令> [选项]

命令:
  init      初始化 doclib/ 图书馆骨架与 .doclib/ 簿记目录
  plan      生成任务书: BUILD(无基线) / UPDATE(有漂移) / REBUILD(--rebuild)
  diff      对比当前代码与基线快照, 输出漂移与受影响文档
  snapshot  将当前代码状态记录为新基线 (图书馆版本 +1)
  status    图书馆版本、基线、漂移概览
  verify    覆盖度报告: 未覆盖路径 / 失效文档 / INDEX 完整性

选项:
  --json     以 JSON 输出 (diff/verify/status)
  --note     snapshot 的备注文本
  --to       rebuild 目标目录 (默认 ../<项目名>-rebuild)
  --force    init 时补齐/刷新模板文件（用户内容不覆盖）
  --rebuild  plan 生成从零复原任务书
  --agents   init 适配的 agent: claude,opencode,cursor,generic（缺省交互/降级 generic）
  --guide    init 引导文件档位: light | none（缺省交互/降级 light）

闭环:
  init → plan(BUILD) → agent 按 doclib-build 构建图书馆 → verify → snapshot
  改代码 → diff → plan(UPDATE) → agent 按 doclib-update 增量更新 → verify → snapshot
  任意时刻: plan --rebuild → agent 只凭图书馆按 doclib-rebuild 从零复原`;

async function main(): Promise<void> {
  const root = process.cwd();
  const { cmd, flags } = parseArgs(process.argv.slice(2));
  switch (cmd) {
    case "init":
      console.log((await runInit(root, flags)).text);
      break;
    case "plan":
      console.log((await runPlan(root, flags)).text);
      break;
    case "diff":
      console.log((await runDiff(root, flags)).text);
      break;
    case "snapshot":
      console.log((await runSnapshot(root, flags)).text);
      break;
    case "status":
      console.log((await runStatus(root)).text);
      break;
    case "verify":
      console.log((await runVerify(root, flags)).text);
      break;
    case "version":
    case "--version":
      console.log("doclib 0.1.0");
      break;
    case "help":
    case "--help":
    case "-h":
    default:
      console.log(HELP);
      break;
  }
}

main().catch((err: unknown) => {
  if (err instanceof DoclibError) console.error(`错误: ${err.message}`);
  else console.error(err);
  process.exit(1);
});
