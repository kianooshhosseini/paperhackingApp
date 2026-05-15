import {
  FileText, ChevronRight, BookOpen, Target, PenLine, Microscope,
  Sparkles, Lightbulb, AlertTriangle, Link2, Image, Search, X
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import type { Paper, Module } from "@/data/types";
import { getModuleColor } from "@/data/types";

interface FilledSummariesProps {
  papers: Paper[];
  modules: Module[];
  onPaperClick: (paper: Paper) => void;
}

const fieldIcons: Record<string, React.ReactNode> = {
  oneSentence: <BookOpen className="w-3.5 h-3.5" />,
  keyQuestion: <Target className="w-3.5 h-3.5" />,
  hypothesis: <PenLine className="w-3.5 h-3.5" />,
  methods: <Microscope className="w-3.5 h-3.5" />,
  keyFindings: <Sparkles className="w-3.5 h-3.5" />,
  novelInsight: <Lightbulb className="w-3.5 h-3.5" />,
  criticism: <AlertTriangle className="w-3.5 h-3.5" />,
  relevanceToWork: <Link2 className="w-3.5 h-3.5" />,
  figureNote: <Image className="w-3.5 h-3.5" />,
};

const fieldLabels: Record<string, string> = {
  oneSentence: "One-Sentence Summary",
  keyQuestion: "Key Question",
  hypothesis: "Hypothesis",
  methods: "Methods",
  keyFindings: "Key Findings",
  novelInsight: "Novel Insight",
  criticism: "Criticism",
  relevanceToWork: "Relevance to My Research",
  figureNote: "Key Figure",
};

export function FilledSummaries({ papers, modules, onPaperClick }: FilledSummariesProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const completedPapers = useMemo(() => {
    return papers
      .filter((p) => p.status === "completed" && p.summary)
      .filter((p) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.authors.toLowerCase().includes(q) ||
          p.topic.toLowerCase().includes(q) ||
          Object.values(p.summary || {}).some((v) => (v as string).toLowerCase().includes(q))
        );
      })
      .sort((a, b) => (b.dateCompleted || "").localeCompare(a.dateCompleted || ""));
  }, [papers, searchQuery]);

  if (completedPapers.length === 0 && !searchQuery) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="w-16 h-16 rounded-full bg-[#f7f8fa] flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-[#a8ccd5]" />
        </div>
        <h3 className="text-lg font-semibold text-[#181a1b] mb-2">No Summaries Yet</h3>
        <p className="text-sm text-[#5e6a6e] max-w-md">
          Start filling out paper summaries. Your completed summaries will appear here as a personal knowledge base.
        </p>
      </div>
    );
  }

  return (
    <div className="px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[28px] font-semibold text-[#181a1b] tracking-tight">My Summaries</h2>
          <p className="text-sm text-[#5e6a6e] mt-1">
            Your personal knowledge base — {completedPapers.length} paper{completedPapers.length !== 1 ? "s" : ""} summarized
          </p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5e6a6e]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search summaries..."
            className="pl-9 text-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-[#5e6a6e]" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {completedPapers.map((paper, index) => {
          const color = getModuleColor(paper.moduleId, modules);
          const summary = paper.summary!;
          const filledFields = Object.entries(summary).filter(([, v]) => v && (v as string).trim().length > 0);

          return (
            <motion.div
              key={paper.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-lg border border-[#eaeaea] shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <button onClick={() => onPaperClick(paper)} className="w-full text-left px-6 py-4 flex items-start justify-between group">
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider"
                      style={{ backgroundColor: `${color}15`, color }}
                    >
                      {paper.topic}
                    </span>
                    <span className="text-[10px] text-[#5e6a6e]">Week {paper.week}</span>
                    {paper.dateCompleted && (
                      <span className="text-[10px] text-[#5e6a6e]">Completed {paper.dateCompleted}</span>
                    )}
                  </div>
                  <h3 className="text-[15px] font-semibold text-[#181a1b] group-hover:text-[#4293a7] transition-colors">
                    {paper.title}
                  </h3>
                  <p className="text-xs text-[#5e6a6e] mt-0.5">{paper.authors} ({paper.year})</p>
                </div>
                <ChevronRight className="w-5 h-5 text-[#5e6a6e] group-hover:text-[#4293a7] transition-colors mt-1" />
              </button>

              <div className="px-6 pb-4">
                {summary.oneSentence && (
                  <div className="mb-3 p-3 bg-[#f7f8fa] rounded-lg border border-[#eaeaea]">
                    <p className="text-[11px] text-[#5e6a6e] mb-1 flex items-center gap-1.5">
                      <BookOpen className="w-3 h-3 text-[#4293a7]" />
                      <span className="font-semibold">Summary</span>
                    </p>
                    <p className="text-sm text-[#181a1b] leading-relaxed">{summary.oneSentence}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {filledFields
                    .filter(([key]) => key !== "oneSentence")
                    .map(([key]) => (
                      <span
                        key={key}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium"
                        style={{ backgroundColor: `${color}10`, color }}
                      >
                        {fieldIcons[key]}
                        {fieldLabels[key]}
                      </span>
                    ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
