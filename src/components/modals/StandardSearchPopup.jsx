import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, RotateCcw, Send, Paperclip, Loader2, FileDown, CheckSquare, Square } from 'lucide-react';
import ChatBubble from '../common/ChatBubble';
import { SYSTEM_PROMPT_STANDARD_ANALYSIS } from '../../constants/prompts';
import { cleanAndParseJSON } from '../../utils/jsonParser';
import { createProvider } from '../../providers/index';

const StandardSearchPopup = ({ isOpen, onClose, providerId, apiKey, onStandardSelected }) => {
  const [messages, setMessages] = useState([]);
  const [step, setStep] = useState('init');
  const [inputValue, setInputValue] = useState('');
  const [standardData, setStandardData] = useState([]);
  const [selectedUocs, setSelectedUocs] = useState({});
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) handleReset();
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (text, sender) => {
    setMessages((prev) => [...prev, { id: Date.now(), sender, text }]);
  };

  const handleReset = () => {
    setMessages([
      {
        id: 1,
        sender: 'bot',
        text: '**สวัสดีค่ะ น้องเพชรยินดีให้บริการค่ะ** \nกรุณาเลือกหน่วยงานที่ต้องการค้นหามาตรฐานอาชีพ:',
      },
    ]);
    setStep('init');
    setStandardData([]);
    setSelectedUocs({});
    setInputValue('');
    setLoading(false);
  };

  const handleChoice = (choice) => {
    addMessage(choice, 'user');
    if (choice === 'สคช. (TPQI)') {
      setStep('tpqi_name');
      setTimeout(() => addMessage('กรุณาระบุ **ชื่อมาตรฐานอาชีพ** ตามหลักสูตรรายวิชาของท่านค่ะ', 'bot'), 500);
    } else if (choice === 'กพร.') {
      setStep('dsd_select_type');
      setTimeout(() => addMessage('สวัสดีค่ะคุณครู น้องเพชรจะช่วยหามาตรฐานอาชีพจาก **กรมพัฒนาฝีมือแรงงาน** ให้นะคะ\n\nไม่ทราบว่าสิ่งที่ต้องการคือ **มาตรฐานผีมือแรงงานแห่งชาติ** หรือ **หลักสูตรการฝึกอบรม** คะ?', 'bot'), 500);
    } else if (choice === 'CEFR') {
      setTimeout(() => addMessage('ข้อมูลมาตรฐาน CEFR ค่ะ:\n[คลิกเพื่อดูเอกสาร CEFR](https://docs.google.com/document/d/11oGEqNOcvWw0oTrla19yKQte-95LYQTxBJgptWUr7z8/edit?usp=sharing)', 'bot'), 500);
    } else if (choice === 'HSK') {
      setTimeout(() => addMessage('ข้อมูลมาตรฐาน HSK ค่ะ:\n[คลิกเพื่อดูเอกสาร HSK](https://docs.google.com/document/d/1wE-N_FiIzBMMxilOithHRz-xXtT4fnv0S8DXdVGAjG8/edit?usp=sharing)', 'bot'), 500);
    } else {
      setTimeout(() => addMessage('ขออภัยค่ะ ขณะนี้รองรับเฉพาะ สคช., กพร., CEFR และ HSK ค่ะ', 'bot'), 500);
    }
  };

  const handleDsdChoice = (subChoice) => {
    addMessage(subChoice, 'user');
    const ytLink = '\n\nสามารถศึกษารายละเอียด และวิธีการ จากคลิปของครูอาร์มได้นะคะ (แนะนำ EP. 8-9)\nคลิกเพื่อดูคลิป Youtube';
    if (subChoice === 'มาตรฐานผีมือแรงงานแห่งชาติ') {
      setTimeout(() => addMessage(`ได้เลยค่ะ สำหรับ **มาตรฐานผีมือแรงงานแห่งชาติ** สามารถค้นหาได้ที่ลิงก์นี้ค่ะ:\n[Google Drive: มาตรฐานผีมือแรงงาน](https://drive.google.com/drive/folders/1azrPzdQ3cAHNyQ6fPrJewyfM-7bkP4Lx)\n\n**คำแนะนำ:**\n1. ให้ค้นหาจากไฟล์ที่ชื่อว่า **"ตารางมาตรฐาน"**\n2. เลือกมาตรฐานที่ต้องการ\n3. กด Download จากคอลัมน์ "มาตรฐาน" (คอลัมน์ที่ 4) ได้เลยค่ะ${ytLink}`, 'bot'), 600);
    } else {
      setTimeout(() => addMessage(`สำหรับ **หลักสูตรการฝึกอบรม** สามารถค้นหาได้ที่เว็บไซต์นี้เลยค่ะ:\n[DSD: หลักสูตรฝึกอบรม](https://www.dsd.go.th/DSD/TrainingOcc/DocumentType)\n\nคุณครูสามารถค้นหาหลักสูตรที่ต้องการได้จากหน้าเว็บเลยนะคะ${ytLink}`, 'bot'), 600);
    }
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    const text = inputValue;
    setInputValue('');
    addMessage(text, 'user');
    if (step === 'tpqi_name') {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent('มาตรฐานอาชีพ ' + text + ' tpqi')}`;
      setTimeout(() => {
        addMessage(`น้องเพชรค้นหาข้อมูลให้แล้วค่ะ\n\n[คลิกเพื่อดูผลการค้นหาจาก Google](${searchUrl})\n\n**ขั้นตอนต่อไป:**\n1. กรุณาคลิกลิงก์เพื่อเปิดดูข้อมูล\n2. มองหา **"เล่มมาตรฐานเฉพาะคุณวุฒิ"** หรือ **"เล่มมาตรฐาน(ทั้งเล่ม)"**\n3. ไฟล์ดังกล่าวตรงกับความต้องการของท่านหรือไม่คะ?`, 'bot');
        setStep('tpqi_confirm');
      }, 800);
    }
  };

  const handleConfirm = (isCorrect) => {
    addMessage(isCorrect ? 'ใช่/ถูกต้อง' : 'ไม่ใช่', 'user');
    if (isCorrect) {
      setTimeout(() => {
        addMessage('เยี่ยมเลยค่ะ!\n\nกรุณา แนบไฟล์ PDF หรือ รูปภาพ หน้าตารางมาตรฐาน (Functional Map หรือ ตารางเกณฑ์การปฏิบัติงาน) เพื่อให้น้องเพชรดึงข้อมูลลงตารางให้ค่ะ', 'bot');
        setStep('tpqi_upload');
      }, 500);
    } else {
      setTimeout(() => {
        addMessage('ลองระบุชื่อค้นหาใหม่อีกครั้งได้นะคะ หรือลองค้นหาด้วยคำสำคัญอื่นที่เกี่ยวข้องค่ะ', 'bot');
        setStep('tpqi_name');
      }, 500);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    addMessage(`[แนบไฟล์: ${file.name}]`, 'user');
    setLoading(true);
    addMessage('กำลังใช้ OCR อ่านข้อมูลจากเอกสาร... รอสักครู่นะคะ', 'bot');

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const mimeType = file.type === 'application/pdf' ? 'application/pdf' : 'image/jpeg';
        const fileType = file.type === 'application/pdf' ? 'pdf' : 'image';
        const provider = createProvider(providerId, apiKey);
        const text = await provider.sendMessage(
          SYSTEM_PROMPT_STANDARD_ANALYSIS,
          [{ type: fileType, data: reader.result, mimeType }],
          { requireJson: true }
        );
        if (text) {
          const data = cleanAndParseJSON(text);
          if (data?.standards) {
            setStandardData(data.standards);
            // Pre-select all UoCs
            const initSelected = {};
            getUniqueUocs(data.standards).forEach((_, idx) => { initSelected[idx] = true; });
            setSelectedUocs(initSelected);
            addMessage(`น้องเพชรดึงข้อมูลเรียบร้อยแล้วค่ะ! พบ ${data.standards.length} รายการ\n\nกรุณาเลือก **หน่วยสมรรถนะ (UoC)** ที่ต้องการใช้งานด้านล่างค่ะ`, 'bot');
            setStep('select_uoc');
          } else throw new Error('Invalid Data Format');
        } else throw new Error('No data');
      } catch {
        addMessage('ขออภัยค่ะ น้องเพชรไม่สามารถอ่านข้อมูลจากไฟล์นี้ได้\n\nกรุณาลองใช้ภาพหน้าตารางที่ชัดเจน หรือลองไฟล์อื่นนะคะ', 'bot');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // --- UoC Selection helpers ---
  const getUniqueUocs = (data) => {
    const seen = new Map();
    (data || []).forEach((item) => {
      const key = item.uoc_code || item.uoc_desc;
      if (key && !seen.has(key)) {
        seen.set(key, { code: item.uoc_code, desc: item.uoc_desc });
      }
    });
    return Array.from(seen.values());
  };

  const uniqueUocs = getUniqueUocs(standardData);

  const toggleUoc = (idx) => {
    setSelectedUocs((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleAll = () => {
    const allSelected = uniqueUocs.every((_, idx) => selectedUocs[idx]);
    const next = {};
    uniqueUocs.forEach((_, idx) => { next[idx] = !allSelected; });
    setSelectedUocs(next);
  };

  const getSelectedData = () => {
    const selectedCodes = new Set();
    uniqueUocs.forEach((uoc, idx) => {
      if (selectedUocs[idx]) selectedCodes.add(uoc.code);
    });
    return standardData.filter((item) => selectedCodes.has(item.uoc_code));
  };

  const handleConfirmUocAndDownload = () => {
    const filtered = getSelectedData();
    if (filtered.length === 0) {
      addMessage('กรุณาเลือกอย่างน้อย 1 หน่วยสมรรถนะค่ะ', 'bot');
      return;
    }

    // Generate Word doc with header and selected UoCs only
    const htmlContent = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>ตารางมาตรฐานอาชีพ</title>
<style>body{font-family:'TH Sarabun New',sans-serif;font-size:16pt;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid black;padding:5px;vertical-align:top;}th{background-color:#f2f2f2;}h2,h3{text-align:center;}p.header-info{text-align:center;margin:2px 0;}</style>
</head><body>
<h2>มาตรฐานอาชีพ</h2>
<p class="header-info">หน่วยงานรับรองมาตรฐานอาชีพสถาบันคุณวุฒิวิชาชีพ (องค์การมหาชน)</p>
<p class="header-info">มาตรฐานอาชีพ  สาขาวิชาชีพ.......................................................</p>
<p class="header-info">อาชีพ................................................................ระดับ.......................</p>
<br/>
<table><thead><tr><th colspan="2">หน่วยสมรรถนะ (UoC)</th><th colspan="2">สมรรถนะย่อย (EoC)</th><th>เกณฑ์ในการปฏิบัติงาน (Performance Criteria)</th><th>วิธีการประเมิน (Assessment)</th></tr>
<tr><th>รหัส</th><th>คำอธิบาย</th><th>รหัส</th><th>คำอธิบาย</th><th></th><th></th></tr></thead>
<tbody>${filtered.map((item) => `<tr><td>${item.uoc_code || ''}</td><td>${item.uoc_desc || ''}</td><td>${item.eoc_code || ''}</td><td>${item.eoc_desc || ''}</td><td>${item.criteria || ''}</td><td>${item.assessment || ''}</td></tr>`).join('')}</tbody></table></body></html>`;

    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ตารางมาตรฐานอาชีพ.doc';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Pass selected standard data to parent for use in analysis
    if (onStandardSelected) {
      const summaryText = filtered.map((item) =>
        `UoC: ${item.uoc_code} ${item.uoc_desc}\nEoC: ${item.eoc_code} ${item.eoc_desc}\nCriteria: ${item.criteria}\nAssessment: ${item.assessment}`
      ).join('\n\n');
      onStandardSelected(summaryText);
    }

    addMessage(`ดาวน์โหลดไฟล์ตารางมาตรฐานเรียบร้อยแล้วค่ะ! (เลือก ${filtered.length} รายการจาก ${standardData.length} รายการ)\n\nข้อมูลมาตรฐานที่เลือกจะถูกส่งไปใช้ในการวิเคราะห์งานต่อไปค่ะ`, 'bot');
    setStep('done');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg h-[600px] flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 p-2 rounded-full"><Sparkles size={20} /></div>
            <h3 className="font-bold text-lg">น้องเพชร (ผู้ช่วยมาตรฐานอาชีพ)</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleReset} className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1">
              <RotateCcw size={14} /> เริ่มค้นหาใหม่
            </button>
            <button onClick={onClose} className="text-white/80 hover:text-white transition p-1 hover:bg-white/10 rounded-full">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 scroll-smooth">
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg.text} sender={msg.sender} />
          ))}
          {loading && (
            <div className="flex justify-start mb-3">
              <div className="bg-gray-100 p-3 rounded-xl rounded-tl-none flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="animate-spin w-4 h-4" /> กำลังพิมพ์...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* UoC Selection Panel */}
        {step === 'select_uoc' && uniqueUocs.length > 0 && (
          <div className="p-3 bg-gray-50 border-t border-gray-200 max-h-52 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-700">เลือกหน่วยสมรรถนะ (UoC) ที่ต้องการ:</span>
              <button
                onClick={toggleAll}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                {uniqueUocs.every((_, idx) => selectedUocs[idx]) ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
              </button>
            </div>
            <div className="space-y-1.5">
              {uniqueUocs.map((uoc, idx) => (
                <label
                  key={idx}
                  className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer transition border ${
                    selectedUocs[idx]
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!selectedUocs[idx]}
                    onChange={() => toggleUoc(idx)}
                    className="mt-0.5 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-blue-700">{uoc.code}</div>
                    <div className="text-xs text-gray-700 leading-tight">{uoc.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Table preview for done step */}
        {step === 'done' && standardData.length > 0 && (
          <div className="p-2 bg-gray-100 border-t border-gray-200 max-h-40 overflow-y-auto text-xs">
            <table className="w-full bg-white border border-gray-300">
              <thead className="bg-gray-50">
                <tr><th className="p-1 border">UoC</th><th className="p-1 border">EoC</th><th className="p-1 border">Criteria</th></tr>
              </thead>
              <tbody>
                {getSelectedData().slice(0, 2).map((r, i) => (
                  <tr key={i}>
                    <td className="p-1 border truncate max-w-[50px]">{r.uoc_code}</td>
                    <td className="p-1 border truncate max-w-[50px]">{r.eoc_desc}</td>
                    <td className="p-1 border truncate max-w-[100px]" dangerouslySetInnerHTML={{ __html: r.criteria }} />
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-center text-gray-500 mt-1 italic">...แสดงตัวอย่าง...</p>
          </div>
        )}

        {/* Input Area / Controls */}
        <div className="p-4 bg-white border-t border-gray-200">
          {step === 'init' && (
            <div className="grid grid-cols-2 gap-2">
              {['สคช. (TPQI)', 'กพร.', 'CEFR', 'HSK'].map((c) => (
                <button key={c} onClick={() => handleChoice(c)} className="bg-pink-50 text-pink-700 border border-pink-200 p-2 rounded-lg hover:bg-pink-100 text-sm font-medium">{c}</button>
              ))}
              <button onClick={() => handleChoice('อื่นๆ')} className="bg-gray-50 text-gray-600 border border-gray-200 p-2 rounded-lg hover:bg-gray-100 text-sm col-span-2">อื่นๆ</button>
            </div>
          )}
          {step === 'dsd_select_type' && (
            <div className="flex flex-col gap-2">
              <button onClick={() => handleDsdChoice('มาตรฐานผีมือแรงงานแห่งชาติ')} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 text-sm font-medium">มาตรฐานฝีมือแรงงานแห่งชาติ</button>
              <button onClick={() => handleDsdChoice('หลักสูตรการฝึกอบรม')} className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 text-sm font-medium">หลักสูตรการฝึกอบรม</button>
            </div>
          )}
          {step === 'tpqi_name' && (
            <div className="flex gap-2">
              <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="พิมพ์ชื่อมาตรฐานอาชีพ..." className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" />
              <button onClick={handleSend} className="bg-pink-600 text-white p-2 rounded-lg hover:bg-pink-700"><Send size={20} /></button>
            </div>
          )}
          {step === 'tpqi_confirm' && (
            <div className="flex gap-2">
              <button onClick={() => handleConfirm(true)} className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">ใช่ / ถูกต้อง</button>
              <button onClick={() => handleConfirm(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300">ไม่ใช่</button>
            </div>
          )}
          {step === 'tpqi_upload' && (
            <div className="relative">
              <input type="file" accept="image/*,application/pdf" onChange={handleFileUpload} className="hidden" id="std-upload" />
              <label htmlFor="std-upload" className="flex items-center justify-center gap-2 w-full bg-blue-50 border-2 border-dashed border-blue-300 text-blue-700 py-3 rounded-xl cursor-pointer hover:bg-blue-100">
                <Paperclip size={20} /> แนบไฟล์ (รูปภาพ หรือ PDF)
              </label>
            </div>
          )}
          {step === 'select_uoc' && (
            <button
              onClick={handleConfirmUocAndDownload}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 shadow-lg font-medium"
            >
              <FileDown size={20} /> ยืนยันและดาวน์โหลด Word ({Object.values(selectedUocs).filter(Boolean).length} UoC ที่เลือก)
            </button>
          )}
          {step === 'done' && (
            <div className="text-center text-sm text-green-700 font-medium py-2">
              ดาวน์โหลดเรียบร้อยแล้ว — ข้อมูลมาตรฐานพร้อมใช้ในการวิเคราะห์งาน
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StandardSearchPopup;
