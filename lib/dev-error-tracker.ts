import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export type ErrorStatus = 'unresolved' | 'in_progress' | 'resolved' | 'ignored';
export type ErrorSource = 'client' | 'server' | 'api' | 'build' | 'test' | 'unknown';
export type AdaptivePollTier = 'active_fixing' | 'standard' | 'low_activity' | 'idle_backoff' | 'hibernating';

export interface DevErrorRecord {
  id: string; // Unique ID (e.g. err_...)
  fingerprint: string; // SHA-256 hash of normalized error for deduplication
  name: string; // e.g. TypeError, SyntaxError
  message: string; // Original error message
  normalizedMessage: string; // Message stripped of dynamic tokens (IDs, timestamps, UUIDs)
  stack?: string;
  source: ErrorSource;
  route?: string; // API route or UI URL
  file?: string; // Best-guess file path
  line?: number;
  column?: number;
  status: ErrorStatus;
  occurrenceCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  lastFixedAt?: string;
  resolutionNote?: string;
  fixAttempts: number;
  metadata?: Record<string, any>;
}

export interface AdaptivePollAdvice {
  tier: AdaptivePollTier;
  recommendedIntervalSeconds: number;
  shouldStop: boolean;
  reason: string;
  consecutiveCleanPolls: number;
}

export interface ErrorStoreData {
  version: number;
  consecutiveCleanPolls?: number;
  lastPollAt?: string;
  lastErrorAt?: string;
  lastStatusSummary?: string;
  errors: DevErrorRecord[];
}

const STORE_PATH = path.resolve(process.cwd(), '.dev_errors.json');

/**
 * Normalizes error messages by stripping dynamic parameters (UUIDs, timestamps, IDs, hashes)
 * to ensure that identical errors produce the exact same fingerprint.
 */
export function normalizeErrorMessage(msg: string): string {
  if (!msg) return '';
  return msg
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '<UUID>')
    .replace(/0x[0-9a-fA-F]+/g, '<HEX>')
    .replace(/\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?\b/g, '<TIMESTAMP>')
    .replace(/(?:id[_\-:]?|session[_\-:]?|account[_\-:]?|token[_\-:]?)[0-9a-zA-Z_\-]+/gi, '<DYNAMIC_ID>')
    .replace(/\b\d{4,}\b/g, '<ID>')
    .replace(/"[^"]*(\/|\\)[^"]*"/g, '"<PATH>"')
    .trim();
}

/**
 * Extracts the top relevant application stack frame (ignoring node_modules).
 */
export function extractTopStackFrame(stack?: string): { file?: string; line?: number; column?: number; frameSummary: string } {
  if (!stack) return { frameSummary: '' };

  const lines = stack.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('at ')) continue;
    if (trimmed.includes('node_modules') || trimmed.includes('internal/') || trimmed.includes('internal\\')) continue;

    // Match file:line:col in formats like: "at Object.func (c:/path/to/file.ts:12:34)" or "at c:/path/to/file.ts:12:34"
    const match = trimmed.match(/(?:at\s+(?:.*?\s+\()?)?([a-zA-Z]:[\\/][^:]+|(?:\/|\.\/)[^:]+):(\d+):(\d+)\)?/);
    if (match) {
      const fullPath = match[1];
      const normalizedFull = fullPath.replace(/\\/g, '/');
      const normalizedCwd = process.cwd().replace(/\\/g, '/');
      const relPath = normalizedFull.replace(normalizedCwd, '').replace(/^\/+/, '');
      return {
        file: relPath,
        line: parseInt(match[2], 10),
        column: parseInt(match[3], 10),
        frameSummary: `${relPath}:${match[2]}`
      };
    }
  }

  return { frameSummary: lines[1] ? lines[1].trim() : '' };
}

/**
 * Computes deterministic fingerprint for an error.
 */
export function generateErrorFingerprint(
  name: string,
  message: string,
  source: ErrorSource,
  route?: string,
  stack?: string
): { fingerprint: string; normalizedMessage: string; file?: string; line?: number; column?: number } {
  const normalizedMessage = normalizeErrorMessage(message);
  const { file, line, column, frameSummary } = extractTopStackFrame(stack);

  const hashContent = [
    source || 'unknown',
    name || 'Error',
    normalizedMessage,
    file || route || 'general',
    frameSummary
  ].join('|');

  const fingerprint = crypto.createHash('sha256').update(hashContent).digest('hex').substring(0, 16);

  return {
    fingerprint,
    normalizedMessage,
    file,
    line,
    column
  };
}

/**
 * Reads the error store from disk safely.
 */
export function readErrorStore(): ErrorStoreData {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.errors)) {
        return data;
      }
    }
  } catch (err) {
    // Return empty store on read error
  }

  return {
    version: 1,
    consecutiveCleanPolls: 0,
    errors: []
  };
}

/**
 * Writes the error store to disk safely.
 */
