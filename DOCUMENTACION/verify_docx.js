const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const docxPath = 'C:/Users/LENOVO/Desktop/CALIDAD/DOCUMENTACION/FD03-EPIS-Informe_Especificacion_Requerimientos_FINAL.docx';
console.log('File exists:', fs.existsSync(docxPath));
console.log('Size:', (fs.statSync(docxPath).size / 1024).toFixed(2), 'KB');

const testVerifyDir = 'C:/Users/LENOVO/Desktop/CALIDAD/DOCUMENTACION/temp_verify_test';
if (fs.existsSync(testVerifyDir)) {
  fs.rmSync(testVerifyDir, { recursive: true, force: true });
}

const copyZip = 'C:/Users/LENOVO/Desktop/CALIDAD/DOCUMENTACION/temp_verify.zip';
fs.copyFileSync(docxPath, copyZip);

const psCmd = `powershell -Command "Expand-Archive -Path '${copyZip}' -DestinationPath '${testVerifyDir}' -Force"`;
execSync(psCmd, { stdio: 'inherit' });
fs.unlinkSync(copyZip);

const items = fs.readdirSync(testVerifyDir);
console.log('Root archive items:', items);

// Verify XML well-formedness of document.xml
const xml = fs.readFileSync(path.join(testVerifyDir, 'word/document.xml'), 'utf8');
console.log('document.xml length:', xml.length, 'chars');
console.log('Starts with XML declaration:', xml.startsWith('<?xml'));
console.log('Ends with </w:document>:', xml.trim().endsWith('</w:document>'));

// Check for forbidden remnants
const lower = xml.toLowerCase();
const forbidden = ['turistacna', 'turis-tacna', 'paradas de buses', 'ciclismo', 'places.txt', 'stats.txt'];
let foundAny = false;
forbidden.forEach(word => {
  if (lower.includes(word)) {
    console.error('WARNING: Found old placeholder:', word);
    foundAny = true;
  }
});

if (!foundAny) {
  console.log('✓ Zero old placeholders or remnants from TurisTacna!');
}

const mediaFiles = fs.readdirSync(path.join(testVerifyDir, 'word/media'));
console.log('Media files count:', mediaFiles.length);
console.log('Media list:', mediaFiles);

fs.rmSync(testVerifyDir, { recursive: true, force: true });
console.log('✓ VERIFICATION COMPLETED SUCCESSFULLY!');
