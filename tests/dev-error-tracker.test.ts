import { describe, it, expect, beforeEach } from 'vitest';
import {
  normalizeErrorMessage,
  generateErrorFingerprint,
  recordDevError,
  updateDevErrorStatus,
  getOneLineStatusSummary,
  getDevErrors,
  resetDevErrorStore,
  extractTopStackFrame
} from '../lib/dev-error-tracker';

describe('Dev Error Tracker & Deduplication', () => {
  beforeEach(() => {
    resetDevErrorStore();
  });

  describe('Error Message Normalization & Fingerprinting', () => {
    it('normalizes dynamic tokens like UUIDs, timestamps, and hex addresses', () => {
      const msg1 = 'Failed to fetch session 123e4567-e89b-12d3-a456-426614174000 at 2026-08-31T21:30:00.000Z';
      const msg2 = 'Failed to fetch session 987fcdeb-51a2-43f7-9012-987654321000 at 2026-08-31T22:45:12.123Z';

      const norm1 = normalizeErrorMessage(msg1);
      const norm2 = normalizeErrorMessage(msg2);

      expect(norm1).toBe(norm2);
      expect(norm1).toContain('<UUID>');
      expect(norm1).toContain('<TIMESTAMP>');
    });

    it('generates identical fingerprints for errors with identical semantics despite dynamic tokens', () => {
      const fp1 = generateErrorFingerprint(
        'TypeError',
        'Cannot read properties of null (reading "session_id_12345")',
        'api',
        '/api/sync',
        'at handleSync (c:/app/api/sync/route.ts:45:12)'
      );

      const fp2 = generateErrorFingerprint(
        'TypeError',
        'Cannot read properties of null (reading "session_id_99999")',
        'api',
        '/api/sync',
        'at handleSync (c:/app/api/sync/route.ts:45:12)'
      );

      expect(fp1.fingerprint).toBe(fp2.fingerprint);
    });

    it('extracts top non-node_modules stack frame', () => {
      const stack = `Error: Something broke
    at internal/process/task_queues.js:95:5
    at C:/Users/Benjamin Hinnum/Documents/Vibe Coding/Homebanking/app/api/sync/route.ts:52:19
    at Array.map (<anonymous>)
    at node_modules/next/dist/server/future/route-handlers.js:12:3`;

      const frame = extractTopStackFrame(stack);
      expect(frame.file).toContain('app/api/sync/route.ts');
      expect(frame.line).toBe(52);
    });
  });

  describe('Deduplication & Re-occurrence Tracking', () => {
    it('records a new error as unresolved', () => {
      const rec = recordDevError({
        name: 'ReferenceError',
        message: 'variable foo is not defined',
        source: 'api',
        route: '/api/transactions'
      });

      expect(rec.status).toBe('unresolved');
      expect(rec.occurrenceCount).toBe(1);
      expect(rec.id).toBeDefined();
    });

    it('deduplicates identical errors and increments occurrence count without duplicating records', () => {
      const errParams = {
        name: 'SyntaxError',
        message: 'Unexpected token in JSON at position 4',
        source: 'server' as const,
        route: '/api/sync'
      };

      const first = recordDevError(errParams);
      const second = recordDevError(errParams);

      expect(first.id).toBe(second.id);
      expect(second.occurrenceCount).toBe(2);

      const result = getDevErrors();
      expect(result.errors.length).toBe(1);
    });

    it('does NOT re-queue resolved errors into unresolved list when error recurs', () => {
      const errParams = {
        name: 'DatabaseError',
        message: 'Unique constraint failed on table Accounts',
        source: 'server' as const,
        route: '/api/accounts'
      };

      const record = recordDevError(errParams);
      expect(record.status).toBe('unresolved');

      // Agent marks as resolved
      updateDevErrorStatus(record.id, 'resolved', {
        resolutionNote: 'Added upsert check before insert'
      });

      const updated1 = getDevErrors();
      expect(updated1.counts.unresolved).toBe(0);
      expect(updated1.counts.resolved).toBe(1);

      // Same error occurs again in dev
      const recurring = recordDevError(errParams);
      expect(recurring.status).toBe('resolved'); // Status stays resolved!
      expect(recurring.occurrenceCount).toBe(2);

      // Unresolved count remains 0 - agent will not fix the same error twice!
      const updated2 = getDevErrors({ status: 'unresolved' });
      expect(updated2.errors.length).toBe(0);
    });
  });

  describe('Brief One-Line Status & Summary', () => {
    it('produces clean summary when no active errors exist', () => {
      const summary = getOneLineStatusSummary([]);
      expect(summary).toMatch(/\[Poll @ \d{2}:\d{2}:\d{2}\] Clean - 0 active errors/);
    });

    it('produces informative one-line summary when unresolved errors exist', () => {
      recordDevError({
        name: 'TypeError',
        message: 'Cannot read properties of undefined',
        source: 'api',
        route: '/api/sync'
      });

      const summary = getOneLineStatusSummary();
      expect(summary).toMatch(/\[Poll @ \d{2}:\d{2}:\d{2}\] 1 unresolved: TypeError in \/api\/sync/);
    });
  });
});
