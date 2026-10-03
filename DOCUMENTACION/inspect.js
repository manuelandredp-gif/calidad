const fs = require('fs');
const xml = fs.readFileSync('C:/Users/LENOVO/Desktop/CALIDAD/DOCUMENTACION/temp_inspect/word/document.xml', 'utf8');

const pMatches = xml.match(/<w:p\b[\s\S]*?<\/w:p>/g) || [];
pMatches.forEach((p, idx) => {
  if (p.includes('<w:drawing>') || p.includes('<v:shape>') || p.includes('<w:pict>')) {
    const prev = idx > 0 ? pMatches[idx - 1].replace(/<[^>]+>/g, '') : '';
    const next = idx < pMatches.length - 1 ? pMatches[idx + 1].replace(/<[^>]+>/g, '') : '';
    const rIdMatch = p.match(/r:embed="([^"]+)"/);
    console.log(`=== Drawing at p[${idx}] | rId: ${rIdMatch ? rIdMatch[1] : 'none'} ===`);
    console.log('  Prev: ' + prev.replace(/\s+/g, ' ').trim().slice(0, 100));
    console.log('  Next: ' + next.replace(/\s+/g, ' ').trim().slice(0, 100));
  }
});
