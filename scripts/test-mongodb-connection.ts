/**
 * Script to test MongoDB connection with credentials
 * Usage: npx tsx scripts/test-mongodb-connection.ts [mongodb-uri]
 */

require('dotenv').config({ path: '.env.local' });
import mongoose from 'mongoose';

async function testConnection(mongoUri?: string) {
  try {
    const uri = mongoUri || process.env.MONGODB_URI;
    
    if (!uri) {
      console.error('❌ MONGODB_URI not found');
      process.exit(1);
    }

    // Parse URI to show credentials
    const match = uri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^/]+)\/([^?]+)/);
    if (match) {
      const [, username, password, host, database] = match;
      console.log('MongoDB Connection Details:');
      console.log(`  Username: ${username}`);
      console.log(`  Password: ${password ? '****' : 'MISSING'}`);
      console.log(`  Host: ${host}`);
      console.log(`  Database: ${database}\n`);
    } else {
      console.log('⚠️  Could not parse MongoDB URI format');
      console.log(`  URI: ${uri.substring(0, 50)}...\n`);
    }

    console.log('Attempting to connect...');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ Successfully connected to MongoDB!');
    
    // Try to list databases
    if (mongoose.connection.db) {
      const adminDb = mongoose.connection.db.admin();
      const result = await adminDb.listDatabases();
      console.log(`\n📊 Available databases: ${result.databases.map((d: any) => d.name).join(', ')}`);
    }
    
    // Check if we can access the database
    const db = mongoose.connection.db;
    if (!db) {
      console.error('❌ Database connection not available');
      process.exit(1);
    }
    const collections = await db.listCollections().toArray();
    console.log(`\n📁 Collections in '${db.databaseName}': ${collections.length}`);
    collections.forEach((col: any) => {
      console.log(`   - ${col.name}`);
    });

  } catch (error: any) {
    console.error('\n❌ Connection failed!');
    console.error(`   Error: ${error.message}`);
    
    if (error.message.includes('authentication failed')) {
      console.error('\n💡 This is an authentication error.');
      console.error('   The username or password in the MongoDB URI is incorrect.');
      console.error('   You need to:');
      console.error('   1. Go to MongoDB Atlas');
      console.error('   2. Check the database user credentials');
      console.error('   3. Update the MONGODB_URI with correct username/password');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.error('\n💡 This is a network/DNS error.');
      console.error('   The MongoDB hostname cannot be resolved.');
      console.error('   Check your network connection and MongoDB Atlas cluster status.');
    } else if (error.message.includes('timeout')) {
      console.error('\n💡 Connection timeout.');
      console.error('   The MongoDB server is not responding.');
      console.error('   Check if the cluster is running and your IP is whitelisted.');
    }
    
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

const mongoUri = process.argv[2];
testConnection(mongoUri);

