import React, { useState, useEffect } from 'react';
import { Edit3, Save, X, Plus, Trash2 } from 'lucide-react';
import { parseUnitTable } from '../../utils/markdownTable';

const EditableUnitTable = ({ markdown, onSave, courseCode }) => {
  const [units, setUnits] = useState([]);
  const [editing, setEditing] = useState(false);
  const [showAssessment, setShowAssessment] = useState(true);

  // Course level
  const isAdvanced = courseCode && courseCode.trim().startsWith('3');

  useEffect(() => {
    if (markdown) {
      setUnits(parseUnitTable(markdown));
    }
  }, [markdown]);

  if (units.length === 0) return null;

  // Calculate theory/practice per week from ratio (from first unit or courseCode pattern)
  const getWeeklyHours = () => {
    // Try to detect from units: find most common theory/practice values
    const theories = units.map(u => parseInt(u.theory) || 0).filter(v => v > 0);
    const practices = units.map(u => parseInt(u.practice) || 0).filter(v => v > 0);
    // Use minimum non-zero values as likely per-week hours
    const minT = theories.length > 0 ? Math.min(...theories) : 2;
    const minP = practices.length > 0 ? Math.min(...practices) : 2;
    return { weeklyTheory: minT, weeklyPractice: minP };
  };

  const { weeklyTheory, weeklyPractice } = getWeeklyHours();

  // Assessment = 1 week
  const assessTheory = showAssessment ? weeklyTheory : 0;
  const assessPractice = showAssessment ? weeklyPractice : 0;
  const assessTotal = assessTheory + assessPractice;

  // ปวช. = 18 สัปดาห์ (รวมประเมินแล้ว)
  // ปวส. = 15 สัปดาห์ (ไม่รวมประเมิน, ประเมินเป็นสัปดาห์ที่ 16 แยกต่างหาก)
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

  // Grand total
  // ปวช.: รวมประเมินใน grand total (18 สัปดาห์รวมประเมิน)
  // ปวส.: ไม่รวมประเมินใน grand total (15 สัปดาห์ + ประเมินแยก)
  const grandTheory = isAdvanced ? unitTheory : unitTheory + assessTheory;
  const grandPractice = isAdvanced ? unitPractice : unitPractice + assessPractice;
  const grandTotal = isAdvanced ? unitTotal : unitTotal + assessTotal;

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
            {showAssessment && (
              <tr className="bg-amber-50 border-t-2 border-amber-300">
                <td colSpan={editing ? 3 : 2} className="px-3 py-2.5 text-sm font-bold text-amber-800">
                  <div className="flex items-center justify-between">
                    <span>ประเมินผลลัพธ์การเรียนรู้ (1 สัปดาห์)</span>
                    <button
                      onClick={() => setShowAssessment(false)}
                      className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition"
                      title="ลบแถวประเมินผลลัพธ์การเรียนรู้"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-sm font-bold text-amber-800 text-center">{assessTheory}</td>
                <td className="px-3 py-2.5 text-sm font-bold text-amber-800 text-center">{assessPractice}</td>
                <td className="px-3 py-2.5 text-sm font-bold text-amber-800 text-center">{assessTotal}</td>
                {editing && <td></td>}
              </tr>
            )}

            {/* Re-add assessment button (if deleted) */}
            {!showAssessment && (
              <tr className="bg-gray-50 border-t border-gray-200">
                <td colSpan={editing ? 7 : 5} className="px-3 py-2 text-center">
                  <button
                    onClick={() => setShowAssessment(true)}
                    className="text-xs text-amber-600 hover:text-amber-800 font-medium flex items-center gap-1 mx-auto"
                  >
                    <Plus size={13} /> เพิ่มแถวประเมินผลลัพธ์การเรียนรู้
                  </button>
                </td>
              </tr>
            )}
          </tbody>

          {/* Grand total footer */}
          <tfoot className="bg-blue-50 border-t-2 border-blue-300">
            <tr>
              <td colSpan={editing ? 3 : 2} className="px-3 py-2.5 text-sm font-bold text-right text-blue-900">
                รวมทั้งสิ้น ({isAdvanced ? `ปวส. ${totalWeeks} สัปดาห์${showAssessment ? ' + ประเมิน 1 สัปดาห์' : ''}` : `ปวช. ${totalWeeks} สัปดาห์`})
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
