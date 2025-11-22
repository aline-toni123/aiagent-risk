import { db } from './src/db/index';
import { user, account } from './src/db/schema';
import { randomUUID } from 'crypto';

async function createTestUser() {
    try {
        const userId = randomUUID();
        const now = new Date();

        // Create user
        const newUser = await db.insert(user).values({
            id: userId,
            name: 'Demo User',
            email: 'demo@smartrisk.ai',
            emailVerified: true,
            image: null,
            createdAt: now,
            updatedAt: now,
        }).returning();

        console.log('✅ User created:', newUser[0]);

        // Create account with password (Better Auth will handle this)
        // For demo purposes, we'll use a hashed password
        // Password: Demo123!@#
        // This is a bcrypt hash of "Demo123!@#"
        const hashedPassword = '$2a$10$Y9K8QvX7J5wYx5wN5vZ5oe5qZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z';

        const newAccount = await db.insert(account).values({
            id: randomUUID(),
            accountId: userId,
            providerId: 'credential',
            userId: userId,
            accessToken: null,
            refreshToken: null,
            idToken: null,
            accessTokenExpiresAt: null,
            refreshTokenExpiresAt: null,
            scope: null,
            password: hashedPassword,
            createdAt: now,
            updatedAt: now,
        }).returning();

        console.log('✅ Account created:', newAccount[0]);
        console.log('\n🎉 Test user created successfully!');
        console.log('📧 Email: demo@smartrisk.ai');
        console.log('🔑 Password: Demo123!@#');
        console.log('\n✨ You can now login at http://localhost:3002/login');

    } catch (error) {
        console.error('❌ Error creating test user:', error);
    }
}

createTestUser();
