---
description: List or create a Comma routine (scheduled report) — wraps request_review.
argument-hint: [describe what to monitor]
allowed-tools: mcp__comma__search_reports, mcp__comma__request_review
---

## Comma routine

Comma routines are recurring reviews of an existing report. There are
two modes:

1. **No arguments** — list the user's most recent reports so they can pick
   one to put on a routine. Call `mcp__comma__search_reports` with an
   empty `query` and show the top 10 with their share URLs. Then ask which
   one they want a routine on.

2. **With arguments** — the user is describing what to monitor. Ask which
   existing report should be the target (or whether to create one fresh
   with `/comma-publish` first), then call `mcp__comma__request_review`
   with that `report_id` and pass `$ARGUMENTS` as the `instructions`
   field. Reply with the review id and the report's share URL.

Do not invent a `routines` API surface — `request_review` is the closest
thing Comma exposes today. If the user explicitly asks for a cron-style
recurring routine, tell them that's set up in the Comma dashboard at
`https://commareports.com/dashboard` and stop.
