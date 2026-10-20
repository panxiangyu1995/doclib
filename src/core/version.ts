import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

type Pkg = { name?: string; version?: string };

const FALLBACK_NAME = "@panxiangyu1995/doclib";

function readPkg(): { name: string; version: string } {
  try {
    const raw = readFileSync(fileURLToPath(new URL("../../package.json", import.meta.url)), "utf8");
    const pkg = JSON.parse(raw) as Pkg;
    return { name: pkg.name ?? FALLBACK_NAME, version: pkg.version ?? "0.0.0" };
  } catch {
    return { name: FALLBACK_NAME, version: "0.0.0" };
  }
}

const pkg = readPkg();
export const CLI_VERSION: string = pkg.version;
export const PACKAGE_NAME: string = pkg.name;
export const STRUCTURE_VERSION = 3;
