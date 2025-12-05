/**
 * Update existing user to use email as username
 * Run with: npx tsx scripts/update-user-email-username.ts <old-username> <new-email-username>
 */

// Load environment variables FIRST using require (runs synchronously before imports)
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

import connectDB from '../lib/mongodb';
import User from '../lib/models/User';

async function updateUserUsername(oldUsername: string, newEmailUsername: string) {
  try {
    await connectDB();
    console.log('Connected to MongoDB\n');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmailUsername)) {
      console.error('Error: New username must be a valid email address');
      process.exit(1);
    }

    const user = await User.findOne({ username: oldUsername.toLowerCase() });
    if (!user) {
      console.error(`Error: User with username "${oldUsername}" not found`);
      process.exit(1);
    }

    // Check if new username already exists
    const existingUser = await User.findOne({ username: newEmailUsername.toLowerCase() });
    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      console.error(`Error: A user with email "${newEmailUsername}" already exists`);
      process.exit(1);
    }

    // Update username to email
    user.username = newEmailUsername.toLowerCase();
    user.email = newEmailUsername.toLowerCase();
    await user.save();

    console.log(`✅ Updated user:`);
    console.log(`   Old Username: ${oldUsername}`);
    console.log(`   New Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   User ID: ${user._id}`);
  } catch (error: any) {
    console.error('Error updating user:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Get command line arguments
const args = process.argv.slice(2);
const oldUsername = args[0];
const newEmailUsername = args[1];

if (!oldUsername || !newEmailUsername) {
  console.log('Usage: npx tsx scripts/update-user-email-username.ts <old-username> <new-email-username>');
  console.log('\nExample:');
  console.log('  npx tsx scripts/update-user-email-username.ts joel.schrock joel.schrock@presidentialdigs.com');
  process.exit(1);
}

updateUserUsername(oldUsername, newEmailUsername);

