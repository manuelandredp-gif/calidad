const fs = require('fs');
const xml = fs.readFileSync('C:/Users/LENOVO/Desktop/CALIDAD/DOCUMENTACION/temp_inspect/word/document.xml', 'utf8');

// Sample a table
const tblMatch = xml.match(/<w:tbl\b[\s\S]*?<\/w:tbl>/);
if (tblMatch) {
  console.log('--- SAMPLE TABLE (first 1000 chars) ---');
  console.log(tblMatch[0].slice(0, 1000));
}

// Sample a drawing
const drawMatch = xml.match(/<w:drawing\b[\s\S]*?<\/w:drawing>/);
if (drawMatch) {
  console.log('--- SAMPLE DRAWING (first 1000 chars) ---');
  console.log(drawMatch[0].slice(0, 1000));
}
