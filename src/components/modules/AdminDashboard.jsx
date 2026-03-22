import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Eye, Download, Sparkles, Users, Lock, Loader2, RefreshCw, Search, ChevronDown, ChevronUp, BarChart3, MapPin, Building2, GraduationCap, Calendar, Mail, FileText, TrendingUp, LogOut } from 'lucide-react';

const ADMIN_CODE = '112233';
const SHEET_URL = 'https://script.google.com/macros/s/AKfycbyxjQPVEx1FGPOvkCZ43V4STKKhY6VCgodo-A25ykPGiCWaIJGxDe8IvWBvNXcP7GLz/exec';

const StatCard = ({ icon: Icon, label, value, color, bgColor }) => (
  <div className={`${bgColor} rounded-xl p-4 border`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className={`text-2xl font-bold ${color} mt-1`}>{typeof value === 'number' ? value.toLocaleString() : value}</p>
      </div>
      <div className={`p-3 rounded-full ${bgColor}`}>
        <Icon size={24} className={color} />
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [sortField, setSortField] = useState('date');
  const [sortAsc, setSortAsc] = useState(false);

  const handleLogin = () => {
    if (code === ADMIN_CODE) {
      setIsLoggedIn(true);
      setCodeError('');
      fetchData();
    } else {
      setCodeError('รหัสไม่ถูกต้อง');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${SHEET_URL}?action=dashboard`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      // Try with no-cors fallback
      setData({ users: [], stats: [], summary: { totalUsers: 0, totalEvents: 0, totalVisits: 0, totalDownloads: 0, totalGenerations: 0 } });
    } finally {
      setLoading(false);
    }
  };

  // Login screen
  if (!isLoggedIn) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 min-h-[80vh] flex items-center justify-center">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="bg-blue-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <Lock className="text-blue-600 w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Admin Dashboard</h2>
            <p className="text-gray-500 text-sm mt-1">กรุณาใส่รหัสแอดมินเพื่อเข้าใช้งาน</p>
          </div>
          <div className="space-y-4">
            <div>
              <input
                type="password"
                value={code}
                onChange={(e) => { setCode(e.target.value); setCodeError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="ใส่รหัสแอดมิน"
                className="w-full p-3 border border-gray-300 rounded-xl text-center text-lg tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
              {codeError && <p className="text-red-500 text-sm text-center mt-2">{codeError}</p>}
            </div>
            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg flex items-center justify-center gap-2"
            >
              <Lock size={18} /> เข้าสู่ระบบ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading
  if (loading && !data) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">กำลังโหลดข้อมูล Dashboard...</p>
        </div>
      </div>
    );
  }

  const summary = data?.summary || {};
  const users = data?.users || [];
  const stats = data?.stats || [];

  // Region summary
  const regionCounts = {};
  users.forEach((u) => { const r = u.region || 'ไม่ระบุ'; regionCounts[r] = (regionCounts[r] || 0) + 1; });

  // Affiliation summary
  const affiliationCounts = {};
  users.forEach((u) => { const a = u.affiliation || 'ไม่ระบุ'; affiliationCounts[a] = (affiliationCounts[a] || 0) + 1; });

  // Position summary
  const positionCounts = {};
  users.forEach((u) => { const p = u.position || 'ไม่ระบุ'; positionCounts[p] = (positionCounts[p] || 0) + 1; });

  // Province summary
  const provinceCounts = {};
  users.forEach((u) => { const p = u.province || 'ไม่ระบุ'; provinceCounts[p] = (provinceCounts[p] || 0) + 1; });

  // Filter users by search
  const filteredUsers = users.filter((u) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return [u.firstName, u.lastName, u.email, u.college, u.province, u.department, u.course]
      .some((f) => f && String(f).toLowerCase().includes(term));
  });

  // Sort
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const av = a[sortField] || '';
    const bv = b[sortField] || '';
    return sortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  });

  const toggleSort = (field) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  const renderBarChart = (counts, color) => {
    const max = Math.max(...Object.values(counts), 1);
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return (
      <div className="space-y-2">
        {sorted.map(([label, count]) => (
          <div key={label} className="flex items-center gap-2">
            <span className="text-xs text-gray-600 w-40 truncate text-right">{label}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
              <div className={`h-full ${color} rounded-full flex items-center justify-end pr-2 text-[10px] font-bold text-white transition-all duration-500`} style={{ width: `${Math.max((count / max) * 100, 8)}%` }}>
                {count}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const tabs = [
    { id: 'overview', label: 'ภาพรวม', icon: BarChart3 },
    { id: 'users', label: 'ผู้ใช้งาน', icon: Users },
    { id: 'activity', label: 'กิจกรรม', icon: TrendingUp },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 min-h-[80vh]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <LayoutDashboard className="text-blue-600" /> Admin Dashboard
          </h2>
          <p className="text-gray-500 text-sm mt-1">สถิติการใช้งานระบบ AI ช่วยทำแผนการสอน</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} disabled={loading} className="bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 text-sm font-medium flex items-center gap-1.5 border border-blue-200">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> รีเฟรช
          </button>
          <button onClick={() => { setIsLoggedIn(false); setCode(''); }} className="bg-gray-50 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-100 text-sm font-medium flex items-center gap-1.5 border border-gray-200">
            <LogOut size={14} /> ออกจากระบบ
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Users} label="ผู้ใช้งานทั้งหมด" value={summary.totalUsers || 0} color="text-blue-600" bgColor="bg-blue-50 border-blue-200" />
        <StatCard icon={Eye} label="เข้าใช้งาน" value={summary.totalVisits || 0} color="text-green-600" bgColor="bg-green-50 border-green-200" />
        <StatCard icon={Sparkles} label="สร้างแผนฯ" value={summary.totalGenerations || 0} color="text-purple-600" bgColor="bg-purple-50 border-purple-200" />
        <StatCard icon={Download} label="ดาวน์โหลด" value={summary.totalDownloads || 0} color="text-orange-600" bgColor="bg-orange-50 border-orange-200" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === tab.id ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon size={15} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1.5"><MapPin size={14} className="text-blue-500" /> จำแนกตามภาค</h3>
            {renderBarChart(regionCounts, 'bg-blue-500')}
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1.5"><Building2 size={14} className="text-green-500" /> จำแนกตามสังกัด</h3>
            {renderBarChart(affiliationCounts, 'bg-green-500')}
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1.5"><GraduationCap size={14} className="text-purple-500" /> จำแนกตามตำแหน่ง</h3>
            {renderBarChart(positionCounts, 'bg-purple-500')}
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1.5"><MapPin size={14} className="text-orange-500" /> จำแนกตามจังหวัด (Top 10)</h3>
            {renderBarChart(Object.fromEntries(Object.entries(provinceCounts).sort((a, b) => b[1] - a[1]).slice(0, 10)), 'bg-orange-500')}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาชื่อ, วิทยาลัย, จังหวัด, อีเมล..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap">{sortedUsers.length} รายการ</span>
          </div>
          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-bold text-gray-600">#</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-600 cursor-pointer hover:text-blue-600" onClick={() => toggleSort('date')}>
                    <span className="flex items-center gap-1">วันที่ <SortIcon field="date" /></span>
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-gray-600 cursor-pointer hover:text-blue-600" onClick={() => toggleSort('firstName')}>
                    <span className="flex items-center gap-1">ชื่อ-นามสกุล <SortIcon field="firstName" /></span>
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-gray-600">อีเมล</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-600">ตำแหน่ง/วิทยฐานะ</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-600 cursor-pointer hover:text-blue-600" onClick={() => toggleSort('college')}>
                    <span className="flex items-center gap-1">วิทยาลัย <SortIcon field="college" /></span>
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-gray-600 cursor-pointer hover:text-blue-600" onClick={() => toggleSort('province')}>
                    <span className="flex items-center gap-1">จังหวัด <SortIcon field="province" /></span>
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-gray-600">ภาค/สังกัด</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-600">รายวิชา</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {sortedUsers.length === 0 ? (
                  <tr><td colSpan={9} className="px-3 py-8 text-center text-gray-400">ไม่พบข้อมูล</td></tr>
                ) : sortedUsers.map((u, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/30">
                    <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{u.date}</td>
                    <td className="px-3 py-2 font-medium text-gray-800">{u.prefix}{u.firstName} {u.lastName}</td>
                    <td className="px-3 py-2 text-blue-600">{u.email}</td>
                    <td className="px-3 py-2 text-gray-600">{u.position}{u.academicRank && u.academicRank !== 'ไม่มี' ? ` (${u.academicRank})` : ''}</td>
                    <td className="px-3 py-2 text-gray-600">{u.college}</td>
                    <td className="px-3 py-2 text-gray-600">{u.province}</td>
                    <td className="px-3 py-2 text-gray-600">{u.region} / {u.affiliation}</td>
                    <td className="px-3 py-2 text-gray-600 max-w-[200px] truncate">{u.course}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div>
          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-bold text-gray-600">#</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-600">วันที่</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-600">เหตุการณ์</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-600">รายละเอียด</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {stats.length === 0 ? (
                  <tr><td colSpan={4} className="px-3 py-8 text-center text-gray-400">ไม่พบข้อมูล</td></tr>
                ) : [...stats].reverse().slice(0, 100).map((s, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/30">
                    <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{s.date}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        s.event === 'เข้าใช้งาน' ? 'bg-blue-100 text-blue-700' :
                        s.event === 'ดาวน์โหลด' ? 'bg-green-100 text-green-700' :
                        s.event === 'สร้างแผนฯ' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {s.event}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-600">{s.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {stats.length > 100 && (
            <p className="text-xs text-gray-400 text-center mt-2">แสดง 100 รายการล่าสุด จากทั้งหมด {stats.length} รายการ</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
