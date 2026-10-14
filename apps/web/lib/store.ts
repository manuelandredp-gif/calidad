import { create } from 'zustand';
import type { Analysis, Finding } from '@qualireq/engine';

interface WorkspaceState {
  text: string;
  analyzedText: string;
  analysis: Analysis | null;
  decisions: Record<string, 'aceptado' | 'rechazado'>;
  edits: Record<string, string>;
  selectedReqId: string | null;
  severityFilter: string | null;
  toast: { message: string; undoKey?: string } | null;
  saving: boolean;

  setText: (text: string) => void;
  setAnalysis: (text: string, analysis: Analysis) => void;
  setDecision: (key: string, status: 'aceptado' | 'rechazado' | null) => void;
  setEdit: (key: string, value: string) => void;
  selectReq: (id: string | null) => void;
  setSeverityFilter: (f: string | null) => void;
  setToast: (toast: WorkspaceState['toast']) => void;
  setSaving: (saving: boolean) => void;
  setDecisions: (decisions: Record<string, 'aceptado' | 'rechazado'>) => void;

  openFindings: () => Finding[];
}

export const useWorkspace = create<WorkspaceState>((set, get) => ({
  text: '',
  analyzedText: '',
  analysis: null,
  decisions: {},
  edits: {},
  selectedReqId: null,
  severityFilter: null,
  toast: null,
  saving: false,

  setText: (text) => set({ text }),
  setAnalysis: (text, analysis) => set({ analyzedText: text, analysis }),
  setDecision: (key, status) => set((state) => {
    const next = { ...state.decisions };
    if (status === null) {
      delete next[key];
    } else {
      next[key] = status;
    }
    return { decisions: next };
  }),
  setEdit: (key, value) => set((state) => ({ edits: { ...state.edits, [key]: value } })),
  selectReq: (id) => set({ selectedReqId: id }),
  setSeverityFilter: (f) => set({ severityFilter: f }),
  setToast: (toast) => set({ toast }),
  setSaving: (saving) => set({ saving }),
  setDecisions: (decisions) => set({ decisions }),

  openFindings: () => {
    const { analysis, decisions } = get();
    if (!analysis) return [];
    return analysis.findings.filter((f) => decisions[f.key] !== 'rechazado');
  },
}));
