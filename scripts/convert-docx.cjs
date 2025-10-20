const mammoth = require("mammoth");
const fs = require("fs/promises");
const path = require("path");

async function convertDocx() {
  try {
    const docxPath = path.join(__dirname, "../attached_assets/Volume1_Speaking the Truth with Love_1760944571000.docx");
    
    console.log("Reading DOCX file...");
    const result = await mammoth.convertToHtml({ path: docxPath }, {
      styleMap: [
        "p[style-name='Quote'] => blockquote",
        "p[style-name='Block Text'] => blockquote",
      ]
    });
    
    const html = result.value;
    const messages = result.messages;
    
    console.log("Conversion messages:", messages);
    console.log("\n=== HTML OUTPUT (first 5000 chars) ===\n");
    console.log(html.substring(0, 5000));
    console.log("\n=== HTML OUTPUT (chars 5000-10000) ===\n");
    console.log(html.substring(5000, 10000));
    console.log("\n=== Total HTML length:", html.length, "characters ===\n");
    
    // Save full HTML to file for inspection
    const outputPath = path.join(__dirname, "../tmp/book-content.html");
    await fs.writeFile(outputPath, html, "utf-8");
    console.log(`\nFull HTML saved to: ${outputPath}`);
    
    // Also extract plain text for reference
    const textResult = await mammoth.extractRawText({ path: docxPath });
    const plainText = textResult.value;
    const textPath = path.join(__dirname, "../tmp/book-content.txt");
    await fs.writeFile(textPath, plainText, "utf-8");
    console.log(`Plain text saved to: ${textPath}`);
    console.log(`\nPlain text length: ${plainText.length} characters`);
    
  } catch (error) {
    console.error("Error converting DOCX:", error);
    process.exit(1);
  }
}

convertDocx();
