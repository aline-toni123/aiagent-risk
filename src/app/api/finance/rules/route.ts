import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { rules, categories } from '@/db/schema';
import { eq, and, desc, or, isNull } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Authentication
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Pagination
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Category filter
    const categoryId = searchParams.get('category_id');

    // Base query with user scoping
    let query: any = db.select({
      id: rules.id,
      pattern: rules.pattern,
      categoryId: rules.categoryId,
      priority: rules.priority,
      createdAt: rules.createdAt,
      category: {
        id: categories.id,
        name: categories.name,
        parentId: categories.parentId,
        icon: categories.icon,
        userId: categories.userId
      }
    })
      .from(rules)
      .innerJoin(categories, eq(rules.categoryId, categories.id))
      .where(eq(rules.userId, session.user.id))
      .orderBy(desc(rules.priority));

    // Apply category filter if provided
    if (categoryId) {
      const categoryIdNum = parseInt(categoryId);
      if (!isNaN(categoryIdNum)) {
        query = query.where(
          and(
            eq(rules.userId, session.user.id),
            eq(rules.categoryId, categoryIdNum)
          )
        );
      }
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET rules error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const requestBody = await request.json();
    const { pattern, categoryId, priority } = requestBody;

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED"
      }, { status: 400 });
    }

    // Validation
    if (!pattern) {
      return NextResponse.json({
        error: "Pattern is required",
        code: "MISSING_PATTERN"
      }, { status: 400 });
    }

    if (typeof pattern !== 'string' || pattern.length < 1 || pattern.length > 100) {
      return NextResponse.json({
        error: "Pattern must be between 1 and 100 characters",
        code: "INVALID_PATTERN_LENGTH"
      }, { status: 400 });
    }

    if (!categoryId) {
      return NextResponse.json({
        error: "Category ID is required",
        code: "MISSING_CATEGORY_ID"
      }, { status: 400 });
    }

    const categoryIdNum = parseInt(categoryId);
    if (isNaN(categoryIdNum)) {
      return NextResponse.json({
        error: "Category ID must be a valid integer",
        code: "INVALID_CATEGORY_ID"
      }, { status: 400 });
    }

    // Validate category access (global or user's own)
    const category = await db.select()
      .from(categories)
      .where(
        and(
          eq(categories.id, categoryIdNum),
          or(
            eq(categories.userId, session.user.id), // User's own category
            isNull(categories.userId) // Global category
          )
        )
      )
      .limit(1);

    if (category.length === 0) {
      return NextResponse.json({
        error: "Category not found or not accessible",
        code: "CATEGORY_NOT_ACCESSIBLE"
      }, { status: 400 });
    }

    // Validate priority if provided
    const priorityValue = priority !== undefined ? parseInt(priority) : 0;
    if (priority !== undefined && isNaN(priorityValue)) {
      return NextResponse.json({
        error: "Priority must be a valid integer",
        code: "INVALID_PRIORITY"
      }, { status: 400 });
    }

    // Create new rule
    const newRule = await db.insert(rules)
      .values({
        userId: session.user.id,
        pattern: pattern.trim(),
        categoryId: categoryIdNum,
        priority: priorityValue,
        createdAt: new Date()
      })
      .returning();

    // Get the created rule with category info
    const createdRuleWithCategory = await db.select({
      id: rules.id,
      pattern: rules.pattern,
      categoryId: rules.categoryId,
      priority: rules.priority,
      createdAt: rules.createdAt,
      category: {
        id: categories.id,
        name: categories.name,
        parentId: categories.parentId,
        icon: categories.icon,
        userId: categories.userId
      }
    })
      .from(rules)
      .innerJoin(categories, eq(rules.categoryId, categories.id))
      .where(eq(rules.id, newRule[0].id))
      .limit(1);

    return NextResponse.json(createdRuleWithCategory[0], { status: 201 });
  } catch (error) {
    console.error('POST rules error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}