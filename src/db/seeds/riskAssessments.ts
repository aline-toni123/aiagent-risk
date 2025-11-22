import { db } from '@/db';
import { riskAssessments } from '@/db/schema';

async function main() {
    const sampleRiskAssessments = [
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            applicantName: 'John Doe',
            creditScore: 720,
            income: 60000.0,
            debtToIncomeRatio: 0.3,
            employmentHistory: 'Software Engineer at Tech Corp for 3 years',
            riskLevel: 'medium',
            aiScore: 750.0,
            analysisSummary: 'Moderate risk profile with stable employment but moderate debt levels',
            createdAt: new Date('2024-01-15').toISOString(),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            applicantName: 'Jane Smith',
            creditScore: 650,
            income: 45000.0,
            debtToIncomeRatio: 0.45,
            employmentHistory: 'Marketing Manager for 2 years',
            riskLevel: 'high',
            aiScore: 620.0,
            analysisSummary: 'Higher risk due to elevated debt-to-income ratio despite steady employment',
            createdAt: new Date('2024-01-20').toISOString(),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            applicantName: 'Mike Johnson',
            creditScore: 780,
            income: 85000.0,
            debtToIncomeRatio: 0.2,
            employmentHistory: 'Senior Consultant for 5 years',
            riskLevel: 'low',
            aiScore: 850.0,
            analysisSummary: 'Excellent credit profile with low debt and high income stability',
            createdAt: new Date('2024-02-01').toISOString(),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            applicantName: 'Sarah Wilson',
            creditScore: 580,
            income: 35000.0,
            debtToIncomeRatio: 0.6,
            employmentHistory: 'Part-time retail worker for 1 year',
            riskLevel: 'critical',
            aiScore: 520.0,
            analysisSummary: 'Critical risk level due to poor credit history and high debt burden',
            createdAt: new Date('2024-02-10').toISOString(),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            applicantName: 'Robert Brown',
            creditScore: 700,
            income: 55000.0,
            debtToIncomeRatio: 0.35,
            employmentHistory: 'Accountant for 4 years',
            riskLevel: 'medium',
            aiScore: 720.0,
            analysisSummary: 'Solid credit profile with manageable debt levels and stable professional background',
            createdAt: new Date('2024-02-15').toISOString(),
        }
    ];

    await db.insert(riskAssessments).values(sampleRiskAssessments);
    
    console.log('✅ Risk assessments seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});