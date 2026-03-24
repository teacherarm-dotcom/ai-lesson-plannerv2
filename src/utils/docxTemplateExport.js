import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';

/**
 * Load Template.docx from public folder, fill placeholders, and download.
 *
 * @param {object} data — all placeholder values
 * @param {string} filename — output filename (without .docx)
 */
export async function generateDocxFromTemplate(data, filename = 'แผนรายหน่วย') {
  // 1. Fetch the template
  const response = await fetch('/Template.docx');
  if (!response.ok) throw new Error('ไม่พบไฟล์ Template.docx');
  const arrayBuffer = await response.arrayBuffer();

  // 2. Load into PizZip + Docxtemplater
  const zip = new PizZip(arrayBuffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '{', end: '}' },
  });

  // 3. Set data (replace placeholders)
  doc.setData(data);

  // 4. Render
  try {
    doc.render();
  } catch (err) {
    console.error('Docx render error:', err);
    throw new Error('ไม่สามารถสร้างไฟล์ Word ได้: ' + (err.message || ''));
  }

  // 5. Generate output and download
  const out = doc.getZip().generate({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  saveAs(out, `${filename}.docx`);
}

/**
 * Build the full data object for Template.docx from all module results.
 *
 * @param {object} params
 * @param {object} params.formData — course form data
 * @param {object[]} params.loResults — learning outcomes per unit
 * @param {object[]} params.compResults — competencies per unit
 * @param {object[]} params.objResults — objectives per unit
 * @param {object[]} params.conceptResults — concepts per unit
 * @param {object[]} params.units — parsed unit table [{no, name, topics, theory, practice, total}]
 * @param {number} params.unitIndex — which unit to export (0-based), or -1 for all
 */
export function buildTemplateData({
  formData,
  loResults,
  compResults,
  objResults,
  conceptResults,
  units,
  unitIndex = 0,
}) {
  const fd = formData || {};
  const { theory, practice } = parseRatio(fd.ratio);

  // Course-level data (ส่วนที่ 1: หลักสูตรรายวิชา)
  const baseData = {
    vocationType: fd.vocationType || '',
    occupationGroup: fd.occupationGroup || '',
    department: fd.department || '',
    courseCode: fd.courseCode || '',
    courseName: fd.courseName || '',
    theoryHours: String(theory),
    practiceHours: String(practice),
    credits: fd.credits || '',
    standardRef: fd.standardRef || '-',
    learningOutcomes: fd.learningOutcomes || '',
    objectives: fd.objectives || '',
    competencies: fd.competencies || '',
    description: fd.description || '',
  };

  // Unit-level data (ส่วนที่ 4: แผนการจัดการเรียนรู้)
  const unit = units?.[unitIndex];
  const lo = loResults?.[unitIndex];
  const comp = compResults?.[unitIndex];
  const obj = objResults?.[unitIndex];
  const concept = conceptResults?.[unitIndex];

  const comps = Array.isArray(comp?.competencies) ? comp.competencies : [];

  // Objectives per domain
  const cognitive = Array.isArray(obj?.cognitive) ? obj.cognitive : [];
  const psychomotor = Array.isArray(obj?.psychomotor) ? obj.psychomotor : [];
  const affective = Array.isArray(obj?.affective) ? obj.affective : [];
  const application = Array.isArray(obj?.application) ? obj.application : [];

  // Build obj41-obj44 (combine each domain into one string)
  const obj41 = 'พุทธิพิสัย\n' + cognitive.join('\n');
  const obj42 = 'ทักษะพิสัย\n' + psychomotor.join('\n');
  const obj43 = 'จิตพิสัย\n' + affective.join('\n');
  const obj44 = 'ความสามารถประยุกต์ใช้และรับผิดชอบ\n' + application.join('\n');

  // Concept text
  const conceptText = concept?.concept || '';

  return {
    ...baseData,
    // Unit info
    unitNo: unit?.no || String(unitIndex + 1),
    unitName: unit?.name || lo?.unitName || `หน่วยที่ ${unitIndex + 1}`,
    unitTheory: unit?.theory || String(theory),
    unitPractice: unit?.practice || String(practice),
    unitTopics: unit?.topics?.replace(/<br\s*\/?>/gi, '\n') || '',
    // Section 1 - Learning outcome
    outcome: lo?.outcome || '',
    // Section 3 - Competencies (2 items)
    comp1: comps[0]?.replace(/^\d+\.\s*/, '') || '',
    comp2: comps[1]?.replace(/^\d+\.\s*/, '') || '',
    // Section 4 - Objectives (4 domains)
    obj41,
    obj42,
    obj43,
    obj44,
    // Section 5 - Content/Concepts
    concept: conceptText.replace(/<br\s*\/?>/gi, '\n'),
  };
}

/**
 * Export ALL units — generates one docx with all units' data merged.
 * Since docxtemplater can't loop the entire template, we generate per-unit
 * and the template is designed for single unit.
 * For multi-unit, we generate the first unit into the template,
 * but the real content comes from buildUnitPlanHtml (HTML export).
 */
export async function exportAllUnitsDocx({
  formData,
  loResults,
  compResults,
  objResults,
  conceptResults,
  units,
}) {
  // For now, export unit 1 as the template
  // Multi-unit requires a different approach (loop template)
  const data = buildTemplateData({
    formData, loResults, compResults, objResults, conceptResults, units,
    unitIndex: 0,
  });
  await generateDocxFromTemplate(data, `แผนรายหน่วย_${formData.courseCode || 'export'}_หน่วยที่1`);
}

/**
 * Generate Job Analysis docx from template-job.docx
 *
 * @param {object} params
 * @param {string} params.learningOutcomes — ผลลัพธ์การเรียนรู้ระดับรายวิชา
 * @param {string} params.generatedPlan — markdown table from AI
 * @param {string} params.courseCode — for filename
 */
export async function generateJobAnalysisDocx({ learningOutcomes, generatedPlan, courseCode }) {
  // 1. Parse the markdown analysis table into rows
  const jobs = parseAnalysisTableToJobs(generatedPlan);

  if (jobs.length === 0) {
    throw new Error('ไม่พบข้อมูลตารางวิเคราะห์งาน');
  }

  // 2. Fetch template
  const response = await fetch('/template-job.docx');
  if (!response.ok) throw new Error('ไม่พบไฟล์ template-job.docx');
  const arrayBuffer = await response.arrayBuffer();

  // 3. Load + render
  const zip = new PizZip(arrayBuffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '{', end: '}' },
  });

  doc.setData({
    learningOutcomes: learningOutcomes || '',
    jobs,
  });

  try {
    doc.render();
  } catch (err) {
    console.error('Job Analysis docx render error:', err);
    throw new Error('ไม่สามารถสร้างไฟล์ Word ได้: ' + (err.message || ''));
  }

  const out = doc.getZip().generate({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  saveAs(out, `ตารางวิเคราะห์งาน_${courseCode || 'export'}.docx`);
}

/**
 * Parse the AI-generated markdown table into array of job objects for template loop.
 * Each row becomes { duty, task, subComp, knowledge, skills }
 */
function parseAnalysisTableToJobs(markdown) {
  if (!markdown) return [];
  const clean = markdown.replace(/```markdown/g, '').replace(/```/g, '').trim();
  const lines = clean.split('\n').map(l => l.trim()).filter(Boolean);
  const sepIdx = lines.findIndex(l => l.startsWith('|') && l.includes('---'));
  if (sepIdx === -1) return [];

  const dataLines = lines.slice(sepIdx + 1).filter(l => l.startsWith('|'));

  return dataLines.map(line => {
    const cells = line.split('|').filter((c, i, arr) => i !== 0 && i !== arr.length - 1).map(c => c.trim());
    return {
      duty: cleanCellForDocx(cells[0] || ''),
      task: cleanCellForDocx(cells[1] || ''),
      subComp: cleanCellForDocx(cells[2] || ''),
      knowledge: cleanCellForDocx(cells[3] || ''),
      skills: cleanCellForDocx(cells[4] || ''),
    };
  });
}

/**
 * Clean markdown cell content for docx output — convert <br> to newlines, strip **bold** markers
 */
function cleanCellForDocx(text) {
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/\*\*/g, '')
    .trim();
}

