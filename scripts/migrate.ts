/**
 * Standalone migration script to move localStorage data to MongoDB
 * Run with: npx tsx scripts/migrate.ts
 * 
 * This script reads localStorage data from the browser's localStorage
 * and migrates it to MongoDB. You need to:
 * 1. Be logged in (have a valid session)
 * 2. Have localStorage data to migrate
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// This script needs to be run from the browser console or we need to export localStorage first
// For now, let's create a script that can read from an exported JSON file

interface MigrationData {
  customResponses?: Array<{ objectionId: string; response: any }>;
  confidenceRatings?: any[];
  practiceSessions?: any[];
  notes?: any[];
  responseTemplates?: any[];
  practiceHistory?: any[];
  points?: { total: number; history: any[] };
  reviewSchedules?: any[];
  learningPathProgress?: any[];
  voiceSessions?: any[];
}

async function migrateFromFile(filePath: string, userId: string, apiUrl: string = 'http://localhost:3000') {
  if (!existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const fileContent = readFileSync(filePath, 'utf-8');
  const migrationData: MigrationData = JSON.parse(fileContent);

  console.log('Starting migration...');
  console.log('Data to migrate:');
  console.log(`- Custom Responses: ${migrationData.customResponses?.length || 0}`);
  console.log(`- Confidence Ratings: ${migrationData.confidenceRatings?.length || 0}`);
  console.log(`- Practice Sessions: ${migrationData.practiceSessions?.length || 0}`);
  console.log(`- Notes: ${migrationData.notes?.length || 0}`);
  console.log(`- Templates: ${migrationData.responseTemplates?.length || 0}`);
  console.log(`- Practice History: ${migrationData.practiceHistory?.length || 0}`);
  console.log(`- Points: ${migrationData.points?.history?.length || 0}`);
  console.log(`- Review Schedules: ${migrationData.reviewSchedules?.length || 0}`);
  console.log(`- Learning Path Progress: ${migrationData.learningPathProgress?.length || 0}`);
  console.log(`- Voice Sessions: ${migrationData.voiceSessions?.length || 0}`);

  try {
    const response = await fetch(`${apiUrl}/api/migrate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({ data: migrationData }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Migration failed');
    }

    const result = await response.json();
    console.log('\n✅ Migration completed successfully!');
    console.log('Migrated items:');
    Object.entries(result.migrated || {}).forEach(([key, count]) => {
      console.log(`  - ${key}: ${count}`);
    });
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Get command line arguments
const args = process.argv.slice(2);
const filePath = args[0];
const userId = args[1];
const apiUrl = args[2] || 'http://localhost:3000';

if (!filePath || !userId) {
  console.log('Usage: npx tsx scripts/migrate.ts <exported-data-file.json> <userId> [apiUrl]');
  console.log('\nExample:');
  console.log('  npx tsx scripts/migrate.ts ./backup.json user123 http://localhost:3000');
  console.log('\nNote: You need to export your localStorage data first using the Export feature in the app.');
  process.exit(1);
}

migrateFromFile(filePath, userId, apiUrl);

