---
description: Alias for /comma-publish — publish the last assistant reply to Comma.
argument-hint: [optional title]
allowed-tools: mcp__comma__publish_report
---

## Publish last reply to Comma

This is an alias for `/comma-publish`. Follow the same flow:

1. Take the most recent assistant message in this conversation.
2. Call `mcp__comma__publish_report` with:
   - `html`: the message body rendered as minimal HTML (`<article>`, `<h1>`,
     `<h2>`, `<p>`, `<ul>`, `<pre><code>`, `<a>`, `<strong>`, `<em>` only —
     no scripts, styles, or iframes).
   - `title`: $ARGUMENTS if provided, otherwise inferred from the first
     heading or sentence (max ~60 chars).
   - `producer_name`: `"Claude Code"`.
   - `source_recipe`: `{ "prompt": "<the user's most recent prompt>" }`.
3. Reply with the returned share URL only, on its own line.
