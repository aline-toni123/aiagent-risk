import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { riskAssessments, riskAlerts, riskReports } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const id = (await params).id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        error: "Valid ID is required",
        code: "INVALID_ID"
      }, { status: 400 });
    }

    const assessment = await db.select()
      .from(riskAssessments)
      .where(and(
        eq(riskAssessments.id, parseInt(id)),
        eq(riskAssessments.userId, session.user.id)
      ))
      .limit(1);

    if (assessment.length === 0) {
      return NextResponse.json({ error: 'Risk assessment not found' }, { status: 404 });
    }

    // Get alerts count for this assessment
    const alertsCount = await db.select({ count: count() })
      .from(riskAlerts)
      .where(and(
        eq(riskAlerts.assessmentId, parseInt(id)),
        eq(riskAlerts.userId, session.user.id)
      ));

    return NextResponse.json({
      ...assessment[0],
      alertsCount: alertsCount[0]?.count || 0
    });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) {
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

    // Check if assessment exists and belongs to user
    const existingAssessment = await db.select()
      .from(riskAssessments)
      .where(and(
        eq(riskAssessments.id, parseInt(id)),
        eq(riskAssessments.userId, session.user.id)
      ))
      .limit(1);

    if (existingAssessment.length === 0) {
      return NextResponse.json({ error: 'Risk assessment not found' }, { status: 404 });
    }

    const {
      applicantName,
      creditScore,
      income,
      debtToIncomeRatio,
      employmentHistory,
      riskLevel,
      aiScore,
      analysisSummary
    } = requestBody;

    // Validation for provided fields
    if (applicantName !== undefined && (!applicantName || typeof applicantName !== 'string' || applicantName.trim().length === 0)) {
      return NextResponse.json({
        error: "Applicant name is required and must be a non-empty string",
        code: "INVALID_APPLICANT_NAME"
      }, { status: 400 });
    }

    if (creditScore !== undefined && (typeof creditScore !== 'number' || creditScore < 300 || creditScore > 850)) {
      return NextResponse.json({
        error: "Credit score must be a number between 300 and 850",
        code: "INVALID_CREDIT_SCORE"
      }, { status: 400 });
    }

    if (income !== undefined && (typeof income !== 'number' || income < 0)) {
      return NextResponse.json({
        error: "Income must be a positive number",
        code: "INVALID_INCOME"
      }, { status: 400 });
    }

    if (debtToIncomeRatio !== undefined && (typeof debtToIncomeRatio !== 'number' || debtToIncomeRatio < 0 || debtToIncomeRatio > 1)) {
      return NextResponse.json({
        error: "Debt to income ratio must be a number between 0 and 1",
        code: "INVALID_DEBT_TO_INCOME_RATIO"
      }, { status: 400 });
    }

    if (riskLevel !== undefined && !['low', 'medium', 'high', 'critical'].includes(riskLevel)) {
      return NextResponse.json({
        error: "Risk level must be one of: low, medium, high, critical",
        code: "INVALID_RISK_LEVEL"
      }, { status: 400 });
    }

    if (aiScore !== undefined && (typeof aiScore !== 'number' || aiScore < 0 || aiScore > 1000)) {
      return NextResponse.json({
        error: "AI score must be a number between 0 and 1000",
        code: "INVALID_AI_SCORE"
      }, { status: 400 });
    }

    // Prepare update data (only include provided fields)
    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (applicantName !== undefined) updateData.applicantName = applicantName.trim();
    if (creditScore !== undefined) updateData.creditScore = creditScore;
    if (income !== undefined) updateData.income = income;
    if (debtToIncomeRatio !== undefined) updateData.debtToIncomeRatio = debtToIncomeRatio;
    if (employmentHistory !== undefined) updateData.employmentHistory = employmentHistory?.trim() || null;
    if (riskLevel !== undefined) updateData.riskLevel = riskLevel;
    if (aiScore !== undefined) updateData.aiScore = aiScore;
    if (analysisSummary !== undefined) updateData.analysisSummary = analysisSummary?.trim() || null;

    const updatedAssessment = await db.update(riskAssessments)
      .set(updateData)
      .where(and(
        eq(riskAssessments.id, parseInt(id)),
        eq(riskAssessments.userId, session.user.id)
      ))
      .returning();

    if (updatedAssessment.length === 0) {
      return NextResponse.json({ error: 'Failed to update risk assessment' }, { status: 500 });
    }

    return NextResponse.json(updatedAssessment[0]);

  } catch (error) {
    console.error('PUT error:', error);
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
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const id = (await params).id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        error: "Valid ID is required",
        code: "INVALID_ID"
      }, { status: 400 });
    }

    // Check if assessment exists and belongs to user
    const existingAssessment = await db.select()
      .from(riskAssessments)
      .where(and(
        eq(riskAssessments.id, parseInt(id)),
        eq(riskAssessments.userId, session.user.id)
      ))
      .limit(1);

    if (existingAssessment.length === 0) {
      return NextResponse.json({ error: 'Risk assessment not found' }, { status: 404 });
    }

    // Delete related alerts first (cascade will handle this, but being explicit)
    await db.delete(riskAlerts)
      .where(and(
        eq(riskAlerts.assessmentId, parseInt(id)),
        eq(riskAlerts.userId, session.user.id)
      ));

    // Delete related reports
    await db.delete(riskReports)
      .where(and(
        eq(riskReports.assessmentId, parseInt(id)),
        eq(riskReports.userId, session.user.id)
      ));

    // Delete the assessment
    const deletedAssessment = await db.delete(riskAssessments)
      .where(and(
        eq(riskAssessments.id, parseInt(id)),
        eq(riskAssessments.userId, session.user.id)
      ))
      .returning();

    if (deletedAssessment.length === 0) {
      return NextResponse.json({ error: 'Failed to delete risk assessment' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Risk assessment deleted successfully',
      deletedAssessmentId: parseInt(id),
      deletedAssessment: deletedAssessment[0]
    });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}