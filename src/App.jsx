import React, { useState } from 'react';
import { BookOpen, Menu, Table as TableIcon } from 'lucide-react';

import Sidebar from './components/layout/Sidebar';
import TopToolsBar from './components/layout/TopToolsBar';
import ErrorPopup from './components/common/ErrorPopup';
import PdfSplitterModal from './components/modals/PdfSplitterModal';
import StandardSearchPopup from './components/modals/StandardSearchPopup';
import ApiKeyModal from './components/modals/ApiKeyModal';

import AnalysisModule from './components/modules/AnalysisModule';
import LearningOutcomesModule from './components/modules/LearningOutcomesModule';
import CompetencyModule from './components/modules/CompetencyModule';
import ObjectivesModule from './components/modules/ObjectivesModule';
import ConceptModule from './components/modules/ConceptModule';

import { getStoredProvider, setStoredProvider, getStoredApiKey, setStoredApiKey } from './hooks/useAiApi';
import { getProviderMeta } from './providers/index';

const EMPTY_FORM = {
  courseCode: '', courseName: '', credits: '', ratio: '',
  standardRef: '', learningOutcomes: '', objectives: '',
  competencies: '', description: '',
};

export default function App() {
  // --- AI Provider + Key ---
  const [providerId, setProviderId] = useState(getStoredProvider);
  const [apiKey, setApiKey] = useState(() => getStoredApiKey(getStoredProvider()));
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(!getStoredApiKey(getStoredProvider()));

  const handleSaveProvider = (newProviderId, newKey) => {
    setStoredProvider(newProviderId);
    setStoredApiKey(newProviderId, newKey);
    setProviderId(newProviderId);
    setApiKey(newKey);
  };

  const providerMeta = getProviderMeta(providerId);

  // --- Global UI state ---
  const [activeMenu, setActiveMenu] = useState('analysis');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [error, setError] = useState(null);
  const [isPdfToolOpen, setIsPdfToolOpen] = useState(false);
  const [isStandardPopupOpen, setIsStandardPopupOpen] = useState(false);

  // --- Shared data ---
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [unitDivisionPlan, setUnitDivisionPlan] = useState(null);
  const [loResults, setLoResults] = useState(null);
  const [compResults, setCompResults] = useState(null);
  const [objResults, setObjResults] = useState(null);
  const [conceptResults, setConceptResults] = useState(null);

  const navigate = (menuId) => setActiveMenu(menuId);

  // Common props for all modules
  const aiProps = { providerId, apiKey };

  const renderModule = () => {
    switch (activeMenu) {
      case 'analysis':
        return (
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 min-h-[80vh]">
            <div className="mb-6 border-b border-gray-100 pb-4">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <TableIcon className="text-blue-600" /> วิเคราะห์งาน/หน่วยการเรียนรู้
              </h2>
              <p className="text-gray-500 text-sm mt-1">วิเคราะห์หลักสูตรเพื่อกำหนดงาน (Job) หน้าที่ (Duty) และงานย่อย (Task)</p>
            </div>
            <AnalysisModule
              {...aiProps}
              formData={formData} setFormData={setFormData}
              generatedPlan={generatedPlan} setGeneratedPlan={setGeneratedPlan}
              unitDivisionPlan={unitDivisionPlan} setUnitDivisionPlan={setUnitDivisionPlan}
              onError={setError} onNavigate={navigate}
              onOpenStandardSearch={() => setIsStandardPopupOpen(true)}
            />
          </div>
        );
      case 'learning_outcomes':
        return (
          <LearningOutcomesModule
            {...aiProps}
            unitDivisionPlan={unitDivisionPlan} generatedPlan={generatedPlan}
            loResults={loResults} setLoResults={setLoResults}
            formData={formData} onError={setError} onNavigate={navigate}
          />
        );
      case 'competencies':
        return (
          <CompetencyModule
            {...aiProps}
            loResults={loResults} unitDivisionPlan={unitDivisionPlan}
            compResults={compResults} setCompResults={setCompResults}
            formData={formData} onError={setError} onNavigate={navigate}
          />
        );
      case 'objectives':
        return (
          <ObjectivesModule
            {...aiProps}
            formData={formData} compResults={compResults} loResults={loResults}
            objResults={objResults} setObjResults={setObjResults}
            onError={setError} onNavigate={navigate}
          />
        );
      case 'concept':
        return (
          <ConceptModule
            {...aiProps}
            formData={formData} generatedPlan={generatedPlan}
            unitDivisionPlan={unitDivisionPlan} loResults={loResults}
            compResults={compResults} objResults={objResults}
            conceptResults={conceptResults} setConceptResults={setConceptResults}
            onError={setError}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-12">
      <ErrorPopup message={error} onClose={() => setError(null)} />
      <StandardSearchPopup isOpen={isStandardPopupOpen} onClose={() => setIsStandardPopupOpen(false)} providerId={providerId} apiKey={apiKey} />
      <PdfSplitterModal isOpen={isPdfToolOpen} onClose={() => setIsPdfToolOpen(false)} />
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSave={handleSaveProvider}
        currentProvider={providerId}
        currentKey={apiKey}
      />

      <div className="md:hidden bg-blue-700 text-white p-4 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <span className="font-bold flex items-center gap-2"><BookOpen size={20} /> AI ช่วยทำแผนการสอน</span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-1 rounded hover:bg-blue-600"><Menu size={24} /></button>
      </div>

      <div className="flex max-w-[1440px] mx-auto pt-4 px-4 gap-6 items-start">
        <aside className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block w-full md:w-72 shrink-0 z-40`}>
          <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} onMobileClose={() => setIsMobileMenuOpen(false)} />
        </aside>
        <main className="flex-1 min-w-0">
          <TopToolsBar
            onOpenPdfTool={() => setIsPdfToolOpen(true)}
            onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
            hasApiKey={!!apiKey}
            providerName={providerMeta?.name || 'Unknown'}
          />
          {renderModule()}
        </main>
      </div>
    </div>
  );
}
