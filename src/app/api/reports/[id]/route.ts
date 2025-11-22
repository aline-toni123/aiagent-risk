import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { riskReports, riskAssessments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
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

    const report = await db.select({
      id: riskReports.id,
      userId: riskReports.userId,
      assessmentId: riskReports.assessmentId,
      reportSummary: riskReports.reportSummary,
      pdfUrl: riskReports.pdfUrl,
      generatedAt: riskReports.generatedAt,
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
      .from(riskReports)
      .leftJoin(riskAssessments, eq(riskReports.assessmentId, riskAssessments.id))
      .where(and(eq(riskReports.id, parseInt(id)), eq(riskReports.userId, session.user.id)))
      .limit(1);

    if (report.length === 0) {
      return NextResponse.json({ error: 'Risk report not found' }, { status: 404 });
    }

    return NextResponse.json(report[0]);
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
    const session = await auth.api.getSession({ headers: request.headers });
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

    // Check if record exists and belongs to user
    const existingReport = await db.select()
      .from(riskReports)
      .where(and(eq(riskReports.id, parseInt(id)), eq(riskReports.userId, session.user.id)))
      .limit(1);

    if (existingReport.length === 0) {
      return NextResponse.json({ error: 'Risk report not found' }, { status: 404 });
    }

    const { assessmentId, reportSummary, pdfUrl } = requestBody;

    // Validate required fields
    if (!reportSummary) {
      return NextResponse.json({
        error: "Report summary is required",
        code: "MISSING_REQUIRED_FIELD"
      }, { status: 400 });
    }

    // Validate assessmentId if provided
    if (assessmentId !== undefined) {
      if (!assessmentId || isNaN(parseInt(assessmentId))) {
        return NextResponse.json({
          error: "Valid assessment ID is required",
          code: "INVALID_ASSESSMENT_ID"
        }, { status: 400 });
      }

      // Check if assessment exists and belongs to user
      const assessment = await db.select()
        .from(riskAssessments)
        .where(and(eq(riskAssessments.id, parseInt(assessmentId)), eq(riskAssessments.userId, session.user.id)))
        .limit(1);

      if (assessment.length === 0) {
        return NextResponse.json({
          error: "Assessment not found or access denied",
          code: "ASSESSMENT_NOT_FOUND"
        }, { status: 400 });
      }
    }

    // Prepare update data
    const updateData: any = {
      reportSummary: reportSummary.trim(),
    };

    if (assessmentId !== undefined) {
      updateData.assessmentId = parseInt(assessmentId);
    }

    if (pdfUrl !== undefined) {
      updateData.pdfUrl = pdfUrl ? pdfUrl.trim() : null;
    }

    const updated = await db.update(riskReports)
      .set(updateData)
      .where(and(eq(riskReports.id, parseInt(id)), eq(riskReports.userId, session.user.id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Risk report not found' }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
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
    const session = await auth.api.getSession({ headers: request.headers });
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

    // Check if record exists and belongs to user before deleting
    const existingReport = await db.select()
      .from(riskReports)
      .where(and(eq(riskReports.id, parseInt(id)), eq(riskReports.userId, session.user.id)))
      .limit(1);

    if (existingReport.length === 0) {
      return NextResponse.json({ error: 'Risk report not found' }, { status: 404 });
    }

    const deleted = await db.delete(riskReports)
      .where(and(eq(riskReports.id, parseInt(id)), eq(riskReports.userId, session.user.id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Risk report not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Risk report deleted successfully',
      deletedReport: deleted[0]
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}