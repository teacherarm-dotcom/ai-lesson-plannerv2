import React, { useState, useEffect } from 'react';
import { Edit3, Save, X, Plus, Trash2 } from 'lucide-react';
import { parseUnitTable } from '../../utils/markdownTable';

const EditableUnitTable = ({ markdown, onSave, courseCode }) => {
  const [units, setUnits] = useState([]);
  const [editing, setEditing] = useState(false);
  const [assessTheory, setAssessTheory] = useState('');
  const [assessPractice, setAssessPractice] = useState('');

  useEffect(() => {
    if (markdown) {
      setUnits(parseUnitTable(markdown));
    }
  }, [markdown]);

  if (units.length === 0) return null;

  // Course level
  const isAdvanced = courseCode && courseCode.trim().startsWith('3');
  const totalWeeks = isAdvanced ? 15 : 18;

  const update = (idx, key, value) => {
    setUnits((prev) => prev.map((u, i) => (i === idx ? { ...u, [key]: value } : u)));
  };

  const addUnit = () => {
    const nextNo = units.length + 1;
    setUnits((prev) => [...prev, { no: `หน่วยที่ ${nextNo}`, name: '', topics: '', theory: '0', practice: '0', total: '0' }]);
  };

  const removeUnit = (idx) => {
    if (units.length <= 1) return;
    setUnits((prev) => prev.filter((_, i) => i !== idx).map((u, i) => ({ ...u, no: `หน่วยที่ ${i + 1}` })));
  };

  const recalcTotal = (idx) => {
    setUnits((prev) => prev.map((u, i) => {
      if (i !== idx) return u;
      const t = parseInt(u.theory) || 0;
      const p = parseInt(u.practice) || 0;
      return { ...u, total: String(t + p) };
    }));
  };

  const handleSave = () => {
    setEditing(false);
    const header = '| หน่วยที่ | ชื่อหน่วยการเรียนรู้ | หัวข้อเรื่อง (Topics) | ทฤษฎี (ชม.) | ปฏิบัติ (ชม.) | รวม (ชม.) |';
    const sep = '| --- | --- | --- | --- | --- | --- |';
    const rows = units.map((u) =>
      `| ${u.no} | ${u.name} | ${u.topics} | ${u.theory} | ${u.practice} | ${u.total} |`
    ).join('\n');
    const newMarkdown = `${header}\n${sep}\n${rows}`;
    if (onSave) onSave(newMarkdown);
  };

  // Totals (units only)
  const unitTheory = units.reduce((s, u) => s + (parseInt(u.theory) || 0), 0);
  const unitPractice = units.reduce((s, u) => s + (parseInt(u.practice) || 0), 0);
  const unitTotal = units.reduce((s, u) => s + (parseInt(u.total) || 0), 0);

  // Assessment
  const at = parseInt(assessTheory) || 0;
  const ap = parseInt(assessPractice) || 0;
  const assessTotal = at + ap;

  // Grand total
  const grandTheory = unitTheory + at;
  const grandPractice = unitPractice + ap;
  const grandTotal = unitTotal + assessTotal;

  return (
    <div>
      {/* Toggle edit button */}
      <div className="flex justify-end mb-2">
        {!editing ? (
          <button onClick={() => setEditing(true)}
            className="flex items-center gap-1 bg-amber-50 border border-amber-300 text-amber-700 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition text-xs font-medium">
            <Edit3 size={14} /> แก้ไขตาราง
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={addUnit}
              className="flex items-center gap-1 bg-green-50 border border-green-300 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100 transition text-xs font-medium">
              <Plus size={14} /> เพิ่มหน่วย
            </button>
            <button onClick={handleSave}
              className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition text-xs font-medium shadow-sm">
              <Save size={14} /> บันทึก
            </button>
            <button onClick={() => { setEditing(false); setUnits(parseUnitTable(markdown)); }}
              className="flex items-center gap-1 bg-gray-100 border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition text-xs font-medium">
              <X size={14} /> ยกเลิก
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-3 text-left text-sm font-bold text-gray-900 w-16">หน่วยที่</th>
              <th className="px-3 py-3 text-left text-sm font-bold text-gray-900">ชื่อหน่วยการเรียนรู้</th>
              {editing && <th className="px-3 py-3 text-left text-sm font-bold text-gray-900">หัวข้อเรื่อง</th>}
              <th className="px-3 py-3 text-center text-sm font-bold text-gray-900 w-20">ทฤษฎี</th>
              <th className="px-3 py-3 text-center text-sm font-bold text-gray-900 w-20">ปฏิบัติ</th>
              <th className="px-3 py-3 text-center text-sm font-bold text-gray-900 w-20">รวม</th>
              {editing && <th className="px-3 py-3 w-10"></th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {units.map((unit, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-3 py-2 text-sm text-gray-700 align-top">
                  {editing ? <span className="text-gray-500 text-xs">{idx + 1}</span> : unit.no}
                </td>
                <td className="px-3 py-2 text-sm align-top">
                  {editing ? (
                    <input type="text" value={unit.name} onChange={(e) => update(idx, 'name', e.target.value)}
                      className="w-full p-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500" />
                  ) : (
                    <span className="text-blue-700 font-medium">{unit.name}</span>
                  )}
                </td>
                {editing && (
                  <td className="px-3 py-2 text-sm align-top">
                    <textarea value={unit.topics} onChange={(e) => update(idx, 'topics', e.target.value)}
                      rows={3} className="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500" />
                  </td>
                )}
                <td className="px-3 py-2 text-sm text-center align-top">
                  {editing ? (
                    <input type="number" value={unit.theory}
                      onChange={(e) => { update(idx, 'theory', e.target.value); setTimeout(() => recalcTotal(idx), 0); }}
                      className="w-16 p-1.5 border border-gray-300 rounded text-sm text-center focus:ring-2 focus:ring-blue-500" />
                  ) : unit.theory}
                </td>
                <td className="px-3 py-2 text-sm text-center align-top">
                  {editing ? (
                    <input type="number" value={unit.practice}
                      onChange={(e) => { update(idx, 'practice', e.target.value); setTimeout(() => recalcTotal(idx), 0); }}
                      className="w-16 p-1.5 border border-gray-300 rounded text-sm text-center focus:ring-2 focus:ring-blue-500" />
                  ) : unit.practice}
                </td>
                <td className="px-3 py-2 text-sm text-center align-top font-bold">{unit.total}</td>
                {editing && (
                  <td className="px-3 py-2 align-top">
                    <button onClick={() => removeUnit(idx)} disabled={units.length <= 1}
                      className="text-red-400 hover:text-red-600 disabled:opacity-30 p-1">
                      <Trash2 size={14} />
                    </button>
                  </td>
                )}
              </tr>
            ))}

            {/* Assessment row */}
            <tr className="bg-amber-50 border-t-2 border-amber-300">
              <td colSpan={editing ? 3 : 2} className="px-3 py-2.5 text-sm font-bold text-amber-800 text-center">
                ประเมินผลลัพธ์การเรียนรู้
              </td>
              <td className="px-2 py-2 text-center">
                <input
                  type="number" min="0" value={assessTheory}
                  onChange={(e) => setAssessTheory(e.target.value)}
                  placeholder="0"
                  className="w-16 text-center border border-amber-300 rounded-lg py-1 px-1 text-sm focus:ring-2 focus:ring-amber-400 bg-white"
                />
              </td>
              <td className="px-2 py-2 text-center">
                <input
                  type="number" min="0" value={assessPractice}
                  onChange={(e) => setAssessPractice(e.target.value)}
                  placeholder="0"
                  className="w-16 text-center border border-amber-300 rounded-lg py-1 px-1 text-sm focus:ring-2 focus:ring-amber-400 bg-white"
                />
              </td>
              <td className="px-3 py-2.5 text-sm font-bold text-amber-800 text-center">
                {assessTotal > 0 ? assessTotal : '-'}
              </td>
              {editing && <td></td>}
            </tr>
          </tbody>

          {/* Grand total footer */}
          <tfoot className="bg-blue-50 border-t-2 border-blue-300">
            <tr>
              <td colSpan={editing ? 3 : 2} className="px-3 py-2.5 text-sm font-bold text-right text-blue-900">
                รวมทั้งสิ้น ({isAdvanced ? 'ปวส.' : 'ปวช.'} {totalWeeks} สัปดาห์)
              </td>
              <td className="px-3 py-2.5 text-sm font-bold text-center text-blue-900">{grandTheory}</td>
              <td className="px-3 py-2.5 text-sm font-bold text-center text-blue-900">{grandPractice}</td>
              <td className="px-3 py-2.5 text-base font-bold text-center text-blue-900">{grandTotal}</td>
              {editing && <td></td>}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default EditableUnitTable;
