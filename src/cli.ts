#!/usr/bin/env node
import { runInit } from "./commands/init.js";
import { runSnapshot } from "./commands/snapshot.js";
import { runDiff } from "./commands/diff.js";
import { runPlan } from "./commands/plan.js";
import { runStatus } from "./commands/status.js";
import { runVerify } from "./commands/verify.js";
import { runSync } from "./commands/sync.js";
import { runCheck } from "./commands/check.js";
import { runAck } from "./commands/ack.js";
import { runHook } from "./commands/hook.js";
import { runReconcile } from "./commands/reconcile.js";
import { runBranch } from "./commands/branch.js";
import { runGraph } from "./commands/graph.js";
import { runPlace } from "./commands/place.js";
import { runImplement } from "./commands/implement.js";
import { DoclibError } from "./core/state.js";
import { CLI_VERSION } from "./core/version.js";

type Flags = {
  json: boolean;
  force: boolean;
  rebuild: boolean;
  bootstrap: boolean;
  resume: boolean;
  strict: boolean;
  standing: boolean;
  remove: boolean;
  apply: boolean;
  dir: boolean;
  graph: boolean;
  noHook: boolean;
  note?: string;
  to?: string;
  agents?: string;
  guide?: "light" | "none";
  planning?: string;
  ci?: string;
  reason?: string;
  feature?: number;
};

function parseArgs(argv: string[]): { cmd: string; args: string[]; flags: Flags } {
  const flags: Flags = {
    json: false,
    force: false,
    rebuild: false,
    bootstrap: false,
    resume: false,
    strict: false,
    standing: false,
    remove: false,
    apply: false,
    dir: false,
    graph: false,
    noHook: false,
  };
  const positional: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--json") flags.json = true;
    else if (a === "--force") flags.force = true;
    else if (a === "--rebuild") flags.rebuild = true;
    else if (a === "--bootstrap") flags.bootstrap = true;
    else if (a === "--resume") flags.resume = true;
    else if (a === "--strict") flags.strict = true;
    else if (a === "--standing") flags.standing = true;
    else if (a === "--remove") flags.remove = true;
    else if (a === "--apply") flags.apply = true;
    else if (a === "--dir") flags.dir = true;
    else if (a === "--graph") flags.graph = true;
    else if (a === "--no-hook") flags.noHook = true;
    else if (a === "--note") flags.note = argv[++i];
    else if (a === "--to") flags.to = argv[++i];
    else if (a === "--agents") flags.agents = argv[++i];
    else if (a === "--guide") flags.guide = argv[++i] as Flags["guide"];
    else if (a === "--planning") flags.planning = argv[++i];
    else if (a === "--ci") flags.ci = argv[++i];
    else if (a === "--reason") flags.reason = argv[++i];
    else if (a === "--feature") flags.feature = Number(argv[++i]);
    else positional.push(a);
  }
  return { cmd: positional[0] ?? "help", args: positional, flags };
}

