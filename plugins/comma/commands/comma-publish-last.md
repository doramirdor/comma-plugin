---
description: Alias for /comma-publish — publish the last assistant reply to Comma.
argument-hint: [optional title]
allowed-tools: mcp__plugin_comma_comma__create_report, mcp__comma__create_report
---

## Publish last reply to Comma

This is an alias for `/comma-publish`. Follow the same flow:

1. Take the most recent assistant message in this conversation.
2. Call the Comma MCP server's `create_report` tool
   (`mcp__plugin_comma_comma__create_report` via this plugin,
   `mcp__comma__create_report` if added with `claude mcp add comma`) with:
   - `html`: the message body rendered as minimal HTML (`<article>`, `<h1>`,
     `<h2>`, `<p>`, `<ul>`, `<pre><code>`, `<a>`, `<strong>`, `<em>`).
   - `title`: $ARGUMENTS if provided, otherwise inferred from the first
     heading or sentence (max ~60 chars).
   - `producer_name`: `"Claude Code"`.

   Don't pass `visibility` or `public_permission` unless the user asks. Only
   pass `source_recipe` when the user asks to include their prompt — it is
   shown to every viewer.

3. Reply with `share_url` from the result as a clickable link, then one
   short line: anyone with the link can open it and comment after a free
   sign-in — who should review it? (If you passed `visibility` or
   `public_permission`, describe that access instead.)

On a 401, or if the Comma tools aren't available, point the user to
`https://commareports.com/settings?section=tokens` for a new
`COMMA_API_TOKEN`, then restart Claude Code.
