# DocLib

[![npm version](https://img.shields.io/npm/v/@panxiangyu1995/doclib.svg)](https://www.npmjs.com/package/@panxiangyu1995/doclib)
[![license](https://img.shields.io/npm/l/@panxiangyu1995/doclib.svg)](LICENSE)
[![release](https://github.com/panxiangyu1995/doclib/actions/workflows/release.yml/badge.svg)](https://github.com/panxiangyu1995/doclib/actions/workflows/release.yml)

> [中文](README.md) | **English**

Turn project documentation from *notes that rot the moment they are written* into *executable specifications that evolve with the code* — **any agent or human who reads only this documentation can rebuild the project from scratch elsewhere** (≥90% feature parity).

- **What it is**: a systematic specification-and-acceptance system for projects. The pure-Markdown "documentation library" is the project's single source of truth — agents develop against it and accept work against it.
- **What it is not**: not a cloner (it never moves source code), not a replacement for git (it only governs "code ↔ docs" sync), not bound to any particular agent product.

## In this guide

[30-second start](#30-second-start) · [Why you need it](#why-you-need-it) · [Why the usual approaches fall short](#why-the-usual-approaches-fall-short) · [How it works](#how-it-works) · [Quick start](#quick-start) · [The day-to-day loop](#the-day-to-day-loop) · [Library structure](#library-structure) · [Command reference](#command-reference) · [Skills reference](#skills-reference) · [Current state and evidence](#current-state-and-evidence) · [Contributing](#contributing) · [Design documents](#design-documents)

## 30-second start

Initialize once in your project (`--agents` picks the agents you use; `claude` / `opencode` also install the 10 skills and the guide files):

```bash
npx @panxiangyu1995/doclib init --agents claude,opencode
```

| Where you stand | First command | Then what |
| --- | --- | --- |
| An existing project that needs living docs | `doclib plan` | The agent loads `doclib-build` and builds the library → `doclib verify` → `doclib snapshot` |
| A brand-new project: spec first, code second | `doclib plan --bootstrap` | The agent loads `doclib-bootstrap` and mines the requirements with you into a real library → develop against it |
| A half-built project to take over | `doclib plan --resume` | The agent loads `doclib-resume` (distill what exists + register the plan) → switch to `doclib-dev` |
| Everyday development: keep docs in step with code | `doclib status` | `doclib diff` → `doclib plan` → the agent loads `doclib-update` → `verify` + `snapshot` |
| You only want the "rebuild from docs" capability | `doclib plan --rebuild --to ../myproj-rebuild` | The agent loads `doclib-rebuild`, reads only `doclib/`, and develops from scratch in an empty directory |

You can also `npm i -g @panxiangyu1995/doclib` and use `doclib` directly (same command name).

## Why you need it

Documentation does not rot because you did not write enough — it rots because **nothing governs it**. The six failure modes below recur in real projects; each one has a matching mechanism and a piece of evidence:

| Scenario | What goes wrong | DocLib's mechanism | Evidence |
| --- | --- | --- | --- |
| A new hire / a new agent gets oriented | Reconstructing the big picture from source takes days and still leaves gaps | A 12-volume narrative layer plus entity ledgers — query the library before the code | The umami library: 141 API ledger entries, 60 route pages |
| Docs rot as the code moves | The code changed, the docs did not, and after six months nobody trusts them | Three-layer keep-alive plus mandatory two-ledger reconciliation in `check` | This repo: `doclib check` scores 100/100 (A) with zero violations |
| Doc assets are disordered | READMEs, `docs/`, specs and chat exports are scattered everywhere, and nobody owns migration numbering | The placement constitution plus a four-state disposition loop in `place` | 43-repo sample: 2,052 toolchain false positives, cleared after the fix |
| Process knowledge evaporates when the task ends | Plans, pitfalls and the reasoning behind decisions die with the chat log | `.plan` dual anchors plus real-time filing into `95-lessons` | This repo's `progress.md` records 30+ development events |
| "It's done" — but nothing proves it | Acceptance is manual clicking, with no executable criteria | One Given/When/Then spec per feature in `30-features` | umami's 71 acceptance criteria ran on both sides: 96.4% → 100% on regression |
| Greenfield and half-built projects have no vessel | The spec exists only in a chat transcript | bootstrap / resume modes plus the feature map as the state of record | This repo's feature ledger tracks every item planned → implemented → retired |

**DocLib does not promise to write your docs for you. It promises that your docs will always be usable to build on.**

## Why the usual approaches fall short

| Common approach | How it fails | What DocLib does differently |
| --- | --- | --- |
| One-shot README + `docs/` | Docs rot as the code evolves, and nobody maintains them | Real-time sync plus two-ledger reconciliation in `check` — rot becomes machine-detectable |
| SDD tooling (spec-kit / OpenSpec) | The spec freezes once it is done; the governance problem survives | Carrier-compatible: DocLib harvests knowledge without taking over your workflow, and it flows back through the dual anchors |
| One-shot AI-generated docs or code graphs | Generated once, dead afterwards, never linked to the code again | The fine-grained keep-alive triangle: entity-level `covers` + CLI-emitted candidates (the agent writes and adjudicates) + real-time sync |
| Letting an agent read the source directly | It works, but intent and boundary behavior are lost | Not a clone: docs carry behavior, contracts, design intent and acceptance criteria |

> Sources: PRD v0.17 (specs freeze once done), v0.18 (the fine-grained keep-alive triangle), v0.30 (graph output is candidate-only and must never be filed verbatim).

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
│    .claude/         │ Agent adapters: 10 skills land here    │
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

1. **Not a clone** — Documentation carries behavior, contracts, design intent and acceptance criteria, not bytes (no source is copied, except illustrative snippets of ≤10 lines).
2. **Library before code** — The library is the single source of truth. Entity questions (what fields does this API return, where is that icon used?) go straight to the ledger instead of a desperate grep; whatever you learn from the code gets filed back, so **every query sharpens the library**.
3. **The library moves with the code** — Real-time layer (file it as you go) + workflow layer (dual anchors) + backstop layer (`diff` → `plan` → `check`). The library is an **input** to development, not an artifact you back-fill afterwards.

### Why two layers

| Layer | What it answers | Shape |
| --- | --- | --- |
| Narrative layer (12 volumes) | Why it is designed this way, and how it works | Behavior, contracts, design intent, acceptance criteria |
| Entity layer (ledger family) | What a given entity actually looks like | Per-entry five elements: identifier / entity-level `covers` / contract details / state machine / timeline |
| Archive volume (`99-archive/`) | How it used to work, and why it was replaced | Tombstone notes (when it went stale / why / what replaced it) — nothing is physically deleted by default |

When the two layers disagree, **the ledger wins** — it is the single point of truth for facts, and the narrative layer cites it.

Each document also follows a genre standard: narrative documents use the five textbook sections (reading guide → why → what → how it works → how it is accepted), ledgers use the five entry elements — and `check`'s readability gates look for missing structure, card-ification and note pollution. Readability for humans and precision for agents are both first-class quality dimensions.

## Quick start

### Take over an existing project

```bash
npx @panxiangyu1995/doclib init --agents claude,opencode
doclib plan                  # Generate the BUILD-001.md task book (with an auto-collected project inventory)
doclib verify                # Coverage report
doclib snapshot --note "initial build"
```

Then let the agent load `doclib-build` and fill the library in three passes over the codebase (skeleton → data → behavior), following `.doclib/tasks/BUILD-001.md`.

### Start a brand-new project

```bash
npx @panxiangyu1995/doclib init --agents claude,opencode
doclib plan --bootstrap
```

The agent loads `doclib-bootstrap`, mines the requirements with you in dialogue, and fills the library directly; from then on you develop against the library and ship against the acceptance criteria in `30-features`.

### Take over a half-built project

```bash
npx @panxiangyu1995/doclib init --agents claude,opencode
doclib plan --resume
```

The agent loads `doclib-resume`: the existing code is distilled as `implemented`, future features are organized as `planned`; from then on the `doclib-dev` loop takes over.

### Just want the rebuild capability

```bash
doclib plan --rebuild --to ../myproj-rebuild
```

The agent loads `doclib-rebuild`, reads **only `doclib/`** (access to the original repository is forbidden), and develops from scratch in the target directory; the rebuilt project ships with a copy of the library, and details proven in practice are written back into that copy.

## The day-to-day loop

| Layer | When it fires | Who does it |
| --- | --- | --- |
| Real-time (primary) | Whenever a change touches the knowledge of any volume | The agent files it immediately — the guide file's real-time sync rules bind it |
| Workflow | After a planning document is finished / after the work it describes is finished | Dual anchors: register `planned` → archive the outcome and advance to `implemented` |
| Backstop | Anything that slipped through | `diff` → `plan` → UPDATE task book → `check` strong validation |

The governance trio: `doclib check` (two-ledger reconciliation + governance health score, `--strict` can act as a gate) · `doclib place` (orphan placement; write operations dry-run by default, `--apply` executes them) · `doclib hook` (pre-commit gate / CI template).

There is exactly one source of truth for feature state: `doclib/00-overview/feature-map.md` (`planned` / `in-progress` / `implemented` / `retired`). `progress.md` is a timeline view and never defines a separate state.

## Library structure

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

## Command reference

| Group | Command | Responsibility | When to use it |
| --- | --- | --- | --- |
| Library | `init` | Initialize the `doclib/` skeleton, the `.doclib/` ledger, the skills and the guide files | Onboarding a new repo |
| Library | `plan` | Generate a task book: BUILD / UPDATE / REBUILD / BOOTSTRAP / RESUME | Before starting any piece of work |
| Library | `verify` | Coverage report: uncovered paths / stale documents / INDEX integrity | After building, and after every incremental update |
| Library | `snapshot` | Record the current code state as the new baseline (library version +1, revision +1) | Once a sync is done |
| Keep-alive | `diff` | Current code vs baseline: drift list + affected documents | Any time during development |
| Keep-alive | `status` | Version / baseline / drift / governance score / guide budget / open items | Start of every session |
| Governance | `check` | Strong validation: two-ledger reconciliation (unaccounted drift / uncovered / migration violations / stale guides / orphan docs) + governance score | Before you commit |
| Governance | `ack` | Register a path exemption (`once` / `standing` / `--dir` for a directory prefix) | When a false positive appears |
| Governance | `place` | Place orphan documents: `list` / `collect` / `archive` / `ack` / `restore` (write operations dry-run by default) | When documents live outside the library |
| Governance | `hook` | Install / remove the pre-commit hook (`--ci github` emits a CI template) | When wiring up CI |
| Governance | `reconcile` | Reconcile and rebuild the progress ledger: probably done / mismatch / to advance | When the progress ledger and the code disagree |
| Enhancement | `sync` | Regenerate the managed region of the guide files and the skills (idempotent, custom regions preserved) | After upgrading the CLI |
| Enhancement | `graph` | Code knowledge graph: `index` / `status` / `draft` / `explore <query>` (optional enhancement, requires Node ≥ 22.5) | Accelerating large repos |

Options that change behavior: `--agents` (agent targets for init), `--planning` (planning carrier paths for init), `--json` (machine-readable output), `--strict` (gate for check / hook), `--apply` (make `place` actually write), `--to` (rebuild target directory / target volume for place). See `doclib --help` for the full list.

> `graph` is an optional enhancement: it needs Node ≥ 22.5, degrades gracefully when unavailable, and **blocks no core flow**. Graph output is candidate-only and must be verified by the agent before it enters the library.

## Skills reference

Skills are loaded by the agent by name, and each one is bound to a single trigger:

| Skill | When to load it | Related command |
| --- | --- | --- |
| `doclib-build` | Distill an existing project into a library | `plan` (BUILD task book) |
| `doclib-update` | Incremental update after code changes | `plan` (UPDATE task book) |
| `doclib-rebuild` | Rebuild from scratch using only the library | `plan --rebuild` |
| `doclib-dev` ★ | Any day-to-day development session | `status` / `diff` / `snapshot` |
| `doclib-bootstrap` | Build the library of a new project through dialogue | `plan --bootstrap` |
| `doclib-resume` | Take over a half-built project | `plan --resume` |
| `doclib-setup` | Confirm installation and adaptation after init | `init` / `sync` |
| `doclib-reconcile` | Reconcile the progress ledger against the code | `reconcile` |
| `doclib-audit` | Periodic quality audit | `verify` |
| `doclib-accept` | Run acceptance criteria one by one and record the results | When a feature ships / during rebuild acceptance |

## Current state and evidence

| Item | Value | Source |
| --- | --- | --- |
| npm package / version | `@panxiangyu1995/doclib` / 0.5.0 | `package.json` |
| License / Node | MIT / `>=22.5 <25` | `package.json` |
| CLI commands / Skills | 13 / 10 | `src/commands/` · `skills/` |
| Library skeleton | 12 volumes + ledger family (first 5 books) + `99-archive`, 32 skeleton files in total | `assets/templates/library/` |
| Tests | 32 test files / 252 cases | the test script in `package.json` |
| Source size | 4,691 lines of non-test code / 3,924 lines of tests | `src/` |
| This repo's own governance | 100/100 (A), zero violations | `doclib check` |
| Rebuild benchmark | umami: 97% coverage at build time → 96.4% on the same-question double run (53/55) → 100% on regression | `doclib/50-testing/benchmark/` |
| Benchmark scale | Rebuilt output: 124 routes / 26 models / 67k lines | `doclib/40-guides/benchmark.md` |
| Governance measurements | 43-repo sample: 2,052 toolchain false positives (≈48 per repo, up to 171 in AI-tooling repos) → cleared after the fix | `doclib/10-architecture/decisions.md` ADR #12 |
| Graph measurements | 5 real repos; memos: 1,167 files / 22,637 symbols / 66,909 edges / 89 routes / 2.7s | `doclib/50-testing/acceptance-graph-v0.5.0.md` |

> These numbers change with each release; contributors must verify them one by one before releasing (see [CONTRIBUTING.md](CONTRIBUTING.md)).

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
