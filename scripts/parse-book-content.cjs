const fs = require("fs/promises");
const path = require("path");

async function parseBookContent() {
  try {
    const htmlPath = path.join(__dirname, "../tmp/book-content.html");
    const html = await fs.readFile(htmlPath, "utf-8");
    
    console.log("Parsing HTML content...");
    console.log("HTML length:", html.length);
    
    // Simple regex-based parsing to extract headings and content
    const h2Matches = [...html.matchAll(/<h2[^>]*>(.*?)<\/h2>/gs)];
    const h3Matches = [...html.matchAll(/<h3[^>]*>(.*?)<\/h3>/gs)];
    const h4Matches = [...html.matchAll(/<h4[^>]*>(.*?)<\/h4>/gs)];
    
    console.log("\n=== Found Headings ===");
    console.log("H2 (Chapter level):", h2Matches.length);
    console.log("H3 (Section level):", h3Matches.length);
    console.log("H4 (Subsection level):", h4Matches.length);
    
    console.log("\n=== Sample H2 Headings (Chapters) ===");
    h2Matches.slice(0, 10).forEach((match, i) => {
      const text = match[1].replace(/<[^>]*>/g, '').trim();
      console.log(`${i + 1}. ${text}`);
    });
    
    console.log("\n=== Sample H3 Headings (Sections) ===");
    h3Matches.slice(0, 15).forEach((match, i) => {
      const text = match[1].replace(/<[^>]*>/g, '').trim();
      console.log(`${i + 1}. ${text}`);
    });
    
    // Extract paragraphs
    const paragraphs = html.split(/<\/p>/).map(p => {
      const cleaned = p.replace(/<p[^>]*>/g, '').trim();
      return cleaned;
    }).filter(p => p.length > 50 && p.length < 5000);
    
    console.log("\n=== Content Stats ===");
    console.log("Total paragraphs:", paragraphs.length);
    console.log("Average paragraph length:", Math.round(paragraphs.reduce((sum, p) => sum + p.length, 0) / paragraphs.length));
    
    // Look for block quotes (paragraphs starting with ")
    const blockQuotes = paragraphs.filter(p => p.trim().startsWith('"') && p.length > 100);
    console.log("Potential block quotes:", blockQuotes.length);
    
    console.log("\n=== Sample Block Quotes ===");
    blockQuotes.slice(0, 3).forEach((quote, i) => {
      console.log(`\n${i + 1}. ${quote.substring(0, 200)}...`);
    });
    
  } catch (error) {
    console.error("Error parsing HTML:", error);
    process.exit(1);
  }
}

parseBookContent();