export function writeErrorStore(data: ErrorStoreData): void {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DevErrorTracker] Failed to write error store:', err);
  }
}

/**
 * Calculates adaptive polling recommendation based on current active errors and consecutive clean runs.
 */
export function getAdaptivePollAdvice(storeData?: ErrorStoreData): AdaptivePollAdvice {
  const store = storeData || readErrorStore();
  const unresolved = store.errors.filter((e) => e.status === 'unresolved');
  const inProgress = store.errors.filter((e) => e.status === 'in_progress');
  const cleanCount = store.consecutiveCleanPolls || 0;

  if (unresolved.length > 0 || inProgress.length > 0) {
    return {
      tier: 'active_fixing',
      recommendedIntervalSeconds: 60,
      shouldStop: false,
      reason: `${unresolved.length} active unresolved error(s). High frequency polling active (1m).`,
      consecutiveCleanPolls: 0
    };
  }

  if (cleanCount > 15) {
    return {
      tier: 'hibernating',
      recommendedIntervalSeconds: 0,
      shouldStop: true,
      reason: `15+ consecutive clean polls. System healthy and stable. Polling hibernated until next error or file modification.`,
      consecutiveCleanPolls: cleanCount
    };
  }

  if (cleanCount > 8) {
    return {
      tier: 'idle_backoff',
      recommendedIntervalSeconds: 900, // 15m
      shouldStop: false,
      reason: `Environment stable (${cleanCount} clean polls). Backed off polling to 15m.`,
      consecutiveCleanPolls: cleanCount
    };
  }

  if (cleanCount > 3) {
    return {
      tier: 'low_activity',
      recommendedIntervalSeconds: 300, // 5m
      shouldStop: false,
      reason: `Low activity detected (${cleanCount} clean polls). Backed off polling to 5m.`,
      consecutiveCleanPolls: cleanCount
    };
  }

  return {
    tier: 'standard',
    recommendedIntervalSeconds: 120, // 2m
    shouldStop: false,
    reason: `Standard dev polling (${cleanCount} clean polls, 2m interval).`,
    consecutiveCleanPolls: cleanCount
  };
}

/**
 * Records a new or recurring error into the store.
 */
