import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { alerts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED' 
      }, { status: 401 });
    }

    const id = (await params).id;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    // Get alert by ID, scoped to authenticated user
    const alert = await db.select()
      .from(alerts)
      .where(and(
        eq(alerts.id, parseInt(id)),
        eq(alerts.userId, session.user.id)
      ))
      .limit(1);

    if (alert.length === 0) {
      return NextResponse.json({ 
        error: 'Alert not found',
        code: 'ALERT_NOT_FOUND' 
      }, { status: 404 });
    }

    return NextResponse.json(alert[0]);

  } catch (error) {
    console.error('GET alert error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED' 
      }, { status: 401 });
    }

    const id = (await params).id;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const requestBody = await request.json();

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Validate immutable fields
    const immutableFields = ['userId', 'user_id', 'type', 'createdAt', 'created_at'];
    const providedImmutableFields = immutableFields.filter(field => field in requestBody);
    
    if (providedImmutableFields.length > 0) {
      return NextResponse.json({ 
        error: `The following fields cannot be updated: ${providedImmutableFields.join(', ')}`,
        code: 'IMMUTABLE_FIELDS_PROVIDED' 
      }, { status: 400 });
    }

    // Extract and validate allowed fields
    const { message, read, severity } = requestBody;
    const updates: any = {};

    // Validate message if provided
    if (message !== undefined) {
      if (typeof message !== 'string') {
        return NextResponse.json({ 
          error: 'Message must be a string',
          code: 'INVALID_MESSAGE_TYPE' 
        }, { status: 400 });
      }
      if (message.length < 1 || message.length > 500) {
        return NextResponse.json({ 
          error: 'Message must be between 1 and 500 characters',
          code: 'INVALID_MESSAGE_LENGTH' 
        }, { status: 400 });
      }
      updates.message = message.trim();
    }

    // Validate read if provided
    if (read !== undefined) {
      if (typeof read !== 'boolean') {
        return NextResponse.json({ 
          error: 'Read must be a boolean',
          code: 'INVALID_READ_TYPE' 
        }, { status: 400 });
      }
      updates.read = read;
    }

    // Validate severity if provided
    if (severity !== undefined) {
      const validSeverities = ['info', 'warning', 'critical'];
      if (!validSeverities.includes(severity)) {
        return NextResponse.json({ 
          error: 'Severity must be one of: info, warning, critical',
          code: 'INVALID_SEVERITY' 
        }, { status: 400 });
      }
      updates.severity = severity;
    }

    // Check if any valid updates were provided
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ 
        error: 'No valid fields provided for update',
        code: 'NO_VALID_UPDATES' 
      }, { status: 400 });
    }

    // Check if alert exists and belongs to user before updating
    const existingAlert = await db.select()
      .from(alerts)
      .where(and(
        eq(alerts.id, parseInt(id)),
        eq(alerts.userId, session.user.id)
      ))
      .limit(1);

    if (existingAlert.length === 0) {
      return NextResponse.json({ 
        error: 'Alert not found',
        code: 'ALERT_NOT_FOUND' 
      }, { status: 404 });
    }

    // Update the alert
    const updated = await db.update(alerts)
      .set(updates)
      .where(and(
        eq(alerts.id, parseInt(id)),
        eq(alerts.userId, session.user.id)
      ))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ 
        error: 'Alert not found',
        code: 'ALERT_NOT_FOUND' 
      }, { status: 404 });
    }

    return NextResponse.json(updated[0]);

  } catch (error) {
    console.error('PATCH alert error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED' 
      }, { status: 401 });
    }

    const id = (await params).id;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    // Check if alert exists and belongs to user before deleting
    const existingAlert = await db.select()
      .from(alerts)
      .where(and(
        eq(alerts.id, parseInt(id)),
        eq(alerts.userId, session.user.id)
      ))
      .limit(1);

    if (existingAlert.length === 0) {
      return NextResponse.json({ 
        error: 'Alert not found',
        code: 'ALERT_NOT_FOUND' 
      }, { status: 404 });
    }

    // Delete the alert
    const deleted = await db.delete(alerts)
      .where(and(
        eq(alerts.id, parseInt(id)),
        eq(alerts.userId, session.user.id)
      ))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ 
        error: 'Alert not found',
        code: 'ALERT_NOT_FOUND' 
      }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Alert deleted successfully',
      alert: deleted[0]
    });

  } catch (error) {
    console.error('DELETE alert error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}