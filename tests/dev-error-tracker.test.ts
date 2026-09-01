import { describe, it, expect, beforeEach } from 'vitest';
import {
  normalizeErrorMessage,
  generateErrorFingerprint,
  recordDevError,
  updateDevErrorStatus,
  getOneLineStatusSummary,
  getDevErrors,
  resetDevErrorStore,
  extractTopStackFrame,
  pollDevErrors,
  getAdaptivePollAdvice
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

  describe('Adaptive Polling & Frequency Backoff', () => {
    it('uses active fixing tier (60s) when unresolved errors exist', () => {
      recordDevError({
        name: 'TypeError',
        message: 'Cannot read property id',
        source: 'api'
      });

      const advice = getAdaptivePollAdvice();
      expect(advice.tier).toBe('active_fixing');
      expect(advice.recommendedIntervalSeconds).toBe(60);
      expect(advice.shouldStop).toBe(false);
    });

    it('backs off polling interval through tiers as consecutive clean polls increase', () => {
      // Clean poll 1 (1st clean poll -> standard tier: 120s)
      let poll1 = pollDevErrors();
      expect(poll1.adaptivePolling.tier).toBe('standard');
      expect(poll1.adaptivePolling.recommendedIntervalSeconds).toBe(120);
      expect(poll1.adaptivePolling.consecutiveCleanPolls).toBe(1);
      expect(poll1.adaptivePolling.shouldStop).toBe(false);

      // Simulate 5 clean polls -> low_activity tier (300s)
      for (let i = 0; i < 4; i++) {
        pollDevErrors();
      }
      let poll5 = pollDevErrors(); // 6 total
      expect(poll5.adaptivePolling.tier).toBe('low_activity');
      expect(poll5.adaptivePolling.recommendedIntervalSeconds).toBe(300);
      expect(poll5.adaptivePolling.shouldStop).toBe(false);

      // Simulate 10 total clean polls -> idle_backoff tier (900s / 15m)
      for (let i = 0; i < 4; i++) {
        pollDevErrors();
      }
      let poll10 = pollDevErrors(); // 11 total
      expect(poll10.adaptivePolling.tier).toBe('idle_backoff');
      expect(poll10.adaptivePolling.recommendedIntervalSeconds).toBe(900);
      expect(poll10.adaptivePolling.shouldStop).toBe(false);

      // Simulate 16+ clean polls -> hibernating (0s, shouldStop: true)
      for (let i = 0; i < 6; i++) {
        pollDevErrors();
      }
      let poll16 = pollDevErrors();
      expect(poll16.adaptivePolling.tier).toBe('hibernating');
      expect(poll16.adaptivePolling.recommendedIntervalSeconds).toBe(0);
      expect(poll16.adaptivePolling.shouldStop).toBe(true);
      expect(poll16.adaptivePolling.reason).toContain('stable');
    });

    it('resets backoff immediately when a new error occurs after hibernation', () => {
      // Simulate 20 clean polls (hibernated)
      for (let i = 0; i < 20; i++) {
        pollDevErrors();
      }
      let before = pollDevErrors();
      expect(before.adaptivePolling.shouldStop).toBe(true);

      // A new error occurs in dev
      recordDevError({
        name: 'SyntaxError',
        message: 'Unexpected token',
        source: 'client'
      });

      const after = pollDevErrors();
      expect(after.adaptivePolling.tier).toBe('active_fixing');
      expect(after.adaptivePolling.recommendedIntervalSeconds).toBe(60);
      expect(after.adaptivePolling.consecutiveCleanPolls).toBe(0);
      expect(after.adaptivePolling.shouldStop).toBe(false);
    });
  });
});
