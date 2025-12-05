/**
 * List all users in MongoDB
 * Run with: npm run list-users
 * 
 * Make sure MONGODB_URI is set in .env.local
 */

// Load environment variables FIRST using require (runs synchronously before imports)
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

// Now import MongoDB connection after env vars are loaded
import connectDB from '../lib/mongodb';
import User from '../lib/models/User';

async function listUsers() {
  try {
    await connectDB();
    console.log('Connected to MongoDB\n');

    const users = await User.find({}).select('username email _id createdAt').lean();
    
    if (users.length === 0) {
      console.log('No users found in database.');
      return;
    }

    console.log(`Found ${users.length} user(s):\n`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. Username: ${user.username}`);
      console.log(`   Email: ${user.email || 'N/A'}`);
      console.log(`   User ID: ${user._id}`);
      console.log(`   Created: ${new Date(user.createdAt).toLocaleString()}`);
      console.log('');
    });
  } catch (error: any) {
    console.error('Error listing users:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

listUsers();