const HELP = `doclib — 把任意项目蒸馏成可复原的文档图书馆

用法: doclib <命令> [选项]

命令:
  init      初始化 doclib/ 图书馆骨架与 .doclib/ 簿记目录
  plan      生成任务书: BUILD(无基线) / UPDATE(有漂移) / REBUILD(--rebuild) / BOOTSTRAP(--bootstrap) / RESUME(--resume)
  diff      对比当前代码与基线快照, 输出漂移与受影响文档
  snapshot  将当前代码状态记录为新基线 (图书馆版本 +1, revision +1)
  status    图书馆版本、基线、漂移、治理健康分、引导预算、载体提醒概览
  verify    覆盖度报告: 未覆盖路径 / 失效文档 / INDEX 完整性
  sync      引导文件规则区与 skills 同步到已安装 agent（幂等，定制区保留）
  check     强验证: 双账本对账（漏更/无归属/迁移违规/引导过期/孤儿文档）+ 治理健康分 --strict 为门禁
  ack       登记路径豁免（--standing 长期 / --remove 移除 / --note 备注）；--dir <前缀> 登记目录豁免
  place     孤儿归位：list（列出待归位与建议归宿）/ collect（收编入馆）/ archive（入棺归档）/ ack（登记豁免）/ restore（还原归档）；写操作默认干跑，--apply 执行
  hook      pre-commit 钩子安装/移除（--strict；--ci github 发 CI 模板）
  reconcile 进度对账重建：疑似完成/进度不符/待推进清单
  branch    分支账：list（账实对照）/ register <分支> --note <目的>（登记分馆）/ diff [主分支]（分馆 vs 主馆合并审计）
  graph     代码知识图谱: index 建图(增量同步)/status 状态/draft 登记簿候选草稿/explore 上下文查询（可选增强，需 Node >= 22.5）
  implement 拆单器：无 --feature 列 planned 候选；--feature <N> readiness 校验后生成 .plan 实施骨架（干跑默认，--apply 落盘）

选项:
  --json       以 JSON 输出 (diff/verify/status/place list/graph status)
  --graph      init 时同步初始化代码知识图谱（需 Node >= 22.5，可用 doclib graph index 补建）
  --no-hook    init 时不自动安装 pre-commit 门禁（默认自动安装 --strict 档）
  --note       snapshot 的备注文本；place ack 的豁免理由；branch register 的分支目的
  --to         rebuild 目标目录 (默认 ../<项目名>-rebuild)；place collect 的目标卷
  --force      init 时补齐/刷新模板文件（用户内容不覆盖）
  --rebuild    plan 生成从零复原任务书
  --bootstrap  plan 生成新项目对话式建馆任务书
  --resume     plan 生成半成品接手任务书
  --agents     init 适配的 agent: claude,opencode,cursor,generic（缺省交互/降级 generic）
  --guide      init 引导文件档位: light | none（缺省交互/降级 light）
  --planning   init 规划载体路径（逗号分隔多路径，默认 .plan/）
  --apply      place 写操作实际执行（缺省仅干跑预览）；implement 骨架落盘（缺省仅预览）
  --feature    implement 的 feature-map 功能号
  --dir        ack 以目录前缀登记豁免（不判孤儿但仍进代码账）
  --reason     place archive 的失效原因（入棺必填）

闭环:
  init → plan(BUILD) → agent 按 doclib-build 构建图书馆 → verify → snapshot
  新项目: init → plan(--bootstrap) → agent 按 doclib-bootstrap 对话挖掘 → 文档先行开发
  拆单:   doclib implement --feature <N> → agent 按 doclib-implement 填实实施清单 → 逐条 AC 施工自检
  半成品: init → plan(--resume) → agent 按 doclib-resume 蒸馏+登记规划 → 转日常开发
  改代码 → diff → plan(UPDATE) → agent 按 doclib-update 增量更新 → verify → snapshot
  馆外文档: check → place list → place collect/archive --apply → check（归位卫生分回升）
  任意时刻: plan --rebuild → agent 只凭图书馆按 doclib-rebuild 从零复原`;

async function main(): Promise<void> {
  const root = process.cwd();
  const { cmd, args, flags } = parseArgs(process.argv.slice(2));
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
      console.log((await runStatus(root, flags)).text);
      break;
    case "verify":
      console.log((await runVerify(root, flags)).text);
      break;
    case "sync":
      console.log((await runSync(root, flags)).text);
      break;
    case "check":
      console.log((await runCheck(root, flags)).text);
      break;
    case "ack":
      console.log((await runAck(root, { ...flags, path: args[1] })).text);
      break;
    case "place": {
      const action = (args[1] ?? "list") as "list" | "collect" | "archive" | "ack" | "restore";
      console.log((await runPlace(root, { ...flags, action, path: args[2] })).text);
      break;
    }
    case "hook":
      console.log((await runHook(root, { ...flags, remove: flags.remove || args[1] === "remove" })).text);
      break;
    case "reconcile":
      console.log((await runReconcile(root, flags)).text);
      break;
    case "branch":
      console.log((await runBranch(root, { action: args[1], name: args[2], note: flags.note, base: args[2], json: flags.json })).text);
      break;
    case "graph":
      console.log((await runGraph(root, args[1] ?? "", { ...flags, query: args[2] })).text);
      break;
    case "implement":
      console.log((await runImplement(root, { feature: flags.feature, apply: flags.apply })).text);
      break;
    case "version":
    case "--version":
      console.log(`doclib ${CLI_VERSION}`);
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
