import { useState, useMemo } from "react";
import {
  Search, Plus, Filter, X, Edit3, ExternalLink, Trash2, CheckCircle, Zap, Lock,
  BookOpen, FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Paper, Module } from "@/data/types";
import { getModuleColor } from "@/data/types";

interface AllPapersPageProps {
  papers: Paper[];
  modules: Module[];
  allKeywords: string[];
  onPaperClick: (paper: Paper) => void;
  onAddPaper: (paper: Omit<Paper, "id" | "dateAdded" | "status"> & { status?: Paper["status"] }) => string;
  onDeletePaper: (id: string) => void;
  onUploadPDF?: (paperId: string, file: File) => void;
}

type StatusFilter = "all" | "active" | "completed" | "locked";

export function AllPapersPage({
  papers,
  modules,
  allKeywords,
  onPaperClick,
  onAddPaper,
  onDeletePaper,
  onUploadPDF,
}: AllPapersPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [topicFilter, setTopicFilter] = useState<string>("all"); // moduleId
  const [keywordFilter, setKeywordFilter] = useState<string>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [pendingPDFFile, setPendingPDFFile] = useState<File | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Add form state
  const [addForm, setAddForm] = useState({
    title: "",
    authors: "",
    year: new Date().getFullYear(),
    moduleId: modules[0]?.id || "",
    topic: modules[0]?.name || "",
    topicSlug: modules[0]?.slug || "",
    keywords: [] as string[],
    importance: "",
    doi: "",
    week: 1,
    planId: "default-plan",
    status: "active" as Paper["status"],
    order: 0,
    templateId: "template-original",
  });

  const filteredPapers = useMemo(() => {
    return papers.filter((p) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          p.title.toLowerCase().includes(q) ||
          p.authors.toLowerCase().includes(q) ||
          p.topic.toLowerCase().includes(q) ||
          p.keywords.some((k) => k.toLowerCase().includes(q)) ||
          p.importance.toLowerCase().includes(q) ||
          String(p.year).includes(q);
        if (!matchesSearch) return false;
      }
      // Status filter
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      // Topic filter
      if (topicFilter !== "all" && p.moduleId !== topicFilter) return false;
      // Keyword filter
      if (keywordFilter !== "all" && !p.keywords.includes(keywordFilter)) return false;
      return true;
    });
  }, [papers, searchQuery, statusFilter, topicFilter, keywordFilter]);

  const handleAddPaper = () => {
    const paperId = onAddPaper(addForm);
    if (pendingPDFFile && onUploadPDF && paperId) {
      onUploadPDF(paperId, pendingPDFFile);
    }
    setShowAddForm(false);
    setPendingPDFFile(null);
    setAddForm({
      title: "",
      authors: "",
      year: new Date().getFullYear(),
      moduleId: modules[0]?.id || "",
      topic: modules[0]?.name || "",
      topicSlug: modules[0]?.slug || "",
      keywords: [],
      importance: "",
      doi: "",
      week: 1,
      planId: "default-plan",
      status: "active",
      order: 0,
      templateId: "template-original",
    });
  };

  const addKeyword = (kw: string) => {
    if (!kw.trim() || addForm.keywords.includes(kw.trim())) return;
    setAddForm((p) => ({ ...p, keywords: [...p.keywords, kw.trim()] }));
  };

  const removeKeyword = (kw: string) => {
    setAddForm((p) => ({ ...p, keywords: p.keywords.filter((k) => k !== kw) }));
  };

  const statusCounts = useMemo(() => {
    return {
      all: papers.length,
      active: papers.filter((p) => p.status === "active").length,
      completed: papers.filter((p) => p.status === "completed").length,
      locked: papers.filter((p) => p.status === "locked").length,
    };
  }, [papers]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-8 py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-[28px] font-semibold text-[#181a1b] tracking-tight">All Papers</h1>
            <p className="text-sm text-[#5e6a6e] mt-1">
              {filteredPapers.length} of {papers.length} papers
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
          </div>
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-[#4293a7] hover:bg-[#357a8a] text-white gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Paper
          </Button>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5e6a6e]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search papers, authors, keywords..."
              className="pl-9 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-3.5 h-3.5 text-[#5e6a6e]" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`gap-2 text-xs ${showFilters ? "border-[#4293a7] text-[#4293a7]" : ""}`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
          </Button>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-4 pb-4">
                {/* Status filters */}
                <div>
                  <p className="text-[10px] font-semibold uppercase text-[#5e6a6e] mb-1.5">Status</p>
                  <div className="flex gap-1.5">
                    {(["all", "active", "completed", "locked"] as StatusFilter[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                          statusFilter === s
                            ? "bg-[#4293a7] text-white"
                            : "bg-white border border-[#eaeaea] text-[#5e6a6e] hover:border-[#4293a7]"
                        }`}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)} ({statusCounts[s]})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Topic filters */}
                <div>
                  <p className="text-[10px] font-semibold uppercase text-[#5e6a6e] mb-1.5">Topic</p>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setTopicFilter("all")}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        topicFilter === "all" ? "bg-[#4293a7] text-white" : "bg-white border border-[#eaeaea] text-[#5e6a6e]"
                      }`}
                    >
                      All
                    </button>
                    {modules.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setTopicFilter(m.id)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                          topicFilter === m.id
                            ? "text-white"
                            : "bg-white border border-[#eaeaea] text-[#5e6a6e]"
                        }`}
                        style={
                          topicFilter === m.id
                            ? { backgroundColor: m.color }
                            : {}
                        }
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Keyword filters */}
                <div>
                  <p className="text-[10px] font-semibold uppercase text-[#5e6a6e] mb-1.5">Keyword</p>
                  <select
                    value={keywordFilter}
                    onChange={(e) => setKeywordFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-md text-xs border border-[#eaeaea] bg-white text-[#5e6a6e] focus:border-[#4293a7] outline-none"
                  >
                    <option value="all">All Keywords</option>
                    {allKeywords.map((kw) => (
                      <option key={kw} value={kw}>
                        {kw}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Papers Table */}
        <div className="bg-white rounded-lg border border-[#eaeaea] shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#eaeaea] bg-[#fafafa]">
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#5e6a6e]">Status</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#5e6a6e]">Paper</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#5e6a6e]">Topic</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#5e6a6e]">Year</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#5e6a6e]">Keywords</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#5e6a6e]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPapers.map((paper) => {
                const color = getModuleColor(paper.moduleId, modules);
                return (
                  <motion.tr
                    key={paper.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-[#f7f8fa] hover:bg-[#fafafa] transition-colors group"
                  >
                    {/* Status */}
                    <td className="px-4 py-3">
                      {paper.status === "completed" ? (
                        <CheckCircle className="w-4 h-4 text-[#4caf50]" />
                      ) : paper.status === "active" ? (
                        <Zap className="w-4 h-4 text-[#d97706]" />
                      ) : (
                        <Lock className="w-4 h-4 text-[#9ca3af]" />
                      )}
                    </td>

                    {/* Paper info */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onPaperClick(paper)}
                        className="text-left"
                      >
                        <p className="text-sm font-medium text-[#181a1b] group-hover:text-[#4293a7] transition-colors line-clamp-2 max-w-md">
                          {paper.title}
                        </p>
                        <p className="text-[11px] text-[#5e6a6e] mt-0.5">{paper.authors}</p>
                      </button>
                    </td>

                    {/* Topic */}
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider"
                        style={{ backgroundColor: `${color}15`, color }}
                      >
                        {paper.topic}
                      </span>
                    </td>

                    {/* Year */}
                    <td className="px-4 py-3 text-sm text-[#5e6a6e]">{paper.year}</td>

                    {/* Keywords */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {paper.keywords.slice(0, 3).map((kw) => (
                          <span
                            key={kw}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-[#f7f8fa] text-[#5e6a6e]"
                          >
                            {kw}
                          </span>
                        ))}
                        {paper.keywords.length > 3 && (
                          <span className="text-[10px] text-[#5e6a6e]">+{paper.keywords.length - 3}</span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onPaperClick(paper)}
                          className="p-1.5 rounded hover:bg-[#f7f8fa] text-[#5e6a6e] hover:text-[#4293a7] transition-colors"
                          title="Edit summary"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={`https://doi.org/${paper.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded hover:bg-[#f7f8fa] text-[#5e6a6e] hover:text-[#4293a7] transition-colors"
                          title="View paper"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => setDeleteConfirm(paper.id)}
                          className="p-1.5 rounded hover:bg-red-50 text-[#5e6a6e] hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>

          {filteredPapers.length === 0 && (
            <div className="py-12 text-center">
              <BookOpen className="w-8 h-8 text-[#a8ccd5] mx-auto mb-2" />
              <p className="text-sm text-[#5e6a6e]">No papers match your filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Paper Modal */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddForm(false)}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto z-10"
            >
              <div className="sticky top-0 bg-white border-b border-[#eaeaea] px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-lg font-semibold text-[#181a1b]">Add New Paper</h2>
                <button onClick={() => setShowAddForm(false)} className="p-1 rounded hover:bg-[#f7f8fa]">
                  <X className="w-5 h-5 text-[#5e6a6e]" />
                </button>
              </div>

              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[#5e6a6e] uppercase mb-1.5 block">Title *</label>
                  <Input
                    value={addForm.title}
                    onChange={(e) => setAddForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Paper title"
                    className="text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-[#5e6a6e] uppercase mb-1.5 block">Authors *</label>
                    <Input
                      value={addForm.authors}
                      onChange={(e) => setAddForm((p) => ({ ...p, authors: e.target.value }))}
                      placeholder="e.g. Smith, Jones, & Lee"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#5e6a6e] uppercase mb-1.5 block">Year *</label>
                    <Input
                      type="number"
                      value={addForm.year}
                      onChange={(e) => setAddForm((p) => ({ ...p, year: Number(e.target.value) }))}
                      className="text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-[#5e6a6e] uppercase mb-1.5 block">Topic *</label>
                    <select
                      value={addForm.moduleId}
                      onChange={(e) => {
                        const mod = modules.find((m) => m.id === e.target.value);
                        setAddForm((p) => ({
                          ...p,
                          moduleId: e.target.value,
                          topicSlug: mod?.slug || p.topicSlug,
                          topic: mod?.name || p.topic,
                        }));
                      }}
                      className="w-full px-3 py-2 rounded-md border border-[#eaeaea] text-sm bg-white focus:border-[#4293a7] outline-none"
                    >
                      {modules.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#5e6a6e] uppercase mb-1.5 block">Week</label>
                    <Input
                      type="number"
                      min={1}
                      value={addForm.week}
                      onChange={(e) => setAddForm((p) => ({ ...p, week: Number(e.target.value) }))}
                      className="text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#5e6a6e] uppercase mb-1.5 block">DOI</label>
                  <Input
                    value={addForm.doi}
                    onChange={(e) => setAddForm((p) => ({ ...p, doi: e.target.value }))}
                    placeholder="10.xxxx/xxxxx"
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#5e6a6e] uppercase mb-1.5 block">Importance / Why Read</label>
                  <textarea
                    value={addForm.importance}
                    onChange={(e) => setAddForm((p) => ({ ...p, importance: e.target.value }))}
                    rows={2}
                    placeholder="Why is this paper important?"
                    className="w-full px-3 py-2 rounded-md border border-[#eaeaea] text-sm bg-white focus:border-[#4293a7] outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#5e6a6e] uppercase mb-1.5 block">Keywords</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {addForm.keywords.map((kw) => (
                      <span key={kw} className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-[#4293a7]/10 text-[#4293a7]">
                        {kw}
                        <button onClick={() => removeKeyword(kw)}><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                  <Input
                    placeholder="Type keyword and press Enter"
                    className="text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addKeyword((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = "";
                      }
                    }}
                  />
                </div>
                {/* PDF Upload */}
                <div>
                  <label className="text-xs font-semibold text-[#5e6a6e] uppercase mb-1.5 block">PDF</label>
                  {pendingPDFFile ? (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-[#4caf50]/5 border border-[#4caf50]/20">
                      <FileText className="w-4 h-4 text-[#4caf50] shrink-0" />
                      <span className="text-xs text-[#181a1b] font-medium truncate flex-1">{pendingPDFFile.name}</span>
                      <span className="text-[10px] text-[#9ca3af] shrink-0">{(pendingPDFFile.size / 1024 / 1024).toFixed(1)} MB</span>
                      <button onClick={() => setPendingPDFFile(null)} className="p-1 rounded hover:bg-red-50 text-[#5e6a6e] hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-[#eaeaea] hover:border-[#4293a7]/50 cursor-pointer transition-all text-xs text-[#5e6a6e] hover:text-[#4293a7] font-medium">
                      <FileText className="w-3.5 h-3.5" />
                      Upload PDF (optional)
                      <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && file.type === "application/pdf") {
                            setPendingPDFFile(file);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#5e6a6e] uppercase mb-1.5 block">Initial Status</label>
                  <div className="flex gap-2">
                    {(["active", "locked", "completed"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setAddForm((p) => ({ ...p, status: s }))}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                          addForm.status === s
                            ? "bg-[#4293a7] text-white"
                            : "bg-white border border-[#eaeaea] text-[#5e6a6e]"
                        }`}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white border-t border-[#eaeaea] px-6 py-4 flex justify-end gap-3">
                <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)} className="text-sm">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddPaper}
                  disabled={!addForm.title || !addForm.authors}
                  className="bg-[#4293a7] hover:bg-[#357a8a] text-white text-sm gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Paper
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm(null)}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-sm z-10"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#181a1b]">Delete Paper?</h3>
                  <p className="text-xs text-[#5e6a6e]">This cannot be undone.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-sm" onClick={() => setDeleteConfirm(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm"
                  onClick={() => {
                    onDeletePaper(deleteConfirm);
                    setDeleteConfirm(null);
                  }}
                >
                  Delete
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
