import { useState, useMemo } from "react";
import {
  Search, Plus, X, BookOpen, Tag, Lightbulb, Trash2,
  Edit3, Save, ImagePlus, ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Term, Paper } from "@/data/types";

interface TermsPageProps {
  terms: Term[];
  papers: Paper[];
  onAddTerm: (term: Omit<Term, "id" | "dateAdded">) => string;
  onUpdateTerm: (id: string, updates: Partial<Term>) => void;
  onDeleteTerm: (id: string) => void;
}

export function TermsPage({
  terms,
  papers,
  onAddTerm,
  onUpdateTerm,
  onDeleteTerm,
}: TermsPageProps) {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    definition: "",
    notes: "",
    tags: "",
    paperId: "",
    image: undefined as string | undefined,
  });

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    terms.forEach((t) => t.tags.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [terms]);

  const filteredTerms = useMemo(() => {
    let result = terms;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.definition.toLowerCase().includes(q) ||
          t.notes.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    if (selectedTag) {
      result = result.filter((t) => t.tags.includes(selectedTag));
    }
    return result.sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
  }, [terms, search, selectedTag]);

  const resetForm = () => {
    setForm({
      name: "",
      definition: "",
      notes: "",
      tags: "",
      paperId: "",
      image: undefined,
    });
    setImagePreview(null);
    setEditingId(null);
  };

  const startEdit = (term: Term) => {
    setForm({
      name: term.name,
      definition: term.definition,
      notes: term.notes,
      tags: term.tags.join(", "),
      paperId: term.paperId || "",
      image: term.image,
    });
    setImagePreview(term.image || null);
    setEditingId(term.id);
    setShowAdd(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.definition.trim()) return;
    const tagList = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const paper = papers.find((p) => p.id === form.paperId);
    const termData = {
      name: form.name.trim(),
      definition: form.definition.trim(),
      notes: form.notes.trim(),
      tags: tagList,
      paperId: form.paperId || undefined,
      paperTitle: paper?.title,
      image: form.image,
    };
    if (editingId) {
      onUpdateTerm(editingId, termData);
    } else {
      onAddTerm(termData);
    }
    resetForm();
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

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-8 py-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[28px] font-bold text-[#181a1b] tracking-tight">
              Terms & Concepts
            </h1>
            <p className="text-sm text-[#5e6a6e] mt-1">
              {terms.length} term{terms.length !== 1 ? "s" : ""} collected from your reading
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setShowAdd(!showAdd);
            }}
            className="bg-[#4293a7] hover:bg-[#357a8a] text-white gap-2 text-sm"
          >
            {showAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAdd ? "Cancel" : "Add Term"}
          </Button>
        </div>

        {/* Add/Edit Form */}
        <AnimatePresence>
          {showAdd && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-white rounded-xl border border-[#eaeaea] p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-[#181a1b]">
                  {editingId ? "Edit Term" : "New Term or Concept"}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-[#5e6a6e] uppercase mb-1.5 block">
                      Term
                    </label>
                    <Input
                      value={form.name}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, name: e.target.value }))
                      }
                      placeholder="e.g. Error-Related Negativity"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#5e6a6e] uppercase mb-1.5 block">
                      Tags (comma-separated)
                    </label>
                    <Input
                      value={form.tags}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, tags: e.target.value }))
                      }
                      placeholder="e.g. EEG, error monitoring, ERP"
                      className="text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#5e6a6e] uppercase mb-1.5 block">
                    Definition
                  </label>
                  <textarea
                    value={form.definition}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, definition: e.target.value }))
                    }
                    placeholder="Define the term in your own words..."
                    rows={3}
                    className="w-full rounded-md border border-[#eaeaea] bg-transparent px-3 py-2 text-sm outline-none focus:border-[#4293a7] focus:ring-1 focus:ring-[#4293a7]/20 resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#5e6a6e] uppercase mb-1.5 block">
                    Notes & Context
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, notes: e.target.value }))
                    }
                    placeholder="Additional notes, examples, paper references, how you encountered this..."
                    rows={3}
                    className="w-full rounded-md border border-[#eaeaea] bg-transparent px-3 py-2 text-sm outline-none focus:border-[#4293a7] focus:ring-1 focus:ring-[#4293a7]/20 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-[#5e6a6e] uppercase mb-1.5 block">
                      Source Paper (optional)
                    </label>
                    <select
                      value={form.paperId}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, paperId: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-md border border-[#eaeaea] text-sm bg-white focus:border-[#4293a7] outline-none"
                    >
                      <option value="">None / General</option>
                      {papers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title.slice(0, 60)}
                          {p.title.length > 60 ? "..." : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#5e6a6e] uppercase mb-1.5 block">
                      Image (optional)
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 px-3 py-2 rounded-md border border-[#eaeaea] text-sm text-[#5e6a6e] hover:bg-[#f7f8fa] cursor-pointer transition-colors">
                        <ImagePlus className="w-4 h-4" />
                        {imagePreview ? "Change" : "Add Image"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </label>
                      {imagePreview && (
                        <button
                          onClick={() => {
                            setForm((p) => ({ ...p, image: undefined }));
                            setImagePreview(null);
                          }}
                          className="text-xs text-red-500 hover:text-red-600"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {imagePreview && (
                  <div className="w-32 h-32 rounded-lg border border-[#eaeaea] overflow-hidden bg-[#f7f8fa]">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      resetForm();
                      setShowAdd(false);
                    }}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={!form.name.trim() || !form.definition.trim()}
                    className="text-xs bg-[#4293a7] hover:bg-[#357a8a] text-white"
                  >
                    <Save className="w-3.5 h-3.5 mr-1" />
                    {editingId ? "Update" : "Save"} Term
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search + Tags */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-[#9ca3af] absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search terms, definitions, tags..."
              className="pl-9 text-sm"
            />
          </div>
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                !selectedTag
                  ? "bg-[#4293a7] text-white"
                  : "bg-[#f7f8fa] text-[#5e6a6e] hover:bg-[#eaeaea]"
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                  selectedTag === tag
                    ? "bg-[#4293a7] text-white"
                    : "bg-[#f7f8fa] text-[#5e6a6e] hover:bg-[#eaeaea]"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Terms Grid */}
        {filteredTerms.length === 0 ? (
          <div className="text-center py-16">
            <Lightbulb className="w-12 h-12 text-[#eaeaea] mx-auto mb-3" />
            <p className="text-sm text-[#5e6a6e]">
              {terms.length === 0
                ? "No terms yet. Add terms as you encounter new concepts in your reading."
                : "No terms match your search."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredTerms.map((term) => (
              <TermCard
                key={term.id}
                term={term}
                onEdit={() => startEdit(term)}
                onDelete={() => onDeleteTerm(term.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TermCard({
  term,
  onEdit,
  onDelete,
}: {
  term: Term;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      className="bg-white rounded-xl border border-[#eaeaea] shadow-sm overflow-hidden"
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-[#181a1b] mb-1">
              {term.name}
            </h3>
            {term.paperTitle && (
              <p className="text-[11px] text-[#4293a7] mb-2 flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {term.paperTitle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onEdit}
              className="p-1.5 hover:bg-[#f7f8fa] rounded text-[#5e6a6e]"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 hover:bg-red-50 rounded text-[#5e6a6e] hover:text-red-500"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Definition */}
        <p className="text-sm text-[#181a1b] leading-relaxed mb-3">
          {term.definition}
        </p>

        {/* Tags */}
        {term.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {term.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#f7f8fa] text-[#5e6a6e]"
              >
                <Tag className="w-2.5 h-2.5" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Expand for notes + image */}
        {(term.notes || term.image) && (
          <>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-[11px] text-[#4293a7] hover:underline mb-2"
            >
              <ChevronRight
                className={`w-3 h-3 transition-transform ${
                  expanded ? "rotate-90" : ""
                }`}
              />
              {expanded ? "Hide details" : "Show details"}
            </button>
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  {term.notes && (
                    <p className="text-xs text-[#5e6a6e] leading-relaxed mb-3 bg-[#f7f8fa] rounded-lg p-3">
                      {term.notes}
                    </p>
                  )}
                  {term.image && (
                    <div className="rounded-lg border border-[#eaeaea] overflow-hidden bg-[#f7f8fa]">
                      <img
                        src={term.image}
                        alt={term.name}
                        className="w-full max-h-48 object-contain"
                      />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Date */}
        <p className="text-[10px] text-[#9ca3af] mt-3">
          Added {new Date(term.dateAdded).toLocaleDateString()}
        </p>
      </div>
    </motion.div>
  );
}
