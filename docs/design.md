# Interface direction

Tandem is a long-session local workspace. Its main question is: what can the two agents accomplish together in this folder?

The real objects are conversations, user prompts, independent answers, cross-reviews, unified responses, workspace files, Git changes, commands, and Markdown reports. The app starts empty; no sample conversations, claimed usage, or invented connection states are displayed.

The chosen style is the framed sheet from the design-taste-frontend app-screen skill. A cool green-grey L-frame encloses a white conversation sheet, with a 228px history rail, a flexible chat column, and a 345px workspace pane. At 1440px: 228px + 858px + 345px + 9px outer edge = 1440px, including internal borders. IBM Plex Sans is bundled locally. Teal is reserved for the link mark, selected workspace tab, and connection/task states.

The signature element is the agent collaboration list: Claude and Codex conclusions converge into the one response. It shows real execution stages, with completed outputs available for inspection.

On small screens, history and the workspace each occupy one region at a time. Reduced motion removes the progress spinner's rotation. The first action is selecting a trusted folder or drafting a prompt, rather than reviewing invented metrics.

## Visual review

Round 1: the two-agent welcome and composer establish the task clearly. Initial supporting text was too small and some sidebar text was slightly below the contrast target; primary labels were increased and supporting colours darkened. An empty-state auto-scroll also clipped the welcome at shorter window heights; it now scrolls only conversations with messages.

Round 2: production inspection at 1440, 1024, and 390 pixels reports zero failures and zero warnings. All three screenshots were inspected. The wide view separates history, conversation and workspace; the narrow view preserves the composer and collapses the secondary panes. No stock imagery or demonstration data is used. App-screen review: design 8, usability 8, creativity 7, content 8 (weighted 7.8). The design uses a familiar assistant layout; the paired-agent stages give it its specific identity. Marketing-page photography and motion criteria do not apply to this working app.
