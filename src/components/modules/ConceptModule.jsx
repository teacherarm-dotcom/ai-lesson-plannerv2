import React, { useState } from 'react';
import { Lightbulb, CheckCircle, Sparkles, Loader2, Check, ChevronLeft, ChevronRight, FileStack, FileDown } from 'lucide-react';
import FileUploadZone from '../common/FileUploadZone';
import ExportButtons from '../common/ExportButtons';
import { useFileUpload, buildFileParts } from '../../hooks/useFileUpload';
import { useAiApi } from '../../hooks/useAiApi';
import { SYSTEM_PROMPT_CONCEPT } from '../../constants/prompts';
import { printToPdf, createWordDoc } from '../../utils/exportHelpers';

const STEPS = ['หลักสูตรรายวิชา', 'ผลการวิเคราะห์งาน', 'หน่วยการเรียนรู้', 'ผลลัพธ์การเรียนรู้', 'สมรรถนะประจำหน่วย', 'จุดประสงค์เชิงพฤติกรรม'];
const FILE_KEYS = ['syllabus', 'analysis', 'units', 'outcomes', 'competencies', 'objectives'];

const ConceptModule = ({
  providerId, apiKey,
  formData, generatedPlan, unitDivisionPlan, loResults, compResults, objResults,
  conceptResults, setConceptResults,
  onError, triggerDownload,
}) => {
  const dl = triggerDownload;
  const hasInternal = !!(formData.courseCode && generatedPlan && unitDivisionPlan && loResults && compResults && objResults);
  const [conceptStep, setConceptStep] = useState(1);
  const { callApi, loading } = useAiApi(providerId, apiKey);

  // 6 file upload hooks for manual mode
  const fileHooks = FILE_KEYS.map(() => useFileUpload({ onError }));

  const getExistingData = (s) => {
    const checks = [formData.courseCode, generatedPlan, unitDivisionPlan, loResults, compResults, objResults];
    return checks[s - 1] ? 'มีข้อมูลในระบบแล้ว' : null;
  };

  const generate = async () => {
    try {
      let parts = [{ text: SYSTEM_PROMPT_CONCEPT }];
      if (hasInternal && !fileHooks[0].file) {
        parts.push({ text: `\n\n--- 1. Course Syllabus ---\n${JSON.stringify(formData)}` });
        parts.push({ text: `\n\n--- 2. Job Analysis ---\n${generatedPlan}` });
        parts.push({ text: `\n\n--- 3. Learning Units ---\n${unitDivisionPlan}` });
        parts.push({ text: `\n\n--- 4. Outcomes ---\n${JSON.stringify(loResults)}` });
        parts.push({ text: `\n\n--- 5. Competencies ---\n${JSON.stringify(compResults)}` });
        parts.push({ text: `\n\n--- 6. Objectives ---\n${JSON.stringify(objResults)}` });
      } else {
        STEPS.forEach((label, i) => {
          parts.push(...buildFileParts(fileHooks[i].file, `${i + 1}. ${label}`));
        });
      }
      const data = await callApi(parts, { json: true, statusText: 'กำลังวิเคราะห์และสรุปเนื้อหาสาระประจำหน่วย...' });
      if (data?.units) setConceptResults(data.units);
      else throw new Error('Invalid');
    } catch (err) {
      console.error('Concept Error:', err);
      onError(`เกิดข้อผิดพลาด: ${err.message || 'ไม่สามารถสร้างเนื้อหาสาระได้'}`);
    }
  };

  const _doExportWord = () => {
    if (!conceptResults) return;
    const rows = conceptResults.map((item, idx) => `<tr><td style="text-align:center;vertical-align:top;">${idx + 1}</td><td style="vertical-align:top;">${item.unitName}</td><td style="vertical-align:top;">${item.concept}</td></tr>`).join('');
    createWordDoc(`เนื้อหาสาระ_${formData.courseCode}`, `<table><thead><tr><th width="10%">ที่</th><th width="30%">หน่วยการเรียนรู้</th><th>เนื้อหาสาระ (Key Concept)</th></tr></thead><tbody>${rows}</tbody></table>`);
  };
  const _metaConcept = { module: 'เนื้อหาสาระ', courseCode: formData.courseCode || '', courseName: formData.courseName || '' };
  const _metaSummary = { module: 'สรุปรายวิชา', courseCode: formData.courseCode || '', courseName: formData.courseName || '' };
  const exportWord = () => dl(_doExportWord, _metaConcept);

  const _doExportPdf = () => {
    if (!conceptResults) return;
    const rows = conceptResults.map((item, idx) => `<tr><td class="text-center">${idx + 1}</td><td>${item.unitName}</td><td>${item.concept}</td></tr>`).join('');
    printToPdf(`เนื้อหาสาระ ${formData.courseCode}`, `<table><thead><tr><th width="10%">ที่</th><th width="30%">หน่วยการเรียนรู้</th><th>เนื้อหาสาระ (Key Concept)</th></tr></thead><tbody>${rows}</tbody></table>`);
  };
  const exportPdf = () => dl(_doExportPdf, _metaConcept);

  // --- Full Syllabus Export ---
  const mergeDataForExport = () => {
    // Use conceptResults as primary source (always available at this point)
    const source = conceptResults || loResults || [];
    if (source.length === 0) return [];
    return source.map((item, index) => ({
      unitName: item.unitName || loResults?.[index]?.unitName || `หน่วยที่ ${index + 1}`,
      outcome: loResults?.[index]?.outcome || '-',
      competencies: compResults?.[index]?.competencies || [],
      objectives: objResults?.[index] || { cognitive: [], psychomotor: [], affective: [], application: [] },
      concept: conceptResults?.[index]?.concept || item.concept || '-',
    }));
  };

  const _doExportSummaryWord = () => {
    const allUnits = mergeDataForExport();
    if (allUnits.length === 0) return;
    const renderList = (list) => (!list?.length ? '<li>-</li>' : list.map((i) => `<li>${i}</li>`).join(''));
    const content = allUnits.map((unit, idx) => `
      <div><h3>หน่วยที่ ${idx + 1} ${unit.unitName}</h3>
      <h4>1. ผลลัพธ์การเรียนรู้ระดับหน่วยการเรียน</h4><p style="margin-left:20px;">${unit.outcome || '-'}</p>
      <h4>2. สมรรถนะประจำหน่วย</h4><ul style="margin-left:20px;">${renderList(unit.competencies)}</ul>
      <h4>3. จุดประสงค์เชิงพฤติกรรม</h4>
      <div style="margin-left:20px;">
        <b>3.1 พุทธิพิสัย</b><ul>${renderList(unit.objectives?.cognitive)}</ul>
        <b>3.2 ทักษะพิสัย</b><ul>${renderList(unit.objectives?.psychomotor)}</ul>
        <b>3.3 จิตพิสัย</b><ul>${renderList(unit.objectives?.affective)}</ul>
        <b>3.4 การประยุกต์ใช้ฯ</b><ul>${renderList(unit.objectives?.application)}</ul>
      </div>
      <h4>4. สาระการเรียนรู้</h4><ul style="margin-left:20px;">${(unit.concept || '-').split(/\n|<br\s*\/?>/).filter(l => l.trim()).map(l => `<li>${l.replace(/^\d+\.\s*/, '').replace(/^[-•]\s*/, '').trim()}</li>`).join('')}</ul><hr/></div>
    `).join('');
    createWordDoc(`Full_Syllabus_${formData.courseCode}`, `<h2 style="text-align:center;">เอกสารสรุปรายวิชา ${formData.courseCode} ${formData.courseName}</h2><hr/>${content}`);
  };

  const exportSummaryWord = () => dl(_doExportSummaryWord, _metaSummary);

  const _doExportSummaryPdf = () => {
    const allUnits = mergeDataForExport();
    if (allUnits.length === 0) return;
    const renderList = (list) => (!list?.length ? '<li>-</li>' : list.map((i) => `<li>${i}</li>`).join(''));
    const content = allUnits.map((unit, idx) => `
      <div style="margin-bottom:30px;border-bottom:1px solid #ccc;padding-bottom:20px;">
      <h3>หน่วยที่ ${idx + 1} ${unit.unitName}</h3>
      <p><b>1. ผลลัพธ์การเรียนรู้</b><br/>${unit.outcome || '-'}</p>
      <p><b>2. สมรรถนะประจำหน่วย</b></p><ul>${renderList(unit.competencies)}</ul>
      <p><b>3. จุดประสงค์เชิงพฤติกรรม</b></p>
      <div style="padding-left:20px;">
        <p><b>3.1 พุทธิพิสัย:</b></p><ul>${renderList(unit.objectives?.cognitive)}</ul>
        <p><b>3.2 ทักษะพิสัย:</b></p><ul>${renderList(unit.objectives?.psychomotor)}</ul>
        <p><b>3.3 จิตพิสัย:</b></p><ul>${renderList(unit.objectives?.affective)}</ul>
        <p><b>3.4 การประยุกต์ใช้ฯ:</b></p><ul>${renderList(unit.objectives?.application)}</ul>
      </div>
      <p><b>4. สาระการเรียนรู้</b></p><ul>${(unit.concept || '-').split(/\n|<br\s*\/?>/).filter(l => l.trim()).map(l => `<li>${l.replace(/^\d+\.\s*/, '').replace(/^[-•]\s*/, '').trim()}</li>`).join('')}</ul></div>
    `).join('');
    printToPdf(`เอกสารสรุปรายวิชา: ${formData.courseName}`, content);
  };
  const exportSummaryPdf = () => dl(_doExportSummaryPdf, _metaSummary);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 min-h-[80vh]">
      <div className="mb-6 border-b border-gray-100 pb-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Lightbulb className="text-blue-600" /> เนื้อหาสาระ (Key Concepts)</h2>
        <p className="text-gray-500 text-sm mt-1">สรุปเนื้อหาสาระของแต่ละหน่วยจากข้อมูลที่วิเคราะห์มาทั้งหมด</p>
      </div>

      {!conceptResults ? (
        <div className="max-w-2xl mx-auto">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between text-xs font-medium text-gray-500 mb-2"><span>Start</span><span>Step {conceptStep} of 6</span><span>Finish</span></div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${(conceptStep / 6) * 100}%` }} />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center text-sm">{conceptStep}</span>
              {STEPS[conceptStep - 1]}
            </h3>
            {getExistingData(conceptStep) && (
              <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg flex items-center gap-2 mb-4 text-sm">
                <CheckCircle size={18} /> {getExistingData(conceptStep)} (กดถัดไปได้เลย หรือจะแนบไฟล์ใหม่ก็ได้)
              </div>
            )}
            <FileUploadZone file={fileHooks[conceptStep - 1].file} onUpload={fileHooks[conceptStep - 1].handleUpload} label="คลิกเพื่อแนบไฟล์เอกสาร" height="h-48" />
          </div>

          <div className="flex justify-between mt-6">
            <button onClick={() => setConceptStep((p) => Math.max(1, p - 1))} disabled={conceptStep === 1} className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 flex items-center gap-1"><ChevronLeft size={18} /> ย้อนกลับ</button>
            {conceptStep < 6 ? (
              <button onClick={() => setConceptStep((p) => p + 1)} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 shadow-md">ถัดไป <ChevronRight size={18} /></button>
            ) : (
              <button onClick={generate} disabled={loading} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-md">
                {loading ? <Loader2 className="animate-spin" /> : <Sparkles />} วิเคราะห์และสร้างเนื้อหาสาระ
              </button>
            )}
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200 mb-4">
            <div className="flex items-center gap-2 text-green-800 text-sm"><Check size={16} /> สร้างเนื้อหาสาระสำเร็จ!</div>
            <ExportButtons onRegenerate={generate} onExportWord={exportWord} onExportPdf={exportPdf} />
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-sm font-bold text-gray-700 w-1/4">ชื่อหน่วย</th><th className="px-4 py-3 text-left text-sm font-bold text-gray-700">เนื้อหาสาระ (Key Concept)</th></tr></thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {conceptResults.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900 align-top">{item.unitName}</td>
                    <td className="px-4 py-4 text-sm text-gray-600 align-top leading-relaxed">
                      {typeof item.concept === 'string' ? (
                        <ul className="list-disc pl-4 space-y-1">
                          {item.concept.split(/\n|<br\s*\/?>/).filter(l => l.trim()).map((line, i) => (
                            <li key={i}>{line.replace(/^\d+\.\s*/, '').replace(/^[-•]\s*/, '').trim()}</li>
                          ))}
                        </ul>
                      ) : item.concept}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Final summary section */}
          <div className="mt-8 text-center bg-gray-50 p-6 rounded-xl border border-gray-200">
            <div className="bg-green-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4"><CheckCircle className="text-green-600 w-8 h-8" /></div>
            <h4 className="text-green-800 font-bold text-xl mb-2">ดำเนินการครบทุกขั้นตอนแล้ว</h4>
            <p className="text-gray-600 mb-6">ท่านได้ทำการวิเคราะห์และจัดทำข้อมูลหลักสูตรครบถ้วนสมบูรณ์แล้ว</p>

            <div className="flex flex-col md:flex-row justify-center gap-4 mb-6">
              <button onClick={exportSummaryWord} className="bg-blue-700 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-800 shadow-lg flex items-center justify-center gap-2">
                <FileStack size={20} /> ดาวน์โหลดเอกสารสรุป (Word)
              </button>
              <button onClick={exportSummaryPdf} className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 shadow-lg flex items-center justify-center gap-2">
                <FileDown size={20} /> ดาวน์โหลด PDF (Full Syllabus)
              </button>
            </div>

            <div className="p-4 bg-white border border-gray-200 rounded-lg max-w-md mx-auto">
              <p className="text-sm text-gray-500 mb-2 font-bold text-left">สรุปสิ่งที่ท่านได้รับ:</p>
              <ul className="text-left text-sm text-gray-700 space-y-1 list-disc pl-8">
                <li>วิเคราะห์งาน (Job Analysis)</li>
                <li>แบ่งหน่วยการเรียนรู้ (Learning Units)</li>
                <li>ผลลัพธ์การเรียนรู้ (Learning Outcomes)</li>
                <li>สมรรถนะประจำหน่วย (Competencies)</li>
                <li>จุดประสงค์เชิงพฤติกรรม (Behavioral Objectives)</li>
                <li>เนื้อหาสาระ (Key Concepts)</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConceptModule;
