import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { riskReports, riskAssessments } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
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
    const assessmentId = searchParams.get('assessment_id');

    let whereCondition: any = eq(riskReports.userId, session.user.id);

    if (assessmentId) {
      const assessmentIdInt = parseInt(assessmentId);
      if (isNaN(assessmentIdInt)) {
        return NextResponse.json({
          error: 'Invalid assessment_id format',
          code: 'INVALID_ASSESSMENT_ID'
        }, { status: 400 });
      }
      whereCondition = and(
        eq(riskReports.userId, session.user.id),
        eq(riskReports.assessmentId, assessmentIdInt)
      );
    }

    const reports = await db
      .select({
        id: riskReports.id,
        userId: riskReports.userId,
        assessmentId: riskReports.assessmentId,
        reportSummary: riskReports.reportSummary,
        pdfUrl: riskReports.pdfUrl,
        generatedAt: riskReports.generatedAt,
        assessment: {
          applicantName: riskAssessments.applicantName,
          riskLevel: riskAssessments.riskLevel,
          aiScore: riskAssessments.aiScore
        }
      })
      .from(riskReports)
      .leftJoin(riskAssessments, eq(riskReports.assessmentId, riskAssessments.id))
      .where(whereCondition)
      .orderBy(desc(riskReports.generatedAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(reports);
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

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED"
      }, { status: 400 });
    }

    const { assessmentId, reportSummary, pdfUrl } = requestBody;

    // Validate required fields
    if (!assessmentId) {
      return NextResponse.json({
        error: "Assessment ID is required",
        code: "MISSING_ASSESSMENT_ID"
      }, { status: 400 });
    }

    if (!reportSummary) {
      return NextResponse.json({
        error: "Report summary is required",
        code: "MISSING_REPORT_SUMMARY"
      }, { status: 400 });
    }

    // Validate assessmentId format
    const assessmentIdInt = parseInt(assessmentId);
    if (isNaN(assessmentIdInt)) {
      return NextResponse.json({
        error: "Valid assessment ID is required",
        code: "INVALID_ASSESSMENT_ID"
      }, { status: 400 });
    }

    // Validate reportSummary length
    const trimmedSummary = reportSummary.trim();
    if (trimmedSummary.length < 20) {
      return NextResponse.json({
        error: "Report summary must be at least 20 characters long",
        code: "REPORT_SUMMARY_TOO_SHORT"
      }, { status: 400 });
    }

    if (trimmedSummary.length > 2000) {
      return NextResponse.json({
        error: "Report summary cannot exceed 2000 characters",
        code: "REPORT_SUMMARY_TOO_LONG"
      }, { status: 400 });
    }

    // Validate pdfUrl format if provided
    if (pdfUrl) {
      try {
        new URL(pdfUrl);
      } catch {
        return NextResponse.json({
          error: "Invalid PDF URL format",
          code: "INVALID_PDF_URL"
        }, { status: 400 });
      }
    }

    // Verify assessment exists and belongs to user
    const assessment = await db
      .select()
      .from(riskAssessments)
      .where(and(
        eq(riskAssessments.id, assessmentIdInt),
        eq(riskAssessments.userId, session.user.id)
      ))
      .limit(1);

    if (assessment.length === 0) {
      return NextResponse.json({
        error: "Assessment not found or does not belong to user",
        code: "ASSESSMENT_NOT_FOUND"
      }, { status: 400 });
    }

    // Create new risk report
    const insertData = {
      userId: session.user.id,
      assessmentId: assessmentIdInt,
      reportSummary: trimmedSummary,
      pdfUrl: pdfUrl || null,
      generatedAt: new Date().toISOString()
    };

    const newReport = await db
      .insert(riskReports)
      .values(insertData)
      .returning();

    return NextResponse.json(newReport[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}