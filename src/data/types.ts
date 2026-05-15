// ============================================================
// PaperHacking v3.0 — Complete Data Model
// ============================================================

export interface UserProfile {
  name: string;
  role: string;
  avatar?: string;
}

export interface PaperSummary {
  [key: string]: string;
}

export interface PaperPDF {
  id: string;
  name: string;
  data: string; // base64
  size: number;
}

export interface Paper {
  id: string;
  planId: string;
  moduleId: string;
  week: number;
  order: number;
  title: string;
  authors: string;
  year: number;
  topic: string;
  topicSlug: string;
  keywords: string[];
  importance: string;
  doi: string;
  status: "locked" | "active" | "completed";
  summary?: PaperSummary;
  templateId: string;
  pdf?: PaperPDF;
  dateAdded: string;
  dateCompleted?: string;
  dueDate?: string; // for gamification
  /** IDs of terms associated with this paper */
  termIds?: string[];
}

// === TERMS & CONCEPTS ===

export interface Term {
  id: string;
  /** The term/concept name */
  name: string;
  /** The definition or explanation */
  definition: string;
  /** Optional notes about context, examples, etc. */
  notes: string;
  /** Optional image (base64 data URL) */
  image?: string;
  /** Source paper ID if this term came from a paper */
  paperId?: string;
  /** Source paper title for display */
  paperTitle?: string;
  /** Tags for categorization */
  tags: string[];
  /** When the term was created */
  dateAdded: string;
}

export interface Module {
  id: string;
  planId: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  priority: number; // 1-5
  order: number;
  notes?: string; // roadmap: learning goals, progress, questions, future papers
}

export interface ReadingPlan {
  id: string;
  name: string;
  description: string;
  priority: number; // 1-5
  order: number;
  color: string;
  notes?: string; // roadmap: learning goals, progress, questions, future papers
}

// === TEMPLATES ===

export interface TemplateField {
  key: string;
  label: string;
  placeholder: string;
  rows: number;
}

export interface SummaryTemplate {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  fields: TemplateField[];
}

// === GAMIFICATION ===

export interface GamificationState {
  totalScore: number;
  currentStreak: number;
  longestStreak: number;
  papersReadOnTime: number;
  papersReadLate: number;
  weeklyTarget: number;
  history: ScoreEvent[];
}

export interface ScoreEvent {
  id: string;
  paperId: string;
  paperTitle: string;
  points: number;
  type: "on-time" | "late" | "streak-bonus" | "penalty" | "milestone";
  date: string;
  description: string;
}

// === SYNTHESIS (Cross-Paper Argument Mapping) ===

export interface ContestedPoint {
  id: string;
  topic: string;
  positionA: string;
  papersA: string[]; // paper IDs supporting position A
  positionB: string;
  papersB: string[]; // paper IDs supporting position B
  myNote: string;
}

export interface Contradiction {
  id: string;
  paperAId: string;
  paperBId: string;
  paperAClaim: string;
  paperBClaim: string;
  contradiction: string; // explanation of the conflict
  resolvedBy: string; // user's resolution or note
}

export interface Synthesis {
  id: string;
  title: string;
  description: string;
  planId: string;
  moduleId: string;
  paperIds: string[];

  // Core synthesis fields
  consensusClaims: string; // What most papers agree on
  contestedPoints: ContestedPoint[];
  openGaps: string; // What no paper has addressed
  contradictions: Contradiction[];
  emergingThemes: string; // Patterns / themes across papers
  myTake: string; // User's overall synthesis opinion
  futureDirections: string; // Where the field should go next

  // Metadata
  dateCreated: string;
  dateModified: string;
}

// === APP STATE ===

export interface AppSettings {
  dataDirectory: string;
  defaultTemplateId: string;
  hasCompletedOnboarding: boolean;
}

export interface AppState {
  profile: UserProfile;
  plans: ReadingPlan[];
  modules: Module[];
  papers: Paper[];
  templates: SummaryTemplate[];
  terms: Term[];
  syntheses: Synthesis[];
  settings: AppSettings;
  gamification: GamificationState;
}

// === CONSTANTS ===

