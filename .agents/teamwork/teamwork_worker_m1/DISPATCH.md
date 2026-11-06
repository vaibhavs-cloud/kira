## 2026-11-02T08:56:47Z
You are teamwork_worker_m1.
Working directory: C:\Users\Vaibhav\projects\personal_projects\kira\.agents\teamwork\teamwork_worker_m1
Original request record: C:\Users\Vaibhav\projects\personal_projects\kira\.agents\teamwork\ORIGINAL_REQUEST.md

MANDATORY FIRST STEP: Read C:\Users\Vaibhav\projects\personal_projects\kira\.agents\teamwork\ORIGINAL_REQUEST.md before starting work.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your write ownership (files you own exclusively):
- `install/templates/run-operator.ps1`
- `install/merge-config.mjs`
- `install/setup-operator.ps1`
- `update.ps1`
- `.agents/hooks.json`

Your objectives (Milestone M1: Layer Integrations and Config Sync):
1. Fix argument vectorization in `install/templates/run-operator.ps1`:
   Change `$agentFlag` so `--agent` and `$settings.agent` (or `"kira"`) are passed as separate array arguments (using PowerShell array `@agentArgs` or separate parameters) so OpenCode properly parses options without quoting them as a single token.
2. Update `update.ps1` to sync all relevant templates (`start-operator-chrome.ps1`, `run-operator.ps1`, `kira-helpers.js`, `kira.md`, `AGENTS.kira.md`) into `$WorkDir` and config directories.
3. In `install/setup-operator.ps1`:
   - Improve the regex check when appending `AGENTS.kira.md` so that it recognizes both `# Autonomous operator` and `# Kira` rules blocks to prevent duplicate rule pollution.
   - Preserve existing `kira.settings.json` and `start-operator-chrome.cmd` unless `-Replace` is explicitly passed.
4. Enhance `install/merge-config.mjs` to robustly handle JSONC comments, preserve existing config, ensure backup creation, and ensure compatibility with OpenCode config schema.
5. In `.agents/hooks.json`, ensure notification hooks are clean, robust, and portable.
6. Run verification commands to test `merge-config.mjs` on sample JSONC files and test PowerShell script parsing with `[System.Management.Automation.Language.Parser]`.

Output requirements:
Document your changes, diffs, and verification test outputs in:
`C:\Users\Vaibhav\projects\personal_projects\kira\.agents\teamwork\teamwork_worker_m1\handoff.md`
When done, message your caller with your summary and verification evidence.
