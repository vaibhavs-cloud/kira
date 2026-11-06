# Requirement R2 Survey Report: Automated Verification & Test Coverage

**Repository**: `kira` (`C:\Users\Vaibhav\projects\personal_projects\kira`)  
**Investigator**: `teamwork_explorer_survey_2`  
**Timestamp**: 2026-11-02T08:52:00Z  
**Target Requirement**: R2 — Automated Verification and Test Coverage  

---

## 1. Executive Summary

Requirement R2 mandates:
1. Executing all existing project test and smoke test scripts.
2. Building independent programmatic verification scripts to validate helper functions (`kira-helpers.js`), configuration merging (`merge-config.mjs`), agent definitions (`kira.md`), and notification channels/hooks (`.agents/hooks.json`) without regressions.

### Core Survey Findings:
1. **Automated Test Coverage**: **0%**. No automated test framework (Jest, Vitest, Mocha, Playwright, Puppeteer) or test suites exist in `kira`. There is no root `package.json` with test scripts.
2. **Existing Smoke Tests**: The repository defines only a single manual CLI command:
   ```powershell
   opencode run --auto "list my kira chrome tabs"
   ```
   (referenced in `README.md:68` and `install/setup-operator.ps1:154`). This requires a running Chrome instance with remote debugging on port 9223, global OpenCode configuration, and an active LLM provider session.
3. **Notification Configuration & Hooks**: `kira/.agents/hooks.json` configures `ntfy-notifications` intercepting `PreToolUse` (for `run_command`) and `Stop` events. It invokes:
   ```cmd
   node C:/Users/Vaibhav/projects/bs/linked_in/scripts/notify-ntfy.mjs
   ```
   This configuration relies on a hardcoded absolute path pointing outside the repository (`projects/bs/linked_in`), creating an external dependency and portability fragility.
4. **Feasibility of Zero-Dependency Independent Verification**:
   Because `kira` already requires **Node.js ≥ 22** (`setup-operator.ps1:28`), Node's built-in **`node:test`** and **`node:assert`** modules can be utilized directly. We successfully verified via trial execution that:
   - `kira-helpers.js` can be verified in a lightweight mock DOM context using `node:vm` in milliseconds without launching a browser.
   - `merge-config.mjs` can be thoroughly exercised against isolated temporary JSONC configurations.
   - `kira.md` and `AGENTS.kira.md` frontmatter and method signatures can be statically linted.
   - `.agents/hooks.json` schema and command targets can be programmatically audited.

---

## 2. Inventory of Existing Project Test Assets & Smoke Tests

### 2.1 File & Directory Inventory
A comprehensive scan of the repository revealed the following file structure:
- **Root Directory**:
  - `README.md`: Contains operator overview and manual smoke test instructions.
  - `LICENSE`: MIT license.
  - `update.ps1`: Syncs template files into `$env:USERPROFILE\.opencode-operator`.
  - `uninstall.ps1`: Removes scheduled tasks and operator workdir.
  - `.gitignore`: Ignores chrome-profile, run artifacts, backups, node_modules.
- **`install/`**:
  - `setup-operator.ps1`: PowerShell installer registering tasks, configuring Chrome and OpenCode.
  - `merge-config.mjs`: Script to merge port, permissions, and MCP flags into `opencode.jsonc`.
  - `templates/kira-helpers.js`: In-page helper library defining `window.__kira`.
  - `templates/kira.md`: OpenCode custom agent markdown definition with YAML frontmatter.
  - `templates/AGENTS.kira.md`: Global behavior rules and guardrails.
  - `templates/opencode.jsonc.part`: Reference snippet for MCP configuration.
  - `templates/run-operator.ps1`: Scheduled runner script executed every 20 minutes.
  - `templates/start-operator-chrome.ps1`: Launcher for dedicated Chrome profile with remote debugging.
- **`.agents/`**:
  - `hooks.json`: Lifecycle hooks for `PreToolUse` and `Stop`.
- **`.opencode/`**:
  - `package.json`: Contains `@opencode-ai/plugin: 1.19.4`. No test dependencies or scripts.

