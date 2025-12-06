/**
 * Script to check user account status
 * Usage: npx tsx scripts/check-user.ts <email>
 */

require('dotenv').config({ path: '.env.local' });
import mongoose from 'mongoose';
import User from '../lib/models/User';
import { isAccountLocked } from '../lib/accountLockout';

async function checkUser(email: string) {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ username: email.toLowerCase() });
    
    if (!user) {
      console.log(`❌ User with email ${email} not found`);
      return;
    }

    console.log('\n✅ User found:');
    console.log(`   ID: ${user._id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Is Active: ${user.isActive}`);
    console.log(`   Is Admin: ${user.isAdmin || false}`);
    console.log(`   Must Change Password: ${user.mustChangePassword || false}`);
    console.log(`   Created At: ${user.createdAt}`);
    console.log(`   Last Login: ${user.lastLoginAt || 'Never'}`);

    // Check account lockout status
    const lockoutStatus = isAccountLocked(email.toLowerCase());
    if (lockoutStatus.locked) {
      const minutesRemaining = Math.ceil(
        (lockoutStatus.lockedUntil!.getTime() - Date.now()) / 60000
      );
      console.log(`\n⚠️  Account is LOCKED`);
      console.log(`   Locked until: ${lockoutStatus.lockedUntil}`);
      console.log(`   Minutes remaining: ${minutesRemaining}`);
    } else {
      console.log(`\n✅ Account is NOT locked`);
    }

    if (!user.isActive) {
      console.log(`\n⚠️  Account is INACTIVE - this will prevent login`);
    }

  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

const email = process.argv[2];
if (!email) {
  console.error('Usage: npx tsx scripts/check-user.ts <email>');
  process.exit(1);
}

checkUser(email);

