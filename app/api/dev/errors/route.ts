import { NextRequest, NextResponse } from 'next/server';
import {
  recordDevError,
  getDevErrors,
  pollDevErrors,
  updateDevErrorStatus,
  ErrorStatus,
  ErrorSource
} from '@/lib/dev-error-tracker';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as ErrorStatus | 'active' | 'all' | null;
    const source = searchParams.get('source') as ErrorSource | null;
    const isPoll = searchParams.get('poll') === 'true';

    const result = isPoll
      ? pollDevErrors({
          status: status || undefined,
          source: source || undefined
        })
      : getDevErrors({
          status: status || undefined,
          source: source || undefined
        });

    const adaptiveAdvice = isPoll && 'adaptivePolling' in result
      ? result.adaptivePolling
      : undefined;

    return NextResponse.json({
      success: true,
      summary: result.summary,
      counts: result.counts,
      adaptivePolling: adaptiveAdvice,
      errors: result.errors
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch dev errors'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, message, stack, source, route, metadata } = body;

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    const record = recordDevError({
      name,
      message,
      stack,
      source: source || 'client',
      route,
      metadata
    });

    return NextResponse.json({
      success: true,
      error: record
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to record dev error'
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, fingerprint, status, resolutionNote, incrementAttempt } = body;

    const target = id || fingerprint;
    if (!target) {
      return NextResponse.json(
        { success: false, error: 'id or fingerprint is required' },
        { status: 400 }
      );
    }

    if (!status || !['unresolved', 'in_progress', 'resolved', 'ignored'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Valid status is required' },
        { status: 400 }
      );
    }

    const updated = updateDevErrorStatus(target, status as ErrorStatus, {
      resolutionNote,
      incrementAttempt: !!incrementAttempt
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Error not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      error: updated
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update dev error'
      },
      { status: 500 }
    );
  }
}
