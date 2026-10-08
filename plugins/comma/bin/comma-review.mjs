#!/usr/bin/env node
// comma-review — Claude Code slash-command helper.
//
// Usage (typically invoked from the /comma-review slash command, not by hand):
//   node comma-review.mjs <html-file> [--title=…] [--source=…]
//
// Pipeline:
//   1. Read the HTML at <html-file> from disk.
//   2. POST it to {COMMA_API_BASE}/api/v1/reviews with the user's Bearer
//      token, getting back { session_id, report_id, review_url }.
//   3. Open the review_url in the user's default browser.
//   4. Poll /api/v1/reviews/:session_id every 2s until status flips to
//      'submitted' (or the user kills the process / it times out).
//   5. Fetch every comment + reply on the report via
//      /api/v1/reports/:report_id/comments and serialize them as a markdown
//      feedback block for the agent to read.
//   6. Print the feedback block to stdout. The slash command captures stdout
//      and injects it back into the conversation.
//
// Env:
//   COMMA_API_TOKEN  (required)  Personal API token, comma_sk_…
//   COMMA_API_BASE   (optional)  Defaults to https://commareports.com. Set to
//                                http://localhost:8080 for local dev.
//   COMMA_REVIEW_TIMEOUT_MS (optional)  Hard ceiling on the poll loop.
//                                Defaults to 1 hour. Set to 0 to disable.
//
// Exit codes:
//   0 = success, feedback printed to stdout
//   1 = user error (missing token, bad args, file not found, HTTP 4xx)
//   2 = server / network error (HTTP 5xx, repeated failures)
//   3 = session cancelled or timed out
import { readFile } from "node:fs/promises";
import { basename, resolve as resolvePath } from "node:path";
import { spawn } from "node:child_process";
import { platform } from "node:os";

const API_BASE = (process.env.COMMA_API_BASE ?? "https://commareports.com").replace(/\/+$/, "");
const API_TOKEN = process.env.COMMA_API_TOKEN;
const DEFAULT_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour

/**
 * Stepped backoff for the poll loop. Most reviews complete within a few
 * minutes, but the upper bound is "until the user gets to their browser",
 * which can be hours. We start fast (2s) so a quick review feels snappy,
 * then escalate so a long-running review doesn't bombard the server. Caps
 * at 15s, matching the feedback in the V1 review:
 *
 *   elapsed < 30s   → 2s
 *   elapsed < 120s  → 5s
 *   elapsed < 600s  → 10s
 *   elapsed ≥ 600s  → 15s
 */
function pollIntervalFor(elapsedMs) {
  if (elapsedMs < 30_000) return 2_000;
  if (elapsedMs < 120_000) return 5_000;
  if (elapsedMs < 600_000) return 10_000;
  return 15_000;
}
const TIMEOUT_MS = (() => {
  const raw = process.env.COMMA_REVIEW_TIMEOUT_MS;
  if (raw === undefined) return DEFAULT_TIMEOUT_MS;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_TIMEOUT_MS;
})();

function die(code, message) {
  // Use stderr so the slash command's captured stdout stays clean for the
  // feedback block. Claude Code surfaces stderr in the tool output panel.
  process.stderr.write(`comma-review: ${message}\n`);
  process.exit(code);
}

/** Minimal argv parser: positional file path + `--key=value` flags. */
function parseArgs(argv) {
  const flags = {};
  const positional = [];
  for (const a of argv) {
    if (a.startsWith("--")) {
      const eq = a.indexOf("=");
      if (eq === -1) flags[a.slice(2)] = "true";
      else flags[a.slice(2, eq)] = a.slice(eq + 1);
    } else {
      positional.push(a);
    }
  }
  return { flags, positional };
}

async function api(method, path, body) {
  const url = `${API_BASE}${path}`;
  const init = {
    method,
    headers: {
      authorization: `Bearer ${API_TOKEN}`,
      accept: "application/json",
    },
  };
  if (body !== undefined) {
    init.headers["content-type"] = "application/json";
    init.body = JSON.stringify(body);
  }
  const res = await fetch(url, init);
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // Non-JSON body (HTML error page from a misconfigured base URL, etc.).
    // Surface the raw text so the caller can debug.
  }
  return { ok: res.ok, status: res.status, json, text };
}

