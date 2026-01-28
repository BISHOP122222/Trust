
async function testLogin() {
    try {
        console.log('Attempting login with seeded credentials...');
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'milanjohnso09@gmail.com',
                password: 'password123'
            })
        });

        console.log('Status:', response.status);
        const data = await response.json();

        if (response.ok) {
            console.log('Login Successful!');
            console.log('Token:', data.token ? 'Present' : 'Missing');
            console.log('User:', JSON.stringify(data.user, null, 2));

            // Try /me
            console.log('\nAccessing /api/auth/me...');
            const meResponse = await fetch('http://localhost:5000/api/auth/me', {
                headers: { 'Authorization': `Bearer ${data.token}` }
            });
            console.log('Me Status:', meResponse.status);
            const meData = await meResponse.json();
            console.log('Me Data:', JSON.stringify(meData, null, 2));

        } else {
            console.log('Login Failed:', JSON.stringify(data, null, 2));
        }

    } catch (error: any) {
        console.error('Network/Script Error:', error.message);
    }
}

testLogin();
