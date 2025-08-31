import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { dealApi } from '../../services/api';

interface Deal {
  id: string;
  projectId: string;
  creatorId: string;
  currency: string;
  amountTotal: number;
  state: 'DRAFT' | 'FUNDED' | 'RELEASED' | 'DISPUTED' | 'REFUNDED';
  acceptedAt?: string;
  fundedAt?: string;
  completedAt?: string;
  project: {
    id: string;
    title: string;
    description?: string;
    brand: {
      id: string;
      email: string;
      role: string;
    };
  };
  creator: {
    id: string;
    email: string;
    role: string;
  };
  milestones: Array<{
    id: string;
    title: string;
    description?: string;
    amount: number;
    dueAt?: string;
    state: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'RELEASED' | 'DISPUTED';
    submittedAt?: string;
    approvedAt?: string;
    releasedAt?: string;
  }>;
}

interface DealsState {
  deals: Deal[];
  currentDeal: Deal | null;
  loading: boolean;
  error: string | null;
}

const initialState: DealsState = {
  deals: [],
  currentDeal: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchDeals = createAsyncThunk(
  'deals/fetchDeals',
  async (params?: { state?: string; limit?: number; offset?: number }) => {
    const response = await dealApi.getDeals(params);
    return response.data;
  }
);

export const fetchDeal = createAsyncThunk(
  'deals/fetchDeal',
  async (dealId: string) => {
    const response = await dealApi.getDeal(dealId);
    return response.data;
  }
);

export const acceptDeal = createAsyncThunk(
  'deals/acceptDeal',
  async (dealId: string) => {
    const response = await dealApi.acceptDeal(dealId);
    return response.data;
  }
);

const dealSlice = createSlice({
  name: 'deals',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentDeal: (state) => {
      state.currentDeal = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch deals
      .addCase(fetchDeals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDeals.fulfilled, (state, action) => {
        state.loading = false;
        state.deals = action.payload.deals;
      })
      .addCase(fetchDeals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch deals';
      })
      // Fetch single deal
      .addCase(fetchDeal.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDeal.fulfilled, (state, action) => {
        state.loading = false;
        state.currentDeal = action.payload;
      })
      .addCase(fetchDeal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch deal';
      })
      // Accept deal
      .addCase(acceptDeal.fulfilled, (state, action) => {
        if (state.currentDeal?.id === action.payload.id) {
          state.currentDeal = action.payload;
        }
        // Update in deals list
        const index = state.deals.findIndex(deal => deal.id === action.payload.id);
        if (index !== -1) {
          state.deals[index] = action.payload;
        }
      });
  },
});

export const { clearError, clearCurrentDeal } = dealSlice.actions;
export default dealSlice.reducer;