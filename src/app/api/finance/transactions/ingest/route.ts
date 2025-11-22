import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { accounts, transactions, rules, categories } from '@/db/schema';
import { eq, desc, and, or, like } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const requestBody = await request.json();
    const { accountId, transactions: incomingTransactions } = requestBody;

    // Validate input
    if (!accountId || !Number.isInteger(accountId)) {
      return NextResponse.json({ 
        error: 'Valid accountId is required',
        code: 'INVALID_ACCOUNT_ID' 
      }, { status: 400 });
    }

    if (!Array.isArray(incomingTransactions) || incomingTransactions.length === 0) {
      return NextResponse.json({ 
        error: 'Transactions array is required and must not be empty',
        code: 'INVALID_TRANSACTIONS' 
      }, { status: 400 });
    }

    if (incomingTransactions.length > 1000) {
      return NextResponse.json({ 
        error: 'Maximum of 1000 transactions allowed per request',
        code: 'TOO_MANY_TRANSACTIONS' 
      }, { status: 400 });
    }

    // Validate accountId belongs to authenticated user
    const userAccount = await db.select()
      .from(accounts)
      .where(and(eq(accounts.id, accountId), eq(accounts.userId, session.user.id)))
      .limit(1);

    if (userAccount.length === 0) {
      return NextResponse.json({ 
        error: 'Account not found or access denied',
        code: 'ACCOUNT_NOT_FOUND' 
      }, { status: 400 });
    }

    // Fetch user's categorization rules ordered by priority DESC
    const userRules = await db.select({
      id: rules.id,
      pattern: rules.pattern,
      categoryId: rules.categoryId,
      priority: rules.priority
    })
    .from(rules)
    .where(eq(rules.userId, session.user.id))
    .orderBy(desc(rules.priority));

    const now = new Date();
    let createdCount = 0;
    const errors: Array<{index: number, error: string}> = [];

    // Process each transaction
    for (let i = 0; i < incomingTransactions.length; i++) {
      const txn = incomingTransactions[i];

      try {
        // Validate required fields
        if (txn.date === undefined || txn.date === null) {
          errors.push({ index: i, error: 'Date is required' });
          continue;
        }

        if (typeof txn.amount !== 'number') {
          errors.push({ index: i, error: 'Amount must be a number' });
          continue;
        }

        if (!txn.description || typeof txn.description !== 'string') {
          errors.push({ index: i, error: 'Description is required' });
          continue;
        }

        if (txn.description.length < 1 || txn.description.length > 200) {
          errors.push({ index: i, error: 'Description must be 1-200 characters' });
          continue;
        }

        if (txn.merchant && (typeof txn.merchant !== 'string' || txn.merchant.length > 100)) {
          errors.push({ index: i, error: 'Merchant must be a string with max 100 characters' });
          continue;
        }

        // Convert date to timestamp
        let dateTimestamp: Date;
        if (typeof txn.date === 'string') {
          dateTimestamp = new Date(txn.date);
          if (isNaN(dateTimestamp.getTime())) {
            errors.push({ index: i, error: 'Invalid date format' });
            continue;
          }
        } else if (typeof txn.date === 'number') {
          dateTimestamp = new Date(txn.date);
          if (isNaN(dateTimestamp.getTime())) {
            errors.push({ index: i, error: 'Invalid date timestamp' });
            continue;
          }
        } else {
          errors.push({ index: i, error: 'Date must be a string or number' });
          continue;
        }

        // Infer transaction type from amount sign
        const transactionType = txn.amount < 0 ? 'debit' : 'credit';

        // Apply categorization rules
        let categoryId: number | null = null;
        const searchText = (txn.description + ' ' + (txn.merchant || '')).toLowerCase();

        for (const rule of userRules) {
          if (searchText.includes(rule.pattern.toLowerCase())) {
            categoryId = rule.categoryId;
            break; // First matching rule wins
          }
        }

        // Insert transaction
        const newTransaction = await db.insert(transactions)
          .values({
            userId: session.user.id,
            accountId: accountId,
            date: dateTimestamp,
            amount: txn.amount,
            description: txn.description.trim(),
            merchant: txn.merchant ? txn.merchant.trim() : null,
            type: transactionType,
            categoryId: categoryId,
            pending: false,
            createdAt: now
          })
          .returning();

        if (newTransaction.length > 0) {
          createdCount++;
        }

      } catch (error) {
        console.error(`Transaction ${i} processing error:`, error);
        errors.push({ index: i, error: 'Failed to process transaction' });
      }
    }

    // Prepare response
    const response: any = {
      message: 'Bulk ingest completed',
      accountId: accountId,
      totalTransactions: incomingTransactions.length,
      createdCount: createdCount,
      errorCount: errors.length
    };

    if (errors.length > 0) {
      response.errors = errors;
    }

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}