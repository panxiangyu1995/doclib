import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { reconcileFlagSurface } from "./surface.js";
import { LIBRARY_DIR } from "./state.js";

async function tmpLib(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "doclib-flag-"));
  await fs.mkdir(path.join(root, LIBRARY_DIR, "90-reference"), { recursive: true });
  await fs.mkdir(path.join(root, "src", "cli"), { recursive: true });
  return root;
}

test("reconcileFlagSurface：源有馆无/馆有源无双向检出", async () => {
  const root = await tmpLib();
  await fs.writeFile(
    path.join(root, LIBRARY_DIR, "90-reference", "tools.md"),
    "---\ntitle: tools\ncovers:\n  - src/cli\n---\n\n| TOOL-001 | t | `--alpha --beta --ghost` |\n",
    "utf8",
  );
  await fs.writeFile(
    path.join(root, "src", "cli", "main.py"),
    "parser.add_argument('--alpha')\nparser.add_argument('--beta')\nparser.add_argument('--gamma')\n",
    "utf8",
  );
  const r = await reconcileFlagSurface(root, path.join(root, LIBRARY_DIR));
  assert.deepEqual(r.inLibNotSrc.map((x) => x.flag), ["--ghost"]);
  assert.deepEqual(r.inSrcNotLib.map((x) => x.flag), ["--gamma"]);
});

test("reconcileFlagSurface：长名一致归零；短名与无引号字面量不误报", async () => {
  const root = await tmpLib();
  await fs.writeFile(
    path.join(root, LIBRARY_DIR, "90-reference", "tools.md"),
    "---\ntitle: tools\ncovers:\n  - src/cli\n---\n\n`-d/--delimiter` 与 `--tabular` 均登记；---表格分隔线不是旗标---\n\n| a | b |\n| --- | --- |\n",
    "utf8",
  );
  await fs.writeFile(
    path.join(root, "src", "cli", "main.py"),
    "add_argument('-d', '--delimiter')\nadd_argument('--tabular')  # regex /--notflag/ 与裸 --naked 均不误报\n",
    "utf8",
  );
  const r = await reconcileFlagSurface(root, path.join(root, LIBRARY_DIR));
  assert.deepEqual(r.inLibNotSrc, []);
  assert.deepEqual(r.inSrcNotLib, []);
  assert.equal(r.libFlags > 0, true);
});
