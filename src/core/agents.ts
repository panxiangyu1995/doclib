import { DoclibError } from "./state.js";

export type AgentTarget = {
  id: string;
  name: string;
  skillsDir: string | null;
  guideFiles: string[];
};

export const AGENT_TARGETS: AgentTarget[] = [
  { id: "claude", name: "Claude Code", skillsDir: ".claude/skills", guideFiles: ["CLAUDE.md"] },
  { id: "opencode", name: "opencode", skillsDir: ".opencode/skills", guideFiles: ["AGENTS.md"] },
  { id: "cursor", name: "Cursor", skillsDir: null, guideFiles: ["AGENTS.md"] },
  { id: "generic", name: "通用 AGENTS.md", skillsDir: null, guideFiles: ["AGENTS.md"] },
];

export function resolveAgents(spec?: string): AgentTarget[] {
  const ids =
    spec === undefined || spec.trim() === ""
      ? ["generic"]
      : spec
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
  const out: AgentTarget[] = [];
  for (const id of ids) {
    const target = AGENT_TARGETS.find((t) => t.id === id);
    if (!target) {
      throw new DoclibError(`未知 agent: ${id}（可选: ${AGENT_TARGETS.map((t) => t.id).join(", ")}）`);
    }
    if (!out.some((t) => t.id === id)) out.push(target);
  }
  return out;
}
