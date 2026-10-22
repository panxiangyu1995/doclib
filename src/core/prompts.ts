import readline from "node:readline/promises";
import { AGENT_TARGETS } from "./agents.js";

export function isInteractive(): boolean {
  return process.stdout.isTTY === true && process.env.CI === undefined;
}

export async function askAgents(): Promise<string[]> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const options = AGENT_TARGETS.map((t) => t.id).join(", ");
    const answer = await rl.question(`选择要适配的 agent（逗号分隔，可选 ${options}，回车=generic）: `);
    const trimmed = answer.trim();
    if (trimmed === "") return ["generic"];
    return trimmed
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  } finally {
    rl.close();
  }
}

export async function askGuide(): Promise<"light" | "none"> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question("写入源项目轻量引导文件? (light/none，回车=light): ");
    return answer.trim() === "none" ? "none" : "light";
  } finally {
    rl.close();
  }
}

export async function askPlanning(): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question("规划载体路径（逗号分隔多个，回车=.plan/）: ");
    const trimmed = answer.trim();
    return trimmed === "" ? ".plan" : trimmed;
  } finally {
    rl.close();
  }
}

export async function askGraph(): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question("初始化代码知识图谱 .codegraph/（可选加速器，需 Node >= 22.5，大仓库首次索引需数分钟，回车=否）: ");
    const t = answer.trim().toLowerCase();
    return t === "y" || t === "yes" || t === "是";
  } finally {
    rl.close();
  }
}
