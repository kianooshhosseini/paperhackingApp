import { useState, useEffect, useRef } from "react";
import {
  X, Save, Sparkles, RotateCcw, CheckCircle, ExternalLink,
  ChevronLeft, FileText, BookOpen, BrainCircuit, ChevronDown,
  GripVertical, PanelLeftClose, PanelLeftOpen, Lightbulb,
  Plus, ImagePlus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";
import { PDFUploadButton } from "@/components/PDFViewer";
import type { Paper, PaperSummary, Module, SummaryTemplate, Term } from "@/data/types";
import { getModuleColor } from "@/data/types";
import { openExternalLink } from "@/lib/links";

const fieldIcons: Record<string, React.ReactNode> = {
  oneSentence: <BookOpen className="w-4 h-4" />,
  keyQuestion: <Sparkles className="w-4 h-4" />,
  hypothesis: <BrainCircuit className="w-4 h-4" />,
  methods: <FileText className="w-4 h-4" />,
  keyFindings: <Sparkles className="w-4 h-4" />,
  novelInsight: <BrainCircuit className="w-4 h-4" />,
  criticism: <FileText className="w-4 h-4" />,
  relevanceToWork: <FileText className="w-4 h-4" />,
  figureNote: <FileText className="w-4 h-4" />,
  scope: <BookOpen className="w-4 h-4" />,
  myExperiment: <BrainCircuit className="w-4 h-4" />,
  theirExperiment: <FileText className="w-4 h-4" />,
  theirEvidence: <FileText className="w-4 h-4" />,
  theGap: <FileText className="w-4 h-4" />,
  resultsVsPrediction: <Sparkles className="w-4 h-4" />,
  resultsVsPredictions: <Sparkles className="w-4 h-4" />,
  stealThis: <BrainCircuit className="w-4 h-4" />,
  schemaUpdate: <BrainCircuit className="w-4 h-4" />,
  bridgeToProject: <FileText className="w-4 h-4" />,
  claim: <Sparkles className="w-4 h-4" />,
};

function getFieldIcon(key: string) {
  return fieldIcons[key] || <FileText className="w-4 h-4" />;
}

interface SummaryEditorProps {
  paper: Paper | null;
  modules: Module[];
  templates: SummaryTemplate[];
  terms: Term[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (paperId: string, summary: PaperSummary) => void;
  onUnmarkComplete: (paperId: string) => void;
  onUpdatePaper: (paperId: string, updates: Partial<Paper>) => void;
  onUploadPDF: (paperId: string, file: File) => void;
  onRemovePDF: (paperId: string) => void;
  onViewPDF: (paper: Paper) => void;
  onAddTerm: (term: Omit<Term, "id" | "dateAdded">) => string;
}

function ConfettiEffect() {
  const colors = ["#4293a7", "#4caf50", "#a8ccd5", "#7c3aed", "#d97706", "#059669"];
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[100]">
      {Array.from({ length: 40 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2.5 h-2.5 rounded-sm"
          style={{
            backgroundColor: colors[i % colors.length],
            left: `${50 + (Math.random() - 0.5) * 30}%`,
            top: "55%",
          }}
          initial={{ y: 0, x: 0, opacity: 1, scale: 1, rotate: 0 }}
          animate={{
            y: -300 - Math.random() * 200,
            x: (Math.random() - 0.5) * 600,
            opacity: 0,
            scale: 0.2,
            rotate: Math.random() * 1080,
          }}
          transition={{ duration: 1.8, ease: "easeOut", delay: Math.random() * 0.4 }}
        />
      ))}
    </div>
  );
}

// Resizable panel with drag handle
function ResizableHandle({ onMouseDown, axis }: { onMouseDown: () => void; axis: "x" | "y" }) {
  return (
    <div
      onMouseDown={onMouseDown}
      className={`shrink-0 flex items-center justify-center bg-[#eaeaea] hover:bg-[#4293a7] transition-colors cursor-${axis === "x" ? "col-resize" : "row-resize"} z-10 ${
        axis === "x" ? "w-1.5 h-full" : "h-1.5 w-full"
      }`}
      title="Drag to resize"
    >
      {axis === "x" ? (
        <GripVertical className="w-3 h-3 text-[#9ca3af] hover:text-white pointer-events-none" />
      ) : (
        <div className="w-6 h-1 rounded-full bg-[#9ca3af] hover:bg-white pointer-events-none" />
      )}
    </div>
  );
}

export function SummaryEditor({
  paper,
  modules,
  templates,
  terms,
  isOpen,
  onClose,
  onSave,
  onUnmarkComplete,
  onUpdatePaper,
  onUploadPDF,
  onRemovePDF,
  onViewPDF,
  onAddTerm,
}: SummaryEditorProps) {
  const [formData, setFormData] = useState<Partial<PaperSummary>>({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [activeTab, setActiveTab] = useState<"summary" | "edit">("summary");
  const [showUnmarkConfirm, setShowUnmarkConfirm] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [showPDFPanel, setShowPDFPanel] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showTermsPanel, setShowTermsPanel] = useState(false);

  // Resizable panel sizes
  const [leftWidth, setLeftWidth] = useState(320);
  const [pdfWidth, setPdfWidth] = useState(500);
  const isDraggingLeft = useRef(false);
  const isDraggingPDF = useRef(false);

  const template =
    templates.find((t) => t.id === (selectedTemplateId || paper?.templateId)) ||
    templates[0] ||
    null;

  // Paper-linked terms
  const paperTerms = paper?.termIds
    ? terms.filter((t) => paper.termIds!.includes(t.id))
    : [];
  const allTermsForSelect = terms.filter(
    (t) => !(paper?.termIds || []).includes(t.id)
  );

  useEffect(() => {
    if (paper) {
      setFormData(paper.summary || {});
      setSelectedTemplateId(paper.templateId || templates[0]?.id || "");
      setActiveTab("summary");
    }
  }, [paper, templates]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Drag handlers for resizable panels
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (isDraggingLeft.current) {
        setLeftWidth(Math.max(200, Math.min(500, e.clientX)));
      }
      if (isDraggingPDF.current) {
        const w = window.innerWidth;
        setPdfWidth(Math.max(300, Math.min(800, w - e.clientX)));
      }
    };
    const handleUp = () => {
      isDraggingLeft.current = false;
      isDraggingPDF.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, []);

  if (!paper || !template) return null;

  const color = getModuleColor(paper.moduleId, modules);

  const handleFieldChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const summary: PaperSummary = {} as PaperSummary;
    template.fields.forEach((f) => {
      (summary as Record<string, string>)[f.key] =
        (formData as Record<string, string>)[f.key] || "";
    });
    setShowConfetti(true);
    setTimeout(() => {
      onSave(paper.id, summary);
      setShowConfetti(false);
    }, 1800);
  };

  const filledCount = template.fields.filter((f) => {
    const v = (formData as Record<string, string>)[f.key];
    return v && v.trim().length > 0;
  }).length;
  const totalFields = template.fields.length;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          {showConfetti && <ConfettiEffect />}

          {/* Top Navigation Bar */}
          <div className="shrink-0 border-b border-[#eaeaea] bg-white z-10">
            <div className="flex items-center justify-between px-6 py-3">
              <div className="flex items-center gap-4">
                <button
                  onClick={onClose}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-[#5e6a6e] hover:bg-[#f7f8fa] hover:text-[#181a1b] transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
                <div className="w-px h-6 bg-[#eaeaea]" />
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider"
                    style={{ backgroundColor: `${color}15`, color }}
                  >
                    {paper.topic}
                  </span>
                  {paper.week > 0 && (
                    <span className="text-[10px] text-[#5e6a6e]">Week {paper.week}</span>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center bg-[#f7f8fa] rounded-lg p-0.5">
                <button
                  onClick={() => setActiveTab("summary")}
                  className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                    activeTab === "summary"
                      ? "bg-white text-[#181a1b] shadow-sm"
                      : "text-[#5e6a6e] hover:text-[#181a1b]"
                  }`}
                >
                  Summary
                </button>
                <button
                  onClick={() => setActiveTab("edit")}
                  className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                    activeTab === "edit"
                      ? "bg-white text-[#181a1b] shadow-sm"
                      : "text-[#5e6a6e] hover:text-[#181a1b]"
                  }`}
                >
                  Edit Paper
                </button>
              </div>

              <div className="flex items-center gap-3">
                {/* Sidebar Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  className="text-xs gap-1.5"
                >
                  {sidebarCollapsed ? <PanelLeftOpen className="w-3.5 h-3.5" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
                </Button>

                {/* Terms Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTermsPanel(!showTermsPanel)}
                  className={`text-xs gap-1.5 ${
                    showTermsPanel
                      ? "border-[#d97706] text-[#d97706] bg-[#d97706]/5"
                      : ""
                  }`}
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  Terms {paperTerms.length > 0 && `(${paperTerms.length})`}
                </Button>

                {/* PDF Toggle */}
                {paper.pdf && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPDFPanel(!showPDFPanel)}
                    className={`text-xs gap-1.5 ${
                      showPDFPanel
                        ? "border-[#4293a7] text-[#4293a7] bg-[#4293a7]/5"
                        : ""
                    }`}
                  >
                    {showPDFPanel ? (
                      <>
                        <X className="w-3.5 h-3.5" />
                        Hide PDF
                      </>
                    ) : (
                      <>
                        <FileText className="w-3.5 h-3.5" />
                        Show PDF
                      </>
                    )}
                  </Button>
                )}

                {/* Template selector */}
                <div className="relative">
                  <select
                    value={selectedTemplateId || paper.templateId || templates[0]?.id}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-1.5 rounded-lg text-xs font-medium border border-[#eaeaea] bg-white text-[#5e6a6e] focus:border-[#4293a7] outline-none cursor-pointer"
                  >
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-[#5e6a6e] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Progress */}
                <div className="flex items-center gap-2 mr-2">
                  <div className="w-20 h-1.5 bg-[#eaeaea] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: color }}
                      animate={{ width: `${(filledCount / totalFields) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <span className="text-[10px] text-[#5e6a6e]">{filledCount}/{totalFields}</span>
                </div>

                {paper.status === "completed" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowUnmarkConfirm(true)}
                      className="text-xs border-orange-200 text-orange-600 hover:bg-orange-50 gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Unmark
                    </Button>
                    {showUnmarkConfirm && (
                      <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className="absolute right-6 top-14 bg-white border border-[#eaeaea] rounded-lg shadow-lg p-4 z-50 w-64"
                      >
                        <p className="text-xs text-[#5e6a6e] mb-3">
                          Remove the summary and set this paper back to active?
                        </p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="text-xs flex-1" onClick={() => setShowUnmarkConfirm(false)}>Cancel</Button>
                          <Button size="sm" className="text-xs flex-1 bg-orange-500 hover:bg-orange-600 text-white" onClick={() => { onUnmarkComplete(paper.id); setShowUnmarkConfirm(false); onClose(); }}>Confirm</Button>
                        </div>
                      </motion.div>
                    )}
                  </>
                )}

                <Button
                  size="sm"
                  onClick={activeTab === "summary" ? handleSave : () => setActiveTab("summary")}
                  className="text-xs bg-[#4293a7] hover:bg-[#357a8a] text-white gap-2"
                >
                  <Save className="w-3.5 h-3.5" />
                  {paper.status === "completed" ? "Update" : "Save & Complete"}
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content — 3 Resizable Panels */}
          <div className="flex-1 flex overflow-hidden">
            {/* LEFT: Paper Info Panel (collapsible) */}
            <div
              className={`shrink-0 border-r border-[#eaeaea] bg-[#fafafa] overflow-hidden transition-all duration-200 ${
                sidebarCollapsed ? "w-10" : "overflow-y-auto"
              }`}
              style={{ width: sidebarCollapsed ? 40 : leftWidth }}
            >
              {sidebarCollapsed ? (
                <div className="flex flex-col items-center pt-3 gap-3">
                  <button
                    onClick={() => setSidebarCollapsed(false)}
                    className="p-1.5 rounded-lg hover:bg-[#eaeaea] text-[#5e6a6e]"
                    title="Expand sidebar"
                  >
                    <PanelLeftOpen className="w-4 h-4" />
                  </button>
                  <div className="w-5 h-px bg-[#eaeaea]" />
                  {paper.pdf && (
                    <button
                      onClick={() => setShowPDFPanel(!showPDFPanel)}
                      className={`p-1.5 rounded-lg ${showPDFPanel ? "text-[#4293a7] bg-[#4293a7]/10" : "text-[#5e6a6e] hover:bg-[#eaeaea]"}`}
                      title="Toggle PDF"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setShowTermsPanel(!showTermsPanel)}
                    className={`p-1.5 rounded-lg ${showTermsPanel ? "text-[#d97706] bg-[#d97706]/10" : "text-[#5e6a6e] hover:bg-[#eaeaea]"}`}
                    title="Toggle Terms"
                  >
                    <Lightbulb className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="p-5 space-y-4">
                  {/* Collapse button */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => setSidebarCollapsed(true)}
                      className="p-1 rounded-lg hover:bg-[#eaeaea] text-[#9ca3af]"
                      title="Collapse sidebar"
                    >
                      <PanelLeftClose className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#9ca3af] mb-1">Status</p>
                    <div className="flex items-center gap-2">
                      {paper.status === "completed" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#4caf50]">
                          <CheckCircle className="w-3.5 h-3.5" /> Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#d97706]">
                          <Sparkles className="w-3.5 h-3.5" /> Ready to Read
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#9ca3af] mb-1">Title</p>
                    <p className="text-sm font-bold text-[#181a1b] leading-snug">{paper.title}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#9ca3af] mb-1">Authors</p>
                    <p className="text-sm text-[#181a1b]">{paper.authors}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#9ca3af] mb-1">Year</p>
                    <p className="text-sm text-[#181a1b]">{paper.year}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#9ca3af] mb-1">DOI</p>
                    <button onClick={() => openExternalLink(`https://doi.org/${paper.doi}`)} className="inline-flex items-center gap-1.5 text-xs text-[#4293a7] hover:underline">
                      {paper.doi} <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#9ca3af] mb-2">Keywords</p>
                    <div className="flex flex-wrap gap-1.5">
                      {paper.keywords.map((kw) => (
                        <span key={kw} className="px-2 py-0.5 rounded text-[10px] font-medium bg-white border border-[#eaeaea] text-[#5e6a6e]">{kw}</span>
                      ))}
                    </div>
                  </div>

                  {/* PDF Section */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#9ca3af] mb-2">PDF</p>
                    <div className="space-y-2">
                      {paper.pdf ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-[#4caf50]/5 border border-[#4caf50]/20">
                            <FileText className="w-4 h-4 text-[#4caf50] shrink-0" />
                            <span className="text-xs text-[#181a1b] font-medium truncate flex-1">{paper.pdf.name}</span>
                            <span className="text-[10px] text-[#9ca3af] shrink-0">{(paper.pdf.size / 1024 / 1024).toFixed(1)} MB</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => onViewPDF(paper)} className="text-xs gap-1.5 flex-1">
                              <FileText className="w-3.5 h-3.5" />
                              Fullscreen PDF
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => onRemovePDF(paper.id)} className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50">
                              Remove
                            </Button>
                          </div>
                          {!showPDFPanel && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowPDFPanel(true)}
                              className="text-xs gap-1.5 w-full border-[#4293a7] text-[#4293a7] hover:bg-[#4293a7]/5"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              Open Split View
                            </Button>
                          )}
                        </div>
                      ) : (
                        <PDFUploadButton onUpload={(file) => onUploadPDF(paper.id, file)} />
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#9ca3af] mb-1">Why Read This</p>
                    <p className="text-xs text-[#5e6a6e] leading-relaxed">{paper.importance}</p>
                  </div>

                  {/* Linked Terms */}
                  {paperTerms.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#9ca3af] mb-2">Linked Terms</p>
                      <div className="space-y-1.5">
                        {paperTerms.map((term) => (
                          <div
                            key={term.id}
                            className="p-2 rounded-lg bg-white border border-[#eaeaea] text-xs"
                          >
                            <span className="font-semibold text-[#181a1b]">{term.name}</span>
                            <p className="text-[10px] text-[#5e6a6e] line-clamp-2 mt-0.5">{term.definition}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Drag handle: Left | Middle */}
            {!sidebarCollapsed && (
              <ResizableHandle
                onMouseDown={() => { isDraggingLeft.current = true; document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none"; }}
                axis="x"
              />
            )}

            {/* MIDDLE: Summary Form + Terms Panel */}
            <div className="flex-1 flex overflow-hidden">
              <div
                className="flex-1 overflow-y-auto bg-white"
              >
                {activeTab === "summary" ? (
                  <div className="px-8 py-6 max-w-3xl mx-auto">
                    <p className="text-sm text-[#5e6a6e] mb-6 bg-gradient-to-r from-[#f7f8fa] to-white rounded-xl p-4 border border-[#eaeaea]">
                      <span className="font-bold text-[#181a1b]">Template: {template.name}</span> &mdash; Fill each section as you read. Be concise but specific.
                    </p>

                    {/* Summary Fields with Auto-Resize Textareas */}
                    <div className="space-y-5">
                      {template.fields.map((field) => (
                        <div key={field.key}>
                          <label className="flex items-center gap-2 text-sm font-bold text-[#181a1b] mb-2">
                            <span style={{ color }}>{getFieldIcon(field.key)}</span>
                            {field.label}
                          </label>
                          <AutoResizeTextarea
                            value={(formData as Record<string, string>)[field.key] || ""}
                            onChange={(e) => handleFieldChange(field.key, e.target.value)}
                            placeholder={field.placeholder}
                            minRows={field.rows || 3}
                            maxRows={20}
                            className="text-sm border-[#eaeaea] focus:border-[#4293a7] focus:ring-[#4293a7]/20 transition-all duration-200 bg-[#fafafa] focus:bg-white"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Add Term Inline */}
                    <div className="mt-8 p-5 bg-gradient-to-r from-[#f7f8fa] to-white rounded-xl border border-[#eaeaea]">
                      <TermInlineAdd
                        paperId={paper.id}
                        paperTitle={paper.title}
                        onAddTerm={onAddTerm}
                      />
                    </div>

                    <div className="mt-8 p-5 bg-gradient-to-r from-[#f7f8fa] to-white rounded-xl border border-[#eaeaea] mb-8">
                      <h4 className="text-sm font-bold text-[#181a1b] mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#4293a7]" />
                        Reading Cheat Sheet
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-[11px] text-[#5e6a6e]">
                        {[
                          "Read abstract and conclusion first",
                          "Skim figures before reading methods",
                          "Identify the theoretical claim",
                          "Check if data support the claim",
                          "Ask: what would falsify this?",
                          "Connect to 2-3 papers you already know",
                        ].map((tip, i) => (
                          <div key={i} className="flex gap-2">
                            <span className="font-bold text-[#4293a7] shrink-0">{i + 1}.</span>
                            <span>{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="px-8 py-6 max-w-3xl mx-auto">
                    <h3 className="text-sm font-bold text-[#181a1b] mb-4">Edit Paper Details</h3>
                    <EditPaperForm paper={paper} onUpdate={onUpdatePaper} templates={templates} />
                  </div>
                )}
              </div>

              {/* Terms Side Panel */}
              <AnimatePresence>
                {showTermsPanel && (
                  <>
                    <ResizableHandle
                      onMouseDown={() => { isDraggingPDF.current = true; document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none"; }}
                      axis="x"
                    />
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 340, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className="shrink-0 border-l border-[#eaeaea] overflow-hidden flex flex-col bg-[#fafafa]"
                    >
                      <TermsSidePanel
                        paper={paper}
                        paperTerms={paperTerms}
                        allTerms={allTermsForSelect}
                        onAddTerm={onAddTerm}
                      />
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* PDF Panel + Drag Handle */}
            <AnimatePresence>
              {showPDFPanel && paper.pdf && (
                <>
                  <ResizableHandle
                    onMouseDown={() => { isDraggingPDF.current = true; document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none"; }}
                    axis="x"
                  />
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: pdfWidth, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="shrink-0 border-l border-[#eaeaea] overflow-hidden flex flex-col"
                  >
                    <PDFInlineViewer pdfData={paper.pdf.data} paperTitle={paper.title} />
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Inline PDF viewer
function PDFInlineViewer({
  pdfData,
  paperTitle,
}: {
  pdfData: string;
  paperTitle: string;
}) {
  const pdfUrl = `data:application/pdf;base64,${pdfData}`;
  return (
    <div className="flex flex-col h-full bg-[#1a1a2e]">
      <div className="shrink-0 flex items-center justify-between px-3 py-2 bg-[#16213e] border-b border-[#0f3460]">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-3.5 h-3.5 text-[#4293a7] shrink-0" />
          <span className="text-[11px] font-medium text-[#e8e8e8] truncate">{paperTitle}</span>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <iframe
          src={pdfUrl}
          title={paperTitle}
          className="w-full h-full border-0"
          style={{ backgroundColor: "#0f0f23" }}
        />
      </div>
    </div>
  );
}

// Terms Side Panel
function TermsSidePanel({
  paper,
  paperTerms,
  allTerms,
  onAddTerm,
}: {
  paper: Paper;
  paperTerms: Term[];
  allTerms: Term[];
  onAddTerm: (term: Omit<Term, "id" | "dateAdded">) => string;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: "",
    definition: "",
    notes: "",
    tags: "",
    image: undefined as string | undefined,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const handleSave = () => {
    if (!form.name.trim() || !form.definition.trim()) return;
    onAddTerm({
      name: form.name.trim(),
      definition: form.definition.trim(),
      notes: form.notes.trim(),
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      paperId: paper.id,
      paperTitle: paper.title,
      image: form.image,
    });
    setForm({ name: "", definition: "", notes: "", tags: "", image: undefined });
    setImagePreview(null);
    setShowAdd(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setForm((p) => ({ ...p, image: dataUrl }));
      setImagePreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const filteredAvailable = allTerms.filter((t) =>
    search
      ? t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
      : true
  );

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 px-4 py-3 border-b border-[#eaeaea] bg-white">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-[#d97706]" />
          <span className="text-sm font-bold text-[#181a1b]">Terms</span>
          <span className="text-[10px] text-[#5e6a6e] ml-auto">
            {paperTerms.length} linked
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Add Term Button */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAdd(!showAdd)}
          className="w-full text-xs gap-1.5"
        >
          {showAdd ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          {showAdd ? "Cancel" : "New Term"}
        </Button>

        {/* Add Form */}
        <AnimatePresence>
          {showAdd && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-2"
            >
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Term name"
                className="text-xs h-8"
              />
              <textarea
                value={form.definition}
                onChange={(e) => setForm((p) => ({ ...p, definition: e.target.value }))}
                placeholder="Definition"
                rows={2}
                className="w-full rounded-md border border-[#eaeaea] bg-white px-3 py-2 text-xs outline-none focus:border-[#4293a7] resize-none"
              />
              <textarea
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Notes / context"
                rows={2}
                className="w-full rounded-md border border-[#eaeaea] bg-white px-3 py-2 text-xs outline-none focus:border-[#4293a7] resize-none"
              />
              <Input
                value={form.tags}
                onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
                placeholder="Tags (comma-separated)"
                className="text-xs h-8"
              />
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 px-2 py-1 rounded border border-[#eaeaea] text-[10px] text-[#5e6a6e] hover:bg-[#f7f8fa] cursor-pointer">
                  <ImagePlus className="w-3 h-3" />
                  {imagePreview ? "Change" : "Image"}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
                {imagePreview && (
                  <button onClick={() => { setImagePreview(null); setForm(p => ({ ...p, image: undefined })); }} className="text-[10px] text-red-500">
                    Remove
                  </button>
                )}
              </div>
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="w-16 h-16 rounded object-cover" />
              )}
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!form.name.trim() || !form.definition.trim()}
                className="w-full text-xs bg-[#4293a7] hover:bg-[#357a8a] text-white h-8"
              >
                <Save className="w-3 h-3 mr-1" /> Save Term
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Linked Terms */}
        {paperTerms.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#9ca3af] mb-2">
              Linked to this Paper
            </p>
            <div className="space-y-2">
              {paperTerms.map((term) => (
                <div
                  key={term.id}
                  className="p-2.5 rounded-lg bg-white border border-[#eaeaea]"
                >
                  <p className="text-xs font-semibold text-[#181a1b]">{term.name}</p>
                  <p className="text-[10px] text-[#5e6a6e] line-clamp-3 mt-0.5">{term.definition}</p>
                  {term.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {term.tags.map((tag) => (
                        <span key={tag} className="px-1 py-0.5 rounded text-[9px] bg-[#f7f8fa] text-[#9ca3af]">{tag}</span>
                      ))}
                    </div>
                  )}
                  {term.image && (
                    <img src={term.image} alt={term.name} className="mt-1.5 w-full h-16 rounded object-cover" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search available terms */}
        {allTerms.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#9ca3af] mb-2">
              All Terms ({filteredAvailable.length})
            </p>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search terms..."
              className="text-xs h-7 mb-2"
            />
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {filteredAvailable.map((term) => (
                <div
                  key={term.id}
                  className="p-2 rounded-lg bg-white border border-[#eaeaea] cursor-pointer hover:border-[#4293a7]/30 transition-colors"
                >
                  <p className="text-[11px] font-medium text-[#181a1b]">{term.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Inline term adder in the summary form
function TermInlineAdd({
  paperId,
  paperTitle,
  onAddTerm,
}: {
  paperId: string;
  paperTitle: string;
  onAddTerm: (term: Omit<Term, "id" | "dateAdded">) => string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [definition, setDefinition] = useState("");
  const [notes, setNotes] = useState("");

  const handleSave = () => {
    if (!name.trim() || !definition.trim()) return;
    onAddTerm({
      name: name.trim(),
      definition: definition.trim(),
      notes: notes.trim(),
      tags: [],
      paperId,
      paperTitle,
    });
    setName("");
    setDefinition("");
    setNotes("");
    setShowForm(false);
  };

  return (
    <div>
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 text-sm text-[#4293a7] hover:text-[#357a8a] font-medium"
        >
          <Lightbulb className="w-4 h-4" />
          Quick-add a term or concept from this paper
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-[#d97706]" />
            <span className="text-sm font-bold text-[#181a1b]">New Term</span>
          </div>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Term name (e.g. Conflict Monitoring)"
            className="text-sm"
          />
          <AutoResizeTextarea
            value={definition}
            onChange={(e) => setDefinition(e.target.value)}
            placeholder="Definition in your own words..."
            minRows={2}
            maxRows={10}
            className="text-sm border-[#eaeaea] focus:border-[#4293a7] bg-[#fafafa] focus:bg-white"
          />
          <AutoResizeTextarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes, context, examples..."
            minRows={2}
            maxRows={8}
            className="text-sm border-[#eaeaea] focus:border-[#4293a7] bg-[#fafafa] focus:bg-white"
          />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)} className="text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!name.trim() || !definition.trim()}
              className="text-xs bg-[#4293a7] hover:bg-[#357a8a] text-white"
            >
              <Save className="w-3 h-3 mr-1" /> Save Term
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function EditPaperForm({
  paper,
  onUpdate,
  templates,
}: {
  paper: Paper;
  onUpdate: (id: string, u: Partial<Paper>) => void;
  templates: SummaryTemplate[];
}) {
  const [form, setForm] = useState({
    title: paper.title,
    authors: paper.authors,
    year: paper.year,
    doi: paper.doi,
    importance: paper.importance,
    keywords: [...paper.keywords],
    templateId: paper.templateId || templates[0]?.id || "",
  });

  const addKeyword = (kw: string) => {
    if (!kw.trim() || form.keywords.includes(kw.trim())) return;
    setForm((p) => ({ ...p, keywords: [...p.keywords, kw.trim()] }));
  };

  const removeKeyword = (kw: string) => {
    setForm((p) => ({ ...p, keywords: p.keywords.filter((k) => k !== kw) }));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-bold text-[#5e6a6e] uppercase mb-1.5 block">Title</label>
        <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-[#5e6a6e] uppercase mb-1.5 block">Authors</label>
          <Input value={form.authors} onChange={(e) => setForm((p) => ({ ...p, authors: e.target.value }))} className="text-sm" />
        </div>
        <div>
          <label className="text-xs font-bold text-[#5e6a6e] uppercase mb-1.5 block">Year</label>
          <Input type="number" value={form.year} onChange={(e) => setForm((p) => ({ ...p, year: Number(e.target.value) }))} className="text-sm" />
        </div>
      </div>
      <div>
        <label className="text-xs font-bold text-[#5e6a6e] uppercase mb-1.5 block">DOI</label>
        <Input value={form.doi} onChange={(e) => setForm((p) => ({ ...p, doi: e.target.value }))} className="text-sm" />
      </div>
      <div>
        <label className="text-xs font-bold text-[#5e6a6e] uppercase mb-1.5 block">Importance</label>
        <AutoResizeTextarea
          value={form.importance}
          onChange={(e) => setForm((p) => ({ ...p, importance: e.target.value }))}
          minRows={3}
          maxRows={10}
          className="text-sm border-[#eaeaea] focus:border-[#4293a7] bg-white"
        />
      </div>
      <div>
        <label className="text-xs font-bold text-[#5e6a6e] uppercase mb-1.5 block">Template</label>
        <select value={form.templateId} onChange={(e) => setForm((p) => ({ ...p, templateId: e.target.value }))} className="w-full px-3 py-2 rounded-md border border-[#eaeaea] text-sm bg-white focus:border-[#4293a7] outline-none">
          {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-bold text-[#5e6a6e] uppercase mb-1.5 block">Keywords</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {form.keywords.map((kw) => (
            <span key={kw} className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-[#4293a7]/10 text-[#4293a7]">
              {kw} <button onClick={() => removeKeyword(kw)}><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
        <Input placeholder="Type keyword and press Enter" className="text-sm" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addKeyword((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ""; } }} />
      </div>
      <Button size="sm" onClick={() => onUpdate(paper.id, form)} className="bg-[#4293a7] hover:bg-[#357a8a] text-white text-sm">
        <Save className="w-4 h-4 mr-1" /> Save Changes
      </Button>
    </div>
  );
}