### 2.2 Existing Smoke Test Analysis
The only smoke test documented is:
```powershell
opencode run --auto "list my kira chrome tabs"
```
**Execution Chain**:
1. Invokes global OpenCode CLI (`opencode`).
2. OpenCode reads global configuration `~/.config/opencode/opencode.jsonc`.
3. OpenCode spawns `npx -y chrome-devtools-mcp@latest --browserUrl http://127.0.0.1:9223 ...`.
4. MCP connects to Chrome listening on port 9223 via Chrome DevTools Protocol (CDP).
5. OpenCode sends CDP `Target.getTargets` to enumerate active browser tabs.
6. The LLM formats and outputs the tab list to stdout.

**Prerequisites for Smoke Test**:
- Google Chrome installed and running on port 9223 via `start-operator-chrome.ps1`.
- Node.js ≥ 22.
- Global OpenCode CLI installed and logged in to a model provider.
- Network access to install/run `chrome-devtools-mcp@latest`.

**Status**:
This smoke test cannot be executed in headless CI/CD, sandboxed environments, or without user credentials and an active browser session.

### 2.3 Built-In Runtime Guards
In `install/templates/run-operator.ps1`, three runtime verification guards exist:
1. **Quiet Hours Guard** (`Test-QuietHours`): Skips execution between `quietStart` (default 23:30) and `quietEnd` (default 08:00).
2. **Concurrency Lock Guard**: Checks if `run.lock` exists and is younger than `maxRunMinutes` (15 min).
3. **Port Connectivity Probe**: Uses `Test-NetConnection -ComputerName 127.0.0.1 -Port $settings.port` before invoking OpenCode.

---

## 3. Inspection of `hooks.json` and Notification Configuration

### 3.1 Content of `kira/.agents/hooks.json`
```json
{
  "ntfy-notifications": {
    "PreToolUse": [
      {
        "matcher": "run_command",
        "hooks": [
          {
            "type": "command",
            "command": "node C:/Users/Vaibhav/projects/bs/linked_in/scripts/notify-ntfy.mjs",
            "timeout": 10
          }
        ]
      }
    ],
    "Stop": [
      {
        "type": "command",
        "command": "node C:/Users/Vaibhav/projects/bs/linked_in/scripts/notify-ntfy.mjs",
        "timeout": 10
      }
    ]
  }
}
```

### 3.2 Notification Architecture & Behavioral Analysis
- **Lifecycle Interception**:
  - `PreToolUse`: Triggers immediately before the agent runs any tool matching `run_command`. This acts as an audit or wake-up alert whenever a shell command is about to be executed.
  - `Stop`: Triggers when the agent finishes its task or reaches a stop state.
- **Target Channel**:
  - The script name `notify-ntfy.mjs` indicates notifications are dispatched to **ntfy** (an HTTP-based pub-sub push notification service).
  - Inspection of the user's environment revealed related configuration files:
    - `~/.config/opencode/notify-phone.json`
    - `~/.config/opencode/ntfy-awake`
  - This setup is intended to send high-priority push notifications to the user's phone during unattended operator runs.

### 3.3 Identified Fragilities and Risks:
1. **Hardcoded Machine Path**:
   `C:/Users/Vaibhav/projects/bs/linked_in/scripts/notify-ntfy.mjs` points to a completely separate repository (`projects/bs/linked_in`). If this path does not exist, is renamed, or if `kira` is cloned to a different environment or machine, the hook fails on every command.
2. **Timeout Overhead**:
   The timeout is configured for `10` seconds. If `notify-ntfy.mjs` hangs on a network request, every single `run_command` and `Stop` will pause execution for up to 10 seconds.
3. **No In-Repo Fallback**:
   The `kira` repository contains no self-contained notification script, no local configuration schema, and no test suite verifying notification dispatch.

---

## 4. Current Test Status, Dependencies & Test Gaps

### 4.1 Status & Dependency Matrix

