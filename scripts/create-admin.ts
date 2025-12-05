/**
 * Create an admin user in MongoDB
 * Run with: npm run create-admin
 */

// Load environment variables FIRST using require (runs synchronously before imports)
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

import connectDB from '../lib/mongodb';
import User from '../lib/models/User';
import bcrypt from 'bcryptjs';

async function createAdminUser(email: string, password: string) {
  try {
    await connectDB();
    console.log('Connected to MongoDB\n');

    // Username is now the email address
    const emailLower = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({
      username: emailLower,
    });

    if (existingUser) {
      // Update existing user to be admin
      existingUser.isAdmin = true;
      existingUser.email = emailLower;
      if (password) {
        existingUser.passwordHash = await bcrypt.hash(password, 10);
      }
      await existingUser.save();
      console.log(`✅ Updated existing user to admin:`);
      console.log(`   Email (Username): ${existingUser.username}`);
      console.log(`   User ID: ${existingUser._id}`);
      console.log(`   Admin: ${existingUser.isAdmin}`);
      if (password) {
        console.log(`   Password: Updated`);
      }
    } else {
      // Create new admin user
      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = await User.create({
        username: emailLower, // Username is the email
        email: emailLower,
        passwordHash,
        isAdmin: true,
        isActive: true,
        createdAt: new Date(),
      });

      console.log(`✅ Created new admin user:`);
      console.log(`   Email (Username): ${newUser.username}`);
      console.log(`   User ID: ${newUser._id}`);
      console.log(`   Admin: ${newUser.isAdmin}`);
    }

    console.log('\n✅ Admin user ready!');
    console.log(`You can now login with:`);
    console.log(`  Email: ${emailLower}`);
    console.log(`  Password: ${password}`);
  } catch (error: any) {
    console.error('Error creating admin user:', error.message);
    if (error.code === 11000) {
      console.error('A user with this username or email already exists.');
    }
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Get command line arguments
const args = process.argv.slice(2);
const email = args[0];
const password = args[1];

if (!email || !password) {
  console.log('Usage: npm run create-admin <email> <password>');
  console.log('\nExample:');
  console.log('  npm run create-admin joel.schrock@presidentialdigs.com "JTLCam2son$"');
  process.exit(1);
}

createAdminUser(email, password);

