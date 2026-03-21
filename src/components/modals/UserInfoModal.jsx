import React, { useState, useEffect } from 'react';
import { X, User, Download } from 'lucide-react';

const STORAGE_KEY = 'user_info';

const POSITIONS = [
  'ครูพิเศษสอน', 'พนักงานราชการครู', 'ครูผู้ช่วย', 'ครู',
  'ครูชำนาญการ', 'ครูชำนาญการพิเศษ', 'ครูเชี่ยวชาญ', 'ครูเชี่ยวชาญพิเศษ',
  'รองผู้อำนวยการ', 'ผู้อำนวยการ', 'ศึกษานิเทศก์', 'อื่นๆ',
];

const REGIONS = [
  'ใต้', 'กลาง', 'เหนือ', 'ตะวันออกเฉียงเหนือ', 'ตะวันออกและกรุงเทพมหานคร',
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
 * Hook: wraps any download function with user info check.
 * If user info already exists → run download directly.
 * If not → open modal, then run download after submit.
 */
export const useDownloadWithUserInfo = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingDownload, setPendingDownload] = useState(null);

  const triggerDownload = (downloadFn) => {
    const existing = getStoredUserInfo();
    if (existing) {
      // Already has info, download directly
      downloadFn();
    } else {
      // Need info first
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

const UserInfoModal = ({ isOpen, onSubmit, onClose }) => {
  const [form, setForm] = useState({
    firstName: '', lastName: '', position: '', positionOther: '',
    department: '', college: '', region: '', affiliation: '',
  });

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredUserInfo();
      if (stored) setForm(stored);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const update = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const isValid = form.firstName.trim() && form.lastName.trim() && form.position && form.college.trim() && form.region && form.affiliation;

  const handleSave = () => {
    if (!isValid) return;
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="bg-blue-100 p-3 rounded-full">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">กรอกข้อมูลผู้ใช้งาน</h3>
            <p className="text-xs text-gray-500">กรอกครั้งเดียว ใช้ได้ตลอด</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">ชื่อ *</label>
              <input type="text" value={form.firstName} onChange={(e) => update('firstName', e.target.value)}
                placeholder="ชื่อ" className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">นามสกุล *</label>
              <input type="text" value={form.lastName} onChange={(e) => update('lastName', e.target.value)}
                placeholder="นามสกุล" className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* Position */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">ตำแหน่ง *</label>
            <select value={form.position} onChange={(e) => update('position', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">-- เลือกตำแหน่ง --</option>
              {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            {form.position === 'อื่นๆ' && (
              <input type="text" value={form.positionOther} onChange={(e) => update('positionOther', e.target.value)}
                placeholder="ระบุตำแหน่ง" className="w-full mt-2 p-2 border border-gray-300 rounded-lg text-sm" />
            )}
          </div>

          {/* Department */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">สาขาวิชา</label>
            <input type="text" value={form.department} onChange={(e) => update('department', e.target.value)}
              placeholder="เช่น ช่างยนต์, บัญชี, คอมพิวเตอร์ธุรกิจ" className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* College */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">วิทยาลัย *</label>
            <input type="text" value={form.college} onChange={(e) => update('college', e.target.value)}
              placeholder="เช่น วิทยาลัยเทคนิคสุราษฎร์ธานี" className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Region */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">ภาค *</label>
            <select value={form.region} onChange={(e) => update('region', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">-- เลือกภาค --</option>
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Affiliation */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">สังกัด *</label>
            <div className="flex gap-3">
              {AFFILIATIONS.map((a) => (
                <label key={a} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="affiliation" value={a} checked={form.affiliation === a}
                    onChange={(e) => update('affiliation', e.target.value)} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-700">{a}</span>
                </label>
              ))}
            </div>
          </div>

          <button onClick={handleSave} disabled={!isValid}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4">
            <Download size={18} /> บันทึกและดาวน์โหลด
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserInfoModal;
