---
description: Publish the assistant's most recent reply to Comma as a shareable HTML report.
argument-hint: [optional title]
allowed-tools: mcp__plugin_comma_comma__create_report, mcp__comma__create_report
---

## Publish to Comma

Take the most recent assistant message in this conversation and call the
Comma MCP server's `create_report` tool (`mcp__plugin_comma_comma__create_report`
when installed through this plugin, `mcp__comma__create_report` if the server
was added with `claude mcp add comma`) with:

- `html`: the message body. If the message is markdown, render it to HTML
  first using a minimal shape — `<h1>`, `<h2>`, `<h3>`, `<p>`, `<ul>/<ol>/<li>`,
  `<pre><code>`, `<blockquote>`, `<a>`, `<strong>`, `<em>`. Wrap the whole
  thing in a single `<article>…</article>`.
- `title`: $ARGUMENTS if the user passed a title. Otherwise infer one from
  the first heading or first sentence of the message (max ~60 chars, no
  trailing punctuation).
- `producer_name`: `"Claude Code"`.

Don't pass `visibility` or `public_permission` unless the user asks — the
default link opens for anyone who has it and lets them comment after a free
sign-in. Only pass `source_recipe: { "prompt": "…" }` when the user asks to
include their prompt; it is shown to every viewer of the link.

After the tool returns, reply with `share_url` from the result as a
clickable link, then one short line: anyone with the link can open it and
comment after a free sign-in — who should review it? (If you passed
`visibility` or `public_permission`, describe that access instead.)

If the tool errors with a 401, or the Comma tools aren't available at all,
tell the user their `COMMA_API_TOKEN` is missing or expired: create one at
`https://commareports.com/settings?section=tokens`, export it in the shell
that launches Claude Code, and restart Claude Code.
