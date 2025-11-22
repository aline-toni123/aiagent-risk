import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { riskAlerts, riskAssessments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        error: "Valid ID is required",
        code: "INVALID_ID"
      }, { status: 400 });
    }

    const alert = await db.select({
      id: riskAlerts.id,
      userId: riskAlerts.userId,
      assessmentId: riskAlerts.assessmentId,
      type: riskAlerts.type,
      message: riskAlerts.message,
      severity: riskAlerts.severity,
      isResolved: riskAlerts.isResolved,
      createdAt: riskAlerts.createdAt,
      assessment: {
        id: riskAssessments.id,
        applicantName: riskAssessments.applicantName,
        creditScore: riskAssessments.creditScore,
        income: riskAssessments.income,
        debtToIncomeRatio: riskAssessments.debtToIncomeRatio,
        employmentHistory: riskAssessments.employmentHistory,
        riskLevel: riskAssessments.riskLevel,
        aiScore: riskAssessments.aiScore,
        analysisSummary: riskAssessments.analysisSummary,
        createdAt: riskAssessments.createdAt,
      }
    })
      .from(riskAlerts)
      .leftJoin(riskAssessments, eq(riskAlerts.assessmentId, riskAssessments.id))
      .where(
        and(
          eq(riskAlerts.id, parseInt(id)),
          eq(riskAlerts.userId, session.user.id)
        )
      )
      .limit(1);

    if (alert.length === 0) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    return NextResponse.json(alert[0]);

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
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

    // Check if alert exists and belongs to user
    const existingAlert = await db.select()
      .from(riskAlerts)
      .where(
        and(
          eq(riskAlerts.id, parseInt(id)),
          eq(riskAlerts.userId, session.user.id)
        )
      )
      .limit(1);

    if (existingAlert.length === 0) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    // Prepare update data
    const updates: any = {};

    if (requestBody.type !== undefined) {
      if (!requestBody.type || !['fraud', 'default', 'compliance', 'anomaly'].includes(requestBody.type)) {
        return NextResponse.json({
          error: "Type must be one of: fraud, default, compliance, anomaly",
          code: "INVALID_TYPE"
        }, { status: 400 });
      }
      updates.type = requestBody.type;
    }

    if (requestBody.message !== undefined) {
      if (!requestBody.message || typeof requestBody.message !== 'string') {
        return NextResponse.json({
          error: "Message is required and must be a string",
          code: "INVALID_MESSAGE"
        }, { status: 400 });
      }
      updates.message = requestBody.message.trim();
    }

    if (requestBody.severity !== undefined) {
      if (!requestBody.severity || !['low', 'medium', 'high', 'critical'].includes(requestBody.severity)) {
        return NextResponse.json({
          error: "Severity must be one of: low, medium, high, critical",
          code: "INVALID_SEVERITY"
        }, { status: 400 });
      }
      updates.severity = requestBody.severity;
    }

    if (requestBody.isResolved !== undefined) {
      if (typeof requestBody.isResolved !== 'boolean') {
        return NextResponse.json({
          error: "isResolved must be a boolean",
          code: "INVALID_IS_RESOLVED"
        }, { status: 400 });
      }
      updates.isResolved = requestBody.isResolved;
    }

    if (requestBody.assessmentId !== undefined) {
      if (!requestBody.assessmentId || isNaN(parseInt(requestBody.assessmentId))) {
        return NextResponse.json({
          error: "Valid assessment ID is required",
          code: "INVALID_ASSESSMENT_ID"
        }, { status: 400 });
      }

      // Verify assessment exists and belongs to user
      const assessment = await db.select()
        .from(riskAssessments)
        .where(
          and(
            eq(riskAssessments.id, parseInt(requestBody.assessmentId)),
            eq(riskAssessments.userId, session.user.id)
          )
        )
        .limit(1);

      if (assessment.length === 0) {
        return NextResponse.json({
          error: "Assessment not found or does not belong to user",
          code: "ASSESSMENT_NOT_FOUND"
        }, { status: 400 });
      }

      updates.assessmentId = parseInt(requestBody.assessmentId);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({
        error: "No valid fields provided for update",
        code: "NO_UPDATE_FIELDS"
      }, { status: 400 });
    }

    const updated = await db.update(riskAlerts)
      .set(updates)
      .where(
        and(
          eq(riskAlerts.id, parseInt(id)),
          eq(riskAlerts.userId, session.user.id)
        )
      )
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    return NextResponse.json(updated[0]);

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        error: "Valid ID is required",
        code: "INVALID_ID"
      }, { status: 400 });
    }

    // Check if alert exists and belongs to user before deleting
    const existingAlert = await db.select()
      .from(riskAlerts)
      .where(
        and(
          eq(riskAlerts.id, parseInt(id)),
          eq(riskAlerts.userId, session.user.id)
        )
      )
      .limit(1);

    if (existingAlert.length === 0) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    const deleted = await db.delete(riskAlerts)
      .where(
        and(
          eq(riskAlerts.id, parseInt(id)),
          eq(riskAlerts.userId, session.user.id)
        )
      )
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Alert deleted successfully',
      deletedAlert: deleted[0]
    });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}