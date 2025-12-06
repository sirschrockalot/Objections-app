/**
 * Script to check database connection and user status
 * Usage: npx tsx scripts/check-database-connection.ts [mongodb-uri]
 */

require('dotenv').config({ path: '.env.local' });
import mongoose from 'mongoose';
import User from '../lib/models/User';

async function checkDatabase(mongoUri?: string) {
  try {
    const uri = mongoUri || process.env.MONGODB_URI;
    
    if (!uri) {
      console.error('❌ MONGODB_URI not found');
      console.error('   Please provide as argument or set in .env.local');
      process.exit(1);
    }

    console.log('Database URI:');
    console.log(`  ${uri.substring(0, 50)}...`);
    console.log(`  Database: ${uri.match(/\/\/([^:]+):([^@]+)@([^/]+)\/([^?]+)/)?.[4] || 'unknown'}\n`);

    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB\n');

    // Check user
    const email = 'joel.schrock@presidentialdigs.com';
    const user = await User.findOne({ username: email.toLowerCase() });
    
    if (!user) {
      console.log(`❌ User ${email} not found in this database`);
    } else {
      console.log(`✅ User found:`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Is Active: ${user.isActive}`);
      console.log(`   Is Admin: ${user.isAdmin || false}`);
      console.log(`   Must Change Password: ${user.mustChangePassword || false}`);
      console.log(`   Created At: ${user.createdAt}`);
      console.log(`   Last Login: ${user.lastLoginAt || 'Never'}`);
      console.log(`   Password Hash: ${user.passwordHash ? '✅ Set' : '❌ Missing'}`);
      console.log(`   Password Hash Length: ${user.passwordHash?.length || 0} characters`);
    }

    // Count total users
    const totalUsers = await User.countDocuments();
    console.log(`\n📊 Total users in database: ${totalUsers}`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('authentication')) {
      console.error('   This might be an authentication issue with the database');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.error('   This might be a connection issue - check the URI and network');
    }
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

const mongoUri = process.argv[2];
checkDatabase(mongoUri);