/**
 * Best-effort browser launch. Failure is non-fatal — we always print the URL
 * before opening, so the user can copy/paste if the open fails (locked-down
 * machines, headless environments, etc.).
 */
function openInBrowser(url) {
  // review_url is taken from the API response, so validate it before handing it
  // to the OS opener. Restrict to http(s) and pass the parsed, percent-encoded
  // href — and never launch through a shell. The old code used `shell: true` on
  // Windows (start via cmd.exe), where a review_url containing `&`/`|`/`%VAR%`
  // would have executed arbitrary commands on the reviewer's machine.
  let safe;
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return;
    safe = u.href;
  } catch {
    return;
  }
  const plat = platform();
  try {
    let child;
    if (plat === "win32") {
      // rundll32 opens the default browser directly — no cmd.exe, no shell to
      // inject into. The URL is a single, already-encoded argument.
      child = spawn("rundll32", ["url.dll,FileProtocolHandler", safe], {
        stdio: "ignore",
        detached: true,
      });
    } else {
      const cmd = plat === "darwin" ? "open" : "xdg-open";
      child = spawn(cmd, [safe], { stdio: "ignore", detached: true });
    }
    child.on("error", () => {
      // Ignore — user can click the printed URL.
    });
    child.unref();
  } catch {
    // Same.
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function escapeMarkdown(s) {
  // We only need to neutralize backticks (would break the fenced quote of
  // comment bodies) and stray angle brackets. Keep this conservative — over-
  // escaping makes the feedback hard to read for the agent.
  return s.replace(/`/g, "\\`");
}

/**
 * Format the list of comments into a single feedback block that Claude can
 * read as if the user typed it. Anchored comments lead with the anchor text
 * (so the agent knows WHICH part of the report each comment refers to);
 * general comments are grouped under a "General feedback" heading.
 */
function formatFeedback(sourceLabel, comments) {
  // Skip comments the reviewer already resolved in the UI before clicking
  // submit. The schema carries open/resolved per-comment; dragging resolved
  // ones into the agent's context just creates noise.
  const open = comments.filter((c) => c.status !== "resolved");
  const anchored = [];
  const general = [];
  for (const c of open) {
    if (c.anchor && typeof c.anchor.text === "string" && c.anchor.text.trim()) {
      anchored.push(c);
    } else {
      general.push(c);
    }
  }
  const lines = [];
  lines.push(`# Review feedback on ${sourceLabel}`);
  lines.push("");
  if (!anchored.length && !general.length) {
    lines.push("_(No comments left — the reviewer submitted without changes.)_");
    return lines.join("\n");
  }
  if (anchored.length) {
    lines.push(`## Anchored comments (${anchored.length})`);
    lines.push("");
    for (const c of anchored) {
      const anchor = escapeMarkdown(c.anchor.text.trim());
      lines.push(`### On: \`${anchor}\``);
      lines.push("");
      lines.push(c.body.trim());
      lines.push("");
      for (const r of c.replies ?? []) {
        const author = r.author?.name?.trim() || "Reviewer";
        lines.push(`> **${author}:** ${r.body.trim()}`);
        lines.push("");
      }
    }
  }
  if (general.length) {
    lines.push(`## General feedback (${general.length})`);
    lines.push("");
    for (const c of general) {
      lines.push(`- ${c.body.trim()}`);
      for (const r of c.replies ?? []) {
        const author = r.author?.name?.trim() || "Reviewer";
        lines.push(`  - **${author}:** ${r.body.trim()}`);
      }
    }
    lines.push("");
  }
  lines.push("---");
  lines.push("");
  lines.push(
    "Address each anchored comment by editing the file directly. Reply to general feedback inline.",
  );
  return lines.join("\n");
}

async function main() {
  if (!API_TOKEN) {
    die(
      1,
      "COMMA_API_TOKEN is not set. Get one at https://commareports.com/settings?section=tokens",
    );
  }
  const { flags, positional } = parseArgs(process.argv.slice(2));
  if (positional.length === 0) {
    die(1, "Usage: comma-review <html-file> [--title=…] [--source=…]");
  }
  const filePath = resolvePath(positional[0]);
  let html;
  try {
    html = await readFile(filePath, "utf8");
  } catch (err) {
    die(1, `Could not read ${filePath}: ${err.message}`);
  }
  if (!html.trim()) die(1, `${filePath} is empty.`);

  const title = flags.title?.trim() || basename(filePath);
  const sourceFile = flags.source?.trim() || filePath;

  // 1. Create the review session.
  process.stderr.write("comma-review: uploading file…\n");
  const create = await api("POST", "/api/v1/reviews", {
    html,
    title,
    source_file: sourceFile,
  });
  if (!create.ok) {
    const msg = create.json?.error ?? create.text ?? `HTTP ${create.status}`;
    die(create.status >= 500 ? 2 : 1, `Could not create review session: ${msg}`);
  }
  const { session_id, report_id, review_url } = create.json;
  if (!session_id || !report_id || !review_url) {
    die(2, `Unexpected response from /api/v1/reviews: ${create.text}`);
  }

  // 2. Open the browser, but always print the URL too — locked-down machines
  // might not have an opener, and the URL is the only fallback.
  process.stderr.write(`comma-review: opening ${review_url}\n`);
  process.stderr.write(
    "comma-review: leave comments in the browser, then click 'Submit feedback to Claude Code'.\n",
  );
  openInBrowser(review_url);

  // 3. Poll until submitted / cancelled / timed out.
  const startedAt = Date.now();
  let consecutiveErrors = 0;
  // We don't pre-announce "still waiting" updates — Claude Code's slash-
  // command surface already shows the tool as running. Stderr stays quiet
  // unless something goes wrong.
  while (true) {
    const elapsed = Date.now() - startedAt;
    if (TIMEOUT_MS > 0 && elapsed > TIMEOUT_MS) {
      die(
        3,
        `Timed out after ${Math.round(TIMEOUT_MS / 60000)} minutes with no submission. ` +
          `Re-run /comma-review when you're ready.`,
      );
    }
    await sleep(pollIntervalFor(elapsed));
    const poll = await api("GET", `/api/v1/reviews/${session_id}`);
    if (!poll.ok) {
      consecutiveErrors += 1;
      // Tolerate a handful of transient failures (Cloudflare blips, lossy
      // wifi). Anything beyond ~30s of solid failure means something real
      // is broken — bail with the last error.
      if (consecutiveErrors >= 15) {
        const msg = poll.json?.error ?? poll.text ?? `HTTP ${poll.status}`;
        die(2, `Lost contact with /api/v1/reviews/${session_id}: ${msg}`);
      }
      continue;
    }
    consecutiveErrors = 0;
    const status = poll.json?.status;
    if (status === "submitted") break;
    if (status === "cancelled") {
      die(3, "Review session was cancelled. Re-run /comma-review when you're ready.");
    }
  }

  // 4. Fetch the comments. The list endpoint paginates — for V1 we cap at
  // one page (200 comments) which is far more than any human review will
  // produce. Paginate later if it bites.
  const fetchComments = await api("GET", `/api/v1/reports/${report_id}/comments?limit=200`);
  if (!fetchComments.ok) {
    const msg = fetchComments.json?.error ?? fetchComments.text ?? `HTTP ${fetchComments.status}`;
    die(2, `Could not fetch comments for report ${report_id}: ${msg}`);
  }
  const comments = fetchComments.json?.comments ?? [];

  // 5. Print the feedback block. The slash command treats stdout as the
  // user-side feedback message Claude reads next.
  process.stdout.write(formatFeedback(sourceFile, comments));
  process.stdout.write("\n");
}

main().catch((err) => {
  die(2, err?.stack ?? String(err));
});
