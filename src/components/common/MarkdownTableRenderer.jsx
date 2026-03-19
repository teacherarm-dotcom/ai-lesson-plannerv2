import React from 'react';
import ReactMarkdown from 'react-markdown';

const cleanMarkdown = (md) =>
  md.replace(/```markdown/g, '').replace(/```/g, '').trim();

const MarkdownTableRenderer = ({ content }) => {
  if (!content) return null;

  const clean = cleanMarkdown(content);
  const lines = clean.split('\n').map((l) => l.trim()).filter(Boolean);
  const sepIdx = lines.findIndex((l) => l.startsWith('|') && l.includes('---'));

  if (sepIdx === -1 || sepIdx === 0) {
    return (
      <div className="p-4 bg-gray-50 text-gray-700 whitespace-pre-wrap font-mono text-sm">
        {clean}
      </div>
    );
  }

  const headers = lines[sepIdx - 1]
    .split('|')
    .filter((c) => c.trim() !== '')
    .map((c) => c.trim());

  const rows = lines
    .slice(sepIdx + 1)
    .filter((l) => l.startsWith('|'))
    .map((line) =>
      line
        .split('|')
        .filter((_, i, arr) => i !== 0 && i !== arr.length - 1)
        .map((c) => (c ? c.trim() : ''))
    );

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-100">
          <tr>
            {headers.map((header, idx) => (
              <th
                key={idx}
                className="px-4 py-3 text-left text-sm font-bold text-gray-900 uppercase tracking-wider border-r border-gray-200 last:border-r-0 whitespace-nowrap"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.map((row, rIdx) => (
            <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {row.map((cell, cIdx) => (
                <td
                  key={cIdx}
                  className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200 last:border-r-0 align-top"
                >
                  {cell.split(/<br\s*\/?>/i).map((line, i) => (
                    <div key={i} className="mb-1 last:mb-0">
                      <ReactMarkdown>{line}</ReactMarkdown>
                    </div>
                  ))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MarkdownTableRenderer;
