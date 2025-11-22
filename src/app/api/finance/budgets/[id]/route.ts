import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { budgets, categories } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Validate ID parameter
    const id = (await params).id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Get budget with category info
    const result = await db
      .select({
        id: budgets.id,
        userId: budgets.userId,
        categoryId: budgets.categoryId,
        month: budgets.month,
        year: budgets.year,
        amount: budgets.amount,
        createdAt: budgets.createdAt,
        category: {
          id: categories.id,
          name: categories.name,
          icon: categories.icon,
          parentId: categories.parentId
        }
      })
      .from(budgets)
      .innerJoin(categories, eq(budgets.categoryId, categories.id))
      .where(and(
        eq(budgets.id, parseInt(id)),
        eq(budgets.userId, session.user.id)
      ))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('GET budget error:', error);
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
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Validate ID parameter
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

    // Reject immutable fields
    const immutableFields = ['categoryId', 'month', 'year', 'createdAt'];
    const providedImmutableFields = immutableFields.filter(field => field in requestBody);
    if (providedImmutableFields.length > 0) {
      return NextResponse.json({ 
        error: `Cannot update immutable fields: ${providedImmutableFields.join(', ')}`,
        code: "IMMUTABLE_FIELD_UPDATE" 
      }, { status: 400 });
    }

    const { amount } = requestBody;

    // Validate amount if provided
    if (amount !== undefined) {
      if (typeof amount !== 'number' || amount <= 0) {
        return NextResponse.json({ 
          error: "Amount must be a positive number",
          code: "INVALID_AMOUNT" 
        }, { status: 400 });
      }
    }

    // Check if budget exists and belongs to user
    const existingBudget = await db.select()
      .from(budgets)
      .where(and(
        eq(budgets.id, parseInt(id)),
        eq(budgets.userId, session.user.id)
      ))
      .limit(1);

    if (existingBudget.length === 0) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    };

    if (amount !== undefined) {
      updateData.amount = amount;
    }

    // Update budget
    const updated = await db.update(budgets)
      .set(updateData)
      .where(and(
        eq(budgets.id, parseInt(id)),
        eq(budgets.userId, session.user.id)
      ))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
    }

    // Get updated budget with category info
    const result = await db
      .select({
        id: budgets.id,
        userId: budgets.userId,
        categoryId: budgets.categoryId,
        month: budgets.month,
        year: budgets.year,
        amount: budgets.amount,
        createdAt: budgets.createdAt,
        category: {
          id: categories.id,
          name: categories.name,
          icon: categories.icon,
          parentId: categories.parentId
        }
      })
      .from(budgets)
      .innerJoin(categories, eq(budgets.categoryId, categories.id))
      .where(and(
        eq(budgets.id, parseInt(id)),
        eq(budgets.userId, session.user.id)
      ))
      .limit(1);

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('PATCH budget error:', error);
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
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Validate ID parameter
    const id = (await params).id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if budget exists and belongs to user, get category info before deletion
    const existingBudget = await db
      .select({
        id: budgets.id,
        userId: budgets.userId,
        categoryId: budgets.categoryId,
        month: budgets.month,
        year: budgets.year,
        amount: budgets.amount,
        createdAt: budgets.createdAt,
        category: {
          id: categories.id,
          name: categories.name,
          icon: categories.icon,
          parentId: categories.parentId
        }
      })
      .from(budgets)
      .innerJoin(categories, eq(budgets.categoryId, categories.id))
      .where(and(
        eq(budgets.id, parseInt(id)),
        eq(budgets.userId, session.user.id)
      ))
      .limit(1);

    if (existingBudget.length === 0) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
    }

    // Delete budget
    const deleted = await db.delete(budgets)
      .where(and(
        eq(budgets.id, parseInt(id)),
        eq(budgets.userId, session.user.id)
      ))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Budget deleted successfully',
      budget: existingBudget[0]
    });
  } catch (error) {
    console.error('DELETE budget error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}