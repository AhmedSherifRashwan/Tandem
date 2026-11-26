# Verification

Verified on this Mac on 2026-11-26:

- TypeScript check and production Vite build: passed.
- 10 backend tests: passed, covering orchestration, single-writer mode, cancellation, provider failures, workspace containment, stale writes, real MCP transport, and CLI adapter fixtures.
- 4 Chrome UI checks: passed, covering the composer, settings, honest browser-preview behavior, and layouts at 1440, 1024 and 390 pixels.
- Production visual inspection: zero failures and zero warnings. Screenshots reviewed; small labels, contrast and empty-state scrolling corrected.
- Live Claude MCP call: passed with the installed, authenticated Claude Code CLI.
- Live Codex MCP call: passed with the installed, ChatGPT-authenticated Codex CLI.
- Live native desktop normal-mode round trip: passed, including both independent answers, synthesis and the rendered final response.
- Native chat persistence and actual PDF generation: passed.
- Packaged Apple Silicon app launch: passed with its bundled MCP server, CLI detection, chat persistence and PDF export.

Tests used isolated temporary histories and workspaces. They did not modify existing user conversations or project files. Live deep-mode discussions, live web-search results and agent-generated code changes were not separately exercised; their orchestration and configuration are covered by deterministic tests. The first release delivers stage-level progress, not token streaming. The app is unsigned and not notarized.

The build is pinned to Electron 40.10.2, the compatible runtime cached on this Mac, and reuses the installed Electron distribution when packaging.

## Tandem rename

The renamed build passes 12 backend tests, including two checks for preserving and importing NexusLink history without overwriting existing Tandem data. The packaged Tandem app passes native startup, name/title checks, MCP connection, CLI discovery, chat persistence, and PDF export checks. The README screenshot was captured from this packaged build with isolated test history. The original NexusLink app bundle is retained; Tandem builds into `release/tandem/`.

## Brand identity and adjustable preview

The paired-T logo is used in the interface and in light/dark README wordmarks. The generated transparent PNG is packaged as the app's `icon.icns`; the editable flat SVG is also included. The identity was reviewed at full and small sizes.

All six browser checks pass, including pointer dragging, keyboard resizing, saved width, reset, collapse/reopen, and viewport changes. CSS enforces the chat's minimum width even before resize observers update. The packaged Mac app also passes logo loading, keyboard resizing/reset, MCP startup, chat persistence and PDF export checks. The README screenshot is captured from the packaged app using isolated test history.

The roadmap is research and a proposal only; no plan mode or additional agent-team execution was enabled in this change.
