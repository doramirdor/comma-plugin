---
description: Open an HTML or markdown file in Comma so the user can leave anchored comments, then read those comments back as structured feedback.
argument-hint: <file-path>
allowed-tools: Read, Write, Bash
---

## Review with Comma

Treat `$ARGUMENTS` as a path to a file the user wants to review and comment on. Typically this is an HTML report or a markdown document you just generated.

### Steps

1. **Read the file** at `$ARGUMENTS` with the Read tool.

2. **Resolve the upload format**:
   - If the path ends in `.html` or `.htm`: use the file content as-is. Set `UPLOAD_PATH=$ARGUMENTS`.
   - If the path ends in `.md` or `.markdown`: render the markdown to a minimal HTML shape — `<h1>`, `<h2>`, `<h3>`, `<p>`, `<ul>/<ol>/<li>`, `<pre><code>`, `<blockquote>`, `<a>`, `<strong>`, `<em>`, `<table>`. Wrap the whole document in a single `<article>…</article>`. Do NOT include `<script>`, `<style>`, `<iframe>`, or external CSS — Comma sanitizes those out and the review surface will look broken.
     - Write the rendered HTML to `/tmp/comma-review-<random>.html` using the Write tool, where `<random>` is any short unique token.
     - Set `UPLOAD_PATH` to that temp path.
   - Anything else: render its text content as a single `<article><pre>…</pre></article>` and write to `/tmp/comma-review-<random>.html`. Set `UPLOAD_PATH` to that path.

3. **Invoke the comma-review CLI** with the Bash tool. Pass the resolved `UPLOAD_PATH` as the positional arg, and use `--source="$ARGUMENTS"` so the feedback header references the original file the user typed:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/bin/comma-review.mjs" "<UPLOAD_PATH>" --source="$ARGUMENTS"
   ```

   This blocks while the user reviews in their browser and clicks "Submit feedback to Claude Code". It can take minutes — that's expected. Do not set a Bash timeout below 1 hour.

4. **Treat the CLI's stdout as the user's feedback.** It will be a markdown block starting with `# Review feedback on …`. Read it carefully:
   - Apply every anchored comment by editing `$ARGUMENTS` (the original file, not the temp HTML) to address the feedback at that anchor.
   - Address general feedback inline by editing where it makes sense.
   - After applying all edits, summarise in 2–4 bullets what you changed in response to each comment.

5. **If the CLI exits non-zero**, surface its stderr to the user verbatim. The most common causes:
   - `COMMA_API_TOKEN is not set` → link the user to https://commareports.com/settings#tokens to create one and add it to their shell env.
   - Timeout → re-run `/comma-review $ARGUMENTS` when they're ready.
   - Cancelled → the user closed the session; ask whether they want to retry.

### Notes

- The CLI uploads the file content as a private report on commareports.com and opens the user's browser to the review surface. The browser stays open until the user clicks **Submit feedback to Claude Code** — that's the signal that ends the CLI's poll loop and resumes this conversation.
- Anchored comments come back with the exact text excerpt they were anchored to. Use that to locate the right spot in the source file (not the rendered HTML — the user reviewed the HTML but expects you to edit the markdown/source).
- General feedback (no anchor) covers cross-cutting changes the user wants — re-run analyses, restructure sections, swap libraries, etc.
