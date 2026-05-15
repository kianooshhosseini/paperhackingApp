import { useState } from "react";
import {
  Settings, RotateCcw, Plus, Trash2, Edit3,
  Save, X, CheckCircle, AlertTriangle, FileText, User, Target, Trophy,
  Sparkles, ExternalLink, BrainCircuit, FolderOpen, FileCheck, Upload,
} from "lucide-react";
import { openExternalLink } from "@/lib/links";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SummaryTemplate, TemplateField, UserProfile, GamificationState, AppState } from "@/data/types";
import { SCORES } from "@/data/types";

interface SettingsPageProps {
  templates: SummaryTemplate[];
  settings: AppState["settings"];
  profile: UserProfile;
  gamification: GamificationState;
  onUpdateSettings: (updates: Partial<AppState["settings"]>) => void;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onUpdateWeeklyTarget: (target: number) => void;
  onAddTemplate: (template: Omit<SummaryTemplate, "id" | "isDefault">) => string;
  onUpdateTemplate: (id: string, updates: Partial<SummaryTemplate>) => void;
  onDeleteTemplate: (id: string) => void;
  onImportData: () => Promise<{ success: boolean; error: string | null }>;
  onResetData: () => void;
}

type TabId = "general" | "profile" | "templates" | "data";

const tabItems: { id: TabId; label: string; icon: typeof Settings }[] = [
  { id: "general", label: "General", icon: Settings },
  { id: "profile", label: "Profile", icon: User },
  { id: "templates", label: "Templates", icon: FileText },
  { id: "data", label: "Data", icon: FolderOpen },
];

