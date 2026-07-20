---
description: Search your Comma reports by title, description, or body text.
argument-hint: <query>
allowed-tools: mcp__comma__search_reports
---

## Search Comma reports

Call `mcp__comma__search_reports` with `query: "$ARGUMENTS"`. If
`$ARGUMENTS` is empty, ask the user what to search for and stop.

Render the results as a compact markdown list, one per line:

- `[<title>](<share_url>)` — `<short description or first 80 chars of
body>` · `<relative date, e.g. "2d ago">`

If there are no results, say so in one line and suggest the user broaden
the query. Do not call any other tools.
