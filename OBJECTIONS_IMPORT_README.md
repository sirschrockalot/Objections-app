# Importing Objections and Rebuttals

This guide explains how to import objections and rebuttals from external sources into the app.

## Issue with PDF Import

The `Objections_new.pdf` file is **image-based (scanned)**, which means `pdf-parse` cannot extract text from it. The PDF contains only page separators when parsed, not the actual objection/rebuttal content.

## Solutions

### Option 1: Text File Import (Recommended)

Use the text import script to import objections from a plain text file.

#### Step 1: Extract Text from PDF

You have several options:

1. **Use Adobe Acrobat** (if available):
   - Open the PDF
   - Use "Export PDF" → "Text" to export as a text file

2. **Use Online OCR Tools**:
   - Upload the PDF to an OCR service (e.g., Adobe Online OCR, Google Drive OCR, or online-ocr.com)
   - Download the extracted text

3. **Manually Type** (if the PDF is short):
   - Create a text file and type the objections and rebuttals

#### Step 2: Format the Text File

Create a text file (e.g., `objections.txt`) with the following format:

```
OBJECTION: "Price is too high."
REBUTTAL: "Totally understand. Most investors feel that way until they walk it. After seeing the condition in person, they usually realize there's more spread than they thought. Let's do this — come walk it and give me your best number. If the seller agrees, I'll lock it in for you."
---
OBJECTION: "I need to run the numbers first."
REBUTTAL: "No problem at all — I sent you everything you need. While you look at it, let's go ahead and schedule a walkthrough. If the numbers don't match what you want after seeing it, no harm done."
---
OBJECTION: "I'm not interested."
REBUTTAL: "Got it — just so I don't send you stuff that doesn't fit, is it the price, location, or condition that makes this one a pass?"
```

**Format Rules:**
- Each objection/rebuttal pair is separated by `---` on its own line
- Use `OBJECTION:` and `REBUTTAL:` labels (or `RESPONSE:`)
- Text can be in quotes or without quotes
- Multi-line objections/rebuttals are supported

#### Step 3: Run the Import Script

```bash
npx tsx scripts/import-objections-from-text.ts objections.txt
```

The script will:
- Parse the text file
- Detect categories and difficulty levels automatically
- Merge with existing objections (skipping duplicates)
- Save to `data/objections.ts`

### Option 2: PDF Import (For Text-Based PDFs Only)

If you have a text-based PDF (not scanned), you can use the PDF import script:

```bash
npx tsx scripts/import-objections-from-pdf.ts
```

**Note:** This will only work if the PDF contains actual text, not images.

## Script Features

Both import scripts:

- ✅ **Automatic Category Detection**: Detects categories (Price, Timing, Interest, Trust, Property, Financial) based on keywords
- ✅ **Difficulty Assessment**: Automatically assigns difficulty levels (beginner, intermediate, advanced)
- ✅ **Duplicate Prevention**: Skips objections that already exist (based on text matching)
- ✅ **Safe Merging**: Preserves existing objections and adds new ones

## Example Output

```
📖 Reading text file: objections.txt
🔍 Parsing objections and rebuttals...
✅ Found 15 objections in text file

📋 Sample parsed objection:
{
  "id": "...",
  "text": "Price is too high.",
  "category": "Price",
  "difficulty": "beginner",
  "defaultResponses": [...]
}

📚 Loading existing objections...
   Found 20 existing objections

📊 Import Summary:
   ✅ Added: 15 new objections
   ⏭️  Skipped: 0 duplicates
   📝 Total: 35 objections

✅ Saved 35 objections to data/objections.ts

🎉 Import complete!
```

## Troubleshooting

### "No objections found"

- Check that your text file uses the correct format (`OBJECTION:` and `REBUTTAL:` labels)
- Ensure objections and rebuttals are separated by `---`
- Try the example file: `objections-example.txt`

### "PDF appears to be image-based"

- The PDF is scanned and needs OCR
- Use Option 1 (Text File Import) instead
- Extract text using OCR tools first

### Duplicates are being skipped

- This is expected behavior to prevent duplicate objections
- The script compares objection text (case-insensitive) to detect duplicates
- If you want to update an existing objection, edit `data/objections.ts` directly

## Files

- `scripts/import-objections-from-text.ts` - Text file import script
- `scripts/import-objections-from-pdf.ts` - PDF import script (text-based PDFs only)
- `objections-example.txt` - Example text file format
- `data/objections.ts` - Where objections are stored

