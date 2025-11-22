import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { budgets, categories } from '@/db/schema';
import { eq, and, or, isNull } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const categoryId = searchParams.get('category_id');

    let query = db.select({
      id: budgets.id,
      userId: budgets.userId,
      categoryId: budgets.categoryId,
      month: budgets.month,
      year: budgets.year,
      amount: budgets.amount,
      createdAt: budgets.createdAt,
      categoryName: categories.name,
      categoryIcon: categories.icon
    })
      .from(budgets)
      .leftJoin(categories, eq(budgets.categoryId, categories.id))
      .where(eq(budgets.userId, session.user.id));

    // Apply filters
    const conditions = [eq(budgets.userId, session.user.id)];

    if (month && !isNaN(parseInt(month))) {
      const monthInt = parseInt(month);
      if (monthInt >= 1 && monthInt <= 12) {
        conditions.push(eq(budgets.month, monthInt));
      }
    }

    if (year && !isNaN(parseInt(year))) {
      const yearInt = parseInt(year);
      if (yearInt >= 2020 && yearInt <= 2030) {
        conditions.push(eq(budgets.year, yearInt));
      }
    }

    if (categoryId && !isNaN(parseInt(categoryId))) {
      conditions.push(eq(budgets.categoryId, parseInt(categoryId)));
    }

    if (conditions.length > 1) {
      query = db.select({
        id: budgets.id,
        userId: budgets.userId,
        categoryId: budgets.categoryId,
        month: budgets.month,
        year: budgets.year,
        amount: budgets.amount,
        createdAt: budgets.createdAt,
        categoryName: categories.name,
        categoryIcon: categories.icon
      })
        .from(budgets)
        .leftJoin(categories, eq(budgets.categoryId, categories.id))
        .where(and(...conditions));
    }

    const results = await query.limit(limit).offset(offset);
    return NextResponse.json(results);

  } catch (error) {
    console.error('GET budgets error:', error);
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
    const { categoryId, month, year, amount } = requestBody;

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED"
      }, { status: 400 });
    }

    // Validate required fields
    if (!categoryId) {
      return NextResponse.json({
        error: "Category ID is required",
        code: "MISSING_CATEGORY_ID"
      }, { status: 400 });
    }

    if (!month) {
      return NextResponse.json({
        error: "Month is required",
        code: "MISSING_MONTH"
      }, { status: 400 });
    }

    if (!year) {
      return NextResponse.json({
        error: "Year is required",
        code: "MISSING_YEAR"
      }, { status: 400 });
    }

    if (amount === undefined || amount === null) {
      return NextResponse.json({
        error: "Amount is required",
        code: "MISSING_AMOUNT"
      }, { status: 400 });
    }

    // Validate field formats
    const categoryIdInt = parseInt(categoryId);
    if (isNaN(categoryIdInt)) {
      return NextResponse.json({
        error: "Category ID must be a valid integer",
        code: "INVALID_CATEGORY_ID"
      }, { status: 400 });
    }

    const monthInt = parseInt(month);
    if (isNaN(monthInt) || monthInt < 1 || monthInt > 12) {
      return NextResponse.json({
        error: "Month must be an integer between 1 and 12",
        code: "INVALID_MONTH"
      }, { status: 400 });
    }

    const yearInt = parseInt(year);
    if (isNaN(yearInt) || yearInt < 2020 || yearInt > 2030) {
      return NextResponse.json({
        error: "Year must be an integer between 2020 and 2030",
        code: "INVALID_YEAR"
      }, { status: 400 });
    }

    const amountFloat = parseFloat(amount);
    if (isNaN(amountFloat) || amountFloat <= 0) {
      return NextResponse.json({
        error: "Amount must be a positive number",
        code: "INVALID_AMOUNT"
      }, { status: 400 });
    }

    // Verify category exists and user has access to it (global or user's own)
    const category = await db.select()
      .from(categories)
      .where(and(
        eq(categories.id, categoryIdInt),
        or(
          eq(categories.userId, session.user.id),
          isNull(categories.userId) // Global categories
        )
      ))
      .limit(1);

    if (category.length === 0) {
      return NextResponse.json({
        error: "Category not found or access denied",
        code: "CATEGORY_ACCESS_DENIED"
      }, { status: 400 });
    }

    // Check for existing budget (unique constraint: one budget per category per month/year per user)
    const existingBudget = await db.select()
      .from(budgets)
      .where(and(
        eq(budgets.userId, session.user.id),
        eq(budgets.categoryId, categoryIdInt),
        eq(budgets.month, monthInt),
        eq(budgets.year, yearInt)
      ))
      .limit(1);

    if (existingBudget.length > 0) {
      return NextResponse.json({
        error: "Budget already exists for this category and month/year",
        code: "DUPLICATE_BUDGET"
      }, { status: 400 });
    }

    // Create the budget
    const newBudget = await db.insert(budgets)
      .values({
        userId: session.user.id,
        categoryId: categoryIdInt,
        month: monthInt,
        year: yearInt,
        amount: amountFloat,
        createdAt: new Date()
      })
      .returning();

    return NextResponse.json(newBudget[0], { status: 201 });

  } catch (error) {
    console.error('POST budgets error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}