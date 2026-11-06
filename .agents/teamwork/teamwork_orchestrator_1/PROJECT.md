# Project: Kira Autonomous Browser Operator Optimization

## Architecture
- 6-Layer Architecture:
  1. OS/Scheduling (`run-operator.ps1`, `schtasks`)
  2. Dedicated Browser Profile (Chrome port 9223, isolated `--user-data-dir`)
  3. Agent & MCP Orchestration (`opencode run --auto --agent kira`, trimmed `chrome-devtools-mcp`)
  4. In-Browser DOM Helpers (`window.__kira` via `kira-helpers.js`)
  5. Policy Guardrails & Injection Defense (`AGENTS.md`, `kira.md`)
  6. Observability & Notification Hooks (`.agents/hooks.json`)

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | In-page DOM Helper Protocol | `window.__kira` in `kira-helpers.js` replacing DOM snapshots | M1 | Survey R1/Arch |
| 2 | MCP Tool Trimming | Pruning categories (`--no-category-*`) saving ~2k tokens/turn | M1 | Survey R1/Arch |
| 3 | PowerShell Runner Argument Quoting | Vectorizing CLI arguments in `run-operator.ps1` for `@kira` | M1 | Survey R1/Arch |
| 4 | Configuration Merge Tool | `merge-config.mjs` JSONC comment stripping and backup creation | M1 | Survey R1 |
| 5 | Installer & Template Sync | `setup-operator.ps1` and `update.ps1` template propagation | M1 | Survey R1 |
| 6 | Notification Hooks | `.agents/hooks.json` PreToolUse & Stop lifecycle events | M1 | Survey R2 |
| 7 | Zero-Dependency Unit Test Suite | `tests/helpers.test.mjs`, `tests/config-merge.test.mjs`, `tests/agents.test.mjs` | M2 | Survey R2 |
| 8 | Process & Script Syntax Verification | `tests/scripts-syntax.test.mjs`, `tests/hooks.test.mjs` | M2 | Survey R2 |
| 9 | Comprehensive Test Runner | `tests/run-all.mjs` running all test suites via `node:test` | M2 | Survey R2 |
| 10 | Live Verification & Smoke Testing | Verified execution of test suites and setup/merge scripts | M2 | Survey R2 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Layer Integrations & Config Sync | Fix argument bug in `run-operator.ps1`, update `update.ps1`, modernize `merge-config.mjs`, synchronize templates | none | IN_PROGRESS |
| 2 | M2: Automated Verification & Test Coverage | Build zero-dependency `tests/` suite using `node:test`, verify all helper functions, config merge, agent definitions, and hooks | M1 | PLANNED |
| 3 | M3: Quality Review, Challenger & Forensic Audit | Reviewers, Challengers, and Forensic Auditor verification | M1, M2 | PLANNED |

## Code Layout
- `install/templates/run-operator.ps1`: Scheduled task runner
- `install/templates/kira-helpers.js`: In-page DOM helper
- `install/templates/kira.md`: OpenCode agent definition
- `install/templates/AGENTS.kira.md`: Agent guardrails
- `install/merge-config.mjs`: Config merger
- `install/setup-operator.ps1`: Installer
- `update.ps1`: Template updater
- `.agents/hooks.json`: Lifecycle notification hooks
- `tests/`: Automated test suites
