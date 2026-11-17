import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { ledgerReconcileNotices, eventRegistrationNotices } from "./ledger-reconcile.js";
import { LIBRARY_DIR } from "./state.js";

async function tmpLib(docs: Record<string, string>): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "doclib-ledger-"));
  for (const [rel, content] of Object.entries(docs)) {
    const p = path.join(root, LIBRARY_DIR, rel);
    await fs.mkdir(path.dirname(p), { recursive: true });
    await fs.writeFile(p, content, "utf8");
  }
  return root;
}

const FRONT = "---\ntitle: x\ncovers:\n  - src/a\n---\n\n";

test("ledgerReconcileNotices：节区标题声明与同节表枚举不符 → notice", async () => {
  const root = await tmpLib({
    "90-reference/app-error.md":
      `${FRONT}## 变体（17）\n\n| 变体 | 说明 |\n| --- | --- |\n| A | a |\n| B | b |\n`,
  });
  const notices = await ledgerReconcileNotices(path.join(root, LIBRARY_DIR));
  assert.equal(notices.length, 1);
  assert.match(notices[0]!.detail, /声明 17 项.*枚举为 2 项/);
});

test("ledgerReconcileNotices：行内声明与反引号斜杠枚举不符 → notice；相符则静默；路径形单 span 不计枚举", async () => {
  const root = await tmpLib({
    "90-reference/keys.md": `${FRONT}共 19 键：\`K1\`/\`K2\`/\`K3\`/\`K4\`\n\n共 4 键：\`A1\`/\`A2\`/\`A3\`/\`A4\`\n\n共 4 文件：\`doclib/50-testing/benchmark/030-umami-answer-rebuild.md\`\n`,
  });
  const notices = await ledgerReconcileNotices(path.join(root, LIBRARY_DIR));
  assert.equal(notices.length, 1);
  assert.match(notices[0]!.detail, /声明 19 项.*枚举为 4 项/);
});

test("ledgerReconcileNotices：句中声明（非行主语）不与同行枚举配对 → 不误报", async () => {
  const root = await tmpLib({
    "40-guides/plan.md": `${FRONT}- 内容：\`A\`/\`B\` 结构（serde）；薄转发；\`Result<T,String>\`；\`AppError\` 17 变体+双文面。\n`,
  });
  assert.deepEqual(await ledgerReconcileNotices(path.join(root, LIBRARY_DIR)), []);
});

test("ledgerReconcileNotices：无枚举可数（散文/小节过短）不误报", async () => {
  const root = await tmpLib({
    "90-reference/prose.md": `${FRONT}## 变体（17）\n\n枚举见源码，此处仅述机制：逐变体映射到用户可见文案。\n`,
  });
  const notices = await ledgerReconcileNotices(path.join(root, LIBRARY_DIR));
  assert.deepEqual(notices, []);
});

test("ledgerReconcileNotices：benchmark/会话档案区豁免", async () => {
  const root = await tmpLib({
    "50-testing/benchmark/200-x.md": `${FRONT}共 9 键：\`K1\`/\`K2\`/\`K3\`/\`K4\`\n`,
    "98-sessions/t-20260101-01.md": `${FRONT}共 9 键：\`K1\`/\`K2\`/\`K3\`/\`K4\`\n`,
  });
  const notices = await ledgerReconcileNotices(path.join(root, LIBRARY_DIR));
  assert.deepEqual(notices, []);
});

test("eventRegistrationNotices：listen 引用的事件 00-overview 未入账 → notice；已入账则静默", async () => {
  const root = await tmpLib({
    "30-features/provider-switch.md": `${FRONT}前端 \`listen("provider-switched")\` 监听切换完成。\n`,
    "00-overview/feature-map.md": `# feature-map\n\nF1 切换功能 implemented\n`,
  });
  const notices = await eventRegistrationNotices(path.join(root, LIBRARY_DIR));
  assert.equal(notices.length, 1);
  assert.match(notices[0]!.detail, /"provider-switched"/);

  const root2 = await tmpLib({
    "30-features/provider-switch.md": `${FRONT}前端 \`listen("provider-switched")\` 监听切换完成。\n`,
    "00-overview/events.md": `# 事件登记簿\n\n- provider-switched：切换完成后发射\n`,
  });
  assert.deepEqual(await eventRegistrationNotices(path.join(root2, LIBRARY_DIR)), []);
});

test("eventRegistrationNotices：无事件引用（非事件型库）静默", async () => {
  const root = await tmpLib({
    "30-features/x.md": `${FRONT}纯 CLI 行为，无前端事件。\n`,
  });
  assert.deepEqual(await eventRegistrationNotices(path.join(root, LIBRARY_DIR)), []);
});