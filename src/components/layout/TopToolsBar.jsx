import React from 'react';
import { Youtube, Scissors, Settings } from 'lucide-react';

const TopToolsBar = ({ onOpenPdfTool, onOpenApiKeyModal, providerName }) => (
  <div className="flex justify-end mb-4 gap-3 flex-wrap">
    <button
      onClick={onOpenApiKeyModal}
      className="bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 px-3 py-2 rounded-lg text-sm font-medium transition shadow-sm flex items-center gap-1.5"
    >
      <Settings size={14} />
      ตั้งค่า AI {providerName ? `(${providerName})` : ''}
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

export default TopToolsBar;
