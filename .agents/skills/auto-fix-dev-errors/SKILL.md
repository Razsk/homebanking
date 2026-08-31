---
name: auto-fix-dev-errors
description: >-
  Polls development errors from the local MCP service, deduplicates repeats by fingerprint,
  applies automated fixes, verifies the fix, marks the error resolved, and triggers deploy updates.
---

# Auto-Fix Development Errors via MCP

Use this skill when polling or auto-fixing development errors exposed by the Homebanking dev MCP server.

## Workflow Loop

```
[Poll via MCP / API] -> [Output 1-Line Status] -> [If Errors: Inspect & Fix] -> [Verify Test] -> [Mark Resolved] -> [Deploy]
```

### 1. Poll Errors
Call MCP tool `poll_dev_errors` (or query `/api/dev/errors?status=unresolved`).
Output the brief one-line status after each poll:
- Example: `[Poll @ 21:30:15] 1 unresolved: TypeError in app/api/sync/route.ts:42 [fp:8f9b2a1c] | 3 resolved | 0 in progress`
- Example: `[Poll @ 21:35:00] Clean - 0 active errors | 4 resolved | 0 ignored`

### 2. Avoid Fixing the Same Error Twice
- Errors are assigned deterministic SHA-256 fingerprints based on error type, normalized message, file location, and stack frame.
- If an error has already been marked as `resolved` or `ignored`, repeat occurrences increment `occurrenceCount` and `lastSeenAt` without re-entering the unresolved queue.
- Only fix errors with status `unresolved`.

### 3. Diagnose & Fix
- Retrieve full stack and context with MCP tool `get_error_details(errorId)`.
- Mark status as `in_progress` using `mark_error_status(errorId, "in_progress")`.
- Identify the root cause in source files and apply minimal, robust fixes.

### 4. Verify Fix
- Run test suite with MCP tool `verify_fix` or `npm test`.

### 5. Mark Resolved & Prevent Repeats
- Call `mark_error_status(errorId, "resolved", resolutionNote="Fixed null pointer check in...")`.
- The error fingerprint is permanently recorded as resolved to prevent duplicate fixing runs.

### 6. Auto-Deploy Updates
- Call MCP tool `trigger_auto_deploy` to run `python scripts/build_dist.py` and `python scripts/deploy_dist.py`.
