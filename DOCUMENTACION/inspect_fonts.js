const fs = require('fs');
const xml = fs.readFileSync('C:/Users/LENOVO/Desktop/CALIDAD/DOCUMENTACION/temp_inspect/word/styles.xml', 'utf8');

const rFonts = xml.match(/<w:rFonts\b[^>]*\/>/g) || [];
console.log('rFonts in styles:', rFonts);

const re = /<w:style\s+[^>]*w:styleId="([^"]+)"[\s\S]*?<w:name\s+w:val="([^"]+)"/g;
let m;
while ((m = re.exec(xml)) !== null) {
  console.log(m[1], '->', m[2]);
}
