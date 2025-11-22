import { db } from '@/db';
import { riskAlerts } from '@/db/schema';

async function main() {
    const sampleAlerts = [
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            assessmentId: 1,
            type: 'fraud',
            message: 'Suspicious financial activity detected in credit report',
            severity: 'high',
            isResolved: false,
            createdAt: new Date().toISOString(),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            assessmentId: 4,
            type: 'default',
            message: 'High probability of default based on debt-to-income ratio analysis',
            severity: 'critical',
            isResolved: false,
            createdAt: new Date().toISOString(),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            assessmentId: 2,
            type: 'compliance',
            message: 'Credit verification completed successfully',
            severity: 'low',
            isResolved: true,
            createdAt: new Date().toISOString(),
        }
    ];

    await db.insert(riskAlerts).values(sampleAlerts);
    
    console.log('✅ Risk alerts seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});