import fs from "node:fs/promises";
import path from "node:path";
import { readFileOrNull } from "./fsutil.js";

export type Detection = {
  name: string | null;
  primary: string;
  languages: Record<string, number>;
  frameworks: string[];
  entryHints: string[];
};

const CODE_EXT: Record<string, string> = {
  ts: "TypeScript",
  mts: "TypeScript",
  cts: "TypeScript",
  tsx: "TypeScript",
  js: "JavaScript",
  mjs: "JavaScript",
  cjs: "JavaScript",
  jsx: "JavaScript",
  py: "Python",
  go: "Go",
  rs: "Rust",
  java: "Java",
  kt: "Kotlin",
  kts: "Kotlin",
  swift: "Swift",
  rb: "Ruby",
  php: "PHP",
  cs: "C#",
  scala: "Scala",
  c: "C",
  h: "C",
  cpp: "C++",
  cc: "C++",
  cxx: "C++",
  hpp: "C++",
  hh: "C++",
  m: "Objective-C",
  mm: "Objective-C",
  dart: "Dart",
  ex: "Elixir",
  exs: "Elixir",
  erl: "Erlang",
  lua: "Lua",
  sh: "Shell",
  bash: "Shell",
  zsh: "Shell",
  vue: "Vue",
  svelte: "Svelte",
  astro: "Astro",
  sql: "SQL",
  pl: "Perl",
  r: "R",
  groovy: "Groovy",
  clj: "Clojure",
  hs: "Haskell",
};

export function languageOf(relPath: string): string | null {
  const base = relPath.split("/").pop() ?? relPath;
  const dot = base.lastIndexOf(".");
  if (dot <= 0) return null;
  const ext = base.slice(dot + 1).toLowerCase();
  return CODE_EXT[ext] ?? null;
}

const PKG_FRAMEWORKS: Array<[string, string, boolean?]> = [
  ["react", "React"],
  ["vue", "Vue"],
  ["svelte", "Svelte"],
  ["@angular/core", "Angular"],
  ["next", "Next.js"],
  ["nuxt", "Nuxt"],
  ["astro", "Astro"],
  ["@remix-run/node", "Remix"],
  ["express", "Express"],
  ["fastify", "Fastify"],
  ["koa", "Koa"],
  ["hono", "Hono"],
  ["@nestjs/core", "NestJS"],
  ["electron", "Electron"],
  ["vite", "Vite"],
  ["webpack", "webpack"],
  ["esbuild", "esbuild"],
  ["rollup", "Rollup"],
  ["jest", "Jest"],
  ["vitest", "Vitest"],
  ["mocha", "Mocha"],
  ["@playwright/test", "Playwright"],
  ["cypress", "Cypress"],
  ["@prisma/client", "Prisma"],
  ["drizzle-orm", "Drizzle"],
  ["typeorm", "TypeORM"],
  ["sequelize", "Sequelize"],
  ["mongoose", "Mongoose"],
  ["knex", "Knex"],
  ["tailwindcss", "Tailwind CSS"],
  ["sass", "Sass"],
  ["typescript", "TypeScript"],
  ["eslint", "ESLint"],
  ["prettier", "Prettier"],
  ["graphql", "GraphQL"],
  ["@apollo/server", "Apollo"],
  ["socket.io", "Socket.IO"],
  ["zustand", "Zustand"],
  ["@reduxjs/toolkit", "Redux Toolkit"],
  ["@tanstack/react-query", "TanStack Query"],
  ["i18next", "i18next"],
  ["turbo", "Turborepo"],
  ["nx", "Nx"],
  ["@storybook/addon-essentials", "Storybook"],
];

const PY_HINTS: Array<[RegExp, string]> = [
  [/django/i, "Django"],
  [/flask/i, "Flask"],
  [/fastapi/i, "FastAPI"],
  [/pytest/i, "Pytest"],
  [/celery/i, "Celery"],
  [/sqlalchemy/i, "SQLAlchemy"],
  [/scrapy/i, "Scrapy"],
  [/poetry/i, "Poetry"],
];

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function detectProject(root: string, files: string[]): Promise<Detection> {
  const languages: Record<string, number> = {};
  for (const f of files) {
    const lang = languageOf(f);
    if (lang) languages[lang] = (languages[lang] ?? 0) + 1;
  }
  const primary = Object.entries(languages).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "未知";
  const frameworks = new Set<string>();
  let name: string | null = null;
  const entryHints: string[] = [];

  const pkgRaw = await readFileOrNull(path.join(root, "package.json"));
  if (pkgRaw) {
    try {
      const pkg = JSON.parse(pkgRaw) as {
        name?: string;
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
        scripts?: Record<string, string>;
      };
      if (pkg.name) name = pkg.name;
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      for (const [dep, label] of PKG_FRAMEWORKS) {
        if (deps[dep] !== undefined) frameworks.add(label);
      }
      const scripts = Object.keys(pkg.scripts ?? {});
      if (scripts.length > 0) entryHints.push(`scripts: ${scripts.join(", ")}`);
    } catch {
      frameworks.add("package.json(解析失败)");
    }
  }

  const pyRaw =
    (await readFileOrNull(path.join(root, "requirements.txt"))) ??
    (await readFileOrNull(path.join(root, "pyproject.toml")));
  if (pyRaw) {
    for (const [re, label] of PY_HINTS) {
      if (re.test(pyRaw)) frameworks.add(label);
    }
  }

  const goRaw = await readFileOrNull(path.join(root, "go.mod"));
  if (goRaw) {
    const m = /module\s+(\S+)/.exec(goRaw);
    if (m) name ??= m[1]!;
    if (goRaw.includes("github.com/gin-gonic/gin")) frameworks.add("Gin");
    if (goRaw.includes("github.com/labstack/echo")) frameworks.add("Echo");
  }

  const cargoRaw = await readFileOrNull(path.join(root, "Cargo.toml"));
  if (cargoRaw) {
    const m = /^\s*name\s*=\s*"([^"]+)"/m.exec(cargoRaw);
    if (m) name ??= m[1]!;
  }

  const composerRaw = await readFileOrNull(path.join(root, "composer.json"));
  if (composerRaw) {
    if (composerRaw.includes("laravel/framework")) frameworks.add("Laravel");
    if (composerRaw.includes("symfony/")) frameworks.add("Symfony");
  }

  const gemRaw = await readFileOrNull(path.join(root, "Gemfile"));
  if (gemRaw && /rails/i.test(gemRaw)) frameworks.add("Rails");

  const pomRaw = await readFileOrNull(path.join(root, "pom.xml"));
  if (pomRaw && pomRaw.includes("spring-boot")) frameworks.add("Spring Boot");

  for (const p of ["src/index.ts", "src/main.ts", "index.js", "src/main.py", "main.py", "app.py", "main.go", "src/App.tsx"]) {
    if (await exists(path.join(root, p))) entryHints.push(p);
  }

  return {
    name,
    primary,
    languages,
    frameworks: [...frameworks].sort(),
    entryHints,
  };
}
