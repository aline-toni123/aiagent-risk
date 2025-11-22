import { db } from '@/db';
import { goals } from '@/db/schema';

async function main() {
    const sampleGoals = [
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            name: 'Emergency Fund',
            targetAmount: 10000.00,
            currentAmount: 4500.00,
            deadline: new Date('2024-12-31'),
            categoryId: null,
            status: 'active',
            createdAt: new Date('2024-10-15'),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            name: 'Summer Vacation',
            targetAmount: 5000.00,
            currentAmount: 1200.00,
            deadline: new Date('2024-06-30'),
            categoryId: 10,
            status: 'active',
            createdAt: new Date('2024-09-20'),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            name: 'Credit Card Debt Payoff',
            targetAmount: 2000.00,
            currentAmount: 800.00,
            deadline: new Date('2024-09-30'),
            categoryId: null,
            status: 'active',
            createdAt: new Date('2024-11-01'),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            name: 'New Car Fund',
            targetAmount: 8000.00,
            currentAmount: 2100.00,
            deadline: new Date('2024-12-31'),
            categoryId: 3,
            status: 'active',
            createdAt: new Date('2024-10-01'),
        }
    ];

    await db.insert(goals).values(sampleGoals);
    
    console.log('✅ Goals seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});