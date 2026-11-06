Use as many agents as you want, break work into tasks with one agent per task, and do it quick. Complete the optimization of the autonomous browser operator project "Kira" for OpenCode for production use, ensuring it consumes significantly fewer tokens and runs faster on repetitive tasks.

Working directory: C:\Users\Vaibhav\projects\personal_projects\kira
Integrity mode: development

## Requirements

### R1. Final Layer Integrations and Optimization
Inspect the current repository state and complete any remaining layer integrations and configuration syncs between `install/templates` and the active OpenCode configuration files so that the operator achieves the intended token reduction and speedup.

### R2. Automated Verification and Test Coverage
Execute all existing project test and smoke test scripts, and build independent programmatic verification scripts to validate that helper functions, configuration merging, and notification channels operate correctly and reliably without regressions.

## Verification Resources
- Existing repository scripts: `install/setup-operator.ps1`, `install/merge-config.mjs`, and `install/templates/run-operator.ps1`
- Project smoke test and unit test suites in `kira`
- Notification hooks in `kira/.agents/hooks.json` and OpenCode notification configuration

## Acceptance Criteria

### Integration and Configuration
- [ ] Any remaining optimization layers and configuration syncs between `install/templates` and target OpenCode configuration files are identified and implemented.
- [ ] Operator configuration merges and installs without errors via `install/merge-config.mjs` and `install/setup-operator.ps1`.

### Verification and Reliability
- [ ] Existing project test suites and smoke test scripts pass successfully without failures.
- [ ] Independent programmatic verification scripts are created and run to objectively confirm that helper functions (in `kira-helpers.js`), agent definition files, and notification hooks function as expected.
