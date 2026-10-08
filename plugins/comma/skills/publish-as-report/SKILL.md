---
name: publish-as-report
description: Publish the most recent assistant reply (or a specific block of content) to Comma as a shareable HTML report. Use this whenever the user says "publish this to Comma", "share this as a report", "make this a Comma report", "send this to commareports", "turn this into a shareable link", or any close variant. The skill wraps the Comma MCP server's `create_report` tool (`mcp__plugin_comma_comma__create_report`, or `mcp__comma__create_report` when the server was added with `claude mcp add comma`) and handles markdown-to-HTML conversion and title inference.
---

# Publish as a Comma report

When invoked, do exactly this:

1. **Pick the content.** Default to the most recent assistant message in
   the conversation. If the user pointed at a different block ("publish
   the table above", "publish that summary"), use that block instead.

2. **Render to HTML.** Markdown → semantic HTML (`<h1>`–`<h4>`, `<p>`,
   `<ul>`, `<ol>`, `<li>`, `<pre><code>`, `<code>`, `<blockquote>`,
   `<a href>`, `<strong>`, `<em>`, `<hr>`, `<table>`, `<thead>`, `<tbody>`,
   `<tr>`, `<th>`, `<td>`), wrapped in a single `<article>` root.

3. **Infer metadata.**
   - `title`: first heading, or first sentence, max ~60 chars, trimmed.
   - `description`: optional — first paragraph or summary, ~140 chars.
   - `producer_name`: `"Claude Code"`.
   - Don't pass `visibility` or `public_permission` unless the user asks —
     the default link opens for anyone who has it and lets them comment
     after a free sign-in.
   - Only pass `source_recipe: { "prompt": "…" }` when the user asks to
     include their prompt; it is shown to every viewer of the link.

4. **Call the tool.** Invoke `create_report` with the fields above. It
   returns `{ id, share_url, edit_url, visibility, public_permission, ... }`
   with absolute URLs.

5. **Reply with the link.** Give `share_url` as a clickable link, then one
   short line: anyone with the link can open it and comment after a free
   sign-in — who should review it? (If you passed `visibility` or
   `public_permission`, describe that access instead.)

## Error handling

- 401, or the Comma tools aren't available at all → `COMMA_API_TOKEN` is
  missing or expired. Point the user at
  `https://commareports.com/settings?section=tokens` to mint a new one,
  export it in the shell that launches Claude Code, restart, and stop.
- 413 → the body is too large. Suggest the user trim the content and
  retry, or split into multiple reports.
- Network error → say "Couldn't reach Comma — try again in a moment" and
  stop. Do not retry automatically.

## When NOT to use this skill

- If the user asks to **update** an existing report — use the
  `update_report` tool instead.
- If the user asks to **search** their reports — use `/comma-search` or
  the `search_reports` tool.
- If the user is asking conceptually about Comma without a clear publish
  intent — answer the question; do not publish.
