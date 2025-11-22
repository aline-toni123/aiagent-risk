import { db } from '@/db';
import { categories } from '@/db/schema';

async function main() {
    const globalCategories = [
        {
            userId: null,
            name: 'Groceries',
            parentId: null,
            icon: '🛒',
        },
        {
            userId: null,
            name: 'Dining',
            parentId: null,
            icon: '🍽️',
        },
        {
            userId: null,
            name: 'Transport',
            parentId: null,
            icon: '🚗',
        },
        {
            userId: null,
            name: 'Shopping',
            parentId: null,
            icon: '🛍️',
        },
        {
            userId: null,
            name: 'Rent',
            parentId: null,
            icon: '🏠',
        },
        {
            userId: null,
            name: 'Income',
            parentId: null,
            icon: '💰',
        },
        {
            userId: null,
            name: 'Utilities',
            parentId: null,
            icon: '💡',
        },
        {
            userId: null,
            name: 'Entertainment',
            parentId: null,
            icon: '🎬',
        },
        {
            userId: null,
            name: 'Health',
            parentId: null,
            icon: '🏥',
        },
        {
            userId: null,
            name: 'Travel',
            parentId: null,
            icon: '✈️',
        },
        {
            userId: null,
            name: 'Transfers',
            parentId: null,
            icon: '🔄',
        },
    ];

    await db.insert(categories).values(globalCategories);
    
    console.log('✅ Global finance categories seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});