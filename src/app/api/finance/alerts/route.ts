import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { alerts } from '@/db/schema';
import { eq, like, and, or, desc, asc, SQL } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = new URL(request.url).searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const type = searchParams.get('type');
    const severity = searchParams.get('severity');
    const read = searchParams.get('read');
    const unreadOnly = searchParams.get('unread_only');

    let query: any = db.select().from(alerts);
    let conditions: SQL[] = [eq(alerts.userId, session.user.id)];

    if (type) {
      const validTypes = ['overspend', 'cashflow', 'bill', 'unusual', 'goal'];
      if (validTypes.includes(type)) {
        conditions.push(eq(alerts.type, type));
      }
    }

    if (severity) {
      const validSeverities = ['info', 'warning', 'critical'];
      if (validSeverities.includes(severity)) {
        conditions.push(eq(alerts.severity, severity));
      }
    }

    if (unreadOnly === 'true') {
      conditions.push(eq(alerts.read, false));
    } else if (read) {
      conditions.push(eq(alerts.read, read === 'true'));
    }

    // Apply conditions: handle single vs multiple conditions
    if (conditions.length > 1) {
      query = query.where(and(...conditions));
    } else if (conditions.length === 1) {
      query = query.where(conditions[0]);
    }

    query = query
      .orderBy(desc(alerts.createdAt))
      .limit(limit)
      .offset(offset);

    const results = await query;
    return NextResponse.json(results);

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const requestBody = await request.json();

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED"
      }, { status: 400 });
    }

    const { type, severity, message, read } = requestBody;

    // Validate required fields
    if (!type) {
      return NextResponse.json({
        error: "Type is required",
        code: "MISSING_TYPE"
      }, { status: 400 });
    }

    if (!severity) {
      return NextResponse.json({
        error: "Severity is required",
        code: "MISSING_SEVERITY"
      }, { status: 400 });
    }

    if (!message) {
      return NextResponse.json({
        error: "Message is required",
        code: "MISSING_MESSAGE"
      }, { status: 400 });
    }

    // Validate type
    const validTypes = ['overspend', 'cashflow', 'bill', 'unusual', 'goal'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({
        error: "Type must be one of: overspend, cashflow, bill, unusual, goal",
        code: "INVALID_TYPE"
      }, { status: 400 });
    }

    // Validate severity
    const validSeverities = ['info', 'warning', 'critical'];
    if (!validSeverities.includes(severity)) {
      return NextResponse.json({
        error: "Severity must be one of: info, warning, critical",
        code: "INVALID_SEVERITY"
      }, { status: 400 });
    }

    // Validate message length
    if (typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({
        error: "Message must be a non-empty string",
        code: "INVALID_MESSAGE"
      }, { status: 400 });
    }

    if (message.trim().length > 500) {
      return NextResponse.json({
        error: "Message must be 500 characters or less",
        code: "MESSAGE_TOO_LONG"
      }, { status: 400 });
    }

    // Validate read if provided
    if (read !== undefined && typeof read !== 'boolean') {
      return NextResponse.json({
        error: "Read must be a boolean",
        code: "INVALID_READ"
      }, { status: 400 });
    }

    const insertData = {
      userId: session.user.id,
      type: type.trim(),
      severity: severity.trim(),
      message: message.trim(),
      read: read || false,
      createdAt: new Date()
    };

    const newAlert = await db.insert(alerts)
      .values(insertData)
      .returning();

    return NextResponse.json(newAlert[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}