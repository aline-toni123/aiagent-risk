// Simple script to create test user via API
const testUser = {
    name: 'Demo User',
    email: 'demo@smartrisk.ai',
    password: 'Demo123!@#'
};

console.log('🔧 Creating test user via registration API...\n');

fetch('http://localhost:3002/api/auth/sign-up/email', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        name: testUser.name,
        email: testUser.email,
        password: testUser.password,
    }),
})
    .then(async (response) => {
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Test user created successfully!');
            console.log('📧 Email:', testUser.email);
            console.log('🔑 Password:', testUser.password);
            console.log('\n✨ You can now login at http://localhost:3002/login\n');
            console.log('Response:', data);
        } else {
            const error = await response.text();
            console.log('⚠️  Response status:', response.status);
            console.log('Response:', error);

            if (response.status === 400 && error.includes('already exists')) {
                console.log('\n✅ User already exists! You can login with:');
                console.log('📧 Email:', testUser.email);
                console.log('🔑 Password:', testUser.password);
            } else {
                console.log('\n❌ Failed to create user. Error details above.');
            }
        }
    })
    .catch((error) => {
        console.error('❌ Error:', error.message);
        console.log('\n💡 Make sure the dev server is running at http://localhost:3002');
    });
