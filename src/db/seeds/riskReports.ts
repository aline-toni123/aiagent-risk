import { db } from '@/db';
import { riskReports } from '@/db/schema';

async function main() {
    const sampleRiskReports = [
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            assessmentId: 1, // Sarah Wilson's critical risk assessment
            reportSummary: 'Detailed analysis shows elevated default probability due to poor credit history (580 score), high debt-to-income ratio (60%), and unstable employment. Recommend declining application or requiring additional collateral.',
            pdfUrl: null,
            generatedAt: new Date('2024-01-16').toISOString(),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            assessmentId: 3, // Jane Smith's high risk assessment
            reportSummary: 'Comprehensive risk evaluation indicates increased lending risk. While employment is stable, the 45% debt-to-income ratio exceeds recommended thresholds. Consider conditional approval with higher interest rates.',
            pdfUrl: null,
            generatedAt: new Date('2024-01-18').toISOString(),
        }
    ];

    await db.insert(riskReports).values(sampleRiskReports);
    
    console.log('✅ Risk reports seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});