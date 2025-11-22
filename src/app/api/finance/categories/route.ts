import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { eq, isNull, or, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const globalOnly = searchParams.get('global_only') === 'true';
    const userOnly = searchParams.get('user_only') === 'true';

    let query: any = db.select().from(categories);

    if (globalOnly) {
      // Return only global categories (userId IS NULL)
      query = query.where(isNull(categories.userId));
    } else if (userOnly) {
      // Return only user's categories
      query = query.where(eq(categories.userId, session.user.id));
    } else {
      // Return both global and user categories (default)
      query = query.where(
        or(
          isNull(categories.userId),
          eq(categories.userId, session.user.id)
        )
      );
    }

    const results = await query;
    return NextResponse.json(results);

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const requestBody = await request.json();
    const { name, parentId, icon } = requestBody;

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED"
      }, { status: 400 });
    }

    // Validation: name is required
    if (!name || typeof name !== 'string') {
      return NextResponse.json({
        error: "Name is required and must be a string",
        code: "INVALID_NAME"
      }, { status: 400 });
    }

    // Validation: name length (1-50 chars)
    const trimmedName = name.trim();
    if (trimmedName.length < 1 || trimmedName.length > 50) {
      return NextResponse.json({
        error: "Name must be between 1 and 50 characters",
        code: "INVALID_NAME_LENGTH"
      }, { status: 400 });
    }

    // Validation: icon length (max 50 chars)
    if (icon && (typeof icon !== 'string' || icon.length > 50)) {
      return NextResponse.json({
        error: "Icon must be a string with maximum 50 characters",
        code: "INVALID_ICON"
      }, { status: 400 });
    }

    // Validation: parentId must be integer if provided
    if (parentId !== undefined && parentId !== null && (!Number.isInteger(parentId) || parentId < 1)) {
      return NextResponse.json({
        error: "Parent ID must be a valid positive integer",
        code: "INVALID_PARENT_ID"
      }, { status: 400 });
    }

    // Check name uniqueness for this user
    const existingCategory = await db.select()
      .from(categories)
      .where(
        and(
          eq(categories.name, trimmedName),
          eq(categories.userId, session.user.id)
        )
      )
      .limit(1);

    if (existingCategory.length > 0) {
      return NextResponse.json({
        error: "Category name already exists for this user",
        code: "DUPLICATE_NAME"
      }, { status: 400 });
    }

    // Validation: if parentId provided, check if parent exists and is accessible
    if (parentId) {
      const parentCategory = await db.select()
        .from(categories)
        .where(
          and(
            eq(categories.id, parentId),
            or(
              isNull(categories.userId), // Global category
              eq(categories.userId, session.user.id) // User's own category
            )
          )
        )
        .limit(1);

      if (parentCategory.length === 0) {
        return NextResponse.json({
          error: "Parent category not found or not accessible",
          code: "INVALID_PARENT"
        }, { status: 400 });
      }
    }

    // Create new category
    const insertData = {
      userId: session.user.id,
      name: trimmedName,
      parentId: parentId || null,
      icon: icon ? icon.trim() : null
    };

    const newCategory = await db.insert(categories)
      .values(insertData)
      .returning();

    return NextResponse.json((newCategory as any)[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}