import { create } from 'zustand';

export interface TournamentFormData {
  // Step 1
  name: string;
  description: string;
  sport_id: string; // sport_id
  location: string;
  start_date: Date | null;
  end_date: Date | null;
  prize_first: string;
  prize_second: string;
  prize_third: string;

  // Step 2
  format: 'round_robin' | 'knockout' | 'group_knockout';
  max_teams: number;
  points_win: number;
  points_draw: number;
  points_loss: number;
  requires_approval: boolean;
  visibility: 'public' | 'invite_only';
}

interface TournamentStore {
  formData: TournamentFormData;
  setFormData: (data: Partial<TournamentFormData>) => void;
  resetForm: () => void;
}

const initialFormData: TournamentFormData = {
  name: '',
  description: '',
  sport_id: '',
  location: '',
  start_date: new Date(),
  end_date: new Date(),
  prize_first: '',
  prize_second: '',
  prize_third: '',

  format: 'round_robin',
  max_teams: 8,
  points_win: 3,
  points_draw: 1,
  points_loss: 0,
  requires_approval: false,
  visibility: 'public',
};

export const useTournamentStore = create<TournamentStore>((set) => ({
  formData: initialFormData,
  setFormData: (data) =>
    set((state) => ({ formData: { ...state.formData, ...data } })),
  resetForm: () => set({ formData: initialFormData }),
}));
