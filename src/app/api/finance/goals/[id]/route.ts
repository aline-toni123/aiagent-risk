import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { goals, categories } from '@/db/schema';
import { eq, and, or, isNull } from 'drizzle-orm';
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

    const goalWithCategory = await db
      .select({
        id: goals.id,
        name: goals.name,
        targetAmount: goals.targetAmount,
        currentAmount: goals.currentAmount,
        deadline: goals.deadline,
        categoryId: goals.categoryId,
        status: goals.status,
        createdAt: goals.createdAt,
        userId: goals.userId,
        category: {
          id: categories.id,
          name: categories.name,
          icon: categories.icon,
        }
      })
      .from(goals)
      .leftJoin(categories, eq(goals.categoryId, categories.id))
      .where(and(eq(goals.id, parseInt(id)), eq(goals.userId, session.user.id)))
      .limit(1);

    if (goalWithCategory.length === 0) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    const goal = goalWithCategory[0];
    const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;

    return NextResponse.json({
      ...goal,
      progress: Math.min(progress, 100),
    });

  } catch (error) {
    console.error('GET goal error:', error);
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

    // Check for immutable fields
    if ('createdAt' in requestBody) {
      return NextResponse.json({
        error: "Cannot update immutable field: createdAt",
        code: "IMMUTABLE_FIELD"
      }, { status: 400 });
    }

    const { name, targetAmount, currentAmount, deadline, categoryId, status } = requestBody;

    // Validate name
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 100) {
        return NextResponse.json({
          error: "Name must be a string between 1-100 characters",
          code: "INVALID_NAME"
        }, { status: 400 });
      }

      // Check name uniqueness per user
      const existingGoal = await db.select()
        .from(goals)
        .where(and(
          eq(goals.name, name.trim()),
          eq(goals.userId, session.user.id)
        ))
        .limit(1);

      if (existingGoal.length > 0 && existingGoal[0].id !== parseInt(id)) {
        return NextResponse.json({
          error: "Goal name must be unique",
          code: "DUPLICATE_NAME"
        }, { status: 400 });
      }
    }

    // Validate targetAmount
    if (targetAmount !== undefined) {
      if (typeof targetAmount !== 'number' || targetAmount <= 0) {
        return NextResponse.json({
          error: "Target amount must be a positive number",
          code: "INVALID_TARGET_AMOUNT"
        }, { status: 400 });
      }
    }

    // Validate currentAmount
    if (currentAmount !== undefined) {
      if (typeof currentAmount !== 'number' || currentAmount < 0) {
        return NextResponse.json({
          error: "Current amount must be a non-negative number",
          code: "INVALID_CURRENT_AMOUNT"
        }, { status: 400 });
      }
    }

    // Validate deadline
    if (deadline !== undefined) {
      if (deadline !== null) {
        const deadlineDate = new Date(deadline);
        if (isNaN(deadlineDate.getTime()) || deadlineDate <= new Date()) {
          return NextResponse.json({
            error: "Deadline must be a valid future date",
            code: "INVALID_DEADLINE"
          }, { status: 400 });
        }
      }
    }

    // Validate categoryId
    if (categoryId !== undefined) {
      if (categoryId !== null) {
        if (!Number.isInteger(categoryId)) {
          return NextResponse.json({
            error: "Category ID must be an integer",
            code: "INVALID_CATEGORY_ID"
          }, { status: 400 });
        }

        // Check category exists and is accessible to user
        const categoryExists = await db.select()
          .from(categories)
          .where(and(
            eq(categories.id, categoryId),
            or(eq(categories.userId, session.user.id), isNull(categories.userId))
          ))
          .limit(1);

        if (categoryExists.length === 0) {
          return NextResponse.json({
            error: "Category not found or not accessible",
            code: "CATEGORY_NOT_FOUND"
          }, { status: 400 });
        }
      }
    }

    // Validate status
    if (status !== undefined) {
      if (!['active', 'completed', 'paused'].includes(status)) {
        return NextResponse.json({
          error: "Status must be one of: active, completed, paused",
          code: "INVALID_STATUS"
        }, { status: 400 });
      }
    }

    // Check if goal exists and belongs to user
    const existingGoal = await db.select()
      .from(goals)
      .where(and(eq(goals.id, parseInt(id)), eq(goals.userId, session.user.id)))
      .limit(1);

    if (existingGoal.length === 0) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    const currentGoal = existingGoal[0];

    // Prepare update data
    const updates: any = {
      updatedAt: new Date()
    };

    if (name !== undefined) updates.name = name.trim();
    if (targetAmount !== undefined) updates.targetAmount = targetAmount;
    if (currentAmount !== undefined) updates.currentAmount = currentAmount;
    if (deadline !== undefined) updates.deadline = deadline ? new Date(deadline) : null;
    if (categoryId !== undefined) updates.categoryId = categoryId;
    if (status !== undefined) updates.status = status;

    // Business rule: Validate currentAmount doesn't exceed targetAmount
    const finalTargetAmount = updates.targetAmount ?? currentGoal.targetAmount;
    const finalCurrentAmount = updates.currentAmount ?? currentGoal.currentAmount;

    if (finalCurrentAmount > finalTargetAmount) {
      return NextResponse.json({
        error: "Current amount cannot exceed target amount",
        code: "CURRENT_EXCEEDS_TARGET"
      }, { status: 400 });
    }

    // Business rule: Auto-set status to completed when currentAmount >= targetAmount
    if (finalCurrentAmount >= finalTargetAmount && finalTargetAmount > 0) {
      updates.status = 'completed';
    }

    const updated = await db.update(goals)
      .set(updates)
      .where(and(eq(goals.id, parseInt(id)), eq(goals.userId, session.user.id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Get updated goal with category info
    const updatedGoalWithCategory = await db
      .select({
        id: goals.id,
        name: goals.name,
        targetAmount: goals.targetAmount,
        currentAmount: goals.currentAmount,
        deadline: goals.deadline,
        categoryId: goals.categoryId,
        status: goals.status,
        createdAt: goals.createdAt,
        userId: goals.userId,
        category: {
          id: categories.id,
          name: categories.name,
          icon: categories.icon,
        }
      })
      .from(goals)
      .leftJoin(categories, eq(goals.categoryId, categories.id))
      .where(and(eq(goals.id, parseInt(id)), eq(goals.userId, session.user.id)))
      .limit(1);

    const updatedGoal = updatedGoalWithCategory[0];
    const progress = updatedGoal.targetAmount > 0 ? (updatedGoal.currentAmount / updatedGoal.targetAmount) * 100 : 0;

    return NextResponse.json({
      ...updatedGoal,
      progress: Math.min(progress, 100),
    });

  } catch (error) {
    console.error('PATCH goal error:', error);
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

    // Check if goal exists and belongs to user before deleting
    const existingGoal = await db.select()
      .from(goals)
      .where(and(eq(goals.id, parseInt(id)), eq(goals.userId, session.user.id)))
      .limit(1);

    if (existingGoal.length === 0) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    const deleted = await db.delete(goals)
      .where(and(eq(goals.id, parseInt(id)), eq(goals.userId, session.user.id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Goal deleted successfully',
      deletedGoal: deleted[0]
    });

  } catch (error) {
    console.error('DELETE goal error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}