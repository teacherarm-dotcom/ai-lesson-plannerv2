import React from 'react';
import { Table as TableIcon, Target, Zap, ListChecks, Lightbulb, LayoutDashboard } from 'lucide-react';

export const MENU_ITEMS = [
  { id: 'analysis', label: 'วิเคราะห์งาน/หน่วยการเรียนรู้', icon: <TableIcon size={20} /> },
  { id: 'learning_outcomes', label: 'ผลลัพธ์การเรียนรู้ประจำหน่วย', icon: <Target size={20} /> },
  { id: 'competencies', label: 'สมรรถนะประจำหน่วย', icon: <Zap size={20} /> },
  { id: 'objectives', label: 'จุดประสงค์เชิงพฤติกรรม', icon: <ListChecks size={20} /> },
  { id: 'concept', label: 'สาระสำคัญ', icon: <Lightbulb size={20} /> },
  { id: 'admin', label: 'Admin Dashboard', icon: <LayoutDashboard size={20} />, isAdmin: true },
];
