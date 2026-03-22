/**
 * Determine certificate level from course code prefix.
 */
export const getCourseLevel = (code) => {
  const c = (code || '').trim();
  if (c.startsWith('2'))
    return { text: 'ประกาศนียบัตรวิชาชีพ (ปวช.)', color: 'text-blue-700 bg-blue-100' };
  if (c.startsWith('3'))
    return { text: 'ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)', color: 'text-purple-700 bg-purple-100' };
  return { text: 'ไม่ระบุ (กรุณาตรวจสอบรหัสวิชา)', color: 'text-gray-600 bg-gray-100' };
};

/**
 * Parse theory / practice hours from a ratio string like "2-2-3".
 */
export const getTheoryPractice = (ratio) => {
  let theory = 0;
  let practice = 0;
  const match = ratio ? ratio.match(/(\d+)\s*[-–]\s*(\d+)/) : null;
  if (match) {
    theory = parseInt(match[1]);
    practice = parseInt(match[2]);
  }
  return { theory, practice };
};

/**
 * Total weekly hours = theory + practice.
 */
export const getWeeklyHours = (ratio) => {
  const { theory, practice } = getTheoryPractice(ratio);
  return theory + practice;
};

/**
 * Return weeks for CONTENT ONLY (excluding assessment).
 * ปวช. = 17 สัปดาห์เนื้อหา (+ 1 ประเมิน = รวม 18)
 * ปวส. = 15 สัปดาห์เนื้อหา (ประเมินแยกเป็นสัปดาห์ที่ 16)
 */
export const getWeeksFromCode = (code) => {
  const c = (code || '').trim();
  return c.startsWith('3') ? 15 : 17;
};

/**
 * Return short level label.
 */
export const getLevelLabel = (code) => {
  const c = (code || '').trim();
  return c.startsWith('3') ? 'ปวส.' : 'ปวช.';
};
