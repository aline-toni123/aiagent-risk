import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

function calculateRiskScore(data: {
  creditScore: number;
  income: number;
  debtToIncomeRatio: number;
  employmentHistory?: string;
}) {
  let baseScore = data.creditScore;
  
  // Normalize income contribution (scale to reasonable range)
  const incomeContribution = Math.min(data.income / 1000, 100) * 2;
  baseScore += incomeContribution;
  
  // Debt penalty
  baseScore -= data.debtToIncomeRatio * 300;
  
  // Employment stability bonus
  if (data.employmentHistory && data.employmentHistory.length > 50) {
    baseScore += 50;
  }
  
  // Clamp between 300-850
  const aiScore = Math.max(300, Math.min(850, baseScore));
  
  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical';
  if (aiScore >= 700) {
    riskLevel = 'low';
  } else if (aiScore >= 600) {
    riskLevel = 'medium';
  } else if (aiScore >= 500) {
    riskLevel = 'high';
  } else {
    riskLevel = 'critical';
  }
  
  return {
    aiScore: Math.round(aiScore),
    riskLevel,
    analysisSummary: generateAnalysis(aiScore, riskLevel, data)
  };
}

function generateAnalysis(aiScore: number, riskLevel: string, data: any): string {
  let summary = `AI Risk Analysis: Score ${aiScore}/850 (${riskLevel} risk). `;
  
  if (data.creditScore < 600) {
    summary += 'Low credit score is a major concern. ';
  }
  if (data.debtToIncomeRatio > 0.4) {
    summary += 'High debt-to-income ratio increases default risk. ';
  }
  if (data.income < 40000) {
    summary += 'Low income level may affect repayment ability. ';
  }
  
  if (riskLevel === 'low') {
    summary += 'Application recommended for approval.';
  } else if (riskLevel === 'medium') {
    summary += 'Consider conditional approval with monitoring.';
  } else if (riskLevel === 'high') {
    summary += 'High risk - recommend additional verification.';
  } else {
    summary += 'Critical risk - application should be declined.';
  }
  
  return summary;
}

export async function POST(request: NextRequest) {
  try {
    // Optional auth - calculation is public but can be behind auth
    const session = await auth.api.getSession({ headers: request.headers });
    
    const body = await request.json();
    
    const { applicantName, creditScore, income, debtToIncomeRatio, employmentHistory } = body;
    
    // Basic validation
    if (!applicantName || typeof applicantName !== 'string' || applicantName.trim().length < 2) {
      return NextResponse.json({ error: 'Invalid applicant name' }, { status: 400 });
    }
    
    if (!creditScore || typeof creditScore !== 'number' || creditScore < 300 || creditScore > 850) {
      return NextResponse.json({ error: 'Invalid credit score' }, { status: 400 });
    }
    
    if (!income || typeof income !== 'number' || income <= 0) {
      return NextResponse.json({ error: 'Invalid income' }, { status: 400 });
    }
    
    if (!debtToIncomeRatio || typeof debtToIncomeRatio !== 'number' || debtToIncomeRatio < 0 || debtToIncomeRatio > 1) {
      return NextResponse.json({ error: 'Invalid debt-to-income ratio' }, { status: 400 });
    }
    
    const calculation = calculateRiskScore({
      creditScore,
      income,
      debtToIncomeRatio,
      employmentHistory: employmentHistory || ''
    });
    
    return NextResponse.json({
      ...calculation,
      applicantName: applicantName.trim()
    });
    
  } catch (error) {
    console.error('Calculation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}