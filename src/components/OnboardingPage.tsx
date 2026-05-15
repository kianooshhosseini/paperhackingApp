import { useState } from "react";
import {
  BrainCircuit, ArrowRight, ArrowLeft, Target,
  Sparkles, CheckCircle, Zap, BookOpen, GraduationCap,
  FolderOpen, FileCheck, Upload,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pickDataDirectory } from "@/lib/persistence";
import type { UserProfile } from "@/data/types";

interface OnboardingPageProps {
  onComplete: (profile: UserProfile, weeklyTarget: number, dataDirectory: string) => void;
}

type Step = "welcome" | "profile" | "pace" | "directory" | "confirm";

const stepLabels: Record<Step, string> = {
  welcome: "Welcome",
  profile: "Your Profile",
  pace: "Reading Pace",
  directory: "Save Location",
  confirm: "Ready!",
};

export function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const [step, setStep] = useState<Step>("welcome");
  const [profile, setProfile] = useState<UserProfile>({ name: "", role: "PhD Student" });
  const [weeklyTarget, setWeeklyTarget] = useState(2);
  const [dataDirectory, setDataDirectory] = useState("");
  const [isPickingDir, setIsPickingDir] = useState(false);

  const steps: Step[] = ["welcome", "profile", "pace", "directory", "confirm"];
  const currentIndex = steps.indexOf(step);

  const goNext = () => {
    if (currentIndex < steps.length - 1) setStep(steps[currentIndex + 1]);
  };

  const goBack = () => {
    if (currentIndex > 0) setStep(steps[currentIndex - 1]);
  };

  const handlePickDirectory = async () => {
    setIsPickingDir(true);
    try {
      const path = await pickDataDirectory();
      if (path) setDataDirectory(path);
    } catch {
      // User cancelled
    }
    setIsPickingDir(false);
  };

  const handleComplete = () => {
    onComplete(profile, weeklyTarget, dataDirectory);
  };

  const canProceed = () => {
    if (step === "profile") return profile.name.trim().length > 0;
    if (step === "directory") return dataDirectory.length > 0;
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f8fa] via-white to-[#eef4f5] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl"
      >
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-[#4293a7]/5 border border-[#eaeaea] overflow-hidden flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#4293a7] to-[#5bb5c8] px-8 py-5 shrink-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <BrainCircuit className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">PaperHacking Workbench</h2>
                <p className="text-[11px] text-white/70">
                  Step {currentIndex + 1} of {steps.length} &mdash; {stepLabels[step]}
                </p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="flex gap-1.5">
              {steps.map((s, i) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
                    i <= currentIndex ? "bg-white" : "bg-white/25"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Content - scrollable */}
          <div className="flex-1 overflow-y-auto px-8 py-8 min-h-0">
            <AnimatePresence mode="wait">
              {step === "welcome" && (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4293a7] to-[#5bb5c8] flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#4293a7]/20">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-xl font-bold text-[#181a1b] mb-2">
                    Your Research Reading Workbench
                  </h1>
                  <p className="text-sm text-[#5e6a6e] leading-relaxed max-w-sm mx-auto mb-6">
                    Systematically read, summarize, and internalize research papers.
                    Set up your personalized workspace in a few steps.
                  </p>
                  <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto mb-6">
                    {[
                      { icon: Target, label: "Set Goals", desc: "Define your pace" },
                      { icon: GraduationCap, label: "Any Field", desc: "Your own topics" },
                      { icon: Zap, label: "Auto-Save", desc: "To your disk" },
                    ].map((item) => (
                      <div key={item.label} className="bg-[#f7f8fa] rounded-xl p-3 text-center">
                        <item.icon className="w-5 h-5 text-[#4293a7] mx-auto mb-1.5" />
                        <p className="text-[11px] font-semibold text-[#181a1b]">{item.label}</p>
                        <p className="text-[9px] text-[#5e6a6e]">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === "profile" && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h3 className="text-base font-bold text-[#181a1b] mb-1">Who are you?</h3>
                  <p className="text-sm text-[#5e6a6e] mb-5">
                    This personalizes your dashboard.
                  </p>

                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="text-xs font-semibold text-[#5e6a6e] uppercase mb-1.5 block">
                        Your Name
                      </label>
                      <Input
                        value={profile.name}
                        onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                        placeholder="e.g. Jane Doe"
                        className="text-sm"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#5e6a6e] uppercase mb-1.5 block">
                        Your Role
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {["PhD Student", "Postdoc", "Researcher", "Professor", "Grad Student", "Other"].map((role) => (
                          <button
                            key={role}
                            onClick={() => setProfile((p) => ({ ...p, role }))}
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
                </motion.div>
              )}

              {step === "pace" && (
                <motion.div
                  key="pace"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h3 className="text-base font-bold text-[#181a1b] mb-1">
                    How many papers per week?
                  </h3>
                  <p className="text-sm text-[#5e6a6e] mb-6">
                    This sets your weekly target. You can change it anytime in Settings.
                  </p>

                  <div className="flex items-center justify-center gap-4 mb-6">
                    <button
                      onClick={() => setWeeklyTarget(Math.max(1, weeklyTarget - 1))}
                      className="w-12 h-12 rounded-xl bg-[#f7f8fa] hover:bg-[#4293a7]/10 flex items-center justify-center text-[#5e6a6e] hover:text-[#4293a7] transition-all text-lg font-bold"
                    >
                      -
                    </button>
                    <div className="text-center w-24">
                      <p className="text-4xl font-bold text-[#181a1b]">{weeklyTarget}</p>
                      <p className="text-xs text-[#5e6a6e] mt-1">papers/week</p>
                    </div>
                    <button
                      onClick={() => setWeeklyTarget(Math.min(10, weeklyTarget + 1))}
                      className="w-12 h-12 rounded-xl bg-[#f7f8fa] hover:bg-[#4293a7]/10 flex items-center justify-center text-[#5e6a6e] hover:text-[#4293a7] transition-all text-lg font-bold"
                    >
                      +
                    </button>
                  </div>

                  <div className="bg-[#f7f8fa] rounded-xl p-4 max-w-md mx-auto">
                    <div className="flex items-start gap-3">
                      <Zap className="w-5 h-5 text-[#d97706] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-[#181a1b]">
                          {weeklyTarget === 1 && "Relaxed pace"}
                          {weeklyTarget === 2 && "Balanced pace"}
                          {weeklyTarget === 3 && "Ambitious pace"}
                          {weeklyTarget >= 4 && "Intense pace"}
                        </p>
                        <p className="text-xs text-[#5e6a6e] mt-0.5">
                          {weeklyTarget === 1 && "Great for deep, thorough reading with detailed summaries."}
                          {weeklyTarget === 2 && "A solid balance between depth and breadth. Recommended!"}
                          {weeklyTarget === 3 && "Fast-paced. Good if you have dedicated reading time."}
                          {weeklyTarget >= 4 && "Very intense. Best for literature review sprints."}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === "directory" && (
                <motion.div
                  key="directory"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h3 className="text-base font-bold text-[#181a1b] mb-1">
                    Where should your data be saved?
                  </h3>
                  <p className="text-sm text-[#5e6a6e] mb-6">
                    Choose a folder on your computer. All your papers, summaries, and settings will be saved there automatically.
                  </p>

                  <div className="space-y-4">
                    <button
                      onClick={handlePickDirectory}
                      disabled={isPickingDir}
                      className="w-full flex items-center gap-3 p-5 rounded-xl border-2 border-dashed border-[#eaeaea] hover:border-[#4293a7] hover:bg-[#4293a7]/5 transition-all text-left group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#4293a7]/10 flex items-center justify-center shrink-0 group-hover:bg-[#4293a7]/20">
                        <FolderOpen className="w-5 h-5 text-[#4293a7]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[#181a1b]">
                          {isPickingDir ? "Opening folder picker..." : "Choose Folder"}
                        </p>
                        <p className="text-xs text-[#5e6a6e]">
                          {dataDirectory || "Click to browse your computer"}
                        </p>
                      </div>
                    </button>

                    {dataDirectory && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-3 p-4 rounded-xl bg-[#4caf50]/5 border border-[#4caf50]/20"
                      >
                        <FileCheck className="w-5 h-5 text-[#4caf50] shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-[#4caf50]">
                            Save location set
                          </p>
                          <p className="text-xs text-[#5e6a6e] mt-0.5 break-all">
                            {dataDirectory}
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* Import option */}
                  <div className="bg-[#f7f8fa] rounded-xl p-4">
                    <p className="text-xs font-medium text-[#181a1b] mb-2">Already have data?</p>
                    <p className="text-xs text-[#5e6a6e] mb-3">
                      If you have a PaperHacking data folder from another computer, select it to import your existing work.
                    </p>
                    <button
                      onClick={async () => {
                        setIsPickingDir(true);
                        try {
                          const path = await pickDataDirectory();
                          if (path) setDataDirectory(path);
                        } catch {
                          // User cancelled
                        }
                        setIsPickingDir(false);
                      }}
                      disabled={isPickingDir}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#eaeaea] bg-white hover:border-[#4293a7] hover:text-[#4293a7] transition-all text-xs font-medium text-[#5e6a6e]"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {isPickingDir ? "Opening folder picker..." : "Import Existing Data Folder"}
                    </button>
                  </div>

                  <div className="bg-[#f7f8fa] rounded-xl p-4 text-xs text-[#5e6a6e] space-y-1">
                    <p className="font-medium text-[#181a1b]">What gets saved?</p>
                    <p>All your papers, summaries, reading plans, templates, PDFs, scores, and settings are written to a single file in this folder.</p>
                    <p className="text-[#4293a7] font-medium mt-1">Everything is saved automatically — no manual export needed.</p>
                  </div>
                </div>
              </motion.div>
              )}

              {step === "confirm" && (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-[#4caf50] to-[#66bb6a] flex items-center justify-center mx-auto mb-5 shadow-lg"
                  >
                    <CheckCircle className="w-8 h-8 text-white" />
                  </motion.div>

                  <h3 className="text-lg font-bold text-[#181a1b] mb-2">
                    All set{profile.name ? `, ${profile.name.split(" ")[0]}` : ""}!
                  </h3>
                  <p className="text-sm text-[#5e6a6e] mb-5">
                    Your reading workbench is ready.
                  </p>

                  <div className="bg-[#f7f8fa] rounded-xl p-4 max-w-sm mx-auto mb-6 text-left space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#5e6a6e]">Name</span>
                      <span className="font-medium text-[#181a1b]">{profile.name || "Researcher"}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#5e6a6e]">Role</span>
                      <span className="font-medium text-[#181a1b]">{profile.role}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#5e6a6e]">Weekly Target</span>
                      <span className="font-medium text-[#181a1b]">{weeklyTarget} papers</span>
                    </div>
                    <div className="flex items-start justify-between text-sm gap-2">
                      <span className="text-[#5e6a6e] shrink-0">Save Location</span>
                      <span className="font-medium text-[#181a1b] text-right break-all text-xs">{dataDirectory}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#9ca3af] mb-4">
                    Create your own reading plans and topics from the &quot;Reading Plans&quot; tab.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer buttons - always visible, shrink-0 */}
          <div className="shrink-0 px-8 py-5 border-t border-[#eaeaea] bg-white flex items-center justify-between">
            {step !== "welcome" ? (
              <Button variant="outline" onClick={goBack} className="text-sm gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
            ) : (
              <div />
            )}

            {step === "welcome" && (
              <Button
                onClick={goNext}
                className="bg-[#4293a7] hover:bg-[#357a8a] text-white gap-2 text-sm px-5"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
            )}

            {step === "profile" && (
              <Button
                onClick={goNext}
                disabled={!canProceed()}
                className="bg-[#4293a7] hover:bg-[#357a8a] text-white gap-2 text-sm px-5"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </Button>
            )}

            {step === "pace" && (
              <Button
                onClick={goNext}
                className="bg-[#4293a7] hover:bg-[#357a8a] text-white gap-2 text-sm px-5"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </Button>
            )}

            {step === "directory" && (
              <Button
                onClick={goNext}
                disabled={!canProceed()}
                className="bg-[#4293a7] hover:bg-[#357a8a] text-white gap-2 text-sm px-5"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </Button>
            )}

            {step === "confirm" && (
              <Button
                onClick={handleComplete}
                className="bg-[#4293a7] hover:bg-[#357a8a] text-white gap-2 text-sm px-6"
              >
                Launch Workbench
                <Sparkles className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Footer branding */}
        <p className="text-center text-[11px] text-[#9ca3af] mt-4">
          PaperHacking Workbench &middot; Built by{" "}
          <a
            href="https://kianoosh.info"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#4293a7] hover:underline"
          >
            Kianoosh Hosseini
          </a>
        </p>
      </motion.div>
    </div>
  );
}
