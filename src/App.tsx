import { useState, useMemo, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "@/components/Sidebar";
import { HomePage } from "@/components/HomePage";
import { AllPapersPage } from "@/components/AllPapersPage";
import { ReadingPlansPage } from "@/components/ReadingPlansPage";
import { FilledSummaries } from "@/components/FilledSummaries";
import { SettingsPage } from "@/components/SettingsPage";
import { SummaryEditor } from "@/components/SummaryEditor";
import { TermsPage } from "@/components/TermsPage";
import { SynthesesPage } from "@/components/SynthesesPage";
import { SynthesisEditor } from "@/components/SynthesisEditor";
import { OnboardingPage } from "@/components/OnboardingPage";
import { PDFViewer } from "@/components/PDFViewer";
import { GamificationBadge, ScoreToast } from "@/components/GamificationBadge";
import { usePaperState } from "@/hooks/usePaperState";
import { NeuralBackground } from "@/components/NeuralBackground";
import type { Paper, PaperSummary, Module, ScoreEvent } from "@/data/types";
import "./App.css";

// ---- Dashboard Component ----
function Dashboard({
  papers,
  modules,
  activeFilter,
  setActiveFilter,
  onPaperClick,
}: {
  papers: Paper[];
  modules: Module[];
  activeFilter: string;
  setActiveFilter: (f: string) => void;
  onPaperClick: (paper: Paper) => void;
}) {
  const weeks = useMemo(() => {
    const grouped = new Map<number, Paper[]>();
    papers.forEach((p) => {
      if (p.week > 0) {
        const list = grouped.get(p.week) || [];
        list.push(p);
        grouped.set(p.week, list);
      }
    });
    return Array.from(grouped.entries()).sort((a, b) => a[0] - b[0]);
  }, [papers]);

  const moduleFilters = [
    { id: "all", label: "All Topics" },
    ...modules.map((m) => ({ id: m.slug, label: m.name })),
  ];

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <header className="shrink-0 px-8 pt-6 pb-4 bg-[#f7f8fa] z-10">
        <h1 className="text-[28px] font-bold text-[#181a1b] tracking-tight mb-1">
          Weekly Reading Plan
        </h1>
        <p className="text-sm text-[#5e6a6e] mb-4">
          Priority-based schedule. Click any paper to start reading and summarizing.
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {moduleFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeFilter === filter.id
                  ? "bg-[#4293a7] text-white shadow-sm"
                  : "bg-white text-[#5e6a6e] border border-[#eaeaea] hover:border-[#4293a7]"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </header>
      <div className="flex-1 overflow-y-auto relative">
        <div className="absolute inset-0 pointer-events-none">
          <NeuralBackground />
        </div>
        <div className="relative z-10 px-8 py-6 space-y-8">
          {weeks.length === 0 && (
            <div className="text-center py-20">
              <p className="text-sm text-[#5e6a6e]">
                No papers scheduled yet. Add papers to see your weekly plan.
              </p>
            </div>
          )}
          {weeks.map(([weekNum, weekPapers]) => {
            const isActive = weekPapers.some((p) => p.status === "active");
            const isCompleted = weekPapers.every((p) => p.status === "completed");
            return (
              <motion.div
                key={weekNum}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      isCompleted
                        ? "bg-[#4caf50] text-white"
                        : isActive
                        ? "bg-[#4293a7] text-white"
                        : "bg-white border-2 border-dashed border-[#eaeaea] text-[#5e6a6e]"
                    }`}
                  >
                    {isCompleted ? <CheckCircleIcon /> : weekNum}
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#5e6a6e]">
                    Week {weekNum}
                  </span>
                  {isActive && (
                    <span className="ml-auto text-[10px] font-bold text-[#4293a7] bg-[#4293a7]/10 px-2 py-0.5 rounded">
                      Active
                    </span>
                  )}
                  {isCompleted && (
                    <span className="ml-auto text-[10px] font-bold text-[#4caf50] bg-[#4caf50]/10 px-2 py-0.5 rounded">
                      Completed
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 ml-11">
                  {weekPapers.map((paper) => (
                    <div
                      key={paper.id}
                      onClick={() =>
                        paper.status !== "locked" && onPaperClick(paper)
                      }
                      className={
                        paper.status === "locked" ? "" : "cursor-pointer"
                      }
                    >
                      <PaperNodeDisplay
                        paper={paper}
                        modules={modules}
                        isFiltered={
                          activeFilter !== "all" &&
                          modules.find((m) => m.slug === activeFilter)?.id ===
                            paper.moduleId
                        }
                      />
                    </div>
                  ))}
                </div>
                {weekNum < weeks.length && (
                  <div className="ml-[19px] w-0.5 h-8 bg-gradient-to-b from-[#eaeaea] to-transparent mt-2" />
                )}
              </motion.div>
            );
          })}
          <div className="h-12" />
        </div>
      </div>
    </div>
  );
}

function CheckCircleIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

function PaperNodeDisplay({
  paper,
  modules,
  isFiltered,
}: {
  paper: Paper;
  modules: Module[];
  isFiltered: boolean;
}) {
  const mod = modules.find((m) => m.id === paper.moduleId);
  const color = mod?.color || "#4293a7";

  if (paper.status === "locked") {
    return (
      <div
        className={`border-2 border-dashed border-[#eaeaea] rounded-xl p-5 bg-[#fafafa] opacity-60 ${
          isFiltered ? "opacity-100 ring-2 ring-[#4293a7]" : ""
        }`}
      >
        <div className="flex items-start justify-between mb-3">
          <span
            className="text-[10px] font-bold uppercase px-2 py-0.5 rounded"
            style={{ backgroundColor: `${color}15`, color }}
          >
            {paper.topic}
          </span>
          <svg
            className="w-4 h-4 text-[#5e6a6e]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-[#5e6a6e] mb-2 line-clamp-2">
          {paper.title}
        </h3>
        <p className="text-xs text-[#5e6a6e]">
          {paper.authors} ({paper.year})
        </p>
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className={`border rounded-xl p-5 bg-white shadow-sm hover:shadow-lg transition-all ${
        isFiltered ? "ring-2 ring-[#4293a7] ring-offset-2" : ""
      }`}
      style={{
        borderTopWidth: 3,
        borderTopColor: paper.status === "completed" ? "#4caf50" : color,
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <span
          className="text-[10px] font-bold uppercase px-2 py-0.5 rounded"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {paper.topic}
        </span>
        {paper.status === "completed" ? (
          <svg
            className="w-5 h-5 text-[#4caf50]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ) : (
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${color}15` }}
          >
            <svg
              className="w-3 h-3"
              style={{ color }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </div>
        )}
      </div>
      <h3 className="text-sm font-bold text-[#181a1b] mb-2 line-clamp-2">
        {paper.title}
      </h3>
      <p className="text-xs text-[#5e6a6e] mb-3">
        {paper.authors} ({paper.year})
      </p>
      {paper.status === "active" && (
        <p className="text-[11px] text-[#5e6a6e] leading-relaxed mb-3 line-clamp-2 bg-[#f7f8fa] rounded-lg p-2">
          {paper.importance}
        </p>
      )}
      <div className="flex flex-wrap gap-1 mb-2">
        {paper.keywords.slice(0, 3).map((kw) => (
          <span
            key={kw}
            className="px-1.5 py-0.5 rounded text-[9px] bg-[#f7f8fa] text-[#5e6a6e]"
          >
            {kw}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold" style={{ color }}>
          {paper.status === "completed" ? "Summary complete" : "Fill Summary"}
        </span>
        {paper.pdf && (
          <span className="text-[9px] text-[#4293a7] bg-[#4293a7]/10 px-1.5 py-0.5 rounded font-medium">
            PDF
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ---- Main App ----
export default function App() {
  const {
    papers,
    plans,
    modules,
    templates,
    terms,
    syntheses,
    settings,
    profile,
    gamification,
    nextPaper,
    stats,
    allKeywords,
    weeks,
    // Actions
    updateProfile,
    completeOnboarding,
    setDataDirectory,
    addPaper,
    updatePaper,
    deletePaper,
    addPDFToPaper,
    removePDFFromPaper,
    saveSummary,
    unmarkComplete,
    addPlan,
    updatePlan,
    deletePlan,
    addModule,
    updateModule,
    deleteModule,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    addTerm,
    updateTerm,
    deleteTerm,
    addSynthesis,
    updateSynthesis,
    deleteSynthesis,
    updateSettings,
    updateWeeklyTarget,
    importData,
    resetData,
  } = usePaperState();

  const [activeView, setActiveView] = useState("home");
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [showPDF, setShowPDF] = useState(false);
  const [pdfPaper, setPdfPaper] = useState<Paper | null>(null);
  const [lastScoreEvent, setLastScoreEvent] = useState<ScoreEvent | null>(null);
  const [selectedSynthesisId, setSelectedSynthesisId] = useState<string | null>(null);
  const [isSynthesisEditorOpen, setIsSynthesisEditorOpen] = useState(false);

  // Derive selected paper from papers array — always up to date
  const selectedPaper = useMemo(() => {
    if (!selectedPaperId) return null;
    return papers.find((p) => p.id === selectedPaperId) || null;
  }, [selectedPaperId, papers]);

  // Derive selected synthesis from syntheses array
  const selectedSynthesis = useMemo(() => {
    if (!selectedSynthesisId) return null;
    return syntheses.find((s) => s.id === selectedSynthesisId) || null;
  }, [selectedSynthesisId, syntheses]);

  const completedCount = papers.filter((p) => p.status === "completed").length;

  const handlePaperClick = useCallback(
    (paper: Paper) => {
      if (paper.status === "locked") return;
      setSelectedPaperId(paper.id);
      setIsEditorOpen(true);
    },
    []
  );

  const handleCloseEditor = useCallback(() => {
    setIsEditorOpen(false);
    setSelectedPaperId(null);
  }, []);

  const handleSave = useCallback(
    (paperId: string, summary: PaperSummary) => {
      saveSummary(paperId, summary);
      // Show score toast with the most recent event
      const recentEvent = gamification.history[gamification.history.length - 1];
      if (recentEvent && recentEvent.paperId === paperId) {
        setLastScoreEvent(recentEvent);
        setTimeout(() => setLastScoreEvent(null), 4000);
      }
      setIsEditorOpen(false);
      setSelectedPaperId(null);
    },
    [saveSummary, gamification.history]
  );

  const handleUnmark = useCallback(
    (paperId: string) => {
      unmarkComplete(paperId);
      setIsEditorOpen(false);
      setSelectedPaperId(null);
    },
    [unmarkComplete]
  );

  const handleViewPDF = useCallback((paper: Paper) => {
    if (paper.pdf) {
      setPdfPaper(paper);
      setShowPDF(true);
    }
  }, []);

  const handleClosePDF = useCallback(() => {
    setShowPDF(false);
    setPdfPaper(null);
  }, []);

  const handleUploadPDF = useCallback(
    async (paperId: string, file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        addPDFToPaper(paperId, {
          id: `pdf-${Date.now()}`,
          name: file.name,
          data: base64,
          size: file.size,
        });
      };
      reader.readAsDataURL(file);
    },
    [addPDFToPaper]
  );

  // ---- Onboarding ----
  if (!settings.hasCompletedOnboarding || !settings.dataDirectory) {
    return (
      <OnboardingPage
        onComplete={(profile, weeklyTarget, dataDirectory) => {
          completeOnboarding(profile, weeklyTarget);
          setDataDirectory(dataDirectory);
        }}
      />
    );
  }

  return (
    <div className="flex h-screen bg-[#f7f8fa] overflow-hidden">
      <Sidebar
        papersTotal={papers.length}
        completedCount={completedCount}
        activeView={activeView}
        onViewChange={setActiveView}
        profile={profile}
        gamification={gamification}
      />
      <main className="flex-1 overflow-hidden flex flex-col" style={{ marginLeft: 240 }}>
        <AnimatePresence mode="wait">
          {activeView === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-hidden flex flex-col"
            >
              <HomePage
                papers={papers}
                modules={modules}
                plans={plans}
                profile={profile}
                gamification={gamification}
                nextPaper={nextPaper}
                stats={stats}
                weeks={weeks}
                onPaperClick={handlePaperClick}
                onViewChange={setActiveView}
                onViewPDF={handleViewPDF}
              />
            </motion.div>
          )}
          {activeView === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-hidden flex flex-col"
            >
              <Dashboard
                papers={papers}
                modules={modules}
                activeFilter={activeFilter}
                setActiveFilter={setActiveFilter}
                onPaperClick={handlePaperClick}
              />
            </motion.div>
          )}
          {activeView === "papers" && (
            <motion.div
              key="papers"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-hidden flex flex-col"
            >
              <AllPapersPage
                papers={papers}
                modules={modules}
                allKeywords={allKeywords}
                onPaperClick={handlePaperClick}
                onAddPaper={addPaper}
                onDeletePaper={deletePaper}
                onUploadPDF={handleUploadPDF}
              />
            </motion.div>
          )}
          {activeView === "plans" && (
            <motion.div
              key="plans"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-hidden flex flex-col"
            >
              <ReadingPlansPage
                plans={plans}
                modules={modules}
                papers={papers}
                onAddPlan={addPlan}
                onUpdatePlan={updatePlan}
                onDeletePlan={deletePlan}
                onAddModule={addModule}
                onUpdateModule={updateModule}
                onDeleteModule={deleteModule}
                onPaperClick={handlePaperClick}
                onAddPaper={addPaper}
              />
            </motion.div>
          )}
          {activeView === "filled" && (
            <motion.div
              key="filled"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-hidden flex flex-col"
            >
              <FilledSummaries
                papers={papers}
                modules={modules}
                onPaperClick={handlePaperClick}
              />
            </motion.div>
          )}
          {activeView === "terms" && (
            <motion.div
              key="terms"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-hidden flex flex-col"
            >
              <TermsPage
                terms={terms}
                papers={papers}
                onAddTerm={addTerm}
                onUpdateTerm={updateTerm}
                onDeleteTerm={deleteTerm}
              />
            </motion.div>
          )}
          {activeView === "syntheses" && (
            <motion.div
              key="syntheses"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-hidden flex flex-col"
            >
              <SynthesesPage
                syntheses={syntheses}
                papers={papers}
                modules={modules}
                plans={plans}
                onCreateSynthesis={addSynthesis}
                onDeleteSynthesis={deleteSynthesis}
                onOpenSynthesis={(id) => {
                  setSelectedSynthesisId(id);
                  setIsSynthesisEditorOpen(true);
                }}
              />
            </motion.div>
          )}
          {activeView === "gamification" && (
            <motion.div
              key="gamification"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-y-auto"
            >
              <div className="px-8 py-6 max-w-2xl">
                <h1 className="text-[28px] font-bold text-[#181a1b] tracking-tight mb-6">
                  Gamification
                </h1>
                <GamificationBadge gamification={gamification} />
              </div>
            </motion.div>
          )}
          {activeView === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-hidden flex flex-col"
            >
              <SettingsPage
                templates={templates}
                settings={settings}
                profile={profile}
                gamification={gamification}
                onUpdateSettings={updateSettings}
                onUpdateProfile={updateProfile}
                onUpdateWeeklyTarget={updateWeeklyTarget}
                onAddTemplate={addTemplate}
                onUpdateTemplate={updateTemplate}
                onDeleteTemplate={deleteTemplate}
                onImportData={importData}
                onResetData={resetData}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Summary Editor */}
      <SummaryEditor
        paper={selectedPaper}
        modules={modules}
        templates={templates}
        terms={terms}
        isOpen={isEditorOpen}
        onClose={handleCloseEditor}
        onSave={handleSave}
        onUnmarkComplete={handleUnmark}
        onUpdatePaper={updatePaper}
        onUploadPDF={handleUploadPDF}
        onRemovePDF={removePDFFromPaper}
        onViewPDF={handleViewPDF}
        onAddTerm={addTerm}
      />

      {/* PDF Viewer Overlay */}
      <AnimatePresence>
        {showPDF && pdfPaper?.pdf && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90]"
          >
            <div className="absolute inset-0" onClick={handleClosePDF} />
            <div className="absolute inset-4 rounded-2xl overflow-hidden shadow-2xl">
              <PDFViewer
                pdfData={pdfPaper.pdf.data}
                paperTitle={pdfPaper.title}
                isOpen={showPDF}
                onClose={handleClosePDF}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Synthesis Editor */}
      <SynthesisEditor
        key={selectedSynthesis?.id || "closed"}
        synthesis={selectedSynthesis}
        papers={papers}
        modules={modules}
        plans={plans}
        isOpen={isSynthesisEditorOpen}
        onClose={() => {
          setIsSynthesisEditorOpen(false);
          setSelectedSynthesisId(null);
        }}
        onUpdate={updateSynthesis}
      />

      {/* Score Toast */}
      <AnimatePresence>
        {lastScoreEvent && (
          <ScoreToast
            event={lastScoreEvent}
            onDone={() => setLastScoreEvent(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
