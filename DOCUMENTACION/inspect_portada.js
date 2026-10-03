const fs = require('fs');
const xml = fs.readFileSync('C:/Users/LENOVO/Desktop/CALIDAD/DOCUMENTACION/temp_inspect/word/document.xml', 'utf8');

// Find all paragraphs before "CONTROL DE VERSIONES"
const idx = xml.indexOf('CONTROL DE VERSIONES');
console.log('--- PORTADA XML SNIPPET (first 2500 chars) ---');
console.log(xml.substring(0, Math.min(idx, 2500)));
