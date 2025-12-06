/**
 * Script to test password verification
 * Usage: npx tsx scripts/test-password.ts <email> <password>
 */

require('dotenv').config({ path: '.env.local' });
import mongoose from 'mongoose';
import User from '../lib/models/User';
import bcrypt from 'bcryptjs';

async function testPassword(email: string, password: string) {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ username: email.toLowerCase() });
    
    if (!user) {
      console.log(`❌ User with email ${email} not found`);
      return;
    }

    console.log(`\nTesting password for: ${user.username}`);
    console.log(`Password hash exists: ${!!user.passwordHash}`);
    
    // Test password comparison
    const isValid = await user.comparePassword(password);
    console.log(`\nPassword verification result: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    
    if (!isValid) {
      console.log('\nTroubleshooting:');
      console.log(`  - Password provided: "${password}"`);
      console.log(`  - Password length: ${password.length}`);
      console.log(`  - User isActive: ${user.isActive}`);
      
      // Try direct bcrypt comparison
      const directCompare = await bcrypt.compare(password, user.passwordHash);
      console.log(`  - Direct bcrypt.compare: ${directCompare ? '✅ VALID' : '❌ INVALID'}`);
    }

  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: npx tsx scripts/test-password.ts <email> <password>');
  process.exit(1);
}

testPassword(email, password);

