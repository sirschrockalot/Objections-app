/**
 * Script to reset a user's password
 * Usage: npx tsx scripts/reset-user-password.ts <email> <new-password>
 */

require('dotenv').config({ path: '.env.local' });
import mongoose from 'mongoose';
import User from '../lib/models/User';
import bcrypt from 'bcryptjs';
import { validatePassword } from '../lib/passwordValidation';
import { clearFailedAttempts } from '../lib/accountLockout';

async function resetPassword(email: string, newPassword: string) {
  try {
    // Validate password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      console.error(`❌ Password validation failed: ${passwordValidation.error}`);
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ username: email.toLowerCase() });
    
    if (!user) {
      console.error(`❌ User with email ${email} not found`);
      process.exit(1);
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);
    
    // Update user
    user.passwordHash = passwordHash;
    user.mustChangePassword = false; // Clear the must change password flag
    await user.save();

    // Clear any account lockout
    clearFailedAttempts(email.toLowerCase());

    console.log(`\n✅ Password reset successfully for ${email}`);
    console.log(`   Must change password flag cleared`);
    console.log(`   Account lockout cleared`);

  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.error('Usage: npx tsx scripts/reset-user-password.ts <email> <new-password>');
  console.error('\nPassword must meet requirements:');
  console.error('  - At least 12 characters');
  console.error('  - At least one uppercase letter');
  console.error('  - At least one lowercase letter');
  console.error('  - At least one number');
  console.error('  - At least one special character (@$!%*?&)');
  process.exit(1);
}

resetPassword(email, newPassword);

