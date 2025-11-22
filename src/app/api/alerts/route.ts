import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { riskAlerts, riskAssessments } from '@/db/schema';
import { eq, like, and, or, desc, asc, SQL } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const type = searchParams.get('type');
    const severity = searchParams.get('severity');
    const resolved = searchParams.get('resolved');
    const assessmentId = searchParams.get('assessment_id');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';

    // Build where conditions
    const conditions: SQL[] = [eq(riskAlerts.userId, session.user.id)];

    if (type) {
      conditions.push(eq(riskAlerts.type, type));
    }

    if (severity) {
      conditions.push(eq(riskAlerts.severity, severity));
    }

    if (resolved !== null && resolved !== undefined) {
      const isResolved = resolved === 'true';
      conditions.push(eq(riskAlerts.isResolved, isResolved));
    }

    if (assessmentId) {
      const assessmentIdInt = parseInt(assessmentId);
      if (!isNaN(assessmentIdInt)) {
        conditions.push(eq(riskAlerts.assessmentId, assessmentIdInt));
      }
    }

    if (search) {
      const searchCondition = or(
        like(riskAlerts.message, `%${search}%`),
        like(riskAssessments.applicantName, `%${search}%`)
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    // Build base query with all conditions
    let query: any = db.select({
      id: riskAlerts.id,
      userId: riskAlerts.userId,
      assessmentId: riskAlerts.assessmentId,
      type: riskAlerts.type,
      message: riskAlerts.message,
      severity: riskAlerts.severity,
      isResolved: riskAlerts.isResolved,
      createdAt: riskAlerts.createdAt,
      assessment: {
        applicantName: riskAssessments.applicantName,
        riskLevel: riskAssessments.riskLevel,
        aiScore: riskAssessments.aiScore
      }
    })
      .from(riskAlerts)
      .innerJoin(riskAssessments, eq(riskAlerts.assessmentId, riskAssessments.id))
      .where(and(...conditions));

    // Add sorting
    const orderFn = order === 'asc' ? asc : desc;
    if (sort === 'createdAt') {
      query = query.orderBy(orderFn(riskAlerts.createdAt));
    } else if (sort === 'severity') {
      query = query.orderBy(orderFn(riskAlerts.severity));
    } else if (sort === 'type') {
      query = query.orderBy(orderFn(riskAlerts.type));
    } else {
      query = query.orderBy(orderFn(riskAlerts.createdAt));
    }

    const results = await query.limit(limit).offset(offset);

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
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const requestBody = await request.json();
    const { assessmentId, type, message, severity, isResolved } = requestBody;

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED"
      }, { status: 400 });
    }

    // Validate required fields
    if (!assessmentId) {
      return NextResponse.json({
        error: "Assessment ID is required",
        code: "MISSING_ASSESSMENT_ID"
      }, { status: 400 });
    }

    if (!type) {
      return NextResponse.json({
        error: "Type is required",
        code: "MISSING_TYPE"
      }, { status: 400 });
    }

    if (!message) {
      return NextResponse.json({
        error: "Message is required",
        code: "MISSING_MESSAGE"
      }, { status: 400 });
    }

    if (!severity) {
      return NextResponse.json({
        error: "Severity is required",
        code: "MISSING_SEVERITY"
      }, { status: 400 });
    }

    // Validate assessmentId is valid integer
    const assessmentIdInt = parseInt(assessmentId);
    if (isNaN(assessmentIdInt)) {
      return NextResponse.json({
        error: "Valid assessment ID is required",
        code: "INVALID_ASSESSMENT_ID"
      }, { status: 400 });
    }

    // Validate type
    const validTypes = ['fraud', 'default', 'compliance', 'anomaly'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({
        error: "Type must be one of: fraud, default, compliance, anomaly",
        code: "INVALID_TYPE"
      }, { status: 400 });
    }

    // Validate severity
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (!validSeverities.includes(severity)) {
      return NextResponse.json({
        error: "Severity must be one of: low, medium, high, critical",
        code: "INVALID_SEVERITY"
      }, { status: 400 });
    }

    // Validate message length
    const trimmedMessage = message.trim();
    if (trimmedMessage.length < 10) {
      return NextResponse.json({
        error: "Message must be at least 10 characters long",
        code: "MESSAGE_TOO_SHORT"
      }, { status: 400 });
    }

    if (trimmedMessage.length > 500) {
      return NextResponse.json({
        error: "Message must be no more than 500 characters long",
        code: "MESSAGE_TOO_LONG"
      }, { status: 400 });
    }

    // Validate that assessment exists and belongs to user
    const assessment = await db.select()
      .from(riskAssessments)
      .where(and(
        eq(riskAssessments.id, assessmentIdInt),
        eq(riskAssessments.userId, session.user.id)
      ))
      .limit(1);

    if (assessment.length === 0) {
      return NextResponse.json({
        error: "Assessment not found or does not belong to user",
        code: "INVALID_ASSESSMENT_REFERENCE"
      }, { status: 400 });
    }

    // Create new risk alert
    const newAlert = await db.insert(riskAlerts)
      .values({
        userId: session.user.id,
        assessmentId: assessmentIdInt,
        type: type.trim(),
        message: trimmedMessage,
        severity: severity.trim(),
        isResolved: isResolved || false,
        createdAt: new Date().toISOString()
      })
      .returning();

    return NextResponse.json(newAlert[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}