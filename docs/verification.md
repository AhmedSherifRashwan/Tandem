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
