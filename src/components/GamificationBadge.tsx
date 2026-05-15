import { motion } from "framer-motion";
import { Trophy, Flame, Zap, Target, TrendingUp, Star, Award, Clock, AlertTriangle } from "lucide-react";
import type { GamificationState, ScoreEvent } from "@/data/types";
import { SCORES } from "@/data/types";

interface GamificationBadgeProps {
  gamification: GamificationState;
  compact?: boolean;
}

export function GamificationBadge({ gamification, compact = false }: GamificationBadgeProps) {
  const { totalScore, currentStreak, longestStreak, papersReadOnTime, papersReadLate, weeklyTarget, history } = gamification;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <motion.div
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-[#d97706]/10 to-[#f59e0b]/10 border border-[#d97706]/20"
          whileHover={{ scale: 1.05 }}
        >
          <Trophy className="w-3.5 h-3.5 text-[#d97706]" />
          <span className="text-xs font-bold text-[#d97706]">{totalScore.toLocaleString()}</span>
        </motion.div>
        {currentStreak >= 3 && (
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20"
          >
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-[10px] font-bold text-orange-600">{currentStreak}</span>
          </motion.div>
        )}
      </div>
    );
  }

  const nextMilestone = [10, 25, 50].find((m) => papersReadOnTime + papersReadLate < m) || 100;
  const progressToMilestone = papersReadOnTime + papersReadLate;
  const milestonePercent = Math.min(100, (progressToMilestone / nextMilestone) * 100);

  return (
    <div className="space-y-4">
      {/* Score Hero */}
      <div className="bg-gradient-to-br from-[#4293a7] to-[#5bb5c8] rounded-xl p-5 text-white shadow-lg shadow-[#4293a7]/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white/70 font-medium uppercase tracking-wider mb-1">Total Score</p>
            <motion.p
              key={totalScore}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="text-3xl font-bold"
            >
              {totalScore.toLocaleString()}
            </motion.p>
          </div>
          <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
            <Trophy className="w-7 h-7 text-white" />
          </div>
        </div>

        {/* Milestone Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-white/70">Next milestone: {nextMilestone} papers</span>
            <span className="text-[10px] text-white/70">{progressToMilestone}/{nextMilestone}</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${milestonePercent}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Flame}
          label="Current Streak"
          value={`${currentStreak} ${currentStreak === 1 ? "week" : "weeks"}`}
          color={currentStreak >= 3 ? "#d97706" : "#5e6a6e"}
          animate={currentStreak >= 3}
        />
        <StatCard
          icon={Award}
          label="Longest Streak"
          value={`${longestStreak} ${longestStreak === 1 ? "week" : "weeks"}`}
          color="#7c3aed"
        />
        <StatCard
          icon={Zap}
          label="On Time"
          value={String(papersReadOnTime)}
          color="#4caf50"
        />
        <StatCard
          icon={Clock}
          label="Late"
          value={String(papersReadLate)}
          color={papersReadLate > 0 ? "#dc2626" : "#9ca3af"}
        />
      </div>

      {/* Weekly Target */}
      <div className="bg-white rounded-xl border border-[#eaeaea] p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[#4293a7]" />
            <span className="text-xs font-semibold text-[#181a1b]">Weekly Target</span>
          </div>
          <span className="text-xs font-bold text-[#4293a7]">{weeklyTarget} papers</span>
        </div>
        <p className="text-[11px] text-[#5e6a6e]">
          Reading {weeklyTarget} papers/week earns +{SCORES.ON_TIME_BASE} points each. Streaks of 3+ weeks earn +{SCORES.STREAK_BONUS} bonus!
        </p>
      </div>

      {/* Recent Score Events */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl border border-[#eaeaea] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#f7f8fa]">
            <p className="text-xs font-semibold text-[#181a1b] flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-[#4293a7]" />
              Recent Activity
            </p>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {history.slice(-10).reverse().map((event) => (
              <ScoreEventRow key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  animate = false,
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
  color: string;
  animate?: boolean;
}) {
  return (
    <motion.div
      className="bg-white rounded-xl border border-[#eaeaea] p-3.5"
      whileHover={{ y: -2 }}
      animate={animate ? { scale: [1, 1.02, 1] } : undefined}
      transition={animate ? { duration: 2, repeat: Infinity } : undefined}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        <span className="text-[10px] text-[#5e6a6e] font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-lg font-bold text-[#181a1b]" style={{ color }}>{value}</p>
    </motion.div>
  );
}

function ScoreEventRow({ event }: { event: ScoreEvent }) {
  const isPositive = event.points > 0;
  const icons = {
    "on-time": Zap,
    "late": Clock,
    "streak-bonus": Flame,
    penalty: AlertTriangle,
    milestone: Star,
  };
  const Icon = icons[event.type] || TrendingUp;

  const colors = {
    "on-time": "#4caf50",
    "late": "#dc2626",
    "streak-bonus": "#d97706",
    penalty: "#dc2626",
    milestone: "#7c3aed",
  };
  const color = colors[event.type] || "#4293a7";

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#fafafa] transition-colors border-b border-[#f7f8fa] last:border-0">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15` }}>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-[#181a1b] truncate">{event.paperTitle}</p>
        <p className="text-[10px] text-[#9ca3af]">{event.description}</p>
      </div>
      <span className={`text-xs font-bold ${isPositive ? "text-[#4caf50]" : "text-red-500"}`}>
        {isPositive ? "+" : ""}{event.points}
      </span>
    </div>
  );
}

export function ScoreToast({ event }: { event: ScoreEvent | null; onDone?: () => void }) {
  if (!event) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="fixed bottom-6 right-6 z-[100] bg-white rounded-xl shadow-xl border border-[#eaeaea] p-4 flex items-center gap-3"
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4caf50] to-[#66bb6a] flex items-center justify-center">
        <Trophy className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-sm font-bold text-[#181a1b]">
          +{event.points} points!
        </p>
        <p className="text-xs text-[#5e6a6e]">{event.description}</p>
      </div>
    </motion.div>
  );
}
