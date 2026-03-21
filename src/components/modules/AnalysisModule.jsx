import React, { useState, useEffect } from 'react';
import {
  Upload, FileText, FileType, Check, PenTool, BookOpen, Loader2,
  Info, RefreshCw, Sparkles, ArrowRight, AlertTriangle, Search,
  Paperclip, Table as TableIcon, FileDown, ChevronRight
} from 'lucide-react';
import MarkdownTableRenderer from '../common/MarkdownTableRenderer';
import UnitTableWithTooltip from '../common/UnitTableWithTooltip';
import ExportButtons from '../common/ExportButtons';
import { useAiApi } from '../../hooks/useAiApi';
import { SYSTEM_PROMPT_EXTRACTION, SYSTEM_PROMPT_STANDARD_OCR } from '../../constants/prompts';
import { buildAnalysisPrompt, buildUnitDivisionPrompt } from '../../constants/promptBuilders';
import { getCourseLevel, getWeeklyHours, getTheoryPractice, getWeeksFromCode } from '../../utils/courseHelpers';
import { convertMarkdownTableToHTML, parseUnitTable, convertUnitTableToHTML } from '../../utils/markdownTable';
import { printToPdf, createWordDoc } from '../../utils/exportHelpers';
import { cleanAndParseJSON } from '../../utils/jsonParser';

