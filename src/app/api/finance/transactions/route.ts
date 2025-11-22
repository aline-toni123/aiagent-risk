import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions, accounts, categories, rules } from '@/db/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const accountId = searchParams.get('account_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const categoryId = searchParams.get('category_id');
    const type = searchParams.get('type');

    let query: any = db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        accountId: transactions.accountId,
        date: transactions.date,
        amount: transactions.amount,
        description: transactions.description,
        merchant: transactions.merchant,
        type: transactions.type,
        categoryId: transactions.categoryId,
        pending: transactions.pending,
        createdAt: transactions.createdAt,
        account: {
          id: accounts.id,
          name: accounts.name,
          institution: accounts.institution,
          type: accounts.type
        },
        category: {
          id: categories.id,
          name: categories.name,
          icon: categories.icon
        }
      })
      .from(transactions)
      .leftJoin(accounts, eq(transactions.accountId, accounts.id))
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(eq(transactions.userId, session.user.id));

    // Apply filters
    const conditions = [eq(transactions.userId, session.user.id)];

    if (accountId && !isNaN(parseInt(accountId))) {
      conditions.push(eq(transactions.accountId, parseInt(accountId)));
    }

    if (startDate) {
      const startTimestamp = new Date(startDate).getTime();
      conditions.push(gte(transactions.date, new Date(startTimestamp)));
    }

    if (endDate) {
      const endTimestamp = new Date(endDate).getTime();
      conditions.push(lte(transactions.date, new Date(endTimestamp)));
    }

    if (categoryId && !isNaN(parseInt(categoryId))) {
      conditions.push(eq(transactions.categoryId, parseInt(categoryId)));
    }

    if (type && (type === 'debit' || type === 'credit')) {
      conditions.push(eq(transactions.type, type));
    }

    if (conditions.length > 1) {
      query = query.where(and(...conditions));
    } else if (conditions.length === 1) {
      query = query.where(conditions[0]);
    }

    const results = await query
      .orderBy(desc(transactions.date))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results);
  } catch (error) {
    console.error('GET transactions error:', error);
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

    // Check if bulk create
    if ('transactions' in requestBody && Array.isArray(requestBody.transactions)) {
      return await handleBulkCreate(session.user.id, requestBody.transactions);
    }

    // Single transaction create
    return await handleSingleCreate(session.user.id, requestBody);
  } catch (error) {
    console.error('POST transactions error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}

async function handleSingleCreate(userId: string, data: any) {
  // Validate required fields
  if (!data.accountId) {
    return NextResponse.json({
      error: "Account ID is required",
      code: "MISSING_ACCOUNT_ID"
    }, { status: 400 });
  }

  if (!data.date) {
    return NextResponse.json({
      error: "Date is required",
      code: "MISSING_DATE"
    }, { status: 400 });
  }

  if (data.amount === undefined || data.amount === null) {
    return NextResponse.json({
      error: "Amount is required",
      code: "MISSING_AMOUNT"
    }, { status: 400 });
  }

  if (!data.description || typeof data.description !== 'string') {
    return NextResponse.json({
      error: "Description is required",
      code: "MISSING_DESCRIPTION"
    }, { status: 400 });
  }

  // Validate accountId belongs to user
  const userAccount = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, parseInt(data.accountId)), eq(accounts.userId, userId)))
    .limit(1);

  if (userAccount.length === 0) {
    return NextResponse.json({
      error: "Account not found or does not belong to user",
      code: "INVALID_ACCOUNT"
    }, { status: 400 });
  }

  // Validate description length
  if (data.description.length < 1 || data.description.length > 200) {
    return NextResponse.json({
      error: "Description must be between 1 and 200 characters",
      code: "INVALID_DESCRIPTION_LENGTH"
    }, { status: 400 });
  }

  // Validate merchant length if provided
  if (data.merchant && data.merchant.length > 100) {
    return NextResponse.json({
      error: "Merchant name cannot exceed 100 characters",
      code: "INVALID_MERCHANT_LENGTH"
    }, { status: 400 });
  }

  // Validate categoryId if provided
  if (data.categoryId) {
    const category = await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.id, parseInt(data.categoryId)),
          sql`(${categories.userId} IS NULL OR ${categories.userId} = ${userId})`
        )
      )
      .limit(1);

    if (category.length === 0) {
      return NextResponse.json({
        error: "Category not found or not accessible",
        code: "INVALID_CATEGORY"
      }, { status: 400 });
    }
  }

  // Parse date
  let parsedDate: Date;
  if (typeof data.date === 'string') {
    parsedDate = new Date(data.date);
  } else if (typeof data.date === 'number') {
    parsedDate = new Date(data.date);
  } else {
    return NextResponse.json({
      error: "Invalid date format",
      code: "INVALID_DATE"
    }, { status: 400 });
  }

  if (isNaN(parsedDate.getTime())) {
    return NextResponse.json({
      error: "Invalid date format",
      code: "INVALID_DATE"
    }, { status: 400 });
  }

  // Auto-infer type from amount if not provided
  const type = data.type || (data.amount < 0 ? 'debit' : 'credit');

  if (type !== 'debit' && type !== 'credit') {
    return NextResponse.json({
      error: "Type must be 'debit' or 'credit'",
      code: "INVALID_TYPE"
    }, { status: 400 });
  }

  const transactionData = {
    userId,
    accountId: parseInt(data.accountId),
    date: parsedDate,
    amount: parseFloat(data.amount),
    description: data.description.trim(),
    merchant: data.merchant?.trim() || null,
    type,
    categoryId: data.categoryId ? parseInt(data.categoryId) : null,
    pending: data.pending ?? false,
    createdAt: new Date()
  };

  const newTransaction = await db.insert(transactions)
    .values(transactionData)
    .returning();

  // Apply auto-categorization if no category provided
  if (!data.categoryId) {
    const updatedTransaction = await applyCategorization(userId, newTransaction[0]);
    if (updatedTransaction) {
      return NextResponse.json(updatedTransaction, { status: 201 });
    }
  }

  return NextResponse.json(newTransaction[0], { status: 201 });
}

