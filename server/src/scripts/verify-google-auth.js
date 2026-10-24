/**
 * Verification Script: Google Authentication Endpoint
 */
const { loginWithGoogle } = require('../services/auth.service');

async function run() {
  console.log('Testing Google Auth Service...');
  try {
    // Test with simulated dev credential
    const result = await loginWithGoogle({
      credential: 'demo_google_token_test_123',
      ipAddress: '127.0.0.1',
      userAgent: 'Test Agent',
    });

    console.log('Result user:', result.user);
    console.log('Token generated:', !!result.token);
    if (result.user.role === 'ADMIN' && result.token) {
      console.log('✅ Google Auth verification PASSED!');
    } else {
      console.error('❌ Google Auth verification FAILED: Unexpected result', result);
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Google Auth verification FAILED:', err);
    process.exit(1);
  }
}

run();
