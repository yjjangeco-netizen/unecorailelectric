import fetch from 'node-fetch';

async function simulateSignup() {
    const url = 'http://localhost:3000/api/auth/signup';
    const testUser = {
        username: `testuser_${Date.now()}`,
        password: 'TestPassword123!',
        name: 'Test User',
        position: 'Developer',
        department: 'IT',
        email: `test_${Date.now()}@example.com`,
        level: 'user'
    };

    console.log('Simulating signup with data:', testUser);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testUser),
        });

        const data = await response.json();
        console.log('Response status:', response.status);
        console.log('Response data:', data);

        if (response.ok) {
            console.log('✅ Signup simulation successful!');
        } else {
            console.error('❌ Signup simulation failed.');
        }
    } catch (error) {
        console.error('❌ Error connecting to server:', error);
        console.log('Make sure the Next.js server is running on http://localhost:3000');
    }
}

simulateSignup();
