---
description: List or create a Comma routine (a report that re-runs on a schedule).
argument-hint: [describe what to monitor]
allowed-tools: mcp__plugin_comma_comma__list_routines, mcp__comma__list_routines, mcp__plugin_comma_comma__list_reports, mcp__comma__list_reports, mcp__plugin_comma_comma__list_skills, mcp__comma__list_skills, mcp__plugin_comma_comma__create_routine, mcp__comma__create_routine
---

## Comma routine

A Comma routine re-runs on a cron schedule against an existing report,
either by running one of the user's Comma skills (`skill_id`) or by calling
their webhook (`trigger_url`). The tools below are the Comma MCP server's
(`mcp__plugin_comma_comma__<tool>` via this plugin, `mcp__comma__<tool>` if
added with `claude mcp add comma`). There are two modes:

1. **No arguments** — call `list_routines` and show each routine's name,
   schedule and report. Then call `list_reports` with `limit: 10`, show the
   reports with their `share_url`, and ask which one they want a new
   routine on.

2. **With arguments** — the user is describing what to monitor. Ask which
   existing report should be the target (or whether to create one fresh
   with `/comma-publish` first) and confirm the cadence. Call `list_skills`
   so they can pick the skill to run, or ask for a webhook URL instead.
   Then call `create_routine` with `report_id`, a 5-field `schedule_cron`
   (e.g. `0 9 * * 1`), a short `name` taken from `$ARGUMENTS`, and either
   `skill_id` or `trigger_url`. Reply with the routine's name, schedule and
   the report's `share_url`.

If the user has neither a skill nor a webhook, tell them routines are set
up in the Comma dashboard at `https://commareports.com/dashboard` and stop.
