/**
 * Script to import objections and rebuttals from a text file
 * 
 * Usage: npx tsx scripts/import-objections-from-text.ts [text-file-path]
 * 
 * Expected format:
 * OBJECTION: "Your objection text here"
 * REBUTTAL: "Your rebuttal text here"
 * ---
 * OBJECTION: "Next objection..."
 * REBUTTAL: "Next rebuttal..."
 * 
 * Or alternative format:
 * 1. Objection text here
 * Response: Rebuttal text here
 * ---
 * 2. Next objection...
 * Response: Next rebuttal...
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface Response {
  id: string;
  text: string;
  isCustom: boolean;
}

interface Objection {
  id: string;
  text: string;
  category: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  defaultResponses: Response[];
  customResponses: Response[];
}

// Categories mapping
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Price': ['price', 'cost', 'expensive', 'cheap', 'afford', 'budget', 'money', 'dollar', 'worth'],
  'Timing': ['time', 'later', 'busy', 'schedule', 'when', 'soon', 'wait', 'hurry'],
  'Interest': ['interested', 'not interested', 'maybe', 'consider', 'think'],
  'Trust': ['trust', 'believe', 'doubt', 'sure', 'guarantee', 'promise', 'honest'],
  'Property': ['property', 'house', 'condition', 'repair', 'damage', 'needs work', 'location'],
  'Financial': ['fund', 'finance', 'loan', 'credit', 'cash', 'payment', 'down payment'],
};

function detectCategory(text: string): string {
  const lowerText = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return category;
    }
  }
  return 'General';
}

function detectDifficulty(text: string): 'beginner' | 'intermediate' | 'advanced' {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('complex') || lowerText.includes('complicated') || lowerText.length > 100) {
    return 'advanced';
  }
  if (lowerText.includes('simple') || lowerText.length < 30) {
    return 'beginner';
  }
  return 'intermediate';
}

/**
 * Parse text file to extract objections and rebuttals
 */
