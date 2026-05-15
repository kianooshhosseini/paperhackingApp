import { useState, useMemo, useCallback } from "react";
import {
  Save, GitBranch, FileText, BookOpen, Sparkles,
  Target, AlertTriangle, CheckCircle, ArrowLeft,
  Lightbulb, Plus, Trash2, ChevronDown, ChevronUp, Download,
  Zap, ArrowLeftRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";
import type {
  Synthesis, Paper, Module, ReadingPlan,
  ContestedPoint, Contradiction,
} from "@/data/types";

interface SynthesisEditorProps {
  synthesis: Synthesis | null;
  papers: Paper[];
  modules: Module[];
  plans: ReadingPlan[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Synthesis>) => void;
}

// --- Auto-suggestion helpers ---

function extractClaims(papers: Paper[]): string[] {
  const claims: string[] = [];
  papers.forEach((p) => {
    const summary = p.summary;
    if (!summary) return;
    const claim = summary.claim || summary.theClaim || summary.the_claim || "";
    if (claim.trim()) claims.push(`[${p.title}] ${claim.trim()}`);
  });
  return claims;
}

function extractGaps(papers: Paper[]): string[] {
  const gaps: string[] = [];
  papers.forEach((p) => {
    const summary = p.summary;
    if (!summary) return;
    const gap = summary.theGap || summary.the_gap || "";
    if (gap.trim()) gaps.push(`[${p.title}] ${gap.trim()}`);
  });
  return gaps;
}

function extractStealThis(papers: Paper[]): string[] {
  const items: string[] = [];
  papers.forEach((p) => {
    const summary = p.summary;
    if (!summary) return;
    const st = summary.stealThis || summary.steal_this || "";
    if (st.trim()) items.push(`[${p.title}] ${st.trim()}`);
  });
  return items;
}

function extractSchemaUpdates(papers: Paper[]): string[] {
  const items: string[] = [];
  papers.forEach((p) => {
    const summary = p.summary;
    if (!summary) return;
    const su = summary.schemaUpdate || summary.schema_update || "";
    if (su.trim()) items.push(`[${p.title}] ${su.trim()}`);
  });
  return items;
}

function findPotentialContradictions(papers: Paper[]): Array<{
  paperA: Paper;
  paperB: Paper;
  claimA: string;
  claimB: string;
}> {
  const result: Array<{
    paperA: Paper;
    paperB: Paper;
    claimA: string;
    claimB: string;
  }> = [];
  const completed = papers.filter((p) => p.summary);
  for (let i = 0; i < completed.length; i++) {
    for (let j = i + 1; j < completed.length; j++) {
      const a = completed[i];
      const b = completed[j];
      const claimA = (a.summary?.claim || a.summary?.theClaim || "").trim();
      const claimB = (b.summary?.claim || b.summary?.theClaim || "").trim();
      if (claimA && claimB && claimA !== claimB) {
        const negators = ["not", "no ", "never", "doesn't", "cannot", "opposite", "contradict", "unlike", "disagree", "refute", "challenge"];
        const aHasNeg = negators.some((n) => claimA.toLowerCase().includes(n));
        const bHasNeg = negators.some((n) => claimB.toLowerCase().includes(n));
        if (aHasNeg !== bHasNeg) {
          result.push({ paperA: a, paperB: b, claimA, claimB });
        }
      }
    }
  }
  return result;
}

// --- Safe accessors ---

function safeArray<T>(val: T[] | undefined | null): T[] {
  return val ?? [];
}

// --- Main Component ---

export function SynthesisEditor({
  synthesis,
  papers,
  modules,
  plans,
  isOpen,
  onClose,
  onUpdate,
}: SynthesisEditorProps) {
  const [activeSection, setActiveSection] = useState<string>("overview");
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  // Guard: no synthesis or not open
  if (!isOpen) return null;
  if (!synthesis) return null;

  // Error boundary catch
  if (hasError) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-white items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-bold text-[#181a1b] mb-2">Something went wrong</p>
          <p className="text-sm text-[#5e6a6e] mb-4">
            The synthesis editor encountered an error. Try closing and reopening.
          </p>
          <Button onClick={onClose} className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white">
            Close Editor
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SynthesisEditorInner
      synthesis={synthesis}
      papers={papers}
      modules={modules}
      plans={plans}
      onClose={onClose}
      onUpdate={onUpdate}
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      expandedSuggestion={expandedSuggestion}
      setExpandedSuggestion={setExpandedSuggestion}
      onError={() => setHasError(true)}
    />
  );
}

// Inner component — separated so outer can catch errors
function SynthesisEditorInner({
  synthesis,
  papers,
  modules,
  plans,
  onClose,
  onUpdate,
  activeSection,
  setActiveSection,
  expandedSuggestion,
  setExpandedSuggestion,
  onError,
}: {
  synthesis: Synthesis;
  papers: Paper[];
  modules: Module[];
  plans: ReadingPlan[];
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Synthesis>) => void;
  activeSection: string;
  setActiveSection: (s: string) => void;
  expandedSuggestion: string | null;
  setExpandedSuggestion: (s: string | null) => void;
  onError: () => void;
}) {
  try {
    const mod = modules.find((m) => m.id === synthesis.moduleId);
    const plan = plans.find((p) => p.id === synthesis.planId);
    const color = mod?.color || "#7c3aed";

    // Safe array access
    const paperIds = safeArray(synthesis.paperIds);
    const contestedPoints = safeArray(synthesis.contestedPoints);
    const contradictions = safeArray(synthesis.contradictions);

    const modulePapers = papers.filter(
      (p) => p.moduleId === synthesis.moduleId && p.status === "completed"
    );
    const selectedPapers = modulePapers.filter((p) => paperIds.includes(p.id));

    // Auto-suggestions
    const allClaims = useMemo(() => extractClaims(modulePapers), [modulePapers]);
    const allGaps = useMemo(() => extractGaps(modulePapers), [modulePapers]);
    const allSteals = useMemo(() => extractStealThis(modulePapers), [modulePapers]);
    const allSchemas = useMemo(() => extractSchemaUpdates(modulePapers), [modulePapers]);
    const potentialContradictions = useMemo(
      () => findPotentialContradictions(modulePapers),
      [modulePapers]
    );

    const handleFieldChange = useCallback(
      (field: keyof Synthesis, value: unknown) => {
        onUpdate(synthesis.id, { [field]: value });
      },
      [synthesis.id, onUpdate]
    );

    const addContestedPoint = () => {
      const newPoint: ContestedPoint = {
        id: `cp-${Date.now()}`,
        topic: "",
        positionA: "",
        papersA: [],
        positionB: "",
        papersB: [],
        myNote: "",
      };
      handleFieldChange("contestedPoints", [...contestedPoints, newPoint]);
    };

    const updateContestedPoint = (id: string, updates: Partial<ContestedPoint>) => {
      handleFieldChange(
        "contestedPoints",
        contestedPoints.map((cp) => (cp.id === id ? { ...cp, ...updates } : cp))
      );
    };

    const deleteContestedPoint = (id: string) => {
      handleFieldChange(
        "contestedPoints",
        contestedPoints.filter((cp) => cp.id !== id)
      );
    };

    const addContradiction = (
      paperAId?: string,
      paperBId?: string,
      claimA?: string,
      claimB?: string
    ) => {
      const newContra: Contradiction = {
        id: `contra-${Date.now()}`,
        paperAId: paperAId || "",
        paperBId: paperBId || "",
        paperAClaim: claimA || "",
        paperBClaim: claimB || "",
        contradiction: "",
        resolvedBy: "",
      };
      handleFieldChange("contradictions", [...contradictions, newContra]);
    };

    const updateContradiction = (id: string, updates: Partial<Contradiction>) => {
      handleFieldChange(
        "contradictions",
        contradictions.map((c) => (c.id === id ? { ...c, ...updates } : c))
      );
    };

    const deleteContradiction = (id: string) => {
      handleFieldChange(
        "contradictions",
        contradictions.filter((c) => c.id !== id)
      );
    };

    const togglePaper = (paperId: string) => {
      const has = paperIds.includes(paperId);
      handleFieldChange(
        "paperIds",
        has ? paperIds.filter((id) => id !== paperId) : [...paperIds, paperId]
      );
    };

    const exportMarkdown = () => {
      const lines: string[] = [];
      lines.push(`# ${synthesis.title}`);
      lines.push("");
      if (synthesis.description) {
        lines.push(synthesis.description);
        lines.push("");
      }
      lines.push(`**Module:** ${mod?.name || "Unknown"} | **Plan:** ${plan?.name || "Unknown"}`);
      lines.push(`**Papers:** ${selectedPapers.length} synthesized`);
      lines.push(`**Date:** ${new Date().toLocaleDateString()}`);
      lines.push("");
      lines.push("---");
      lines.push("");
      lines.push("## Papers in This Synthesis");
      lines.push("");
      selectedPapers.forEach((p, i) => {
        lines.push(`${i + 1}. **${p.title}** (${p.authors}, ${p.year})`);
      });
      lines.push("");

      if (synthesis.consensusClaims) {
        lines.push("## Consensus Claims");
        lines.push("");
        lines.push(synthesis.consensusClaims);
        lines.push("");
      }

      if (contestedPoints.length > 0) {
        lines.push("## Contested Points");
        lines.push("");
        contestedPoints.forEach((cp, i) => {
          lines.push(`### ${i + 1}. ${cp.topic || "Untitled Dispute"}`);
          lines.push("");
          lines.push(`**Position A:** ${cp.positionA || "—"}`);
          lines.push(`*Supported by:* ${safeArray(cp.papersA).map((id) => selectedPapers.find((p) => p.id === id)?.title || id).join(", ") || "—"}`);
          lines.push("");
          lines.push(`**Position B:** ${cp.positionB || "—"}`);
          lines.push(`*Supported by:* ${safeArray(cp.papersB).map((id) => selectedPapers.find((p) => p.id === id)?.title || id).join(", ") || "—"}`);
          lines.push("");
          if (cp.myNote) {
            lines.push(`*My note:* ${cp.myNote}`);
            lines.push("");
          }
        });
      }

      if (synthesis.openGaps) {
        lines.push("## Open Gaps");
        lines.push("");
        lines.push(synthesis.openGaps);
        lines.push("");
      }

      if (contradictions.length > 0) {
        lines.push("## Contradictions");
        lines.push("");
        contradictions.forEach((c, i) => {
          const pa = selectedPapers.find((p) => p.id === c.paperAId);
          const pb = selectedPapers.find((p) => p.id === c.paperBId);
          lines.push(`### ${i + 1}. ${pa?.title || "?"} vs. ${pb?.title || "?"}`);
          lines.push("");
          lines.push(`**${pa?.title || "?"}:** ${c.paperAClaim || "—"}`);
          lines.push(`**${pb?.title || "?"}:** ${c.paperBClaim || "—"}`);
          lines.push("");
          lines.push(`**Contradiction:** ${c.contradiction || "—"}`);
          if (c.resolvedBy) {
            lines.push(`**Resolution:** ${c.resolvedBy}`);
          }
          lines.push("");
        });
      }

      if (synthesis.emergingThemes) {
        lines.push("## Emerging Themes");
        lines.push("");
        lines.push(synthesis.emergingThemes);
        lines.push("");
      }

      if (synthesis.myTake) {
        lines.push("## My Take");
        lines.push("");
        lines.push(synthesis.myTake);
        lines.push("");
      }

      if (synthesis.futureDirections) {
        lines.push("## Future Directions");
        lines.push("");
        lines.push(synthesis.futureDirections);
        lines.push("");
      }

      const markdown = lines.join("\n");
      const blob = new Blob([markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${synthesis.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_synthesis.md`;
      a.click();
      URL.revokeObjectURL(url);
    };

    const sections = [
      { id: "overview", label: "Overview", icon: FileText },
      { id: "papers", label: "Papers", icon: BookOpen },
      { id: "consensus", label: "Consensus", icon: CheckCircle },
      { id: "contested", label: "Contested", icon: ArrowLeftRight },
      { id: "gaps", label: "Gaps", icon: AlertTriangle },
      { id: "contradictions", label: "Contradictions", icon: ArrowLeftRight },
      { id: "themes", label: "Themes", icon: Sparkles },
      { id: "mytake", label: "My Take", icon: Lightbulb },
      { id: "future", label: "Future", icon: Zap },
    ];

    const completedSections = [
      synthesis.consensusClaims,
      contestedPoints.length > 0,
      synthesis.openGaps,
      contradictions.length > 0,
      synthesis.emergingThemes,
      synthesis.myTake,
      synthesis.futureDirections,
    ].filter(Boolean).length;

    const cpCount = contestedPoints.length;
    const contraCount = contradictions.length;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col bg-white"
      >
        {/* Top Bar */}
        <div className="shrink-0 border-b border-[#eaeaea] bg-white px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-[#5e6a6e] hover:bg-[#f7f8fa] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div className="w-px h-6 bg-[#eaeaea]" />
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded flex items-center justify-center"
                  style={{ backgroundColor: `${color}15` }}
                >
                  <GitBranch className="w-3.5 h-3.5" style={{ color }} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#181a1b]">{synthesis.title}</h2>
                  <p className="text-[10px] text-[#5e6a6e]">
                    {mod?.name || "Unknown"} — {completedSections}/7 sections
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportMarkdown}
                className="text-xs gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Export Markdown
              </Button>
              <Button
                size="sm"
                onClick={() => handleFieldChange("dateModified", new Date().toISOString().split("T")[0])}
                className="text-xs bg-[#7c3aed] hover:bg-[#6d28d9] text-white gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                Save
              </Button>
            </div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="shrink-0 border-b border-[#eaeaea] bg-[#fafafa] px-6 overflow-x-auto">
          <div className="flex gap-1 py-2">
            {sections.map((s) => {
              const Icon = s.icon;
              const isActive = activeSection === s.id;
              const hasContent = (() => {
                switch (s.id) {
                  case "consensus": return !!synthesis.consensusClaims;
                  case "contested": return cpCount > 0;
                  case "gaps": return !!synthesis.openGaps;
                  case "contradictions": return contraCount > 0;
                  case "themes": return !!synthesis.emergingThemes;
                  case "mytake": return !!synthesis.myTake;
                  case "future": return !!synthesis.futureDirections;
                  default: return false;
                }
              })();
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-[#7c3aed] text-white"
                      : hasContent
                      ? "bg-white text-[#181a1b] border border-[#eaeaea]"
                      : "text-[#5e6a6e] hover:bg-white hover:text-[#181a1b]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {s.label}
                  {hasContent && !isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4caf50]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-4xl mx-auto px-8 py-6">
            {/* Overview */}
            {activeSection === "overview" && (
              <div className="space-y-6">
                <div className="p-6 bg-gradient-to-r from-[#f7f8fa] to-white rounded-xl border border-[#eaeaea]">
                  <h3 className="text-lg font-bold text-[#181a1b] mb-2">{synthesis.title}</h3>
                  {synthesis.description && (
                    <p className="text-sm text-[#5e6a6e] mb-4">{synthesis.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-xs text-[#5e6a6e]">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      {selectedPapers.length} papers selected
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="w-3.5 h-3.5" />
                      {completedSections}/7 sections filled
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      {cpCount} contested points
                    </span>
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {contraCount} contradictions
                    </span>
                  </div>
                </div>

                {/* Auto-suggestions summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SuggestionCard
                    title={`${allClaims.length} Claims Found`}
                    subtitle="From paper summaries"
                    items={allClaims.slice(0, 3)}
                    expanded={expandedSuggestion === "claims"}
                    onToggle={() => setExpandedSuggestion(expandedSuggestion === "claims" ? null : "claims")}
                    allItems={allClaims}
                  />
                  <SuggestionCard
                    title={`${allGaps.length} Gaps Found`}
                    subtitle="From paper summaries"
                    items={allGaps.slice(0, 3)}
                    expanded={expandedSuggestion === "gaps"}
                    onToggle={() => setExpandedSuggestion(expandedSuggestion === "gaps" ? null : "gaps")}
                    allItems={allGaps}
                  />
                  <SuggestionCard
                    title={`${potentialContradictions.length} Potential Contradictions`}
                    subtitle="Auto-detected from claims"
                    items={potentialContradictions.slice(0, 3).map(
                      (c) => `${c.paperA.title} vs. ${c.paperB.title}`
                    )}
                    expanded={expandedSuggestion === "contras"}
                    onToggle={() => setExpandedSuggestion(expandedSuggestion === "contras" ? null : "contras")}
                    allItems={potentialContradictions.map(
                      (c) => `${c.paperA.title} vs. ${c.paperB.title}`
                    )}
                    onUseItem={(idx) => {
                      const c = potentialContradictions[idx];
                      if (c) addContradiction(c.paperA.id, c.paperB.id, c.claimA, c.claimB);
                    }}
                    useLabel="Add to Contradictions"
                  />
                  <SuggestionCard
                    title={`${allSchemas.length} Schema Updates`}
                    subtitle="Mental model changes"
                    items={allSchemas.slice(0, 3)}
                    expanded={expandedSuggestion === "schemas"}
                    onToggle={() => setExpandedSuggestion(expandedSuggestion === "schemas" ? null : "schemas")}
                    allItems={allSchemas}
                  />
                </div>
              </div>
            )}

            {/* Papers Selection */}
            {activeSection === "papers" && (
              <div className="space-y-4">
                <p className="text-sm text-[#5e6a6e]">
                  Select which papers to include in this synthesis. Only papers with completed summaries are shown.
                </p>
                <div className="space-y-2">
                  {modulePapers.map((paper) => {
                    const isSelected = paperIds.includes(paper.id);
                    return (
                      <div
                        key={paper.id}
                        onClick={() => togglePaper(paper.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? "border-[#7c3aed] bg-[#7c3aed]/5"
                            : "border-[#eaeaea] hover:border-[#7c3aed]/30"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                              isSelected
                                ? "bg-[#7c3aed] border-[#7c3aed]"
                                : "border-[#eaeaea]"
                            }`}
                          >
                            {isSelected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#181a1b]">{paper.title}</p>
                            <p className="text-xs text-[#5e6a6e]">
                              {paper.authors} ({paper.year})
                            </p>
                            {paper.summary && (
                              <p className="text-[11px] text-[#5e6a6e] line-clamp-2 mt-1">
                                {(paper.summary.claim || paper.summary.theClaim || "").slice(0, 120)}
                                {((paper.summary.claim || paper.summary.theClaim || "").length > 120 ? "..." : "")}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Consensus Claims */}
            {activeSection === "consensus" && (
              <SectionEditor
                title="Consensus Claims"
                description="What do most of these papers agree on? What findings or claims are consistently supported across the literature?"
                value={synthesis.consensusClaims || ""}
                onChange={(v) => handleFieldChange("consensusClaims", v)}
                suggestions={allClaims}
                suggestionTitle="Claims from individual papers"
                onUseSuggestion={(text) => {
                  const current = synthesis.consensusClaims || "";
                  handleFieldChange("consensusClaims", current ? `${current}\n\n${text}` : text);
                }}
              />
            )}

            {/* Contested Points */}
            {activeSection === "contested" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-[#181a1b] mb-1">Contested Points</h3>
                  <p className="text-sm text-[#5e6a6e]">
                    What is actively debated? Map out the positions and which papers support each side.
                  </p>
                </div>

                <div className="space-y-4">
                  {contestedPoints.map((cp) => (
                    <div key={cp.id} className="p-5 rounded-xl border border-[#eaeaea] bg-[#fafafa]">
                      <div className="flex items-center justify-between mb-4">
                        <input
                          value={cp.topic || ""}
                          onChange={(e) => updateContestedPoint(cp.id, { topic: e.target.value })}
                          placeholder="What is contested? (e.g. Role of ACC in error detection)"
                          className="flex-1 text-sm font-bold text-[#181a1b] bg-transparent outline-none border-b border-transparent focus:border-[#7c3aed] pb-1 mr-4"
                        />
                        <button
                          onClick={() => deleteContestedPoint(cp.id)}
                          className="p-1.5 hover:bg-red-50 rounded text-[#5e6a6e] hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="text-[10px] font-bold text-[#5e6a6e] uppercase mb-1.5 block">
                            Position A
                          </label>
                          <AutoResizeTextarea
                            value={cp.positionA || ""}
                            onChange={(e) => updateContestedPoint(cp.id, { positionA: e.target.value })}
                            placeholder="What one side argues..."
                            minRows={2}
                            maxRows={8}
                            className="text-xs"
                          />
                          <PaperSelector
                            papers={selectedPapers}
                            selected={safeArray(cp.papersA)}
                            onChange={(ids) => updateContestedPoint(cp.id, { papersA: ids })}
                            label="Supporting papers"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-[#5e6a6e] uppercase mb-1.5 block">
                            Position B
                          </label>
                          <AutoResizeTextarea
                            value={cp.positionB || ""}
                            onChange={(e) => updateContestedPoint(cp.id, { positionB: e.target.value })}
                            placeholder="What the other side argues..."
                            minRows={2}
                            maxRows={8}
                            className="text-xs"
                          />
                          <PaperSelector
                            papers={selectedPapers}
                            selected={safeArray(cp.papersB)}
                            onChange={(ids) => updateContestedPoint(cp.id, { papersB: ids })}
                            label="Supporting papers"
                          />
                        </div>
                      </div>

                      <AutoResizeTextarea
                        value={cp.myNote || ""}
                        onChange={(e) => updateContestedPoint(cp.id, { myNote: e.target.value })}
                        placeholder="Your note on this debate — who do you think is right? Why?"
                        minRows={2}
                        maxRows={6}
                        className="text-xs border-dashed"
                      />
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addContestedPoint}
                    className="text-xs gap-1.5 w-full py-3 border-dashed"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Contested Point
                  </Button>
                </div>
              </div>
            )}

            {/* Open Gaps */}
            {activeSection === "gaps" && (
              <SectionEditor
                title="Open Gaps"
                description="What has no paper addressed? What questions remain unanswered across the entire set? This is gold for identifying your contribution."
                value={synthesis.openGaps || ""}
                onChange={(v) => handleFieldChange("openGaps", v)}
                suggestions={allGaps}
                suggestionTitle="Gaps noted in individual papers"
                onUseSuggestion={(text) => {
                  const current = synthesis.openGaps || "";
                  handleFieldChange("openGaps", current ? `${current}\n\n${text}` : text);
                }}
              />
            )}

            {/* Contradictions */}
            {activeSection === "contradictions" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-[#181a1b] mb-1">Contradictions</h3>
                  <p className="text-sm text-[#5e6a6e]">
                    Direct conflicts between papers — one says X, another says not-X. Map them explicitly.
                  </p>
                </div>

                {/* Auto-suggested contradictions */}
                {potentialContradictions.length > 0 && contradictions.length === 0 && (
                  <div className="p-4 rounded-xl border border-[#d97706]/30 bg-[#d97706]/5">
                    <p className="text-sm font-bold text-[#d97706] mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      {potentialContradictions.length} potential contradiction{potentialContradictions.length > 1 ? "s" : ""} detected
                    </p>
                    <div className="space-y-2">
                      {potentialContradictions.slice(0, 3).map((c, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-[#5e6a6e]">
                            {c.paperA.title} vs. {c.paperB.title}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => addContradiction(c.paperA.id, c.paperB.id, c.claimA, c.claimB)}
                            className="text-xs text-[#7c3aed] h-7"
                          >
                            <Plus className="w-3 h-3 mr-1" /> Add
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {contradictions.map((c) => (
                    <div key={c.id} className="p-5 rounded-xl border border-[#eaeaea] bg-[#fafafa]">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <ArrowLeftRight className="w-4 h-4 text-[#d97706]" />
                          <span className="text-sm font-bold text-[#181a1b]">Contradiction</span>
                        </div>
                        <button
                          onClick={() => deleteContradiction(c.id)}
                          className="p-1.5 hover:bg-red-50 rounded text-[#5e6a6e] hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="text-[10px] font-bold text-[#5e6a6e] uppercase mb-1.5 block">
                            Paper A
                          </label>
                          <select
                            value={c.paperAId || ""}
                            onChange={(e) => updateContradiction(c.id, { paperAId: e.target.value })}
                            className="w-full px-2 py-1.5 rounded border border-[#eaeaea] text-xs bg-white mb-2"
                          >
                            <option value="">Select paper...</option>
                            {selectedPapers.map((p) => (
                              <option key={p.id} value={p.id}>{p.title}</option>
                            ))}
                          </select>
                          <AutoResizeTextarea
                            value={c.paperAClaim || ""}
                            onChange={(e) => updateContradiction(c.id, { paperAClaim: e.target.value })}
                            placeholder="Claim from Paper A..."
                            minRows={2}
                            maxRows={6}
                            className="text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-[#5e6a6e] uppercase mb-1.5 block">
                            Paper B
                          </label>
                          <select
                            value={c.paperBId || ""}
                            onChange={(e) => updateContradiction(c.id, { paperBId: e.target.value })}
                            className="w-full px-2 py-1.5 rounded border border-[#eaeaea] text-xs bg-white mb-2"
                          >
                            <option value="">Select paper...</option>
                            {selectedPapers.map((p) => (
                              <option key={p.id} value={p.id}>{p.title}</option>
                            ))}
                          </select>
                          <AutoResizeTextarea
                            value={c.paperBClaim || ""}
                            onChange={(e) => updateContradiction(c.id, { paperBClaim: e.target.value })}
                            placeholder="Claim from Paper B..."
                            minRows={2}
                            maxRows={6}
                            className="text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <AutoResizeTextarea
                          value={c.contradiction || ""}
                          onChange={(e) => updateContradiction(c.id, { contradiction: e.target.value })}
                          placeholder="Describe the contradiction — what exactly conflicts?"
                          minRows={2}
                          maxRows={6}
                          className="text-xs"
                        />
                        <AutoResizeTextarea
                          value={c.resolvedBy || ""}
                          onChange={(e) => updateContradiction(c.id, { resolvedBy: e.target.value })}
                          placeholder="How do you resolve this? (methodological difference? population? context?)"
                          minRows={2}
                          maxRows={6}
                          className="text-xs border-dashed"
                        />
                      </div>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addContradiction()}
                    className="text-xs gap-1.5 w-full py-3 border-dashed"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Contradiction
                  </Button>
                </div>
              </div>
            )}

            {/* Emerging Themes */}
            {activeSection === "themes" && (
              <SectionEditor
                title="Emerging Themes"
                description="What patterns do you see across these papers? What threads connect them that no individual paper highlights?"
                value={synthesis.emergingThemes || ""}
                onChange={(v) => handleFieldChange("emergingThemes", v)}
                suggestions={allSchemas}
                suggestionTitle="Schema updates from individual papers"
                onUseSuggestion={(text) => {
                  const current = synthesis.emergingThemes || "";
                  handleFieldChange("emergingThemes", current ? `${current}\n\n${text}` : text);
                }}
              />
            )}

            {/* My Take */}
            {activeSection === "mytake" && (
              <SectionEditor
                title="My Take"
                description="Your synthesis of the field. What's the story these papers tell together? Where do you stand?"
                value={synthesis.myTake || ""}
                onChange={(v) => handleFieldChange("myTake", v)}
                suggestions={[]}
              />
            )}

            {/* Future Directions */}
            {activeSection === "future" && (
              <SectionEditor
                title="Future Directions"
                description="Where should this field go next? What experiments should be run? What questions should be asked?"
                value={synthesis.futureDirections || ""}
                onChange={(v) => handleFieldChange("futureDirections", v)}
                suggestions={allSteals}
                suggestionTitle="Methods/ideas to steal"
                onUseSuggestion={(text) => {
                  const current = synthesis.futureDirections || "";
                  handleFieldChange("futureDirections", current ? `${current}\n\n${text}` : text);
                }}
              />
            )}
          </div>
        </div>
      </motion.div>
    );
  } catch (err) {
    console.error("[SynthesisEditor] render error:", err);
    onError();
    return null;
  }
}

// --- Sub-components ---

function SuggestionCard({
  title,
  subtitle,
  items,
  expanded,
  onToggle,
  allItems,
  onUseItem,
  useLabel,
}: {
  title: string;
  subtitle: string;
  items: string[];
  expanded: boolean;
  onToggle: () => void;
  allItems: string[];
  onUseItem?: (index: number) => void;
  useLabel?: string;
}) {
  return (
    <div className="p-4 rounded-xl border border-[#eaeaea] bg-white">
      <button onClick={onToggle} className="w-full text-left flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-[#181a1b]">{title}</p>
          <p className="text-[11px] text-[#5e6a6e]">{subtitle}</p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-[#5e6a6e]" /> : <ChevronDown className="w-4 h-4 text-[#5e6a6e]" />}
      </button>
      {expanded && (
        <div className="mt-3 space-y-2 border-t border-[#eaeaea] pt-3">
          {allItems.map((item, i) => (
            <div key={i} className="flex items-start justify-between gap-2">
              <p className="text-[11px] text-[#5e6a6e] line-clamp-3 flex-1">{item}</p>
              {onUseItem && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onUseItem(i)}
                  className="text-[10px] text-[#7c3aed] h-6 shrink-0"
                >
                  {useLabel || "Use"}
                </Button>
              )}
            </div>
          ))}
          {allItems.length === 0 && (
            <p className="text-[11px] text-[#9ca3af] italic">No items found yet.</p>
          )}
        </div>
      )}
      {!expanded && items.length > 0 && (
        <div className="mt-2 space-y-1">
          {items.map((item, i) => (
            <p key={i} className="text-[11px] text-[#5e6a6e] line-clamp-1">{item}</p>
          ))}
          {allItems.length > items.length && (
            <p className="text-[10px] text-[#9ca3af]">+{allItems.length - items.length} more</p>
          )}
        </div>
      )}
    </div>
  );
}

function SectionEditor({
  title,
  description,
  value,
  onChange,
  suggestions,
  suggestionTitle,
  onUseSuggestion,
}: {
  title: string;
  description: string;
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
  suggestionTitle?: string;
  onUseSuggestion?: (text: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-[#181a1b] mb-1">{title}</h3>
        <p className="text-sm text-[#5e6a6e]">{description}</p>
      </div>

      <AutoResizeTextarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Write your ${title.toLowerCase()} here...`}
        minRows={4}
        maxRows={20}
        className="text-sm border-[#eaeaea] focus:border-[#7c3aed] bg-[#fafafa] focus:bg-white"
      />

      {suggestions.length > 0 && onUseSuggestion && (
        <div className="p-4 rounded-xl border border-[#eaeaea] bg-[#fafafa]">
          <p className="text-xs font-bold text-[#5e6a6e] mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#d97706]" />
            {suggestionTitle || "Suggestions from paper summaries"}
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {suggestions.map((s, i) => (
              <div
                key={i}
                onClick={() => onUseSuggestion(s)}
                className="p-2.5 rounded-lg bg-white border border-[#eaeaea] hover:border-[#7c3aed]/30 cursor-pointer transition-all group"
              >
                <p className="text-[11px] text-[#5e6a6e] line-clamp-3 group-hover:text-[#181a1b]">{s}</p>
                <p className="text-[9px] text-[#7c3aed] mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to insert
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PaperSelector({
  papers,
  selected,
  onChange,
  label,
}: {
  papers: Paper[];
  selected: string[];
  onChange: (ids: string[]) => void;
  label: string;
}) {
  return (
    <div className="mt-2">
      <p className="text-[10px] font-bold text-[#5e6a6e] uppercase mb-1">{label}</p>
      <div className="flex flex-wrap gap-1">
        {papers.map((p) => {
          const isSelected = selected.includes(p.id);
          return (
            <button
              key={p.id}
              onClick={() => {
                onChange(
                  isSelected ? selected.filter((id) => id !== p.id) : [...selected, p.id]
                );
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                isSelected
                  ? "bg-[#7c3aed] text-white"
                  : "bg-white border border-[#eaeaea] text-[#5e6a6e] hover:border-[#7c3aed]/30"
              }`}
            >
              {p.title.slice(0, 40)}{p.title.length > 40 ? "..." : ""}
            </button>
          );
        })}
        {papers.length === 0 && (
          <span className="text-[10px] text-[#9ca3af] italic">No papers selected</span>
        )}
      </div>
    </div>
  );
}
