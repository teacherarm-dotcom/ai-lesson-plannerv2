import React, { useState, useEffect } from 'react';
import { X, Download, Mail, User, Building2, MapPin, GraduationCap, Briefcase, Shield } from 'lucide-react';

const STORAGE_KEY = 'user_info';

// Google Sheet Apps Script URL — set this to enable logging
const GOOGLE_SHEET_URL = '';

const POSITIONS = [
  'ครูพิเศษสอน', 'พนักงานราชการครู', 'ครูผู้ช่วย', 'ครู',
  'ครูชำนาญการ', 'ครูชำนาญการพิเศษ', 'ครูเชี่ยวชาญ', 'ครูเชี่ยวชาญพิเศษ',
  'รองผู้อำนวยการ', 'ผู้อำนวยการ', 'ศึกษานิเทศก์', 'อื่นๆ',
];

const REGIONS = [
  'ภาคใต้', 'ภาคกลาง', 'ภาคเหนือ', 'ภาคตะวันออกเฉียงเหนือ', 'ภาคตะวันออกและกรุงเทพมหานคร',
];

const AFFILIATIONS = ['รัฐบาล', 'เอกชน'];

export const getStoredUserInfo = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
};

export const setStoredUserInfo = (info) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
};

/**
 * Log download to Google Sheet (fire-and-forget, non-blocking)
 */
export const logDownloadToSheet = (userInfo, downloadMeta = {}) => {
  if (!GOOGLE_SHEET_URL) return;
  try {
    const payload = {
      ...userInfo,
      courseCode: downloadMeta.courseCode || '',
      courseName: downloadMeta.courseName || '',
      downloadType: downloadMeta.type || '',
      moduleName: downloadMeta.module || '',
      timestamp: new Date().toISOString(),
    };
    fetch(GOOGLE_SHEET_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {}); // silent fail
  } catch { /* ignore */ }
};

/**
 * Hook: wraps any download function with user info check.
 */
export const useDownloadWithUserInfo = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingDownload, setPendingDownload] = useState(null);

  const triggerDownload = (downloadFn) => {
    const existing = getStoredUserInfo();
    if (existing) {
      downloadFn();
    } else {
      setPendingDownload(() => downloadFn);
      setIsOpen(true);
    }
  };

  const handleSubmit = (info) => {
    setStoredUserInfo(info);
    setIsOpen(false);
    if (pendingDownload) {
      pendingDownload();
      setPendingDownload(null);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setPendingDownload(null);
  };

  return { isOpen, triggerDownload, handleSubmit, handleClose };
};

// --- Field Component ---
const Field = ({ icon: Icon, label, required, children }) => (
  <div>
    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
      {Icon && <Icon size={13} className="text-blue-500" />}
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
  </div>
);

const inputClass = 'w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition placeholder:text-gray-400';
const selectClass = `${inputClass} bg-gray-50 appearance-none`;

const UserInfoModal = ({ isOpen, onSubmit, onClose }) => {
  const [form, setForm] = useState({
    email: '', firstName: '', lastName: '', position: '', positionOther: '',
    department: '', college: '', region: '', affiliation: '',
  });
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredUserInfo();
      if (stored) setForm(stored);
      setStep(1);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const update = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const isStep1Valid = form.email.trim() && isEmailValid && form.firstName.trim() && form.lastName.trim();
  const isStep2Valid = form.position && form.college.trim() && form.region && form.affiliation;

  const handleSave = () => {
    if (!isStep2Valid) return;
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto relative">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 rounded-t-2xl text-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition">
            <X size={22} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2.5 rounded-xl">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">ลงทะเบียนก่อนดาวน์โหลด</h3>
              <p className="text-xs text-blue-200">กรอกข้อมูลครั้งเดียว ใช้ได้ตลอด ไม่ต้องกรอกซ้ำ</p>
            </div>
          </div>
          {/* Step indicator */}
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
            <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
              {/* Email */}
              <Field icon={Mail} label="อีเมล" required>
                <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)}
                  placeholder="example@email.com"
                  className={`${inputClass} ${form.email && !isEmailValid ? 'border-red-300 focus:ring-red-500' : ''}`} />
                {form.email && !isEmailValid && (
                  <p className="text-xs text-red-500 mt-1">กรุณากรอกอีเมลให้ถูกต้อง</p>
                )}
              </Field>

              {/* Name */}
              <div className="grid grid-cols-2 gap-3">
                <Field icon={User} label="ชื่อ" required>
                  <input type="text" value={form.firstName} onChange={(e) => update('firstName', e.target.value)}
                    placeholder="ชื่อ" className={inputClass} />
                </Field>
                <Field label="นามสกุล" required>
                  <input type="text" value={form.lastName} onChange={(e) => update('lastName', e.target.value)}
                    placeholder="นามสกุล" className={inputClass} />
                </Field>
              </div>

              {/* Position */}
              <Field icon={Briefcase} label="ตำแหน่ง" required>
                <select value={form.position} onChange={(e) => update('position', e.target.value)} className={selectClass}>
                  <option value="">-- เลือกตำแหน่ง --</option>
                  {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                {form.position === 'อื่นๆ' && (
                  <input type="text" value={form.positionOther} onChange={(e) => update('positionOther', e.target.value)}
                    placeholder="ระบุตำแหน่ง" className={`${inputClass} mt-2`} />
                )}
              </Field>

              <button onClick={() => setStep(2)} disabled={!isStep1Valid}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition shadow-lg disabled:opacity-40 disabled:cursor-not-allowed">
                ถัดไป →
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
              {/* Department */}
              <Field icon={GraduationCap} label="สาขาวิชา">
                <input type="text" value={form.department} onChange={(e) => update('department', e.target.value)}
                  placeholder="เช่น ช่างยนต์, บัญชี, คอมพิวเตอร์ธุรกิจ" className={inputClass} />
              </Field>

              {/* College */}
              <Field icon={Building2} label="วิทยาลัย" required>
                <input type="text" value={form.college} onChange={(e) => update('college', e.target.value)}
                  placeholder="เช่น วิทยาลัยเทคนิคสุราษฎร์ธานี" className={inputClass} />
              </Field>

              {/* Region */}
              <Field icon={MapPin} label="ภาค" required>
                <select value={form.region} onChange={(e) => update('region', e.target.value)} className={selectClass}>
                  <option value="">-- เลือกภาค --</option>
                  {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>

              {/* Affiliation */}
              <Field icon={Shield} label="สังกัด" required>
                <div className="flex gap-3">
                  {AFFILIATIONS.map((a) => (
                    <label key={a} className={`flex-1 flex items-center justify-center gap-2 cursor-pointer p-2.5 rounded-xl border-2 transition text-sm font-medium ${
                      form.affiliation === a
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                    }`}>
                      <input type="radio" name="affiliation" value={a} checked={form.affiliation === a}
                        onChange={(e) => update('affiliation', e.target.value)} className="sr-only" />
                      {a}
                    </label>
                  ))}
                </div>
              </Field>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(1)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition">
                  ← ย้อนกลับ
                </button>
                <button onClick={handleSave} disabled={!isStep2Valid}
                  className="flex-[2] bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  <Download size={18} /> ยืนยันและดาวน์โหลด
                </button>
              </div>
            </div>
          )}

          <p className="text-[11px] text-gray-400 text-center mt-4">
            ข้อมูลจะถูกเก็บไว้ในเบราว์เซอร์ของคุณ กรอกครั้งเดียวไม่ต้องกรอกซ้ำ
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserInfoModal;
