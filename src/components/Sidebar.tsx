import {
  BrainCircuit, Home, LayoutDashboard, BookOpen, FileText,
  FolderOpen, Settings, Trophy, Flame, User, Sparkles, Target,
  Lightbulb, GitBranch,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { UserProfile, GamificationState } from "@/data/types";

interface SidebarProps {
  papersTotal: number;
  completedCount: number;
  activeView: string;
  onViewChange: (view: string) => void;
  profile: UserProfile;
  gamification: GamificationState;
}

const menuItems = [
  { id: "home", label: "Home", icon: Home, desc: "Overview" },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, desc: "Weekly plan" },
  { id: "papers", label: "All Papers", icon: BookOpen, desc: "Browse & search" },
  { id: "plans", label: "Reading Plans", icon: FolderOpen, desc: "Organize topics" },
  { id: "filled", label: "My Summaries", icon: FileText, desc: "Knowledge base" },
  { id: "terms", label: "Terms", icon: Lightbulb, desc: "Concepts learned" },
  { id: "syntheses", label: "Synthesis", icon: GitBranch, desc: "Cross-paper mapping" },
  { id: "gamification", label: "Scores", icon: Trophy, desc: "Gamification" },
  { id: "settings", label: "Settings", icon: Settings, desc: "Export & templates" },
];

export function Sidebar({
  papersTotal,
  completedCount,
  activeView,
  onViewChange,
  profile,
  gamification,
}: SidebarProps) {
  const progressPercent = papersTotal > 0 ? Math.round((completedCount / papersTotal) * 100) : 0;

  return (
    <aside className="fixed left-0 top-0 h-full w-[240px] bg-white border-r border-[#eaeaea] flex flex-col z-20">
      {/* Brand */}
      <div className="px-5 pt-5 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4293a7] to-[#5bb5c8] flex items-center justify-center shadow-md shadow-[#4293a7]/20">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-[#181a1b] text-[15px] tracking-tight leading-none block">
              PaperHacking
            </span>
            <span className="text-[9px] text-[#5e6a6e] font-medium tracking-wide">
              RESEARCH WORKBENCH
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pt-4 overflow-y-auto">
        <p className="px-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[#9ca3af] mb-2">
          Navigation
        </p>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 mb-1 ${
                isActive
                  ? "bg-gradient-to-r from-[#4293a7]/10 to-[#4293a7]/5 text-[#4293a7] shadow-sm sidebar-active"
                  : "text-[#5e6a6e] hover:bg-[#f7f8fa] hover:text-[#181a1b]"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  isActive ? "bg-[#4293a7]/10" : "bg-transparent"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <span className="block leading-tight">{item.label}</span>
                <span
                  className={`block text-[10px] font-normal ${
                    isActive ? "text-[#4293a7]/70" : "text-[#9ca3af]"
                  }`}
                >
                  {item.desc}
                </span>
              </div>
              {item.id === "gamification" && gamification.totalScore > 0 && (
                <span className="text-[10px] font-bold text-[#d97706] bg-[#d97706]/10 px-1.5 py-0.5 rounded">
                  {gamification.totalScore}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Section: Gamification + Profile */}
      <div className="px-4 py-4 border-t border-[#eaeaea] bg-gradient-to-b from-white to-[#fafbfc] space-y-4">
        {/* Gamification Mini */}
        {gamification.totalScore > 0 && (
          <div className="bg-gradient-to-r from-[#f7f8fa] to-white rounded-xl p-3 border border-[#eaeaea]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-[#d97706]" />
                <span className="text-[11px] font-bold text-[#181a1b]">
                  {gamification.totalScore.toLocaleString()}
                </span>
              </div>
              {gamification.currentStreak >= 3 && (
                <div className="flex items-center gap-1">
                  <Flame className="w-3 h-3 text-orange-500" />
                  <span className="text-[10px] font-bold text-orange-600">
                    {gamification.currentStreak}w
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-[#5e6a6e]">
              <Target className="w-3 h-3" />
              <span>{gamification.papersReadOnTime + gamification.papersReadLate} papers</span>
              <span className="text-[#eaeaea]">|</span>
              <Sparkles className="w-3 h-3 text-[#4293a7]" />
              <span>{gamification.papersReadOnTime} on time</span>
            </div>
          </div>
        )}

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5e6a6e]">
              Progress
            </span>
            <span className="text-[11px] font-bold text-[#4293a7]">
              {completedCount}/{papersTotal}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <p className="text-[10px] text-[#9ca3af] mt-1.5 font-medium">
            {progressPercent}% complete
          </p>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-2.5 pt-3 border-t border-[#eaeaea]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#a8ccd5] to-[#4293a7]/30 flex items-center justify-center">
            <User className="w-4 h-4 text-[#4293a7]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[#181a1b] truncate">
              {profile.name || "Researcher"}
            </p>
            <p className="text-[9px] text-[#9ca3af] font-medium uppercase tracking-wider truncate">
              {profile.role}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
