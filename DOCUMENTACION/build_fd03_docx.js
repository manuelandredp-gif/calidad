// ==============================================================================
// BUILDER FINAL DEL DOCUMENTO FD03 — SRS TESTGENAI (APA 7)
// ==============================================================================

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { generateBodyXml } = require('./generate_fd03_content');

const baseDir = 'C:/Users/LENOVO/Desktop/CALIDAD/DOCUMENTACION';
const workDir = path.join(baseDir, 'temp_build');
const templateDocx = path.join(baseDir, 'FD03-EPIS-Informe SRS de Proyecto-FORMATO.docx');
const diagDir = path.join(baseDir, 'diagrams');
const outputDocx = path.join(baseDir, 'FD03-EPIS-Informe_Especificacion_Requerimientos_FINAL.docx');
const tempZip = path.join(baseDir, 'temp_output.zip');
const templateZip = path.join(baseDir, 'temp_template_extract.zip');

console.log('1. Extrayendo archivos base de la plantilla original...');
if (fs.existsSync(workDir)) {
  fs.rmSync(workDir, { recursive: true, force: true });
}

fs.copyFileSync(templateDocx, templateZip);
execSync(`powershell -Command "Expand-Archive -Path '${templateZip}' -DestinationPath '${workDir}' -Force"`, { stdio: 'inherit' });
fs.unlinkSync(templateZip);

console.log('2. Copiando diagramas de alta resolución a word/media/...');
const mediaDir = path.join(workDir, 'word/media');
if (!fs.existsSync(mediaDir)) {
  fs.mkdirSync(mediaDir, { recursive: true });
}

const diagramFiles = [
  'diag_01_organigrama.png',
  'diag_02_proceso_actual.png',
  'diag_03_proceso_propuesto.png',
  'diag_04_paquetes.png',
  'diag_05_casos_uso_general.png',
  'diag_06_cu_requisitos_ia.png',
  'diag_07_cu_auditoria_casos.png',
  'diag_07b_cu_trazabilidad_metricas.png',
  'diag_07c_cu_administracion.png',
  'diag_08_actividades_objetos.png',
  'diag_09_secuencia_ia.png',
  'diag_10_secuencia_auditoria.png',
  'diag_11_clases_dominio.png'
];

diagramFiles.forEach(file => {
  const src = path.join(diagDir, file);
  const dst = path.join(mediaDir, file);
  fs.copyFileSync(src, dst);
});

console.log('3. Configurando word/_rels/document.xml.rels...');
const relsContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" Target="fontTable.xml"/>
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
  <Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId20" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>
  <Relationship Id="rId21" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>
  <Relationship Id="rIdLogo" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image2.png"/>
  <Relationship Id="rIdDiag01" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/diag_01_organigrama.png"/>
  <Relationship Id="rIdDiag02" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/diag_02_proceso_actual.png"/>
  <Relationship Id="rIdDiag03" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/diag_03_proceso_propuesto.png"/>
  <Relationship Id="rIdDiag04" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/diag_04_paquetes.png"/>
  <Relationship Id="rIdDiag05" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/diag_05_casos_uso_general.png"/>
  <Relationship Id="rIdDiag06" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/diag_06_cu_requisitos_ia.png"/>
  <Relationship Id="rIdDiag07" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/diag_07_cu_auditoria_casos.png"/>
  <Relationship Id="rIdDiag07b" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/diag_07b_cu_trazabilidad_metricas.png"/>
  <Relationship Id="rIdDiag07c" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/diag_07c_cu_administracion.png"/>
  <Relationship Id="rIdDiag08" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/diag_08_actividades_objetos.png"/>
  <Relationship Id="rIdDiag09" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/diag_09_secuencia_ia.png"/>
  <Relationship Id="rIdDiag10" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/diag_10_secuencia_auditoria.png"/>
  <Relationship Id="rIdDiag11" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/diag_11_clases_dominio.png"/>
</Relationships>`;

fs.writeFileSync(path.join(workDir, 'word/_rels/document.xml.rels'), relsContent);

console.log('4. Generando contenido definitivo de word/document.xml con especificación APA 7...');
const docXml = generateBodyXml();
fs.writeFileSync(path.join(workDir, 'word/document.xml'), docXml, 'utf8');

console.log('5. Empaquetando archivo DOCX final mediante Compress-Archive...');
if (fs.existsSync(tempZip)) fs.unlinkSync(tempZip);
if (fs.existsSync(outputDocx)) fs.unlinkSync(outputDocx);

const psCmd = `powershell -Command "Compress-Archive -Path '${workDir.replace(/\//g, '\\')}\\*' -DestinationPath '${tempZip.replace(/\//g, '\\')}' -Force"`;
execSync(psCmd, { stdio: 'inherit' });

fs.renameSync(tempZip, outputDocx);

console.log('6. Limpiando directorio temporal de trabajo...');
fs.rmSync(workDir, { recursive: true, force: true });

console.log('✓ DOCUMENTO APA 7 GENERADO CON ÉXITO:');
console.log(outputDocx);
console.log('Tamaño:', (fs.statSync(outputDocx).size / 1024).toFixed(2), 'KB');
