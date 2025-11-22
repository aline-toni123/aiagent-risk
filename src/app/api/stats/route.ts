import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { riskAssessments, riskAlerts, riskReports } from '@/db/schema';
import { eq, and, gte, desc, avg, count, sql, or } from 'drizzle-orm';
import { auth } from '@/lib/auth';

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMinutes < 60) {
    return `${diffMinutes} minutes ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hours ago`;
  } else if (diffDays < 30) {
    return `${diffDays} days ago`;
  } else {
    return `${diffMonths} months ago`;
  }
}

function getTypeFromRiskLevel(riskLevel: string): 'success' | 'warning' | 'info' | 'error' {
  switch (riskLevel) {
    case 'low':
    case 'medium':
      return 'success';
    case 'high':
      return 'warning';
    case 'critical':
      return 'error';
    default:
      return 'info';
  }
}

function getTypeFromSeverity(severity: string): 'success' | 'warning' | 'info' | 'error' {
  switch (severity) {
    case 'low':
      return 'info';
    case 'medium':
      return 'warning';
    case 'high':
    case 'critical':
      return 'error';
    default:
      return 'info';
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get current month start date
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Get total risk score (average of all aiScore) and active assessments count
    const assessmentStats = await db
      .select({
        avgScore: avg(riskAssessments.aiScore),
        count: count(riskAssessments.id),
      })
      .from(riskAssessments)
      .where(eq(riskAssessments.userId, userId));

    const totalRiskScore = assessmentStats[0]?.avgScore ? Math.round(Number(assessmentStats[0].avgScore)) : 0;
    const activeAssessments = assessmentStats[0]?.count || 0;

    // 2. Get high risk alerts count (unresolved with severity 'high' or 'critical')
    const highRiskAlertsResult = await db
      .select({ count: count(riskAlerts.id) })
      .from(riskAlerts)
      .where(
        and(
          eq(riskAlerts.userId, userId),
          eq(riskAlerts.isResolved, false),
          or(eq(riskAlerts.severity, 'high'), eq(riskAlerts.severity, 'critical'))
        )
      );

    const highRiskAlerts = highRiskAlertsResult[0]?.count || 0;

    // 3. Get monthly analyses count (assessments created in current month)
    const monthlyAnalysesResult = await db
      .select({ count: count(riskAssessments.id) })
      .from(riskAssessments)
      .where(
        and(
          eq(riskAssessments.userId, userId),
          gte(riskAssessments.createdAt, monthStart.toISOString())
        )
      );

    const monthlyAnalyses = monthlyAnalysesResult[0]?.count || 0;

    // 4. Get recent activity from all three tables
    const recentAssessments = await db
      .select({
        id: riskAssessments.id,
        applicantName: riskAssessments.applicantName,
        riskLevel: riskAssessments.riskLevel,
        createdAt: riskAssessments.createdAt,
        type: sql<string>`'assessment'`,
      })
      .from(riskAssessments)
      .where(eq(riskAssessments.userId, userId))
      .orderBy(desc(riskAssessments.createdAt))
      .limit(10);

    const recentAlerts = await db
      .select({
        id: riskAlerts.id,
        type: riskAlerts.type,
        message: riskAlerts.message,
        severity: riskAlerts.severity,
        createdAt: riskAlerts.createdAt,
        sourceType: sql<string>`'alert'`,
      })
      .from(riskAlerts)
      .where(eq(riskAlerts.userId, userId))
      .orderBy(desc(riskAlerts.createdAt))
      .limit(10);

    const recentReports = await db
      .select({
        id: riskReports.id,
        generatedAt: riskReports.generatedAt,
        type: sql<string>`'report'`,
      })
      .from(riskReports)
      .where(eq(riskReports.userId, userId))
      .orderBy(desc(riskReports.generatedAt))
      .limit(10);

    // Combine and format recent activity
    const allRecentItems: any[] = [];

    // Add assessments
    recentAssessments.forEach(assessment => {
      allRecentItems.push({
        title: 'Risk Assessment',
        description: `Assessment for ${assessment.applicantName}`,
        time: formatRelativeTime(assessment.createdAt),
        type: getTypeFromRiskLevel(assessment.riskLevel),
        date: new Date(assessment.createdAt),
      });
    });

    // Add alerts
    recentAlerts.forEach(alert => {
      allRecentItems.push({
        title: 'Risk Alert',
        description: `${alert.type} alert: ${alert.message}`,
        time: formatRelativeTime(alert.createdAt),
        type: getTypeFromSeverity(alert.severity),
        date: new Date(alert.createdAt),
      });
    });

    // Add reports
    recentReports.forEach(report => {
      allRecentItems.push({
        title: 'Risk Report',
        description: 'Report generated for assessment',
        time: formatRelativeTime(report.generatedAt),
        type: 'info' as const,
        date: new Date(report.generatedAt),
      });
    });

    // Sort by date and take top 5
    const recentActivity = allRecentItems
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5)
      .map(({ date, ...item }) => item);

    const stats = {
      totalRiskScore,
      activeAssessments,
      highRiskAlerts,
      monthlyAnalyses,
      recentActivity,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('GET /api/stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}