const fs = require('fs');
const xml = fs.readFileSync('C:/Users/LENOVO/Desktop/CALIDAD/DOCUMENTACION/temp_inspect/word/document.xml', 'utf8');

// Find all pStyle usages
const pStyles = new Set();
const pStyleMatches = xml.matchAll(/<w:pStyle\s+w:val="([^"]+)"/g);
for (const m of pStyleMatches) {
  pStyles.add(m[1]);
}

// Find all rStyle usages
const rStyles = new Set();
const rStyleMatches = xml.matchAll(/<w:rStyle\s+w:val="([^"]+)"/g);
for (const m of rStyleMatches) {
  rStyles.add(m[1]);
}

// Find all tblStyle usages
const tblStyles = new Set();
const tblStyleMatches = xml.matchAll(/<w:tblStyle\s+w:val="([^"]+)"/g);
for (const m of tblStyleMatches) {
  tblStyles.add(m[1]);
}

console.log('Paragraph Styles in document:', Array.from(pStyles));
console.log('Run Styles in document:', Array.from(rStyles));
console.log('Table Styles in document:', Array.from(tblStyles));

// Also check sectPr
const sectPrMatches = xml.match(/<w:sectPr[\s\S]*?<\/w:sectPr>/g) || [];
console.log('Total Section Properties:', sectPrMatches.length);
if (sectPrMatches.length > 0) {
  console.log('SectPr sample:', sectPrMatches[0].slice(0, 300));
}
