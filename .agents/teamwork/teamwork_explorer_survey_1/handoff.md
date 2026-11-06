# Handoff Report: Requirement R1 Survey

**Agent**: `teamwork_explorer_survey_1`  
**Date**: 2026-11-02  
**Handoff Type**: Hard (Investigation & Survey Complete)  
**Deliverable Report**: `C:\Users\Vaibhav\projects\personal_projects\kira\.agents\teamwork\teamwork_explorer_survey_1\survey_r1.md`  

---

## 1. Observation

1. **`run-operator.ps1` Argument Passing**:
   - Location: `install/templates/run-operator.ps1:35-36`
   - Code:
     ```powershell
     $agentFlag = if ($settings.agent) { "--agent $($settings.agent)" } else { "--agent kira" }
     opencode run --auto $agentFlag $settings.prompt >> (Join-Path $PSScriptRoot $settings.runOutputFile) 2>&1
     ```
   - Test execution with node child process argument inspector (`test_args.ps1`):
     ```
     node -e "console.log(JSON.stringify(process.argv.slice(1)))" run --auto $agentFlag $prompt
     Output: ["run","--auto","--agent kira","test prompt"]
     ```
     `"--agent kira"` was delivered as a single string token, causing `opencode` command-line argument parsing to fail to recognize the `--agent` option.
   - When tested with array splatting (`@agentArgs`) or separate tokens (`--agent $agent`):
     ```
     Output: ["run","--auto","--agent","kira","test prompt"]
     ```

2. **Regex Mismatch & Rules Duplication in `setup-operator.ps1`**:
   - Location: `install/setup-operator.ps1:114`
   - Code:
     ```powershell
     if ($existing -notmatch "Kira: agentic operator rules") {
       Add-Content -Path $agentsPath -Value ("`n`n" + $agentsBlock)
     ```
   - Target File: `C:\Users\Vaibhav\.config\opencode\AGENTS.md` (Length: 7,654 bytes)
   - Tested command:
     `powershell -Command "(Get-Content '$env:USERPROFILE\.config\opencode\AGENTS.md' -Raw) -match 'Kira: agentic operator rules'"`
     Returned: `False`
   - Actual existing heading in `AGENTS.md`: `# Autonomous operator (WhatsApp Web / Telegram Web / Instagram / general web)`.
   - Running `setup-operator.ps1` appends duplicate, generic rules into the user's customized `AGENTS.md`.

3. **Unconditional Overwrite of `kira.settings.json`**:
   - Location: `install/setup-operator.ps1:82-84`
   - Code:
     ```powershell
     $settingsPath = Join-Path $WorkDir "kira.settings.json"
     $settings | ConvertTo-Json | Set-Content $settingsPath
     ```
   - No check for `Test-Path $settingsPath` or `-Replace` switch. Existing user configurations are wiped on every setup run.

4. **Task Registration Exception**:
   - Location: `install/setup-operator.ps1:134, 141`
   - `Register-ScheduledTask` fails in non-elevated or restricted sandboxed sessions with `CimException: Access to a CIM resource was not available to the client.`
   - Because `$ErrorActionPreference = "Stop"` (line 17), the installer halts abruptly before running operator Chrome or showing instructions.

5. **`update.ps1` Sync Incompleteness**:
   - Location: `update.ps1:14-16`
   - Code:
     ```powershell
     foreach ($name in @("start-operator-chrome.ps1", "run-operator.ps1")) {
       Copy-Item (Join-Path $tplDir $name) (Join-Path $WorkDir $name) -Force
     ```
   - Only copies `start-operator-chrome.ps1` and `run-operator.ps1`. Ignores `kira-helpers.js`, `kira.md`, and `AGENTS.kira.md`.

6. **OpenCode 1.19.4 Schema Status**:
   - Inspected `https://opencode.ai/config.json` (verified via `check_schema.mjs` and `check_schema_defs.mjs`).
   - Root property `"permission"` is marked `"deprecated": true` (replaced by `"permissions": "#/$defs/Permission.Ruleset"`).
   - Direct properties under `"mcp"` (e.g. `mcp["chrome-devtools"]`) are marked `"deprecated": true` (replaced by `"mcp.servers["chrome-devtools"]"`).

7. **Token Reduction Implementation**:
   - `install/templates/kira-helpers.js` provides `window.__kira` API (`status`, `getUnread`, `openChat`, `getMessages`, `sendMessage`).
   - Replaces raw accessibility DOM snapshots (`take_snapshot` dumping 10k–30k tokens) with scoped JSON payloads (<200 tokens).
   - `merge-config.mjs` configures `--no-category-emulation`, `--no-category-performance`, `--no-category-network`, `--no-category-memory`, which prunes unused tool schemas from the system prompt, saving 1,500–3,000 tokens per turn.

