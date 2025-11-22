import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { accounts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const id = (await params).id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        error: "Valid ID is required",
        code: "INVALID_ID"
      }, { status: 400 });
    }

    const account = await db.select()
      .from(accounts)
      .where(and(eq(accounts.id, parseInt(id)), eq(accounts.userId, session.user.id)))
      .limit(1);

    if (account.length === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    return NextResponse.json(account[0]);
  } catch (error) {
    console.error('GET account error:', error);
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
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const id = (await params).id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        error: "Valid ID is required",
        code: "INVALID_ID"
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

    // Check for forbidden immutable fields
    const forbiddenFields = ['institution', 'type', 'last4', 'currency'];
    const providedForbiddenFields = forbiddenFields.filter(field => field in requestBody);
    if (providedForbiddenFields.length > 0) {
      return NextResponse.json({
        error: `Cannot update immutable fields: ${providedForbiddenFields.join(', ')}`,
        code: "IMMUTABLE_FIELDS"
      }, { status: 400 });
    }

    // Validate allowed fields
    const { name, balance, connected } = requestBody;
    const updates: any = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 100) {
        return NextResponse.json({
          error: "Name must be a string between 1-100 characters",
          code: "INVALID_NAME"
        }, { status: 400 });
      }
      updates.name = name.trim();
    }

    if (balance !== undefined) {
      if (typeof balance !== 'number' || !isFinite(balance)) {
        return NextResponse.json({
          error: "Balance must be a valid number",
          code: "INVALID_BALANCE"
        }, { status: 400 });
      }
      updates.balance = balance;
    }

    if (connected !== undefined) {
      if (typeof connected !== 'boolean') {
        return NextResponse.json({
          error: "Connected must be a boolean value",
          code: "INVALID_CONNECTED"
        }, { status: 400 });
      }
      updates.connected = connected;
    }

    // Check if account exists and belongs to user
    const existingAccount = await db.select()
      .from(accounts)
      .where(and(eq(accounts.id, parseInt(id)), eq(accounts.userId, session.user.id)))
      .limit(1);

    if (existingAccount.length === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Update with timestamp
    const updated = await db.update(accounts)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(and(eq(accounts.id, parseInt(id)), eq(accounts.userId, session.user.id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('PATCH account error:', error);
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
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const id = (await params).id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        error: "Valid ID is required",
        code: "INVALID_ID"
      }, { status: 400 });
    }

    // Check if account exists and belongs to user
    const existingAccount = await db.select()
      .from(accounts)
      .where(and(eq(accounts.id, parseInt(id)), eq(accounts.userId, session.user.id)))
      .limit(1);

    if (existingAccount.length === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const deleted = await db.delete(accounts)
      .where(and(eq(accounts.id, parseInt(id)), eq(accounts.userId, session.user.id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Account deleted successfully',
      account: deleted[0]
    });
  } catch (error) {
    console.error('DELETE account error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}