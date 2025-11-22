import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { riskAssessments } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET(request: NextRequest) {
  try {
    // Authentication check using better-auth
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || !session.user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED' 
      }, { status: 401 });
    }

    const userId = session.user.id;

    // Query all historical risk assessments for the authenticated user
    const assessments = await db.select({
      id: riskAssessments.id,
      applicantName: riskAssessments.applicantName,
      creditScore: riskAssessments.creditScore,
      income: riskAssessments.income,
      debtToIncomeRatio: riskAssessments.debtToIncomeRatio,
      aiScore: riskAssessments.aiScore,
      riskLevel: riskAssessments.riskLevel,
      createdAt: riskAssessments.createdAt
    })
    .from(riskAssessments)
    .where(eq(riskAssessments.userId, userId))
    .orderBy(desc(riskAssessments.createdAt));

    // Check if user has any assessments
    if (assessments.length === 0) {
      return NextResponse.json({ 
        error: 'No risk assessments found for this user. Please create some assessments first to generate forecasts.',
        code: 'NO_ASSESSMENTS_FOUND' 
      }, { status: 404 });
    }

    // Initialize Google Gemini AI
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not configured');
      return NextResponse.json({ 
        error: 'AI service configuration error',
        code: 'AI_CONFIG_ERROR' 
      }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Prepare historical data for the prompt
    const historicalData = assessments.map(assessment => ({
      date: assessment.createdAt,
      applicantName: assessment.applicantName,
      creditScore: assessment.creditScore,
      income: assessment.income,
      debtToIncomeRatio: assessment.debtToIncomeRatio,
      aiScore: assessment.aiScore,
      riskLevel: assessment.riskLevel
    }));

    // Create comprehensive prompt for Gemini
    const prompt = `You are a financial risk forecasting AI. Based on the following historical risk assessment data, generate 6-12 month projections:

HISTORICAL DATA:
${JSON.stringify(historicalData, null, 2)}

Please analyze trends in credit score, income, debt-to-income ratio, and AI risk scores. Generate forecasts in this EXACT JSON format:
{
  "projections": [
    {"month": 1, "projectedScore": 720, "riskLevel": "medium", "insights": "Expected slight improvement"},
    {"month": 3, "projectedScore": 735, "riskLevel": "low", "insights": "Continued positive trajectory"},
    {"month": 6, "projectedScore": 745, "riskLevel": "low", "insights": "Steady improvement expected"},
    {"month": 9, "projectedScore": 750, "riskLevel": "low", "insights": "Stable financial health"},
    {"month": 12, "projectedScore": 755, "riskLevel": "low", "insights": "Long-term positive outlook"}
  ],
  "summary": "Overall 12-month financial health outlook summary based on historical trends",
  "recommendations": ["Specific actionable recommendation 1", "Recommendation 2", "Recommendation 3"]
}

Focus on realistic projections based on historical trends. Ensure riskLevel values are only 'low', 'medium', or 'high'. Include at least 6 months of projections.`;

    // Generate forecast using Gemini AI
    let geminiResponse;
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      geminiResponse = response.text();
      
      if (!geminiResponse || geminiResponse.trim() === '') {
        console.error('Empty response from Gemini AI');
        return NextResponse.json({ 
          error: 'Failed to generate forecast',
          code: 'AI_RESPONSE_EMPTY' 
        }, { status: 500 });
      }
    } catch (error: any) {
      console.error('Gemini API error:', error);
      
      // Handle specific Gemini API errors
      if (error.message?.includes('API_KEY')) {
        return NextResponse.json({ 
          error: 'AI service configuration error',
          code: 'AI_CONFIG_ERROR' 
        }, { status: 500 });
      }
      
      if (error.message?.includes('quota') || error.message?.includes('QUOTA')) {
        return NextResponse.json({ 
          error: 'AI service temporarily unavailable',
          code: 'AI_QUOTA_EXCEEDED' 
        }, { status: 503 });
      }
      
      return NextResponse.json({ 
        error: 'Failed to generate forecast',
        code: 'AI_SERVICE_ERROR' 
      }, { status: 500 });
    }

    // Parse and validate Gemini response
    let forecastData;
    try {
      // Clean up the response to extract JSON
      let cleanedResponse = geminiResponse.trim();
      
      // Remove markdown code blocks if present
      if (cleanedResponse.startsWith('on')) {
        cleanedResponse = cleanedResponse.replace(/on\n/, '').replace(/\n$/, '');
      } else if (cleanedResponse.startsWith('')) {
        cleanedResponse = cleanedResponse.replace(/\n/, '').replace(/\n$/, '');
      }
      
      forecastData = JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Failed to parse Gemini response as JSON:', error);
      console.error('Raw response:', geminiResponse);
      return NextResponse.json({ 
        error: 'Failed to process AI response',
        code: 'AI_RESPONSE_INVALID' 
      }, { status: 500 });
    }

    // Validate forecast data structure
    if (!forecastData.projections || !Array.isArray(forecastData.projections)) {
      console.error('Invalid forecast data structure - missing projections array');
      return NextResponse.json({ 
        error: 'Failed to process AI response',
        code: 'AI_RESPONSE_INVALID' 
      }, { status: 500 });
    }

    if (forecastData.projections.length < 6) {
      console.error('Insufficient projection data - less than 6 months');
      return NextResponse.json({ 
        error: 'Failed to process AI response',
        code: 'AI_RESPONSE_INVALID' 
      }, { status: 500 });
    }

    // Validate risk levels
    const validRiskLevels = ['low', 'medium', 'high'];
    for (const projection of forecastData.projections) {
      if (!validRiskLevels.includes(projection.riskLevel)) {
        console.error(`Invalid risk level: ${projection.riskLevel}`);
        return NextResponse.json({ 
          error: 'Failed to process AI response',
          code: 'AI_RESPONSE_INVALID' 
        }, { status: 500 });
      }
    }

    // Return structured forecast response
    return NextResponse.json({
      projections: forecastData.projections,
      summary: forecastData.summary || 'Forecast generated based on historical assessment data',
      recommendations: forecastData.recommendations || [],
      assessmentsAnalyzed: assessments.length
    }, { status: 200 });

  } catch (error: any) {
    console.error('GET /api/forecast error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message,
      code: 'INTERNAL_ERROR' 
    }, { status: 500 });
  }
}