---

## 2. Logic Chain

1. From Observation 1, `$agentFlag = "--agent kira"` is passed directly without argument separation. Because PowerShell treats single variables containing spaces as a single argument when invoking native binaries, OpenCode CLI receives `argv[2] = "--agent kira"`. Therefore, scheduled runs never activate the custom `@kira` agent instructions and fallback to default agent behavior.
2. From Observation 2, `setup-operator.ps1` relies on the exact string `"Kira: agentic operator rules"` to determine whether to skip appending rules to `AGENTS.md`. Because the user's active `AGENTS.md` uses `# Autonomous operator`, the regex fails to match. Therefore, executing `setup-operator.ps1` will corrupt `AGENTS.md` by appending duplicate rules and clobbering personalized voice instructions.
3. From Observation 3, unlike script files which check `Test-Path` and `$Replace`, `kira.settings.json` is unconditionally written. Any customized prompts or quiet hours set by the user will be silently lost during updates or re-installations.
4. From Observation 4, `setup-operator.ps1` assumes elevated Task Scheduler permissions. Without try/catch error suppression or administrator privilege checks, environments lacking Task Scheduler access fail completely.
5. From Observation 5, running `update.ps1` after updating repository templates leaves `~/.config/opencode/kira-helpers.js` and `~/.config/opencode/agents/kira.md` outdated, defeating repo-level bug fixes to DOM selectors or agent instructions.
6. From Observations 6 and 7, the token reduction strategy is sound and yields over 98% token savings, but needs schema modernization and auto-injection support to prevent unnecessary token burn during manual helper injection.

---

## 3. Caveats

1. Production source files were not modified during this exploration per read-only constraints.
2. Task Scheduler tasks could not be modified or registered in the sandboxed shell session due to CIM RPC restrictions.
3. External notification script `C:/Users/Vaibhav/projects/bs/linked_in/scripts/notify-ntfy.mjs` referenced in `.agents/hooks.json` could not be read directly due to sandbox boundary protections, but OpenCode's internal `plugins/notify-phone.ts` and `notify-phone.json` were fully analyzed.

---

## 4. Conclusion

The repository foundation for Requirement R1 is functional and architecturally well-designed, but requires five immediate, concrete fixes before it is production-ready:
1. **Fix argument passing in `run-operator.ps1`**: Change `$agentFlag` to separate arguments `--agent $agentName`.
2. **Make `setup-operator.ps1` idempotent**:
   - Update `AGENTS.md` detection regex to match `# Autonomous operator` as well as `Kira: agentic operator rules`.
   - Protect `kira.settings.json` and `start-operator-chrome.cmd` behind `if ((Test-Path ...) -and -not $Replace)`.
   - Wrap `Register-ScheduledTask` in a `try/catch` with informative warnings.
3. **Expand `update.ps1`**: Add sync logic for `kira-helpers.js` and `kira.md`.
4. **Modernize `merge-config.mjs`**: Ensure compatibility with modern `mcp.servers` and `permissions` rulesets while preserving backwards compatibility.
5. **Enhance `kira-helpers.js`**: Add loading state detection to `status()` to prevent false "logged out" reports while chats are loading.

---

## 5. Verification Method

To independently verify all findings:
1. **Argument Passing**:
   Run: `powershell -ExecutionPolicy Bypass -File .agents/teamwork/teamwork_explorer_survey_1/test_args.ps1`
   Verify that single-variable `$agentFlag` produces `["run","--auto","--agent kira","test prompt"]` whereas separate arguments produce `["run","--auto","--agent","kira","test prompt"]`.
2. **AGENTS.md Regex Match**:
   Run: `powershell -Command "(Get-Content '$env:USERPROFILE\.config\opencode\AGENTS.md' -Raw) -match 'Kira: agentic operator rules'"`
   Verify that output is `False`.
3. **JSONC Parser Logic**:
   Run: `node .agents/teamwork/teamwork_explorer_survey_1/test_merge_logic.mjs`
   Verify that `parseJsonc` parses block/line comments and trailing commas without error.
4. **OpenCode Schema Inspection**:
   Run: `node .agents/teamwork/teamwork_explorer_survey_1/check_schema.mjs`
   Verify that `"permission"` is marked deprecated and `"permissions"` is modern.
