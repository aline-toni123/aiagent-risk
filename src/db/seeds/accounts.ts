import { db } from '@/db';
import { accounts } from '@/db/schema';

async function main() {
    const sampleAccounts = [
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            name: 'Chase Total Checking',
            institution: 'Chase Bank',
            type: 'checking',
            last4: '4567',
            balance: 2500.00,
            currency: 'USD',
            connected: true,
            createdAt: new Date('2024-01-15'),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            name: 'Wells Fargo Way2Save',
            institution: 'Wells Fargo',
            type: 'savings',
            last4: '8901',
            balance: 10000.00,
            currency: 'USD',
            connected: true,
            createdAt: new Date('2024-02-01'),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            name: 'Capital One Venture Rewards',
            institution: 'Capital One',
            type: 'credit',
            last4: '2345',
            balance: -1200.00,
            currency: 'USD',
            connected: true,
            createdAt: new Date('2024-02-15'),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            name: 'Bank of America Advantage Plus',
            institution: 'Bank of America',
            type: 'checking',
            last4: '6789',
            balance: 750.00,
            currency: 'USD',
            connected: true,
            createdAt: new Date('2024-03-01'),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            name: 'Fidelity Investment Account',
            institution: 'Fidelity',
            type: 'brokerage',
            last4: '0123',
            balance: 15500.00,
            currency: 'USD',
            connected: true,
            createdAt: new Date('2024-03-15'),
        }
    ];

    await db.insert(accounts).values(sampleAccounts);
    
    console.log('✅ Accounts seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});