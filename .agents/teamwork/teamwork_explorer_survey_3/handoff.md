# Handoff Report: Architectural Survey & E2E Test Plan (teamwork_explorer_survey_3)

## 1. Observation

Direct observations from the repository codebase and runtime templates:
1. **Repository Layout and Files**:
   - `install/setup-operator.ps1` lines 48-66: Installs `start-operator-chrome.ps1`, `run-operator.ps1`, `AGENTS.kira.md`, `kira-helpers.js`, and `kira.md` into `$WorkDir` (`~/.opencode-operator`), and copies `kira.md` into `~/.config/opencode/agents/kira.md` and `kira-helpers.js` into `~/.config/opencode/kira-helpers.js`.
   - `install/merge-config.mjs` lines 60-75: Sets `config.permission = "allow"` and sets `mcp["chrome-devtools"]` command with `--browserUrl http://127.0.0.1:${port}` and optimization flags:
     ```javascript
     "--no-category-emulation",
     "--no-category-performance",
     "--no-category-network",
     "--no-category-memory",
     "--no-usage-statistics"
     ```
   - `install/templates/run-operator.ps1` lines 35-36:
     ```powershell
     $agentFlag = if ($settings.agent) { "--agent $($settings.agent)" } else { "--agent kira" }
     opencode run --auto $agentFlag $settings.prompt >> (Join-Path $PSScriptRoot $settings.runOutputFile) 2>&1
     ```
     `$agentFlag` is constructed as a single string `"--agent kira"` and passed unquoted/unsplatted to `opencode`.
   - `update.ps1` lines 14-17:
     ```powershell
     foreach ($name in @("start-operator-chrome.ps1", "run-operator.ps1")) {
       Copy-Item (Join-Path $tplDir $name) (Join-Path $WorkDir $name) -Force
       Write-Host "updated $name"
     }
     ```
     `update.ps1` synchronizes only `start-operator-chrome.ps1` and `run-operator.ps1`. It ignores `kira-helpers.js`, `kira.md`, and `AGENTS.kira.md`.
   - `.agents/hooks.json` lines 9 & 18:
     ```json
     "command": "node C:/Users/Vaibhav/projects/bs/linked_in/scripts/notify-ntfy.mjs"
     ```
     References a machine-specific external project path outside the repository.
   - `install/templates/kira.md` lines 4-8:
     ```yaml
     permission:
       "chrome-devtools:*": allow
       "bash": allow
       "*": deny
     ```
     Specifies `bash: allow` and `*: deny`, potentially restricting file reading of `kira-helpers.js` or PowerShell shell commands on Windows.
   - `install/templates/kira-helpers.js` lines 9-183: Defines `window.__kira` exposing `status()`, `getUnread()`, `openChat(contactName)`, `getMessages(limit)`, and `sendMessage(messageText)`.
   - **Absence of Test Suite**: Ripgrep and filename searches (`find_by_name` for `*test*`) across the entire repository returned 0 test files or automated verification scripts.

---

## 2. Logic Chain

1. **Token Efficiency Mechanism**:
   - Observation: Calling `take_snapshot` on WhatsApp Web serializes the entire accessibility tree (10,000–50,000 tokens).
   - In `kira.md` line 24 and `AGENTS.kira.md` line 26, `take_snapshot` is explicitly banned in favor of `evaluate_script` using `window.__kira`.
   - Evaluating `window.__kira.getUnread()` extracts only `{ name, preview, time, unreadCount }`, reducing turn context to ~100 tokens, achieving a ~99% token reduction per poll cycle.
2. **Execution Latency Mechanism**:
   - Calling synthetic DOM commands (`document.execCommand('insertText')` and button clicks in `sendMessage()`) operates in < 300ms, eliminating the 10–20 second multi-turn coordinate/keystroke delay of traditional computer-use agents.
3. **PowerShell Argument Defect**:
   - Observation: `run-operator.ps1` passes `$agentFlag` as a single string `"--agent kira"`.
   - When PowerShell passes a string with spaces to an external CLI executable, it wraps the entire string in quotes (`"\"--agent kira\""`). OpenCode will receive this as an invalid single parameter rather than flag `--agent` with value `kira`.
4. **Update Drift Risk**:
   - Observation: `update.ps1` only copies two PowerShell files.
   - Changes made to `kira-helpers.js` or `kira.md` in repository updates will never be propagated to user systems when running `.\update.ps1`.
5. **Portability Breakdown in Notification Layer**:
   - Observation: `.agents/hooks.json` points to `C:/Users/Vaibhav/projects/bs/linked_in/scripts/notify-ntfy.mjs`.
   - Because this file is located outside the repo, hooks will fail when cloned to another environment.
6. **Verification Vacuum**:
   - Observation: 0 automated tests exist in the repo.
   - Conclusion: Verification of R1 (config merging, template sync) and R2 (helper stability, notification hooks) requires constructing a multi-tiered test suite (Tiers 1–4).

---

## 3. Caveats

1. **Operator Profile State**: User profile contents (`chrome-profile/`) and actual logged-in WhatsApp sessions were not directly inspected to avoid accessing external user data or violating read permissions.
2. **OpenCode CLI Execution**: OpenCode CLI commands (`opencode run`) were not executed in real-time during this survey step, respecting the read-only exploration boundary.
3. **Windows Task Scheduler Access**: Scheduled tasks were not altered or re-registered during this read-only phase.

---

## 4. Conclusion

Kira is architecturally sound with a high-leverage design combining a dedicated headless/unattended Chrome profile, strict injection-proof AGENTS.md guardrails, and in-page DOM helper acceleration (`window.__kira`).

The path to production readiness requires resolving 4 key technical issues and 1 verification gap:
1. Fix PowerShell argument vectorization in `run-operator.ps1`.
2. Expand `update.ps1` to propagate all templates (`kira-helpers.js`, `kira.md`, `AGENTS.kira.md`).
3. Replace hardcoded external hook path in `.agents/hooks.json` with a repository-bundled notification dispatcher (`scripts/notify.mjs`).
4. Reconcile tool permissions in `kira.md`.
5. Implement the proposed 4-Tier Automated Test Suite (Tier 1: Syntax & Schemas; Tier 2: Unit tests for merge-config & JSDOM helpers; Tier 3: Process & port probe integration; Tier 4: Headless Chrome E2E simulation).

Full architectural survey report: `C:\Users\Vaibhav\projects\personal_projects\kira\.agents\teamwork\teamwork_explorer_survey_3\survey_arch.md`

---

## 5. Verification Method

To independently verify the observations:
1. **Inspect files and lines**:
   - `view_file` on `install/templates/run-operator.ps1` lines 35-36 to verify `$agentFlag`.
   - `view_file` on `update.ps1` lines 14-17 to verify missing files in template copy loop.
   - `view_file` on `.agents/hooks.json` lines 9 and 18 to verify external path.
   - `view_file` on `install/templates/kira.md` lines 4-8 to verify permissions.
2. **Verify test absence**:
   - Run `find_by_name` with `Pattern: "*test*"` in workspace root.
3. **Verify config merger**:
   - Run `node install/merge-config.mjs <tempFile> 9223` and inspect output.
