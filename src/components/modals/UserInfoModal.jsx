import React, { useState, useEffect } from 'react';
import { X, Download, Mail, User, Building2, MapPin, GraduationCap, Briefcase, Shield, Award, ChevronRight, ChevronLeft } from 'lucide-react';

const STORAGE_KEY = 'user_info';
const GOOGLE_SHEET_URL = '';

const PREFIXES = ['นาย', 'นาง', 'นางสาว', 'อื่นๆ'];

const POSITIONS = [
  'ครูอัตราจ้าง', 'พนักงานราชการครู', 'ครูผู้ช่วย', 'ครู',
  'รองผู้อำนวยการ', 'ผู้อำนวยการ', 'ศึกษานิเทศก์', 'อื่นๆ',
];

const ACADEMIC_RANKS = [
  'ไม่มี', 'ชำนาญการ', 'ชำนาญการพิเศษ', 'เชี่ยวชาญ', 'เชี่ยวชาญพิเศษ',
];

const REGIONS = ['ภาคใต้', 'ภาคกลาง', 'ภาคเหนือ', 'ภาคตะวันออกเฉียงเหนือ', 'ภาคตะวันออกและกรุงเทพมหานคร'];

const AFFILIATIONS = ['รัฐบาล', 'เอกชน'];

const PROVINCES = [
  'กรุงเทพมหานคร','กระบี่','กาญจนบุรี','กาฬสินธุ์','กำแพงเพชร','ขอนแก่น','จันทบุรี','ฉะเชิงเทรา',
  'ชลบุรี','ชัยนาท','ชัยภูมิ','ชุมพร','เชียงราย','เชียงใหม่','ตรัง','ตราด','ตาก','นครนายก',
  'นครปฐม','นครพนม','นครราชสีมา','นครศรีธรรมราช','นครสวรรค์','นนทบุรี','นราธิวาส','น่าน',
  'บึงกาฬ','บุรีรัมย์','ปทุมธานี','ประจวบคีรีขันธ์','ปราจีนบุรี','ปัตตานี','พระนครศรีอยุธยา',
  'พะเยา','พังงา','พัทลุง','พิจิตร','พิษณุโลก','เพชรบุรี','เพชรบูรณ์','แพร่','ภูเก็ต',
  'มหาสารคาม','มุกดาหาร','แม่ฮ่องสอน','ยโสธร','ยะลา','ร้อยเอ็ด','ระนอง','ระยอง','ราชบุรี',
  'ลพบุรี','ลำปาง','ลำพูน','เลย','ศรีสะเกษ','สกลนคร','สงขลา','สตูล','สมุทรปราการ',
  'สมุทรสงคราม','สมุทรสาคร','สระแก้ว','สระบุรี','สิงห์บุรี','สุโขทัย','สุพรรณบุรี',
  'สุราษฎร์ธานี','สุรินทร์','หนองคาย','หนองบัวลำภู','อ่างทอง','อำนาจเจริญ','อุดรธานี',
  'อุตรดิตถ์','อุทัยธานี','อุบลราชธานี',
];

export const getStoredUserInfo = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
};
export const setStoredUserInfo = (info) => localStorage.setItem(STORAGE_KEY, JSON.stringify(info));

export const logDownloadToSheet = (userInfo, meta = {}) => {
  if (!GOOGLE_SHEET_URL) return;
  try {
    fetch(GOOGLE_SHEET_URL, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...userInfo, ...meta, timestamp: new Date().toISOString() }),
    }).catch(() => {});
  } catch { /* silent */ }
};

export const useDownloadWithUserInfo = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingDownload, setPendingDownload] = useState(null);
  const triggerDownload = (downloadFn) => {
    if (getStoredUserInfo()) { downloadFn(); } else { setPendingDownload(() => downloadFn); setIsOpen(true); }
  };
  const handleSubmit = (info) => { setStoredUserInfo(info); setIsOpen(false); if (pendingDownload) { pendingDownload(); setPendingDownload(null); } };
  const handleClose = () => { setIsOpen(false); setPendingDownload(null); };
  return { isOpen, triggerDownload, handleSubmit, handleClose };
};

// --- UI Helpers ---
const Field = ({ icon: Icon, label, required, children }) => (
  <div>
    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5">
      {Icon && <Icon size={13} className="text-blue-500" />}
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
  </div>
);

const inputCls = 'w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition placeholder:text-gray-400';

const CardRadio = ({ options, value, onChange, cols = 2 }) => (
  <div className={`grid grid-cols-${cols} gap-2`}>
    {options.map((opt) => (
      <label key={opt} className={`flex items-center justify-center cursor-pointer p-2.5 rounded-xl border-2 transition text-sm font-medium ${
        value === opt ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
      }`}>
        <input type="radio" value={opt} checked={value === opt} onChange={(e) => onChange(e.target.value)} className="sr-only" />
        {opt}
      </label>
    ))}
  </div>
);