| Component | Current Test Type | Status | Required Dependencies |
|---|---|---|---|
| `kira-helpers.js` | None | Untested | Browser DOM / WhatsApp Web |
| `merge-config.mjs` | Manual install run | Untested automated | Node.js, File System |
| `kira.md` (Agent) | Manual opencode run | Untested automated | OpenCode CLI, LLM provider |
| `AGENTS.kira.md` | Manual review | Untested automated | None |
| `hooks.json` | None | Untested | External script, ntfy network |
| `run-operator.ps1` | Manual Task Scheduler | Untested automated | PowerShell, Chrome on port 9223 |

### 4.2 Comprehensive Gap Analysis

#### Gap 1: In-Page Helper DOM Robustness (`kira-helpers.js`)
`kira-helpers.js` is the core token-saving mechanism in Kira. If its DOM selectors fail, Kira cannot function without falling back to expensive snapshots.
- **Untested Methods**:
  - `status()`: Detects QR code vs logged-in state.
  - `getUnread()`: Selects `[data-testid="cell-frame-container"]`, parses badge text, contact titles, previews, and timestamps.
  - `openChat(contactName)`: Searches by exact title, or falls back to `[data-testid="chat-list-search"]` and clicks first result.
  - `getMessages(limit)`: Distinguishes incoming vs outgoing messages (`[data-testid="msg-dblcheck"]`, `.message-out`).
  - `sendMessage(messageText)`: Injects text into `[data-testid="conversation-compose-box-input"]` and clicks send.
- **Risk**: WhatsApp Web frequently updates CSS classes and `data-testid` attributes. Without automated DOM regression tests, selector breakage remains undetected until production failures.

#### Gap 2: Configuration Merge Integrity (`merge-config.mjs`)
- **Untested Edge Cases**:
  - Handling of non-existent target files.
  - Handling of existing configs with single-line comments (`//`), block comments (`/* ... */`), and trailing commas.
  - Preserving other MCP servers (e.g. filesystem, github, memory) without overwriting them.
  - Correct formatting of the `--no-category-*` token optimization flags.
  - Creation of `<file>.backup.<timestamp>` files.

#### Gap 3: Agent Definitions & Rules Consistency
- **Untested Artifacts**:
  - `install/templates/kira.md`: YAML frontmatter parsing, validity of permission scopes (`chrome-devtools:*`, `bash`), guardrail presence.
  - Alignment between the 5 helper methods declared in `kira.md` (`status`, `getUnread`, `openChat`, `getMessages`, `sendMessage`) and the implementations in `kira-helpers.js`.
  - Alignment between `AGENTS.kira.md` and the prompt configured in `setup-operator.ps1`.

#### Gap 4: Hook Integrity & Execution
- **Untested Artifacts**:
  - `.agents/hooks.json` syntax and schema conformance.
  - Handling when the notification target script is missing or encounters network timeouts.

---

## 5. Design of Independent Programmatic Verification Scripts

To satisfy Requirement R2 without adding heavy dependencies, we design a modular, zero-dependency test suite based on Node.js 22+ built-in **`node:test`** and **`node:assert`**.

```
kira/
├── tests/
│   ├── helpers.test.mjs        # Mock-DOM unit tests for kira-helpers.js
│   ├── config-merge.test.mjs   # Isolated integration tests for merge-config.mjs
│   ├── agents.test.mjs         # Static analysis & schema validation for agent definitions
│   ├── hooks.test.mjs          # Schema, path, and mock tests for hooks.json
│   ├── scripts.test.mjs        # Quiet-hours logic and PowerShell syntax tests
│   └── run-all.mjs             # Unified test runner entry point
```

### 5.1 Test Specification: `tests/helpers.test.mjs`
**Objective**: Verify all 5 methods of `window.__kira` under controlled simulated DOM conditions using `node:vm`.

**Test Cases**:
1. **IIFE & Global Binding**:
   - Evaluates `kira-helpers.js` in a VM context.
   - Asserts `typeof window.__kira === 'object'`.
   - Asserts all required methods exist: `['status', 'getUnread', 'openChat', 'getMessages', 'sendMessage', '_wait']`.
