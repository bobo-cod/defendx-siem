
import { create } from 'zustand';

interface DateRange {
  from: Date;
  to: Date;
}

interface FiltersState {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedAgents: string[];
  setSelectedAgents: (agents: string[]) => void;
  toggleAgent: (agentId: string) => void;
  selectedSeverities: string[];
  setSelectedSeverities: (severities: string[]) => void;
  toggleSeverity: (severity: string) => void;
  selectedRules: string[];
  setSelectedRules: (rules: string[]) => void;
  resetFilters: () => void;
}

const initialDateRange = {
  from: new Date(Date.now() - 24 * 60 * 60 * 1000),
  to: new Date(),
};

export const useFiltersStore = create<FiltersState>((set) => ({
  dateRange: initialDateRange,
  searchQuery: '',
  selectedAgents: [],
  selectedSeverities: [],
  selectedRules: [],

  setDateRange: (range) => set({ dateRange: range }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedAgents: (agents) => set({ selectedAgents: agents }),

  toggleAgent: (agentId) =>
    set((state) => ({
      selectedAgents: state.selectedAgents.includes(agentId)
        ? state.selectedAgents.filter((id) => id !== agentId)
        : [...state.selectedAgents, agentId],
    })),

  setSelectedSeverities: (severities) =>
    set({ selectedSeverities: severities }),

  toggleSeverity: (severity) =>
    set((state) => ({
      selectedSeverities: state.selectedSeverities.includes(severity)
        ? state.selectedSeverities.filter((s) => s !== severity)
        : [...state.selectedSeverities, severity],
    })),

  setSelectedRules: (rules) => set({ selectedRules: rules }),

  resetFilters: () =>
    set({
      dateRange: initialDateRange,
      searchQuery: '',
      selectedAgents: [],
      selectedSeverities: [],
      selectedRules: [],
    }),
}));

