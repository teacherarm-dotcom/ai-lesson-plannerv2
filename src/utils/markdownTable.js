/**
 * Utilities for parsing / converting Markdown tables.
 */

const cleanMarkdown = (md) =>
  md.replace(/```markdown/g, '').replace(/```/g, '').trim();

/**
 * Clean AI response that may contain multiple tables merged together.
 * Keeps only the FIRST header + separator, then ALL data rows from all tables.
 * Also removes any non-table text (e.g. "ตรวจสอบรายละเอียด").
 */
const mergeMultipleTables = (markdown) => {
  const clean = cleanMarkdown(markdown);
  const lines = clean.split('\n').map((l) => l.trim()).filter(Boolean);

  let headerLine = null;
  let sepLine = null;
  const dataRows = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Check if this is a separator line (---|---|---)
    if (line.startsWith('|') && /^[\s|:-]+$/.test(line.replace(/---+/g, ''))) {
      // This is a separator — if we don't have one yet, capture it and the header above
      if (!sepLine) {
        sepLine = line;
        if (i > 0 && lines[i - 1].startsWith('|')) {
          headerLine = lines[i - 1];
        }
      }
      // Skip duplicate separators
      continue;
    }
    // Data row — must start with | and NOT be a header we already captured
    if (line.startsWith('|')) {
      // Skip if this is a duplicate header (same as headerLine)
      if (headerLine && line === headerLine) continue;
      // Skip lines that look like headers (contain words like "Job No.", "ลำดับงาน", etc.)
      if (!sepLine) continue; // no separator yet = header area, skip
      dataRows.push(line);
    }
    // Non-table text — skip entirely
  }

  if (!headerLine || !sepLine) return clean;

  return [headerLine, sepLine, ...dataRows].join('\n');
};

/**
 * Convert a Markdown table string into an HTML <table> string (for Word / PDF export).
 */
export const convertMarkdownTableToHTML = (markdown) => {
  const merged = mergeMultipleTables(markdown);
  const lines = merged.split('\n').map((l) => l.trim()).filter(Boolean);

  const sepIdx = lines.findIndex((l) => l.startsWith('|') && l.includes('---'));
  if (sepIdx === -1) return `<p>${markdown}</p>`;

  const headers = lines[sepIdx - 1]
    .split('|')
    .filter((c) => c.trim() !== '')
    .map((c) => c.trim());

  const bodyLines = lines.slice(sepIdx + 1).filter((l) => l.startsWith('|'));

  let html = '<table border="1" style="border-collapse: collapse; width: 100%;">';
  html += '<thead style="background-color: #f2f2f2;"><tr>';
  headers.forEach(
    (h) =>
      (html += `<th style="padding: 8px; text-align: left; border: 1px solid #ddd;">${h}</th>`)
  );
  html += '</tr></thead><tbody>';

  bodyLines.forEach((line) => {
    const cells = line
      .split('|')
      .filter((_, i, arr) => i !== 0 && i !== arr.length - 1)
      .map((c) => (c ? c.trim() : ''));
    html += '<tr>';
    cells.forEach((cell) => {
      const formatted = cell
        .replace(/<br>/g, '<br/>')
        .replace(/\n/g, '<br/>')
        .replace(/\\n/g, '<br/>');
      html += `<td style="padding: 8px; border: 1px solid #ddd; vertical-align: top;">${formatted}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table>';
  return html;
};

/**
 * Parse a Markdown table of learning units into structured row objects.
 */
export const parseUnitTable = (markdown) => {
  if (!markdown) return [];
  const merged = mergeMultipleTables(markdown);
  const lines = merged.split('\n').map((l) => l.trim()).filter(Boolean);
  const sepIdx = lines.findIndex((l) => l.startsWith('|') && l.includes('---'));
  if (sepIdx === -1) return [];

  return lines
    .slice(sepIdx + 1)
    .filter((l) => l.startsWith('|'))
    .map((line) => {
      const cells = line
        .split('|')
        .filter((_, i, arr) => i !== 0 && i !== arr.length - 1)
        .map((c) => (c ? c.trim() : ''));
      return {
        no: cells[0] || '',
        name: cells[1] || '',
        topics: cells[2] || '',
        theory: cells[3] || '',
        practice: cells[4] || '',
        total: cells[5] || '',
      };
    });
};

/**
 * Build HTML rows + totals from parsed unit data (for export).
 */
export const convertUnitTableToHTML = (unitData) => {
  let totalTheory = 0;
  let totalPractice = 0;
  let totalAll = 0;
  let rowsHtml = '';

  unitData.forEach((unit) => {
    const theory = parseInt(unit.theory) || 0;
    const practice = parseInt(unit.practice) || 0;
    const total = parseInt(unit.total) || 0;
    totalTheory += theory;
    totalPractice += practice;
    totalAll += total;

    const formattedTopics = unit.topics
      ? `<br/><span style="font-size:0.9em; color:#444;">${unit.topics
          .replace(/- /g, '• ')
          .replace(/<br>/g, '<br/>')}</span>`
      : '';

    rowsHtml += `<tr>
      <td style="text-align: center; vertical-align: top;">${unit.no}</td>
      <td style="vertical-align: top;"><b>${unit.name}</b>${formattedTopics}</td>
      <td style="text-align: center; vertical-align: top;">${theory}</td>
      <td style="text-align: center; vertical-align: top;">${practice}</td>
      <td style="text-align: center; vertical-align: top;">${total}</td>
    </tr>`;
  });

  return { rowsHtml, totalTheory, totalPractice, totalAll };
};
