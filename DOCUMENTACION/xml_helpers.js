// XML Helpers for generating OpenXML document.xml elements compliant with APA 7

function escapeXml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function p(text, opts = {}) {
  const align = opts.align ? `<w:jc w:val="${opts.align}"/>` : '<w:jc w:val="both"/>';
  const bold = opts.bold ? '<w:b/>' : '';
  const italic = opts.italic ? '<w:i/>' : '';
  const color = opts.color ? `<w:color w:val="${opts.color}"/>` : '<w:color w:val="1E293B"/>';
  const size = opts.size ? `<w:sz w:val="${opts.size}"/>` : '<w:sz w:val="22"/>'; // 11pt
  const font = opts.font || 'Calibri';
  const after = opts.after !== undefined ? opts.after : 120;
  const line = opts.line || 260; // 1.15x line spacing for APA
  const indent = opts.indent ? `<w:ind w:firstLine="${opts.indent}"/>` : '';

  return `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Normal"/>
        <w:spacing w:after="${after}" w:line="${line}" w:lineRule="auto"/>
        ${align}
        ${indent}
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
          ${bold}
          ${italic}
          ${color}
          ${size}
        </w:rPr>
        <w:t xml:space="preserve">${escapeXml(text)}</w:t>
      </w:r>
    </w:p>
  `;
}

