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

// --- Helper ---
function parseRatio(ratio) {
  const match = ratio?.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (match) return { theory: parseInt(match[1]), practice: parseInt(match[2]) };
  return { theory: 0, practice: 0 };
}
