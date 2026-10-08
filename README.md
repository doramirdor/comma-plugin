# Comma plugin for Claude Code

Publish, search, and link to [Comma](https://commareports.com) reports
without leaving your Claude Code session — plus an interactive review
flow that feeds your anchored comments back to Claude as structured
feedback.

> **This repository is an auto-published mirror.** The source of truth
> lives in the main Comma repository (private) and a GitHub Action
> pushes changes here. Issues and pull requests opened here won't be
> seen — report problems via <https://commareports.com/contact>.

## Install (one line)

```bash
curl -fsSL https://commareports.com/install.sh | bash
```

Windows (PowerShell):

```powershell
iwr -useb https://commareports.com/install.ps1 | iex
```

## Manual install

```bash
# 1. Add the marketplace (this repo)
claude plugin marketplace add doramirdor/comma-plugin

# 2. Install the plugin
claude plugin install comma@comma

# 3. Export your token (put this in your shell profile)
export COMMA_API_TOKEN=comma_sk_your_token_here
```

Mint a token at <https://commareports.com/settings?section=tokens> — it starts
with `comma_sk_`. Restart Claude Code after installing so it picks up
the plugin's MCP attachment.

## What you get

| Command                        | What it does                                                                        |
| ------------------------------ | ----------------------------------------------------------------------------------- |
| `/comma-publish [title]`       | Publishes the assistant's most recent reply as an HTML report and returns the URL.  |
| `/comma-publish-last [title]`  | Alias for `/comma-publish`.                                                          |
| `/comma-search <query>`        | Full-text searches your existing reports.                                            |
| `/comma-routine [description]` | Lists your routines, or sets up a scheduled routine on a report.                      |
| `/comma-link <report_id>`      | Resolves a report id to its title + share URL.                                       |
| `/comma-review <file>`         | Opens a file in your browser for anchored comments, then feeds them back to Claude.  |

Plus the `publish-as-report` skill, which triggers automatically on
natural-language publish intent ("share this as a report"), and an MCP
attachment to the hosted server at `https://commareports.com/api/mcp` —
full tool table at <https://commareports.com/docs/mcp>.

## Docs

- Quickstart: <https://commareports.com/docs/quickstart>
- Claude Code setup: <https://commareports.com/mcp/claude-code>
- Plugin docs: <https://commareports.com/docs/claude-code-plugin>

## License

MIT.
