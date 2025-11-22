import { db } from '@/db';
import { budgets } from '@/db/schema';

async function main() {
    const sampleBudgets = [
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            categoryId: 5,
            month: 3,
            year: 2024,
            amount: 1200.00,
            createdAt: new Date('2024-02-28T10:00:00Z'),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            categoryId: 1,
            month: 3,
            year: 2024,
            amount: 400.00,
            createdAt: new Date('2024-02-28T10:05:00Z'),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            categoryId: 2,
            month: 3,
            year: 2024,
            amount: 250.00,
            createdAt: new Date('2024-02-28T10:10:00Z'),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            categoryId: 3,
            month: 3,
            year: 2024,
            amount: 200.00,
            createdAt: new Date('2024-02-28T10:15:00Z'),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            categoryId: 7,
            month: 3,
            year: 2024,
            amount: 180.00,
            createdAt: new Date('2024-02-28T10:20:00Z'),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            categoryId: 8,
            month: 3,
            year: 2024,
            amount: 150.00,
            createdAt: new Date('2024-02-28T10:25:00Z'),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            categoryId: 4,
            month: 3,
            year: 2024,
            amount: 300.00,
            createdAt: new Date('2024-02-28T10:30:00Z'),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            categoryId: 9,
            month: 3,
            year: 2024,
            amount: 100.00,
            createdAt: new Date('2024-02-28T10:35:00Z'),
        }
    ];

    await db.insert(budgets).values(sampleBudgets);

    console.log('✅ Budgets seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});