export function recordDevError(params: {
  name?: string;
  message: string;
  stack?: string;
  source?: ErrorSource;
  route?: string;
  metadata?: Record<string, any>;
}): DevErrorRecord {
  const store = readErrorStore();
  const name = params.name || 'Error';
  const source = params.source || 'unknown';
  const { fingerprint, normalizedMessage, file, line, column } = generateErrorFingerprint(
    name,
    params.message,
    source,
    params.route,
    params.stack
  );

  const now = new Date().toISOString();
  let record = store.errors.find((e) => e.fingerprint === fingerprint);

  if (record) {
    // Existing error - update occurrence count and last seen
    record.occurrenceCount += 1;
    record.lastSeenAt = now;
    if (params.stack && !record.stack) {
      record.stack = params.stack;
    }
    if (params.metadata) {
      record.metadata = { ...record.metadata, ...params.metadata };
    }
    if (record.status === 'unresolved') {
      store.consecutiveCleanPolls = 0;
      store.lastErrorAt = now;
    }
  } else {
    // New error
    record = {
      id: `err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      fingerprint,
      name,
      message: params.message,
      normalizedMessage,
      stack: params.stack,
      source,
      route: params.route,
      file,
      line,
      column,
      status: 'unresolved',
      occurrenceCount: 1,
      firstSeenAt: now,
      lastSeenAt: now,
      fixAttempts: 0,
      metadata: params.metadata
    };
    store.errors.unshift(record);
    store.consecutiveCleanPolls = 0;
    store.lastErrorAt = now;
  }

  writeErrorStore(store);
  return record;
}

/**
 * Updates status of an error (e.g. 'in_progress', 'resolved', 'ignored').
 */
export function updateDevErrorStatus(
  errorIdOrFingerprint: string,
  status: ErrorStatus,
  options?: { resolutionNote?: string; incrementAttempt?: boolean }
): DevErrorRecord | null {
  const store = readErrorStore();
  const record = store.errors.find(
    (e) => e.id === errorIdOrFingerprint || e.fingerprint === errorIdOrFingerprint
  );

  if (!record) return null;

  record.status = status;
  if (options?.incrementAttempt) {
    record.fixAttempts += 1;
  }
  if (status === 'resolved') {
    record.lastFixedAt = new Date().toISOString();
    if (options?.resolutionNote) {
      record.resolutionNote = options.resolutionNote;
    }
  } else if (options?.resolutionNote) {
    record.resolutionNote = options.resolutionNote;
  }

  writeErrorStore(store);
  return record;
}

/**
 * Returns brief one-line status after each poll, e.g.:
 * "[Poll 21:30:15] 1 unresolved: TypeError in app/api/sync/route.ts:42 [fp:8f9b2a1c] | 3 resolved | 0 in progress"
 * "[Poll 21:30:15] Clean - 0 active errors | 3 resolved | 0 ignored"
 */
export function getOneLineStatusSummary(errors?: DevErrorRecord[]): string {
  const allErrors = errors || readErrorStore().errors;
  const unresolved = allErrors.filter((e) => e.status === 'unresolved');
  const inProgress = allErrors.filter((e) => e.status === 'in_progress');
  const resolved = allErrors.filter((e) => e.status === 'resolved');
  const ignored = allErrors.filter((e) => e.status === 'ignored');

  const timeStr = new Date().toLocaleTimeString('en-GB', { hour12: false });

  if (unresolved.length === 0 && inProgress.length === 0) {
    return `[Poll @ ${timeStr}] Clean - 0 active errors | ${resolved.length} resolved | ${ignored.length} ignored`;
  }

  if (unresolved.length > 0) {
    const top = unresolved[0];
    const location = top.file ? `${top.file}${top.line ? `:${top.line}` : ''}` : (top.route || top.source);
    const countNote = unresolved.length > 1 ? ` (+${unresolved.length - 1} more)` : '';
    return `[Poll @ ${timeStr}] ${unresolved.length} unresolved: ${top.name} in ${location}${countNote} [fp:${top.fingerprint}] | ${resolved.length} resolved | ${inProgress.length} in progress`;
  }

  return `[Poll @ ${timeStr}] ${inProgress.length} in-progress fixes | ${resolved.length} resolved | 0 unresolved`;
}

/**
 * Polls dev errors, updates consecutive clean polls counter, and returns adaptive polling advice.
 */
export function pollDevErrors(filter?: { status?: ErrorStatus | 'active' | 'all'; source?: ErrorSource }): {
  summary: string;
  isStatusChanged: boolean;
  adaptivePolling: AdaptivePollAdvice;
  errors: DevErrorRecord[];
  counts: { unresolved: number; inProgress: number; resolved: number; ignored: number; total: number };
} {
  const store = readErrorStore();
  const unresolved = store.errors.filter((e) => e.status === 'unresolved');
  const inProgress = store.errors.filter((e) => e.status === 'in_progress');

  if (unresolved.length === 0 && inProgress.length === 0) {
    store.consecutiveCleanPolls = (store.consecutiveCleanPolls || 0) + 1;
  } else {
    store.consecutiveCleanPolls = 0;
  }

  const now = new Date().toISOString();
  store.lastPollAt = now;

  const currentSummary = getOneLineStatusSummary(store.errors);
  const isStatusChanged = store.lastStatusSummary !== currentSummary;
  store.lastStatusSummary = currentSummary;

  const adaptivePolling = getAdaptivePollAdvice(store);
  writeErrorStore(store);

  let filteredErrors = store.errors;
  if (filter?.status === 'active') {
    filteredErrors = filteredErrors.filter((e) => e.status === 'unresolved' || e.status === 'in_progress');
  } else if (filter?.status && filter.status !== 'all') {
    filteredErrors = filteredErrors.filter((e) => e.status === filter.status);
  }

  if (filter?.source) {
    filteredErrors = filteredErrors.filter((e) => e.source === filter.source);
  }

  const all = store.errors;
  const counts = {
    unresolved: all.filter((e) => e.status === 'unresolved').length,
    inProgress: all.filter((e) => e.status === 'in_progress').length,
    resolved: all.filter((e) => e.status === 'resolved').length,
    ignored: all.filter((e) => e.status === 'ignored').length,
    total: all.length
  };

  return {
    summary: currentSummary,
    isStatusChanged,
    adaptivePolling,
    errors: filteredErrors,
    counts
  };
}

/**
 * Gets errors without modifying polling state.
 */
export function getDevErrors(filter?: { status?: ErrorStatus | 'active' | 'all'; source?: ErrorSource }): {
  summary: string;
  errors: DevErrorRecord[];
  counts: { unresolved: number; inProgress: number; resolved: number; ignored: number; total: number };
} {
  const store = readErrorStore();
  let errors = store.errors;

  if (filter?.status === 'active') {
    errors = errors.filter((e) => e.status === 'unresolved' || e.status === 'in_progress');
  } else if (filter?.status && filter.status !== 'all') {
    errors = errors.filter((e) => e.status === filter.status);
  }

  if (filter?.source) {
    errors = errors.filter((e) => e.source === filter.source);
  }

  const all = store.errors;
  const counts = {
    unresolved: all.filter((e) => e.status === 'unresolved').length,
    inProgress: all.filter((e) => e.status === 'in_progress').length,
    resolved: all.filter((e) => e.status === 'resolved').length,
    ignored: all.filter((e) => e.status === 'ignored').length,
    total: all.length
  };

  return {
    summary: getOneLineStatusSummary(all),
    errors,
    counts
  };
}

/**
 * Clear or reset error store (useful for testing or full cleanup).
 */
export function resetDevErrorStore(): void {
  writeErrorStore({ version: 1, consecutiveCleanPolls: 0, errors: [] });
}
