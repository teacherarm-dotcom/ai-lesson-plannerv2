import React from 'react';
import { BookOpen, ChevronRight, Facebook, Youtube, Globe, Instagram } from 'lucide-react';
import { MENU_ITEMS } from '../../constants/menuItems.jsx';

const TikTokIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const Sidebar = ({ activeMenu, setActiveMenu, onMobileClose }) => {
  const handleClick = (id) => {
    setActiveMenu(id);
    onMobileClose?.();
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 sticky top-4 h-auto md:min-h-[calc(100vh-2rem)] flex flex-col">
      {/* Logo */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="bg-white/20 p-2 rounded-lg"><BookOpen className="w-6 h-6 text-white" /></div>
          <div>
            <h1 className="font-bold text-xl leading-tight">AI ช่วยทำ<br />แผนการสอน</h1>
            <p className="text-xs text-blue-200">ผู้ช่วยครูอาชีวะ (AI) v2</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="space-y-2 flex-1">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => handleClick(item.id)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
              activeMenu === item.id
                ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100 font-semibold'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={activeMenu === item.id ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}>
                {item.icon}
              </div>
              <span className="text-sm text-left">{item.label}</span>
            </div>
            {activeMenu === item.id && <ChevronRight size={16} className="text-blue-500" />}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-6 border-t border-gray-100 text-center">
        <div className="text-xs text-gray-400 mb-1">พัฒนาโดย นายอำนาจ เสมอวงศ์</div>
        <div className="text-xs text-gray-400 mb-2">ศสพ.ภาคใต้</div>
        <div className="flex justify-center gap-3 text-gray-400">
          <a href="https://www.facebook.com/kruarm55" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition" title="Facebook"><Facebook size={16} /></a>
          <a href="https://www.youtube.com/@kruarm55" target="_blank" rel="noopener noreferrer" className="hover:text-red-600 transition" title="Youtube"><Youtube size={16} /></a>
          <a href="https://www.tiktok.com/@kruarm55" target="_blank" rel="noopener noreferrer" className="hover:text-pink-500 transition" title="TikTok"><TikTokIcon /></a>
          <a href="https://www.instagram.com/kruarm555" target="_blank" rel="noopener noreferrer" className="hover:text-pink-600 transition" title="Instagram"><Instagram size={16} /></a>
          <a href="http://www.kruarm.net" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition" title="Website"><Globe size={16} /></a>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