async function handleBulkCreate(userId: string, transactionsData: any[]) {
  if (!Array.isArray(transactionsData) || transactionsData.length === 0) {
    return NextResponse.json({
      error: "Transactions array is required and cannot be empty",
      code: "INVALID_TRANSACTIONS_ARRAY"
    }, { status: 400 });
  }

  const createdTransactions = [];
  const errors = [];

  for (let i = 0; i < transactionsData.length; i++) {
    try {
      const data = transactionsData[i];

      // Security check for each transaction
      if ('userId' in data || 'user_id' in data) {
        errors.push({ index: i, error: "User ID cannot be provided in transaction data" });
        continue;
      }

      // Validate required fields
      if (!data.accountId || !data.date || data.amount === undefined || !data.description) {
        errors.push({ index: i, error: "Missing required fields" });
        continue;
      }

      // Validate accountId belongs to user
      const userAccount = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.id, parseInt(data.accountId)), eq(accounts.userId, userId)))
        .limit(1);

      if (userAccount.length === 0) {
        errors.push({ index: i, error: "Invalid account" });
        continue;
      }

      // Parse date
      let parsedDate: Date;
      if (typeof data.date === 'string') {
        parsedDate = new Date(data.date);
      } else if (typeof data.date === 'number') {
        parsedDate = new Date(data.date);
      } else {
        errors.push({ index: i, error: "Invalid date format" });
        continue;
      }

      if (isNaN(parsedDate.getTime())) {
        errors.push({ index: i, error: "Invalid date format" });
        continue;
      }

      // Auto-infer type from amount if not provided
      const type = data.type || (data.amount < 0 ? 'debit' : 'credit');

      const transactionData = {
        userId,
        accountId: parseInt(data.accountId),
        date: parsedDate,
        amount: parseFloat(data.amount),
        description: data.description.trim(),
        merchant: data.merchant?.trim() || null,
        type,
        categoryId: data.categoryId ? parseInt(data.categoryId) : null,
        pending: data.pending ?? false,
        createdAt: new Date()
      };

      const newTransaction = await db.insert(transactions)
        .values(transactionData)
        .returning();

      // Apply auto-categorization if no category provided
      if (!data.categoryId) {
        const updatedTransaction = await applyCategorization(userId, newTransaction[0]);
        createdTransactions.push(updatedTransaction || newTransaction[0]);
      } else {
        createdTransactions.push(newTransaction[0]);
      }
    } catch (error: any) {
      errors.push({ index: i, error: error.message });
    }
  }

  return NextResponse.json({
    created: createdTransactions,
    errors: errors.length > 0 ? errors : undefined,
    totalCreated: createdTransactions.length,
    totalErrors: errors.length
  }, { status: 201 });
}

async function applyCategorization(userId: string, transaction: any) {
  try {
    // Get user's categorization rules ordered by priority DESC
    const userRules = await db
      .select({
        id: rules.id,
        pattern: rules.pattern,
        categoryId: rules.categoryId,
        priority: rules.priority
      })
      .from(rules)
      .where(eq(rules.userId, userId))
      .orderBy(desc(rules.priority));

    if (userRules.length === 0) {
      return null;
    }

    // Check for first matching rule
    const searchText = `${transaction.description} ${transaction.merchant || ''}`.toLowerCase();

    for (const rule of userRules) {
      if (searchText.includes(rule.pattern.toLowerCase())) {
        // Update transaction with matched category
        const updated = await db
          .update(transactions)
          .set({
            categoryId: rule.categoryId,
            // updatedAt: new Date() // Removed as it's not in schema
          })
          .where(and(eq(transactions.id, transaction.id), eq(transactions.userId, userId)))
          .returning();

        return updated[0];
      }
    }

    return null;
  } catch (error) {
    console.error('Auto-categorization error:', error);
    return null;
  }
}