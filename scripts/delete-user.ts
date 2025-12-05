/**
 * Delete a user from MongoDB
 * Run with: npx tsx scripts/delete-user.ts <username>
 */

// Load environment variables FIRST using require (runs synchronously before imports)
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

import connectDB from '../lib/mongodb';
import User from '../lib/models/User';

async function deleteUser(username: string) {
  try {
    await connectDB();
    console.log('Connected to MongoDB\n');

    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      console.error(`Error: User with username "${username}" not found`);
      process.exit(1);
    }

    console.log(`Found user:`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   User ID: ${user._id}`);
    console.log(`   Admin: ${user.isAdmin || false}`);
    console.log(`\nDeleting user...`);

    await User.deleteOne({ _id: user._id });

    console.log(`✅ User deleted successfully`);
  } catch (error: any) {
    console.error('Error deleting user:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Get command line arguments
const args = process.argv.slice(2);
const username = args[0];

if (!username) {
  console.log('Usage: npx tsx scripts/delete-user.ts <username>');
  console.log('\nExample:');
  console.log('  npx tsx scripts/delete-user.ts joel.schrock');
  process.exit(1);
}

deleteUser(username);

