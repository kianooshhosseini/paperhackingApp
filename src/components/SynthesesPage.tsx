import { useState, useMemo } from "react";
import {
  Plus, BookOpen, FileText, ArrowRight, GitBranch,
  Target, CheckCircle,
  Trash2, ChevronRight, Layers,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { Synthesis, Module, Paper, ReadingPlan } from "@/data/types";

interface SynthesesPageProps {
  syntheses: Synthesis[];
  papers: Paper[];
  modules: Module[];
  plans: ReadingPlan[];
  onCreateSynthesis: (synthesis: Omit<Synthesis, "id" | "dateCreated" | "dateModified">) => string;
  onDeleteSynthesis: (id: string) => void;
  onOpenSynthesis: (id: string) => void;
}

export function SynthesesPage({
  syntheses,
  papers,
  modules,
  plans,
  onCreateSynthesis,
  onDeleteSynthesis,
  onOpenSynthesis,
}: SynthesesPageProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Modules with 3+ completed papers (threshold for synthesis)
  const eligibleModules = useMemo(() => {
    return modules
      .map((mod) => {
        const modPapers = papers.filter((p) => p.moduleId === mod.id);
        const completed = modPapers.filter((p) => p.status === "completed");
        const hasSummaries = completed.filter((p) => p.summary);
        return {
          module: mod,
          plan: plans.find((pl) => pl.id === mod.planId),
          total: modPapers.length,
          completed: completed.length,
          withSummaries: hasSummaries.length,
          eligible: hasSummaries.length >= 3,
        };
      })
      .sort((a, b) => (b.eligible ? 1 : 0) - (a.eligible ? 1 : 0));
  }, [modules, papers, plans]);

  const selectedModuleData = eligibleModules.find(
    (m) => m.module.id === selectedModuleId
  );

  const safeSyntheses = syntheses ?? [];

  const moduleSyntheses = useMemo(() => {
    const byModule = new Map<string, Synthesis[]>();
    safeSyntheses.forEach((s) => {
      const list = byModule.get(s.moduleId) || [];
      list.push(s);
      byModule.set(s.moduleId, list);
    });
    return byModule;
  }, [safeSyntheses]);

  const handleCreate = () => {
    if (!selectedModuleId || !title.trim()) return;
    const mod = modules.find((m) => m.id === selectedModuleId);
    const plan = plans.find((p) => p.id === mod?.planId);
    if (!mod || !plan) return;

    const completedPaperIds = papers
      .filter((p) => p.moduleId === selectedModuleId && p.status === "completed")
      .map((p) => p.id);

    const id = onCreateSynthesis({
      title: title.trim(),
      description: description.trim(),
      planId: plan.id,
      moduleId: mod.id,
      paperIds: completedPaperIds,
      consensusClaims: "",
      contestedPoints: [],
      openGaps: "",
      contradictions: [],
      emergingThemes: "",
      myTake: "",
      futureDirections: "",
    });

    setShowCreate(false);
    setTitle("");
    setDescription("");
    setSelectedModuleId("");
    onOpenSynthesis(id);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-8 py-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[28px] font-bold text-[#181a1b] tracking-tight">
              Synthesis Mode
            </h1>
            <p className="text-sm text-[#5e6a6e] mt-1">
              Cross-paper argument mapping for literature reviews
            </p>
          </div>
          <Button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white gap-2 text-sm"
          >
            {showCreate ? (
              <>
                <ChevronRight className="w-4 h-4" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                New Synthesis
              </>
            )}
          </Button>
        </div>

        {/* Create Form */}
        {showCreate && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="overflow-hidden mb-8"
          >
            <div className="bg-white rounded-xl border border-[#eaeaea] p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-[#181a1b] flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-[#7c3aed]" />
                Create New Synthesis
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#5e6a6e] uppercase mb-1.5 block">
                    Select Module
                  </label>
                  <select
                    value={selectedModuleId}
                    onChange={(e) => setSelectedModuleId(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-[#eaeaea] text-sm bg-white focus:border-[#7c3aed] outline-none"
                  >
                    <option value="">Choose a module...</option>
                    {eligibleModules
                      .filter((m) => m.eligible)
                      .map((m) => (
                        <option key={m.module.id} value={m.module.id}>
                          {m.plan?.name} — {m.module.name} ({m.withSummaries} papers)
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#5e6a6e] uppercase mb-1.5 block">
                    Synthesis Title
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Conflict Monitoring: The State of the Debate"
                    className="w-full px-3 py-2 rounded-md border border-[#eaeaea] text-sm outline-none focus:border-[#7c3aed]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5e6a6e] uppercase mb-1.5 block">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What are you trying to synthesize across these papers?"
                  rows={2}
                  className="w-full rounded-md border border-[#eaeaea] bg-transparent px-3 py-2 text-sm outline-none focus:border-[#7c3aed] resize-none"
                />
              </div>

              {selectedModuleData && (
                <div className="p-3 rounded-lg bg-[#f7f8fa] text-xs text-[#5e6a6e]">
                  <div className="flex items-center gap-4">
                    <span>
                      <strong className="text-[#181a1b]">{selectedModuleData.withSummaries}</strong> papers with summaries
                    </span>
                    <span>
                      <strong className="text-[#181a1b]">{selectedModuleData.completed}</strong> completed total
                    </span>
                    <span>
                      Module: <strong className="text-[#181a1b]">{selectedModuleData.module.name}</strong>
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowCreate(false)} className="text-xs">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreate}
                  disabled={!selectedModuleId || !title.trim()}
                  className="text-xs bg-[#7c3aed] hover:bg-[#6d28d9] text-white"
                >
                  <ArrowRight className="w-3.5 h-3.5 mr-1" />
                  Create & Open Editor
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Eligible Modules — Quick Start */}
        <div className="mb-8">
          <h2 className="text-sm font-bold text-[#5e6a6e] uppercase tracking-[0.08em] mb-4">
            Ready to Synthesize
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {eligibleModules
              .filter((m) => m.eligible)
              .map((m) => {
                const color = m.module.color;
                const existingCount = moduleSyntheses.get(m.module.id)?.length || 0;
                return (
                  <div
                    key={m.module.id}
                    onClick={() => {
                      setSelectedModuleId(m.module.id);
                      setShowCreate(true);
                    }}
                    className="p-4 rounded-xl border border-[#eaeaea] bg-white hover:border-[#7c3aed]/30 cursor-pointer transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${color}15` }}
                        >
                          <Layers className="w-4 h-4" style={{ color }} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#181a1b] group-hover:text-[#7c3aed] transition-colors">
                            {m.module.name}
                          </p>
                          <p className="text-[11px] text-[#5e6a6e]">
                            {m.plan?.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {existingCount > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#f7f8fa] text-[#5e6a6e]">
                            {existingCount} synthesis{existingCount > 1 ? "es" : ""}
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-[#9ca3af] group-hover:text-[#7c3aed]" />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-[11px] text-[#5e6a6e]">
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-[#4caf50]" />
                        {m.withSummaries} with summaries
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3 text-[#4293a7]" />
                        {m.total} total
                      </span>
                    </div>
                  </div>
                );
              })}

            {eligibleModules.filter((m) => m.eligible).length === 0 && (
              <div className="col-span-2 text-center py-8 bg-[#f7f8fa] rounded-xl border border-dashed border-[#eaeaea]">
                <BookOpen className="w-8 h-8 text-[#eaeaea] mx-auto mb-2" />
                <p className="text-sm text-[#5e6a6e]">
                  No modules have enough completed papers yet.
                </p>
                <p className="text-xs text-[#9ca3af] mt-1">
                  Complete summaries for at least 3 papers in a module to unlock synthesis.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Your Syntheses */}
        {safeSyntheses.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-[#5e6a6e] uppercase tracking-[0.08em] mb-4">
              Your Syntheses ({safeSyntheses.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {safeSyntheses
                .sort((a, b) => b.dateModified.localeCompare(a.dateModified))
                .map((synth) => {
                  const mod = modules.find((m) => m.id === synth.moduleId);
                  const plan = plans.find((p) => p.id === synth.planId);
                  const color = mod?.color || "#7c3aed";
                  const completedFields = [
                    synth.consensusClaims,
                    synth.contestedPoints.length > 0 ? "has" : "",
                    synth.openGaps,
                    synth.contradictions.length > 0 ? "has" : "",
                    synth.emergingThemes,
                    synth.myTake,
                  ].filter(Boolean).length;
                  const totalFields = 6;

                  return (
                    <motion.div
                      key={synth.id}
                      layout
                      onClick={() => onOpenSynthesis(synth.id)}
                      className="p-5 bg-white rounded-xl border border-[#eaeaea] hover:border-[#7c3aed]/30 cursor-pointer transition-all group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${color}15` }}
                          >
                            <GitBranch className="w-3.5 h-3.5" style={{ color }} />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-[#181a1b] group-hover:text-[#7c3aed] transition-colors">
                              {synth.title}
                            </h3>
                            <p className="text-[10px] text-[#5e6a6e]">
                              {plan?.name} — {mod?.name}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSynthesis(synth.id);
                          }}
                          className="p-1 hover:bg-red-50 rounded text-[#5e6a6e] hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-xs text-[#5e6a6e] line-clamp-2 mb-3">
                        {synth.description || "No description"}
                      </p>

                      <div className="flex items-center gap-4 text-[10px] text-[#5e6a6e]">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {synth.paperIds.length} papers
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {Math.round((completedFields / totalFields) * 100)}% complete
                        </span>
                        <span className="ml-auto text-[#9ca3af]">
                          {new Date(synth.dateModified).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-2 w-full h-1 bg-[#eaeaea] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(completedFields / totalFields) * 100}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