function parseTextFile(content: string): Objection[] {
  const objections: Objection[] = [];
  
  // Normalize line endings and split into lines
  const allLines = content.replace(/\r\n/g, '\n').split('\n');
  
  let currentCategory = 'General';
  let objectionText = '';
  let rebuttalText = '';
  let inObjection = false;
  let inRebuttal = false;
  
  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i].trim();
    
    // Skip empty lines
    if (!line) {
      // If we have a complete pair, save it
      if (objectionText && rebuttalText) {
        const cleanedObjection = objectionText.replace(/^["']|["']$/g, '').trim();
        const cleanedRebuttal = rebuttalText.replace(/^["']|["']$/g, '').trim();
        
        if (cleanedObjection.length > 10 && cleanedRebuttal.length > 10) {
          const category = detectCategory(cleanedObjection) !== 'General' ? detectCategory(cleanedObjection) : currentCategory;
          const difficulty = detectDifficulty(cleanedObjection);
          
          objections.push({
            id: uuidv4(),
            text: cleanedObjection,
            category,
            difficulty,
            defaultResponses: [
              {
                id: uuidv4(),
                text: cleanedRebuttal,
                isCustom: false,
              },
            ],
            customResponses: [],
          });
        }
        // Reset for next pair
        objectionText = '';
        rebuttalText = '';
        inObjection = false;
        inRebuttal = false;
      }
      continue;
    }
    
    // Check for category header: OBJECTION: CATEGORY
    const categoryMatch = line.match(/^OBJECTION:\s*([A-Z]+)/i);
    if (categoryMatch) {
      const categoryName = categoryMatch[1].toUpperCase();
      // Map common category names
      if (categoryName === 'PRICE' || categoryName === 'COST') {
        currentCategory = 'Price';
      } else if (categoryName === 'VALUE' || categoryName === 'APPRAISAL') {
        currentCategory = 'Property';
      } else if (categoryName === 'TIMING' || categoryName === 'TIME') {
        currentCategory = 'Timing';
      } else if (categoryName === 'TRUST' || categoryName === 'BELIEVE') {
        currentCategory = 'Trust';
      } else if (categoryName === 'FINANCIAL' || categoryName === 'MONEY') {
        currentCategory = 'Financial';
      } else {
        currentCategory = 'General';
      }
      continue;
    }
    
    // Match O: or OBJECTION: for objections
    const objectionMatch = line.match(/^(O|OBJECTION):\s*["']?([^"']+)["']?|^(O|OBJECTION):\s*(.+)/i);
    if (objectionMatch) {
      // Save previous pair if exists
      if (objectionText && rebuttalText) {
        const cleanedObjection = objectionText.replace(/^["']|["']$/g, '').trim();
        const cleanedRebuttal = rebuttalText.replace(/^["']|["']$/g, '').trim();
        
        if (cleanedObjection.length > 10 && cleanedRebuttal.length > 10) {
          const category = detectCategory(cleanedObjection) !== 'General' ? detectCategory(cleanedObjection) : currentCategory;
          const difficulty = detectDifficulty(cleanedObjection);
          
          objections.push({
            id: uuidv4(),
            text: cleanedObjection,
            category,
            difficulty,
            defaultResponses: [
              {
                id: uuidv4(),
                text: cleanedRebuttal,
                isCustom: false,
              },
            ],
            customResponses: [],
          });
        }
      }
      
      // Start new objection
      inObjection = true;
      inRebuttal = false;
      objectionText = (objectionMatch[2] || objectionMatch[4] || '').trim();
      rebuttalText = '';
      continue;
    }
    
    // Match A: or REBUTTAL: or RESPONSE: for answers
    const rebuttalMatch = line.match(/^(A|REBUTTAL|RESPONSE|ANSWER):\s*["']?([^"']+)["']?|^(A|REBUTTAL|RESPONSE|ANSWER):\s*(.+)/i);
    if (rebuttalMatch) {
      inObjection = false;
      inRebuttal = true;
      rebuttalText = (rebuttalMatch[2] || rebuttalMatch[4] || '').trim();
      continue;
    }
    
    // Continuation lines
    if (inObjection && objectionText) {
      const cleaned = line.replace(/^["']|["']$/g, '').trim();
      objectionText += ' ' + cleaned;
    } else if (inRebuttal && rebuttalText) {
      const cleaned = line.replace(/^["']|["']$/g, '').trim();
      rebuttalText += ' ' + cleaned;
    }
  }
  
  // Don't forget the last pair
  if (objectionText && rebuttalText) {
    const cleanedObjection = objectionText.replace(/^["']|["']$/g, '').trim();
    const cleanedRebuttal = rebuttalText.replace(/^["']|["']$/g, '').trim();
    
    if (cleanedObjection.length > 10 && cleanedRebuttal.length > 10) {
      const category = detectCategory(cleanedObjection) !== 'General' ? detectCategory(cleanedObjection) : currentCategory;
      const difficulty = detectDifficulty(cleanedObjection);
      
      objections.push({
        id: uuidv4(),
        text: cleanedObjection,
        category,
        difficulty,
        defaultResponses: [
          {
            id: uuidv4(),
            text: cleanedRebuttal,
            isCustom: false,
          },
        ],
        customResponses: [],
      });
    }
  }
  
  return objections;
}

/**
 * Load existing objections from data/objections.ts
 */
function loadExistingObjections(): Objection[] {
  const objectionsFile = path.join(process.cwd(), 'data', 'objections.ts');
  
  if (!fs.existsSync(objectionsFile)) {
    return [];
  }
  
  try {
    const content = fs.readFileSync(objectionsFile, 'utf-8');
    // Extract the array using regex
    const arrayMatch = content.match(/export const initialObjections: Objection\[\] = (\[[\s\S]*\]);/);
    if (arrayMatch) {
      // Use eval to parse the array (safe in this context as it's our own file)
      // eslint-disable-next-line no-eval
      return eval(arrayMatch[1]) as Objection[];
    }
  } catch (error) {
    console.warn('Could not parse existing objections file:', error);
  }
  
  return [];
}

/**
 * Merge new objections with existing, avoiding duplicates
 */
function mergeObjections(existing: Objection[], newOnes: Objection[]): Objection[] {
  const existingTexts = new Set(existing.map(obj => obj.text.toLowerCase().trim()));
  const merged = [...existing];
  let added = 0;
  let skipped = 0;
  
  for (const newObj of newOnes) {
    const normalizedText = newObj.text.toLowerCase().trim();
    if (!existingTexts.has(normalizedText)) {
      merged.push(newObj);
      existingTexts.add(normalizedText);
      added++;
    } else {
      console.log(`⏭️  Skipping duplicate: "${newObj.text.substring(0, 60)}..."`);
      skipped++;
    }
  }
  
  console.log(`\n📊 Import Summary:`);
  console.log(`   ✅ Added: ${added} new objections`);
  console.log(`   ⏭️  Skipped: ${skipped} duplicates`);
  console.log(`   📝 Total: ${merged.length} objections`);
  
  return merged;
}

/**
 * Save objections to data/objections.ts
 */
function saveObjections(objections: Objection[]): void {
  const outputPath = path.join(process.cwd(), 'data', 'objections.ts');
  
  const output = `import { Objection } from '@/types';

export const initialObjections: Objection[] = ${JSON.stringify(objections, null, 2)};
`;
  
  fs.writeFileSync(outputPath, output, 'utf-8');
  console.log(`\n✅ Saved ${objections.length} objections to ${outputPath}`);
}

async function main() {
  const args = process.argv.slice(2);
  const textFilePath = args[0] || path.join(process.cwd(), 'objections.txt');
  
  if (!fs.existsSync(textFilePath)) {
    console.error(`❌ Text file not found: ${textFilePath}`);
    console.error('\n📋 Usage:');
    console.error('   npx tsx scripts/import-objections-from-text.ts [text-file-path]');
    console.error('\n📝 Expected format in text file:');
    console.error('   OBJECTION: "Your objection text here"');
    console.error('   REBUTTAL: "Your rebuttal text here"');
    console.error('   ---');
    console.error('   OBJECTION: "Next objection..."');
    console.error('   REBUTTAL: "Next rebuttal..."');
    process.exit(1);
  }
  
  try {
    console.log(`📖 Reading text file: ${textFilePath}`);
    const content = fs.readFileSync(textFilePath, 'utf-8');
    
    console.log('🔍 Parsing objections and rebuttals...');
    const newObjections = parseTextFile(content);
    
    if (newObjections.length === 0) {
      console.error('\n❌ No objections found in the text file.');
      console.error('Please check the format. Expected:');
      console.error('   OBJECTION: "text"');
      console.error('   REBUTTAL: "text"');
      process.exit(1);
    }
    
    console.log(`✅ Found ${newObjections.length} objections in text file`);
    
    // Show sample
    console.log('\n📋 Sample parsed objection:');
    console.log(JSON.stringify(newObjections[0], null, 2));
    
    // Load existing objections
    console.log('\n📚 Loading existing objections...');
    const existingObjections = loadExistingObjections();
    console.log(`   Found ${existingObjections.length} existing objections`);
    
    // Merge
    const merged = mergeObjections(existingObjections, newObjections);
    
    // Save
    saveObjections(merged);
    
    console.log('\n🎉 Import complete!');
    
  } catch (error) {
    console.error('❌ Error importing objections:', error);
    process.exit(1);
  }
}

main();

