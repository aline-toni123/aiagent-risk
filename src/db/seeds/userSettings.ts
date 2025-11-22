import { db } from '@/db';
import { userSettings } from '@/db/schema';

async function main() {
    const sampleUserSettings = [
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            emailNotifications: true,
            themePreference: 'system',
            riskThreshold: 700,
            createdAt: new Date().toISOString(),
        }
    ];

    await db.insert(userSettings).values(sampleUserSettings);
    
    console.log('✅ User settings seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});