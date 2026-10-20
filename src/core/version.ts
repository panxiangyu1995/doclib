import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

type Pkg = { version?: string };

function readVersion(): string {
  try {
    const raw = readFileSync(fileURLToPath(new URL("../../package.json", import.meta.url)), "utf8");
    return (JSON.parse(raw) as Pkg).version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

export const CLI_VERSION: string = readVersion();
export const STRUCTURE_VERSION = 3;
