import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';
import * as authService from '../services/authService';

dotenv.config();

async function runTest() {
  try {
    console.log('--- STARTING AUTH FLOW TEST ---');
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log('Connected to MongoDB');

    const testEmail = `testuser_${Date.now()}@example.com`;
    const testPassword = 'Password123!';
    const newPassword = 'NewPassword456!';

    // 1. Register User
    console.log(`\n1. Registering user: ${testEmail}`);
    const regResult = await authService.registerUser(
      'Test Performer',
      testEmail,
      testPassword,
      '1234567890',
      undefined,
      'performer',
      'other'
    );
    console.log('Register result:', regResult);
    if (!regResult.requiresVerification) {
      throw new Error('Registration should require verification');
    }

    const unverifiedUser = await User.findOne({ email: testEmail });
    if (!unverifiedUser || unverifiedUser.isEmailVerified) {
      throw new Error('User should exist and have isEmailVerified = false');
    }
    const currentOtp = unverifiedUser.emailOtp;
    console.log(`Generated OTP: ${currentOtp}`);

    // 2. Attempt Login Before Verification
    console.log('\n2. Attempting login before email verification...');
    try {
      await authService.loginUser(testEmail, testPassword);
      throw new Error('Login should have failed for unverified user');
    } catch (err: any) {
      if (err.requiresVerification) {
        console.log('✅ Correctly blocked unverified login:', err.message);
      } else {
        throw err;
      }
    }

    // 3. Verify with wrong OTP
    console.log('\n3. Testing incorrect OTP verification...');
    try {
      await authService.verifyEmailOtp(testEmail, '000000');
      throw new Error('Verification should have failed with wrong OTP');
    } catch (err: any) {
      console.log('✅ Correctly rejected invalid OTP:', err.message);
    }

    // 4. Verify with correct OTP
    console.log('\n4. Verifying with correct OTP...');
    const latestUser = await User.findOne({ email: testEmail });
    const verifyResult = await authService.verifyEmailOtp(testEmail, latestUser?.emailOtp!);
    console.log('✅ Verify result:', verifyResult.name, verifyResult.email, 'Token received:', !!verifyResult.token);

    const verifiedUser = await User.findOne({ email: testEmail });
    if (!verifiedUser?.isEmailVerified) {
      throw new Error('User should now have isEmailVerified = true');
    }
    console.log('✅ DB isEmailVerified is true:', verifiedUser.isEmailVerified);

    // 5. Attempt login now that user is verified
    console.log('\n5. Attempting login now that user is verified...');
    const loginResult = await authService.loginUser(testEmail, testPassword);
    console.log('✅ Login succeeded for verified user:', loginResult.name, 'Token:', !!loginResult.token);

    // 6. Request Forgot Password
    console.log('\n6. Requesting password reset OTP...');
    const forgotResult = await authService.forgotPassword(testEmail);
    console.log('Forgot password result:', forgotResult);

    const userWithResetOtp = await User.findOne({ email: testEmail });
    const resetOtp = userWithResetOtp?.resetPasswordOtp;
    console.log(`Reset OTP generated: ${resetOtp}`);

    // 7. Reset password with wrong OTP
    console.log('\n7. Testing reset password with invalid OTP...');
    try {
      await authService.resetPasswordWithOtp(testEmail, '999999', newPassword);
      throw new Error('Reset should have failed with invalid OTP');
    } catch (err: any) {
      console.log('✅ Correctly rejected invalid reset OTP:', err.message);
    }

    // 8. Reset password with valid OTP
    console.log('\n8. Resetting password with valid OTP...');
    const resetResult = await authService.resetPasswordWithOtp(testEmail, resetOtp!, newPassword);
    console.log('✅ Reset result:', resetResult.message);

    // 9. Login with old password (should fail)
    console.log('\n9. Attempting login with old password (should fail)...');
    try {
      await authService.loginUser(testEmail, testPassword);
      throw new Error('Login with old password should fail');
    } catch (err: any) {
      console.log('✅ Correctly rejected old password:', err.message);
    }

    // 10. Login with new password (should succeed)
    console.log('\n10. Attempting login with new password...');
    const newLoginResult = await authService.loginUser(testEmail, newPassword);
    console.log('✅ Login succeeded with new password:', newLoginResult.name, 'Role:', newLoginResult.role);

    // Cleanup test user
    await User.deleteOne({ email: testEmail });
    console.log('\n🧹 Cleaned up test user from DB.');

    console.log('\n=============================================');
    console.log('🎉 ALL AUTH & OTP VERIFICATION TESTS PASSED!');
    console.log('=============================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ TEST FAILED:', error);
    process.exit(1);
  }
}

runTest();
