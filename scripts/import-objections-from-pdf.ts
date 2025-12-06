/**
 * Script to import objections and rebuttals from PDF file
 * 
 * Usage: npx ts-node scripts/import-objections-from-pdf.ts
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';

// Use require for pdf-parse as it's a CommonJS module
// @ts-ignore - pdf-parse is a CommonJS module
const { PDFParse } = require('pdf-parse');

interface Response {
  id: string;
  text: string;
  isCustom: boolean;
  createdAt?: string;
  createdBy?: string;
  upvotes?: number;
  upvotedBy?: string[];
}

interface Objection {
  id: string;
  text: string;
  category: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  defaultResponses: Response[];
  customResponses: Response[];
  personalNote?: string;
}

// Categories mapping - you may need to adjust based on PDF content
const CATEGORY_MAP: Record<string, string> = {
  'price': 'Price',
  'timing': 'Timing',
  'interest': 'Interest',
  'trust': 'Trust',
  'property': 'Property',
  'financial': 'Financial',
};

// Difficulty mapping
const DIFFICULTY_MAP: Record<string, 'beginner' | 'intermediate' | 'advanced'> = {
  'beginner': 'beginner',
  'easy': 'beginner',
  'intermediate': 'intermediate',
  'medium': 'intermediate',
  'advanced': 'advanced',
  'hard': 'advanced',
};

interface ParsedObjection {
  text: string;
  category: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  responses: string[];
}

/**
 * Parse PDF text to extract objections and rebuttals
 * This is a basic parser - you may need to adjust based on PDF structure
 */
