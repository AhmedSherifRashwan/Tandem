# Tandem: proposed product roadmap

Research date: 26 November 2026. These are recommendations for future development, not implemented features or a delivery commitment. Branding and the resizable preview are shipped separately from this proposal.

Tandem's strongest direction is a workspace where specialist agents produce a reviewable result. The next step should make work easier to inspect and control before increasing the number of agents.

## What comparable open-source projects do well

| Project | Useful pattern | Application to Tandem |
| --- | --- | --- |
| [Cline: Plan & Act](https://docs.cline.bot/core-workflows/plan-and-act) | Separates exploration and planning from execution. | A real Plan mode, with an editable implementation plan and explicit transition to Build. |
| [Cline: checkpoints](https://docs.cline.bot/core-workflows/checkpoints) | Project snapshots and compare/restore controls make changes reversible. | A pre-run baseline and a per-run diff; restore only the files the user selects. |
| [OpenCode: agents](https://opencode.ai/docs/agents/) | Named agent profiles combine prompts, model preferences, and permissions. | Reusable Planner, Implementer, Reviewer, and Tester profiles with clear capabilities. |
| [Aider: architect mode](https://aider.chat/docs/usage/modes.html) | Splits solution design from concrete edits using architect and editor roles. | Assign roles deliberately rather than asking every agent to repeat the whole task. |
| [Conduct](https://github.com/ldlac/conduct) | Runs coding agents in separate Git worktrees and persists workspace state. | Give every parallel writer its own branch, files, run record, and review flow. |

These patterns are described by the projects themselves. The priorities and implementation choices below are Tandem-specific recommendations. They are not claims that extra agents always improve outcomes.

## Three independent controls

Do not overload the current Normal/Deep toggle with every workflow choice.

| Control | Options | Meaning |
| --- | --- | --- |
| Work mode | Ask / Plan / Build | What the task is allowed to do. |
| Agent setup | Solo / Pair / Team | Which agents participate and how roles are assigned. |
| Review depth | Standard / Deep | Whether to add a bounded critique-and-revision pass. |

Examples: **Plan + Pair + Deep** for architecture; **Build + Solo + Standard** for a small fix; **Build + Team + Deep** for independent implementation tasks that merit a final review.

Plan mode should produce a versioned artifact with scope, assumptions, affected files, ordered tasks, dependencies, and acceptance checks. A user can edit it and choose Build against that plan version. A revised plan must remain visible. Restrict tools and runtime permissions, not just the prompt. Audit the adapters' capabilities first: a read-only filesystem sandbox does not automatically forbid every command or external side effect.

## Recommended order

### 1. Run visibility and Plan mode

Create an explicit run record and show activity from each provider: queued, starting, running, awaiting approval, completed, failed, cancelled, or interrupted. Preserve outcomes after a restart and offer deliberate retry rather than silently replaying writes. Expose output as it arrives where the CLI supports it, without inventing token or cost counters when it does not.

Add the plan artifact and Ask/Plan/Build permissions. Acceptance: a Plan run cannot modify the workspace; the user can inspect and edit its plan before execution; each task has a concrete completion check.

### 2. Reviewable, reversible changes

Capture the starting state, including pre-existing uncommitted edits. Show the diff for this run, not just the repository's entire diff against HEAD. Add selected-file restore, test results, and an explicit Apply action for changes produced in isolated workspaces.

Snapshots must protect the user's unrelated edits and define how untracked files, ignored files, secrets, and large files are treated. A file rollback cannot undo database writes, network requests, or every shell-command side effect. Avoid presenting it as universal undo.

### 3. Role-based agent teams

Start with a small team, for example:

| Agent | Provider | Role | Write access |
| --- | --- | --- | --- |
| Planner | Claude | Decompose the request and define acceptance checks. | No |
| Code scout | Codex | Locate relevant code and constraints. | No |
| Implementer | Codex | Execute the approved task. | Own isolated workspace |
| Reviewer | Claude | Review the actual diff and evidence. | No |
| Integrator | Coordinator | Present results and apply reviewed changes. | Controlled integration only |

Roles should be configurable. Either provider may fill any role if its adapter supports the necessary permissions; this example is not a fixed claim about which provider is better.

### 4. Multiple agents per provider

Yes—support **Claude ×2 + Codex ×2**, and allow other mixes. Each agent needs its own ID, prompt/context, task, process/session, cancellation handle, result, and visible status. The provider is a property of an agent, not its identity.

Begin with parallel read-only investigation. Then add parallel writers in distinct Git worktrees. Do not let two writers share one checkout. Worktrees isolate files and branches, not credentials, databases, ports, or all processes: add setup/cleanup hooks and per-workspace port allocation, and keep sandbox permissions separate.

An example team can investigate UI and backend independently, implement each in its own worktree after agreeing an interface, then hand both diffs to a reviewer. Integrate sequentially and run tests on the combined result. If work overlaps, serialize it or ask for a conflict decision; do not blindly merge competing edits.

Use bounded scheduling: an initial limit of two concurrent agents per provider and four total, configurable round/call limits, task timeouts, queueing, and provider-specific backoff. Multiple processes on one login do not create extra provider quota. More agents can add duplicated work, correlated mistakes, latency, and integration overhead; prefer Solo or Pair for small tasks.

### 5. Context and workflow polish

Add pinned files, explicit attachments, per-project instructions, context summaries, citations that stay linked to sources, named agent presets, and a configurable MCP-server registry. Then improve GitHub issue/PR handoff, signing/notarization, and application updates. Keep external publication and destructive actions explicit.

## Changes needed in the current code

- `electron/main.cjs`: replace the global single `active` task with a run registry and bounded scheduler. Persist runs separately from chat messages.
- `electron/orchestrator.mjs`: evolve the fixed pipeline into typed tasks with roles, dependencies, and a configurable roster. Preserve the single-writer rule within each workspace.
- `mcp/server.mjs`: introduce agent IDs, capability discovery, permission profiles, model selection where supported, and structured lifecycle results. Agent and workspace actions must continue to cross MCP.
- `src/types.ts`: identify events by `runId`, `agentId`, and `stageId`. The current provider-plus-stage key would collide when two Claude agents perform the same stage.
- UI: a compact team panel should show each agent's assignment, status, output, and diff, plus run-level cancellation and retry controls.
- Storage: introduce schema versions and a migration path for persisted runs/plans. SQLite is an option when concurrent updates and recovery outgrow the current atomic JSON history.

The local orchestration service owns scheduling; MCP remains the interface to agent and workspace capabilities. MCP by itself does not provide a multi-agent scheduler. Consider asynchronous run tools and progress notifications for long tasks instead of relying on a single very long tool request.

## How to decide whether teams are worth it

Build a small repeatable evaluation set: a bug fix, a contained feature, a cross-layer feature, a refactor, and a research report. Compare Solo, Pair, and Team on tests passed, actual defects, manual corrections, elapsed time, provider calls, and merge conflicts. Use measured usage when available; label estimates clearly. Ship the smallest agent setup that reliably improves the result.

**Recommended next milestone:** explicit Plan mode, observable runs, and per-run change review. Follow that with isolated team execution. An agent-count slider alone would add complexity before adding enough control.
