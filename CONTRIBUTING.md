# Contributing to NexusLink

Thanks for helping improve NexusLink. Small, focused changes are easiest to review.

## Work locally

1. Fork and clone the repository.
2. Install Node.js 22.12+ (Node.js 24 recommended for matching the tested environment) and run `npm ci`.
3. Use `npm run dev` for UI-only work, or `npm run desktop` for native features.
4. Run `npm test` and `npm run build` before opening a pull request.

UI checks use Google Chrome: `npm run test:ui`. Native checks run on macOS: `npm run test:desktop`. Live tests require authenticated Claude Code and Codex CLIs and consume provider usage; they are optional and never belong in unauthenticated CI.

## Pull requests

Describe the problem, resulting behavior, and checks you ran. For interface changes, include a screenshot. For a bug fix, include reproduction steps or a regression test when it adds meaningful coverage.

Preserve these boundaries:

- Agent and workspace capabilities go through MCP.
- Only the explicit execution phase can give Codex workspace write access.
- The renderer remains isolated from Node.js and unrestricted IPC.
- Provider failures, incomplete work, and missing authentication stay visible to the user.
- Conversation history, credentials, `.env` files, private prompts, and local build artifacts must not be committed.

Useful areas for contributions include token streaming, configurable MCP servers, better context management, accessible keyboard navigation, and signing/notarization support. These are potential directions, not promised features.

## Reporting problems

Include your macOS version, Node.js version, CLI versions, steps to reproduce, and relevant redacted error text. Do not include credentials, private workspace contents, or full chat history unless it is safe to publish.

If you discover a security issue, avoid posting sensitive details in a public issue. Check whether the repository offers GitHub's private vulnerability-reporting option before sharing a reproduction.

Contributions are provided under the repository's MIT license.