function pageBreak() {
  return `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;
}

// APA 7 Level 1: Centered, Bold, Title Case
function h1(text) {
  return `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading1"/>
        <w:jc w:val="center"/>
        <w:spacing w:before="320" w:after="160"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
          <w:b/>
          <w:color w:val="1E3A8A"/>
          <w:sz w:val="28"/>
        </w:rPr>
        <w:t xml:space="preserve">${escapeXml(text)}</w:t>
      </w:r>
    </w:p>
  `;
}

// APA 7 Level 2: Flush Left, Bold, Title Case
function h2(text) {
  return `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading2"/>
        <w:jc w:val="left"/>
        <w:spacing w:before="240" w:after="120"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
          <w:b/>
          <w:color w:val="0F766E"/>
          <w:sz w:val="24"/>
        </w:rPr>
        <w:t xml:space="preserve">${escapeXml(text)}</w:t>
      </w:r>
    </w:p>
  `;
}

// APA 7 Level 3: Flush Left, Bold Italic, Title Case
function h3(text) {
  return `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading3"/>
        <w:jc w:val="left"/>
        <w:spacing w:before="200" w:after="100"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
          <w:b/>
          <w:i/>
          <w:color w:val="334155"/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t xml:space="preserve">${escapeXml(text)}</w:t>
      </w:r>
    </w:p>
  `;
}

// APA 7 Level 4: Indented, Bold, Title Case
function h4(text) {
  return `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading4"/>
        <w:jc w:val="left"/>
        <w:spacing w:before="160" w:after="80"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
          <w:b/>
          <w:color w:val="475569"/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t xml:space="preserve">${escapeXml(text)}</w:t>
      </w:r>
    </w:p>
  `;
}

// APA 7 Table Formatter (Strict: No vertical borders, top & bottom horizontal rules, note below)
function apaTable(num, title, headers, rows, colWidths = [], note = '') {
  const totalW = colWidths.reduce((a, b) => a + b, 0) || 8500;
  
  let gridCols = '';
  colWidths.forEach(w => {
    gridCols += `<w:gridCol w:w="${w}"/>`;
  });

  // Table Label (APA 7: Bold, flush left)
  const labelP = `
    <w:p>
      <w:pPr>
        <w:spacing w:before="220" w:after="40"/>
        <w:jc w:val="left"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
          <w:b/>
          <w:color w:val="1E293B"/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t xml:space="preserve">Tabla ${escapeXml(num)}</w:t>
      </w:r>
    </w:p>
  `;

  // Table Title (APA 7: Italics, flush left)
  const titleP = `
    <w:p>
      <w:pPr>
        <w:spacing w:after="100"/>
        <w:jc w:val="left"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
          <w:i/>
          <w:color w:val="1E3A8A"/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t xml:space="preserve">${escapeXml(title)}</w:t>
      </w:r>
    </w:p>
  `;

  // Header cells with dark/accent top line and border
  let headerCells = '';
  headers.forEach((h, i) => {
    const w = colWidths[i] || Math.floor(totalW / headers.length);
    headerCells += `
      <w:tc>
        <w:tcPr>
          <w:tcW w:w="${w}" w:type="dxa"/>
          <w:shd w:val="clear" w:color="auto" w:fill="F1F5F9"/>
          <w:tcBorders>
            <w:top w:val="single" w:sz="10" w:space="0" w:color="1E3A8A"/>
            <w:bottom w:val="single" w:sz="8" w:space="0" w:color="1E3A8A"/>
            <w:left w:val="none"/>
            <w:right w:val="none"/>
          </w:tcBorders>
          <w:tcMar>
            <w:top w:w="120" w:type="dxa"/>
            <w:bottom w:w="120" w:type="dxa"/>
            <w:left w:w="140" w:type="dxa"/>
            <w:right w:w="140" w:type="dxa"/>
          </w:tcMar>
        </w:tcPr>
        <w:p>
          <w:pPr>
            <w:jc w:val="center"/>
            <w:spacing w:after="0" w:line="240" w:lineRule="auto"/>
          </w:pPr>
          <w:r>
            <w:rPr>
              <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
              <w:b/>
              <w:color w:val="1E3A8A"/>
              <w:sz w:val="20"/>
            </w:rPr>
            <w:t xml:space="preserve">${escapeXml(h)}</w:t>
          </w:r>
        </w:p>
      </w:tc>
    `;
  });

  // Body rows with subtle dividers and solid bottom rule on last row
  let bodyRows = '';
  const totalRows = rows.length;
  rows.forEach((row, rIdx) => {
    let cells = '';
    const isLast = rIdx === totalRows - 1;
    const bottomBorder = isLast
      ? '<w:bottom w:val="single" w:sz="10" w:space="0" w:color="1E3A8A"/>'
      : '<w:bottom w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>';

    row.forEach((cellText, cIdx) => {
      const w = colWidths[cIdx] || Math.floor(totalW / headers.length);
      cells += `
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="${w}" w:type="dxa"/>
            <w:tcBorders>
              <w:top w:val="none"/>
              ${bottomBorder}
              <w:left w:val="none"/>
              <w:right w:val="none"/>
            </w:tcBorders>
            <w:tcMar>
              <w:top w:w="100" w:type="dxa"/>
              <w:bottom w:w="100" w:type="dxa"/>
              <w:left w:w="120" w:type="dxa"/>
              <w:right w:w="120" w:type="dxa"/>
            </w:tcMar>
          </w:tcPr>
          <w:p>
            <w:pPr>
              <w:jc w:val="both"/>
              <w:spacing w:after="0" w:line="240" w:lineRule="auto"/>
            </w:pPr>
            <w:r>
              <w:rPr>
                <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                <w:color w:val="1E293B"/>
                <w:sz w:val="20"/>
              </w:rPr>
              <w:t xml:space="preserve">${escapeXml(cellText)}</w:t>
            </w:r>
          </w:p>
        </w:tc>
      `;
    });

    bodyRows += `
      <w:tr>
        <w:trPr><w:cantSplit/></w:trPr>
        ${cells}
      </w:tr>
    `;
  });

  const tableXml = `
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="${totalW}" w:type="dxa"/>
        <w:jc w:val="center"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="10" w:space="0" w:color="1E3A8A"/>
          <w:bottom w:val="single" w:sz="10" w:space="0" w:color="1E3A8A"/>
          <w:left w:val="none"/>
          <w:right w:val="none"/>
          <w:insideH w:val="none"/>
          <w:insideV w:val="none"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tblGrid>
        ${gridCols}
      </w:tblGrid>
      <w:tr>
        <w:trPr><w:tblHeader/><w:cantSplit/></w:trPr>
        ${headerCells}
      </w:tr>
      ${bodyRows}
    </w:tbl>
  `;

  // Note below table (APA 7: Italics 'Nota.', regular text)
  const noteP = note ? `
    <w:p>
      <w:pPr>
        <w:spacing w:before="60" w:after="180"/>
        <w:jc w:val="both"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
          <w:i/>
          <w:color w:val="475569"/>
          <w:sz w:val="19"/>
        </w:rPr>
        <w:t xml:space="preserve">Nota. </w:t>
      </w:r>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
          <w:color w:val="475569"/>
          <w:sz w:val="19"/>
        </w:rPr>
        <w:t xml:space="preserve">${escapeXml(note)}</w:t>
      </w:r>
    </w:p>
  ` : '<w:p><w:pPr><w:spacing w:after="160"/></w:pPr></w:p>';

  return `${labelP}${titleP}${tableXml}${noteP}`;
}

// APA 7 Figure Formatter (Label bold above, Title italic above, Image centered, Note below)
function apaFigure(num, title, rId, note, cx = 5400000, cy = 3400000, docId = 100) {
  const labelP = `
    <w:p>
      <w:pPr>
        <w:spacing w:before="220" w:after="40"/>
        <w:jc w:val="left"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
          <w:b/>
          <w:color w:val="1E293B"/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t xml:space="preserve">Figura ${escapeXml(num)}</w:t>
      </w:r>
    </w:p>
  `;

  const titleP = `
    <w:p>
      <w:pPr>
        <w:spacing w:after="120"/>
        <w:jc w:val="left"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
          <w:i/>
          <w:color w:val="1E3A8A"/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t xml:space="preserve">${escapeXml(title)}</w:t>
      </w:r>
    </w:p>
  `;

  const imageP = `
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:before="60" w:after="60"/>
      </w:pPr>
      <w:r>
        <w:drawing>
          <wp:inline distB="0" distT="0" distL="0" distR="0">
            <wp:extent cx="${cx}" cy="${cy}"/>
            <wp:docPr id="${docId}" name="${escapeXml(title)}"/>
            <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
              <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                  <pic:nvPicPr>
                    <pic:cNvPr id="0" name="${escapeXml(title)}"/>
                    <pic:cNvPicPr preferRelativeResize="0"/>
                  </pic:nvPicPr>
                  <pic:blipFill>
                    <a:blip r:embed="${rId}"/>
                    <a:stretch><a:fillRect/></a:stretch>
                  </pic:blipFill>
                  <pic:spPr>
                    <a:xfrm>
                      <a:off x="0" y="0"/>
                      <a:ext cx="${cx}" cy="${cy}"/>
                    </a:xfrm>
                    <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                  </pic:spPr>
                </pic:pic>
              </a:graphicData>
            </a:graphic>
          </wp:inline>
        </w:drawing>
      </w:r>
    </w:p>
  `;

  const noteP = `
    <w:p>
      <w:pPr>
        <w:spacing w:before="60" w:after="200"/>
        <w:jc w:val="both"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
          <w:i/>
          <w:color w:val="475569"/>
          <w:sz w:val="19"/>
        </w:rPr>
        <w:t xml:space="preserve">Nota. </w:t>
      </w:r>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
          <w:color w:val="475569"/>
          <w:sz w:val="19"/>
        </w:rPr>
        <w:t xml:space="preserve">${escapeXml(note)} Elaboración propia (2026).</w:t>
      </w:r>
    </w:p>
  `;

  return `${labelP}${titleP}${imageP}${noteP}`;
}

// APA 7 Reference Entry with Hanging Indent
function apaReference(authorYear, titleItalic, sourceUrl) {
  return `
    <w:p>
      <w:pPr>
        <w:ind w:left="720" w:hanging="720"/>
        <w:spacing w:after="120" w:line="260" w:lineRule="auto"/>
        <w:jc w:val="both"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
          <w:sz w:val="22"/>
          <w:color w:val="1E293B"/>
        </w:rPr>
        <w:t xml:space="preserve">${escapeXml(authorYear)} </w:t>
      </w:r>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
          <w:i/>
          <w:sz w:val="22"/>
          <w:color w:val="1E3A8A"/>
        </w:rPr>
        <w:t xml:space="preserve">${escapeXml(titleItalic)}</w:t>
      </w:r>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
          <w:sz w:val="22"/>
          <w:color w:val="1E293B"/>
        </w:rPr>
        <w:t xml:space="preserve">. ${escapeXml(sourceUrl)}</w:t>
      </w:r>
    </w:p>
  `;
}

module.exports = {
  p,
  h1,
  h2,
  h3,
  h4,
  apaTable,
  apaFigure,
  apaReference,
  pageBreak,
  escapeXml
};
