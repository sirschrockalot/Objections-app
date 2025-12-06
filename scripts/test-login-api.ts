/**
 * Script to test the login API endpoint
 * Usage: npx tsx scripts/test-login-api.ts <email> <password> [base-url]
 */

async function testLogin(email: string, password: string, baseUrl: string = 'http://localhost:3000') {
  try {
    console.log(`Testing login API at: ${baseUrl}/api/auth/login`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password.substring(0, 3)}...\n`);

    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: email,
        password: password,
      }),
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ Response is not JSON!');
      console.error('Response status:', response.status);
      console.error('Response headers:', Object.fromEntries(response.headers.entries()));
      console.error('Response body (first 500 chars):', responseText.substring(0, 500));
      process.exit(1);
    }
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ Login successful!');
      if (data.user) {
        console.log(`   User ID: ${data.user.id}`);
        console.log(`   Username: ${data.user.username}`);
        console.log(`   Is Admin: ${data.user.isAdmin || false}`);
        console.log(`   Must Change Password: ${data.user.mustChangePassword || false}`);
      }
      if (data.token) {
        console.log(`   Token: ${data.token.substring(0, 20)}...`);
      }
    } else {
      console.log('\n❌ Login failed!');
      if (data.error) {
        console.log(`   Error: ${data.error}`);
      }
    }

    // Check rate limit headers
    const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
    if (rateLimitRemaining !== null) {
      console.log(`\n📊 Rate Limit Remaining: ${rateLimitRemaining}`);
    }

  } catch (error: any) {
    console.error('❌ Error testing login:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('   Could not connect to the server. Is it running?');
    } else if (error.code === 'ENOTFOUND') {
      console.error('   Could not resolve the hostname. Check the URL.');
    }
    process.exit(1);
  }
}

const email = process.argv[2];
const password = process.argv[3];
const baseUrl = process.argv[4] || 'http://localhost:3000';

if (!email || !password) {
  console.error('Usage: npx tsx scripts/test-login-api.ts <email> <password> [base-url]');
  console.error('\nExample:');
  console.error('  npx tsx scripts/test-login-api.ts joel.schrock@presidentialdigs.com "password"');
  console.error('  npx tsx scripts/test-login-api.ts joel.schrock@presidentialdigs.com "password" https://objections-app.herokuapp.com');
  process.exit(1);
}

testLogin(email, password, baseUrl);

