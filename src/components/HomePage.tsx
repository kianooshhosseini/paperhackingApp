import {
  BookOpen, CheckCircle, Zap, TrendingUp, ArrowRight,
  BrainCircuit, Flame, Award, Plus, Target, Star, Trophy,
  FileText, ChevronRight, Calendar, BarChart3, Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import type { Paper, Module, ReadingPlan, UserProfile, GamificationState } from "@/data/types";
import { getModuleColor, SCORES } from "@/data/types";
import { GamificationBadge } from "@/components/GamificationBadge";
import { openExternalLink } from "@/lib/links";

interface HomePageProps {
  papers: Paper[];
  modules: Module[];
  plans: ReadingPlan[];
  profile: UserProfile;
  gamification: GamificationState;
  nextPaper: Paper | null;
  stats: {
    total: number;
    completed: number;
    active: number;
    locked: number;
    completionRate: number;
    byModule: (Module & { completed: number; total: number })[];
  };
  weeks: [number, Paper[]][];
  onPaperClick: (paper: Paper) => void;
  onViewChange: (view: string) => void;
  onViewPDF: (paper: Paper) => void;
}

const statCards = [
  { label: "Total Papers", icon: BookOpen, key: "total" as const, gradient: "from-[#4293a7] to-[#5bb5c8]" },
  { label: "Completed", icon: CheckCircle, key: "completed" as const, gradient: "from-[#4caf50] to-[#66bb6a]" },
  { label: "Active", icon: Zap, key: "active" as const, gradient: "from-[#d97706] to-[#f59e0b]" },
  { label: "Reading Plans", icon: Calendar, key: "plans" as const, gradient: "from-[#7c3aed] to-[#8b5cf6]" },
];

function CircularProgress({ value, size = 120 }: { value: number; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eaeaea" strokeWidth="6" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#4293a7"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        className="transition-all duration-1000 ease-out"
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        className="rotate-90"
        style={{ fontSize: 22, fontWeight: 700, fill: "#181a1b" }}
      >
        {value}%
      </text>
    </svg>
  );
}

export function HomePage({
  papers,
  modules,
  plans,
  profile,
  gamification,
  nextPaper,
  stats,
  weeks,
  onPaperClick,
  onViewChange,
  onViewPDF,
}: HomePageProps) {
  const recentCompleted = papers
    .filter((p) => p.status === "completed" && p.dateCompleted)
    .sort((a, b) => (b.dateCompleted || "").localeCompare(a.dateCompleted || ""))
    .slice(0, 4);

  const nextPaperColor = nextPaper
    ? getModuleColor(nextPaper.moduleId, modules)
    : "#4293a7";

  const isBlankSlate = papers.length === 0;

  // This week
  const currentWeekPapers = weeks.find(([w]) => w === 1)?.[1] || [];
  const currentWeekCompleted = currentWeekPapers.filter((p) => p.status === "completed").length;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-8 py-6 max-w-6xl">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4293a7] to-[#5bb5c8] flex items-center justify-center shadow-lg shadow-[#4293a7]/20">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[26px] font-bold text-[#181a1b] tracking-tight leading-none">
                {profile.name ? `Welcome, ${profile.name.split(" ")[0]}` : "PaperHacking"}
              </h1>
              <p className="text-xs text-[#5e6a6e] mt-0.5">
                {isBlankSlate
                  ? "Your blank slate is ready. Start adding papers!"
                  : "Your personalized research reading workbench"}
              </p>
            </div>
            {/* Score badge */}
            {gamification.totalScore > 0 && (
              <motion.div
                className="ml-auto flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-[#d97706]/10 to-[#f59e0b]/10 border border-[#d97706]/20"
                whileHover={{ scale: 1.05 }}
              >
                <Trophy className="w-4 h-4 text-[#d97706]" />
                <span className="text-sm font-bold text-[#d97706]">
                  {gamification.totalScore.toLocaleString()} pts
                </span>
                {gamification.currentStreak >= 3 && (
                  <div className="flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    <span className="text-[10px] font-bold text-orange-600">
                      {gamification.currentStreak}w
                    </span>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Blank Slate Welcome */}
        {isBlankSlate && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-[#eaeaea] shadow-sm p-8 mb-8 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4293a7] to-[#5bb5c8] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#4293a7]/20">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-lg font-bold text-[#181a1b] mb-2">
              Your Workbench is Ready
            </h2>
            <p className="text-sm text-[#5e6a6e] max-w-md mx-auto mb-6">
              Start by adding papers you want to read. The app will automatically
              schedule them based on your weekly target and topic priorities.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => onViewChange("papers")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#4293a7] to-[#5bb5c8] hover:shadow-lg hover:shadow-[#4293a7]/25 transition-all active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                Add Your First Paper
              </button>
              <button
                onClick={() => onViewChange("plans")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border border-[#eaeaea] text-[#5e6a6e] hover:border-[#4293a7] hover:text-[#4293a7] transition-all"
              >
                <Target className="w-4 h-4" />
                Manage Plans
              </button>
            </div>
          </motion.div>
        )}

        {/* Stat Cards */}
        {!isBlankSlate && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            {statCards.map((s, i) => {
              const value = s.key === "plans" ? plans.length : stats[s.key] ?? 0;
              return (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-white rounded-xl border border-[#eaeaea] p-5 shadow-sm card-hover"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-sm`}
                    >
                      <s.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[#181a1b] leading-none">
                        {value}
                      </p>
                      <p className="text-[11px] text-[#5e6a6e] mt-1 font-medium">
                        {s.label}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="col-span-2 space-y-6">
            {/* Next Paper Card */}
            {!isBlankSlate && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl border border-[#eaeaea] shadow-sm overflow-hidden card-hover"
              >
                <div
                  className="px-6 py-4 border-b border-[#eaeaea] flex items-center justify-between"
                  style={{
                    background: `linear-gradient(90deg, ${nextPaperColor}08 0%, transparent 100%)`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4" style={{ color: nextPaperColor }} />
                    <h2 className="text-sm font-semibold text-[#181a1b]">
                      Next Paper to Read
                    </h2>
                  </div>
                  {nextPaper && (
                    <span
                      className="text-[10px] font-bold px-2.5 py-1 rounded-full text-white"
                      style={{ backgroundColor: nextPaperColor }}
                    >
                      Week {nextPaper.week}
                      {nextPaper.dueDate && (
                        <span className="ml-1 opacity-80">
                          (due {nextPaper.dueDate})
                        </span>
                      )}
                    </span>
                  )}
                </div>

                {nextPaper ? (
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-[#181a1b] leading-snug mb-1">
                      {nextPaper.title}
                    </h3>
                    <p className="text-sm text-[#5e6a6e] mb-4">
                      {nextPaper.authors} ({nextPaper.year})
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {nextPaper.keywords.map((kw) => (
                        <span
                          key={kw}
                          className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-[#f7f8fa] border border-[#eaeaea] text-[#5e6a6e]"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>

                    <p className="text-sm text-[#5e6a6e] leading-relaxed mb-5 p-4 rounded-xl bg-gradient-to-r from-[#f7f8fa] to-white border border-[#eaeaea]">
                      {nextPaper.importance}
                    </p>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onPaperClick(nextPaper)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg active:scale-[0.98]"
                        style={{
                          background: `linear-gradient(135deg, ${nextPaperColor} 0%, ${nextPaperColor}dd 100%)`,
                        }}
                      >
                        <BookOpen className="w-4 h-4" />
                        Start Reading
                      </button>
                      {nextPaper.pdf && (
                        <button
                          onClick={() => onViewPDF(nextPaper)}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border border-[#eaeaea] text-[#5e6a6e] hover:border-[#4293a7] hover:text-[#4293a7] transition-all"
                        >
                          <FileText className="w-4 h-4" />
                          Fullscreen PDF
                        </button>
                      )}
                      <button
                        onClick={() => openExternalLink(`https://doi.org/${nextPaper.doi}`)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border border-[#eaeaea] text-[#5e6a6e] hover:border-[#4293a7] hover:text-[#4293a7] transition-all"
                      >
                        <ArrowRight className="w-4 h-4" />
                        View Paper
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-10 text-center">
                    <Award className="w-12 h-12 text-[#a8ccd5] mx-auto mb-3" />
                    <p className="text-sm font-semibold text-[#181a1b]">
                      {stats.completed === stats.total
                        ? "All papers complete!"
                        : "No active papers"}
                    </p>
                    <p className="text-xs text-[#5e6a6e] mt-1">
                      {stats.completed === stats.total
                        ? "Add more papers or create a new reading plan."
                        : "Complete the current week's papers to unlock more."}
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* This Week Progress */}
            {!isBlankSlate && currentWeekPapers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white rounded-xl border border-[#eaeaea] shadow-sm p-6 card-hover"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-[#181a1b] flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#4293a7]" />
                    This Week (Week 1)
                  </h2>
                  <span className="text-[11px] font-medium text-[#5e6a6e]">
                    {currentWeekCompleted}/{currentWeekPapers.length} done
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {currentWeekPapers.map((paper) => {
                    const color = getModuleColor(paper.moduleId, modules);
                    const isCompleted = paper.status === "completed";
                    return (
                      <div
                        key={paper.id}
                        onClick={() =>
                          paper.status !== "locked" && onPaperClick(paper)
                        }
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                          isCompleted
                            ? "border-[#4caf50]/30 bg-[#4caf50]/5"
                            : "border-[#eaeaea] hover:border-[#4293a7]/50 cursor-pointer"
                        }`}
                      >
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-xs font-medium truncate ${
                              isCompleted
                                ? "text-[#4caf50] line-through"
                                : "text-[#181a1b]"
                            }`}
                          >
                            {paper.title}
                          </p>
                          <p className="text-[10px] text-[#9ca3af]">
                            {paper.authors}
                          </p>
                        </div>
                        {isCompleted && (
                          <CheckCircle className="w-4 h-4 text-[#4caf50] shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Module Progress */}
            {!isBlankSlate && stats.byModule.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl border border-[#eaeaea] shadow-sm p-6 card-hover"
              >
                <h2 className="text-sm font-bold text-[#181a1b] mb-5 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#4293a7]" />
                  Progress by Module
                </h2>
                <div className="space-y-4">
                  {stats.byModule.map((mod) => {
                    const pct =
                      mod.total > 0
                        ? Math.round((mod.completed / mod.total) * 100)
                        : 0;
                    return (
                      <div key={mod.id}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: mod.color }}
                            />
                            <span className="text-sm font-semibold text-[#181a1b]">
                              {mod.name}
                            </span>
                            {mod.priority > 0 && (
                              <div className="flex items-center gap-0.5">
                                {Array.from({ length: mod.priority }).map(
                                  (_, i) => (
                                    <Star
                                      key={i}
                                      className="w-2.5 h-2.5 text-[#d97706] fill-[#d97706]"
                                    />
                                  )
                                )}
                              </div>
                            )}
                          </div>
                          <span className="text-[11px] font-medium text-[#5e6a6e]">
                            {mod.completed}/{mod.total}
                          </span>
                        </div>
                        <div className="h-2.5 bg-[#f0f1f3] rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{
                              background: `linear-gradient(90deg, ${mod.color} 0%, ${mod.color}cc 100%)`,
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>

          {/* Side Column */}
          <div className="space-y-6">
            {/* Circular Progress */}
            {!isBlankSlate && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white rounded-xl border border-[#eaeaea] shadow-sm p-6 flex flex-col items-center card-hover"
              >
                <h2 className="text-sm font-bold text-[#181a1b] mb-4 self-start">
                  Overall Progress
                </h2>
                <CircularProgress value={stats.completionRate} />
                <div className="mt-4 w-full space-y-2">
                  {[
                    { label: "Completed", count: stats.completed, color: "#4caf50" },
                    { label: "Active", count: stats.active, color: "#d97706" },
                    { label: "Locked", count: stats.locked, color: "#9ca3af" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="flex items-center gap-2 text-[#5e6a6e]">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        {item.label}
                      </span>
                      <span className="font-bold text-[#181a1b]">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Gamification Panel */}
            {!isBlankSlate && gamification.totalScore > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl border border-[#eaeaea] shadow-sm p-5 card-hover"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-[#181a1b] flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-[#d97706]" />
                    Your Scores
                  </h2>
                  <button
                    onClick={() => onViewChange("gamification")}
                    className="text-[10px] text-[#4293a7] hover:underline flex items-center gap-0.5"
                  >
                    View All <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <GamificationBadge gamification={gamification} compact />
                <div className="mt-3 pt-3 border-t border-[#f7f8fa] text-[10px] text-[#9ca3af]">
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#4293a7]" />
                    <span>+{SCORES.ON_TIME_BASE} per paper on time</span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Flame className="w-3 h-3 text-orange-500" />
                    <span>+{SCORES.STREAK_BONUS} streak bonus at 3+ weeks</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-white rounded-xl border border-[#eaeaea] shadow-sm overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-[#eaeaea]">
                <h2 className="text-sm font-bold text-[#181a1b]">Quick Actions</h2>
              </div>
              <div className="p-2">
                {[
                  { label: "Add Paper", icon: Plus, view: "papers", desc: "Add to your list" },
                  { label: "Dashboard", icon: TrendingUp, view: "dashboard", desc: "View roadmap" },
                  { label: "My Summaries", icon: CheckCircle, view: "filled", desc: "Knowledge base" },
                  { label: "Reading Plans", icon: Target, view: "plans", desc: "Organize topics" },
                ].map((action) => (
                  <button
                    key={action.view}
                    onClick={() => onViewChange(action.view)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-[#5e6a6e] hover:bg-gradient-to-r hover:from-[#f7f8fa] hover:to-white hover:text-[#181a1b] transition-all text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#f7f8fa] group-hover:bg-[#4293a7]/10 flex items-center justify-center transition-colors">
                      <action.icon className="w-4 h-4 text-[#4293a7]" />
                    </div>
                    <div>
                      <p className="font-medium text-[#181a1b] text-[13px]">
                        {action.label}
                      </p>
                      <p className="text-[10px] text-[#5e6a6e]">{action.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Recent Activity */}
            {recentCompleted.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-xl border border-[#eaeaea] shadow-sm overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-[#eaeaea]">
                  <h2 className="text-sm font-bold text-[#181a1b] flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#4293a7]" />
                    Recently Completed
                  </h2>
                </div>
                <div className="p-2">
                  {recentCompleted.map((paper) => (
                    <button
                      key={paper.id}
                      onClick={() => onPaperClick(paper)}
                      className="w-full text-left px-3 py-3 rounded-lg hover:bg-[#f7f8fa] transition-colors"
                    >
                      <p className="text-xs font-semibold text-[#181a1b] line-clamp-1">
                        {paper.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-[#5e6a6e]">
                          {paper.authors} ({paper.year})
                        </span>
                        {paper.dateCompleted && (
                          <span className="text-[9px] text-[#4caf50] font-medium">
                            {paper.dateCompleted}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Weekly Target Reminder */}
            {!isBlankSlate && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="bg-gradient-to-br from-[#4293a7]/5 to-[#5bb5c8]/5 rounded-xl border border-[#4293a7]/20 p-4"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-[#4293a7]" />
                  <span className="text-xs font-bold text-[#181a1b]">
                    Weekly Target
                  </span>
                </div>
                <p className="text-xs text-[#5e6a6e]">
                  Reading {gamification.weeklyTarget} paper{gamification.weeklyTarget !== 1 ? "s" : ""} per
                  week. Stay on track to earn +{SCORES.ON_TIME_BASE} points each!
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
