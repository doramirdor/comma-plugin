---
name: publish-as-report
description: Publish the most recent assistant reply (or a specific block of content) to Comma as a shareable HTML report. Use this whenever the user says "publish this to Comma", "share this as a report", "make this a Comma report", "send this to commareports", "turn this into a shareable link", or any close variant. The skill wraps the `mcp__comma__publish_report` MCP tool and handles markdown-to-HTML conversion, title inference, and provenance metadata.
---

# Publish as a Comma report

When invoked, do exactly this:

1. **Pick the content.** Default to the most recent assistant message in
   the conversation. If the user pointed at a different block ("publish
   the table above", "publish that summary"), use that block instead.

2. **Render to safe HTML.** Markdown → HTML using only this allowlist:
   `<article>`, `<h1>`–`<h4>`, `<p>`, `<ul>`, `<ol>`, `<li>`,
   `<pre><code>`, `<code>`, `<blockquote>`, `<a href>`, `<strong>`,
   `<em>`, `<hr>`, `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`.
   Strip every `<script>`, `<style>`, `<iframe>`, `<object>`, `<embed>`,
   inline `style=`, and `on*=` attribute. Wrap the body in a single
   `<article>` root.

3. **Infer metadata.**
   - `title`: first heading, or first sentence, max ~60 chars, trimmed.
   - `description`: optional — first paragraph or summary, ~140 chars.
   - `producer_name`: `"Claude Code"`.
   - `source_recipe`: `{ "prompt": "<the user's last prompt>" }`.

4. **Call the tool.** Invoke `mcp__comma__publish_report` with the fields
   above. The tool returns `{ id, url, ... }`.

5. **Reply with the URL only.** One line, no preamble:
   `https://commareports.com/p/<id>`

## Error handling

- 401 → `COMMA_API_TOKEN` is missing or expired. Point the user at
  `https://commareports.com/settings#tokens` to mint a new one and stop.
- 413 → the body is too large. Suggest the user trim the content and
  retry, or split into multiple reports.
- Network error → say "Couldn't reach Comma — try again in a moment" and
  stop. Do not retry automatically.

## When NOT to use this skill

- If the user asks to **update** an existing report — use
  `mcp__comma__update_report` instead.
- If the user asks to **search** their reports — use `/comma-search` or
  `mcp__comma__search_reports`.
- If the user is asking conceptually about Comma without a clear publish
  intent — answer the question; do not publish.
