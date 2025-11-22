import { db } from '@/db';
import { alerts } from '@/db/schema';

async function main() {
    const sampleAlerts = [
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            type: 'overspend',
            severity: 'warning',
            message: "You've exceeded your dining budget by $45.50 this month. Consider reducing restaurant visits to stay on track.",
            read: false,
            createdAt: new Date('2024-03-04'),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            type: 'bill',
            severity: 'info',
            message: "Your rent payment of $1,650.00 is due in 3 days. Make sure your checking account has sufficient funds.",
            read: false,
            createdAt: new Date('2024-03-02'),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            type: 'goal',
            severity: 'info',
            message: "Great progress! You're 25% towards your Emergency Fund goal. Keep up the good work!",
            read: true,
            createdAt: new Date('2024-03-01'),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            type: 'unusual',
            severity: 'critical',
            message: "Large transaction detected: $450.00 at BEST BUY ELECTRONICS. Please verify this purchase was authorized.",
            read: false,
            createdAt: new Date('2024-02-28'),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            type: 'cashflow',
            severity: 'warning',
            message: "Your checking account balance is running low. Consider transferring funds or reducing spending.",
            read: true,
            createdAt: new Date('2024-02-26'),
        }
    ];

    await db.insert(alerts).values(sampleAlerts);

    console.log('✅ Financial alerts seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});