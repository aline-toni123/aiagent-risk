import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { accounts } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';

const ACCOUNT_TYPES = ['checking', 'savings', 'credit', 'brokerage', 'loan'] as const;

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const userAccounts = await db.select()
      .from(accounts)
      .where(eq(accounts.userId, session.user.id))
      .orderBy(desc(accounts.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(userAccounts);
  } catch (error) {
    console.error('GET accounts error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
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

    const { 
      name, 
      institution, 
      type, 
      last4, 
      balance = 0, 
      currency = 'USD', 
      connected = true 
    } = requestBody;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 100) {
      return NextResponse.json({ 
        error: "Name is required and must be 1-100 characters",
        code: "INVALID_NAME" 
      }, { status: 400 });
    }

    if (!institution || typeof institution !== 'string' || institution.trim().length === 0 || institution.trim().length > 100) {
      return NextResponse.json({ 
        error: "Institution is required and must be 1-100 characters",
        code: "INVALID_INSTITUTION" 
      }, { status: 400 });
    }

    if (!type || !ACCOUNT_TYPES.includes(type)) {
      return NextResponse.json({ 
        error: "Type is required and must be one of: checking, savings, credit, brokerage, loan",
        code: "INVALID_TYPE" 
      }, { status: 400 });
    }

    if (last4 && (typeof last4 !== 'string' || last4.length > 4)) {
      return NextResponse.json({ 
        error: "Last4 must be a string with maximum 4 characters",
        code: "INVALID_LAST4" 
      }, { status: 400 });
    }

    if (balance !== undefined && typeof balance !== 'number') {
      return NextResponse.json({ 
        error: "Balance must be a number",
        code: "INVALID_BALANCE" 
      }, { status: 400 });
    }

    if (currency && typeof currency !== 'string') {
      return NextResponse.json({ 
        error: "Currency must be a string",
        code: "INVALID_CURRENCY" 
      }, { status: 400 });
    }

    if (connected !== undefined && typeof connected !== 'boolean') {
      return NextResponse.json({ 
        error: "Connected must be a boolean",
        code: "INVALID_CONNECTED" 
      }, { status: 400 });
    }

    const newAccount = await db.insert(accounts).values({
      userId: session.user.id,
      name: name.trim(),
      institution: institution.trim(),
      type,
      last4: last4 ? last4.trim() : null,
      balance,
      currency,
      connected,
      createdAt: new Date()
    }).returning();

    return NextResponse.json(newAccount[0], { status: 201 });
  } catch (error) {
    console.error('POST accounts error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}