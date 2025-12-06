/**
 * Script to reset a user's password in Heroku production database
 * Usage: npx tsx scripts/reset-password-heroku.ts <email> <new-password>
 */

require('dotenv').config();
import mongoose from 'mongoose';
import User from '../lib/models/User';
import bcrypt from 'bcryptjs';
import { validatePassword } from '../lib/passwordValidation';
import { execSync } from 'child_process';

async function resetPassword(email: string, newPassword: string, mongoUri?: string) {
  try {
    // Get MongoDB URI from argument, environment, or Heroku config
    let uri = mongoUri || process.env.MONGODB_URI;
    
    if (!uri) {
      // Try to get from Heroku config
      try {
        uri = execSync('heroku config:get MONGODB_URI', { encoding: 'utf-8' }).trim();
        if (!uri || uri.length === 0) {
          throw new Error('No URI found');
        }
        console.log('✅ Retrieved MONGODB_URI from Heroku config\n');
      } catch (error: any) {
        console.error('❌ MONGODB_URI environment variable is not set');
        console.error('   For Heroku, run: heroku config:get MONGODB_URI');
        console.error('   Or pass as third argument: npx tsx scripts/reset-password-heroku.ts <email> <password> <mongodb-uri>');
        console.error(`   Error: ${error.message}`);
        process.exit(1);
      }
    }

    console.log(`Connecting to: ${uri.substring(0, 20)}...`);

    // Validate password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      console.error(`❌ Password validation failed: ${passwordValidation.error}`);
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB\n');

    const user = await User.findOne({ username: email.toLowerCase() });
    
    if (!user) {
      console.error(`❌ User with email ${email} not found`);
      process.exit(1);
    }

    console.log(`Found user: ${user.username}`);
    console.log(`  Is Active: ${user.isActive}`);
    console.log(`  Is Admin: ${user.isAdmin || false}`);

    // Hash new password with 12 rounds
    const passwordHash = await bcrypt.hash(newPassword, 12);
    
    // Update user
    user.passwordHash = passwordHash;
    user.mustChangePassword = false;
    await user.save();

    console.log(`\n✅ Password reset successfully for ${email}`);
    console.log(`   Password hash updated with bcrypt rounds: 12`);
    console.log(`   Must change password flag cleared`);

    // Test the password
    const isValid = await user.comparePassword(newPassword);
    console.log(`   Password verification test: ${isValid ? '✅ PASSED' : '❌ FAILED'}`);

  } catch (error: any) {
    console.error('Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

const email = process.argv[2];
const newPassword = process.argv[3];
const mongoUri = process.argv[4]; // Optional MongoDB URI

if (!email || !newPassword) {
  console.error('Usage: npx tsx scripts/reset-password-heroku.ts <email> <new-password> [mongodb-uri]');
  console.error('\nPassword must meet requirements:');
  console.error('  - At least 12 characters');
  console.error('  - At least one uppercase letter');
  console.error('  - At least one lowercase letter');
  console.error('  - At least one number');
  console.error('  - At least one special character (@$!%*?&)');
  console.error('\nIf mongodb-uri is not provided, script will try to get it from:');
  console.error('  1. MONGODB_URI environment variable');
  console.error('  2. Heroku config (heroku config:get MONGODB_URI)');
  process.exit(1);
}

resetPassword(email, newPassword, mongoUri);