const AnalysisModule = ({
  providerId, apiKey,
  formData, setFormData,
  generatedPlan, setGeneratedPlan,
  unitDivisionPlan, setUnitDivisionPlan,
  onError, onNavigate, onOpenStandardSearch,
}) => {
  // Auto-restore step based on existing data
  const [step, setStep] = useState(() => {
    if (generatedPlan) return 3;
    if (formData.courseCode) return 2;
    return 1;
  });
  const [courseFile, setCourseFile] = useState(null);
  const [hasStandard, setHasStandard] = useState(false);
  const [standardContent, setStandardContent] = useState('');
  const [standardFileName, setStandardFileName] = useState('');
  const [dividingUnits, setDividingUnits] = useState(false);
  const { callApi, loading, loadingText } = useAiApi(providerId, apiKey);

  // Auto-generate unit division when returning to step 3 with plan but no units
  useEffect(() => {
    if (step === 3 && generatedPlan && !unitDivisionPlan && !dividingUnits) {
      generateUnitDivision(generatedPlan, formData);
    }
  }, [step, generatedPlan, unitDivisionPlan, dividingUnits]);

  useEffect(() => {
    if (!window.mammoth) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
      document.body.appendChild(script);
    }
  }, []);

  // --- File Handlers ---
  const handleCourseUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    const isWord = file.name.endsWith('.doc') || file.name.endsWith('.docx');
    if (!isImage && !isPdf && !isWord) {
      onError('กรุณาอัปโหลดไฟล์ รูปภาพ, PDF หรือ Word เท่านั้น');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setCourseFile({ type: isImage ? 'image' : isPdf ? 'pdf' : 'word', data: reader.result, name: file.name });
    };
    reader.readAsDataURL(file);
  };

  const handleStandardUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setStandardFileName(file.name);
    if (file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
      setStandardContent(`(ไฟล์ Word แนบ: ${file.name})`);
      if (!formData.standardRef) setFormData((p) => ({ ...p, standardRef: 'อ้างอิงไฟล์แนบ: ' + file.name }));
      return;
    }
    try {
      const result = await callApi(
        [{ text: SYSTEM_PROMPT_STANDARD_OCR }, { inlineData: { mimeType: file.type === 'application/pdf' ? 'application/pdf' : 'image/jpeg', data: (await readAsBase64(file)) } }],
        { statusText: 'กำลังอ่านข้อมูลจากไฟล์มาตรฐานอาชีพ...' }
      );
      if (result) {
        setStandardContent(result);
        if (!formData.standardRef) setFormData((p) => ({ ...p, standardRef: 'อ้างอิงไฟล์แนบ: ' + file.name }));
      }
    } catch {
      alert('เกิดข้อผิดพลาดในการอ่านไฟล์มาตรฐาน');
    }
  };

  const readAsBase64 = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(file);
    });

  // --- OCR Extraction ---
  const callExtraction = async () => {
    if (!courseFile) { onError('กรุณาแนบไฟล์หลักสูตรรายวิชา ด้วยค่ะ'); return; }
    if (courseFile.type === 'word') {
      alert('ระบบยังไม่รองรับการดึงข้อมูลอัตโนมัติจากไฟล์ Word\nกรุณากรอกข้อมูลรายวิชาด้วยตนเองในขั้นตอนถัดไป');
      setStep(2);
      return;
    }
    try {
      const base64Data = courseFile.data.split(',')[1];
      const mimeType = courseFile.type === 'pdf' ? 'application/pdf' : 'image/jpeg';
      const data = await callApi(
        [{ text: SYSTEM_PROMPT_EXTRACTION }, { inlineData: { mimeType, data: base64Data } }],
        { json: true, statusText: 'กำลังอ่านข้อมูลจากหลักสูตร (OCR)...' }
      );
      if (data?.isValidCurriculum === false) {
        onError('ดูเหมือนเอกสารจะไม่ใช่หลักสูตรรายวิชา กรุณาตรวจสอบไฟล์อีกครั้ง');
        return;
      }
      if (data) {
        const formatList = (str) => {
          if (!str) return '';
          // แยกแต่ละข้อด้วยเลข แล้วรวมกลับโดยไม่มีบรรทัดว่างคั่น
          return str
            .replace(/\n{2,}/g, '\n')           // ลบบรรทัดว่างซ้ำ
            .replace(/\n?\s*(\d+\.)/g, '\n$1')   // ขึ้นบรรทัดใหม่ก่อนเลขข้อ (ไม่เว้นบรรทัด)
            .trim();
        };
        data.objectives = formatList(data.objectives);
        data.competencies = formatList(data.competencies);
        setFormData((p) => ({ ...p, ...data }));
        setStep(2);
      } else {
        throw new Error('Failed to parse');
      }
    } catch (err) {
      console.error('Extraction Error:', err);
      onError(`เกิดข้อผิดพลาด: ${err.message || 'ไม่สามารถอ่านไฟล์ได้'}`);
    }
  };

  // --- Generation ---
  const generateUnitDivision = async (planText, fd) => {
    setDividingUnits(true);
    try {
      const weeks = getWeeksFromCode(fd.courseCode);
      const { theory, practice } = getTheoryPractice(fd.ratio);
      const prompt = buildUnitDivisionPrompt(planText, weeks, theory, practice, fd.description);
      const text = await callApi([{ text: prompt }], { statusText: 'กำลังแบ่งหน่วยการเรียนรู้...' });
      if (text) setUnitDivisionPlan(text);
    } catch { /* silently fail */ }
    finally { setDividingUnits(false); }
  };

  const callGeneration = async () => {
    if (hasStandard && !standardContent) {
      alert('ท่านเลือก \'มีมาตรฐานอาชีพ\' กรุณาแนบไฟล์มาตรฐานก่อน');
      return;
    }
    setGeneratedPlan(null);
    setUnitDivisionPlan(null);
    try {
      const prompt = buildAnalysisPrompt(formData, hasStandard ? standardContent : '');
      const text = await callApi([{ text: prompt }], {
        statusText: hasStandard
          ? "กำลังวิเคราะห์ 'ผลลัพธ์การเรียนรู้' ร่วมกับ 'มาตรฐานอาชีพ'..."
          : 'กำลังวิเคราะห์ Job-Duty-Task และสร้างแผนการสอน...',
      });
      if (text) {
        setGeneratedPlan(text);
        setStep(3);
        generateUnitDivision(text, formData);
      } else {
        throw new Error('No plan');
      }
    } catch (err) {
      console.error('Plan Error:', err);
      onError(`เกิดข้อผิดพลาด: ${err.message || 'ไม่สามารถสร้างแผนได้'} — ลองกดสร้างใหม่อีกครั้ง`);
    }
  };

  // --- Export ---
  const handleExportWord = () => {
    if (!generatedPlan) return;
    createWordDoc(`Job_Analysis_${formData.courseCode}`, convertMarkdownTableToHTML(generatedPlan));
  };
  const handleSavePdf = () => {
    if (!generatedPlan) return;
    printToPdf(`ตารางวิเคราะห์หน่วยการเรียนรู้ (Job Analysis): ${formData.courseName}`, convertMarkdownTableToHTML(generatedPlan));
  };
  const handleExportUnitsWord = () => {
    if (!unitDivisionPlan) return;
    const parsed = parseUnitTable(unitDivisionPlan);
    const { rowsHtml, totalTheory, totalPractice, totalAll } = convertUnitTableToHTML(parsed);
    createWordDoc(`ตารางหน่วยการเรียนรู้_${formData.courseCode}`, buildUnitExportHtml(rowsHtml, totalTheory, totalPractice, totalAll));
  };
  const handleExportUnitsPdf = () => {
    if (!unitDivisionPlan) return;
    const parsed = parseUnitTable(unitDivisionPlan);
    const { rowsHtml, totalTheory, totalPractice, totalAll } = convertUnitTableToHTML(parsed);
    printToPdf(`ตารางหน่วยการเรียนรู้ ${formData.courseCode}`, buildUnitExportHtml(rowsHtml, totalTheory, totalPractice, totalAll));
  };

  const buildUnitExportHtml = (rowsHtml, totalTheory, totalPractice, totalAll) => `
    <table>
      <thead><tr><th width="10%">หน่วยที่</th><th width="50%">ชื่อหน่วยการเรียนรู้</th><th width="10%" class="text-center">ทฤษฎี</th><th width="10%" class="text-center">ปฏิบัติ</th><th width="10%" class="text-center">รวม</th></tr></thead>
      <tbody>${rowsHtml}
        <tr style="background-color:#f9f9f9; font-weight:bold;">
          <td colspan="2" style="text-align:right;">รวมทั้งสิ้น</td>
          <td class="text-center">${totalTheory}</td><td class="text-center">${totalPractice}</td><td class="text-center">${totalAll}</td>
        </tr>
      </tbody>
    </table>`;

  // --- Sub-renders ---
  const levelInfo = getCourseLevel(formData.courseCode);
  const weeklyHours = getWeeklyHours(formData.ratio);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-lg font-medium text-gray-700 animate-pulse">{loadingText}</p>
      </div>
    );
  }

  // Step 1: Upload
  if (step === 1) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-blue-300 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer relative">
        <input type="file" accept="image/*,application/pdf,.doc,.docx" onChange={handleCourseUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
        {courseFile ? (
          <div className="text-center">
            {courseFile.type === 'image' ? (
              <img src={courseFile.data} alt="Preview" className="max-h-64 rounded-lg shadow-md mb-4 mx-auto" />
            ) : (
              <div className="flex flex-col items-center justify-center mb-6 py-8">
                <div className={`${courseFile.type === 'pdf' ? 'bg-red-100' : 'bg-blue-100'} p-6 rounded-full mb-3`}>
                  {courseFile.type === 'pdf' ? <FileText className="w-16 h-16 text-red-600" /> : <FileType className="w-16 h-16 text-blue-600" />}
                </div>
                <p className="text-xl font-bold text-gray-700">{courseFile.name}</p>
                <p className="text-sm text-gray-500 mt-1 uppercase">{courseFile.type} FILE</p>
              </div>
            )}
            <p className="text-blue-700 font-semibold">เลือกไฟล์แล้ว (คลิกเพื่อเปลี่ยน)</p>
          </div>
        ) : (
          <div className="text-center">
            <Upload className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-blue-800">อัปโหลดหลักสูตรรายวิชา (Word, PDF, รูปภาพ)</h3>
            <p className="text-sm text-blue-600 mt-2">คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่</p>
          </div>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); if (!courseFile) { onError('กรุณาแนบไฟล์หลักสูตรรายวิชา ด้วยค่ะ'); return; } callExtraction(); }}
          disabled={loading}
          className={`mt-6 px-6 py-2 rounded-full font-medium shadow-lg flex items-center gap-2 z-10 transition ${!courseFile ? 'bg-gray-400 text-white' : courseFile.type === 'word' ? 'bg-gray-600 text-white hover:bg-gray-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
        >
          {loading ? <Loader2 className="animate-spin" /> : <FileText />}
          {courseFile?.type === 'word' ? 'ไปยังหน้ากรอกข้อมูล (Word)' : 'ดึงข้อมูลรายวิชาอัตโนมัติ'}
        </button>
      </div>
    );
  }

  // Step 2: Review form
  if (step === 2) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-sm text-yellow-800 flex items-start gap-3">
          <PenTool className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div><p className="font-bold">ตรวจสอบความถูกต้อง & เพิ่มเติมข้อมูล</p><p>AI ดึงข้อมูลมาแล้ว สามารถแก้ไข และ แนบมาตรฐานอาชีพ เพิ่มเติมได้ในหน้านี้</p></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[['courseCode', 'รหัสวิชา'], ['courseName', 'ชื่อวิชา'], ['credits', 'หน่วยกิต'], ['ratio', 'ท-ป-น']].map(([key, label]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input type="text" value={formData[key]} onChange={(e) => setFormData({ ...formData, [key]: e.target.value })} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 font-mono" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2"><Info className="text-blue-500 w-4 h-4" /><span className="text-xs text-gray-500">ระดับ: {levelInfo.text}</span></div>
          <div className="flex items-center gap-2"><Info className="text-blue-500 w-4 h-4" /><span className="text-xs text-gray-500">เวลาเรียน: {weeklyHours > 0 ? `${weeklyHours} ชม./สัปดาห์` : '-'}</span></div>
        </div>

        {/* Standard Reference */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">อ้างอิงมาตรฐาน (Standard Reference)</label>
          <div className="flex gap-2">
            <input type="text" value={formData.standardRef} onChange={(e) => setFormData({ ...formData, standardRef: e.target.value })} placeholder="ไม่มี (ระบุถ้ามี)" className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" />
            <button onClick={onOpenStandardSearch} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 whitespace-nowrap shadow-sm text-sm font-medium">
              <Search size={16} /> ค้นหามาตรฐานอาชีพ
            </button>
          </div>
        </div>

        {/* Standard Toggle */}
        <div className="bg-blue-50 p-5 rounded-xl border border-blue-200">
          <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2"><Sparkles className="w-5 h-5 text-blue-600" /> วิชาของท่านมีการอ้างอิงมาตรฐานอาชีพหรือไม่?</h3>
          <div className="flex gap-4 mb-4">
            <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={!hasStandard} onChange={() => setHasStandard(false)} className="w-4 h-4 text-blue-600" /><span className="text-gray-700">ไม่มี</span></label>
            <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={hasStandard} onChange={() => setHasStandard(true)} className="w-4 h-4 text-blue-600" /><span className="text-gray-700 font-medium">มี (ต้องการแนบไฟล์มาตรฐาน)</span></label>
          </div>
          {hasStandard && (
            <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">แนบไฟล์มาตรฐานอาชีพ (PDF, Word, หรือ รูปภาพ)</label>
              <div className="flex items-center gap-3">
                <label className="flex-1 cursor-pointer bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-700 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition">
                  <Paperclip size={18} /> {standardFileName || 'คลิกเพื่อเลือกไฟล์...'}
                  <input type="file" accept="image/*,application/pdf,.doc,.docx" onChange={handleStandardUpload} className="hidden" />
                </label>
                {standardContent && <Check className="text-green-500 w-6 h-6" />}
              </div>
              <p className="text-xs text-gray-500 mt-2">*ระบบจะนำข้อมูลจากไฟล์นี้ไปวิเคราะห์ร่วมกับผลลัพธ์การเรียนรู้</p>
            </div>
          )}
        </div>

        {/* Textareas */}
        {[
          ['learningOutcomes', 'ผลลัพธ์การเรียนรู้ระดับรายวิชา', 4],
          ['objectives', 'จุดประสงค์รายวิชา', 4],
          ['competencies', 'สมรรถนะรายวิชา', 4],
          ['description', 'คำอธิบายรายวิชา', 3],
        ].map(([key, label, rows]) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <textarea rows={rows} value={formData[key]} onChange={(e) => setFormData({ ...formData, [key]: e.target.value })} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 font-sans leading-relaxed" />
          </div>
        ))}

        <div className="flex justify-between pt-4 border-t">
          <button onClick={() => setStep(1)} className="px-4 py-2 text-gray-600 hover:text-gray-800">กลับไปอัปโหลด</button>
          <button onClick={callGeneration} disabled={loading} className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 shadow-lg flex items-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : <BookOpen />} สร้างโครงการสอน (Job-Based)
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Results
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-green-50 p-4 rounded-lg border border-green-200 gap-4">
        <div className="flex-1">
          <h3 className="font-bold text-green-800 flex items-center gap-2"><Check className="w-5 h-5" /> สร้างโครงการสอนสำเร็จ!</h3>
          <p className="text-sm text-green-700 ml-7">วิชา: {formData.courseCode} {formData.courseName}</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <button onClick={handleExportWord} className="flex items-center gap-1 bg-blue-700 text-white px-3 py-2 rounded-lg hover:bg-blue-800 transition shadow-sm font-medium text-sm"><FileText size={16} /> ส่งออกเป็น Word</button>
          <button onClick={handleSavePdf} className="flex items-center gap-1 bg-white border border-blue-600 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-50 transition shadow-sm font-medium text-sm"><FileDown size={16} /> บันทึก PDF</button>
          <button onClick={() => setStep(2)} className="flex items-center gap-1 bg-gray-100 border border-gray-300 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-200 transition shadow-sm text-sm"><RefreshCw size={16} /> เริ่มใหม่</button>
        </div>
      </div>

      <div className="bg-white p-2 md:p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="mb-4 text-sm text-gray-500 flex items-center gap-2"><TableIcon size={16} /> ตารางวิเคราะห์หน่วยการเรียนรู้ (Analysis Table)</div>
        <MarkdownTableRenderer content={generatedPlan} />
      </div>

      {dividingUnits && (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-blue-100 flex flex-col items-center justify-center animate-pulse">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-3" />
          <p className="text-blue-600 font-medium">กำลังคำนวณและแบ่งหน่วยการเรียนรู้ (อัตโนมัติ)...</p>
        </div>
      )}

      {unitDivisionPlan && (
        <div className="bg-blue-50 p-2 md:p-6 rounded-xl shadow-sm border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-blue-800 font-bold flex items-center gap-2"><Sparkles size={16} /> ตารางแบ่งหน่วยการเรียนรู้ (Learning Units)</div>
            <ExportButtons
              onRegenerate={() => { setUnitDivisionPlan(null); generateUnitDivision(generatedPlan, formData); }}
              onExportWord={handleExportUnitsWord}
              onExportPdf={handleExportUnitsPdf}
              regenerateLabel="สร้างใหม่"
            />
          </div>
          <UnitTableWithTooltip markdown={unitDivisionPlan} />
          <div className="mt-4 flex items-start gap-2 text-xs text-orange-700 bg-orange-50 p-3 rounded-lg border border-orange-200">
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            <p><b>คำแนะนำ:</b> ลองนำเมาส์ไปวางที่ "ชื่อหน่วยการเรียนรู้" เพื่อดูหัวข้อเรื่องย่อยที่ซ่อนอยู่<br />ข้อมูลเป็นเพียงตัวอย่างที่ AI สร้างขึ้น คุณครูสามารถปรับเปลี่ยนได้ตามความเหมาะสม</p>
          </div>
          <div className="mt-6 text-center">
            <button onClick={() => onNavigate('learning_outcomes')} className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 shadow-lg flex items-center gap-2 mx-auto animate-bounce">
              ไปขั้นตอนต่อไป: ผลลัพธ์การเรียนรู้ประจำหน่วย (Module 2) <ArrowRight size={20} />
            </button>
            <p className="text-xs text-gray-500 mt-2">ระบบจะส่งข้อมูลตารางหน่วยฯ และวิเคราะห์งานไปให้โดยอัตโนมัติ</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisModule;
