---
description: Publish the assistant's most recent reply to Comma as a shareable HTML report.
argument-hint: [optional title]
allowed-tools: mcp__comma__publish_report
---

## Publish to Comma

Take the most recent assistant message in this conversation and call the
`mcp__comma__publish_report` MCP tool with:

- `html`: the message body. If the message is markdown, render it to HTML
  first using a minimal shape — `<h1>`, `<h2>`, `<h3>`, `<p>`, `<ul>/<ol>/<li>`,
  `<pre><code>`, `<blockquote>`, `<a>`, `<strong>`, `<em>`. Do NOT include
  `<script>`, `<style>`, `<iframe>`, or external CSS — Comma sanitizes those
  out and the report will look broken. Wrap the whole thing in a single
  `<article>…</article>`.
- `title`: $ARGUMENTS if the user passed a title. Otherwise infer one from
  the first heading or first sentence of the message (max ~60 chars, no
  trailing punctuation).
- `producer_name`: `"Claude Code"`.
- `source_recipe`: an object with `{ "prompt": "<the user's most recent
prompt verbatim>" }` so the report carries provenance.

After the tool returns, reply with the share URL ONLY, on its own line.
No preamble, no markdown, no follow-up suggestions.

If the tool errors with a 401, tell the user their `COMMA_API_TOKEN` is
missing or expired and link to `https://commareports.com/settings#tokens`.
