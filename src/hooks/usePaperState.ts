import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type {
  AppState, Paper, PaperSummary, ReadingPlan, Module,
  SummaryTemplate, UserProfile, Term, Synthesis,
  PaperPDF, ScoreEvent,
} from "@/data/types";
import {
  createInitialState, generateId, SCORES,
} from "@/data/types";
import {
  loadStateOnStartup,
  saveStateToDisk,
  setDataDirectoryInBootstrap,
  clearDirFromLocalStorage,
  importDataFromDirectory,
} from "@/lib/persistence";

const DEBOUNCE_MS = 800;

export function usePaperState() {
  const [state, setState] = useState<AppState>(createInitialState);
  const [loaded, setLoaded] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaveRef = useRef(Date.now());

  // Load from disk on mount — uses localStorage bootstrap to find directory
  useEffect(() => {
    if (loaded) return;
    loadStateOnStartup().then(({ state: loadedState }) => {
      setState(loadedState);
      setLoaded(true);
    }).catch(() => {
      setLoaded(true);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save to disk (debounced)
  useEffect(() => {
    if (!loaded) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveStateToDisk(state);
      lastSaveRef.current = Date.now();
    }, DEBOUNCE_MS);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [state, loaded]);

  // === PROFILE ===
  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setState((prev) => ({ ...prev, profile: { ...prev.profile, ...updates } }));
  }, []);

  // === ONBOARDING ===
  const completeOnboarding = useCallback((
    profile: UserProfile,
    weeklyTarget: number,
    dataDirectory?: string,
  ) => {
    setState((prev) => ({
      ...prev,
      profile,
      settings: { ...prev.settings, hasCompletedOnboarding: true, dataDirectory: dataDirectory || prev.settings.dataDirectory },
      gamification: { ...prev.gamification, weeklyTarget },
    }));
  }, []);

  // === SET DATA DIRECTORY (called after onboarding picks a dir) ===
  const setDataDirectory = useCallback((dataDirectory: string) => {
    setDataDirectoryInBootstrap(dataDirectory); // save to localStorage
    setState((prev) => {
      const next = { ...prev, settings: { ...prev.settings, dataDirectory } };
      // Immediately save to the new directory
      saveStateToDisk(next);
      return next;
    });
  }, []);

  // === PLAN CRUD ===
  const addPlan = useCallback((name: string, description: string, priority: number, color: string) => {
    const plan: ReadingPlan = {
      id: generateId("plan"),
      name,
      description,
      priority,
      order: 0,
      color,
    };
    setState((prev) => ({ ...prev, plans: [...prev.plans, plan] }));
    return plan.id;
  }, []);

  const updatePlan = useCallback((id: string, updates: Partial<ReadingPlan>) => {
    setState((prev) => ({
      ...prev,
      plans: prev.plans.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  }, []);

  const deletePlan = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      plans: prev.plans.filter((p) => p.id !== id),
      modules: prev.modules.filter((m) => m.planId !== id),
      papers: prev.papers.filter((p) => p.planId !== id),
    }));
  }, []);

  // === MODULE CRUD ===
  const addModule = useCallback((planId: string, name: string, description: string, color: string, priority: number) => {
    const mod: Module = {
      id: generateId("mod"),
      planId,
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      description,
      color,
      priority,
      order: 0,
    };
    setState((prev) => ({ ...prev, modules: [...prev.modules, mod] }));
    return mod.id;
  }, []);

  const updateModule = useCallback((id: string, updates: Partial<Module>) => {
    setState((prev) => ({
      ...prev,
      modules: prev.modules.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    }));
  }, []);

  const deleteModule = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      modules: prev.modules.filter((m) => m.id !== id),
      papers: prev.papers.filter((p) => p.moduleId !== id),
    }));
  }, []);

  // === TEMPLATE CRUD ===
  const addTemplate = useCallback((template: Omit<SummaryTemplate, "id" | "isDefault">) => {
    const id = generateId("tmpl");
    const newTemplate: SummaryTemplate = { ...template, id, isDefault: false };
    setState((prev) => ({ ...prev, templates: [...prev.templates, newTemplate] }));
    return id;
  }, []);

  const updateTemplate = useCallback((id: string, updates: Partial<SummaryTemplate>) => {
    setState((prev) => ({
      ...prev,
      templates: prev.templates.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  }, []);

  const deleteTemplate = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      templates: prev.templates.filter((t) => t.id !== id),
    }));
  }, []);

  // === PAPER CRUD ===
  const addPaper = useCallback((paper: Omit<Paper, "id" | "dateAdded" | "status" | "moduleId"> & { moduleId?: string }) => {
    const newPaper: Paper = {
      ...paper as unknown as Paper,
      id: generateId("paper"),
      dateAdded: new Date().toISOString().split("T")[0],
      status: "active",
      moduleId: paper.moduleId ?? "default-module",
    };
    setState((prev) => {
      const papers = [...prev.papers, newPaper];
      const scheduled = schedulePapers(papers, prev.modules, prev.gamification.weeklyTarget);
      return { ...prev, papers: scheduled };
    });
    return newPaper.id;
  }, []);

  const updatePaper = useCallback((id: string, updates: Partial<Paper>) => {
    setState((prev) => ({
      ...prev,
      papers: prev.papers.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  }, []);

  const deletePaper = useCallback((id: string) => {
    setState((prev) => {
      const papers = prev.papers.filter((p) => p.id !== id);
      const scheduled = schedulePapers(papers, prev.modules, prev.gamification.weeklyTarget);
      return { ...prev, papers: scheduled };
    });
  }, []);

  // === PDF ===
  const addPDFToPaper = useCallback((paperId: string, pdf: PaperPDF) => {
    setState((prev) => ({
      ...prev,
      papers: prev.papers.map((p) => (p.id === paperId ? { ...p, pdf } : p)),
    }));
  }, []);

  const removePDFFromPaper = useCallback((paperId: string) => {
    setState((prev) => ({
      ...prev,
      papers: prev.papers.map((p) => {
        if (p.id === paperId) {
          const { pdf: _, ...rest } = p;
          return rest as Paper;
        }
        return p;
      }),
    }));
  }, []);

  // === TERMS & CONCEPTS ===
  const addTerm = useCallback((term: Omit<Term, "id" | "dateAdded">) => {
    const newTerm: Term = {
      ...term,
      id: generateId("term"),
      dateAdded: new Date().toISOString().split("T")[0],
    };
    setState((prev) => ({ ...prev, terms: [...prev.terms, newTerm] }));
    // Also link to paper if paperId provided
    if (newTerm.paperId) {
      setState((prev) => ({
        ...prev,
        papers: prev.papers.map((p) =>
          p.id === newTerm.paperId
            ? { ...p, termIds: [...(p.termIds || []), newTerm.id] }
            : p
        ),
      }));
    }
    return newTerm.id;
  }, []);

  const updateTerm = useCallback((id: string, updates: Partial<Term>) => {
    setState((prev) => ({
      ...prev,
      terms: prev.terms.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  }, []);

  const deleteTerm = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      terms: prev.terms.filter((t) => t.id !== id),
      papers: prev.papers.map((p) => ({
        ...p,
        termIds: (p.termIds || []).filter((tid) => tid !== id),
      })),
    }));
  }, []);

  // === SYNTHESIS CRUD ===
  const addSynthesis = useCallback((synthesis: Omit<Synthesis, "id" | "dateCreated" | "dateModified">) => {
    const now = new Date().toISOString().split("T")[0];
    const newSynth: Synthesis = {
      ...synthesis,
      id: generateId("synth"),
      dateCreated: now,
      dateModified: now,
    };
    setState((prev) => ({ ...prev, syntheses: [...prev.syntheses, newSynth] }));
    return newSynth.id;
  }, []);

  const updateSynthesis = useCallback((id: string, updates: Partial<Synthesis>) => {
    const now = new Date().toISOString().split("T")[0];
    setState((prev) => ({
      ...prev,
      syntheses: prev.syntheses.map((s) => (s.id === id ? { ...s, ...updates, dateModified: now } : s)),
    }));
  }, []);

  const deleteSynthesis = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      syntheses: prev.syntheses.filter((s) => s.id !== id),
    }));
  }, []);

  // === GAMIFICATION: SAVE SUMMARY ===
  const saveSummary = useCallback((paperId: string, summary: PaperSummary) => {
    setState((prev) => {
      const paper = prev.papers.find((p) => p.id === paperId);
      if (!paper) return prev;

      const now = new Date().toISOString().split("T")[0];
      const wasAlreadyComplete = paper.status === "completed";
      const isLate = paper.dueDate ? now > paper.dueDate : false;
      const daysLate = isLate && paper.dueDate
        ? Math.floor((new Date(now).getTime() - new Date(paper.dueDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const events: ScoreEvent[] = [];

      if (!wasAlreadyComplete) {
        let points = SCORES.ON_TIME_BASE;
        if (isLate) {
          points = Math.max(10, SCORES.ON_TIME_BASE + daysLate * SCORES.LATE_PENALTY_PER_DAY);
        }

        const newStreak = isLate ? 0 : prev.gamification.currentStreak + 1;
        const isNewStreak = newStreak >= 3;

        events.push({
          id: generateId("score"),
          paperId,
          paperTitle: paper.title,
          points,
          type: isLate ? "late" : "on-time",
          description: isLate
            ? `${daysLate} day${daysLate !== 1 ? "s" : ""} late — ${points}pts`
            : `Completed on time — +${points}pts`,
          date: now,
        });

        if (isNewStreak) {
          events.push({
            id: generateId("score"),
            paperId,
            paperTitle: paper.title,
            points: SCORES.STREAK_BONUS,
            type: "streak-bonus",
            description: `${newStreak}-week streak bonus — +${SCORES.STREAK_BONUS}pts`,
            date: now,
          });
        }

        const totalCompleted = prev.gamification.papersReadOnTime + prev.gamification.papersReadLate + 1;
        const milestones = [10, 25, 50];
        const prevCompleted = prev.gamification.papersReadOnTime + prev.gamification.papersReadLate;
        for (const m of milestones) {
          if (prevCompleted < m && totalCompleted >= m) {
            const milestonePoints = m === 10 ? SCORES.MILESTONE_10_PAPERS : m === 25 ? SCORES.MILESTONE_25_PAPERS : SCORES.MILESTONE_50_PAPERS;
            events.push({
              id: generateId("score"),
              paperId,
              paperTitle: paper.title,
              points: milestonePoints,
              type: "milestone",
              description: `Milestone: ${m} papers! — +${milestonePoints}pts`,
              date: now,
            });
          }
        }

        return {
          ...prev,
          papers: prev.papers.map((p) =>
            p.id === paperId
              ? { ...p, status: "completed" as const, summary, dateCompleted: now }
              : p
          ),
          gamification: {
            ...prev.gamification,
            totalScore: prev.gamification.totalScore + events.reduce((s, e) => s + e.points, 0),
            currentStreak: newStreak,
            longestStreak: Math.max(prev.gamification.longestStreak, newStreak),
            papersReadOnTime: prev.gamification.papersReadOnTime + (isLate ? 0 : 1),
            papersReadLate: prev.gamification.papersReadLate + (isLate ? 1 : 0),
            history: [...prev.gamification.history, ...events],
          },
        };
      }

      // Just update summary if already complete
      return {
        ...prev,
        papers: prev.papers.map((p) =>
          p.id === paperId ? { ...p, summary } : p
        ),
      };
    });
  }, []);

  const unmarkComplete = useCallback((paperId: string) => {
    setState((prev) => ({
      ...prev,
      papers: prev.papers.map((p) => {
        if (p.id === paperId) {
          const { summary: _, dateCompleted: __, status: ___, ...rest } = p;
          return { ...rest, status: "active" as const };
        }
        return p;
      }),
    }));
  }, []);

  // === SETTINGS ===
  const updateSettings = useCallback((updates: Partial<AppState["settings"]>) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...updates },
    }));
  }, []);

  const updateWeeklyTarget = useCallback((weeklyTarget: number) => {
    setState((prev) => {
      const next = {
        ...prev,
        gamification: { ...prev.gamification, weeklyTarget },
      };
      const scheduled = schedulePapers(next.papers, next.modules, weeklyTarget);
      return { ...next, papers: scheduled };
    });
  }, []);

  // === IMPORT ===
  const importData = useCallback(async () => {
    const { state: loadedState, error } = await importDataFromDirectory();
    if (loadedState) {
      setState(loadedState);
      return { success: true, error: null };
    }
    return { success: false, error };
  }, []);

  // === RESET ===
  const resetData = useCallback(() => {
    clearDirFromLocalStorage();
    setState(createInitialState());
  }, []);

  // === DERIVED STATE ===
  const papers = state.papers;
  const plans = state.plans;
  const modules = state.modules;
  const templates = state.templates;
  const terms = state.terms;
  const syntheses = state.syntheses;
  const settings = state.settings;
  const profile = state.profile;
  const gamification = state.gamification;

  const nextPaper = useMemo(() => {
    const active = papers.filter((p) => p.status === "active");
    return active.sort((a, b) => (a.order || 0) - (b.order || 0))[0] || null;
  }, [papers]);

  const stats = useMemo(() => {
    const total = papers.length;
    const completed = papers.filter((p) => p.status === "completed").length;
    const active = papers.filter((p) => p.status === "active").length;
    const locked = papers.filter((p) => p.status === "locked").length;
    const byModule = modules.map((mod) => ({
      ...mod,
      completed: papers.filter((p) => p.moduleId === mod.id && p.status === "completed").length,
      total: papers.filter((p) => p.moduleId === mod.id).length,
    }));
    return {
      total,
      completed,
      active,
      locked,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      byModule,
    };
  }, [papers, modules]);

  const allKeywords = useMemo(() => {
    const kwSet = new Set<string>();
    papers.forEach((p) => p.keywords.forEach((k) => kwSet.add(k)));
    return Array.from(kwSet).sort();
  }, [papers]);

  const weeks = useMemo(() => {
    const grouped = new Map<number, Paper[]>();
    papers.forEach((p) => {
      if (p.week > 0) {
        const list = grouped.get(p.week) || [];
        list.push(p);
        grouped.set(p.week, list);
      }
    });
    return Array.from(grouped.entries()).sort((a, b) => a[0] - b[0]);
  }, [papers]);

  return {
    state,
    papers,
    plans,
    modules,
    templates,
    terms,
    syntheses,
    settings,
    profile,
    gamification,
    nextPaper,
    stats,
    allKeywords,
    weeks,
    loaded,
    // Actions
    updateProfile,
    completeOnboarding,
    setDataDirectory,
    addPaper,
    updatePaper,
    deletePaper,
    addPDFToPaper,
    removePDFFromPaper,
    addTerm,
    updateTerm,
    deleteTerm,
    addSynthesis,
    updateSynthesis,
    deleteSynthesis,
    saveSummary,
    unmarkComplete,
    addPlan,
    updatePlan,
    deletePlan,
    addModule,
    updateModule,
    deleteModule,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    updateSettings,
    updateWeeklyTarget,
    importData,
    resetData,
  };
}

