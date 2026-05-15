import { useState } from "react";
import {
  FolderOpen, Plus, BookOpen, CheckCircle, Trash2, Edit3,
  Calendar, BrainCircuit, Star, ChevronDown, ChevronRight, FileText,
  StickyNote, Lightbulb, HelpCircle, ListTodo,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ReadingPlan, Module, Paper } from "@/data/types";

interface ReadingPlansPageProps {
  plans: ReadingPlan[];
  modules: Module[];
  papers: Paper[];
  onAddPlan: (name: string, description: string, priority: number, color: string) => string;
  onUpdatePlan: (id: string, updates: Partial<ReadingPlan>) => void;
  onDeletePlan: (id: string) => void;
  onAddModule: (planId: string, name: string, description: string, color: string, priority: number) => string;
  onUpdateModule: (id: string, updates: Partial<Module>) => void;
  onDeleteModule: (id: string) => void;
  onPaperClick: (paper: Paper) => void;
  onAddPaper: (paper: Omit<Paper, "id" | "dateAdded">) => string;
}

const PRESET_COLORS = [
  "#4293a7", "#7c3aed", "#d97706", "#059669", "#dc2626",
  "#0891b2", "#be185d", "#4f46e5", "#b45309", "#047857",
];

function PriorityStars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onChange(star === value ? 0 : star)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={`w-4 h-4 ${
              star <= value ? "text-[#d97706] fill-[#d97706]" : "text-[#eaeaea]"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// Roadmap/Notes editor for a module or plan
function NotesEditor({
  notes,
  onSave,
}: {
  notes: string;
  onSave: (text: string) => void;
}) {
  const [text, setText] = useState(notes || "");
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-[#eaeaea] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-[#4293a7]" />
          <span className="text-sm font-semibold text-[#181a1b]">Roadmap & Notes</span>
        </div>
        {isEditing ? (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="text-xs" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button size="sm" className="text-xs bg-[#4293a7]" onClick={() => { onSave(text); setIsEditing(false); }}>Save</Button>
          </div>
        ) : (
          <Button size="sm" variant="ghost" className="text-xs text-[#5e6a6e]" onClick={() => setIsEditing(true)}>
            <Edit3 className="w-3 h-3 mr-1" /> Edit
          </Button>
        )}
      </div>

      {isEditing ? (
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Write about:\n- Learning goals\n- What you've learned so far\n- Questions you have\n- Papers you need to add\n- Any other notes`}
          rows={8}
          className="text-sm resize-none border-[#eaeaea] focus:border-[#4293a7] bg-[#fafafa] focus:bg-white"
        />
      ) : (
        <div>
          {text ? (
            <pre className="text-xs text-[#181a1b] whitespace-pre-wrap font-sans leading-relaxed">{text}</pre>
          ) : (
            <div className="text-center py-4">
              <div className="flex items-center justify-center gap-4 mb-3">
                <div className="flex flex-col items-center gap-1 text-[#9ca3af]">
                  <Lightbulb className="w-5 h-5" />
                  <span className="text-[9px]">Goals</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-[#9ca3af]">
                  <ListTodo className="w-5 h-5" />
                  <span className="text-[9px]">Progress</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-[#9ca3af]">
                  <HelpCircle className="w-5 h-5" />
                  <span className="text-[9px]">Questions</span>
                </div>
              </div>
              <p className="text-xs text-[#9ca3af]">No notes yet. Click Edit to add your roadmap.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ReadingPlansPage({
  plans,
  modules,
  papers,
  onAddPlan,
  onUpdatePlan,
  onDeletePlan,
  onAddModule,
  onUpdateModule,
  onDeleteModule,
  onPaperClick,
  onAddPaper,
}: ReadingPlansPageProps) {
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [showAddModule, setShowAddModule] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [editingModule, setEditingModule] = useState<string | null>(null);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [expandedPlanNotes, setExpandedPlanNotes] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "plan" | "module"; id: string } | null>(null);
  const [planForm, setPlanForm] = useState({ name: "", description: "", priority: 3 });
  const [moduleForm, setModuleForm] = useState({ name: "", description: "", color: PRESET_COLORS[0], priority: 3 });
  const [addPaperModuleId, setAddPaperModuleId] = useState<string | null>(null);
  const [paperForm, setPaperForm] = useState({
    title: "", authors: "", year: new Date().getFullYear(), doi: "",
    importance: "", keywords: "", week: 1,
  });

  const handleAddPlan = () => {
    if (!planForm.name.trim()) return;
    onAddPlan(planForm.name, planForm.description, planForm.priority, PRESET_COLORS[plans.length % PRESET_COLORS.length]);
    setPlanForm({ name: "", description: "", priority: 3 });
    setShowAddPlan(false);
  };

  const handleAddModule = (planId: string) => {
    if (!moduleForm.name.trim()) return;
    onAddModule(planId, moduleForm.name, moduleForm.description, moduleForm.color, moduleForm.priority);
    setModuleForm({ name: "", description: "", color: PRESET_COLORS[0], priority: 3 });
    setShowAddModule(null);
  };

  const handleUpdatePlan = (id: string) => {
    if (!planForm.name.trim()) return;
    onUpdatePlan(id, { name: planForm.name, description: planForm.description, priority: planForm.priority });
    setEditingPlan(null);
    setPlanForm({ name: "", description: "", priority: 3 });
  };

  const handleUpdateModule = (id: string) => {
    if (!moduleForm.name.trim()) return;
    onUpdateModule(id, { name: moduleForm.name, description: moduleForm.description, priority: moduleForm.priority, color: moduleForm.color });
    setEditingModule(null);
    setModuleForm({ name: "", description: "", color: PRESET_COLORS[0], priority: 3 });
  };

  const startEditingPlan = (plan: ReadingPlan) => {
    setEditingPlan(plan.id);
    setPlanForm({ name: plan.name, description: plan.description, priority: plan.priority });
  };

  const startEditingModule = (mod: Module) => {
    setEditingModule(mod.id);
    setModuleForm({ name: mod.name, description: mod.description, color: mod.color, priority: mod.priority });
  };

  const handleAddPaperToModule = (moduleId: string) => {
    if (!paperForm.title.trim()) return;
    const mod = modules.find((m) => m.id === moduleId);
    const plan = plans.find((p) => p.id === mod?.planId);
    onAddPaper({
      title: paperForm.title,
      authors: paperForm.authors,
      year: Number(paperForm.year),
      doi: paperForm.doi,
      importance: paperForm.importance,
      keywords: paperForm.keywords.split(",").map((k) => k.trim()).filter(Boolean),
      week: Number(paperForm.week),
      planId: plan?.id || "",
      moduleId,
      topic: mod?.name || "",
      topicSlug: mod?.slug || "",
      order: 0,
      templateId: "",
      status: "active" as const,
    });
    setPaperForm({ title: "", authors: "", year: new Date().getFullYear(), doi: "", importance: "", keywords: "", week: 1 });
    setAddPaperModuleId(null);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-8 py-6">
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[28px] font-bold text-[#181a1b] tracking-tight mb-1">Reading Plans</h1>
              <p className="text-sm text-[#5e6a6e]">Create plans and modules. Priority (1-5) affects scheduling order.</p>
            </div>
            {!showAddPlan && (
              <Button onClick={() => setShowAddPlan(true)} className="bg-[#4293a7] hover:bg-[#357a8a] text-white gap-2 text-sm">
                <Plus className="w-4 h-4" /> New Plan
              </Button>
            )}
          </div>
        </header>

        {/* Add/Edit Plan Form */}
        <AnimatePresence>
          {showAddPlan && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-6">
              <div className="bg-white rounded-xl border border-[#eaeaea] p-5 shadow-sm space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-[#5e6a6e] uppercase mb-1.5 block">Plan Name</label>
                    <Input value={planForm.name} onChange={(e) => setPlanForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Cognitive Neuroscience" className="text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#5e6a6e] uppercase mb-1.5 block">Priority</label>
                    <PriorityStars value={planForm.priority} onChange={(v) => setPlanForm((p) => ({ ...p, priority: v }))} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#5e6a6e] uppercase mb-1.5 block">Description</label>
                  <Input value={planForm.description} onChange={(e) => setPlanForm((p) => ({ ...p, description: e.target.value }))} placeholder="What is this plan about?" className="text-sm" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setShowAddPlan(false); setEditingPlan(null); }} className="text-xs">Cancel</Button>
                  <Button size="sm" onClick={handleAddPlan} disabled={!planForm.name.trim()} className="text-xs bg-[#4293a7]">Create Plan</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Plans List */}
        {plans.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-[#eaeaea]">
            <FolderOpen className="w-10 h-10 text-[#a8ccd5] mx-auto mb-3" />
            <p className="text-sm font-semibold text-[#181a1b]">No reading plans yet</p>
            <p className="text-xs text-[#5e6a6e] mt-1 mb-4">Create your first plan to start organizing papers.</p>
            <Button size="sm" onClick={() => setShowAddPlan(true)} className="bg-[#4293a7] text-xs gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Create Plan
            </Button>
          </div>
        )}

        <div className="space-y-6">
          {plans.map((plan) => {
            const planModules = modules.filter((m) => m.planId === plan.id);
            const isEditing = editingPlan === plan.id;
            const showNotes = expandedPlanNotes === plan.id;

            return (
              <motion.div key={plan.id} layout className="bg-white rounded-xl border border-[#eaeaea] shadow-sm overflow-hidden">
                {/* Plan Header */}
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${plan.color}15` }}>
                          <BrainCircuit className="w-4 h-4" style={{ color: plan.color }} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-[#181a1b] truncate">{plan.name}</h3>
                            <PriorityStars value={plan.priority} onChange={(p) => onUpdatePlan(plan.id, { priority: p })} />
                          </div>
                          <p className="text-xs text-[#5e6a6e]">{plan.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-2 ml-11">
                        <span className="text-[11px] text-[#5e6a6e] flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {planModules.length} module{planModules.length !== 1 ? "s" : ""}
                        </span>
                        <span className="text-[11px] text-[#5e6a6e] flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> {papers.filter((p) => p.planId === plan.id).length} papers
                        </span>
                        <span className="text-[11px] text-[#4caf50] flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> {papers.filter((p) => p.planId === plan.id && p.status === "completed").length} done
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setExpandedPlanNotes(showNotes ? null : plan.id)}
                        className={`p-1.5 rounded hover:bg-[#f7f8fa] transition-colors ${showNotes ? "text-[#4293a7]" : "text-[#5e6a6e]"}`}
                        title="Plan notes"
                      >
                        <StickyNote className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => startEditingPlan(plan)} className="p-1.5 rounded hover:bg-[#f7f8fa] text-[#5e6a6e]">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteConfirm({ type: "plan", id: plan.id })} className="p-1.5 rounded hover:bg-red-50 text-[#5e6a6e] hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Edit Plan Inline */}
                  <AnimatePresence>
                    {isEditing && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-3 ml-11">
                        <div className="bg-[#f7f8fa] rounded-lg p-3 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <Input value={planForm.name} onChange={(e) => setPlanForm((p) => ({ ...p, name: e.target.value }))} className="text-xs" />
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[#5e6a6e]">Priority:</span>
                              <PriorityStars value={planForm.priority} onChange={(v) => setPlanForm((p) => ({ ...p, priority: v }))} />
                            </div>
                          </div>
                          <Input value={planForm.description} onChange={(e) => setPlanForm((p) => ({ ...p, description: e.target.value }))} className="text-xs" />
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="text-xs" onClick={() => setEditingPlan(null)}>Cancel</Button>
                            <Button size="sm" className="text-xs bg-[#4293a7]" onClick={() => handleUpdatePlan(plan.id)}>Save</Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Plan Notes */}
                  <AnimatePresence>
                    {showNotes && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-3 ml-11">
                        <NotesEditor
                          notes={plan.notes || ""}
                          onSave={(text) => onUpdatePlan(plan.id, { notes: text })}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Modules */}
                  {planModules.length > 0 && (
                    <div className="mt-3 ml-11 space-y-2">
                      {planModules.map((mod) => {
                        const modPapers = papers.filter((p) => p.moduleId === mod.id);
                        const modCompleted = modPapers.filter((p) => p.status === "completed");
                        const isExpanded = expandedModule === mod.id;
                        const isEditingMod = editingModule === mod.id;
                        const isAddingPaper = addPaperModuleId === mod.id;

                        return (
                          <div key={mod.id} className="border border-[#eaeaea] rounded-lg overflow-hidden">
                            {/* Module Header */}
                            <div
                              className="flex items-center justify-between p-2.5 bg-[#f7f8fa] cursor-pointer hover:bg-[#f0f1f3] transition-colors"
                              onClick={() => setExpandedModule(isExpanded ? null : mod.id)}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: mod.color }} />
                                <span className="text-xs font-semibold text-[#181a1b] truncate">{mod.name}</span>
                                <PriorityStars value={mod.priority} onChange={(p) => onUpdateModule(mod.id, { priority: p })} />
                                <span className="text-[10px] text-[#5e6a6e] shrink-0">{modPapers.length} papers</span>
                                {modCompleted.length > 0 && <span className="text-[10px] text-[#4caf50] shrink-0">{modCompleted.length} done</span>}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button onClick={(e) => { e.stopPropagation(); startEditingModule(mod); }} className="p-1 rounded hover:bg-white text-[#5e6a6e]">
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ type: "module", id: mod.id }); }} className="p-1 rounded hover:bg-red-50 text-[#5e6a6e] hover:text-red-500">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                                {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-[#5e6a6e]" /> : <ChevronRight className="w-3.5 h-3.5 text-[#5e6a6e]" />}
                              </div>
                            </div>

                            {/* Edit Module Inline */}
                            <AnimatePresence>
                              {isEditingMod && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                  <div className="p-3 space-y-3 bg-white border-t border-[#eaeaea]">
                                    <div className="grid grid-cols-2 gap-3">
                                      <Input value={moduleForm.name} onChange={(e) => setModuleForm((p) => ({ ...p, name: e.target.value }))} placeholder="Module name" className="text-xs" />
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-[#5e6a6e]">Priority:</span>
                                        <PriorityStars value={moduleForm.priority} onChange={(v) => setModuleForm((p) => ({ ...p, priority: v }))} />
                                      </div>
                                    </div>
                                    <Input value={moduleForm.description} onChange={(e) => setModuleForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description" className="text-xs" />
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-[#5e6a6e]">Color:</span>
                                      {PRESET_COLORS.map((c) => (
                                        <button key={c} onClick={() => setModuleForm((p) => ({ ...p, color: c }))} className={`w-5 h-5 rounded-full ${moduleForm.color === c ? "ring-2 ring-offset-1 ring-[#4293a7]" : ""}`} style={{ backgroundColor: c }} />
                                      ))}
                                    </div>
                                    <div className="flex gap-2">
                                      <Button size="sm" variant="outline" className="text-xs" onClick={() => setEditingModule(null)}>Cancel</Button>
                                      <Button size="sm" className="text-xs bg-[#4293a7]" onClick={() => handleUpdateModule(mod.id)} disabled={!moduleForm.name.trim()}>Save</Button>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Expanded Module: Papers + Notes + Add Paper */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                  <div className="p-3 bg-white border-t border-[#eaeaea] space-y-3">
                                    {/* Module Notes */}
                                    <NotesEditor
                                      notes={mod.notes || ""}
                                      onSave={(text) => onUpdateModule(mod.id, { notes: text })}
                                    />

                                    {/* Papers list */}
                                    <div>
                                      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#9ca3af] mb-2">Papers</p>
                                      {modPapers.length === 0 && (
                                        <p className="text-xs text-[#9ca3af] py-2">No papers in this module yet.</p>
                                      )}
                                      <div className="space-y-1">
                                        {modPapers.map((p) => (
                                          <div
                                            key={p.id}
                                            onClick={() => p.status !== "locked" && onPaperClick(p)}
                                            className={`flex items-center gap-2 p-2 rounded-lg ${p.status !== "locked" ? "cursor-pointer hover:bg-[#f7f8fa]" : ""} ${p.status === "completed" ? "opacity-60" : ""}`}
                                          >
                                            <FileText className="w-3.5 h-3.5 text-[#4293a7] shrink-0" />
                                            <div className="flex-1 min-w-0">
                                              <p className={`text-xs font-medium truncate ${p.status === "completed" ? "text-[#4caf50] line-through" : "text-[#181a1b]"}`}>{p.title}</p>
                                              <p className="text-[10px] text-[#9ca3af]">{p.authors} ({p.year})</p>
                                            </div>
                                            {p.status === "completed" && <CheckCircle className="w-3.5 h-3.5 text-[#4caf50] shrink-0" />}
                                            {p.pdf && <span className="text-[9px] text-[#4293a7] bg-[#4293a7]/10 px-1 rounded">PDF</span>}
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Add Paper Form */}
                                    {isAddingPaper ? (
                                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#f7f8fa] rounded-lg p-3 space-y-2 mt-2">
                                        <Input value={paperForm.title} onChange={(e) => setPaperForm((p) => ({ ...p, title: e.target.value }))} placeholder="Paper title" className="text-xs" />
                                        <div className="grid grid-cols-2 gap-2">
                                          <Input value={paperForm.authors} onChange={(e) => setPaperForm((p) => ({ ...p, authors: e.target.value }))} placeholder="Authors" className="text-xs" />
                                          <Input type="number" value={paperForm.year} onChange={(e) => setPaperForm((p) => ({ ...p, year: Number(e.target.value) }))} placeholder="Year" className="text-xs" />
                                        </div>
                                        <Input value={paperForm.doi} onChange={(e) => setPaperForm((p) => ({ ...p, doi: e.target.value }))} placeholder="DOI" className="text-xs" />
                                        <Input value={paperForm.importance} onChange={(e) => setPaperForm((p) => ({ ...p, importance: e.target.value }))} placeholder="Why read this?" className="text-xs" />
                                        <Input value={paperForm.keywords} onChange={(e) => setPaperForm((p) => ({ ...p, keywords: e.target.value }))} placeholder="Keywords (comma-separated)" className="text-xs" />
                                        <div className="flex gap-2">
                                          <Button size="sm" variant="outline" className="text-xs" onClick={() => setAddPaperModuleId(null)}>Cancel</Button>
                                          <Button size="sm" className="text-xs bg-[#4293a7]" onClick={() => handleAddPaperToModule(mod.id)} disabled={!paperForm.title.trim()}>Add Paper</Button>
                                        </div>
                                      </motion.div>
                                    ) : (
                                      <button onClick={() => setAddPaperModuleId(mod.id)} className="flex items-center gap-1.5 text-xs text-[#4293a7] hover:underline font-medium mt-1">
                                        <Plus className="w-3.5 h-3.5" /> Add Paper to Module
                                      </button>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add Module Button */}
                  <div className="mt-3 ml-11">
                    {showAddModule === plan.id ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#f7f8fa] rounded-lg p-3 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <Input value={moduleForm.name} onChange={(e) => setModuleForm((p) => ({ ...p, name: e.target.value }))} placeholder="Module name" className="text-xs" />
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#5e6a6e]">Priority:</span>
                            <PriorityStars value={moduleForm.priority} onChange={(v) => setModuleForm((p) => ({ ...p, priority: v }))} />
                          </div>
                        </div>
                        <Input value={moduleForm.description} onChange={(e) => setModuleForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description" className="text-xs" />
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#5e6a6e]">Color:</span>
                          {PRESET_COLORS.map((c) => (
                            <button key={c} onClick={() => setModuleForm((p) => ({ ...p, color: c }))} className={`w-5 h-5 rounded-full ${moduleForm.color === c ? "ring-2 ring-offset-1 ring-[#4293a7]" : ""}`} style={{ backgroundColor: c }} />
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="text-xs" onClick={() => setShowAddModule(null)}>Cancel</Button>
                          <Button size="sm" className="text-xs bg-[#4293a7]" onClick={() => handleAddModule(plan.id)} disabled={!moduleForm.name.trim()}>Add Module</Button>
                        </div>
                      </motion.div>
                    ) : (
                      <button onClick={() => setShowAddModule(plan.id)} className="flex items-center gap-1.5 text-xs text-[#4293a7] hover:underline font-medium">
                        <Plus className="w-3.5 h-3.5" /> Add Module
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white rounded-xl p-6 shadow-xl max-w-sm w-full">
              <h3 className="text-base font-bold text-[#181a1b] mb-2">Delete {deleteConfirm.type === "plan" ? "Plan" : "Module"}?</h3>
              <p className="text-sm text-[#5e6a6e] mb-4">
                {deleteConfirm.type === "plan" ? "This will delete the plan and all its modules and papers." : "This will delete the module and all its papers."}
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="text-xs flex-1" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                <Button size="sm" className="text-xs bg-red-500 hover:bg-red-600 text-white flex-1" onClick={() => {
                  if (deleteConfirm.type === "plan") onDeletePlan(deleteConfirm.id);
                  else onDeleteModule(deleteConfirm.id);
                  setDeleteConfirm(null);
                }}>Delete</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
