import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { goals, categories } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const categoryId = searchParams.get('category_id');

    let query: any = db.select({
      id: goals.id,
      userId: goals.userId,
      name: goals.name,
      targetAmount: goals.targetAmount,
      currentAmount: goals.currentAmount,
      deadline: goals.deadline,
      categoryId: goals.categoryId,
      status: goals.status,
      createdAt: goals.createdAt,
      category: {
        id: categories.id,
        name: categories.name,
        icon: categories.icon
      }
    })
      .from(goals)
      .leftJoin(categories, eq(goals.categoryId, categories.id))
      .where(eq(goals.userId, session.user.id));

    if (status && ['active', 'completed', 'paused'].includes(status)) {
      query = query.where(and(eq(goals.userId, session.user.id), eq(goals.status, status)));
    }

    if (categoryId && !isNaN(parseInt(categoryId))) {
      const categoryCondition = and(
        eq(goals.userId, session.user.id),
        eq(goals.categoryId, parseInt(categoryId))
      );
      if (status) {
        query = query.where(and(categoryCondition, eq(goals.status, status)));
      } else {
        query = query.where(categoryCondition);
      }
    }

    const results = await query
      .orderBy(desc(goals.createdAt))
      .limit(limit)
      .offset(offset);

    const goalsWithProgress = results.map((goal: any) => ({
      ...goal,
      progress: goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0,
      isCompleted: goal.currentAmount >= goal.targetAmount,
      remainingAmount: Math.max(goal.targetAmount - goal.currentAmount, 0)
    }));

    return NextResponse.json(goalsWithProgress);
  } catch (error) {
    console.error('GET goals error:', error);
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

    const {
      name,
      targetAmount,
      currentAmount = 0,
      deadline,
      categoryId,
      status = 'active'
    } = requestBody;

    // Validate required fields
    if (!name || typeof name !== 'string') {
      return NextResponse.json({
        error: "Name is required and must be a string",
        code: "MISSING_NAME"
      }, { status: 400 });
    }

    if (name.trim().length < 1 || name.trim().length > 100) {
      return NextResponse.json({
        error: "Name must be between 1 and 100 characters",
        code: "INVALID_NAME_LENGTH"
      }, { status: 400 });
    }

    if (!targetAmount || typeof targetAmount !== 'number' || targetAmount <= 0) {
      return NextResponse.json({
        error: "Target amount is required and must be a positive number",
        code: "INVALID_TARGET_AMOUNT"
      }, { status: 400 });
    }

    if (typeof currentAmount !== 'number' || currentAmount < 0) {
      return NextResponse.json({
        error: "Current amount must be a number greater than or equal to 0",
        code: "INVALID_CURRENT_AMOUNT"
      }, { status: 400 });
    }

    if (currentAmount > targetAmount) {
      return NextResponse.json({
        error: "Current amount cannot exceed target amount",
        code: "CURRENT_EXCEEDS_TARGET"
      }, { status: 400 });
    }

    if (status && !['active', 'completed', 'paused'].includes(status)) {
      return NextResponse.json({
        error: "Status must be one of: active, completed, paused",
        code: "INVALID_STATUS"
      }, { status: 400 });
    }

    // Validate deadline if provided
    let parsedDeadline = null;
    if (deadline) {
      const deadlineDate = new Date(deadline);
      if (isNaN(deadlineDate.getTime())) {
        return NextResponse.json({
          error: "Deadline must be a valid date",
          code: "INVALID_DEADLINE"
        }, { status: 400 });
      }

      if (deadlineDate <= new Date()) {
        return NextResponse.json({
          error: "Deadline must be in the future",
          code: "DEADLINE_NOT_FUTURE"
        }, { status: 400 });
      }

      parsedDeadline = deadlineDate;
    }

    // Check if name is unique for the user
    const existingGoal = await db.select()
      .from(goals)
      .where(and(eq(goals.userId, session.user.id), eq(goals.name, name.trim())))
      .limit(1);

    if (existingGoal.length > 0) {
      return NextResponse.json({
        error: "A goal with this name already exists",
        code: "DUPLICATE_NAME"
      }, { status: 400 });
    }

    // Validate categoryId if provided
    if (categoryId) {
      if (!Number.isInteger(categoryId)) {
        return NextResponse.json({
          error: "Category ID must be an integer",
          code: "INVALID_CATEGORY_ID"
        }, { status: 400 });
      }

      const category = await db.select()
        .from(categories)
        .where(and(
          eq(categories.id, categoryId),
          eq(categories.userId, session.user.id)
        ))
        .limit(1);

      if (category.length === 0) {
        return NextResponse.json({
          error: "Category not found or not accessible",
          code: "CATEGORY_NOT_FOUND"
        }, { status: 400 });
      }
    }

    const newGoal = await db.insert(goals)
      .values({
        userId: session.user.id,
        name: name.trim(),
        targetAmount,
        currentAmount,
        deadline: parsedDeadline,
        categoryId: categoryId || null,
        status,
        createdAt: new Date()
      })
      .returning();

    // Get the created goal with category info
    const goalWithCategory = await db.select({
      id: goals.id,
      userId: goals.userId,
      name: goals.name,
      targetAmount: goals.targetAmount,
      currentAmount: goals.currentAmount,
      deadline: goals.deadline,
      categoryId: goals.categoryId,
      status: goals.status,
      createdAt: goals.createdAt,
      category: {
        id: categories.id,
        name: categories.name,
        icon: categories.icon
      }
    })
      .from(goals)
      .leftJoin(categories, eq(goals.categoryId, categories.id))
      .where(eq(goals.id, newGoal[0].id))
      .limit(1);

    const goalWithProgress = {
      ...goalWithCategory[0],
      progress: goalWithCategory[0].targetAmount > 0 ? Math.min((goalWithCategory[0].currentAmount / goalWithCategory[0].targetAmount) * 100, 100) : 0,
      isCompleted: goalWithCategory[0].currentAmount >= goalWithCategory[0].targetAmount,
      remainingAmount: Math.max(goalWithCategory[0].targetAmount - goalWithCategory[0].currentAmount, 0)
    };

    return NextResponse.json(goalWithProgress, { status: 201 });
  } catch (error) {
    console.error('POST goals error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}