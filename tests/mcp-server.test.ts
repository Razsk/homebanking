import { describe, it, expect, beforeEach } from 'vitest';
import { spawn } from 'child_process';
import path from 'path';
import { recordDevError, resetDevErrorStore } from '../lib/dev-error-tracker';

const SERVER_PATH = path.resolve(__dirname, '../scripts/mcp-dev-server.js');

function sendMcpRequest(requests: any[]): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [SERVER_PATH], {
      stdio: ['pipe', 'pipe', 'inherit'],
      env: { ...process.env, NODE_ENV: 'development' }
    });

    const responses: any[] = [];
    let buffer = '';

    child.stdout.on('data', (data) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (line.trim()) {
          try {
            responses.push(JSON.parse(line.trim()));
          } catch (e) {
            // Non-JSON line
          }
        }
      }
    });

    for (const req of requests) {
      child.stdin.write(JSON.stringify(req) + '\n');
    }

    setTimeout(() => {
      child.stdin.end();
      child.kill();
      resolve(responses);
    }, 1500);
  });
}

describe('MCP Dev Server Protocol & Tools', () => {
  beforeEach(() => {
    resetDevErrorStore();
  });

  it('handles initialize and tools/list requests', async () => {
    const responses = await sendMcpRequest([
      { jsonrpc: '2.0', id: 1, method: 'initialize', params: {} },
      { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }
    ]);

    const initRes = responses.find((r) => r.id === 1);
    expect(initRes).toBeDefined();
    expect(initRes.result.serverInfo.name).toBe('homebanking-dev-errors');

    const toolsRes = responses.find((r) => r.id === 2);
    expect(toolsRes).toBeDefined();
    const toolNames = toolsRes.result.tools.map((t: any) => t.name);
    expect(toolNames).toContain('poll_dev_errors');
    expect(toolNames).toContain('get_error_details');
    expect(toolNames).toContain('mark_error_status');
    expect(toolNames).toContain('trigger_auto_deploy');
    expect(toolNames).toContain('verify_fix');
    expect(toolNames).toContain('get_error_stats');
  });

  it('polls errors and returns brief one-line status and deduplicated details', async () => {
    // Record sample dev error
    const err = recordDevError({
      name: 'TypeError',
      message: 'Cannot read property "iban" of undefined',
      source: 'api',
      route: '/api/transactions',
      stack: 'at getTransactions (c:/app/api/transactions/route.ts:25:10)'
    });

    const responses = await sendMcpRequest([
      {
        jsonrpc: '2.0',
        id: 10,
        method: 'tools/call',
        params: {
          name: 'poll_dev_errors',
          arguments: { status: 'unresolved' }
        }
      },
      {
        jsonrpc: '2.0',
        id: 11,
        method: 'tools/call',
        params: {
          name: 'get_error_details',
          arguments: { errorId: err.id }
        }
      }
    ]);

    const pollRes = responses.find((r) => r.id === 10);
    expect(pollRes).toBeDefined();
    const pollContent = JSON.parse(pollRes.result.content[0].text);
    expect(pollContent.summary).toMatch(/\[Poll @ \d{2}:\d{2}:\d{2}\] 1 unresolved/);
    expect(pollContent.errors.length).toBe(1);
    expect(pollContent.errors[0].id).toBe(err.id);
    expect(pollContent.adaptivePolling).toBeDefined();
    expect(pollContent.adaptivePolling.tier).toBe('active_fixing');
    expect(pollContent.adaptivePolling.recommendedIntervalSeconds).toBe(60);

    const detailsRes = responses.find((r) => r.id === 11);
    expect(detailsRes).toBeDefined();
    const detailsContent = JSON.parse(detailsRes.result.content[0].text);
    expect(detailsContent.error.message).toContain('iban');
  });

  it('marks error as resolved and confirms deduplication in stats', async () => {
    const err = recordDevError({
      name: 'PrismaClientValidationError',
      message: 'Missing required argument: data.amount',
      source: 'server',
      route: '/api/transactions'
    });

    const responses = await sendMcpRequest([
      {
        jsonrpc: '2.0',
        id: 20,
        method: 'tools/call',
        params: {
          name: 'mark_error_status',
          arguments: {
            errorId: err.id,
            status: 'resolved',
            resolutionNote: 'Added fallback amount check'
          }
        }
      },
      {
        jsonrpc: '2.0',
        id: 21,
        method: 'tools/call',
        params: {
          name: 'get_error_stats',
          arguments: {}
        }
      }
    ]);

    const markRes = responses.find((r) => r.id === 20);
    expect(markRes).toBeDefined();
    const markContent = JSON.parse(markRes.result.content[0].text);
    expect(markContent.success).toBe(true);
    expect(markContent.updatedRecord.status).toBe('resolved');

    const statsRes = responses.find((r) => r.id === 21);
    expect(statsRes).toBeDefined();
    const statsContent = JSON.parse(statsRes.result.content[0].text);
    expect(statsContent.counts.resolved).toBe(1);
    expect(statsContent.counts.unresolved).toBe(0);
  });
});
