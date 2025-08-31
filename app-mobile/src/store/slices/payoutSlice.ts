import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { payoutApi } from '../../services/api';

interface Payout {
  id: string;
  dealId: string;
  milestoneId?: string;
  provider: 'STRIPE' | 'MANGOPAY' | 'CRYPTO';
  providerRef: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELED';
  processedAt?: string;
  createdAt: string;
}

interface PayoutsState {
  payouts: Payout[];
  loading: boolean;
  error: string | null;
}

const initialState: PayoutsState = {
  payouts: [],
  loading: false,
  error: null,
};

export const fetchPayouts = createAsyncThunk(
  'payouts/fetchPayouts',
  async (params?: { status?: string; limit?: number; offset?: number }) => {
    const response = await payoutApi.getPayouts(params);
    return response.data;
  }
);

const payoutSlice = createSlice({
  name: 'payouts',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayouts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayouts.fulfilled, (state, action) => {
        state.loading = false;
        state.payouts = action.payload.payouts;
      })
      .addCase(fetchPayouts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch payouts';
      });
  },
});

export const { clearError } = payoutSlice.actions;
export default payoutSlice.reducer;