/**
 * Generate Unit Table docx from template-unit.docx
 *
 * @param {object} params
 * @param {object} params.formData — course form data
 * @param {string} params.unitDivisionPlan — markdown table of units
 * @param {boolean} params.hasEvalRow — whether to include evaluation row
 */
export async function generateUnitTableDocx({ formData, unitDivisionPlan, hasEvalRow = true }) {
  const { parseUnitTable } = await import('./markdownTable');
  const parsedUnits = parseUnitTable(unitDivisionPlan);

  if (parsedUnits.length === 0) {
    throw new Error('ไม่พบข้อมูลตารางหน่วยการเรียนรู้');
  }

  const fd = formData || {};
  const { theory, practice } = parseRatio(fd.ratio);

  // Build units array for loop
  const units = parsedUnits.map(u => ({
    no: u.no || '',
    name: u.name || '',
    theory: u.theory || '0',
    practice: u.practice || '0',
    total: u.total || '0',
  }));

  // Calculate totals
  let sumTheory = 0;
  let sumPractice = 0;
  let sumTotal = 0;
  units.forEach(u => {
    sumTheory += parseInt(u.theory) || 0;
    sumPractice += parseInt(u.practice) || 0;
    sumTotal += parseInt(u.total) || 0;
  });

  // Evaluation row (1 week)
  const evalTheory = hasEvalRow ? String(theory) : '0';
  const evalPractice = hasEvalRow ? String(practice) : '0';
  const evalTotal = hasEvalRow ? String(theory + practice) : '0';

  const evalT = hasEvalRow ? (parseInt(evalTheory) || 0) : 0;
  const evalP = hasEvalRow ? (parseInt(evalPractice) || 0) : 0;

  // Fetch template
  const response = await fetch('/template-unit.docx');
  if (!response.ok) throw new Error('ไม่พบไฟล์ template-unit.docx');
  const arrayBuffer = await response.arrayBuffer();

  const zip = new PizZip(arrayBuffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '{', end: '}' },
  });

  doc.setData({
    courseCode: fd.courseCode || '',
    courseName: fd.courseName || '',
    theoryHours: String(theory),
    practiceHours: String(practice),
    credits: fd.credits || '',
    units,
    evalTheory,
    evalPractice,
    evalTotal,
    totalTheory: String(sumTheory + evalT),
    totalPractice: String(sumPractice + evalP),
    totalAll: String(sumTotal + evalT + evalP),
  });

  try {
    doc.render();
  } catch (err) {
    console.error('Unit table docx render error:', err);
    throw new Error('ไม่สามารถสร้างไฟล์ Word ได้: ' + (err.message || ''));
  }

  const out = doc.getZip().generate({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  saveAs(out, `ตารางหน่วยการเรียนรู้_${fd.courseCode || 'export'}.docx`);
}

// --- Helper ---
function parseRatio(ratio) {
  const match = ratio?.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (match) return { theory: parseInt(match[1]), practice: parseInt(match[2]) };
  return { theory: 0, practice: 0 };
}
