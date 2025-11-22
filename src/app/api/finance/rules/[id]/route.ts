import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { rules, categories } from '@/db/schema';
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

    const result = await db.select({
      id: rules.id,
      pattern: rules.pattern,
      categoryId: rules.categoryId,
      priority: rules.priority,
      createdAt: rules.createdAt,
      userId: rules.userId,
      category: {
        id: categories.id,
        name: categories.name,
        icon: categories.icon,
        parentId: categories.parentId
      }
    })
      .from(rules)
      .leftJoin(categories, eq(rules.categoryId, categories.id))
      .where(and(eq(rules.id, parseInt(id)), eq(rules.userId, session.user.id)))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('GET error:', error);
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

    // Security check: reject if userId or other forbidden fields provided in body
    if ('userId' in requestBody || 'user_id' in requestBody || 'createdAt' in requestBody) {
      return NextResponse.json({
        error: "Immutable fields cannot be updated",
        code: "IMMUTABLE_FIELD_UPDATE"
      }, { status: 400 });
    }

    const { pattern, categoryId, priority } = requestBody;

    // Validate pattern if provided
    if (pattern !== undefined) {
      if (typeof pattern !== 'string' || pattern.trim().length === 0 || pattern.trim().length > 100) {
        return NextResponse.json({
          error: "Pattern must be a string between 1-100 characters",
          code: "INVALID_PATTERN"
        }, { status: 400 });
      }
    }

    // Validate categoryId if provided
    if (categoryId !== undefined) {
      if (!Number.isInteger(categoryId)) {
        return NextResponse.json({
          error: "Category ID must be an integer",
          code: "INVALID_CATEGORY_ID"
        }, { status: 400 });
      }

      // Verify user has access to the new category
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
          code: "CATEGORY_NOT_ACCESSIBLE"
        }, { status: 400 });
      }
    }

    // Validate priority if provided
    if (priority !== undefined && !Number.isInteger(priority)) {
      return NextResponse.json({
        error: "Priority must be an integer",
        code: "INVALID_PRIORITY"
      }, { status: 400 });
    }

    // Check if rule exists and belongs to user
    const existingRule = await db.select()
      .from(rules)
      .where(and(eq(rules.id, parseInt(id)), eq(rules.userId, session.user.id)))
      .limit(1);

    if (existingRule.length === 0) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};
    if (pattern !== undefined) updateData.pattern = pattern.trim();
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (priority !== undefined) updateData.priority = priority;

    // Only update if there are changes
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        error: "No valid fields to update",
        code: "NO_UPDATES"
      }, { status: 400 });
    }

    const updated = await db.update(rules)
      .set(updateData)
      .where(and(eq(rules.id, parseInt(id)), eq(rules.userId, session.user.id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    // Fetch updated rule with category info
    const result = await db.select({
      id: rules.id,
      pattern: rules.pattern,
      categoryId: rules.categoryId,
      priority: rules.priority,
      createdAt: rules.createdAt,
      userId: rules.userId,
      category: {
        id: categories.id,
        name: categories.name,
        icon: categories.icon,
        parentId: categories.parentId
      }
    })
      .from(rules)
      .leftJoin(categories, eq(rules.categoryId, categories.id))
      .where(and(eq(rules.id, parseInt(id)), eq(rules.userId, session.user.id)))
      .limit(1);

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('PATCH error:', error);
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

    // Check if rule exists and belongs to user before deleting
    const existingRule = await db.select()
      .from(rules)
      .where(and(eq(rules.id, parseInt(id)), eq(rules.userId, session.user.id)))
      .limit(1);

    if (existingRule.length === 0) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    const deleted = await db.delete(rules)
      .where(and(eq(rules.id, parseInt(id)), eq(rules.userId, session.user.id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Rule deleted successfully',
      deletedRule: deleted[0]
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}