const UserInfoModal = ({ isOpen, onSubmit, onClose }) => {
  const [form, setForm] = useState({
    prefix: '', prefixOther: '', firstName: '', lastName: '',
    email: '', position: '', positionOther: '', academicRank: '',
    department: '', college: '', province: '', region: '', affiliation: '',
  });
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (isOpen) { const s = getStoredUserInfo(); if (s) setForm(s); setStep(1); }
  }, [isOpen]);

  if (!isOpen) return null;

  const u = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const s1ok = form.prefix && form.firstName.trim() && form.lastName.trim() && form.email.trim() && emailOk && form.position && form.academicRank;
  const s2ok = form.college.trim() && form.province && form.region && form.affiliation;

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto relative">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 rounded-t-2xl text-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition"><X size={22} /></button>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2.5 rounded-xl"><Download className="w-6 h-6" /></div>
            <div>
              <h3 className="text-lg font-bold">ลงทะเบียนก่อนดาวน์โหลด</h3>
              <p className="text-xs text-blue-200">กรอกข้อมูลครั้งเดียว ใช้ได้ตลอด</p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <div className={`flex-1 h-1.5 rounded-full transition ${step >= 1 ? 'bg-white' : 'bg-white/30'}`} />
            <div className={`flex-1 h-1.5 rounded-full transition ${step >= 2 ? 'bg-white' : 'bg-white/30'}`} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-blue-200">ข้อมูลส่วนตัว</span>
            <span className="text-[10px] text-blue-200">ข้อมูลสถานศึกษา</span>
          </div>
        </div>

        {/* Body */}
        <div className="p-5">
          {step === 1 ? (
            <div className="space-y-3.5 animate-in fade-in slide-in-from-right-2 duration-200">

              {/* Prefix */}
              <Field icon={User} label="คำนำหน้า" required>
                <CardRadio options={PREFIXES} value={form.prefix} onChange={(v) => u('prefix', v)} cols={4} />
                {form.prefix === 'อื่นๆ' && (
                  <input type="text" value={form.prefixOther} onChange={(e) => u('prefixOther', e.target.value)}
                    placeholder="ระบุคำนำหน้า" className={`${inputCls} mt-2`} />
                )}
              </Field>

              {/* Name */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="ชื่อ" required>
                  <input type="text" value={form.firstName} onChange={(e) => u('firstName', e.target.value)}
                    placeholder="ชื่อ" className={inputCls} />
                </Field>
                <Field label="นามสกุล" required>
                  <input type="text" value={form.lastName} onChange={(e) => u('lastName', e.target.value)}
                    placeholder="นามสกุล" className={inputCls} />
                </Field>
              </div>

              {/* Email */}
              <Field icon={Mail} label="อีเมล" required>
                <input type="email" value={form.email} onChange={(e) => u('email', e.target.value)}
                  placeholder="example@email.com"
                  className={`${inputCls} ${form.email && !emailOk ? 'border-red-300 focus:ring-red-500' : ''}`} />
                {form.email && !emailOk && <p className="text-xs text-red-500 mt-1">กรุณากรอกอีเมลให้ถูกต้อง</p>}
              </Field>

              {/* Position */}
              <Field icon={Briefcase} label="ตำแหน่ง" required>
                <select value={form.position} onChange={(e) => u('position', e.target.value)} className={inputCls}>
                  <option value="">-- เลือกตำแหน่ง --</option>
                  {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                {form.position === 'อื่นๆ' && (
                  <input type="text" value={form.positionOther} onChange={(e) => u('positionOther', e.target.value)}
                    placeholder="ระบุตำแหน่ง" className={`${inputCls} mt-2`} />
                )}
              </Field>

              {/* Academic Rank */}
              <Field icon={Award} label="วิทยฐานะ" required>
                <CardRadio options={ACADEMIC_RANKS} value={form.academicRank} onChange={(v) => u('academicRank', v)} cols={3} />
              </Field>

              <button onClick={() => setStep(2)} disabled={!s1ok}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                ถัดไป <ChevronRight size={18} />
              </button>
            </div>
          ) : (
            <div className="space-y-3.5 animate-in fade-in slide-in-from-right-2 duration-200">

              {/* Department */}
              <Field icon={GraduationCap} label="สาขาวิชา">
                <input type="text" value={form.department} onChange={(e) => u('department', e.target.value)}
                  placeholder="เช่น ช่างยนต์, บัญชี, คอมพิวเตอร์ธุรกิจ" className={inputCls} />
              </Field>

              {/* College */}
              <Field icon={Building2} label="วิทยาลัย" required>
                <input type="text" value={form.college} onChange={(e) => u('college', e.target.value)}
                  placeholder="เช่น วิทยาลัยเทคนิคสุราษฎร์ธานี" className={inputCls} />
              </Field>

              {/* Province */}
              <Field icon={MapPin} label="จังหวัด" required>
                <select value={form.province} onChange={(e) => u('province', e.target.value)} className={inputCls}>
                  <option value="">-- เลือกจังหวัด --</option>
                  {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>

              {/* Region */}
              <Field icon={MapPin} label="ภาค" required>
                <select value={form.region} onChange={(e) => u('region', e.target.value)} className={inputCls}>
                  <option value="">-- เลือกภาค --</option>
                  {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>

              {/* Affiliation */}
              <Field icon={Shield} label="สังกัด" required>
                <CardRadio options={AFFILIATIONS} value={form.affiliation} onChange={(v) => u('affiliation', v)} cols={2} />
              </Field>

              <div className="flex gap-3 pt-1">
                <button onClick={() => setStep(1)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition flex items-center justify-center gap-1">
                  <ChevronLeft size={18} /> ย้อนกลับ
                </button>
                <button onClick={() => { if (s2ok) onSubmit(form); }} disabled={!s2ok}
                  className="flex-[2] bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  <Download size={18} /> ยืนยันและดาวน์โหลด
                </button>
              </div>
            </div>
          )}

          <p className="text-[11px] text-gray-400 text-center mt-4">
            ข้อมูลจะถูกเก็บในเบราว์เซอร์ของคุณ กรอกครั้งเดียวไม่ต้องกรอกซ้ำ
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserInfoModal;
