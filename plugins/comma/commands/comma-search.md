---
description: Search your Comma reports by title, description, or body text.
argument-hint: <query>
allowed-tools: mcp__plugin_comma_comma__search_reports, mcp__comma__search_reports
---

## Search Comma reports

Call the Comma MCP server's `search_reports` tool
(`mcp__plugin_comma_comma__search_reports` via this plugin,
`mcp__comma__search_reports` if added with `claude mcp add comma`) with
`query: "$ARGUMENTS"`. If `$ARGUMENTS` is empty, ask the user what to search
for and stop.

Render the results as a compact markdown list, one per line:

- `[<title>](<share_url>)` — `<description, or the first 80 chars of
snippet>`

If there are no results, say so in one line and suggest the user broaden
the query. Do not call any other tools.
