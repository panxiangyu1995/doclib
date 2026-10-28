# DocLib

[![npm version](https://img.shields.io/npm/v/@panxiangyu1995/doclib.svg)](https://www.npmjs.com/package/@panxiangyu1995/doclib)
[![license](https://img.shields.io/npm/l/@panxiangyu1995/doclib.svg)](LICENSE)
[![release](https://github.com/panxiangyu1995/doclib/actions/workflows/release.yml/badge.svg)](https://github.com/panxiangyu1995/doclib/actions/workflows/release.yml)

> [中文](README.md) | **English**

Turn project documentation from *notes that rot the moment they are written* into *executable specifications that evolve with the code* — **any agent or human who reads only this documentation can rebuild the project from scratch elsewhere** (measured feature parity ≥90%).

- **What it is**: a governance system for documentation, development and acceptance. The pure-Markdown "documentation library" lives in your repo and is the project's single source of truth — agents develop against it and accept against it, and when docs and code disagree, the commit gets blocked.
- **What it is not**: not a cloner (it never moves source code), not a git replacement (it only governs "code ↔ docs" sync), not bound to any particular agent product, and **it does not ask you to change your existing development habits**.

## Why I built this

This project was born from my own long-running pain of documentation governance. I maintained one repository for a long time, tried every development spec convention and installed every kind of skill, and still found the governance in chaos: documents everywhere, scattered all over; whether information was stale, and whether it could safely be deleted, nobody could say; and beyond development docs, all kinds of temporary documents produced during development and testing also cost me time and energy to clean up afterwards. I realized that rather than keep being chased by documents, I should design a governance tool to end the chaos — and that is how DocLib started. As I built it, I discovered that far more than documentation fits into this system: development specs, agent memory, a project constitution, test documents… all of it can be governed and applied systematically.

## In this guide

[What it is](#what-it-is) · [What it can do](#what-it-can-do) · [How it compares](#how-it-compares) · [Get started in two steps](#get-started-in-two-steps) · [How it works](#how-it-works) · [Development modes and compatibility](#development-modes-and-compatibility) · [The library structure](#the-library-structure) · [Command reference](#command-reference) · [Skills reference](#skills-reference) · [Current state and evidence](#current-state-and-evidence) · [What's in this repo](#whats-in-this-repo) · [FAQ](#faq) · [Contributing](#contributing) · [Design documents](#design-documents)

## What it is

One analogy: traditional documentation is like **the photos taken on move-in day** — glossy at delivery, then the code keeps changing while the docs stand still, and six months later they are a legend nobody dares trust.

DocLib gives your project **a butler and a gate**:

- **The butler**: the AI agent you already use (Claude Code, opencode, …), once it has DocLib's 11 skills, can read the library, write the library and accept work against it — you develop as usual, and it files "what changed, why, and how it is accepted" into the library as it goes.
- **The gate**: the `doclib` CLI + a git commit hook. Docs and code out of sync? The commit is blocked. The declared test chain (typecheck / tests) red? Blocked all the same. Whether the docs have rotted is decided by a machine, not by self-discipline.

Three terms you will meet again and again:

| Term | In plain words |
| --- | --- |
| The library `doclib/` | A folder in your repo: 12 volumes of Markdown, the project's single source of truth — look here first for anything |
| The bookkeeping `.doclib/` | The CLI's private workspace (baseline snapshots, task books); machine-maintained, you never touch it |
| Agent / skills | The AI that does the work, and the manuals that teach it how; effective the moment they are installed — no prompt-writing needed |

### See it run in one minute

Monday: you change the response shape of the login API and tell the agent "done — file it". The agent writes the new contract into the feature spec and the API ledger.

Wednesday: an agent in another session needs to call that API. It checks the ledger first and gets the fields and status codes directly — no source diving.

Friday: you commit. The pre-commit gate runs `doclib check` plus the test chain declared in the library: docs and code reconcile and the tests are green, the commit goes through; if not, it is blocked and you are told exactly which document drifted.

Docs stop "rotting after they are written" because they are never "finished" — they are the trail the development process itself leaves behind.

## What it can do

Documentation does not rot because you did not write enough — it rots because **nothing governs it**. The six things below happen in almost every project; DocLib answers each with a mechanism and measured evidence:

| You've probably seen this | Left alone, it becomes | With DocLib | Evidence |
| --- | --- | --- | --- |
| A new teammate / new agent joins | Days of source-reading, still no full picture | 12-volume narrative layer + entity ledgers — query the library before the code | The umami library: 141 API ledger entries, 60 route pages |
| The code changed, the docs didn't | Six months later nobody trusts the docs | Three-layer keep-alive + two-ledger reconciliation at the commit gate — rot is caught by a machine | This repo: `doclib check` scores 100/100 (A), zero violations |
| Documents are everywhere | README / docs / specs / chat exports scattered around; nobody dares delete anything | The placement constitution + `place`'s four-state disposition (collect / archive / exempt / restore) | 43-repo sample: 2,052 toolchain false positives, cleared after the fix |
| The same pit is stepped in again next session | Experience evaporates with the chat log | `.plan` dual anchors + lessons filed in real time (enforced by the gate) | This repo's `progress.md` records 30+ development events |
| "It's done" — but nothing proves it | Acceptance is manual clicking; the criteria live in someone's head | One executable acceptance spec per feature (Given/When/Then) | umami's 71 ACs, double-run: 96.4% → 100% on regression |
| A new / half-built project has nowhere to put its spec | The spec lives only in a chat transcript | bootstrap / resume modes + the feature-state ledger | This repo's feature ledger records every item planned → implemented → retired |
| Long-running development runs on agent self-discipline | Tasks get marked done without verification; state drifts silently | Feature state machine + a library-declared test chain baked into the commit gate + a blocking protocol (blocked = no commit, no flip) | Measured in this repo (F19): a failing test chain blocks the commit; faking completion is caught by check's "skeleton-progress" |

**DocLib does not promise to write your docs for you. It promises that your docs will always be usable to build on.**

## How it compares

| Common approach | How it fails | What DocLib does differently |
| --- | --- | --- |
| One-shot README + `docs/` | The code changes daily, the docs are nobody's job, and after six months nobody trusts them | Real-time sync + reconciliation at the commit gate — rot becomes machine-detectable and blockable |
| SDD tooling (spec-kit / OpenSpec / BMAD / Kiro) | The spec freezes once done; the governance problem survives untouched | Coexistence: knowledge is snapshotted into the library; you keep using your tool |
| One-shot AI-generated docs / code graphs | Generated once, dead afterwards, never linked to the code again | The fine-grained keep-alive triangle: entity-level anchors + CLI-emitted candidates (the agent writes and adjudicates) + real-time sync |
| Guide files like CLAUDE.md / AGENTS.md | Written once, maintained never; change the session, the person or the model, and the rules drift | **The library feeds back**: at the end of every build/acceptance, the agent distills "positioning / architecture / development constitution / command cheatsheet" into the guide files, and the last 30 days of working memory plus a collaborator profile live there — a new session starts with zero setup; when the library changes, the gate flags the feed as stale, and your hand-written regions are always preserved |
| Letting an agent read the source directly | It works, but intent and boundary behavior are lost | Not a clone: docs carry behavior, contracts, design intent and acceptance criteria |

## Get started in two steps

### Step 1: install the CLI and the skills

Initialize once at the repo root (`--agents` picks the agents you use, comma-separated; `claude` / `opencode` also get the 11 skills and the guide files):

```bash
npx @panxiangyu1995/doclib init --agents claude,opencode
```

This lands three things: the `doclib/` library skeleton, the `.doclib/` bookkeeping, and the agent's skills and guide files. You can also `npm i -g @panxiangyu1995/doclib` and use `doclib` directly (same command name).

### Step 2: start with a single sentence

After installing there are no commands to learn — just talk to the agent in plain language; it loads the right skill and runs the right commands itself:

| Where you stand | What you say to the agent | What the agent does |
| --- | --- | --- |
| An existing project that needs living docs | "Use doclib to build this project's documentation library" | `doclib plan` generates a BUILD task book → loads `doclib-build`, fills the library in three passes → `verify` → `snapshot` |
| A brand-new project: spec first, code second | "I'm building X — use doclib to mine the requirements into a spec first" | `doclib plan --bootstrap` → loads `doclib-bootstrap`, mines the requirements into the library with you; develop against it from then on |
| A half-built project to take over | "Take over this repo; use doclib to sort out what's done and what isn't" | `doclib plan --resume` → loads `doclib-resume`, distills what exists + registers the plan → switches to `doclib-dev` |
| Everyday development: keep docs in step with code | "Continue development against the library" | `doclib status` / `diff` → loads `doclib-dev`, files to the library in real time while developing |
| You only want the "rebuild from docs" capability | "Read only doclib/, rebuild this project from scratch in ../myproj-rebuild" | `doclib plan --rebuild` → loads `doclib-rebuild`; access to the original repo is forbidden; it develops from zero in an empty directory |

## How it works

### The whole thing in one picture

```
┌──────────────────────────────────────────────────────────────┐
│  Your repo                                                   │
│                                                              │
│    source code ─────┐                                        │
│    doclib/ ◀────────┤ Library: narratives + entity ledgers   │
│    .doclib/ ◀───────┤ Ledger: snapshots + task books         │
│    CLAUDE.md ◀──────┤ Guides: how agents use all this        │
│    .claude/         │ Agent adapters: 11 skills land here    │
└─────────────────────┼────────────────────────────────────────┘
                      │  hash / diff / mapping / reconciliation
               ┌──────┴──────┐
               │  doclib CLI │  Machine side: state and facts
               └──────┬──────┘
                      │  task books (BUILD / UPDATE / REBUILD / BOOTSTRAP / RESUME)
               ┌──────┴──────┐
               │ agent+skills │  Knowledge side: analyze, write, accept
               └──────────────┘
```

### Three rules

1. **Not a clone** — the library describes "how this system works, what it promises, and how it is accepted", not a copy of the code (illustrative snippets of ≤10 lines).
2. **Library before code** — want to know what an API looks like? Ask the library's ledger first — straight to the answer; if it is not there, read the code, then file what you learned back. Every query sharpens the library.
3. **The library moves with the code** — Real-time layer (file it as you go) + workflow layer (dual anchors) + backstop layer (`diff` → `check`). The library is an **input** to development, not an artifact you back-fill afterwards.

### Why two layers

| Layer | What it answers | Shape |
| --- | --- | --- |
| Narrative layer (12 volumes) | Why it is designed this way, and how it works | Behavior, contracts, design intent, acceptance criteria |
| Entity layer (ledger family) | What a given entity actually looks like | Per-entry five elements: identifier / entity-level `covers` / contract details / state machine / timeline |
| Archive volume (`99-archive/`) | How it used to work, and why it was replaced | Tombstone notes (when it went stale / why / what replaced it) — nothing is physically deleted by default |

When the two layers disagree, **the ledger wins** — it is the single point of truth for facts, and the narrative layer cites it.

Each document also follows a genre standard: narrative documents use the five textbook sections (reading guide → why → what → how it works → how it is accepted), ledgers use the five entry elements — and `check`'s readability gates look for missing structure, card-ification and note pollution. Readability for humans and precision for agents are both first-class quality dimensions.

### The day-to-day loop

| Layer | When it fires | Who does it |
| --- | --- | --- |
| Real-time (primary) | Whenever a change touches the knowledge of any volume | The agent files it immediately — the guide file's real-time sync rules bind it |
| Workflow | After a planning document is finished / after the work it describes is finished | Dual anchors: register `planned` → archive the outcome and advance to `implemented` |
| Backstop | Anything that slipped through | `diff` → `plan` → UPDATE task book → `check` strong validation |

The governance trio: `doclib check` (two-ledger reconciliation + governance health score, `--strict` can act as a gate) · `doclib place` (orphan placement; write operations dry-run by default, `--apply` executes them) · `doclib hook` (pre-commit gate / CI template).

There is exactly one source of truth for feature state: `doclib/00-overview/feature-map.md` (`planned` / `in-progress` / `implemented` / `retired`). `progress.md` is a timeline view and never defines a separate state.

## Development modes and compatibility

### Four ways to start

No commands to memorize — say one sentence to the agent (see [Get started in two steps](#get-started-in-two-steps)) and it picks the right task book:

- **An existing project** (BUILD): three passes over the codebase distill the status quo into the library — skeleton first, then data, then behavior — with coverage verified automatically at the end.
- **A brand-new project** (BOOTSTRAP): dialogue first mines the requirements into a spec (with per-feature acceptance criteria); the first line of code is written only after the spec settles.
- **A half-built project** (RESUME): what exists is distilled into the ledger, what is planned is registered as `planned`; from then on you develop against the library.
- **Just the rebuild capability** (REBUILD): a different directory, a different agent (`doclib plan --rebuild --to ../target-dir`), reading only `doclib/` — access to the original repo is forbidden — rebuilt from zero. This is the ultimate proof that the docs are alive (every rebuild stage closes with the library's test chain and stops when blocked — the same loop as everyday long-running development, doclib-dev mode B).

### Already using a spec tool? Keep it

DocLib does not take over your workflow — it harvests the knowledge:

| Where you are | How DocLib fits in |
| --- | --- |
| Plans made with BMAD / spec-kit / OpenSpec / Kiro | Snapshot adoption: planning knowledge is mapped into the library automatically (with provenance and hash reconciliation); `planned` entries are extracted automatically and take effect after your confirmation; your tool stays exactly as it is |
| An old repo with just a README + `docs/` | init establishes a baseline immediately; stray documents outside the library are collected or explicitly exempted by `place` — order from day one |
| Any agent product | The guide files + the pure-Markdown library bind to no product; skill landing currently supports `claude` / `opencode`, and any other agent can work from the guide files alone |
| Multi-lingual facades like README.en.md | Natively exempt — no per-file registration (BCP-47 locale-tag pattern recognition) |

> Basis: PRD v0.40 (F17 planning express); the four-tool semantic mapping table lives in `doclib/40-guides/010-tool-adoption.md`.

## The library structure

```
doclib/
├── README.md               # Entry point: how to read, rules of maintenance
├── INDEX.md                # Master index: every document + a one-line summary
├── 00-overview/            # Positioning, glossary, feature ledger (state of record), progress timeline
├── 10-architecture/        # Architecture overview, data model, data flow, dependency choices, ADRs, migration ledger
├── 20-modules/             # One volume per module: responsibility, boundary, contract
├── 30-features/            # One behavior spec + executable acceptance criteria per feature
├── 40-guides/              # Rebuild roadmap, coding conventions, development workflow
├── 50-testing/             # Test strategy, test matrix, test setup, how to run
├── 60-config/              # All engineering settings: lint/format, build, CI/CD, environment variables
├── 70-deploy/              # Deployment: environment matrix, release process, ops and rollback
├── 80-design/              # UI/UX: design system, interaction details, asset inventory
├── 90-reference/           # API / interface / protocol reference
├── 95-lessons/             # Lessons learned: bugs and their fixes, pitfalls
└── 99-archive/             # Archive: stale content is demoted, not deleted (tombstones record when / why / what replaced it)
```

- **Volumes are extensible** (numbers continue in sequence). A volume that does not apply must say so explicitly — silent omission is not allowed.
- **Ledgers** are organized as *one book per asset type*, each hung on the semantically closest volume: `api` / `error-codes` / `events-def` / `integrations` → `90-reference`; `ui-assets` / `routes` → `80-design`; `config` / `flags` → `60-config`; `tasks` → `70-deploy`; `events` → `00-overview`.
- **The placement constitution**: inside the library is the default, outside is the exception, and exceptions must be explicit (toolchain allowlist or an `ack` registration).
- Every document's frontmatter `covers` points at the code paths it describes — that is the anchor for incremental updates.

### What does a page actually look like?

Not a wall of notes — standards you can execute. Here is a real excerpt from this repo's own library (`doclib/30-features/check.md`, the acceptance-criteria section; quoted and translated):

> - Given code changed but the docs didn't, When `check`, Then it reports the unaccounted drift and lists the affected documents; `--strict` exits 1
> - Given code and its covered documents changed together, When `check`, Then the reconciled counter increments and there are no violations
> - Given stray .md files outside the library, When `check`, Then they are detected as orphans; after a standing ack they become exempt

Each line is an executable assertion — "is it done?" is decided by a machine, not by anyone's word.

## Command reference

This section is for lookup. Day to day you just talk to your agent — the agent runs the commands.

| Group | Command | Responsibility | When to use it |
| --- | --- | --- | --- |
| Library | `init` | Initialize the `doclib/` skeleton, the `.doclib/` ledger, the skills and the guide files (installs the commit gate automatically) | Onboarding a new repo |
| Library | `plan` | Generate a task book: BUILD / UPDATE / REBUILD / BOOTSTRAP / RESUME | Before starting any piece of work |
| Library | `implement` | Splitter: planned candidates → readiness gate → `.plan` implementation skeleton (AC anchors pre-filled; dry-run by default, `--apply` to write) | Before starting a planned feature |
| Library | `verify` | Coverage report: uncovered paths / stale documents / INDEX integrity | After building, and after every incremental update |
| Library | `snapshot` | Record the current code state as the new baseline (library version +1, revision +1) | Once a sync is done |
| Keep-alive | `diff` | Current code vs baseline: drift list + affected documents | Any time during development |
| Keep-alive | `status` | Version / baseline / drift / governance score / guide budget / open items | Start of every session |
| Governance | `check` | Strong validation: two-ledger reconciliation (unaccounted drift / uncovered / migration violations / stale guides / orphan docs) + governance score | Before you commit |
| Governance | `ack` | Register a path exemption (`once` / `standing` / `--dir` for a directory prefix) | When a false positive appears |
| Governance | `place` | Place orphan documents: `list` / `collect` / `archive` / `ack` / `restore` (write operations dry-run by default) | When documents live outside the library |
| Governance | `hook` | Install / remove the pre-commit hook (the library's `test-chain` declaration is baked in automatically; `--ci github` emits a CI template including the full tier) | When wiring up CI / after declaring a test chain |
| Governance | `reconcile` | Reconcile and rebuild the progress ledger: probably done / mismatch / to advance | When the progress ledger and the code disagree |
| Governance | `branch` | Branch ledger: `list` (ledger vs git) / `register` (register a branch library) / `diff` (merge audit) | Creating a branch / before merging back to main |
| Enhancement | `sync` | Regenerate the managed region of the guide files and the skills (idempotent, custom regions preserved) | After upgrading the CLI |
| Enhancement | `graph` | Code knowledge graph: `index` / `status` / `draft` / `explore <query>` (optional enhancement, requires Node ≥ 22.5) | Accelerating large repos |

Options that change behavior: `--agents` (agent targets for init), `--planning` (planning carrier paths for init), `--json` (machine-readable output), `--strict` (gate for check / hook), `--apply` (make `place` actually write / write the `implement` skeleton), `--feature` (feature number for `implement`), `--to` (rebuild target directory / target volume for place). See `doclib --help` for the full list.

> `graph` is an optional enhancement: it needs Node ≥ 22.5, degrades gracefully when unavailable, and **blocks no core flow**. Graph output is candidate-only and must be verified by the agent before it enters the library.

## Skills reference

Skills are loaded by the agent by name, and each one is bound to a single trigger:

| Skill | When to load it | Related command |
| --- | --- | --- |
| `doclib-build` | Distill an existing project into a library | `plan` (BUILD task book) |
| `doclib-update` | Incremental update after code changes | `plan` (UPDATE task book) |
| `doclib-rebuild` | Rebuild from scratch using only the library | `plan --rebuild` |
| `doclib-dev` ★ | Development sessions in two modes: A everyday development; B the long-horizon six-step loop (pick a task → work against the skeleton → test chain → AC acceptance → one commit per task) | `status` / `diff` / `snapshot` / `implement` |
| `doclib-bootstrap` | Build the library of a new project through dialogue | `plan --bootstrap` |
| `doclib-implement` | Turn a planned feature into an actionable work order (fill AC anchors) | After `doclib implement` generates a skeleton |
| `doclib-resume` | Take over a half-built project | `plan --resume` |
| `doclib-setup` | Confirm installation and adaptation after init | `init` / `sync` |
| `doclib-reconcile` | Reconcile the progress ledger against the code | `reconcile` |
| `doclib-audit` | Periodic quality audit | `verify` |
| `doclib-accept` | Run acceptance criteria one by one and record the results | When a feature ships / during rebuild acceptance |

## Current state and evidence

| Item | Value | Source |
| --- | --- | --- |
| npm package / version | `@panxiangyu1995/doclib` / 0.10.0 (npm latest 0.8.0, release rides the next window) | `package.json` |
| License / Node | MIT / `>=22.5 <25` | `package.json` |
| Runtime dependencies | 4: `ignore` / `jsonc-parser` / `picomatch` / `web-tree-sitter` | `dependencies` in `package.json` |
| CLI commands / Skills | 15 / 11 | `src/commands/` · `skills/` |
| Library skeleton | 12 volumes + ledger family (first 5 books) + `99-archive` + `98-sessions`, 33 skeleton files in total | `assets/templates/library/` |
| Tests | 39 test files / 394 cases | the test script in `package.json` |
| Source size | 5,998 lines of non-test code / 5,760 lines of tests | `src/` |
| This repo's own governance | 100/100 (A), zero violations | `doclib check` |
| Rebuild benchmark | umami: 97% coverage at build time → 96.4% on the same-question double run (53/55) → 100% on regression | `doclib/50-testing/benchmark/` |
| Benchmark scale | Rebuilt output: 124 routes / 26 models / 67k lines | `doclib/40-guides/benchmark.md` |
| Governance measurements | 43-repo sample: 2,052 toolchain false positives (≈48 per repo, up to 171 in AI-tooling repos) → cleared after the fix | `doclib/10-architecture/decisions.md` ADR #12 |
| Graph measurements | 5 real repos; memos: 1,167 files / 22,637 symbols / 66,909 edges / 89 routes / 2.7s | `doclib/50-testing/acceptance-graph-v0.5.0.md` |

> These numbers change with each release; contributors must verify them one by one before releasing (see [CONTRIBUTING.md](CONTRIBUTING.md)).

## What's in this repo

Opening the repo for the first time? Here is the map:

| Directory | What it is | Who reads it |
| --- | --- | --- |
| `src/` | The doclib CLI source (TypeScript, 14 commands) | People changing the tool |
| `doclib/` | **This project's own documentation library** (12 volumes + ledgers + archive) — DocLib manages itself with DocLib; the library is the living proof | Everyone — really, go browse |
| `skills/` | Source of the 11 agent skills | People changing agent behavior |
| `assets/` | Library skeleton templates and the regeneration source of the guide files | People customizing the skeleton |
| `vendor/codegraph/` | Vendored knowledge-graph engine (git subtree, MIT) | Graph enhancement |
| `test/` | Rebuild benchmark repos (clones of umami / fd / csvkit / memos / aspnetcore …) | Rebuild & benchmark experiments |
| `video/` | Promo-video project sources (HyperFrames) | The curious |
| `scripts/` | Build helper scripts | Build / release |
| `.doclib/` | The CLI's private bookkeeping (baseline snapshots, task books, guide-feed source) | Maintained by machines; hands off |
| `.plan/` | The planning carrier of every development task (one of the dual anchors) | Process archive |
| `.claude/` `.opencode/` | Distributed skill copies and commands (generated by `doclib sync`) | Read by agents |

## FAQ

**Do I need to know how to write docs first?**
No. The library is mostly distilled by the agent; your job is to say "right or wrong". The more you write, the sharper the library — but zero-start works.

**Does it conflict with my git workflow?**
No. DocLib only adds two directories and one commit hook to your repo; it does not touch branches, does not rewrite history, needs no server — everything runs locally.

**Do the docs rot when the agent is away?**
The gate stays. `check` is a pure-local CLI that runs without any agent — if docs drift, it reports immediately; nobody's self-discipline required.

**I use a different spec tool / a different agent?**
See [Development modes and compatibility](#development-modes-and-compatibility): spec tools are adopted by snapshot without migration; an agent only needs to read Markdown.

**How big can a project be?**
Measured from single-CLI tools to a 220k-line full-stack application (the benchmark set covers fd / csvkit / memos / umami / aspnetcore-realworld).

**Is it safe to let AI write all the docs?**
AI writes, machines verify: every ledger entry carries a code anchor (`covers`), `check` reconciles line by line, and acceptance criteria are executable one by one — AI improvisation does not get into the library.

## Contributing

All three kinds of contribution are welcome: **report a bug or request a feature** (GitHub Issues) · **improve the documentation** (edit the matching volume under `doclib/`; new documents go through the placement decision tree first) · **contribute code** (see [CONTRIBUTING.md](CONTRIBUTING.md)).

Three rules you must follow:

1. New test files must be added to the **explicit test list** in `package.json` (Node 24's `node --test <dir>` fails — see ADR #5).
2. Any edit inside `vendor/codegraph/` must be registered in `FORK-NOTES.md` (otherwise a future `git subtree pull` cannot be audited).
3. If a change touches the knowledge of any volume, it must be **filed into the library in the same session** — this repo manages itself with DocLib.

## Design documents

- [PRD: the single source of truth for requirements](doclib/10-architecture/prd.md) · [Architecture design](doclib/10-architecture/design.md)
- [Master index](doclib/INDEX.md) · [Glossary](doclib/00-overview/glossary.md) · [Feature ledger](doclib/00-overview/feature-map.md)
- [Rebuild benchmark methodology](doclib/40-guides/benchmark.md)

## License

[MIT](LICENSE)
