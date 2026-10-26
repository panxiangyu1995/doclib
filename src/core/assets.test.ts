import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { collectFiles } from "./fsutil.js";
import { assetsRoot } from "./assets.js";

const EXPECTED_TEMPLATES = [
  "README.md",
  "INDEX.md",
  "00-overview/project.md",
  "00-overview/glossary.md",
  "00-overview/feature-map.md",
  "00-overview/progress.md",
  "10-architecture/overview.md",
  "10-architecture/data-model.md",
  "10-architecture/data-flow.md",
  "10-architecture/dependencies.md",
  "10-architecture/decisions.md",
  "10-architecture/migrations.md",
  "20-modules/_index.md",
  "30-features/_index.md",
  "40-guides/roadmap.md",
  "40-guides/conventions.md",
  "40-guides/workflow.md",
  "50-testing/testing.md",
  "60-config/settings.md",
  "70-deploy/deploy.md",
  "80-design/README.md",
  "90-reference/_index.md",
  "95-lessons/lessons.md",
  "00-overview/_index.md",
  "10-architecture/_index.md",
  "40-guides/_index.md",
  "50-testing/_index.md",
  "60-config/_index.md",
  "70-deploy/_index.md",
  "80-design/_index.md",
  "95-lessons/_index.md",
  "99-archive/README.md",
];

test("12 卷基线模板清单完整", async () => {
  const files = await collectFiles(path.join(assetsRoot(), "templates", "library"));
  assert.deepEqual(files.sort(), [...EXPECTED_TEMPLATES].sort());
});

test("引导模板与 skills 资产存在", async () => {
  await fs.access(path.join(assetsRoot(), "guides", "light.md"));
  await fs.access(path.join(assetsRoot(), "guides", "full.md"));
  await fs.access(path.join(assetsRoot(), "skills", "doclib-build", "SKILL.md"));
});
