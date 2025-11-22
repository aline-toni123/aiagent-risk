import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions, accounts, categories } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
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
        error: "Valid transaction ID is required",
        code: "INVALID_ID"
      }, { status: 400 });
    }

    const result = await db
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
      .where(and(
        eq(transactions.id, parseInt(id)),
        eq(transactions.userId, session.user.id)
      ))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({
        error: 'Transaction not found',
        code: "TRANSACTION_NOT_FOUND"
      }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('GET transaction error:', error);
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
        error: "Valid transaction ID is required",
        code: "INVALID_ID"
      }, { status: 400 });
    }

    const requestBody = await request.json();

    // Security check: reject if immutable fields are provided
    const immutableFields = ['userId', 'user_id', 'accountId', 'date', 'type', 'createdAt'];
    const providedImmutableFields = immutableFields.filter(field => field in requestBody);

    if (providedImmutableFields.length > 0) {
      return NextResponse.json({
        error: `Cannot update immutable fields: ${providedImmutableFields.join(', ')}`,
        code: "IMMUTABLE_FIELDS_NOT_ALLOWED"
      }, { status: 400 });
    }

    const { amount, description, merchant, categoryId, pending } = requestBody;

    // Validate fields if provided
    if (amount !== undefined) {
      if (typeof amount !== 'number' || isNaN(amount)) {
        return NextResponse.json({
          error: "Amount must be a valid number",
          code: "INVALID_AMOUNT"
        }, { status: 400 });
      }
    }

    if (description !== undefined) {
      if (typeof description !== 'string' || description.trim().length === 0 || description.trim().length > 200) {
        return NextResponse.json({
          error: "Description must be a string between 1-200 characters",
          code: "INVALID_DESCRIPTION"
        }, { status: 400 });
      }
    }

    if (merchant !== undefined) {
      if (typeof merchant !== 'string' || merchant.trim().length > 100) {
        return NextResponse.json({
          error: "Merchant must be a string with max 100 characters",
          code: "INVALID_MERCHANT"
        }, { status: 400 });
      }
    }

    if (categoryId !== undefined) {
      if (!Number.isInteger(categoryId)) {
        return NextResponse.json({
          error: "Category ID must be an integer",
          code: "INVALID_CATEGORY_ID"
        }, { status: 400 });
      }

      // Verify category exists and is accessible to user (global or user's own)
      const categoryExists = await db
        .select({ id: categories.id })
        .from(categories)
        .where(and(
          eq(categories.id, categoryId),
          eq(categories.userId, session.user.id)
        ))
        .limit(1);

      const globalCategoryExists = await db
        .select({ id: categories.id })
        .from(categories)
        .where(and(
          eq(categories.id, categoryId),
          isNull(categories.userId)
        ))
        .limit(1);

      if (categoryExists.length === 0 && globalCategoryExists.length === 0) {
        return NextResponse.json({
          error: "Category not found or not accessible",
          code: "CATEGORY_NOT_FOUND"
        }, { status: 400 });
      }
    }

    if (pending !== undefined && typeof pending !== 'boolean') {
      return NextResponse.json({
        error: "Pending must be a boolean",
        code: "INVALID_PENDING"
      }, { status: 400 });
    }

    // Check if transaction exists and belongs to user
    const existingTransaction = await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(and(
        eq(transactions.id, parseInt(id)),
        eq(transactions.userId, session.user.id)
      ))
      .limit(1);

    if (existingTransaction.length === 0) {
      return NextResponse.json({
        error: 'Transaction not found',
        code: "TRANSACTION_NOT_FOUND"
      }, { status: 404 });
    }

    // Build update object with only provided fields
    const updateData: any = {
      updatedAt: new Date()
    };

    if (amount !== undefined) updateData.amount = amount;
    if (description !== undefined) updateData.description = description.trim();
    if (merchant !== undefined) updateData.merchant = merchant.trim() || null;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (pending !== undefined) updateData.pending = pending;

    // Update transaction
    const updated = await db
      .update(transactions)
      .set(updateData)
      .where(and(
        eq(transactions.id, parseInt(id)),
        eq(transactions.userId, session.user.id)
      ))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({
        error: 'Failed to update transaction',
        code: "UPDATE_FAILED"
      }, { status: 500 });
    }

    // Fetch updated transaction with account/category info
    const result = await db
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
      .where(eq(transactions.id, parseInt(id)))
      .limit(1);

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('PATCH transaction error:', error);
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
        error: "Valid transaction ID is required",
        code: "INVALID_ID"
      }, { status: 400 });
    }

    // Check if transaction exists and belongs to user
    const existingTransaction = await db
      .select({
        id: transactions.id,
        description: transactions.description,
        amount: transactions.amount,
        date: transactions.date
      })
      .from(transactions)
      .where(and(
        eq(transactions.id, parseInt(id)),
        eq(transactions.userId, session.user.id)
      ))
      .limit(1);

    if (existingTransaction.length === 0) {
      return NextResponse.json({
        error: 'Transaction not found',
        code: "TRANSACTION_NOT_FOUND"
      }, { status: 404 });
    }

    // Delete transaction
    const deleted = await db
      .delete(transactions)
      .where(and(
        eq(transactions.id, parseInt(id)),
        eq(transactions.userId, session.user.id)
      ))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({
        error: 'Failed to delete transaction',
        code: "DELETE_FAILED"
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Transaction deleted successfully',
      deletedTransaction: existingTransaction[0]
    });
  } catch (error) {
    console.error('DELETE transaction error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}