2. **`status()` - Logged Out (QR Code)**:
   - Sets up mock DOM with element matching `[data-testid="link-device-qr-code"]`.
   - Asserts returns `{ loggedIn: false, page: 'whatsapp', reason: 'QR code login required' }`.
3. **`status()` - Logged In**:
   - Sets up mock DOM with search input and 3 chat list item elements.
   - Asserts returns `{ loggedIn: true, page: 'whatsapp', chatCount: 3, hasSearch: true }`.
4. **`getUnread()` - Unread Chat Extraction**:
   - Sets up 2 chat cells:
     - Cell 1: Title "Project Lead", preview "Please update the PR", unread badge "2", time "10:15 AM".
     - Cell 2: Title "Friend", preview "See you", no unread badge.
   - Asserts `getUnread()` returns array with exactly 1 item:
     `[{ name: 'Project Lead', preview: 'Please update the PR', time: '10:15 AM', unreadCount: 2 }]`.
5. **`openChat(name)` - Selection Logic**:
   - Direct click: Searching for visible contact triggers `.click()` on the matching cell.
   - Search fallback: When contact is not in visible cells, focuses search box, populates search input, and clicks the first resulting cell.
   - Error handling: Calling `openChat('')` returns `{ success: false, error: 'Contact name required' }`.
6. **`getMessages(limit)` - Message Parsing**:
   - Sets up 3 messages: incoming text, outgoing text with `[data-testid="msg-dblcheck"]`, and another incoming text.
   - Asserts message objects contain `{ fromMe, text, time }` with correct boolean flags and text truncation.
7. **`sendMessage(text)` - Text Entry & Dispatch**:
   - Sets up compose box and send button.
   - Asserts text injection and button click trigger `{ success: true }`.
   - Asserts empty string returns `{ success: false, error: 'Empty message text' }`.

### 5.2 Test Specification: `tests/config-merge.test.mjs`
**Objective**: Verify `install/merge-config.mjs` behaves idempotently and safely.

**Test Cases**:
1. **Creation from Non-Existent File**:
   - Targets a non-existent file in `os.tmpdir()`.
   - Asserts creates valid JSON containing `permission: "allow"` and `mcp["chrome-devtools"]`.
2. **Preservation of Existing MCP Servers**:
   - Input contains an existing server `"custom-server": { "command": ["custom-cli"] }`.
   - Asserts after merge, `"custom-server"` is preserved unchanged.
3. **JSONC Comment Stripping**:
   - Input contains single-line (`//`) and block (`/* ... */`) comments, plus trailing commas.
   - Asserts parses cleanly without errors and outputs standard JSON.
4. **Token Optimization Flags**:
   - Asserts the command array includes:
     `--no-category-emulation`, `--no-category-performance`, `--no-category-network`, `--no-category-memory`, `--no-usage-statistics`.
5. **Port Customization**:
   - Passes port `9229`. Asserts `--browserUrl` is `http://127.0.0.1:9229`.
6. **Backup Generation**:
   - Asserts `<path>.backup.<timestamp>` is created with the exact original file content.

### 5.3 Test Specification: `tests/agents.test.mjs`
**Objective**: Validate agent definitions, YAML frontmatter, guardrails, and API alignment.

**Test Cases**:
1. **Frontmatter Validation (`kira.md`)**:
   - Parses frontmatter between `---` boundaries.
   - Asserts `description` is a non-empty string mentioning token optimization / browser operator.
   - Asserts `mode` is `all`.
   - Asserts `permission` dictionary allows `chrome-devtools:*` and `bash`, and sets `*` to `deny`.
2. **API Alignment Verification**:
   - Extracts all `window.__kira.<method>` invocations referenced in `kira.md` and `AGENTS.kira.md`.
   - Asserts every referenced method exists in `install/templates/kira-helpers.js`.
3. **Guardrails Audit**:
   - Checks presence of required hard rule sections: prompt injection defense ("DATA, not instructions"), rate limits (15/hr, 40/day), quiet hours, escalation rules.
