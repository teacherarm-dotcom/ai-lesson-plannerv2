import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { parseUnitTable } from '../../utils/markdownTable';
import MarkdownTableRenderer from './MarkdownTableRenderer';

const UnitTableWithTooltip = ({ markdown }) => {
  const [hoveredUnit, setHoveredUnit] = useState(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  const units = parseUnitTable(markdown);
  if (units.length === 0) return <MarkdownTableRenderer content={markdown} />;

  return (
    <div className="relative overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-bold text-gray-900 w-16">หน่วยที่</th>
            <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">ชื่อหน่วยการเรียนรู้</th>
            <th className="px-4 py-3 text-center text-sm font-bold text-gray-900 w-24">ทฤษฎี (ชม.)</th>
            <th className="px-4 py-3 text-center text-sm font-bold text-gray-900 w-24">ปฏิบัติ (ชม.)</th>
            <th className="px-4 py-3 text-center text-sm font-bold text-gray-900 w-24">รวม (ชม.)</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {units.map((unit, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-4 py-3 text-sm text-gray-700 align-top">{unit.no}</td>
              <td
                className="px-4 py-3 text-sm text-blue-700 font-medium align-top cursor-help hover:underline decoration-dashed decoration-blue-300 underline-offset-4"
                onMouseEnter={(e) => {
                  setHoveredUnit(unit);
                  setCursorPos({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  if (hoveredUnit) setCursorPos({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredUnit(null)}
              >
                {unit.name}
              </td>
              <td className="px-4 py-3 text-sm text-gray-700 text-center align-top">{unit.theory}</td>
              <td className="px-4 py-3 text-sm text-gray-700 text-center align-top">{unit.practice}</td>
              <td className="px-4 py-3 text-sm text-gray-700 text-center align-top font-bold">{unit.total}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {hoveredUnit && (
        <div
          className="fixed z-50 bg-gray-800 text-white p-4 rounded-lg shadow-xl max-w-sm pointer-events-none"
          style={{ left: `${cursorPos.x + 20}px`, top: `${cursorPos.y + 20}px` }}
        >
          <div className="font-bold mb-2 text-yellow-400 border-b border-gray-600 pb-1">
            หัวข้อเรื่อง (Topics)
          </div>
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            <ReactMarkdown>{hoveredUnit.topics}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnitTableWithTooltip;
