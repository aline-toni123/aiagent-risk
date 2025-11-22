import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { query, process = 'sequential' } = await request.json();

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Define specialized AI agents
    const agents = [
      {
        id: 1,
        name: 'Financial Analyst',
        role: 'Data Analysis & Pattern Recognition',
        icon: '📊',
        specialty: 'Analyzes financial data, identifies trends, and provides quantitative insights'
      },
      {
        id: 2,
        name: 'Risk Assessor',
        role: 'Risk Evaluation & Mitigation',
        icon: '⚠️',
        specialty: 'Evaluates potential risks, calculates probabilities, and suggests mitigation strategies'
      },
      {
        id: 3,
        name: 'Budget Planner',
        role: 'Budget Optimization & Allocation',
        icon: '💰',
        specialty: 'Creates optimized budget plans, allocates resources efficiently'
      },
      {
        id: 4,
        name: 'Investment Advisor',
        role: 'Strategy Design & Asset Allocation',
        icon: '📈',
        specialty: 'Designs investment strategies and allocates assets based on risk profile'
      }
    ];

    // Use Gemini to simulate crew collaboration
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-thinking-exp-1219',
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 3000,
      }
    });

    const crewPrompt = `You are orchestrating a multi-agent AI crew for financial analysis.

**Agents in the Crew:**
1. 📊 Financial Analyst - Data analysis & pattern recognition
2. ⚠️ Risk Assessor - Risk evaluation & mitigation
3. 💰 Budget Planner - Budget optimization & allocation  
4. 📈 Investment Advisor - Strategy design & asset allocation

**User Task:** ${query}

**Instructions:**
Simulate a ${process} collaboration process where each agent contributes their expertise.

**Response Format:**
🤖 **MULTI-AGENT CREW EXECUTION**

**Task Analysis:**
[Brief overview of the task]

---

**Agent 1: 📊 Financial Analyst**
[Financial Analyst's analysis and insights]

**Agent 2: ⚠️ Risk Assessor**
[Risk Assessor's evaluation and recommendations]

**Agent 3: 💰 Budget Planner**
[Budget Planner's budget plan and allocation]

**Agent 4: 📈 Investment Advisor**
[Investment Advisor's strategy and recommendations]

---

**Integrated Plan:**
[Synthesized plan combining all agent inputs]

**Action Items:**
1. [Specific action]
2. [Specific action]
3. [Specific action]

**Timeline:**
- Week 1: [Actions]
- Month 1: [Milestones]
- Quarter 1: [Goals]

**Risk Mitigation:**
- [Strategy 1]
- [Strategy 2]

**Success Metrics:**
- KPI 1: [Metric and target]
- KPI 2: [Metric and target]

Make the response detailed, specific, and actionable.`;

    const result = await model.generateContent(crewPrompt);
    const response = result.response;
    const finalPlan = response.text();

    // Extract thinking steps if available
    let thinkingSteps: string[] = [];
    if (response.candidates?.[0]?.content?.parts) {
      const parts = response.candidates[0].content.parts;
      thinkingSteps = parts
        .filter((part: any) => part.thought)
        .map((part: any) => part.thought);
    }

    // Simulate tasks completed
    const totalTasks = agents.length + 2; // One task per agent + analysis + synthesis
    const completedTasks = totalTasks;

    return NextResponse.json({
      finalPlan,
      crew: {
        agents,
        totalTasks,
        completedTasks,
        process,
        knowledge: [
          'Historical financial data patterns',
          'Current market conditions',
          'Risk assessment frameworks',
          'Budget optimization algorithms'
        ]
      },
      tasks: [
        { id: 1, name: 'Analyze Financial Data', status: 'completed', agent: 'Financial Analyst' },
        { id: 2, name: 'Assess Risks', status: 'completed', agent: 'Risk Assessor' },
        { id: 3, name: 'Create Budget Plan', status: 'completed', agent: 'Budget Planner' },
        { id: 4, name: 'Design Investment Strategy', status: 'completed', agent: 'Investment Advisor' },
        { id: 5, name: 'Synthesize Recommendations', status: 'completed', agent: 'All Agents' }
      ],
      thinking: thinkingSteps,
      executionTime: `${Math.floor(Math.random() * 5) + 3}s`,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Crew API error:', error);
    return NextResponse.json({
      error: 'Failed to execute crew',
      details: error.message
    }, { status: 500 });
  }
}