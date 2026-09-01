---
name: auto-fix-dev-errors
description: >-
  Polls development errors from the local MCP service, deduplicates repeats by fingerprint,
  applies automated fixes, verifies the fix, marks the error resolved, and triggers deploy updates.
---

# Auto-Fix Development Errors via MCP

Use this skill when polling or auto-fixing development errors exposed by the Homebanking dev MCP server.

## Adaptive Polling Workflow

```
[Poll via MCP] -> [Inspect Adaptive Advice] -> [If Errors: Fix, Verify & Deploy] -> [If Clean: Adapt Frequency or Hibernate]
```

### 1. Adaptive Frequency Tiers
The MCP tool `poll_dev_errors` dynamically returns an `adaptivePolling` object:

| Tier | Condition | Interval | Action |
| :--- | :--- | :--- | :--- |
| `active_fixing` | Unresolved or In-Progress errors exist | 60s (1m) | Actively poll, diagnose, and fix. |
| `standard` | 1–3 consecutive clean polls | 120s (2m) | Normal active dev monitoring. |
| `low_activity` | 4–8 consecutive clean polls | 300s (5m) | Back off polling frequency. |
| `idle_backoff` | 9–15 consecutive clean polls | 900s (15m) | Environment stable, low frequency. |
| `hibernating` | >15 consecutive clean polls | 0s (stop) | Stop polling until next error or modification. |

### 2. Outputting Brief Status
- On each poll, output the concise one-line status (e.g. `[Poll @ 07:30:00] Clean - 0 active errors | 3 resolved | 0 ignored`).
- If `adaptivePolling.shouldStop` is true, notify the user that polling is hibernating:
  `[Poll] System healthy and stable (15+ clean polls). Polling hibernated.`

### 3. Avoid Fixing the Same Error Twice
- Errors are assigned deterministic SHA-256 fingerprints based on error type, normalized message, file location, and stack frame.
- If an error has already been marked as `resolved` or `ignored`, repeat occurrences increment `occurrenceCount` and `lastSeenAt` without re-entering the unresolved queue.
- Only fix errors with status `unresolved`.

### 4. Diagnose & Fix
- Retrieve full stack and context with MCP tool `get_error_details(errorId)`.
- Mark status as `in_progress` using `mark_error_status(errorId, "in_progress")`.
- Identify the root cause in source files and apply minimal, robust fixes.

### 5. Verify Fix
- Run test suite with MCP tool `verify_fix` or `npm test`.

### 6. Mark Resolved & Auto-Deploy
- Call `mark_error_status(errorId, "resolved", resolutionNote="Fixed null pointer check in...")`.
- Call MCP tool `trigger_auto_deploy` to run `python scripts/build_dist.py` and `python scripts/deploy_dist.py`.
