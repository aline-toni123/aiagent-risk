import { db } from '@/db';
import { rules } from '@/db/schema';

async function main() {
    const sampleRules = [
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            pattern: 'STARBUCKS',
            categoryId: 2,
            priority: 10,
            createdAt: new Date('2024-01-15'),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            pattern: 'UBER',
            categoryId: 3,
            priority: 10,
            createdAt: new Date('2024-01-15'),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            pattern: 'AMAZON',
            categoryId: 4,
            priority: 8,
            createdAt: new Date('2024-01-15'),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            pattern: 'GROCERY',
            categoryId: 1,
            priority: 9,
            createdAt: new Date('2024-01-15'),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            pattern: 'SAFEWAY',
            categoryId: 1,
            priority: 9,
            createdAt: new Date('2024-01-15'),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            pattern: 'PAYROLL',
            categoryId: 6,
            priority: 15,
            createdAt: new Date('2024-01-15'),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            pattern: 'RENT',
            categoryId: 5,
            priority: 12,
            createdAt: new Date('2024-01-15'),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            pattern: 'ELECTRIC',
            categoryId: 7,
            priority: 11,
            createdAt: new Date('2024-01-15'),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            pattern: 'NETFLIX',
            categoryId: 8,
            priority: 9,
            createdAt: new Date('2024-01-15'),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            pattern: 'CVS',
            categoryId: 9,
            priority: 8,
            createdAt: new Date('2024-01-15'),
        }
    ];

    await db.insert(rules).values(sampleRules);

    console.log('✅ Rules seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});