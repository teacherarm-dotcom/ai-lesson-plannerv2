import React, { useState, useEffect } from 'react';
import { Youtube, Scissors, Settings, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';

const STATUS = {
  unchecked: { label: 'ยังไม่ได้ตั้งค่า', color: 'bg-gray-100 border-gray-300 text-gray-600', icon: AlertTriangle, iconColor: 'text-gray-400' },
  checking: { label: 'กำลังตรวจสอบ...', color: 'bg-yellow-50 border-yellow-300 text-yellow-700', icon: Loader2, iconColor: 'text-yellow-500', spin: true },
  ok: { label: 'พร้อมใช้งาน', color: 'bg-green-50 border-green-300 text-green-700', icon: CheckCircle, iconColor: 'text-green-500' },
  error: { label: 'ใช้งานไม่ได้', color: 'bg-red-50 border-red-300 text-red-700', icon: XCircle, iconColor: 'text-red-500' },
};

const TopToolsBar = ({ onOpenPdfTool, onOpenApiKeyModal, providerName, providerId, apiKey }) => {
  const [status, setStatus] = useState('unchecked');
  const [errorDetail, setErrorDetail] = useState('');

  useEffect(() => {
    if (!apiKey || !providerId) {
      setStatus('unchecked');
      setErrorDetail('');
      return;
    }

    let cancelled = false;
    const checkApi = async () => {
      setStatus('checking');
      setErrorDetail('');
      try {
        const { createProvider } = await import('../../providers/index');
        const provider = createProvider(providerId, apiKey);
        // Send a tiny test message
        const result = await provider.sendMessage('ตอบแค่คำว่า "ok"', [], {});
        if (!cancelled) {
          if (result) {
            setStatus('ok');
          } else {
            setStatus('error');
            setErrorDetail('ไม่ได้รับการตอบกลับ');
          }
        }
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          setErrorDetail(err.message || 'ไม่สามารถเชื่อมต่อได้');
        }
      }
    };

    checkApi();
    return () => { cancelled = true; };
  }, [providerId, apiKey]);

  const s = STATUS[status] || STATUS.unchecked;
  const Icon = s.icon;

  return (
    <div className="flex justify-end mb-4 gap-3 flex-wrap">
      {/* API Status Badge */}
      <button
        onClick={onOpenApiKeyModal}
        title={errorDetail || s.label}
        className={`px-3 py-2 rounded-lg text-sm font-medium transition shadow-sm flex items-center gap-1.5 border ${s.color}`}
      >
        <Icon size={14} className={`${s.iconColor} ${s.spin ? 'animate-spin' : ''}`} />
        {providerName || 'AI'}: {s.label}
      </button>

      <a
        href="https://youtu.be/FjoTMFQMmnI"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-3 py-2 rounded-lg text-sm font-medium transition shadow-sm flex items-center gap-1.5 no-underline"
      >
        <Youtube size={16} className="text-red-500" /> ดูวิธีใช้งาน
      </a>
      <button
        onClick={onOpenPdfTool}
        className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-3 py-2 rounded-lg text-sm font-medium transition shadow-sm flex items-center gap-1.5"
      >
        <Scissors size={14} className="text-pink-500" /> เครื่องมือตัด PDF
      </button>
    </div>
  );
};

export default TopToolsBar;