export function SettingsPage({
  templates,
  settings,
  profile,
  gamification,
  onUpdateSettings,
  onUpdateProfile,
  onUpdateWeeklyTarget,
  onAddTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onImportData,
  onResetData,
}: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle");
  const [importError, setImportError] = useState<string | null>(null);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [weeklyTargetInput, setWeeklyTargetInput] = useState(gamification.weeklyTarget);

  // Template form state
  const [templateForm, setTemplateForm] = useState({
    name: "",
    description: "",
    fields: [] as TemplateField[],
  });

  // Field form state
  const [fieldForm, setFieldForm] = useState({ key: "", label: "", placeholder: "", rows: 2 });

  const addFieldToForm = () => {
    if (!fieldForm.key.trim() || !fieldForm.label.trim()) return;
    setTemplateForm((p) => ({
      ...p,
      fields: [...p.fields, { ...fieldForm, key: fieldForm.key.trim().replace(/\s+/g, "-") }],
    }));
    setFieldForm({ key: "", label: "", placeholder: "", rows: 2 });
  };

  const removeFieldFromForm = (idx: number) => {
    setTemplateForm((p) => ({ ...p, fields: p.fields.filter((_, i) => i !== idx) }));
  };

  const handleSaveTemplate = () => {
    if (!templateForm.name.trim() || templateForm.fields.length === 0) return;
    if (editingTemplate) {
      onUpdateTemplate(editingTemplate, templateForm);
      setEditingTemplate(null);
    } else {
      onAddTemplate(templateForm);
      setShowAddTemplate(false);
    }
    setTemplateForm({ name: "", description: "", fields: [] });
  };

  const startEditTemplate = (t: SummaryTemplate) => {
    setEditingTemplate(t.id);
    setTemplateForm({
      name: t.name,
      description: t.description,
      fields: [...t.fields],
    });
    setShowAddTemplate(true);
  };

  const handleUpdateWeeklyTarget = () => {
    const val = Math.max(1, Math.min(10, weeklyTargetInput));
    onUpdateWeeklyTarget(val);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-8 py-6 max-w-4xl">
        <h1 className="text-[28px] font-bold text-[#181a1b] tracking-tight mb-6">Settings</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#f7f8fa] rounded-xl p-1 mb-8">
          {tabItems.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-white text-[#181a1b] shadow-sm"
                    : "text-[#5e6a6e] hover:text-[#181a1b]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* === GENERAL TAB === */}
        {activeTab === "general" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Weekly Target */}
            <div className="bg-white rounded-xl border border-[#eaeaea] p-6 shadow-sm">
              <h3 className="text-base font-bold text-[#181a1b] mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-[#4293a7]" />
                Weekly Reading Target
              </h3>
              <p className="text-sm text-[#5e6a6e] mb-4">
                How many papers do you want to read per week? This affects scheduling and scoring.
              </p>
              <div className="flex items-center gap-4 max-w-xs">
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={weeklyTargetInput}
                  onChange={(e) => setWeeklyTargetInput(Number(e.target.value))}
                  className="text-sm w-20"
                />
                <span className="text-sm text-[#5e6a6e]">papers per week</span>
                <Button
                  size="sm"
                  onClick={handleUpdateWeeklyTarget}
                  className="bg-[#4293a7] hover:bg-[#357a8a] text-white text-xs"
                >
                  <Save className="w-3.5 h-3.5 mr-1" /> Save
                </Button>
              </div>
              <div className="mt-4 bg-[#f7f8fa] rounded-lg p-3 text-xs text-[#5e6a6e]">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="w-3.5 h-3.5 text-[#d97706]" />
                  <span className="font-semibold">Scoring Rules</span>
                </div>
                <ul className="space-y-1 ml-5 list-disc">
                  <li>+{SCORES.ON_TIME_BASE} points per paper completed on time</li>
                  <li>{SCORES.LATE_PENALTY_PER_DAY} points per day late</li>
                  <li>+{SCORES.STREAK_BONUS} bonus for 3+ week streaks</li>
                  <li>Milestones: {SCORES.MILESTONE_10_PAPERS}pts at 10, {SCORES.MILESTONE_25_PAPERS}pts at 25, {SCORES.MILESTONE_50_PAPERS}pts at 50</li>
                </ul>
              </div>
            </div>

            {/* Default Template */}
            <div className="bg-white rounded-xl border border-[#eaeaea] p-6 shadow-sm">
              <h3 className="text-base font-bold text-[#181a1b] mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#4293a7]" />
                Default Template
              </h3>
              <p className="text-sm text-[#5e6a6e] mb-4">
                Choose the template used when adding new papers.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onUpdateSettings({ defaultTemplateId: t.id })}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      settings.defaultTemplateId === t.id
                        ? "border-[#4293a7] bg-[#4293a7]/5"
                        : "border-[#eaeaea] hover:border-[#4293a7]/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {settings.defaultTemplateId === t.id && (
                        <CheckCircle className="w-4 h-4 text-[#4293a7]" />
                      )}
                      <span className="text-sm font-semibold text-[#181a1b]">{t.name}</span>
                    </div>
                    <span className="text-xs text-[#5e6a6e]">{t.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* App Info */}
            <div className="bg-white rounded-xl border border-[#eaeaea] p-6 shadow-sm">
              <h3 className="text-base font-bold text-[#181a1b] mb-4 flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-[#4293a7]" />
                Application Info
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-[#f7f8fa]">
                  <span className="text-[#5e6a6e]">Version</span>
                  <span className="font-medium text-[#181a1b]">3.0.0</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#f7f8fa]">
                  <span className="text-[#5e6a6e]">Developer</span>
                  <button
                    onClick={() => openExternalLink("https://kianoosh.info")}
                    className="font-medium text-[#4293a7] hover:underline flex items-center gap-1"
                  >
                    Kianoosh Hosseini <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex justify-between py-2 border-b border-[#f7f8fa]">
                  <span className="text-[#5e6a6e]">Platform</span>
                  <span className="font-medium text-[#181a1b]">macOS</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* === PROFILE TAB === */}
        {activeTab === "profile" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-md">
            <div className="bg-white rounded-xl border border-[#eaeaea] p-6 shadow-sm">
              <h3 className="text-base font-bold text-[#181a1b] mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-[#4293a7]" />
                Your Profile
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[#5e6a6e] uppercase mb-1.5 block">Name</label>
                  <Input
                    value={profile.name}
                    onChange={(e) => onUpdateProfile({ name: e.target.value })}
                    placeholder="Your name"
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#5e6a6e] uppercase mb-1.5 block">Role</label>
                  <div className="flex flex-wrap gap-2">
                    {["PhD Student", "Postdoc", "Researcher", "Professor", "Grad Student", "Other"].map((role) => (
                      <button
                        key={role}
                        onClick={() => onUpdateProfile({ role })}
                        className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                          profile.role === role
                            ? "bg-[#4293a7] text-white shadow-sm"
                            : "bg-[#f7f8fa] text-[#5e6a6e] hover:bg-[#4293a7]/10"
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#4293a7] to-[#5bb5c8] rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <Trophy className="w-6 h-6" />
                <div>
                  <p className="text-sm font-bold">{gamification.totalScore.toLocaleString()} points</p>
                  <p className="text-xs text-white/70">{gamification.papersReadOnTime + gamification.papersReadLate} papers read</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-white/70 mb-1">Current Streak</p>
                  <p className="text-lg font-bold">{gamification.currentStreak}w</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-white/70 mb-1">Longest Streak</p>
                  <p className="text-lg font-bold">{gamification.longestStreak}w</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* === TEMPLATES TAB === */}
        {activeTab === "templates" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#181a1b]">Summary Templates</h3>
                <p className="text-sm text-[#5e6a6e]">{templates.length} templates. Default templates cannot be deleted.</p>
              </div>
              {!showAddTemplate && (
                <Button
                  onClick={() => { setShowAddTemplate(true); setEditingTemplate(null); setTemplateForm({ name: "", description: "", fields: [] }); }}
                  className="bg-[#4293a7] hover:bg-[#357a8a] text-white gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  New Template
                </Button>
              )}
            </div>

            {/* Add/Edit Template Form */}
            <AnimatePresence>
              {showAddTemplate && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white rounded-xl border border-[#eaeaea] p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-[#181a1b]">
                        {editingTemplate ? "Edit Template" : "Create New Template"}
                      </h4>
                      <button onClick={() => { setShowAddTemplate(false); setEditingTemplate(null); }} className="p-1 hover:bg-[#f7f8fa] rounded">
                        <X className="w-4 h-4 text-[#5e6a6e]" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-[#5e6a6e] uppercase mb-1.5 block">Name</label>
                        <Input
                          value={templateForm.name}
                          onChange={(e) => setTemplateForm((p) => ({ ...p, name: e.target.value }))}
                          placeholder="e.g. Review Paper"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[#5e6a6e] uppercase mb-1.5 block">Description</label>
                        <Input
                          value={templateForm.description}
                          onChange={(e) => setTemplateForm((p) => ({ ...p, description: e.target.value }))}
                          placeholder="Brief description"
                          className="text-sm"
                        />
                      </div>
                    </div>

                    {/* Add Fields */}
                    <div className="bg-[#f7f8fa] rounded-lg p-4">
                      <p className="text-xs font-semibold text-[#5e6a6e] uppercase mb-3">Fields ({templateForm.fields.length})</p>

                      {templateForm.fields.length > 0 && (
                        <div className="space-y-2 mb-4">
                          {templateForm.fields.map((f, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-white rounded-lg p-2.5 border border-[#eaeaea]">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#4293a7] shrink-0" />
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium text-[#181a1b]">{f.label}</span>
                                <span className="text-[10px] text-[#9ca3af] ml-2">({f.key})</span>
                              </div>
                              <button onClick={() => removeFieldFromForm(idx)} className="p-1 hover:bg-red-50 rounded text-[#5e6a6e] hover:text-red-500">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-3">
                          <Input value={fieldForm.key} onChange={(e) => setFieldForm((p) => ({ ...p, key: e.target.value }))} placeholder="Field key" className="text-xs h-8" />
                        </div>
                        <div className="col-span-3">
                          <Input value={fieldForm.label} onChange={(e) => setFieldForm((p) => ({ ...p, label: e.target.value }))} placeholder="Label" className="text-xs h-8" />
                        </div>
                        <div className="col-span-4">
                          <Input value={fieldForm.placeholder} onChange={(e) => setFieldForm((p) => ({ ...p, placeholder: e.target.value }))} placeholder="Placeholder hint" className="text-xs h-8" />
                        </div>
                        <div className="col-span-2">
                          <Button onClick={addFieldToForm} size="sm" className="w-full h-8 text-xs bg-[#4293a7]">
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setShowAddTemplate(false); setEditingTemplate(null); }} className="text-xs">
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSaveTemplate} disabled={!templateForm.name.trim() || templateForm.fields.length === 0} className="text-xs bg-[#4293a7]">
                        <Save className="w-3.5 h-3.5 mr-1" />
                        {editingTemplate ? "Update" : "Create"} Template
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Template List */}
            <div className="space-y-3">
              {templates.map((t) => (
                <motion.div key={t.id} layout className="bg-white rounded-xl border border-[#eaeaea] shadow-sm overflow-hidden">
                  <div
                    className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-[#fafbfc] transition-colors"
                    onClick={() => setExpandedTemplate(expandedTemplate === t.id ? null : t.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#4293a7]/10 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-[#4293a7]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-[#181a1b]">{t.name}</h4>
                          {t.isDefault && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-[#4293a7] bg-[#4293a7]/10 px-1.5 py-0.5 rounded">Default</span>
                          )}
                          {settings.defaultTemplateId === t.id && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-[#4caf50] bg-[#4caf50]/10 px-1.5 py-0.5 rounded">Active</span>
                          )}
                        </div>
                        <p className="text-xs text-[#5e6a6e]">{t.description} &middot; {t.fields.length} fields</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); startEditTemplate(t); }} className="p-1.5 hover:bg-[#f7f8fa] rounded text-[#5e6a6e]">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); onDeleteTemplate(t.id); }} className="p-1.5 hover:bg-red-50 rounded text-[#5e6a6e] hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedTemplate === t.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="px-5 pb-4 border-t border-[#f7f8fa]">
                          <div className="pt-3 space-y-2">
                            {t.fields.map((f) => (
                              <div key={f.key} className="flex items-start gap-2 py-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#4293a7] mt-1.5 shrink-0" />
                                <div>
                                  <span className="text-sm font-medium text-[#181a1b]">{f.label}</span>
                                  <span className="text-[10px] text-[#9ca3af] ml-2">{f.key}</span>
                                  {f.placeholder && <p className="text-xs text-[#9ca3af] mt-0.5 italic">{f.placeholder.slice(0, 80)}...</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* === DATA TAB === */}
        {activeTab === "data" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Data Directory */}
            <div className="bg-white rounded-xl border border-[#eaeaea] p-6 shadow-sm">
              <h3 className="text-base font-bold text-[#181a1b] mb-2 flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-[#4293a7]" />
                Data Save Location
              </h3>
              <p className="text-sm text-[#5e6a6e] mb-4">
                All your data is automatically saved to this folder. No manual export needed.
              </p>

              {settings.dataDirectory ? (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-[#4caf50]/5 border border-[#4caf50]/20">
                  <FileCheck className="w-5 h-5 text-[#4caf50] shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#4caf50] mb-1">Data is being saved</p>
                    <p className="text-xs text-[#5e6a6e] break-all font-mono">{settings.dataDirectory}</p>
                    <p className="text-xs text-[#9ca3af] mt-2">
                      File: <span className="font-mono">paperhacking-data.json</span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-orange-50 border border-orange-200">
                  <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-orange-700 mb-1">No save location set</p>
                    <p className="text-xs text-orange-600">Your data is only stored in memory. Set a directory to persist your work.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Import */}
            <div className="bg-white rounded-xl border border-[#eaeaea] p-6 shadow-sm">
              <h3 className="text-base font-bold text-[#181a1b] mb-2 flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#4293a7]" />
                Import Existing Data
              </h3>
              <p className="text-sm text-[#5e6a6e] mb-4">
                Load a previously saved PaperHacking data file. Select the <span className="font-mono text-xs">paperhacking-data.json</span> file directly.
              </p>
              <Button
                onClick={async () => {
                  setImportError(null);
                  setImportStatus("idle");
                  const result = await onImportData();
                  if (result.success) {
                    setImportStatus("success");
                    setTimeout(() => setImportStatus("idle"), 3000);
                  } else if (result.error) {
                    setImportError(result.error);
                  }
                }}
                className="bg-[#4293a7] hover:bg-[#357a8a] text-white gap-2 text-sm"
              >
                <Upload className="w-4 h-4" />
                Select paperhacking-data.json
              </Button>
              {importStatus === "success" && (
                <p className="text-xs text-[#4caf50] font-medium mt-2">Import successful! Data loaded.</p>
              )}
              {importError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-600 font-medium whitespace-pre-line">{importError}</p>
                  <button onClick={() => setImportError(null)} className="text-[10px] text-red-400 hover:text-red-600 mt-1">Dismiss</button>
                </div>
              )}
            </div>

            {/* Reset */}
            <div className="bg-white rounded-xl border border-red-100 p-6 shadow-sm">
              <h3 className="text-base font-bold text-red-600 mb-2 flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                Reset All Data
              </h3>
              <p className="text-sm text-[#5e6a6e] mb-4">
                This clears all papers, plans, modules, templates, and scores from memory.
                Your saved file on disk will not be deleted — only the in-memory state is cleared.
              </p>
              {!showResetConfirm ? (
                <Button variant="outline" onClick={() => setShowResetConfirm(true)} className="text-red-600 border-red-200 hover:bg-red-50 text-sm">
                  Reset Everything
                </Button>
              ) : (
                <div className="flex items-center gap-3 bg-red-50 rounded-lg p-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-700 mb-2">Clear all in-memory data?</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setShowResetConfirm(false)} className="text-xs">Cancel</Button>
                      <Button size="sm" onClick={() => { onResetData(); setShowResetConfirm(false); }} className="text-xs bg-red-500 hover:bg-red-600 text-white">
                        Yes, Clear Memory
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
