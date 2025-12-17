#!/usr/bin/env tsx
/**
 * Script to fix incomplete or garbled objections in the database
 * 
 * This script:
 * 1. Identifies objections with incomplete text
 * 2. Proposes clean fixes
 * 3. Updates the objections.ts file
 */

import fs from 'fs';
import path from 'path';
import { Objection } from '@/types';

interface IncompleteObjection {
  id: string;
  currentText: string;
  proposedText: string;
  reason: string;
  severity: 'critical' | 'moderate' | 'minor';
}

/**
 * Load objections from data/objections.ts
 */
function loadObjections(): Objection[] {
  const filePath = path.join(process.cwd(), 'data', 'objections.ts');
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Extract the array using regex
  const arrayMatch = content.match(/export const initialObjections: Objection\[\] = (\[[\s\S]*\]);/);
  if (!arrayMatch) {
    throw new Error('Could not parse objections file');
  }
  
  // Use eval to parse (safe in this context as it's our own file)
  // eslint-disable-next-line no-eval
  return eval(arrayMatch[1]) as Objection[];
}

/**
 * Identify incomplete objections
 */
function identifyIncompleteObjections(objections: Objection[]): IncompleteObjection[] {
  const issues: IncompleteObjection[] = [];

  for (const objection of objections) {
    const text = objection.text.trim();
    
    // Check for cut-off text (ends mid-word or incomplete sentence)
    if (text.length < 10) {
      issues.push({
        id: objection.id,
        currentText: text,
        proposedText: '', // Will be determined below
        reason: 'Text is too short (likely incomplete)',
        severity: 'critical'
      });
      continue;
    }

    // Check for specific known issues
    if (objection.id === '42d038eb-12bb-4e3f-a45c-f1791a7e83ee') {
      // "What if my tenants don" - clearly cut off
      issues.push({
        id: objection.id,
        currentText: text,
        proposedText: "What if my tenants don't pay or don't move out?",
        reason: 'Text is cut off mid-sentence. Common tenant concerns are payment or moving out.',
        severity: 'critical'
      });
      continue;
    }

    if (objection.id === '5a294523-b6be-4d84-a7c4-57015ca51083') {
      // "I a n d won't b a c k out?" - garbled OCR
      issues.push({
        id: objection.id,
        currentText: text,
        proposedText: "How do I know you won't back out?",
        reason: 'Text is garbled from OCR errors. This is a common trust objection about buyer reliability.',
        severity: 'critical'
      });
      continue;
    }

    // Check for text ending without proper punctuation (except ellipsis which might be intentional)
    if (!text.match(/[.!?]$/) && !text.endsWith('...')) {
      // Check if it looks like it was cut off
      const lastWord = text.split(/\s+/).pop() || '';
      if (lastWord.length < 3 || !lastWord.match(/[aeiou]/i)) {
        // Very short last word or no vowels - likely cut off
        issues.push({
          id: objection.id,
          currentText: text,
          proposedText: text + '.', // Add period
          reason: 'Text appears incomplete (no ending punctuation, short last word)',
          severity: 'moderate'
        });
      }
    }

    // Check for excessive spacing (OCR errors)
    if (text.match(/\s{3,}/) || text.match(/[a-z]\s+[a-z]\s+[a-z]/i)) {
      // Has triple spaces or single letters with spaces between
      const cleaned = text.replace(/\s+/g, ' ').trim();
      if (cleaned !== text) {
        issues.push({
          id: objection.id,
          currentText: text,
          proposedText: cleaned,
          reason: 'Text has excessive spacing from OCR errors',
          severity: 'moderate'
        });
      }
    }
  }

  return issues;
}

/**
 * Apply fixes to objections
 */
function applyFixes(objections: Objection[], fixes: IncompleteObjection[]): Objection[] {
  const fixedObjections = objections.map(obj => {
    const fix = fixes.find(f => f.id === obj.id);
    if (fix && fix.proposedText) {
      return {
        ...obj,
        text: fix.proposedText
      };
    }
    return obj;
  });

  return fixedObjections;
}

/**
 * Save objections back to file
 */
function saveObjections(objections: Objection[]): void {
  const filePath = path.join(process.cwd(), 'data', 'objections.ts');
  
  const output = `import { Objection } from '@/types';

export const initialObjections: Objection[] = ${JSON.stringify(objections, null, 2)};
`;
  
  fs.writeFileSync(filePath, output, 'utf-8');
  console.log(`\n✅ Saved ${objections.length} objections to ${filePath}`);
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Auditing objections for incomplete text...\n');

  // Load objections
  const objections = loadObjections();
  console.log(`📊 Loaded ${objections.length} objections\n`);

  // Identify issues
  const issues = identifyIncompleteObjections(objections);
  
  if (issues.length === 0) {
    console.log('✅ No incomplete objections found!');
    return;
  }

  // Group by severity
  const critical = issues.filter(i => i.severity === 'critical');
  const moderate = issues.filter(i => i.severity === 'moderate');
  const minor = issues.filter(i => i.severity === 'minor');

  console.log('📋 Issues Found:\n');
  console.log(`🔴 Critical: ${critical.length}`);
  console.log(`🟡 Moderate: ${moderate.length}`);
  console.log(`🟢 Minor: ${minor.length}\n`);

  // Display issues
  console.log('='.repeat(80));
  issues.forEach((issue, index) => {
    const icon = issue.severity === 'critical' ? '🔴' : issue.severity === 'moderate' ? '🟡' : '🟢';
    console.log(`\n${icon} Issue #${index + 1} (${issue.severity.toUpperCase()})`);
    console.log(`   ID: ${issue.id}`);
    console.log(`   Current: "${issue.currentText}"`);
    if (issue.proposedText) {
      console.log(`   Proposed: "${issue.proposedText}"`);
    }
    console.log(`   Reason: ${issue.reason}`);
  });
  console.log('\n' + '='.repeat(80));

  // Ask for confirmation (in a real script, you'd use readline)
  const args = process.argv.slice(2);
  const autoFix = args.includes('--fix') || args.includes('-f');

  if (!autoFix) {
    console.log('\n💡 To apply fixes, run with --fix flag:');
    console.log('   npm run fix-objections -- --fix\n');
    return;
  }

  // Apply fixes
  console.log('\n🔧 Applying fixes...');
  const fixedObjections = applyFixes(objections, issues);
  
  // Save
  saveObjections(fixedObjections);
  
  console.log('\n✅ Fixes applied successfully!');
  console.log(`   Fixed ${issues.filter(i => i.proposedText).length} objections`);
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { identifyIncompleteObjections, applyFixes };

