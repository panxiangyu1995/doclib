import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { surfaceScan } from "./surface.js";

async function tmpRoot(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "doclib-surface-"));
  await fs.mkdir(path.join(root, "doclib", "90-reference"), { recursive: true });
  return root;
}

test("surfaceScan：route/page/proto 枚举 + 登记簿 ID 计数（含区间展开）", async () => {
  const root = await tmpRoot();
  await fs.mkdir(path.join(root, "src", "app", "api", "users"), { recursive: true });
  await fs.mkdir(path.join(root, "src", "app", "login"), { recursive: true });
  await fs.mkdir(path.join(root, "src", "proto"), { recursive: true });
  await fs.writeFile(path.join(root, "src", "app", "api", "users", "route.ts"), "export GET");
  await fs.writeFile(path.join(root, "src", "app", "login", "page.tsx"), "export page");
  await fs.writeFile(
    path.join(root, "src", "proto", "x.proto"),
    "service S {\n  rpc A(AReq) returns (AResp);\n  rpc B(BReq) returns (BResp);\n}",
    "utf8",
  );
  await fs.writeFile(
    path.join(root, "doclib", "90-reference", "api.md"),
    "| API-001 | a |\n| API-002 | b |\nids: API-003~API-006\n| ROUTE-001 | p |",
    "utf8",
  );
  const report = await surfaceScan(root, path.join(root, "doclib"), [
    "src/app/api/users/route.ts",
    "src/app/login/page.tsx",
    "src/proto/x.proto",
  ]);
  assert.equal(report.endpointSurface, 1);
  assert.equal(report.pageSurface, 1);
  assert.equal(report.rpcSurface, 2);
  assert.equal(report.registeredApi, 6);
  assert.equal(report.registeredRoute, 1);
  assert.equal(report.apiDelta, 3);
  assert.ok(report.notes.some((n) => n.includes("多于面枚举")));
});

test("surfaceScan：登记簿少于面枚举时报漏登记", async () => {
  const root = await tmpRoot();
  await fs.mkdir(path.join(root, "src", "app", "api"), { recursive: true });
  for (const n of ["a", "b", "c"]) {
    await fs.writeFile(path.join(root, "src", "app", "api", `${n}.route.ts`), "x");
  }
  await fs.writeFile(path.join(root, "doclib", "90-reference", "api.md"), "| API-001 | only one |", "utf8");
  const report = await surfaceScan(root, path.join(root, "doclib"), [
    "src/app/api/a.route.ts",
    "src/app/api/b.route.ts",
    "src/app/api/c.route.ts",
  ]);
  assert.equal(report.endpointSurface, 3);
  assert.equal(report.registeredApi, 1);
  assert.ok(report.notes.some((n) => n.includes("少于面枚举")));
});