function parsePDFText(text: string): ParsedObjection[] {
  const objections: ParsedObjection[] = [];
  
  // Split by common patterns (adjust based on your PDF structure)
  // Common patterns: numbered lists, "Objection:", "Response:", etc.
  
  // Try to find objections - look for patterns like:
  // 1. Numbered objections (1., 2., etc.)
  // 2. "Objection:" followed by text
  // 3. Lines that look like questions or statements
  
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let currentObjection: ParsedObjection | null = null;
  let currentResponse: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect objection patterns
    const objectionPattern = /^(?:Objection|Rebuttal|#|(\d+)[\.\)])\s*(.+)/i;
    const match = line.match(objectionPattern);
    
    if (match) {
      // Save previous objection if exists
      if (currentObjection) {
        if (currentResponse.length > 0) {
          currentObjection.responses = [...currentResponse];
        }
        objections.push(currentObjection);
      }
      
      // Start new objection
      const objectionText = match[2] || match[1] || line;
      currentObjection = {
        text: objectionText,
        category: 'Interest', // Default, will try to detect
        responses: [],
      };
      currentResponse = [];
      
      // Try to detect category from text
      const lowerText = objectionText.toLowerCase();
      if (lowerText.includes('price') || lowerText.includes('cost') || lowerText.includes('expensive')) {
        currentObjection.category = 'Price';
      } else if (lowerText.includes('time') || lowerText.includes('later') || lowerText.includes('busy')) {
        currentObjection.category = 'Timing';
      } else if (lowerText.includes('trust') || lowerText.includes('believe') || lowerText.includes('doubt')) {
        currentObjection.category = 'Trust';
      } else if (lowerText.includes('property') || lowerText.includes('house') || lowerText.includes('condition')) {
        currentObjection.category = 'Property';
      } else if (lowerText.includes('money') || lowerText.includes('fund') || lowerText.includes('finance')) {
        currentObjection.category = 'Financial';
      }
      
      // Try to detect difficulty
      if (lowerText.includes('complex') || lowerText.includes('complicated')) {
        currentObjection.difficulty = 'advanced';
      } else if (lowerText.includes('simple') || lowerText.includes('basic')) {
        currentObjection.difficulty = 'beginner';
      }
    } else if (currentObjection) {
      // Check if this is a response/rebuttal
      const responsePattern = /^(?:Response|Rebuttal|Answer|Solution|#|(\d+)[\.\)])\s*(.+)/i;
      const responseMatch = line.match(responsePattern);
      
      if (responseMatch) {
        const responseText = responseMatch[2] || responseMatch[1] || line;
        if (responseText.length > 20) { // Only add substantial responses
          currentResponse.push(responseText);
        }
      } else if (line.length > 20 && !line.match(/^(Page|Chapter|Section)/i)) {
        // Might be continuation of objection or response
        // If we have responses, this is likely a continuation of the last response
        if (currentResponse.length > 0) {
          currentResponse[currentResponse.length - 1] += ' ' + line;
        } else {
          // Might be continuation of objection text
          currentObjection.text += ' ' + line;
        }
      }
    }
  }
  
  // Don't forget the last objection
  if (currentObjection) {
    if (currentResponse.length > 0) {
      currentObjection.responses = [...currentResponse];
    }
    objections.push(currentObjection);
  }
  
  return objections;
}

/**
 * Convert parsed objections to app format
 */
function convertToAppFormat(parsed: ParsedObjection[], startId: number = 1): Objection[] {
  return parsed.map((obj, index) => {
    const id = (startId + index).toString();
    
    const defaultResponses: Response[] = obj.responses.map((response, respIndex) => ({
      id: `${id}-${respIndex + 1}`,
      text: response,
      isCustom: false,
    }));
    
    return {
      id,
      text: obj.text,
      category: obj.category,
      difficulty: obj.difficulty || 'intermediate',
      defaultResponses,
      customResponses: [],
    };
  });
}

/**
 * Merge with existing objections, avoiding duplicates
 */
function mergeObjections(existing: Objection[], newOnes: Objection[]): Objection[] {
  const existingTexts = new Set(existing.map(obj => obj.text.toLowerCase().trim()));
  const merged = [...existing];
  
  for (const newObj of newOnes) {
    const normalizedText = newObj.text.toLowerCase().trim();
    if (!existingTexts.has(normalizedText)) {
      merged.push(newObj);
      existingTexts.add(normalizedText);
    } else {
      console.log(`Skipping duplicate: "${newObj.text.substring(0, 50)}..."`);
    }
  }
  
  return merged;
}

async function main() {
  try {
    const pdfPath = path.join(process.cwd(), 'Objections_new.pdf');
    
    if (!fs.existsSync(pdfPath)) {
      console.error(`PDF file not found: ${pdfPath}`);
      console.error('\n💡 Alternative: Create a text file with objections and use:');
      console.error('   npx tsx scripts/import-objections-from-text.ts objections.txt');
      process.exit(1);
    }
    
    console.log('Reading PDF file...');
    const dataBuffer = fs.readFileSync(pdfPath);
    const pdfParser = new PDFParse({ data: dataBuffer });
    const pdfData = await pdfParser.getText();
    
    console.log(`PDF extracted ${pdfData.text.length} characters`);
    
    // Check if PDF is image-based (scanned)
    const meaningfulText = pdfData.text.replace(/[\s\n\r\t]/g, '');
    if (meaningfulText.length < 100) {
      console.error('\n⚠️  WARNING: This PDF appears to be image-based (scanned).');
      console.error('   pdf-parse cannot extract text from scanned PDFs.');
      console.error('\n📋 Options:');
      console.error('   1. Use OCR to extract text first (e.g., Adobe Acrobat, online OCR tools)');
      console.error('   2. Manually type the objections into a text file');
      console.error('   3. Use the text import script:');
      console.error('      npx tsx scripts/import-objections-from-text.ts objections.txt');
      console.error('\n   Expected format in text file:');
      console.error('   OBJECTION: "Your objection text here"');
      console.error('   REBUTTAL: "Your rebuttal text here"');
      console.error('   ---');
      console.error('   OBJECTION: "Next objection..."');
      console.error('   REBUTTAL: "Next rebuttal..."');
      process.exit(1);
    }
    
    console.log('Parsing objections and rebuttals...');
    
    const parsed = parsePDFText(pdfData.text);
    console.log(`Found ${parsed.length} objections`);
    
    if (parsed.length === 0) {
      console.log('\n⚠️  No objections found. The PDF structure might be different.');
      console.log('First 500 characters of PDF text:');
      console.log(pdfData.text.substring(0, 500));
      console.error('\n💡 Try using the text import script instead:');
      console.error('   npx tsx scripts/import-objections-from-text.ts objections.txt');
      process.exit(1);
    }
    
    // Show sample
    console.log('\nSample parsed objection:');
    console.log(JSON.stringify(parsed[0], null, 2));
    
    // Load existing objections
    const objectionsFile = path.join(process.cwd(), 'data', 'objections.ts');
    const existingContent = fs.readFileSync(objectionsFile, 'utf-8');
    
    // Extract existing objections count (simple regex match)
    const existingMatches = existingContent.match(/id:\s*['"](\d+)['"]/g);
    const existingCount = existingMatches ? existingMatches.length : 0;
    
    // Convert to app format
    const startId = existingCount + 1;
    const newObjections = convertToAppFormat(parsed, startId);
    
    // For now, we'll append to existing - user can review and merge manually
    // Or we can try to parse the existing file more carefully
    let existingObjections: Objection[] = [];
    try {
      // Try to extract the array from the file
      const arrayMatch = existingContent.match(/export const initialObjections: Objection\[\] = (\[[\s\S]*\]);/);
      if (arrayMatch) {
        // This is a simplified approach - in production you'd want a proper parser
        existingObjections = eval(arrayMatch[1]) as Objection[];
      }
    } catch (e) {
      console.log('Could not parse existing objections, will append new ones');
    }
    
    // Merge with existing
    const merged = mergeObjections(existingObjections, newObjections);
    
    console.log(`\nTotal objections: ${merged.length} (${newObjections.length} new)`);
    
    // Write to data file
    const outputPath = path.join(process.cwd(), 'data', 'objections.ts');
    const output = `import { Objection } from '@/types';

export const initialObjections: Objection[] = ${JSON.stringify(merged, null, 2)};
`;
    
    fs.writeFileSync(outputPath, output);
    console.log(`\n✅ Updated ${outputPath}`);
    console.log(`\nAdded ${newObjections.length} new objections to the app!`);
    
  } catch (error) {
    console.error('Error importing objections:', error);
    process.exit(1);
  }
}

main();

