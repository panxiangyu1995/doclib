import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { reconcileFlagSurface, reconcileTauriCommandSurface } from "./surface.js";
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

test("reconcileFlagSurface：98-sessions 对话档案区全豁免（原文不改写不进对账）", async () => {
  const root = await tmpLib();
  await fs.mkdir(path.join(root, LIBRARY_DIR, "98-sessions"), { recursive: true });
  await fs.writeFile(
    path.join(root, LIBRARY_DIR, "98-sessions", "t.md"),
    "# 会话记录\n\n用户聊到 `--ghost-flag` 与 --raw-token 等外部工具旗标，对话原文不参与对账。\n",
    "utf8",
  );
  const r = await reconcileFlagSurface(root, path.join(root, LIBRARY_DIR));
  assert.deepEqual(r.inLibNotSrc, []);
  assert.equal(r.libFlags, 0);
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

test("reconcileTauriCommandSurface：裸/name 覆盖/camelCase 三形态检出，源有馆无入账", async () => {
  const root = await tmpLib();
  await fs.mkdir(path.join(root, "src-tauri", "src", "commands"), { recursive: true });
  await fs.writeFile(
    path.join(root, "src-tauri", "src", "commands", "provider.rs"),
    [
      "#[tauri::command]",
      "pub async fn list_providers(state: tauri::State<AppState>) -> Vec<Provider> { unimplemented!() }",
      "",
      '#[tauri::command(rename_all = "camelCase", name = "queryProviderUsage")]',
      "pub async fn usage_query(state: tauri::State<AppState>) -> Usage { unimplemented!() }",
      "",
      '#[tauri::command(rename_all = "camelCase")]',
      "pub fn get_status() -> Status { unimplemented!() }",
    ].join("\n"),
    "utf8",
  );
  await fs.writeFile(
    path.join(root, LIBRARY_DIR, "90-reference", "tauri-commands-provider.md"),
    "---\ntitle: tauri-commands-provider\ncovers:\n  - src-tauri/src/commands/provider.rs\n---\n\n- list_providers\n- queryProviderUsage\n",
    "utf8",
  );
  const r = await reconcileTauriCommandSurface(root, path.join(root, LIBRARY_DIR));
  assert.equal(r.srcCommands, 3);
  assert.equal(r.registered, 2);
  assert.deepEqual(r.inSrcNotLib.map((x) => x.cmd), ["get_status"]);
});

test("reconcileTauriCommandSurface：只扫 covers 声明面（切片感知，切片外命令不刷噪音）", async () => {
  const root = await tmpLib();
  await fs.mkdir(path.join(root, "src-tauri", "src", "commands"), { recursive: true });
  await fs.writeFile(
    path.join(root, "src-tauri", "src", "commands", "provider.rs"),
    "#[tauri::command]\npub async fn in_slice() -> () { unimplemented!() }\n",
    "utf8",
  );
  await fs.writeFile(
    path.join(root, "src-tauri", "src", "tray.rs"),
    "#[tauri::command]\npub async fn out_of_slice() -> () { unimplemented!() }\n",
    "utf8",
  );
  await fs.writeFile(
    path.join(root, LIBRARY_DIR, "90-reference", "tauri-commands-provider.md"),
    "---\ntitle: tauri-commands-provider\ncovers:\n  - src-tauri/src/commands/provider.rs\n---\n\n- in_slice\n",
    "utf8",
  );
  const r = await reconcileTauriCommandSurface(root, path.join(root, LIBRARY_DIR));
  assert.equal(r.srcCommands, 1);
  assert.equal(r.registered, 1);
  assert.deepEqual(r.inSrcNotLib, []);
});

test("reconcileTauriCommandSurface：非 Tauri repo 返回不适用注记", async () => {
  const root = await tmpLib();
  const r = await reconcileTauriCommandSurface(root, path.join(root, LIBRARY_DIR));
  assert.equal(r.srcCommands, 0);
  assert.equal(r.inSrcNotLib.length, 0);
  assert.equal(r.notes.length > 0, true);
});

test("reconcileTauriCommandSurface：非 pub async fn 也是命令（不串到下一个 pub fn）", async () => {
  const root = await tmpLib();
  await fs.mkdir(path.join(root, "src-tauri", "src"), { recursive: true });
  await fs.writeFile(
    path.join(root, "src-tauri", "src", "lib.rs"),
    ["/// 更新托盘菜单", "#[tauri::command]", "async fn update_tray_menu(app: tauri::AppHandle) -> bool { unimplemented!() }", "", "pub fn run() {}"].join("\n"),
    "utf8",
  );
  await fs.writeFile(
    path.join(root, LIBRARY_DIR, "90-reference", "tray.md"),
    "---\ntitle: tray\ncovers:\n  - src-tauri/src/lib.rs\n---\n\n托盘菜单更新逻辑。\n",
    "utf8",
  );
  const r = await reconcileTauriCommandSurface(root, path.join(root, LIBRARY_DIR));
  assert.equal(r.srcCommands, 1);
  assert.deepEqual(r.inSrcNotLib.map((x) => x.cmd), ["update_tray_menu"]);
});

test("reconcileTauriCommandSurface：短名裸词提及不算入账（须反引号显式登记）", async () => {
  const root = await tmpLib();
  await fs.mkdir(path.join(root, "src-tauri", "src", "commands"), { recursive: true });
  await fs.writeFile(
    path.join(root, "src-tauri", "src", "commands", "mini.rs"),
    "#[tauri::command]\npub fn go() -> () { unimplemented!() }\n",
    "utf8",
  );
  await fs.writeFile(
    path.join(root, LIBRARY_DIR, "90-reference", "mini.md"),
    "---\ntitle: mini\ncovers:\n  - src-tauri/src/commands/mini.rs\n---\n\n让用户 go 一下，未登记 go。\n",
    "utf8",
  );
  const r = await reconcileTauriCommandSurface(root, path.join(root, LIBRARY_DIR));
  assert.deepEqual(r.inSrcNotLib.map((x) => x.cmd), ["go"]);
});
