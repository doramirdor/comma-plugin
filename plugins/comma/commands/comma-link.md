---
description: Resolve a Comma report id to its share URL and metadata.
argument-hint: <report_id>
allowed-tools: mcp__plugin_comma_comma__get_report, mcp__comma__get_report
---

## Open a Comma report

Treat `$ARGUMENTS` as a report id (the part after `/p/` in a share URL).

1. Call the Comma MCP server's `get_report` tool
   (`mcp__plugin_comma_comma__get_report` via this plugin,
   `mcp__comma__get_report` if added with `claude mcp add comma`) with
   `id: "$ARGUMENTS"`.
2. Reply with three lines and nothing else:
   - line 1: the title
   - line 2: `share_url` from the result
   - line 3: the description (or empty if none)

If the lookup 404s, say "No report with id `<id>`" and stop. Do not call
`search_reports` to guess — id lookups should be exact.
