import { Lock, CheckCircle, Edit3, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import type { Paper, Module } from "@/data/types";
import { getModuleColor } from "@/data/types";

interface PaperNodeProps {
  paper: Paper;
  modules: Module[];
  onClick: (paper: Paper) => void;
  isFiltered: boolean;
}

export function PaperNode({ paper, modules, onClick, isFiltered }: PaperNodeProps) {
  const color = getModuleColor(paper.topicSlug, modules);

  if (paper.status === "locked") {
    return (
      <div
        className={`relative border-2 border-dashed border-[#eaeaea] rounded-lg p-5 bg-[#fafafa] opacity-60 transition-opacity ${
          isFiltered ? "opacity-100" : ""
        }`}
      >
        <div className="flex items-start justify-between mb-3">
          <span
            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider"
            style={{ backgroundColor: `${color}15`, color }}
          >
            {paper.topic}
          </span>
          <Lock className="w-4 h-4 text-[#5e6a6e]" />
        </div>
        <h3 className="text-sm font-semibold text-[#5e6a6e] mb-2 line-clamp-2">{paper.title}</h3>
        <p className="text-xs text-[#5e6a6e]">{paper.authors} ({paper.year})</p>
        <div className="mt-3 flex items-center gap-1.5 text-[10px] text-[#5e6a6e]">
          <Lock className="w-3 h-3" />
          <span>Complete previous week to unlock</span>
        </div>
      </div>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(paper)}
      className={`relative w-full text-left border rounded-lg p-5 bg-white transition-shadow duration-300 hover:shadow-lg ${
        paper.status === "completed"
          ? "border-t-[3px] shadow-md"
          : "border-t-[3px] border-[#eaeaea] shadow-sm hover:shadow-md"
      } ${isFiltered ? "ring-2 ring-[#4293a7] ring-offset-2" : ""}`}
      style={{ borderTopColor: paper.status === "completed" ? "#4caf50" : color }}
    >
      <div className="flex items-start justify-between mb-3">
        <span
          className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {paper.topic}
        </span>
        {paper.status === "completed" ? (
          <CheckCircle className="w-5 h-5 text-[#4caf50]" />
        ) : (
          <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
            <Edit3 className="w-3 h-3" style={{ color }} />
          </div>
        )}
      </div>

      <h3 className="text-sm font-semibold text-[#181a1b] mb-2 line-clamp-2">{paper.title}</h3>
      <p className="text-xs text-[#5e6a6e] mb-3">{paper.authors} ({paper.year})</p>

      {paper.status === "active" && (
        <p className="text-[11px] text-[#5e6a6e] leading-relaxed mb-3 line-clamp-2 bg-[#f7f8fa] rounded p-2">
          {paper.importance}
        </p>
      )}

      <div className="flex flex-wrap gap-1 mb-3">
        {paper.keywords.slice(0, 3).map((kw) => (
          <span key={kw} className="px-1.5 py-0.5 rounded text-[9px] bg-[#f7f8fa] text-[#5e6a6e]">{kw}</span>
        ))}
      </div>

      <div className="flex items-center justify-between mt-2">
        {paper.status === "completed" ? (
          <span className="text-[11px] font-medium text-[#4caf50] flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Summary complete
          </span>
        ) : (
          <span className="text-[11px] font-semibold flex items-center gap-1" style={{ color }}>
            <Edit3 className="w-3 h-3" />
            Fill Summary
          </span>
        )}
        <a
          href={`https://doi.org/${paper.doi}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-[#5e6a6e] hover:text-[#4293a7] transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </motion.button>
  );
}
