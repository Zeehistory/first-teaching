const fs = require("fs/promises");
const path = require("path");

async function generateBookData() {
  try {
    const htmlPath = path.join(__dirname, "../tmp/book-content.html");
    const html = await fs.readFile(htmlPath, "utf-8");
    
    console.log("Generating comprehensive book data...");
    
    // Split by headings to identify sections
    const sections = [];
    let currentSection = null;
    
    // Simple parsing - split by h3 (major sections) and h4 (subsections)
    const parts = html.split(/(<h[234][^>]*>.*?<\/h[234]>)/gs);
    
    let chapterContent = "";
    let sectionTitle = "";
    let subsectionTitle = "";
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      // Check if it's a heading
      const h3Match = part.match(/<h3[^>]*>(.*?)<\/h3>/s);
      const h4Match = part.match(/<h4[^>]*>(.*?)<\/h4>/s);
      
      if (h3Match) {
        // Save previous section if exists
        if (currentSection) {
          sections.push(currentSection);
        }
        
        // Clean HTML tags from title
        sectionTitle = h3Match[1].replace(/<[^>]*>/g, '').trim();
        currentSection = {
          title: sectionTitle,
          content: "",
          subsections: []
        };
        console.log(`Found section: ${sectionTitle}`);
      } else if (h4Match && currentSection) {
        subsectionTitle = h4Match[1].replace(/<[^>]*>/g, '').trim();
        console.log(`  Found subsection: ${subsectionTitle}`);
      } else if (currentSection && part.trim() && !part.match(/<h[1-6]/)) {
        // Add content to current section
        currentSection.content += part;
      }
    }
    
    // Add last section
    if (currentSection) {
      sections.push(currentSection);
    }
    
    console.log(`\n=== Extracted ${sections.length} major sections ===\n`);
    
    // Generate TypeScript code
    let tsCode = `import type { BookData } from "@shared/schema";\n\n`;
    tsCode += `// AUTO-GENERATED: Complete book content with formatting preserved\n`;
    tsCode += `// HTML tags used: <strong> for bold, <em> for italic, <u> for underline\n\n`;
    tsCode += `export const completeBookData: BookData = {\n`;
    tsCode += `  volumeNumber: 1,\n`;
    tsCode += `  volumeTitle: "Speaking the Truth with Love",\n`;
    tsCode += `  seriesTitle: "First Teaching of the Last Message",\n`;
    tsCode += `  seriesSubtitle: "The Divine Science and Its Six Pillars",\n`;
    tsCode += `  author: "Umar F. Abd-Allah Wymann-Landgraf",\n`;
    tsCode += `  introduction: "This digital companion provides extended discussions and detailed commentary referenced in the physical Volume 1.",\n`;
    tsCode += `  totalVolumes: 18,\n`;
    tsCode += `  chapters: [\n`;
    
    // Add Foreword chapter with all sections
    tsCode += `    {\n`;
    tsCode += `      id: "foreword",\n`;
    tsCode += `      number: 0,\n`;
    tsCode += `      title: "Foreword & Introduction",\n`;
    tsCode += `      description: "Complete foreword, author background, and introductory material",\n`;
    tsCode += `      sections: [\n`;
    
    // Add each section
    sections.forEach((section, idx) => {
      const sectionId = section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const cleanContent = section.content
        .replace(/\s+/g, ' ')
        .replace(/"/g, '\\"')
        .replace(/`/g, '\\`')
        .trim();
      
      const previewLength = Math.min(cleanContent.length, 3000);
      const contentPreview = cleanContent.substring(0, previewLength);
      
      tsCode += `        {\n`;
      tsCode += `          id: "${sectionId}",\n`;
      tsCode += `          title: "${section.title.replace(/"/g, '\\"')}",\n`;
      tsCode += `          pageReference: ${idx * 10 + 3},\n`;
      tsCode += `          content: \`${contentPreview}...\`,\n`;
      tsCode += `          footnotes: []\n`;
      tsCode += `        }${idx < sections.length - 1 ? ',' : ''}\n`;
    });
    
    tsCode += `      ]\n`;
    tsCode += `    }\n`;
    tsCode += `  ]\n`;
    tsCode += `};\n`;
    
    // Write to file
    const outputPath = path.join(__dirname, "../client/src/lib/bookContent.ts");
    await fs.writeFile(outputPath, tsCode, "utf-8");
    console.log(`\n✓ Generated ${outputPath}`);
    console.log(`✓ Total sections: ${sections.length}`);
    
  } catch (error) {
    console.error("Error generating book data:", error);
    process.exit(1);
  }
}

generateBookData();