export const DEFAULT_TEMPLATES: SummaryTemplate[] = [
  {
    id: "template-original",
    name: "Original Paper",
    description: "For empirical / original research papers",
    isDefault: true,
    fields: [
      { key: "claim", label: "The Claim", placeholder: "Research question in my own words, max 3 sentences.", rows: 2 },
      { key: "myExperiment", label: "My Experiment", placeholder: "How I would test it: design, conditions, predicted result.", rows: 3 },
      { key: "theirExperiment", label: "Their Experiment", placeholder: "How they actually tested it.", rows: 3 },
      { key: "theGap", label: "The Gap", placeholder: "Why didn't they do it my way? / Why is their way better?", rows: 2 },
      { key: "resultsVsPredictions", label: "Results vs. My Predictions", placeholder: "What I expected vs. what they found.", rows: 2 },
      { key: "stealThis", label: "Steal This", placeholder: "One method/idea I can use in my own work.", rows: 2 },
      { key: "schemaUpdate", label: "Schema Update", placeholder: "What new mental connection did this build?", rows: 2 },
      { key: "bridgeToProject", label: "Current Project Bridge", placeholder: "How does this connect to my current project?", rows: 2 },
    ],
  },
  {
    id: "template-review",
    name: "Review Paper",
    description: "For review, meta-analysis, and theoretical papers",
    isDefault: true,
    fields: [
      { key: "scope", label: "Scope & Coverage", placeholder: "What domain/area does this review cover? What time period? How many papers/studies does it synthesize?", rows: 2 },
      { key: "theClaim", label: "The Claim", placeholder: "What is the main thesis or organizing framework? State it in your own words (max 3 sentences).", rows: 2 },
      { key: "myExperiment", label: "My Experiment", placeholder: "How would YOU test this claim? Describe your ideal design, conditions, and predicted result.", rows: 3 },
      { key: "theirEvidence", label: "Their Evidence", placeholder: "What evidence do the authors present? What types of studies are reviewed?", rows: 3 },
      { key: "theGap", label: "The Gap", placeholder: "Why didn't they do it your way? What are the limitations? What studies are missing?", rows: 2 },
      { key: "resultsVsPrediction", label: "Results vs. My Predictions", placeholder: "What did you expect going in vs. what the review actually concludes? Any surprises?", rows: 2 },
      { key: "stealThis", label: "Steal This", placeholder: "What method, framework, or idea can you use in your own work? Be specific.", rows: 2 },
      { key: "schemaUpdate", label: "Schema Update", placeholder: "What new mental model or connection did this review build for you? How does it restructure your understanding?", rows: 2 },
      { key: "bridgeToProject", label: "Current Project Bridge", placeholder: "How does this connect to your current dissertation/project? What can you directly apply?", rows: 2 },
    ],
  },
];

export const PRESET_PLANS = [
  { name: "Error Monitoring", description: "ERN, Pe, theta oscillations, ACC/mPFC mechanisms", color: "#4293a7" },
  { name: "Conflict Monitoring", description: "Botvinick's theory, conflict adaptation, cognitive control", color: "#7c3aed" },
  { name: "Reward Processing", description: "RL, dopamine RPE, striatum, value-based decisions", color: "#d97706" },
  { name: "Drift Diffusion Model", description: "Evidence accumulation, decision boundaries, RT modeling", color: "#059669" },
  { name: "Post-Error Adjustments", description: "PES, error correction, adaptive control", color: "#dc2626" },
  { name: "Working Memory", description: "Capacity, maintenance, manipulation, neural mechanisms", color: "#0891b2" },
  { name: "Attention & Cognitive Control", description: "Selective attention, task switching, Stroop, flanker", color: "#be185d" },
  { name: "Social Neuroscience", description: "Social cognition, theory of mind, empathy, social anxiety", color: "#4f46e5" },
];

export const SCORES = {
  ON_TIME_BASE: 100,
  STREAK_BONUS: 25,
  LATE_PENALTY_PER_DAY: -10,
  MILESTONE_10_PAPERS: 500,
  MILESTONE_25_PAPERS: 1500,
  MILESTONE_50_PAPERS: 4000,
};

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getModuleColor(moduleId: string, modules: Module[]): string {
  const mod = modules.find((m) => m.id === moduleId);
  return mod?.color || "#4293a7";
}

export function createInitialState(): AppState {
  return {
    profile: { name: "", role: "Researcher" },
    plans: [],
    modules: [],
    papers: [],
    templates: JSON.parse(JSON.stringify(DEFAULT_TEMPLATES)),
    terms: [],
    syntheses: [],
    settings: {
      dataDirectory: "",
      defaultTemplateId: "template-original",
      hasCompletedOnboarding: false,
    },
    gamification: {
      totalScore: 0,
      currentStreak: 0,
      longestStreak: 0,
      papersReadOnTime: 0,
      papersReadLate: 0,
      weeklyTarget: 2,
      history: [],
    },
  };
}