// === PRIORITY-BASED SCHEDULING ENGINE ===

function schedulePapers(papers: Paper[], modules: Module[], weeklyTarget: number): Paper[] {
  const sortedModules = [...modules].sort((a, b) => {
    return (b.priority * 10 + b.order) - (a.priority * 10 + a.order);
  });

  const incomplete = papers.filter((p) => p.status !== "completed");
  const completed = papers.filter((p) => p.status === "completed");

  const sortedPapers = [...incomplete].sort((a, b) => {
    const modA = sortedModules.find((m) => m.id === a.moduleId);
    const modB = sortedModules.find((m) => m.id === b.moduleId);
    const priA = modA ? modA.priority * 10 + modA.order : 0;
    const priB = modB ? modB.priority * 10 + modB.order : 0;
    return priB - priA;
  });

  let currentWeek = 1;
  let papersThisWeek = 0;

  const scheduled = sortedPapers.map((p, idx) => {
    if (papersThisWeek >= weeklyTarget) {
      currentWeek++;
      papersThisWeek = 0;
    }
    const week = currentWeek;
    papersThisWeek++;

    const added = new Date(p.dateAdded || new Date().toISOString().split("T")[0]);
    const due = new Date(added);
    due.setDate(due.getDate() + (currentWeek * 7));

    return { ...p, week, order: idx + 1, status: p.status === "locked" ? "active" as const : p.status, dueDate: due.toISOString().split("T")[0] };
  });

  return [...completed, ...scheduled];
}
