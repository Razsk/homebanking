#!/usr/bin/env node

/**
 * MCP (Model Context Protocol) Dev Error Monitoring & Auto-Fix Server
 * Exposes development errors, deduplication state, and deploy pipeline to Google Antigravity.
 * Communication: JSON-RPC 2.0 over stdio (MCP standard).
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync, spawn } = require('child_process');
const readline = require('readline');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const STORE_PATH = path.join(PROJECT_ROOT, '.dev_errors.json');

// --- Error Tracker Utilities ---

function readErrorStore() {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.errors)) {
        return data;
      }
    }
  } catch (err) {
    console.error('[MCP Dev Server] Error reading store:', err.message);
  }
  return { version: 1, errors: [] };
}

function writeErrorStore(data) {
  try {
    const tempPath = `${STORE_PATH}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, STORE_PATH);
  } catch (err) {
    console.error('[MCP Dev Server] Error writing store:', err.message);
  }
}

function getOneLineStatusSummary(errors) {
  const all = errors || readErrorStore().errors;
  const unresolved = all.filter((e) => e.status === 'unresolved');
  const inProgress = all.filter((e) => e.status === 'in_progress');
  const resolved = all.filter((e) => e.status === 'resolved');
  const ignored = all.filter((e) => e.status === 'ignored');

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-GB', { hour12: false });

  if (unresolved.length === 0 && inProgress.length === 0) {
    return `[Poll @ ${timeStr}] Clean - 0 active errors | ${resolved.length} resolved | ${ignored.length} ignored`;
  }

  if (unresolved.length > 0) {
    const top = unresolved[0];
    const location = top.file ? `${top.file}${top.line ? `:${top.line}` : ''}` : (top.route || top.source || 'app');
    const extra = unresolved.length > 1 ? ` (+${unresolved.length - 1} more)` : '';
    return `[Poll @ ${timeStr}] ${unresolved.length} unresolved: ${top.name} in ${location}${extra} [fp:${top.fingerprint}] | ${resolved.length} resolved | ${inProgress.length} in progress`;
  }

  return `[Poll @ ${timeStr}] ${inProgress.length} in-progress fixes | ${resolved.length} resolved | 0 unresolved`;
}

// --- MCP Tool Handlers ---

const TOOLS = [
  {
    name: 'poll_dev_errors',
    description:
      'Poll for development errors captured in dev mode. Returns a brief one-line status summary and a list of unresolved errors waiting to be fixed. Excludes already resolved or ignored errors to prevent fixing duplicates.',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['unresolved', 'in_progress', 'active', 'resolved', 'ignored', 'all'],
          description: 'Filter by error status. Defaults to "unresolved" for active fixing.',
          default: 'unresolved'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of error records to return.',
          default: 10
        }
      }
    }
  },
  {
    name: 'get_error_details',
    description:
      'Retrieve full diagnostic details for a specific error (including stack trace, occurrence counts, first/last seen timestamps, and normalized fingerprint).',
    inputSchema: {
      type: 'object',
      properties: {
        errorId: {
          type: 'string',
          description: 'The unique error ID (e.g. err_...) or error fingerprint.'
        }
      },
      required: ['errorId']
    }
  },
  {
    name: 'mark_error_status',
    description:
      'Update the status of an error (e.g. mark "in_progress" while fixing, or "resolved" after applying code fixes). Resolved errors are permanently fingerprinted so the system avoids fixing the same error twice.',
    inputSchema: {
      type: 'object',
      properties: {
        errorId: {
          type: 'string',
          description: 'The unique error ID or error fingerprint.'
        },
        status: {
          type: 'string',
          enum: ['in_progress', 'resolved', 'ignored', 'unresolved'],
          description: 'New status for the error.'
        },
        resolutionNote: {
          type: 'string',
          description: 'Description of the fix applied or reason for ignoring.'
        }
      },
      required: ['errorId', 'status']
    }
  },
  {
    name: 'trigger_auto_deploy',
    description:
      'Builds the static distribution (python scripts/build_dist.py) and deploys updates to the public host (python scripts/deploy_dist.py).',
    inputSchema: {
      type: 'object',
      properties: {
        skipBuild: {
          type: 'boolean',
          description: 'If true, skips build_dist and only executes deploy.',
          default: false
        },
        buildOnly: {
          type: 'boolean',
          description: 'If true, only runs the build step without deploying to remote server.',
          default: false
        }
      }
    }
  },
  {
    name: 'verify_fix',
    description:
      'Runs the test suite (npm test / vitest) or a verification command to ensure the applied fix passes without introducing regressions.',
    inputSchema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'Verification command to run. Defaults to "npm test".',
          default: 'npm test'
        }
      }
    }
  },
  {
    name: 'get_error_stats',
    description:
      'Returns aggregate statistics regarding active errors, resolved errors, duplicate occurrences caught, and overall dev health.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'clear_resolved_errors',
    description:
      'Cleans up resolved or ignored errors from the store to keep the database compact.',
    inputSchema: {
      type: 'object',
      properties: {
        keepRecentDays: {
          type: 'number',
          description: 'Keep resolved errors from the last N days (0 = clear all resolved).',
          default: 0
        }
      }
    }
  }
];

async function handleToolCall(name, args) {
  const store = readErrorStore();
  const allErrors = store.errors;

  switch (name) {
    case 'poll_dev_errors': {
      const statusFilter = args.status || 'unresolved';
      const limit = typeof args.limit === 'number' ? args.limit : 10;

      let filtered = allErrors;
      if (statusFilter === 'active') {
        filtered = allErrors.filter((e) => e.status === 'unresolved' || e.status === 'in_progress');
      } else if (statusFilter !== 'all') {
        filtered = allErrors.filter((e) => e.status === statusFilter);
      }

      const oneLineSummary = getOneLineStatusSummary(allErrors);
      const topErrors = filtered.slice(0, limit).map((e) => ({
        id: e.id,
        fingerprint: e.fingerprint,
        name: e.name,
        message: e.message,
        source: e.source,
        file: e.file,
        line: e.line,
        route: e.route,
        status: e.status,
        occurrenceCount: e.occurrenceCount,
        lastSeenAt: e.lastSeenAt,
        fixAttempts: e.fixAttempts
      }));

      return {
        summary: oneLineSummary,
        filter: statusFilter,
        totalMatching: filtered.length,
        errors: topErrors,
        instruction:
          topErrors.length > 0
            ? 'Action: Choose an unresolved error, mark it as in_progress using mark_error_status, inspect details using get_error_details, apply code fix, verify with verify_fix, mark resolved, and deploy updates via trigger_auto_deploy.'
            : 'Status: Clean. No unresolved errors.'
      };
    }

    case 'get_error_details': {
      const { errorId } = args;
      const record = allErrors.find((e) => e.id === errorId || e.fingerprint === errorId);
      if (!record) {
        throw new Error(`Error record with ID or fingerprint "${errorId}" not found.`);
      }
      return {
        error: record,
        deduplicationNote: `Fingerprint ${record.fingerprint} tracks ${record.occurrenceCount} occurrences. Marking as resolved will prevent duplicate fixes.`
      };
    }

    case 'mark_error_status': {
      const { errorId, status, resolutionNote } = args;
      const record = allErrors.find((e) => e.id === errorId || e.fingerprint === errorId);
      if (!record) {
        throw new Error(`Error record with ID or fingerprint "${errorId}" not found.`);
      }

      record.status = status;
      if (status === 'in_progress') {
        record.fixAttempts = (record.fixAttempts || 0) + 1;
      } else if (status === 'resolved') {
        record.lastFixedAt = new Date().toISOString();
        if (resolutionNote) record.resolutionNote = resolutionNote;
      } else if (resolutionNote) {
        record.resolutionNote = resolutionNote;
      }

      writeErrorStore(store);

      return {
        success: true,
        summary: getOneLineStatusSummary(store.errors),
        updatedRecord: {
          id: record.id,
          fingerprint: record.fingerprint,
          status: record.status,
          fixAttempts: record.fixAttempts,
          resolutionNote: record.resolutionNote
        }
      };
    }

    case 'trigger_auto_deploy': {
      const { skipBuild, buildOnly } = args;
      const outputs = [];

      if (!skipBuild) {
        try {
          outputs.push('--- [1/2] Building distribution (python scripts/build_dist.py) ---');
          const buildOutput = execSync('python scripts/build_dist.py', {
            cwd: PROJECT_ROOT,
            encoding: 'utf-8',
            stdio: 'pipe'
          });
          outputs.push(buildOutput.trim());
        } catch (err) {
          throw new Error(`Build failed: ${err.stderr || err.message}`);
        }
      }

      if (!buildOnly) {
        try {
          outputs.push('--- [2/2] Deploying distribution (python scripts/deploy_dist.py) ---');
          const deployOutput = execSync('python scripts/deploy_dist.py', {
            cwd: PROJECT_ROOT,
            encoding: 'utf-8',
            stdio: 'pipe'
          });
          outputs.push(deployOutput.trim());
        } catch (err) {
          outputs.push(`Deploy attempt warning / error: ${err.stderr || err.message}`);
          return {
            success: false,
            message: 'Build completed, but remote deploy encountered an issue (check SSH keys / network access).',
            output: outputs.join('\n')
          };
        }
      }

      return {
        success: true,
        message: 'Build & Deploy completed successfully.',
        output: outputs.join('\n')
      };
    }

    case 'verify_fix': {
      const command = args.command || 'npm test';
      try {
        const testOutput = execSync(command, {
          cwd: PROJECT_ROOT,
          encoding: 'utf-8',
          stdio: 'pipe'
        });
        return {
          success: true,
          command,
          output: testOutput.trim()
        };
      } catch (err) {
        return {
          success: false,
          command,
          output: err.stdout || err.stderr || err.message
        };
      }
    }

    case 'get_error_stats': {
      const counts = {
        unresolved: allErrors.filter((e) => e.status === 'unresolved').length,
        inProgress: allErrors.filter((e) => e.status === 'in_progress').length,
        resolved: allErrors.filter((e) => e.status === 'resolved').length,
        ignored: allErrors.filter((e) => e.status === 'ignored').length,
        totalUniqueFingerprints: allErrors.length,
        totalOccurrences: allErrors.reduce((acc, e) => acc + (e.occurrenceCount || 1), 0)
      };

      const duplicatesAvoided = counts.totalOccurrences - counts.totalUniqueFingerprints;

      return {
        statusSummary: getOneLineStatusSummary(allErrors),
        counts,
        duplicatesAvoided,
        efficiencyRatio:
          counts.totalOccurrences > 0
            ? `${Math.round((duplicatesAvoided / counts.totalOccurrences) * 100)}% duplicate deduplication rate`
            : '100%'
      };
    }

    case 'clear_resolved_errors': {
      const before = store.errors.length;
      store.errors = store.errors.filter((e) => e.status === 'unresolved' || e.status === 'in_progress');
      writeErrorStore(store);
      return {
        cleared: before - store.errors.length,
        remaining: store.errors.length,
        summary: getOneLineStatusSummary(store.errors)
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// --- JSON-RPC 2.0 Transport via Stdio ---

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

function sendResponse(id, result, error) {
  const response = { jsonrpc: '2.0', id };
  if (error) {
    response.error = {
      code: error.code || -32603,
      message: error.message || 'Internal error',
      data: error.data
    };
  } else {
    response.result = result;
  }
  process.stdout.write(JSON.stringify(response) + '\n');
}

rl.on('line', async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  let request;
  try {
    request = JSON.parse(trimmed);
  } catch (err) {
    sendResponse(null, null, { code: -32700, message: 'Parse error' });
    return;
  }

  const { id, method, params } = request;

  try {
    switch (method) {
      case 'initialize': {
        sendResponse(id, {
          protocolVersion: '2024-11-05',
          serverInfo: {
            name: 'homebanking-dev-errors',
            version: '1.0.0'
          },
          capabilities: {
            tools: {},
            resources: {}
          }
        });
        break;
      }

      case 'notifications/initialized': {
        // Notification - no response needed
        break;
      }

      case 'ping': {
        sendResponse(id, {});
        break;
      }

      case 'tools/list': {
        sendResponse(id, { tools: TOOLS });
        break;
      }

      case 'tools/call': {
        const { name, arguments: toolArgs } = params || {};
        try {
          const toolResult = await handleToolCall(name, toolArgs || {});
          sendResponse(id, {
            content: [
              {
                type: 'text',
                text: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult, null, 2)
              }
            ]
          });
        } catch (toolErr) {
          sendResponse(id, {
            content: [
              {
                type: 'text',
                text: `Error executing ${name}: ${toolErr.message}`
              }
            ],
            isError: true
          });
        }
        break;
      }

      case 'resources/list': {
        sendResponse(id, { resources: [] });
        break;
      }

      default: {
        if (id !== undefined && id !== null) {
          sendResponse(id, null, { code: -32601, message: `Method not found: ${method}` });
        }
        break;
      }
    }
  } catch (err) {
    if (id !== undefined && id !== null) {
      sendResponse(id, null, { code: -32603, message: err.message });
    }
  }
});

console.error('[MCP Dev Server] Homebanking Dev Error & Auto-Fix MCP Server initialized on stdio.');
