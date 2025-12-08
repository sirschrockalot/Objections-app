#!/usr/bin/env tsx
/**
 * Manual dependency check script
 * Checks for outdated packages and security vulnerabilities
 * 
 * Usage: npm run deps:check-manual
 * Or: npx tsx scripts/check-dependencies.ts
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

interface OutdatedPackage {
  current: string;
  wanted: string;
  latest: string;
  location: string;
  dependent?: string;
  type?: string;
}

interface AuditResult {
  vulnerabilities: {
    [key: string]: {
      name: string;
      severity: string;
      title: string;
      url: string;
    };
  };
  metadata: {
    vulnerabilities: {
      info: number;
      low: number;
      moderate: number;
      high: number;
      critical: number;
      total: number;
    };
  };
}

console.log('🔍 Checking dependencies...\n');

// Check for outdated packages
console.log('📦 Checking for outdated packages...');
try {
  const outdatedOutput = execSync('npm outdated --json', { encoding: 'utf-8', stdio: 'pipe' });
  const outdated: Record<string, OutdatedPackage> = JSON.parse(outdatedOutput);
  
  const outdatedCount = Object.keys(outdated).length;
  
  if (outdatedCount === 0) {
    console.log('✅ All packages are up to date!\n');
  } else {
    console.log(`⚠️  Found ${outdatedCount} outdated package(s):\n`);
    
    Object.entries(outdated).forEach(([name, info]) => {
      const updateType = info.current.split('.')[0] !== info.latest.split('.')[0] 
        ? 'MAJOR' 
        : info.current.split('.')[1] !== info.latest.split('.')[1]
        ? 'MINOR'
        : 'PATCH';
      
      const emoji = updateType === 'MAJOR' ? '🔴' : updateType === 'MINOR' ? '🟡' : '🟢';
      
      console.log(`${emoji} ${name}`);
      console.log(`   Current: ${info.current}`);
      console.log(`   Latest:  ${info.latest}`);
      console.log(`   Type:    ${updateType} update\n`);
    });
  }
} catch (error: any) {
  if (error.status === 1) {
    // npm outdated exits with code 1 when packages are outdated
    const outdated: Record<string, OutdatedPackage> = JSON.parse(error.stdout);
    const outdatedCount = Object.keys(outdated).length;
    
    console.log(`⚠️  Found ${outdatedCount} outdated package(s):\n`);
    
    Object.entries(outdated).forEach(([name, info]) => {
      const updateType = info.current.split('.')[0] !== info.latest.split('.')[0] 
        ? 'MAJOR' 
        : info.current.split('.')[1] !== info.latest.split('.')[1]
        ? 'MINOR'
        : 'PATCH';
      
      const emoji = updateType === 'MAJOR' ? '🔴' : updateType === 'MINOR' ? '🟡' : '🟢';
      
      console.log(`${emoji} ${name}`);
      console.log(`   Current: ${info.current}`);
      console.log(`   Latest:  ${info.latest}`);
      console.log(`   Type:    ${updateType} update\n`);
    });
  } else {
    console.error('Error checking outdated packages:', error.message);
  }
}

// Check for security vulnerabilities
console.log('🔒 Checking for security vulnerabilities...');
try {
  const auditOutput = execSync('npm audit --json', { encoding: 'utf-8', stdio: 'pipe' });
  const audit: AuditResult = JSON.parse(auditOutput);
  
  const vulns = audit.metadata.vulnerabilities;
  const total = vulns.total;
  
  if (total === 0) {
    console.log('✅ No security vulnerabilities found!\n');
  } else {
    console.log(`⚠️  Found ${total} security vulnerability/vulnerabilities:\n`);
    console.log(`   Critical: ${vulns.critical}`);
    console.log(`   High:     ${vulns.high}`);
    console.log(`   Moderate: ${vulns.moderate}`);
    console.log(`   Low:      ${vulns.low}`);
    console.log(`   Info:     ${vulns.info}\n`);
    
    if (vulns.critical > 0 || vulns.high > 0) {
      console.log('🚨 CRITICAL: High or critical vulnerabilities detected!');
      console.log('   Run: npm audit fix\n');
    } else {
      console.log('💡 Run: npm audit fix (to attempt automatic fixes)\n');
    }
  }
} catch (error: any) {
  if (error.status === 1) {
    // npm audit exits with code 1 when vulnerabilities are found
    const audit: AuditResult = JSON.parse(error.stdout);
    const vulns = audit.metadata.vulnerabilities;
    const total = vulns.total;
    
    console.log(`⚠️  Found ${total} security vulnerability/vulnerabilities:\n`);
    console.log(`   Critical: ${vulns.critical}`);
    console.log(`   High:     ${vulns.high}`);
    console.log(`   Moderate: ${vulns.moderate}`);
    console.log(`   Low:      ${vulns.low}`);
    console.log(`   Info:     ${vulns.info}\n`);
    
    if (vulns.critical > 0 || vulns.high > 0) {
      console.log('🚨 CRITICAL: High or critical vulnerabilities detected!');
      console.log('   Run: npm audit fix\n');
    } else {
      console.log('💡 Run: npm audit fix (to attempt automatic fixes)\n');
    }
  } else {
    console.error('Error checking security vulnerabilities:', error.message);
  }
}

// Summary
console.log('📊 Summary:');
console.log('   - Dependabot will automatically create PRs for updates');
console.log('   - Security updates are prioritized');
console.log('   - Major updates require manual review');
console.log('   - See DEPENDENCY_MANAGEMENT.md for more info\n');