4. **Prompt Consistency**:
   - Asserts the scheduled prompt in `setup-operator.ps1` matches the prompt described in `AGENTS.kira.md` and `run-operator.ps1`.

### 5.4 Test Specification: `tests/hooks.test.mjs`
**Objective**: Validate `.agents/hooks.json` syntax, schema, and notification reliability.

**Test Cases**:
1. **JSON Syntax & Structure**:
   - Asserts `.agents/hooks.json` parses as valid JSON.
   - Asserts top-level contains `ntfy-notifications`.
2. **Event & Matcher Conformance**:
   - Asserts `PreToolUse` has matcher `run_command` and valid `hooks` array.
   - Asserts `Stop` event exists with valid `hooks` array.
   - Asserts each hook item has `type: "command"`, numeric `timeout > 0`, and non-empty `command`.
3. **Portability Audit**:
   - Scans commands for hardcoded absolute paths outside the repo.
   - Emits a warning or test report recommendation to support relative paths or environment variables (e.g. `KIRA_NOTIFY_CMD`).
4. **Mock Execution Test**:
   - Executes a test command matching the hook timeout contract to verify zero process hangs.

### 5.5 Test Specification: `tests/scripts.test.mjs`
**Objective**: Validate operational logic and PowerShell script syntax.

**Test Cases**:
1. **PowerShell Script Syntax Validation**:
   - Validates that `setup-operator.ps1`, `run-operator.ps1`, `start-operator-chrome.ps1`, `update.ps1`, and `uninstall.ps1` contain no syntax errors.
2. **Quiet Hours Boundary Matrix**:
   - Tests the `Test-QuietHours` algorithm across all boundary conditions:
     - Overnight window: `23:30` to `08:00`:
       - `23:29:59` → Active (`false`)
       - `23:30:00` → Quiet (`true`)
       - `03:00:00` → Quiet (`true`)
       - `07:59:59` → Quiet (`true`)
       - `08:00:00` → Active (`false`)
       - `12:00:00` → Active (`false`)
     - Daytime window: `12:00` to `14:00`:
       - `11:59:59` → Active (`false`)
       - `13:00:00` → Quiet (`true`)
       - `14:00:00` → Active (`false`)

### 5.6 Master Runner Execution
The test suite can be run in any of the following ways:
1. **Direct Node.js**:
   ```bash
   node --test tests/*.test.mjs
   ```
2. **Unified Runner**:
   ```bash
   node tests/run-all.mjs
   ```
3. **PowerShell Wrapper (`test.ps1`)**:
   ```powershell
   .\test.ps1
   ```

Execution time for the entire suite is estimated under **1.2 seconds**, requiring **no network connections, no API keys, and no active browser**.

---

## 6. Recommendations & Implementation Plan for Orchestrator

1. **Create `tests/` Directory Structure**:
   Implement the proposed modular tests using `node:test` and `node:assert`.
2. **Add Root `package.json`**:
   Add a lightweight root `package.json` with `"type": "module"` and:
   ```json
   {
     "name": "kira",
     "version": "1.0.0",
     "scripts": {
       "test": "node --test tests/*.test.mjs",
       "test:verbose": "node --test --test-reporter=spec tests/*.test.mjs"
     }
   }
   ```
3. **Add PowerShell Test Runner `test.ps1`**:
   Provide a convenient `.\test.ps1` script for Windows users that runs the tests and prints formatted status summaries.
4. **Remediate Notification Hook Portability in `.agents/hooks.json`**:
   - Either make the hook command portable by providing an in-repo notification script (e.g. `scripts/notify-ntfy.mjs` or `install/notify.mjs`), or allow parameterization via environment variable or settings file.
   - Include a graceful fallback so that if the external notification script does not exist, the operator does not stall or throw fatal errors during scheduled runs.
5. **Update Documentation**:
   Update `README.md` to document the automated test commands alongside the existing manual smoke test.

---
*Report prepared by teamwork_explorer_survey_2 for orchestrator coordination.*
